# Media cleanup after 1.0.0

## Measured payload

| Scope | Before | After |
| --- | ---: | ---: |
| Media preloaded before entry (166 files) | 201,300,369 bytes | 95,363,035 bytes |
| All public media | 350,065,249 bytes | 95,363,035 bytes |

Active transfer is reduced by 52.6%; the public media deployment is reduced by 72.8%.

- Converted 100 large PNG/JPEG images to WebP, keeping original pixel dimensions and alpha values. Photos/scenes use quality 90; text-heavy forms, rules, member information, lyrics, profiles, results and room descriptions use lossless encoding with a decoded pixel-equality check.
- Removed the 100 replaced originals and 42 files unreferenced by the runtime: retired scene/transition videos, redundant sounds/images, legacy public code text files, questionnaire workbook and outdated asset README. All originals can be recovered from Git commit b1a2ae3; no history was rewritten.
- Kept all active audio, game animation videos, questionnaire logic and final leaderboard data. No Worker/database changes.
- Kept the user's full-preload entry gate and version 1.0.0. Once preload succeeds, obsolete entries are removed only from this app's dedicated media cache.
- Fixed favicon references that previously pointed to a missing public-root icon.
- Added a 100 MB media budget and a check that every shipped asset is referenced. All 17 tests and the production build pass.

`scripts/optimize-images.mjs` documents the conversion settings and accepts the path to an installed `sharp` module. It never deletes originals itself; reviewed tracked files were removed separately after successful conversion and source remapping.

Chrome DevTools performance tools were unavailable; these numbers are actual file sizes, not Lighthouse or Core Web Vitals measurements. Browser QA checked the full preload gate and the landing appearance. Further major first-entry reductions would require relaxing the all-media-before-entry requirement, reducing image quality, or compressing active audio/video.
