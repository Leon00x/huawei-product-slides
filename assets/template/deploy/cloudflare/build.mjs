import {readFile, writeFile, mkdir, cp, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const platform = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(platform, '../..');
const buildDirectory = path.join(platform, 'dist');
const output = path.join(buildDirectory, 'public');
// Only remove the fixed build directory inside this project.
if (path.dirname(buildDirectory) !== platform || path.basename(buildDirectory) !== 'dist') throw new Error('Unsafe output path');
await rm(buildDirectory, {recursive: true, force: true});
await mkdir(output, {recursive: true});
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const entries = new Set(['index.html', 'assets']);
for (const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
  const relative = match[1];
  if (/^(?:https?:|\/)/.test(relative)) continue;
  if (!/^(?:css\/[a-z0-9-]+\.css|js\/[a-z0-9-]+\.js)$/.test(relative)) throw new Error(`Unexpected source file: ${relative}`);
  entries.add(relative);
}
for (const entry of entries) {
  await mkdir(path.dirname(path.join(output, entry)), {recursive: true});
  await cp(path.join(root, entry), path.join(output, entry), {recursive: true});
}
await writeFile(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n');
console.log(`Cloudflare Workers assets ready: ${output}`);
