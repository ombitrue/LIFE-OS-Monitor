// LIFE.OS Monitor local launch server: builds and serves dist/ with plain Node HTTP.
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

const port = Number(process.env.PORT || 4173);
const root = 'dist';

async function buildApp() {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await cp('index.html', join(root, 'index.html'));
  await cp('public', root, { recursive: true });
  await build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: join(root, 'main.js'),
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: true,
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
  });
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.map', 'application/json; charset=utf-8'],
]);

await buildApp();

createServer((request, response) => {
  const rawPath = decodeURIComponent(new URL(request.url ?? '/', `http://localhost:${port}`).pathname);
  const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath);
  const fallbackPath = join(root, 'index.html');
  const resolvedPath = existsSync(filePath) ? filePath : fallbackPath;
  response.setHeader('Content-Type', contentTypes.get(extname(resolvedPath)) ?? 'application/octet-stream');
  createReadStream(resolvedPath).pipe(response);
}).listen(port, () => {
  console.log(`LIFE.OS Monitor is running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop. Re-run npm start after source changes.');
});
