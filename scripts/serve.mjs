import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.PORT || 8766);
const HOST = process.env.HOST || '127.0.0.1';
const root = process.cwd();

const TYPES = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.usdc': 'application/octet-stream',
  '.usdz': 'model/vnd.usdz+zip',
}));

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);

  try {
    const filePath = path.join(root, decodeURIComponent(url.pathname));
    const relative = path.relative(root, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    let target = filePath;
    let info = await stat(target);
    if (info.isDirectory()) {
      target = path.join(target, 'index.html');
      info = await stat(target);
    }
    response.writeHead(200, {
      'content-type': TYPES.get(path.extname(target).toLowerCase()) || 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`iPhone Duo on http://${HOST}:${PORT}/`);
  console.log(`Install guide on http://${HOST}:${PORT}/#/install`);
});
