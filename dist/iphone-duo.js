'use client';

// src/IPhoneDuoViewer.tsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

// src/fold-viewer.js
import * as THREE from "three";
import { USDLoader } from "three/addons/loaders/USDLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// src/ui.js
async function loadDefaultUIs(baseUrl = "./assets") {
  const base = String(baseUrl).replace(/\/+$/, "");
  const images = Object.fromEntries(await Promise.all([
    "wallpaper-inner.avif",
    "clock-inner.avif",
    "clock-outer.avif",
    "launcher-inner.png",
    "launcher-outer.png"
  ].map(async (name) => {
    const image = new Image();
    image.src = `${base}/ui/${name}`;
    await image.decode();
    return [name, image];
  })));
  const themes = { wallpaper: {}, launcher: {} };
  const innerWidth = 1600;
  for (const [theme, screens] of Object.entries(themes)) {
    for (const kind of ["inner", "outer"]) {
      const canvas = document.createElement("canvas");
      canvas.width = kind === "inner" ? innerWidth : 774;
      canvas.height = 1125;
      const context = canvas.getContext("2d");
      if (theme === "wallpaper") {
        context.drawImage(images["wallpaper-inner.avif"], canvas.width - innerWidth, 0, innerWidth, canvas.height);
        context.drawImage(images[`clock-${kind}.avif`], 0, 0, canvas.width, canvas.height);
      } else {
        const crop = kind === "inner" ? [22, 22, 1072, 754] : [28, 16, 510, 742];
        context.drawImage(images[`launcher-${kind}.png`], ...crop, 0, 0, canvas.width, canvas.height);
      }
      screens[kind] = canvas;
    }
  }
  return themes;
}

