// Warm only the initial scene's still image.
export async function preloadSiteAssets(
  onProgress: (loaded: number, total: number) => void,
  posterSrc: string | undefined,
  signal: AbortSignal,
) {
  const urls = [...new Set(["/assets/icon.png", posterSrc].filter((url): url is string => Boolean(url)))];
  let loaded = 0;
  onProgress(0, urls.length);
  await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { cache: "force-cache", signal });
      if (response.ok) await response.blob();
    } catch {
      // A failed image or timeout must never prevent entry.
    } finally {
      onProgress(++loaded, urls.length);
    }
  }));
}
