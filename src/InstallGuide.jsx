import { useEffect, useRef, useState } from 'react';
import IPhoneDuoViewer from './IPhoneDuoViewer';

const GITHUB_URL = 'https://github.com/Amitgajare2/iphoneduo';
const SITE_URL = 'https://iphoneduoui.netlify.app';
const REGISTRY_URL = `${SITE_URL}/r/iphone-duo.json`;

const ARTWORK = {
  closed: './assets/ui/wallpaper-closed.avif',
  open: './assets/ui/wallpaper-open.avif',
};

const SHADCN_COMMAND = `npx shadcn@latest add ${REGISTRY_URL}`;

const APP_ROUTER = `'use client';

import IPhoneDuoViewer from '@/components/iphone-duo/IPhoneDuoViewer';

export default function Hero() {
  return (
    <section style={{ height: '100dvh' }}>
      <IPhoneDuoViewer
        assetsBase="/iphone-duo"
        closedImage="/iphone-duo/ui/wallpaper-closed.avif"
        openImage="/iphone-duo/ui/wallpaper-open.avif"
      />
    </section>
  );
}`;

const PAGES_ROUTER = `import dynamic from 'next/dynamic';

const IPhoneDuoViewer = dynamic(
  () => import('@/components/iphone-duo/IPhoneDuoViewer'),
  {
    ssr: false,
    loading: () => <div style={{ height: '100dvh' }} />,
  },
);

export default function Home() {
  return (
    <main style={{ height: '100dvh' }}>
      <IPhoneDuoViewer assetsBase="/iphone-duo" defaultOpen />
    </main>
  );
}`;

const VITE = `import IPhoneDuoViewer from './components/iphone-duo/IPhoneDuoViewer';

export default function App() {
  return (
    <main style={{ height: '100dvh' }}>
      <IPhoneDuoViewer
        assetsBase="/iphone-duo"
        closedImage="/iphone-duo/ui/wallpaper-closed.avif"
        openImage="/iphone-duo/ui/wallpaper-open.avif"
      />
    </main>
  );
}`;

const REF_EXAMPLE = `const viewer = useRef(null);

<IPhoneDuoViewer ref={viewer} defaultOpen={false} />

viewer.current.open();
viewer.current.setAngle(90);
viewer.current.setScreenImages({
  inner: '/artwork/open.png',
  outer: '/artwork/closed.png',
});`;

const STYLE_EXAMPLE = `.hero-viewer .idv-toggle {
  right: auto;
  left: 24px;
}`;

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'install', label: 'Install' },
  { id: 'props', label: 'Props' },
  { id: 'api', label: 'API' },
  { id: 'styling', label: 'Styling' },
  { id: 'troubleshooting', label: 'Support' },
];

const FEATURES = [
  {
    title: 'Two screens, two images',
    body: 'The cover screen shows closedImage while the device is shut; the inner display shows openImage once it unfolds. Both remain visible during the fold.',
  },
  {
    title: 'A real fold, not a crossfade',
    body: 'Only the cover half rotates. Screen content stays projected to the front view, with blur and darkening following the image coordinates.',
  },
  {
    title: 'Native to your stack',
    body: 'Ships as TSX with scoped CSS and a typed ref. Works in the Next.js App Router, the Pages Router, and Vite. No Tailwind required.',
  },
];

const PROPS = [
  ['assetsBase', 'string', './assets', 'Folder containing the model and ui/ layouts.'],
  ['modelUrl', 'string', '—', 'Explicit model URL; overrides assetsBase.'],
  ['open', 'boolean', '—', 'Controlled fold state. Pair with onOpenChange.'],
  ['defaultOpen', 'boolean', 'true', 'Initial fold state when uncontrolled.'],
  ['duration', 'number', '1.4', 'Fold animation in seconds. 0 is instant.'],
  ['theme', "'wallpaper' | 'launcher'", "'wallpaper'", 'Default layout for screens without artwork.'],
  ['closedImage', 'string | File | Blob | element', 'null', 'Cover-screen artwork, seen while closed.'],
  ['openImage', 'string | File | Blob | element', 'null', 'Inner-display artwork, seen while open.'],
  ['image', 'string | File | Blob | element', 'null', 'One source applied to both screens.'],
  ['labels', 'object', '—', 'Override the built-in copy and aria labels.'],
  ['className', 'string', "''", 'Extra class on the root element.'],
  ['style', 'CSSProperties', '—', 'Inline styles on the root element.'],
  ['onReady', '() => void', '—', 'Model and initial artwork are ready.'],
  ['onError', '(error) => void', '—', 'Model, theme, or artwork failure.'],
  ['onOpenChange', '(open) => void', '—', 'Fires when the user requests a fold change.'],
  ['onFoldEnd', '(angle) => void', '—', 'Fires when a fold animation settles.'],
];

