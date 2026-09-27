import manifest from "virtual:site-assets";

export type LoadingProgress = { loadedCount: number; totalCount: number; loadedBytes: number; totalBytes: number };
const readyAssets = new Map<string, string>();
const progressByUrl = new Map<string, number>();
const listeners = new Set<(progress: LoadingProgress) => void>();
let pending: Promise<string[]> | undefined;
const totalBytes = manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);

export const assetUrl = (src: string) => readyAssets.get(src) ?? src;
export const isMissingAsset = (src: string) => manifest.missing.includes(src);

function report() {
  const progress = { loadedCount: readyAssets.size, totalCount: manifest.assets.length,
    loadedBytes: [...progressByUrl.values()].reduce((sum, bytes) => sum + bytes, 0), totalBytes };
  for (const listener of listeners) listener(progress);
}

async function prepare(asset: typeof manifest.assets[number], cache?: Cache) {
  if (readyAssets.has(asset.url)) return;
  const key = asset.url + "?asset=" + asset.hash;
  let response = await cache?.match(key).catch(() => undefined);
  const fromCache = Boolean(response);
  let blob: Blob;
  if (response) {
    blob = await response.blob();
  } else {
    response = await fetch(key, { cache: "force-cache", signal: AbortSignal.timeout(180_000) });
    if (!response.ok || !response.body) throw new Error(asset.url);
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      progressByUrl.set(asset.url, Math.min(received, asset.bytes));
      report();
    }
    blob = new Blob(chunks, { type: response.headers.get("content-type") ?? "" });
  }
  if (blob.size !== asset.bytes || blob.type.includes("text/html")) {
    await cache?.delete(key).catch(() => false);
    throw new Error(asset.url);
  }
  const url = URL.createObjectURL(blob);
  try {
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(asset.url)) {
      const image = new Image();
      image.src = url;
      await image.decode();
    }
    if (!fromCache) await cache?.put(key, new Response(blob)).catch(() => {});
    readyAssets.set(asset.url, url);
    progressByUrl.set(asset.url, asset.bytes);
    report();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function preloadSiteAssets(onProgress: (progress: LoadingProgress) => void) {
  listeners.add(onProgress);
  report();
  if (!pending) {
    pending = (async () => {
      let cache: Cache | undefined;
      try { cache = await window.caches?.open("red-contract-assets-v1"); }
      catch { /* Some browsers disable persistent storage; in-memory assets still work. */ }
      const failures: string[] = [];
      let next = 0;
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (next < manifest.assets.length) {
          const asset = manifest.assets[next++];
          try { await prepare(asset, cache); }
          catch { failures.push(asset.url); progressByUrl.delete(asset.url); report(); }
        }
      }));
      // Retire only obsolete entries in this app's media cache, after a complete load.
      if (!failures.length && cache?.keys) {
        try {
          const current = new Set(manifest.assets.map(asset =>
            new URL(asset.url + "?asset=" + asset.hash, window.location.origin).href));
          for (const request of await cache.keys()) {
            if (!current.has(request.url)) await cache.delete(request);
          }
        } catch { /* Cache cleanup must never prevent entry. */ }
      }
      return failures;
    })().finally(() => { pending = undefined; });
  }
  try { return await pending; }
  finally { listeners.delete(onProgress); }
}
