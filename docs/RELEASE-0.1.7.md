# 0.1.7 — Post-event play

- All 18 scenes now use existing still images; background and transition videos are no longer rendered or fetched. Mini-game character animations remain.
- One persisted sound preference controls music, voices and effects, including sounds already playing and effects reused after a toggle.
- Wing code prompts and direct-room/game session gates removed. Initial invitation questionnaire, result card and code issuance are unchanged.
- Leaderboards load automatically and return every recorded entry, ordered by score. Lists scroll on desktop and mobile.
- Mini-game hits are in-memory only, start at zero per visit and never modify the final leaderboard. Old score-load, autosave and unload-save code removed.
- Worker score submission endpoint permanently returns HTTP 410; even older clients cannot add scores.
- Thai and English post-event notices appear at the bottom of all four games.

## Verification

- Build, API typecheck and Worker dry run passed.
- 12 automated tests passed, including all-room leaderboards with more than 10 entries, blocked submissions with unchanged database rows, sound mute/reuse, still-image assets and invitation registration.
- Live Cloudflare leaderboard compared against the original Supabase export: B 25, D 32, S 46, M 27 (130 total); no original name missing or score reduced.
- Local browser: direct room entry, wing entry without a code, bell navigation, in-memory hits and persisted mute tested. Mobile 390×844 layout inspected.

Worker deployed version: f2fbcd82-596a-471b-8680-6d2481bfb794.
No production score rows were inserted, updated or deleted during this release.