const API = [
  ['open(options?)', 'Fold open. { animate: false } is instant.'],
  ['close(options?)', 'Fold closed.'],
  ['toggle(options?)', 'Flip the current state.'],
  ['setOpen(open, options?)', 'Set the fold state explicitly.'],
  ['setAngle(value)', 'Any angle from 0 (closed) to 180 (open).'],
  ['getAngle()', 'Current fold angle.'],
  ['setTheme(name)', 'Switch the default layout for unassigned screens.'],
  ['setImage(source)', 'Apply one image to both screens.'],
  ['setScreenImage(source, options?)', 'Apply to screen: inner, outer, or both.'],
  ['setScreenImages({ inner, outer })', 'Per-screen artwork; null restores the theme.'],
  ['resize()', 'Recalculate after a manual layout change.'],
  ['getViewer()', 'Raw engine API for advanced use.'],
];

const TROUBLES = [
  [
    'Nothing renders, or the area is blank',
    'The parent has no height. Give the wrapper an explicit height such as 100dvh, a fixed pixel value, or an aspect-ratio box. The canvas fills its parent.',
  ],
  [
    'Styles are missing',
    'The installed component imports its own stylesheet. Check that your bundler handles CSS imports. In the Next.js Pages Router, move the import to pages/_app.jsx.',
  ],
  [
    '“Unable to load the preview”',
    'Check assetsBase. Open /iphone-duo/iPhone_Duo_Render.usdc directly; it should download. The model loads textures relative to its own URL, so keep the textures/ folder beside it.',
  ],
  [
    '“window is not defined” during build',
    'Render on the client. Use the Pages Router dynamic import shown above, or keep the page a client component in the App Router.',
  ],
  [
    'Can’t resolve three/addons/…',
    'Install three@0.160 or newer. Older releases do not expose the addons subpath used by USDLoader and OrbitControls.',
  ],
  [
    'An image shows the inline notice',
    'The image is cross-origin without CORS headers. The engine draws artwork into a canvas texture, so the host must send Access-Control-Allow-Origin, or serve the file from public/.',
  ],
  [
    'AVIF artwork fails in an older browser',
    'Use PNG, JPEG, or WebP for closedImage and openImage. The prepared demo assets use AVIF.',
  ],
  [
    'The model loads but the screen is black',
    'The viewer needs WebGL 2. Check the browser’s hardware acceleration and WebGL support.',
  ],
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-9999px';
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand('copy');
        area.remove();
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className="code-copy"
      data-copied={copied ? 'true' : 'false'}
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      title={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m5 13 4 4 10-10" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        </svg>
      )}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function CodeBlock({ label, code, compact = false }) {
  return (
    <div className={`code${compact ? ' code--compact' : ''}`}>
      <div className="code-head">
        <span className="code-label">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-pre" tabIndex={0} aria-label={`${label} code`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Tabs({ name, label, tabs }) {
  const [index, setIndex] = useState(0);
  const current = tabs[index];

  function onKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + direction + tabs.length) % tabs.length;
    setIndex(next);
    document.getElementById(`${name}-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <div className="tabs">
      <div className="tablist" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={`${name}-tab-${tab.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={i === index}
            aria-controls={`${name}-panel-${tab.id}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => setIndex(i)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current.note ? <p className="tab-note">{current.note}</p> : null}
      <div
        id={`${name}-panel-${current.id}`}
        className="tabpanel"
        role="tabpanel"
        aria-labelledby={`${name}-tab-${current.id}`}
        tabIndex={0}
      >
        <CodeBlock label={current.file} code={current.code} />
      </div>
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m9 5 7 7-7 7" />
  </svg>
);

function Callout({ tone = 'note', title, children }) {
  return (
    <aside className={`callout${tone === 'warn' ? ' callout--warn' : ''}`}>
      <strong>{title}</strong>
      <p>{children}</p>
    </aside>
  );
}

function Table({ head, rows }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{head.map(cell => <th key={cell}>{cell}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row[0]}>
              {row.map((cell, i) => <td key={i}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function jump(id) {
  const element = document.getElementById(id);
  if (!element) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    function pick() {
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 120) current = section.id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections[sections.length - 1].id;
      return current;
    }

    function onScroll() {
      setActive(pick());
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);

  return [active, setActive];
}

const NAV_IDS = NAV_ITEMS.map(item => item.id);

export default function InstallGuide() {
  const [activeSection, setActiveSection] = useActiveSection(NAV_IDS);

  function goTo(id) {
    setActiveSection(id);
    jump(id);
  }

  return (
    <main id="main" className="docs">
      <header className="site-nav">
        <div className="site-nav-inner">
          <a className="brand" href="#/" aria-label="iPhone Duo home">
            <img className="brand-icon" src="./assets/iphone-duo-icon.svg" alt="" aria-hidden="true" />
            iPhone Duo
          </a>
          <nav className="nav-links" aria-label="Sections">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                aria-current={activeSection === item.id ? 'true' : undefined}
                onClick={() => goTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="nav-actions">
            <button type="button" className="nav-cta" onClick={() => goTo('install')}>
              Install
            </button>
            <a
              className="nav-github"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View project on GitHub"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">iPhone Duo for React</p>
          <h1 className="hero-title">Two screens.<br />One fold.</h1>
          <p className="hero-sub">
            A foldable iPhone preview you can drop into any React app. Install it with
            shadcn, hand it two images, and let it fold.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn--primary" onClick={() => jump('install')}>
              Install the component
            </button>
            <a className="btn btn--link" href="#/">
              See it fold <Chevron />
            </a>
          </div>
        </div>

        <div className="hero-stage">
          <IPhoneDuoViewer
            assetsBase="./assets"
            defaultOpen
            closedImage={ARTWORK.closed}
            openImage={ARTWORK.open}
          />
        </div>
        <p className="hero-hint">Drag to orbit. Choose Closed or Open to fold.</p>
      </section>

      <section id="overview" className="section">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Overview</p>
            <h2>A foldable phone,<br />in a single component.</h2>
            <p className="lede">
              WebGL handles the fold. React only renders the control. Artwork, projection,
              blur, and darkening all stay inside the component.
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map(feature => (
              <article className="feature" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>

          <ul className="requirements">
            <li><Check /> React 18 or newer</li>
            <li><Check /> three 0.160+ (installed by shadcn)</li>
            <li><Check /> A parent with an explicit height</li>
            <li><Check /> WebGL 2</li>
          </ul>
        </div>
      </section>

      <section id="install" className="section section--alt">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Install</p>
            <h2>Three steps.<br />About a minute.</h2>
            <p className="lede">
              The component is a shadcn registry item. Add it to your project and render it;
              Three.js and the scoped styles come with it.
            </p>
          </div>

          <ol className="steps">
            <li className="step">
              <span className="step-index">01</span>
              <div className="step-body">
                <h3>Add the component</h3>
                <p>
                  Run this in your app. shadcn resolves the registry item, installs
                  <code>three</code>, and writes the component to
                  <code>components/iphone-duo</code>.
                </p>
                <CodeBlock label="Terminal" code={SHADCN_COMMAND} />
                <ul className="file-list">
                  <li><code>IPhoneDuoViewer.tsx</code><span>component and control</span></li>
                  <li><code>fold-viewer.js</code><span>WebGL scene and fold</span></li>
                  <li><code>ui.js</code><span>default screen layouts</span></li>
                  <li><code>IPhoneDuoViewer.css</code><span>scoped idv- styles</span></li>
                  <li><code>fold-viewer.d.ts</code><span>engine types</span></li>
                </ul>
              </div>
            </li>

            <li className="step">
              <span className="step-index">02</span>
              <div className="step-body">
                <h3>Render it</h3>
                <p>
                  Give the wrapper a height; the canvas fills its parent. These snippets are
                  complete pages, including the per-state artwork.
                </p>
                <Tabs
                  name="render"
                  label="Framework"
                  tabs={[
                    {
                      id: 'app',
                      label: 'App Router',
                      file: 'app/page.tsx',
                      code: APP_ROUTER,
                      note: 'The component imports its own stylesheet, so there is no separate CSS step in the App Router.',
                    },
                    {
                      id: 'pages',
                      label: 'Pages Router',
                      file: 'pages/index.tsx',
                      code: PAGES_ROUTER,
                      note: 'ssr: false keeps WebGL and the model loader out of the server bundle.',
                    },
                    {
                      id: 'vite',
                      label: 'Vite',
                      file: 'src/App.tsx',
                      code: VITE,
                      note: 'Vite and Create React App serve public/ from the site root.',
                    },
                  ]}
                />
                <Callout title="assetsBase is a public path">
                  Pass the folder that holds <code>iPhone_Duo_Render.usdc</code> and{' '}
                  <code>ui/</code>. This demo serves it from <code>/assets</code>; copy the same
                  folder into your app and pass its path. Keep <code>textures/</code> beside the
                  model.
                </Callout>
              </div>
            </li>

            <li className="step">
              <span className="step-index">03</span>
              <div className="step-body">
                <h3>Choose your artwork</h3>
                <p>
                  <code>closedImage</code> is the cover screen seen while closed.
                  <code>openImage</code> is the inner display seen while open. Both fill their
                  screen with <code>object-fit: cover</code> semantics.
                </p>
                <div className="artwork-row">
                  <figure>
                    <span className="artwork-swatch artwork-swatch--closed" aria-hidden="true" />
                    <figcaption>
                      <strong>closedImage</strong>
                      <span>Cover screen · 774 × 1125</span>
                    </figcaption>
                  </figure>
                  <figure>
                    <span className="artwork-swatch artwork-swatch--open" aria-hidden="true" />
                    <figcaption>
                      <strong>openImage</strong>
                      <span>Inner display · 1600 × 1125</span>
                    </figcaption>
                  </figure>
                </div>
                <p className="step-note">
                  No images? The <code>wallpaper</code> and <code>launcher</code> themes render
                  default layouts instead. Setting <code>image</code> applies one file to both
                  screens.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="props" className="section">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Props</p>
            <h2>Everything is optional<br />except the height.</h2>
            <p className="lede">
              Uncontrolled by default: the control flips the device on its own. Pass
              <code>open</code> to take over.
            </p>
          </div>
          <Table head={['Prop', 'Type', 'Default', 'What it does']} rows={PROPS} />
        </div>
      </section>

      <section id="api" className="section section--alt">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Ref API</p>
            <h2>Drive it from code.</h2>
            <p className="lede">
              The ref exposes the fold, the theme, and both screens. The engine is also
              exported for non-React mounts.
            </p>
          </div>
          <div className="api-grid">
            <CodeBlock label="Hero.tsx" code={REF_EXAMPLE} />
            <div className="table-wrap">
              <table className="table table--api">
                <tbody>
                  {API.map(([name, description]) => (
                    <tr key={name}>
                      <td><code>{name}</code></td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="styling" className="section">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Styling</p>
            <h2>Scoped from the start.</h2>
            <p className="lede">
              Every selector starts with <code>idv-</code>. The component never touches your
              page chrome, and the root is a container-query context.
            </p>
          </div>
          <div className="class-row" aria-label="CSS classes">
            {['.idv', '.idv-viewport', '.idv-toggle', '.idv-status', '.idv-error', '.idv-notice'].map(name => (
              <span className="class-chip" key={name}>{name}</span>
            ))}
          </div>
          <div className="styling-grid">
            <CodeBlock label="styles.css" code={STYLE_EXAMPLE} />
            <p>
              Add a class with <code>className</code> and override from your own stylesheet.
              Below a 520px container the control tightens up automatically.
            </p>
          </div>
        </div>
      </section>

      <section id="troubleshooting" className="section section--alt">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">Support</p>
            <h2>The usual suspects.</h2>
          </div>
          <div className="accordions">
            {TROUBLES.map(([question, answer]) => (
              <details className="accordion" key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <h4>Component</h4>
              <button type="button" onClick={() => jump('overview')}>Overview</button>
              <button type="button" onClick={() => jump('install')}>Install</button>
              <button type="button" onClick={() => jump('props')}>Props</button>
              <button type="button" onClick={() => jump('api')}>Ref API</button>
            </div>
            <div>
              <h4>Resources</h4>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="./r/iphone-duo.json" target="_blank" rel="noopener noreferrer">Registry JSON</a>
              <a href="./docs/installation.md" target="_blank" rel="noopener noreferrer">Install guide</a>
              <a href="#/">Live preview</a>
            </div>
            <div>
              <h4>Assets</h4>
              <a
                href="https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apple HIG
              </a>
              <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a>
              <a href="https://ui.shadcn.com/docs/registry" target="_blank" rel="noopener noreferrer">shadcn registry</a>
            </div>
            <div>
              <h4>About</h4>
              <p>MIT licensed code. Apple model and imagery are not included.</p>
              <p>Created by Amit Gajare.</p>
              <a href="https://github.com/Amitgajare2" target="_blank" rel="noopener noreferrer">GitHub profile</a>
              <a href="https://www.instagram.com/amitgajare_/" target="_blank" rel="noopener noreferrer">Instagram · @amitgajare_</a>
            </div>
          </div>
          <div className="footer-legal">
            <span>iPhone Duo · A foldable screen study.</span>
            <span>Built with React, Three.js, and shadcn.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
