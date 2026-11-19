// Local preview only; production serves the static files directly.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = resolve(join(root, pathname === '/' ? 'index.html' : pathname.slice(1)));
  if (target !== root && !target.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    if (!(await stat(target)).isFile()) throw new Error('not a file');
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
    response.end(await readFile(target));
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
