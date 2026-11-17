import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'r');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

const files = [
  { source: 'src/IPhoneDuoViewer.tsx', target: '@components/iphone-duo/IPhoneDuoViewer.tsx', type: 'registry:component' },
  { source: 'src/IPhoneDuoViewer.css', target: '@components/iphone-duo/IPhoneDuoViewer.css', type: 'registry:file' },
  { source: 'src/fold-viewer.js', target: '@components/iphone-duo/fold-viewer.js', type: 'registry:component' },
  { source: 'src/fold-viewer.d.ts', target: '@components/iphone-duo/fold-viewer.d.ts', type: 'registry:file' },
  { source: 'src/ui.js', target: '@components/iphone-duo/ui.js', type: 'registry:component' },
];

const item = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'iphone-duo',
  type: 'registry:block',
  title: 'iPhone Duo Viewer',
  description:
    'Interactive foldable iPhone preview with separate artwork for the cover screen and inner display.',
  author: 'Amitgajare2',
  dependencies: ['three'],
  files: await Promise.all(
    files.map(async file => ({
      path: file.source,
      type: file.type,
      target: file.target,
      content: await readFile(path.join(root, file.source), 'utf8'),
    })),
  ),
  docs: [
    '## iPhone Duo Viewer',
    '',
    '```tsx',
    "import IPhoneDuoViewer from '@/components/iphone-duo/IPhoneDuoViewer';",
    '',
    '<IPhoneDuoViewer',
    '  assetsBase="/iphone-duo"',
    '  closedImage="/iphone-duo/ui/wallpaper-closed.avif"',
    '  openImage="/iphone-duo/ui/wallpaper-open.avif"',
    '/>',
    '```',
    '',
    'Copy the prepared `assets/` folder to `public/iphone-duo/`. The parent element needs an explicit height.',
    '',
    'The installed stylesheet is imported by the component. In the Next.js Pages Router, move that import to `pages/_app.jsx`.',
  ].join('\n'),
  meta: {
    version: pkg.version,
  },
};

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'iphone-duo.json'), `${JSON.stringify(item, null, 2)}\n`);
console.log(`Registry item written to r/iphone-duo.json (${item.files.length} files)`);
