import { assetUrl, isMissingAsset } from "./preloadAssets";
import { useSyncExternalStore } from "react";

const SOUND_KEY = "red-contract-sound-enabled";
const SOUND_EVENT = "red-contract-sound-change";
const unavailableSounds = new Set<string>();
const audioInstances = new Set<WeakRef<HTMLAudioElement>>();
let soundEnabled = true;
try { soundEnabled = window.localStorage.getItem(SOUND_KEY) !== "false"; } catch { /* Storage may be disabled. */ }

export const isSoundEnabled = () => soundEnabled;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try { window.localStorage.setItem(SOUND_KEY, String(enabled)); } catch { /* In-memory preference still works. */ }
  for (const ref of audioInstances) {
    const audio = ref.deref();
    if (audio) audio.muted = !enabled;
    else audioInstances.delete(ref);
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(SOUND_EVENT, listener);
  return () => window.removeEventListener(SOUND_EVENT, listener);
}

export const useSoundEnabled = () => useSyncExternalStore(subscribe, isSoundEnabled, () => true);

// Every music, voice and effect uses the same mute switch, including detached Audio objects.
export function createAudio(src: string) {
  const audio = new Audio(assetUrl(src));
  audio.muted = !soundEnabled;
  for (const ref of audioInstances) if (!ref.deref()) audioInstances.delete(ref);
  audioInstances.add(new WeakRef(audio));
  return audio;
}

export function releaseAudio(audio: HTMLAudioElement) {
  audio.pause();
  for (const ref of audioInstances) if (!ref.deref() || ref.deref() === audio) audioInstances.delete(ref);
}

// Missing optional effects and autoplay restrictions must not break navigation.
export function playSound(src: string) {
  if (!soundEnabled || unavailableSounds.has(src) || isMissingAsset(src)) return;
  const audio = createAudio(src);
  audio.addEventListener("error", () => unavailableSounds.add(src), { once: true });
  void audio.play().catch(() => {
    // Do not blacklist NotAllowedError: a later user gesture may permit playback.
    if (audio.error) unavailableSounds.add(src);
    releaseAudio(audio);
  });
}
