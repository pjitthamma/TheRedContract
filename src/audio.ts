const unavailableSounds = new Set<string>();

// Missing optional effects and autoplay restrictions must not break navigation.
export function playSound(src: string) {
  if (unavailableSounds.has(src)) return;
  const audio = new Audio(src);
  audio.addEventListener("error", () => unavailableSounds.add(src), { once: true });
  void audio.play().catch(() => {
    // Do not blacklist NotAllowedError: a later user gesture may permit playback.
    if (audio.error) unavailableSounds.add(src);
  });
}
