import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

await mkdir(dist, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/index.js')],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  target: ['es2020'],
  platform: 'browser',
  external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'three', 'three/addons/*'],
  banner: { js: "'use client';" },
  outfile: path.join(dist, 'iphone-duo.js'),
  logLevel: 'info',
});
await copyFile(path.join(root, 'src/IPhoneDuoViewer.css'), path.join(dist, 'iphone-duo.css'));
console.log('Library build written to dist/');