// src/fold-viewer.js
var SUPPORTED_THEMES = ["wallpaper", "launcher"];
var SCREEN_SHADER = `
uniform float foldAngle;
uniform vec2 uiPixel;
uniform vec4 uiFrame;
uniform vec2 uiGradient;
uniform vec3 uiReferenceEye;
varying vec3 vUIPosition;
vec3 screenColor() {
  // Intersect the fixed front-view ray with the unfolded inner-screen plane.
  float depth = (0.24948 - uiReferenceEye.z) / (vUIPosition.z - uiReferenceEye.z);
  vec2 projected = uiReferenceEye.xy + (vUIPosition.xy - uiReferenceEye.xy) * depth;
  vec2 sourceUV = (projected - uiFrame.xy) / uiFrame.zw;
  #ifdef INNER_UI
    float progress = clamp(foldAngle / 1.570796327, 0.0, 1.0);
  #else
    // Anchor the image to the projected hinge-side edge of the outer screen.
    float c = cos(foldAngle), s = sin(foldAngle);
    vec2 hingeEdge = vec2(-0.23396, -0.27463 - 0.275454);
    vec2 foldedEdge = vec2(c * hingeEdge.x + s * hingeEdge.y,
      -s * hingeEdge.x + c * hingeEdge.y + 0.275454);
    float edgeDepth = (0.24948 - uiReferenceEye.z) / (foldedEdge.y - uiReferenceEye.z);
    float anchorX = uiReferenceEye.x + (foldedEdge.x - uiReferenceEye.x) * edgeDepth;
    sourceUV.x = uiGradient.x + (projected.x - anchorX) / uiFrame.z;
    float progress = clamp((3.141592654 - foldAngle) / 1.570796327, 0.0, 1.0);
  #endif
  float edge = (sourceUV.x - uiGradient.x) / (uiGradient.y - uiGradient.x);
  float motion = smoothstep(0.0, 1.0, progress);
  float blurGradient = clamp(edge, 0.0, 1.0);
  float darkenGradient = clamp((edge - 0.2) / 0.8, 0.0, 1.0);
  float effect = motion * pow(darkenGradient, 1.35);
  float radius = 72.0 * motion * pow(blurGradient, 1.35);
  vec2 aa = max(fwidth(sourceUV), uiPixel * 0.5);
  vec2 dx = dFdx(sourceUV) / uiPixel;
  vec2 dy = dFdy(sourceUV) / uiPixel;
  float baseLod = log2(max(1.0, max(length(dx), length(dy))));
  vec2 coverage = smoothstep(-aa, aa, sourceUV)
    * (1.0 - smoothstep(vec2(1.0) - aa, vec2(1.0) + aa, sourceUV));
  vec3 color = textureLod(map, clamp(sourceUV, vec2(0.0), vec2(1.0)), baseLod).rgb * coverage.x * coverage.y;
  if (radius > 0.0) {
    // Use the same mip level at zero blur, then increase it continuously.
    float lod = max(baseLod, log2(max(1.0, radius)));
    vec2 footprint = max(aa, uiPixel * radius * 0.75);
    color = vec3(0.0);
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        float wx = x == 0 ? 6.0 : (abs(x) == 1 ? 4.0 : 1.0);
        float wy = y == 0 ? 6.0 : (abs(y) == 1 ? 4.0 : 1.0);
        vec2 sampleUV = sourceUV + vec2(float(x), float(y)) * uiPixel * radius;
        // Blur the image and its coverage together so color spreads into the black margin.
        vec2 coverage = smoothstep(-footprint, footprint, sampleUV)
          * (1.0 - smoothstep(vec2(1.0) - footprint, vec2(1.0) + footprint, sampleUV));
        color += textureLod(map, clamp(sampleUV, vec2(0.0), vec2(1.0)), lod).rgb
          * coverage.x * coverage.y * wx * wy / 256.0;
      }
    }
  }
  return color * (1.0 - min(1.0, effect * 2.0));
}
`;
var FOLD_SHADER = `
uniform float foldAngle;
vec2 rotateHinge(vec2 p) {
  float c = cos(foldAngle), s = sin(foldAngle);
  p.y -= 0.275454;
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y + 0.275454);
}
#ifdef FLEXIBLE_SCREEN
vec4 bendStrip(vec3 p) {
  float halfWidth = 0.35;
  if (p.x >= halfWidth) return vec4(p.x, p.z, 1.0, 0.0);
  if (p.x <= -halfWidth) return vec4(rotateHinge(p.xz), cos(foldAngle), -sin(foldAngle));
  float t = (p.x + halfWidth) / (2.0 * halfWidth);
  float t2 = t*t, t3 = t2*t;
  vec2 a = rotateHinge(vec2(-halfWidth, p.z));
  vec2 b = vec2(halfWidth, p.z);
  vec2 ta = 2.0 * halfWidth * vec2(cos(foldAngle), -sin(foldAngle));
  vec2 tb = vec2(2.0 * halfWidth, 0.0);
  vec2 point = (2.0*t3-3.0*t2+1.0)*a + (t3-2.0*t2+t)*ta + (-2.0*t3+3.0*t2)*b + (t3-t2)*tb;
  vec2 tangent = normalize((6.0*t2-6.0*t)*a + (3.0*t2-4.0*t+1.0)*ta + (-6.0*t2+6.0*t)*b + (3.0*t2-2.0*t)*tb);
  return vec4(point, tangent);
}
#endif
`;
var INNER_UI_FRAME = new THREE.Vector4(-7.89935, 0.34562 - 5.8974, 15.7987, 11.1035);
var OUTER_UI_FRAME = new THREE.Vector4(0.23396, 0.27173 - 5.8974, 7.73936, 11.2513);
var UI_REFERENCE_EYE = new THREE.Vector3(0, 0, 40);
var clampAngle = (value) => Math.min(180, Math.max(0, value));
var trimBase = (base) => String(base || "./assets").replace(/\/+$/, "");
var prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function createFoldViewer({
  container,
  assetsBase = "./assets",
  modelUrl,
  initialTheme = "wallpaper",
  initialAngle = 180,
  initialImages,
  autoPlay = false,
  respectReducedMotion = true,
  onReady,
  onError,
  onAngleChange,
  onPlayingChange,
  onThemeChange,
  onFoldEnd
} = {}) {
  if (!container || container.nodeType !== 1) {
    throw new TypeError("createFoldViewer: a container element is required.");
  }
  const requestedAngle = Number(initialAngle);
  let angle = clampAngle(Number.isFinite(requestedAngle) ? requestedAngle : 180);
  let uiTheme = SUPPORTED_THEMES.includes(initialTheme) ? initialTheme : "wallpaper";
  let ready = false;
  let disposed = false;
  let playing = false;
  let phase = 0;
  let transition = null;
  let lastTime = performance.now();
  const bend = { value: (180 - angle) / 180 * Math.PI };
  const phone = new THREE.Group();
  const screens = {};
  const ownedMaterials = /* @__PURE__ */ new Set();
  const base = trimBase(assetsBase);
  const sourceUrl = modelUrl || `${base}/iPhone_Duo_Render.usdc`;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 250);
  camera.position.set(0, 0, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(16185075, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.appendChild(renderer.domElement);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  environment.dispose();
  pmrem.dispose();
  scene.environmentIntensity = 1.35;
  scene.add(new THREE.HemisphereLight(16777215, 11909800, 1.8));
  const keyLight = new THREE.DirectionalLight(16776437, 2.6);
  keyLight.position.set(-15, 25, 30);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(15265269, 2);
  rimLight.position.set(15, 5, -15);
  scene.add(rimLight);
  scene.add(phone);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 21;
  controls.maxDistance = 65;
  controls.target.set(0, 0, 0.275454);
  controls.update();
  const outerFrame = OUTER_UI_FRAME.clone().multiplyScalar((UI_REFERENCE_EYE.z - 0.24948) / (UI_REFERENCE_EYE.z - 0.825538));
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const screenOverrides = { inner: null, outer: null };
  let imageRevision = 0;
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const pixelsPerUnit = Math.min(width / 25, height / 17, 37);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / pixelsPerUnit / 2 / 40));
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  function applyAngle(value, emit = true) {
    angle = clampAngle(value);
    bend.value = (180 - angle) / 180 * Math.PI;
    const cos = Math.cos(bend.value);
    const half = INNER_UI_FRAME.z / 2;
    phone.position.x = -(Math.min(0, -half * cos) + Math.max(half, -half * cos)) / 2;
    screens.outer?.material.color.setScalar(angle >= 180 ? 0 : 1);
    if (emit) onAngleChange?.(angle);
  }
  function cancelTransition() {
    const pending = transition;
    transition = null;
    pending?.resolve?.(angle);
  }
  function setPlaying(value) {
    playing = Boolean(value);
    onPlayingChange?.(playing);
  }
  function play() {
    if (!ready || playing) return;
    cancelTransition();
    phase = 1.2 + Math.acos(Math.min(1, Math.max(-1, 2 * angle / 180 - 1))) / Math.PI * 3.1;
    setPlaying(true);
  }
  function pause() {
    if (!playing) return;
    setPlaying(false);
  }
  function toggle() {
    if (playing) pause();
    else play();
  }
  function setAngle(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    const pending = transition;
    transition = null;
    applyAngle(next);
    pending?.resolve?.(angle);
  }
  function foldTo(value, { duration = 1.4 } = {}) {
    const next = Number(value);
    if (!Number.isFinite(next)) return Promise.resolve(angle);
    const target = clampAngle(next);
    if (!ready || duration <= 0 || Math.abs(target - angle) < 0.01) {
      if (ready) setAngle(target);
      return Promise.resolve(angle);
    }
    cancelTransition();
    return new Promise((resolve) => {
      transition = { from: angle, to: target, elapsed: 0, duration, resolve };
    });
  }
  function applyScreenAppearance(kind) {
    const screen = screens[kind];
    if (!screen) return;
    const override = screenOverrides[kind];
    const texture = override ? override.texture : screen.defaultTextures[uiTheme];
    screen.material.map = texture;
    screen.pixel.value.set(1 / texture.image.width, 1 / texture.image.height);
    screen.frame.value.copy(kind === "inner" ? INNER_UI_FRAME : outerFrame);
    screen.gradient.value.set(kind === "inner" ? 0.5 : 0, kind === "inner" ? 0 : 1);
  }
  function applyDefaultTheme() {
    for (const kind of Object.keys(screens)) applyScreenAppearance(kind);
  }
  function setTheme(name) {
    if (!SUPPORTED_THEMES.includes(name)) {
      throw new Error(`Unknown screen UI theme "${name}". Use one of: ${SUPPORTED_THEMES.join(", ")}.`);
    }
    if (!screens.inner || name === uiTheme) return;
    uiTheme = name;
    applyDefaultTheme();
    onThemeChange?.(uiTheme);
  }
  function loadImageSource(source) {
    let image = source;
    let objectUrl = null;
    if (typeof source === "string") {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.src = source;
    } else if (typeof Blob !== "undefined" && source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      image = new Image();
      image.src = objectUrl;
    }
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };
    if (typeof image.decode !== "function") return Promise.resolve({ image, cleanup });
    return image.decode().then(() => ({ image, cleanup }), (error) => {
      cleanup();
      throw error;
    });
  }
  function createScreenTexture(image, kind) {
    const reference = screens[kind].defaultTextures[uiTheme].image;
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) throw new Error("Unable to read this image.");
    const canvas = document.createElement("canvas");
    canvas.width = reference.width;
    canvas.height = reference.height;
    const context = canvas.getContext("2d");
    const scale = Math.max(canvas.width / width, canvas.height / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    context.drawImage(
      image,
      (canvas.width - drawWidth) / 2,
      (canvas.height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    try {
      context.getImageData(0, 0, 1, 1);
    } catch {
      throw new Error("This image is cross-origin without CORS headers, so it cannot be used as a texture.");
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    return texture;
  }
  async function setScreenImages(sources, { open = false } = {}) {
    if (!sources || typeof sources !== "object") {
      throw new TypeError("setScreenImages: pass an object with inner and/or outer sources.");
    }
    if (!screens.inner) throw new Error("The model is still loading.");
    const kinds = ["inner", "outer"].filter((kind) => Object.prototype.hasOwnProperty.call(sources, kind));
    if (!kinds.length) return;
    const revision = ++imageRevision;
    const results = await Promise.allSettled(kinds.map(async (kind) => {
      const source = sources[kind];
      if (!source) return { kind, image: null, cleanup: null };
      const loaded = await loadImageSource(source);
      return { kind, ...loaded };
    }));
    const prepared = [];
    let committed = false;
    try {
      const failure = results.find((result) => result.status === "rejected");
      if (failure) throw failure.reason;
      if (disposed || revision !== imageRevision) return;
      for (const result of results) {
        const { kind, image } = result.value;
        prepared.push({ kind, texture: image ? createScreenTexture(image, kind) : null });
      }
      if (disposed || revision !== imageRevision) return;
      for (const { kind, texture } of prepared) {
        screenOverrides[kind]?.texture.dispose();
        screenOverrides[kind] = texture ? { texture } : null;
        applyScreenAppearance(kind);
      }
      committed = true;
    } finally {
      for (const result of results) {
        if (result.status === "fulfilled") result.value.cleanup?.();
      }
      if (!committed) {
        for (const { texture } of prepared) texture?.dispose();
      }
    }
    if (committed && open) {
      setPlaying(false);
      transition = { from: angle, to: 180, elapsed: 0, duration: 1.4 };
    }
  }
  function setScreenImage(source, { screen = "both", open = true } = {}) {
    if (!source) throw new Error("setScreenImage: an image source is required.");
    if (!["inner", "outer", "both"].includes(screen)) {
      throw new Error(`Unknown screen "${screen}". Use "inner", "outer", or "both".`);
    }
    return setScreenImages(
      screen === "both" ? { inner: source, outer: source } : { [screen]: source },
      { open }
    );
  }
  function clearScreenImages(screen = "both") {
    if (!["inner", "outer", "both"].includes(screen)) {
      throw new Error(`Unknown screen "${screen}". Use "inner", "outer", or "both".`);
    }
    return setScreenImages(
      screen === "both" ? { inner: null, outer: null } : { [screen]: null }
    );
  }
  function setCustomImage(file) {
    return setScreenImage(file);
  }
  function buildScreens(defaultUIs) {
    for (const kind of ["inner", "outer"]) {
      const defaultTextures = {};
      for (const [theme, canvases] of Object.entries(defaultUIs)) {
        const texture = new THREE.CanvasTexture(canvases[kind]);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        defaultTextures[theme] = texture;
      }
      const material = new THREE.MeshBasicMaterial({ map: defaultTextures[uiTheme], toneMapped: false });
      screens[kind] = {
        material,
        defaultTextures,
        frame: { value: (kind === "inner" ? INNER_UI_FRAME : outerFrame).clone() },
        gradient: { value: new THREE.Vector2(kind === "inner" ? 0.5 : 0, kind === "inner" ? 0 : 1) },
        pixel: { value: new THREE.Vector2(1 / defaultUIs[uiTheme][kind].width, 1 / defaultUIs[uiTheme][kind].height) }
      };
    }
  }
  function buildPhone(model) {
    model.scale.multiplyScalar(100);
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      if (!object.isMesh) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      geometry.translate(0, -5.8974, 0);
      let ancestor = object;
      while (ancestor && !["upTUAKvMVkPOMKq", "SiftyleUEEZwLhF"].includes(ancestor.name)) ancestor = ancestor.parent;
      const moving = ancestor?.name === "upTUAKvMVkPOMKq";
      const flexible = ["JnJdTkxbQgUtLwU", "xdyyaajWsatVNxN", "UXtsBZYlaUvHoEh", "MvKPXGSdYDVvSpk"].includes(object.name);
      const kind = object.name === "UXtsBZYlaUvHoEh" ? "inner" : object.name === "hhgAIoCGsHXeDPY" ? "outer" : null;
      const material = kind ? screens[kind].material : object.material.clone();
      if (kind) {
        const p = geometry.attributes.position;
        const uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          uv[i * 2] = kind === "inner" ? (p.getX(i) + 7.89935) / 15.7987 : (-0.23396 - p.getX(i)) / 7.73936;
          uv[i * 2 + 1] = kind === "inner" ? (p.getY(i) + 5.8974 - 0.34562) / 11.1035 : (p.getY(i) + 5.8974 - 0.27173) / 11.2513;
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      } else {
        ownedMaterials.add(material);
      }
      if (moving || flexible) {
        material.onBeforeCompile = (shader) => {
          shader.uniforms.foldAngle = bend;
          if (kind) {
            shader.uniforms.uiFrame = screens[kind].frame;
            shader.uniforms.uiGradient = screens[kind].gradient;
            shader.uniforms.uiReferenceEye = { value: UI_REFERENCE_EYE };
            shader.uniforms.uiPixel = screens[kind].pixel;
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_pars_fragment>", `
              #include <map_pars_fragment>
              ${kind === "inner" ? "#define INNER_UI" : ""}
              ${SCREEN_SHADER}
            `).replace("#include <map_fragment>", "diffuseColor.rgb *= screenColor();");
            shader.vertexShader = `varying vec3 vUIPosition;
${shader.vertexShader}`;
            shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
              vUIPosition = transformed;
              #include <project_vertex>
            `);
          }
          shader.vertexShader = `${flexible ? "#define FLEXIBLE_SCREEN\n" : ""}${FOLD_SHADER}
${shader.vertexShader}`;
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", flexible ? `
            vec4 folded = bendStrip(position);
            vec3 transformed = vec3(folded.x, position.y, folded.y);
          ` : `
            vec2 folded = rotateHinge(position.xz);
            vec3 transformed = vec3(folded.x, position.y, folded.y);
          `);
          shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", `
            vec3 objectNormal = vec3(normal);
            ${flexible ? "vec4 strip = bendStrip(position); float a = atan(-strip.w, strip.z);" : "float a = foldAngle;"}
            objectNormal.x = cos(a) * normal.x + sin(a) * normal.z;
            objectNormal.z = -sin(a) * normal.x + cos(a) * normal.z;
          `);
        };
        material.customProgramCacheKey = () => `${flexible ? "fold-flexible" : "fold-cover"}-${kind || "body"}`;
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = object.name;
      mesh.frustumCulled = false;
      phone.add(mesh);
    });
  }
  async function init() {
    const defaultUIs = await loadDefaultUIs(base);
    if (disposed) return;
    buildScreens(defaultUIs);
    const model = await new USDLoader().loadAsync(sourceUrl);
    if (disposed) {
      model.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material?.dispose?.();
        }
      });
      return;
    }
    buildPhone(model);
    applyDefaultTheme();
    if (initialImages) {
      await setScreenImages(initialImages).catch(() => {
      });
    }
    if (disposed) return;
    applyAngle(angle, false);
    ready = true;
    onAngleChange?.(angle);
    onThemeChange?.(uiTheme);
    if (autoPlay && !(respectReducedMotion && prefersReducedMotion())) setPlaying(true);
    onReady?.();
  }
  const readyPromise = init().catch((error) => {
    if (!disposed) onError?.(error);
    throw error;
  });
  readyPromise.catch(() => {
  });
  renderer.setAnimationLoop((now) => {
    const delta = Math.min((now - lastTime) / 1e3, 0.05);
    lastTime = now;
    if (ready && playing) {
      phase = (phase + delta) % 8.6;
      let value;
      if (phase < 1.2) value = 180;
      else if (phase < 4.3) value = 90 * (1 + Math.cos((phase - 1.2) / 3.1 * Math.PI));
      else if (phase < 5.5) value = 0;
      else value = 90 * (1 - Math.cos((phase - 5.5) / 3.1 * Math.PI));
      applyAngle(value);
    } else if (transition) {
      transition.elapsed += delta;
      const { duration, resolve } = transition;
      const progress = Math.min(transition.elapsed / duration, 1);
      const ease = progress * progress * (3 - 2 * progress);
      applyAngle(THREE.MathUtils.lerp(transition.from, transition.to, ease));
      if (progress === 1) {
        const target = transition.to;
        transition = null;
        setAngle(target);
        resolve?.(target);
        onFoldEnd?.(target);
      }
    }
    controls.update();
    renderer.render(scene, camera);
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    ready = false;
    playing = false;
    cancelTransition();
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    controls.dispose();
    imageRevision += 1;
    for (const override of Object.values(screenOverrides)) override?.texture.dispose();
    screenOverrides.inner = null;
    screenOverrides.outer = null;
    for (const screen of Object.values(screens)) {
      for (const texture of Object.values(screen.defaultTextures)) texture.dispose();
      screen.material.dispose();
    }
    for (const material of ownedMaterials) material.dispose();
    phone.traverse((object) => {
      if (object.isMesh) object.geometry.dispose();
    });
    phone.clear();
    environmentTarget.dispose();
    scene.environment = null;
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss?.();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  }
  return {
    ready: readyPromise,
    play,
    pause,
    toggle,
    setAngle,
    foldTo,
    getAngle: () => angle,
    isPlaying: () => playing,
    isReady: () => ready,
    getTheme: () => uiTheme,
    setTheme,
    setScreenImage,
    setScreenImages,
    clearScreenImages,
    setCustomImage,
    resize,
    dispose
  };
}

// src/IPhoneDuoViewer.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_LABELS = {
  closed: "Closed",
  open: "Open",
  foldState: "Fold state",
  loading: "Loading preview\u2026",
  loadError: "Unable to load the preview.",
  retry: "Try again",
  imageError: "Unable to use this image.",
  viewport: "iPhone Duo fold preview. Drag to rotate, scroll to zoom."
};
var ClosedIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: /* @__PURE__ */ jsx("rect", { x: "7.5", y: "2.5", width: "9", height: "19", rx: "2.5" }) });
var OpenIcon = () => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: [
  /* @__PURE__ */ jsx("rect", { x: "2.5", y: "5", width: "8.6", height: "14", rx: "2" }),
  /* @__PURE__ */ jsx("rect", { x: "13.4", y: "5", width: "8.6", height: "14", rx: "2" })
] });
var IPhoneDuoViewer = forwardRef(
  function IPhoneDuoViewer2({
    assetsBase = "./assets",
    modelUrl,
    open: openProp,
    defaultOpen = true,
    duration = 1.4,
    theme = "wallpaper",
    image = null,
    closedImage = null,
    openImage = null,
    labels,
    className = "",
    style,
    onReady,
    onError,
    onOpenChange,
    onFoldEnd
  }, ref) {
    const viewportRef = useRef(null);
    const viewerRef = useRef(null);
    const [openState, setOpenState] = useState(Boolean(defaultOpen));
    const controlled = openProp !== void 0;
    const isOpen = controlled ? Boolean(openProp) : openState;
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const text = { ...DEFAULT_LABELS, ...labels };
    const callbacksRef = useRef({ onReady, onError, onOpenChange, onFoldEnd });
    const textRef = useRef(text);
    const stateRef = useRef({ isOpen, controlled, duration });
    callbacksRef.current = { onReady, onError, onOpenChange, onFoldEnd };
    textRef.current = text;
    stateRef.current = { isOpen, controlled, duration };
    const initialRef = useRef({
      open: openProp === void 0 ? Boolean(defaultOpen) : Boolean(openProp),
      theme: SUPPORTED_THEMES.includes(theme) ? theme : "wallpaper"
    });
    const innerSource = openImage ?? image;
    const outerSource = closedImage ?? image;
    useEffect(() => {
      const container = viewportRef.current;
      if (!container) return void 0;
      setReady(false);
      setLoadError(null);
      setImageError(null);
      let cancelled = false;
      let viewer;
      try {
        viewer = createFoldViewer({
          container,
          assetsBase,
          modelUrl,
          initialTheme: initialRef.current.theme,
          initialAngle: initialRef.current.open ? 180 : 0,
          initialImages: innerSource || outerSource ? { inner: innerSource, outer: outerSource } : void 0,
          onReady() {
            if (cancelled) return;
            setReady(true);
            callbacksRef.current.onReady?.();
          },
          onError(error) {
            if (cancelled) return;
            setLoadError(error || new Error(DEFAULT_LABELS.loadError));
            callbacksRef.current.onError?.(error);
          },
          onFoldEnd(angle) {
            if (!cancelled) callbacksRef.current.onFoldEnd?.(angle);
          }
        });
      } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error));
        setLoadError(failure);
        callbacksRef.current.onError?.(failure);
        return void 0;
      }
      viewerRef.current = viewer;
      return () => {
        cancelled = true;
        viewerRef.current = null;
        viewer.dispose();
      };
    }, [assetsBase, modelUrl, reloadToken]);
    useEffect(() => {
      if (!ready) return;
      viewerRef.current?.foldTo(isOpen ? 180 : 0, { duration });
    }, [ready, isOpen, duration]);
    useEffect(() => {
      if (!ready || !SUPPORTED_THEMES.includes(theme)) return;
      try {
        viewerRef.current?.setTheme(theme);
      } catch (error) {
        callbacksRef.current.onError?.(error);
      }
    }, [ready, theme]);
    useEffect(() => {
      if (!ready) return;
      const viewer = viewerRef.current;
      if (!viewer) return;
      setImageError(null);
      if (!innerSource && !outerSource) {
        viewer.clearScreenImages().catch((error) => callbacksRef.current.onError?.(error));
        return;
      }
      viewer.setScreenImages({ inner: innerSource, outer: outerSource }).catch((error) => {
        setImageError(textRef.current.imageError);
        callbacksRef.current.onError?.(error);
      });
    }, [ready, innerSource, outerSource]);
    const setOpen = useCallback((next, { animate = true } = {}) => {
      const value = Boolean(next);
      const viewer = viewerRef.current;
      if (!viewer || !viewer.isReady() || value === stateRef.current.isOpen) {
        return Promise.resolve(viewer?.getAngle() ?? 0);
      }
      if (!stateRef.current.controlled) setOpenState(value);
      callbacksRef.current.onOpenChange?.(value);
      if (!animate) {
        viewer.setAngle(value ? 180 : 0);
        return Promise.resolve(viewer.getAngle());
      }
      return viewer.foldTo(value ? 180 : 0, { duration: stateRef.current.duration });
    }, []);
    useImperativeHandle(ref, () => ({
      open: (options) => setOpen(true, options),
      close: (options) => setOpen(false, options),
      toggle: (options) => setOpen(!stateRef.current.isOpen, options),
      setOpen,
      setAngle: (value) => viewerRef.current?.setAngle(value),
      getAngle: () => viewerRef.current?.getAngle() ?? 0,
      setTheme: (name) => viewerRef.current?.setTheme(name),
      setImage: (source) => viewerRef.current?.setScreenImage(source, { open: false }),
      setScreenImage: (source, options) => viewerRef.current?.setScreenImage(source, options),
      setScreenImages: (sources, options) => viewerRef.current?.setScreenImages(sources, options),
      resize: () => viewerRef.current?.resize(),
      getViewer: () => viewerRef.current
    }), [setOpen]);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: `idv${className ? ` ${className}` : ""}`,
        style,
        "data-ready": ready ? "true" : "false",
        "data-open": isOpen ? "true" : "false",
        children: [
          /* @__PURE__ */ jsx("div", { ref: viewportRef, className: "idv-viewport", role: "img", "aria-label": text.viewport }),
          !ready && !loadError && /* @__PURE__ */ jsx("p", { className: "idv-status", role: "status", children: text.loading }),
          loadError && /* @__PURE__ */ jsxs("div", { className: "idv-error", role: "alert", children: [
            /* @__PURE__ */ jsx("p", { children: text.loadError }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setReloadToken((token) => token + 1), children: text.retry })
          ] }),
          imageError && !loadError && /* @__PURE__ */ jsx("p", { className: "idv-notice", role: "status", children: imageError }),
          /* @__PURE__ */ jsxs("div", { className: "idv-toggle", role: "group", "aria-label": text.foldState, children: [
            /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": !isOpen, disabled: !ready, onClick: () => {
              setOpen(false);
            }, children: [
              /* @__PURE__ */ jsx(ClosedIcon, {}),
              /* @__PURE__ */ jsx("span", { children: text.closed })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": isOpen, disabled: !ready, onClick: () => {
              setOpen(true);
            }, children: [
              /* @__PURE__ */ jsx(OpenIcon, {}),
              /* @__PURE__ */ jsx("span", { children: text.open })
            ] })
          ] })
        ]
      }
    );
  }
);
var IPhoneDuoViewer_default = IPhoneDuoViewer;
export {
  IPhoneDuoViewer_default as IPhoneDuoViewer,
  SUPPORTED_THEMES,
  createFoldViewer,
  IPhoneDuoViewer_default as default
};
