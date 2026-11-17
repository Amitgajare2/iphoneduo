# Install the iPhone Duo viewer

`IPhoneDuoViewer` is a React component that renders an interactive, foldable iPhone preview with a Closed / Open control and separate artwork for each screen. It works in any React 18+ app and ships with a ready-made Next.js setup guide below.

There are three supported installation styles:

| Path | Best for |
| --- | --- |
| **shadcn registry** (recommended) | Most apps: source lands in your project and `three` is installed for you |
| **Package** (tarball or npm) | Apps that want a versioned dependency and no source maintenance |
| **Source copy** | Apps that need to customize the engine or styles directly |

All three paths need the same Three.js version and the same prepared assets.

---

## Before you start

| Requirement | Version |
| --- | --- |
| React + React DOM | 18 or 19 |
| Three.js | 0.160 or newer |
| Node.js (to install) | 18 or newer |
| Browser | Any WebGL 2 capable browser |

The component fills its parent element, so the wrapper **must have an explicit height** (`100dvh`, a fixed pixel height, or an aspect-ratio box). Without it the canvas has zero height and nothing appears.

> **Asset licensing:** the Apple model and screen imagery are not part of this package and are not covered by its MIT license. Serve them from your own public folder and follow Apple's terms. Do not republish the downloaded assets.

---

## Option 1 — install with shadcn (recommended)

The component is published as a shadcn registry item at `/r/iphone-duo.json`. Running `add` against that URL writes the source into your app, installs `three`, and imports the scoped stylesheet from the component itself.

### 1. Add the component

From your app's root:

```sh
npx shadcn@latest add https://iphoneduoui.netlify.app/r/iphone-duo.json
```

The CLI asks for confirmation, then writes:

```text
components/iphone-duo/
├── IPhoneDuoViewer.tsx   # component and Closed / Open control
├── IPhoneDuoViewer.css   # scoped idv- styles
├── fold-viewer.js        # WebGL scene and fold
├── fold-viewer.d.ts      # engine types
└── ui.js                 # default screen layouts
```

It also adds `three` to your dependencies. Your project needs a `components.json` — run `npx shadcn@latest init` first if it does not have one.

**Prefer a bare name?** Add a registry namespace to `components.json`:

```json
{
  "registries": {
    "@iphone-duo": "https://iphoneduoui.netlify.app/r/{name}.json"
  }
}
```

Then install by name:

```sh
npx shadcn@latest add @iphone-duo/iphone-duo
```

A bare `npx shadcn@latest add iphone-duo` only works for components in shadcn's own registry. Custom registries are resolved through a URL or a configured namespace, which is why one of the two commands above is required.

**Local testing:** serve this repository over HTTP and point the CLI at your own machine:

```sh
npx shadcn@latest add http://127.0.0.1:8766/r/iphone-duo.json
```

### 2. Render it

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

There is no separate CSS import step: `IPhoneDuoViewer.tsx` imports `./IPhoneDuoViewer.css`. In the Next.js Pages Router, global CSS may only be imported in `pages/_app.jsx`, so move that import there (or import it in `_app` and remove it from the component).

`assetsBase` points at the folder that holds `iPhone_Duo_Render.usdc` and `ui/`. This repository serves it from `/assets`; copy that folder into your app's public directory as `iphone-duo` and pass `/iphone-duo`. Keep `textures/` beside the model.

---

## Option 2 — install the package

### 1. Build the tarball

From a checkout of this repository:

```sh
npm install
npm pack
```

`npm pack` runs the library build and writes `iphone-duo-1.0.0.tgz` in the repository root. The tarball contains the compiled component, its stylesheet, TypeScript declarations, this guide, and license files.

### 2. Install it in your app

```sh
npm install three
npm install ../iphone-duo/iphone-duo-1.0.0.tgz
```

Use the real path to the tarball. React and React DOM are peer dependencies, so your app's existing copy is used.

