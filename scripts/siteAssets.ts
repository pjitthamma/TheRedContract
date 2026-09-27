import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

export function collectSiteAssets(root: string) {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
  }
  const available = new Map(files(join(root, "public", "assets")).map(path =>
    ["/" + relative(join(root, "public"), path).replaceAll("\\", "/"), path]));
  const urls = new Set<string>();
  for (const path of files(join(root, "src")).filter(path => /\.(tsx?|css)$/.test(path))) {
    for (const match of readFileSync(path, "utf8").matchAll(/\/assets\/[^"'\x60\r\n)]+/g)) urls.add(match[0]);
  }
  const missing = [...urls].filter(url => !available.has(url)).sort();
  const missingRequired = missing.filter(url => !/\.(mp3|wav|ogg)$/i.test(url));
  if (missingRequired.length) throw new Error("Missing site assets: " + missingRequired.join(", "));
  const assets = [...urls].filter(url => available.has(url)).sort().map(url => {
    const path = available.get(url)!;
    return { url, bytes: statSync(path).size, hash: createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16) };
  });
  return { assets, missing };
}
