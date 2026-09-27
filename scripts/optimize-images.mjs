// One-off, repeatable media conversion. Originals remain recoverable in Git.
// Usage: node scripts/optimize-images.mjs [absolute path to installed sharp]
import { createRequire } from 'node:module';
import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const root = resolve('public/assets');
const sourceFiles = (await readdir('src')).filter(n => /\.(tsx?|css)$/.test(n));
const sources = await Promise.all(sourceFiles.map(async name => ({path:join('src',name), text:await readFile(join('src',name),'utf8')})));
const refs = new Set(sources.flatMap(({text}) => [...text.matchAll(/\/assets\/[^"'\x60\r\n)]+/g)].map(m => m[0])));
const report = { converted: [], unused: [], beforeBytes: 0, afterBytes: 0 };
for (const name of await readdir(root)) {
  const input = join(root,name);
  const originalBytes = (await stat(input)).size;
  if (!refs.has('/assets/'+name)) { report.unused.push({name,bytes:originalBytes}); continue; }
  report.beforeBytes += originalBytes;
  if (!/\.(png|jpe?g)$/i.test(name) || originalBytes < 40000) { report.afterBytes += originalBytes; continue; }
  const metadata = await sharp(input).metadata();
  // Text-heavy forms, instructions, profiles and results retain exact pixels.
  const lossless = /contract|rule|member|lyrics|profile|result|room-(en|th)|board|explaining/i.test(name);
  const outputName = name.slice(0,-extname(name).length)+'.webp';
  const output = join(root,outputName);
  try { await stat(output); throw new Error('Refusing to replace existing '+outputName); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const buffer = await sharp(input).webp({quality:90,alphaQuality:100,lossless,exact:true,effort:6}).toBuffer();
  if (buffer.length >= originalBytes * 0.95) { report.afterBytes += originalBytes; continue; }
  const converted = await sharp(buffer).metadata();
  if (metadata.width !== converted.width || metadata.height !== converted.height) throw new Error('Geometry changed: '+name);
  const before = await sharp(input).ensureAlpha().raw().toBuffer();
  const after = await sharp(buffer).ensureAlpha().raw().toBuffer();
  for (let i=3;i<before.length;i+=4) if (before[i] !== after[i]) throw new Error('Alpha changed: '+name);
  if (lossless) {
    if (!before.equals(after)) throw new Error('Lossless pixel check failed: '+name);
  }
  await writeFile(output,buffer);
  report.converted.push({name,outputName,before:originalBytes,after:buffer.length,width:metadata.width,height:metadata.height,lossless});
  report.afterBytes += buffer.length;
  for (const source of sources) source.text = source.text.replaceAll('/assets/'+name,'/assets/'+outputName);
  console.log(name+' -> '+outputName+' '+Math.round(buffer.length/originalBytes*100)+'%'+(lossless?' lossless':''));
}
for (const source of sources) await writeFile(source.path,source.text);
await mkdir('.wrangler',{recursive:true});
await writeFile('.wrangler/media-optimization.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({beforeMB:report.beforeBytes/1e6,afterMB:report.afterBytes/1e6,converted:report.converted.length,unused:report.unused.length}));
