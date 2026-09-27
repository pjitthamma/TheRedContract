# Release 1.0.0

- Align the landing poster hotspot with the still-image poster, preserving full-screen scene geometry.
- Remove the duplicate invitation-sign overlay; retain the sign painted into the scene and the initial invitation flow.
- Gate entry on all 166 available active media assets (201.3 MB), decoded images, questionnaire, final leaderboards and export code. Show byte/file progress and retry failures instead of entering after a fixed timeout.
- Keep content-hashed media in persistent browser cache where available, with in-memory blob URLs for scene/game reuse. Retired background videos are excluded.
- Navigate between rooms and mini-games without reloading the document. Preserve original game dimensions, global mute and local-only hits.
- Nine optional sounds referenced by legacy code are absent from the repository; skip these rather than blocking entry indefinitely.
- No Cloudflare database or Worker changes.

Validation: 16 automated tests passed; production build passed. Local browser verification confirmed loader gating, corrected poster geometry, no duplicate sign, populated final leaderboard, and fully ready blob-backed game videos after room navigation.

Tradeoff: the first visit downloads about 201 MB before entry. Subsequent visits reuse persistent cache when the browser permits it. Live counters and invitation submissions still require connectivity.
