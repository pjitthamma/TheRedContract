# 0.1.6 — Event landing poster and restored host games

- Homepage entry opens the provided `public/assets/event_poster.jpg` in a native modal dialog over a dark, blurred backdrop. No image modification was made. It can be dismissed by its close button, Escape, or clicking outside the poster. Focus remains inside while open. The image fits both desktop and mobile. It opens on each fresh homepage entry, not on direct host-room/game routes or returning from a game to its room.
- Bells now navigate to `/b-mini-game`, `/d-mini-game`, `/s-mini-game`, and `/m-mini-game`, respectively. Room access checks remain in place; score access and writes still require the existing server-validated play token. Expired sessions offer a link to re-enter the invitation code.
- The original game assets, scoring and leaderboard are reused. Ringing the bell navigates immediately instead of waiting for the previously configured host audio sequence. Bell tracking requests use `keepalive` so page navigation does not cancel them.

Verification: build and 11 automated tests passed. Local browser QA logged into all four rooms, rang each bell, and confirmed the matching game and guest name. BlueRose's local test hit was saved and the back link returned to `/B-room`. A separate tab without room access was redirected away from a direct game URL. Poster close-button, Escape and backdrop dismissal were verified, including at 390×844 and desktop viewport sizes. No production test guest or score was created.

No Cloudflare production code, database schema, or source Supabase settings changed in this release.
