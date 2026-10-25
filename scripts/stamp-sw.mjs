/*
 * Ejecutado automaticamente despues de vite build.
 * La huella cambia cuando cambia cualquier archivo publicado, incluidos
 * los planos, los datos y los bundles JS/CSS. No requiere librerias extras.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = fileURLToPath(new URL('../', import.meta.url));
const outputDir = resolve(projectDir, 'dist');
const swFile = join(outputDir, 'sw.js');

async function listFiles(folder) {
  const found = [];
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const fullPath = join(folder, item.name);
    if (item.isDirectory()) found.push(...await listFiles(fullPath));
    else if (item.isFile()) found.push(fullPath);
  }
  return found;
}

const files = (await listFiles(outputDir))
  .map((full) => ({ full, path: relative(outputDir, full).split(sep).join('/') }))
  .filter(({ path }) => path !== 'sw.js')
  .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

if (!files.some(({ path }) => path === 'index.html')) {
  throw new Error('No se encontro dist/index.html. La compilacion parece incompleta.');
}

const hash = createHash('sha256');
for (const file of files) {
  hash.update(file.path);
  hash.update('\0');
  hash.update(await readFile(file.full));
  hash.update('\0');
}
const buildId = hash.digest('hex').slice(0, 16);
const precache = ['./', ...files.map(({ path }) => './' + path)];

let worker = await readFile(swFile, 'utf8');
if (!worker.includes('__BUILD_ID__') || !worker.includes('__PRECACHE__')) {
  throw new Error('public/sw.js no contiene los marcadores de version esperados.');
}
worker = worker.replaceAll('__BUILD_ID__', buildId)
  .replaceAll('__PRECACHE__', JSON.stringify(precache));
await writeFile(swFile, worker, 'utf8');
console.log(`Service Worker versionado: ${buildId} (${files.length} archivos + inicio)`);
