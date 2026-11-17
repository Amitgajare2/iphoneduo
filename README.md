# iPhone Duo · Fold Preview

A browser-based study of foldable screen transitions, built with Three.js.

[Live demo](https://iphoneduoui.netlify.app/)

## Features

- Wallpaper and Launcher default layouts, plus separate artwork for each state: the cover screen while closed and the inner display while open.
- Screen content uses a fixed front-view projection during folding; blur and darkening follow the image coordinates and cap at black.
- Only the cover half rotates; the rear-camera half stays fixed.
- Drag to orbit, scroll to zoom, or use the Closed / Open control to fold the device.
- Responsive layout that fills its container. Artwork stays in the browser.

## Install in your app

`IPhoneDuoViewer` is a React component with a Closed / Open control, drag-to-orbit, and per-state artwork. It wraps the framework-agnostic scene in `src/fold-viewer.js` and ships as a shadcn registry item.

Fastest path, from your app:

```sh
npx shadcn@latest add https://iphoneduoui.netlify.app/r/iphone-duo.json
```

shadcn writes `components/iphone-duo/`, installs `three`, and leaves the component source in your project. Copy the prepared `assets/` folder to `public/iphone-duo/`, then render:

```tsx
'use client';

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
}
```

The installed component imports its own namespaced stylesheet. Requirements: React 18+ and Three.js 0.160+.

Prefer a registry namespace? Add it to `components.json` once, then install by name:

```json
{
  "registries": {
    "@iphone-duo": "https://iphoneduoui.netlify.app/r/{name}.json"
  }
}
```

```sh
npx shadcn@latest add @iphone-duo/iphone-duo
```

The full guide — Next.js App Router and Pages Router, Vite, assets, props, ref API, troubleshooting — is on the site at [/#/install](https://iphoneduoui.netlify.app/#/install) and in [docs/installation.md](docs/installation.md).

### Package install

If you would rather use a versioned dependency:

```sh
# in this repository
npm install
npm pack

# in your app
npm install three
npm install ../iphone-duo/iphone-duo-1.0.0.tgz
```

```jsx
import IPhoneDuoViewer from 'iphone-duo';
import 'iphone-duo/style.css';
```

You can also copy `src/IPhoneDuoViewer.tsx`, `src/IPhoneDuoViewer.css`, `src/fold-viewer.js`, and `src/ui.js` into your app and import the CSS manually.

`openImage` is the inner display seen when open; `closedImage` is the cover screen seen when closed. Each fills its screen with `object-fit: cover` semantics, so use roughly 1600 × 1125 for the open spread and 774 × 1125 for the closed cover. Setting `image` applies one file to both screens instead.

The component fills its parent, so give the wrapper an explicit height. The prepared assets must still be served over HTTP from `assetsBase`.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `assetsBase` | string | `'./assets'` | Folder holding `iPhone_Duo_Render.usdc` and `ui/` |
| `modelUrl` | string | — | Explicit model URL, overrides `assetsBase` |
| `open` | boolean | — | Controlled fold state; pair with `onOpenChange` |
| `defaultOpen` | boolean | `true` | Initial fold state when uncontrolled |
| `duration` | number | `1.4` | Fold animation length in seconds; `0` is instant |
| `theme` | `'wallpaper' \| 'launcher'` | `'wallpaper'` | Default layouts for screens without artwork |
| `closedImage` | string \| File \| Blob \| element | `null` | Cover screen artwork, seen while closed |
| `openImage` | string \| File \| Blob \| element | `null` | Inner display artwork, seen while open |
| `image` | string \| File \| Blob \| element | `null` | Applies one source to both screens |
| `labels` | object | — | Overrides `closed`, `open`, `loading`, `loadError`, `retry`, `imageError`, `viewport` |
| `className`, `style` | — | — | Applied to the root element |
| `onReady`, `onError`, `onOpenChange`, `onFoldEnd` | functions | — | Lifecycle hooks |


Use a ref for imperative control:

```jsx
const viewer = useRef(null);

<IPhoneDuoViewer ref={viewer} defaultOpen={false} />
<button onClick={() => viewer.current.toggle()}>Flip</button>
```

The ref exposes `open`, `close`, `toggle`, `setOpen`, `setAngle`, `getAngle`, `setTheme`, `setImage`, `setScreenImage`, `setScreenImages`, `resize`, and `getViewer`.

For non-React usage, import `createFoldViewer` from `src/fold-viewer.js` and mount it into any element; `createFoldViewer({ container, initialImages: { inner, outer } })` applies artwork before the viewer reports ready.

## Run locally

The demo is a React page built with esbuild. The compiled `app.js` and `app.css` are included, so serving the folder is enough; rebuild after editing anything under `src/`:

```sh
npm install
npm run build      # one-off build
npm run serve      # http://127.0.0.1:8766/
```

Use `npm run dev` in a second terminal to rebuild on change. `npm run serve` is a dependency-free Node static server; it sends the right types for `.usdc`, `.avif`, and the other asset files.

Open [http://127.0.0.1:8766/](http://127.0.0.1:8766/) for the preview and [http://127.0.0.1:8766/#/install](http://127.0.0.1:8766/#/install) for the install guide. Serve the directory over HTTP; opening `index.html` as a local file cannot load the model. The registry item is available locally at `/r/iphone-duo.json`.

### Demo assets (maintainers)

The model, textures, and default layouts live in the ignored `assets/` folder. They only need to be regenerated when the reference artwork changes:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-assets.txt
python scripts/prepare-assets.py
```

On Windows, activate with `.venv\Scripts\activate`. The script downloads the original Star White USDZ and UI images from Apple, selects the model's Landscape pose, flattens its references, and rewrites texture paths for the browser. Asset URLs were verified on September 10, 2026. This step is not needed to install or use the React component.

## Screen controls

The default view is fully open and paused. Use the **Closed / Open** control to fold the device; drag to orbit and scroll to zoom. The outer screen turns off at full opening.

The demo uses the night wallpaper pair from `ui/` for the two states. Omit `closedImage` / `openImage` to use the `wallpaper` or `launcher` default themes instead.

Routes: `/` is the live preview; `/#/install` is the shadcn-focused install guide.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | App shell: Three.js import map and the built CSS/JS |
| `src/app.jsx` | Site entry: hash routing, preview page, GitHub link |
| `src/app.css` | Preview chrome and the install-guide design |
| `src/fold-viewer.js` | Three.js scene, fold deformation, projected UI, blur, darkening, per-screen artwork |
| `src/fold-viewer.d.ts` | Engine types used by the TSX wrapper |
| `src/IPhoneDuoViewer.tsx` | Reusable React component with the Closed / Open control |
| `src/IPhoneDuoViewer.css` | Scoped styles for the React component |
| `src/InstallGuide.jsx` | Apple-style install page at `/#/install` |
| `src/index.js` | Package entry (default and named exports) |
| `src/ui.js` | Default screen layouts |
| `r/iphone-duo.json` | Built shadcn registry item |
| `app.js`, `app.css` | Generated demo bundle (`npm run build`) |
| `dist/` | Generated library build (`npm run build:lib`) |
| `types/index.d.ts` | Package TypeScript declarations |
| `scripts/build-app.mjs` | Demo bundle script |
| `scripts/build-lib.mjs` | Library bundle script |
| `scripts/build-registry.mjs` | Builds `r/iphone-duo.json` from `src/` |
| `scripts/serve.mjs` | Dependency-free static server for local previews |
| `scripts/prepare-assets.py` | Download and prepare the reference assets |
| `docs/installation.md` | Markdown install guide |
| `vercel.json` | Prepare assets during Vercel builds |
| `vendor/three/` | Three.js runtime and required add-ons |

## Deploy

The Vercel project is connected to this GitHub repository. Pushes to `main` publish the production site; other branches create preview deployments.

The demo bundle (`app.js`, `app.css`) is part of the deployed output. Run `npm run build` and keep both files when you change anything under `src/`. Run `npm run build:registry` after editing the component so `/r/iphone-duo.json` matches the source. The library build in `dist/` is only needed for `npm pack` / publishing and is not used by the site.

`vercel.json` installs the asset tools and runs `scripts/prepare-assets.py` during each build. Git deployments therefore include the model and screen images without storing those assets in the repository.

For a manual Vercel deployment:

```sh
vercel link
vercel --prod
```

`.vercelignore` keeps local credentials and Git metadata out of deployments while including the prepared assets.

For other static hosts, prepare the assets locally before publishing the project directory.

## License and sources

Original application code is released under the [MIT license](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for bundled libraries and reference assets.

Apple models and imagery are excluded from the repository and the MIT license. The preparation script links to their original sources; their use is subject to Apple's terms. This project is an independent animation study.

- [Apple iPhone Duo](https://www.apple.com/iphone-duo/)
- [Apple HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- [Three.js](https://threejs.org/)
