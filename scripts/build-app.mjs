import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');

const options = {
  entryPoints: [path.join(root, 'src/app.jsx')],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  target: ['es2020'],
  minify: !watch,
  define: { 'process.env.NODE_ENV': '"production"' },
  // Three.js stays in vendor/ and is resolved by the import map in index.html.
  external: ['three', 'three/addons/*'],
  outfile: path.join(root, 'app.js'),
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Watching src/ … refresh the page after each rebuild.');
} else {
  await build(options);
}
