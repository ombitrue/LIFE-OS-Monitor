// LIFE.OS Monitor production build script: creates the static dist/ bundle without Vite.
import esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('public', 'dist', { recursive: true });

await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: true,
  minify: true,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css',
  },
});

console.log('LIFE.OS Monitor built in dist/.');
