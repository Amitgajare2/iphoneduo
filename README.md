# iPhone Duo

[![Live demo](https://img.shields.io/badge/Live_demo-iphoneduoui.netlify.app-0071e3?logo=safari&logoColor=white)](https://iphoneduoui.netlify.app/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160%2B-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-34a853)](LICENSE)

A foldable iPhone preview component for React, built with Three.js. Hand it two images — the cover screen and the inner display — and drop it into any app: it folds in real 3D while the artwork stays projected on both screens.

**[See it fold →](https://iphoneduoui.netlify.app/)** · **[Install guide →](https://iphoneduoui.netlify.app/#/install)**

## Highlights

- **Two screens, two images** — `closedImage` shows on the cover screen while shut; `openImage` fills the inner display once it unfolds. Both stay visible mid-fold.
- **A real fold, not a crossfade** — only the cover half rotates; screen content is projected to the front view, with blur and darkening driven by the image coordinates.
- **Interactive by default** — drag to orbit, scroll to zoom, or use the Closed / Open control. Fully responsive; fills whatever container you give it.
- **Framework-friendly** — ships as TSX with scoped CSS and a typed ref. Works in the Next.js App Router, the Pages Router, and Vite. No Tailwind required.
- **Graceful fallbacks** — `wallpaper` and `launcher` themes render default screen layouts when you don't pass artwork.

## Quick start

From your app's root:

```sh
npx shadcn@latest add https://iphoneduoui.netlify.app/r/iphone-duo.json
```

shadcn writes the component source to `components/iphone-duo/` and installs `three` for you. Copy the prepared `assets/` folder into your app's public directory as `public/iphone-duo/`, then render:

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

The component imports its own namespaced stylesheet, so there is no separate CSS step.

> The wrapper needs an explicit height (`100dvh`, a fixed pixel height, or an aspect-ratio box) — the canvas fills its parent.

## Installation options

| Path | Best for |
| --- | --- |
| **shadcn registry** (above) | Most apps — source lands in your project, `three` is installed for you |
| **npm tarball** | A versioned dependency with no source maintenance: `npm pack` here, then `npm install ../iphone-duo/iphone-duo-1.0.0.tgz` and `import IPhoneDuoViewer from 'iphone-duo'` |
| **Source copy** | Full control — copy `src/IPhoneDuoViewer.tsx`, `IPhoneDuoViewer.css`, `fold-viewer.js`, and `ui.js` into your app |

Full walkthroughs for Next.js (App and Pages Router), Vite, CRA, styling, TypeScript, and troubleshooting live in [docs/installation.md](docs/installation.md) and on the site at [/#/install](https://iphoneduoui.netlify.app/#/install).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `assetsBase` | string | `'./assets'` | Folder holding `iPhone_Duo_Render.usdc`, its `textures/`, and `ui/` |
| `modelUrl` | string | — | Explicit model URL; overrides `assetsBase` |
| `open` | boolean | — | Controlled fold state; pair with `onOpenChange` |
| `defaultOpen` | boolean | `true` | Initial fold state when uncontrolled |
| `duration` | number | `1.4` | Fold animation length in seconds; `0` is instant |
| `theme` | `'wallpaper' \| 'launcher'` | `'wallpaper'` | Default layouts for screens without artwork |
| `closedImage` | string \| File \| Blob \| element | `null` | Cover-screen artwork, seen while closed |
| `openImage` | string \| File \| Blob \| element | `null` | Inner-display artwork, seen while open |
| `image` | string \| File \| Blob \| element | `null` | One source applied to both screens |
| `labels` | object | — | Overrides the built-in copy and aria labels |
| `className`, `style` | — | — | Applied to the root element |
| `onReady`, `onError`, `onOpenChange`, `onFoldEnd` | functions | — | Lifecycle hooks |

**Artwork sizes:** `openImage` is the inner spread — use roughly **1600 × 1125**; `closedImage` is the cover — use **774 × 1125**. Any size works; each image is centered and cropped with `object-fit: cover` semantics.

## Ref API

```jsx
const viewer = useRef(null);

<IPhoneDuoViewer ref={viewer} defaultOpen={false} />
<button onClick={() => viewer.current.toggle()}>Flip</button>
```

The ref exposes `open`, `close`, `toggle`, `setOpen`, `setAngle`, `getAngle`, `setTheme`, `setImage`, `setScreenImage`, `setScreenImages`, `resize`, and `getViewer`. For non-React mounts, `createFoldViewer` from `fold-viewer.js` drives the same engine from any element.

## Run locally

```sh
npm install
npm run build      # build the demo bundle (app.js / app.css)
npm run serve      # http://127.0.0.1:8766/
```

Use `npm run dev` in a second terminal to rebuild on change. Serve the directory over HTTP — opening `index.html` as a local file cannot load the model. `npm run build:lib` and `npm run build:registry` regenerate `dist/` and `r/iphone-duo.json` after edits.

### Demo assets (maintainers)

The Apple model, textures, and default `ui/` layouts in `assets/` are prepared by this script; they only need to be regenerated when the reference artwork changes:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-assets.txt
python scripts/prepare-assets.py
```

On Windows, activate with `.venv\Scripts\activate`. The script downloads the original Star White USDZ and UI images from Apple, selects the model's Landscape pose, flattens its references, and rewrites texture paths for the browser. Vercel deployments run this script automatically during each build.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | App shell: Three.js import map and the built CSS/JS |
| `src/app.jsx` | Site entry: hash routing and the preview page |
| `src/app.css` | Preview chrome and the install-guide design |
| `src/fold-viewer.js` | Three.js scene: fold deformation, projection, blur, darkening, artwork |
| `src/fold-viewer.d.ts` | Engine types used by the TSX wrapper |
| `src/IPhoneDuoViewer.tsx` | Reusable React component with the Closed / Open control |
| `src/IPhoneDuoViewer.css` | Scoped `idv-` styles for the React component |
| `src/InstallGuide.jsx` | Apple-style install page at `/#/install` |
| `src/index.js` | Package entry (default and named exports) |
| `src/ui.js` | Default `wallpaper` / `launcher` screen layouts |
| `scripts/` | Demo, library, and registry build scripts plus the static server |
| `docs/installation.md` | Full markdown install guide |
| `vercel.json` | Runs asset preparation during Vercel builds |

## License and sources

Original application code is released under the [MIT license](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for bundled libraries and reference assets.

Apple models and imagery are excluded from the repository and the MIT license; the preparation script links to their original sources, and their use is subject to Apple's terms. This project is an independent animation study and is not affiliated with Apple.

- [Apple iPhone Duo](https://www.apple.com/iphone-duo/)
- [Apple HIG: Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
- [Three.js](https://threejs.org/)