If you publish the package to a registry (see [Publishing](#publishing-optional)), the second command becomes:

```sh
npm install iphone-duo
```

### 3. Serve the assets

The `assets/` folder in this repository already holds the model, its `textures/`, and the default `ui/` layouts. Copy it into your app's public directory:

```sh
mkdir -p public/iphone-duo
cp -R assets/. public/iphone-duo/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force public\iphone-duo | Out-Null
Copy-Item -Recurse assets\* public\iphone-duo\
```

In Next.js and Vite, files in `public/` are served from the site root, so the model is available at `/iphone-duo/iPhone_Duo_Render.usdc`. Pass that folder as `assetsBase`. For Create React App, copy to `public/iphone-duo/` as well.

### 4. Import the stylesheet

The styles are namespaced with the `idv-` prefix and are not imported automatically. Add one global import:

```js
import 'iphone-duo/style.css';
```

Put this in a place that runs once:

- **Next.js App Router:** `app/layout.jsx` (or the client component that uses the viewer)
- **Next.js Pages Router:** `pages/_app.jsx`
- **Vite / CRA:** `src/main.jsx` or `src/index.js`

### 5. Render it

```jsx
'use client';

import IPhoneDuoViewer from 'iphone-duo';

export default function Page() {
  return (
    <main style={{ height: '100dvh', background: '#f6f6f3' }}>
      <IPhoneDuoViewer
        assetsBase="/iphone-duo"
        defaultOpen
        closedImage="/iphone-duo/ui/wallpaper-closed.avif"
        openImage="/iphone-duo/ui/wallpaper-open.avif"
      />
    </main>
  );
}
```

The `'use client'` directive is only needed in the Next.js App Router. The built package marks itself as a client entry, but a page that passes callbacks should also be a client component.

---

## Option 3 — copy the source

Use this when you want to edit the shaders, projection, or styles and skip shadcn.

1. Copy these files into your project, for example to `src/components/iphone-duo/`:

   ```text
   src/IPhoneDuoViewer.tsx
   src/IPhoneDuoViewer.css
   src/fold-viewer.js
   src/fold-viewer.d.ts
   src/ui.js
   ```

   `fold-viewer.d.ts` is optional but required for TypeScript without `allowJs` errors.

2. Install Three.js:

   ```sh
   npm install three
   ```

3. Import the CSS once:

   ```js
   import './components/iphone-duo/IPhoneDuoViewer.css';
   ```

   In the Next.js Pages Router, global CSS can only be imported in `pages/_app.jsx`.

4. Import the component:

   ```tsx
   'use client';

   import IPhoneDuoViewer from './components/iphone-duo/IPhoneDuoViewer';

   <IPhoneDuoViewer assetsBase="/iphone-duo" />
   ```

The source files are dependency-free apart from `react`, `three`, and each other. `fold-viewer.js` is framework-agnostic and can also be mounted without React.

---

## Next.js

### App Router (`app/`)

```jsx
// app/layout.jsx
import 'iphone-duo/style.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
```

```jsx
// app/page.jsx
'use client';

import IPhoneDuoViewer from 'iphone-duo';

export default function Page() {
  return (
    <main style={{ height: '100dvh' }}>
      <IPhoneDuoViewer assetsBase="/iphone-duo" defaultOpen />
    </main>
  );
}
```

Notes:

- Keep the `'use client'` directive on the page if it passes `onOpenChange`, `onReady`, or other function props. Server components cannot pass functions to client components.
- `public/iphone-duo/...` is served from `/iphone-duo/...`. Do not use `next/image`; the viewer loads its own images.
- No `next.config` changes are needed for Three.js 0.160+.

### Pages Router (`pages/`)

```jsx
// pages/_app.jsx
import 'iphone-duo/style.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

```jsx
// pages/index.jsx
import dynamic from 'next/dynamic';

const IPhoneDuoViewer = dynamic(() => import('iphone-duo'), {
  ssr: false,
  loading: () => <div style={{ height: '100dvh' }} />,
});

export default function Home() {
  return (
    <main style={{ height: '100dvh' }}>
      <IPhoneDuoViewer assetsBase="/iphone-duo" defaultOpen />
    </main>
  );
}
```

`ssr: false` keeps WebGL and the model loader out of the server bundle. Render the viewer only on the client.

---

## Vite

```jsx
// src/main.jsx
import 'iphone-duo/style.css';
```

```jsx
// src/App.jsx
import IPhoneDuoViewer from 'iphone-duo';

export default function App() {
  return (
    <main style={{ height: '100dvh', background: '#f6f6f3' }}>
      <IPhoneDuoViewer
        assetsBase="/iphone-duo"
        closedImage="/iphone-duo/ui/wallpaper-closed.avif"
        openImage="/iphone-duo/ui/wallpaper-open.avif"
      />
    </main>
  );
}
```

Put the prepared assets in `public/iphone-duo/`. The package is ESM and needs no special Vite configuration.

---

## Create React App

```jsx
// src/index.js
import 'iphone-duo/style.css';
```

Use the same component code as the Vite example. CRA serves `public/` from the site root. If you use CRA with an older webpack, upgrade `react-scripts` or use Vite; Three.js 0.160+ is ESM-only.

---

## Usage

Import paths in this section use the package name. With the shadcn install, use `@/components/iphone-duo/IPhoneDuoViewer` instead.

### Uncontrolled fold state

```jsx
<IPhoneDuoViewer defaultOpen />
```

`defaultOpen` is `true` by default. The user can switch between Closed and Open.

### Controlled fold state

```jsx
const [open, setOpen] = useState(false);

<IPhoneDuoViewer open={open} onOpenChange={setOpen} />
```

When `open` is provided, the component never changes it on its own; update it in `onOpenChange`.

### Artwork for each state

```jsx
<IPhoneDuoViewer
  assetsBase="/iphone-duo"
  closedImage="/artwork/closed.png"  // cover screen, seen closed
  openImage="/artwork/open.png"      // inner display, seen open
/>
```

- One image is mapped to the **cover (outer) screen** while closed and the other to the **inner display** while open. Both are visible during the fold.
- Images are drawn with `object-fit: cover` semantics, so they fill the screen instead of letterboxing.
- Recommended sizes: **774 × 1125** (about 0.69:1) for `closedImage` and **1600 × 1125** (about 1.42:1) for `openImage`. Any size works; it is centered and cropped.
- `image` applies one file to both screens. A state-specific prop wins over it.
- Without any images, the default `theme` (`wallpaper` or `launcher`) is used.

Remote images need CORS headers. The engine loads artwork with `crossOrigin="anonymous"` because it draws it into a canvas texture; a cross-origin image without `Access-Control-Allow-Origin` will fail with an inline error.

### Imperative control

```jsx
import { useRef } from 'react';
import IPhoneDuoViewer from 'iphone-duo';

const viewer = useRef(null);

<IPhoneDuoViewer ref={viewer} defaultOpen={false} assetsBase="/iphone-duo" />;

viewer.current.open();
viewer.current.close();
viewer.current.toggle();
viewer.current.setOpen(true, { animate: false });
viewer.current.setAngle(90);
viewer.current.setTheme('launcher');
viewer.current.setImage('/artwork.png');
viewer.current.setScreenImage('/cover.png', { screen: 'outer' });
viewer.current.setScreenImages({ inner: '/open.png', outer: null });
```

`setScreenImages` accepts `inner` and `outer` keys. Pass `null` for a screen to restore the current default theme. `setScreenImage(source, { screen })` sets one screen; `screen` is `'inner'`, `'outer'`, or `'both'` (default).

The ref also exposes `getAngle()`, `resize()`, and `getViewer()` for direct engine access.

### Default themes

`theme="wallpaper"` and `theme="launcher"` use the prepared `ui/` images. The theme only applies to screens without custom artwork, so you can combine a themed open display with a custom closed cover:

```jsx
<IPhoneDuoViewer theme="launcher" closedImage="/cover.png" />
```

### Labels and accessibility

Override any built-in copy with `labels`:

```jsx
<IPhoneDuoViewer
  labels={{
    closed: 'Folded',
    open: 'Unfolded',
    foldState: 'Device fold state',
    loading: 'Loading the device…',
    loadError: 'The device could not load.',
    retry: 'Reload',
    imageError: 'That image could not be used.',
    viewport: 'Foldable iPhone preview. Drag to rotate, scroll to zoom.',
  }}
/>
```

The control is a labelled button group with `aria-pressed`, the viewport is announced as an image, and load failures appear in an `role="alert"` panel with a retry button.

---

## TypeScript

The package ships declarations, including the ref handle:

```tsx
'use client';

import { useRef } from 'react';
import IPhoneDuoViewer, { type IPhoneDuoViewerHandle } from 'iphone-duo';

export default function Hero() {
  const viewer = useRef<IPhoneDuoViewerHandle>(null);

  return (
    <section style={{ height: '100dvh' }}>
      <IPhoneDuoViewer ref={viewer} assetsBase="/iphone-duo" defaultOpen={false} />
      <button type="button" onClick={() => viewer.current?.toggle()}>
        Flip
      </button>
    </section>
  );
}
```

If you installed with shadcn, the copied files carry their own declarations: `fold-viewer.d.ts` types the engine and `IPhoneDuoViewer.tsx` exports `IPhoneDuoViewerProps` and `IPhoneDuoViewerHandle` directly from the component.

If you copy the source manually, keep `fold-viewer.d.ts` beside `fold-viewer.js`; otherwise set `allowJs` or expect implicit-`any` errors.

If your project does not already declare CSS side-effect imports, add a small declaration file so `import './component.css'` type-checks:

```ts
declare module '*.css';
```

---

## Styling

- The root element has the `.idv` class and is a container-query context.
- Every internal class is prefixed: `.idv-viewport`, `.idv-status`, `.idv-error`, `.idv-notice`, `.idv-toggle`.
- `className` and `style` are applied to the root, so you can add layout or theme overrides:

  ```jsx
  <IPhoneDuoViewer className="hero-viewer" style={{ background: '#0f1110' }} />
  ```

- To restyle the control, target `.idv-toggle` inside your own class:

  ```css
  .hero-viewer .idv-toggle {
    right: auto;
    left: 24px;
  }
  ```

The stylesheet uses system fonts and light colors to match the demo. It does not set a page background; the parent supplies that.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Nothing renders, or a zero-height area | The parent has no height. Give the wrapper `height: 100dvh` or a fixed height. |
| `Unable to load the preview` | Check `assetsBase`. Visiting `/iphone-duo/iPhone_Duo_Render.usdc` should download the model. The `.usdc` loads textures relative to its URL, so keep the `textures/` folder beside it. |
| `window is not defined` during build | Render on the client: use `'use client'`, or `dynamic(..., { ssr: false })` in the Next.js Pages Router. |
| `Can't resolve 'three/addons/...'` | Install `three@0.160` or newer; older versions do not expose the `addons` subpath. |
| Image notice after picking a remote image | The host does not allow CORS. Serve the image from the same origin or add `Access-Control-Allow-Origin`. |
| A blank or black screen on an old browser | The viewer needs WebGL 2. Check `chrome://gpu` or the browser's WebGL support. |
| AVIF artwork fails on older Safari | Use PNG, JPEG, or WebP for `closedImage` / `openImage`. |
| Styles look unstyled | Import `iphone-duo/style.css` (package), keep the component's `IPhoneDuoViewer.css` import (shadcn), or import it once yourself (source copy). In the Pages Router, global CSS belongs in `pages/_app.jsx`. |
| `npx shadcn add iphone-duo` finds nothing | Custom registries need a URL or a namespace. Use `npx shadcn@latest add https://iphoneduoui.netlify.app/r/iphone-duo.json`, or configure `@iphone-duo` in `components.json` first. |

---

## Publishing (optional)

The package is marked `"private": true` to prevent accidental publishes. To ship it from your own registry:

1. Rename the package in `package.json` (for example `@your-scope/iphone-duo-viewer`) and remove `"private": true`.
2. Run `npm run build:lib` and check `dist/` and `types/`.
3. Publish with `npm publish`.

The package intentionally excludes the Apple model and imagery. Keep serving those from your own `public/` folder and keep the licensing note with your app.
