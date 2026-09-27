# Refactor and Cloudflare migration — 2026-09-27

Frontend URL stays **https://the-red-contract.netlify.app/**. Netlify serves React/Vite and the existing media. Once migration is verified, the browser calls a Cloudflare Worker, which uses a D1 binding directly. No database credentials are shipped to the browser.

## Findings and implemented changes

| Area | Original behavior | Updated behavior |
| --- | --- | --- |
| Startup | Fetches nearly all media before rendering; also waits at least 900 ms | Warms just icon + initial scene poster, with a 2.5-second timeout; media loads in the scene that needs it |
| JavaScript | Single 291.90 KB entry bundle (90.04 KB gzip) | Approximately 256.5 KB entry (78.6 KB gzip), separate invitation/game/image-export chunks |
| Click tracking | Every click writes an event, then reloads counts using 34 Supabase HEAD requests | One write per click; optimistic local counters; initial counts read only |
| D1 counts | N/A | Trigger-maintained counters, one small SELECT regardless of event history size |
| Guest lookup | Transfers guest names to Node and filters them; affected by PostgREST row limits | Indexed normalized-name lookup, unique constraint enforced at insertion |
| Questionnaire | Fetch can replace/shuffle questions after answering starts | Waits for a complete question set before opening the quiz |
| Answer validation | Checks a minimum answer count; duplicates can be scored | Requires one active choice for each active question; rejects duplicate, cross-question and exit choices |
| Percentile calculation | Downloads peer result records | Aggregate in SQL without transferring peers' data |
| Score writes | Supabase-specific SQL function | Atomic D1 batch validating the token, retaining the maximum score, renewing the session |
| Failure behavior | Preview can fabricate a local result; cached invitation can bypass a server rejection | Error with retry; local invitation bypass restricted to localhost |

The media directory contains approximately 350 MB. Existing files and presentation are preserved. This is **not** a claim that the site now loads in a measured number of seconds: real mobile network measurements and production traffic verification remain to be done. The homepage poster and icon alone are about 2.9 MB; their compression, video encoding and R2 media hosting are worthwhile next steps.

## Database and API inventory

The original startup manifest lists 199 media files, totaling 345,682,711 bytes on disk. The new initial warm-up lists two images totaling 2,901,764 bytes. This comparison is **blocking preload volume**, not total bytes downloaded during the visit.

Nine referenced sounds are absent from the repository: `10.mp3`, `50.mp3`, `100.mp3`, `chain.mp3`, and `ran1.mp3`–`ran5.mp3`. Optional effect playback now handles failures and stops retrying unavailable effects during the visit; the missing audio itself must be restored from the original assets. Also, 162 npm-cache files are already tracked in the old repository despite `.gitignore`; removing those from version history/index is separate cleanup and was not performed here.

Browser QA completed locally: entrance → guest name → 11 questions → result preview → save → matched room. Test guest `Local-QA-927` exists only in the local D1 development database. Production migration status is recorded separately in `DEPLOYMENT-2026-09-27.md`.

Source: six Supabase tables in `supabase/schema.sql`: `site_events`, `questionnaire_questions`, `questionnaire_choices`, `invitation_codes`, `invitation_results`, `mini_game_scores`. D1 preserves these and adds `event_counts`. No Supabase Auth, Storage or Realtime usage was found in the application's source; media is under `public/assets`.

The Worker implements all ten existing endpoint names under `/api/` and `/.netlify/functions/`:

- GET: `get-questionnaire`, `get-counts`, `get-mini-game-score`, `get-mini-game-leaderboard`.
- POST: `track-event`, `check-guest-name`, `preview-questionnaire-result`, `submit-questionnaire-result`, `validate-invitation-code`, `submit-mini-game-score`.

All private responses are `no-store`. Only questionnaire, aggregate counts and leaderboard permit short browser caching. Only configured origins receive CORS access. CORS is not authentication. Play-token checks are enforced server-side on score access. Request bodies are limited to 16 KB; queries bind user values. Worker logs redact query strings because the legacy score-read contract includes its token in the URL.

The existing invitation system uses guest names + pooled invitation codes, not individual password accounts. The `/mini-game` admin screen is a client-side demo with score persistence disabled; its bundled codes are not secrets. Score values still come from the client, so this is not an anti-cheat system. These product semantics are preserved and should be reconsidered before adding prizes or private user content.

## Run locally

Requires Node.js 22+.

```powershell
npm ci
npm run db:local
npm run db:seed:local
npm run api:dev -- --var ALLOWED_ORIGINS:http://127.0.0.1:5173
```

In a second terminal:

```powershell
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8787/api'
npm run dev -- --port 5173 --strictPort
```

Local seed is for an empty development database only. It refuses to replace an existing questionnaire and has no remote mode. Never seed the production migration with repository sample data when preserving existing data.

Verification:

```powershell
npm test
npm run build
npm run api:check
npm run api:dry-run
npm audit
```

Tests execute actual SQLite/D1 behavior through Miniflare, not a mocked SQL client: all API routes, duplicate-name races, invalid answers, concurrent max-score updates, invalid/expired/rotated tokens, CORS, body limits and export normalization. They use isolated test data, not the live Supabase database.

## Production migration runbook

1. Obtain authorized source access securely. Do not put database credentials into chat, browser code, Git or any `VITE_` variable. The 2026-09-27 migration uses a temporary token-protected Netlify export function so the masked Supabase service-role key stays on Netlify. Remove that temporary deployment after verification.
2. Take a Supabase database backup. Pause **all** writes to the old database, including already-open browser tabs and direct Netlify Function calls. A frontend maintenance screen alone is insufficient. Keep the source read-only throughout export/import/cutover. The REST exporter is paginated and detects changing row counts, but it cannot provide a transaction snapshot or detect every concurrent update.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the terminal and run `npm run db:export`. This produces `migration-private/<timestamp>/data.sql`, table JSONL snapshots, and a manifest with exact counts and SQL SHA-256. Output is Git-ignored. Only use a directory with `manifest.json` and no `INCOMPLETE.txt`. Preserve this directory securely; it contains guest results and invitation codes.
4. The exporter rejects unsafe numeric values. It preserves IDs, answers and scores, normalizes timestamps to UTC milliseconds, and invalidates play sessions. Migration 0002 preserves pre-existing case-folded duplicate names without renaming/deleting guests. New registrations use an atomic conditional insert to reject new duplicates; login selects one matching name + room + code. Visitors will re-enter their name and invitation code after migration. Never import a partial export.
5. For a new deployment, create a D1 database with an appropriate location hint. This repository now contains the real production database ID; do not create or overwrite another database during routine frontend deployment.

   ```powershell
   npx wrangler d1 create the-red-contract --location apac
   npx wrangler d1 migrations apply the-red-contract --remote --config cloudflare/wrangler.jsonc
   npx wrangler d1 execute the-red-contract --remote --config cloudflare/wrangler.jsonc --file migration-private/EXPORT_TIMESTAMP/data.sql
   ```

6. Import only into the empty migrated database. The SQL deliberately uses INSERT, not REPLACE or conflict suppression. Do not rerun blindly after an import failure. Run `node scripts/verify-migration.mjs SNAPSHOT_DIRECTORY` locally before import. Export D1 after import and pass its SQL file as the second argument to compare every migrated column of every row, counters, foreign keys and snapshot SHA256. The import trigger builds counters automatically.
7. Deploy and verify the Worker while the frontend still points to the old API. Test CORS with the exact Netlify origin, existing-name/code lookup, questionnaire result parity, token rotation and an isolated test account. Avoid writing fake scores into the production leaderboard.

   ```powershell
   npx wrangler deploy --config cloudflare/wrangler.jsonc
   ```

8. Netlify's **build-time** `VITE_API_BASE_URL` is versioned in `netlify.toml`. It points to the Worker origin plus `/api`. The retained Netlify endpoint URLs proxy to Cloudflare for cached clients. `CLOUDFLARE_API_BASE_URL` can override the proxy default. The existing `the-red-contract.netlify.app` address stays the same. Preview origins are not automatically trusted.
9. Verify the deployed site, then resume writes on the new backend only. Keep old Functions/Supabase read-only during the transition: cached older clients can otherwise continue writing to the old database. Keep backups and the old source for a rollback window. Retire old credentials/services only after reconciliation and explicit operational confirmation.

## Rollback

Before any new D1 writes, the original Netlify deployment can be restored and `scripts/unfreeze-supabase.sql` can remove only this migration's write locks. Alternatively, set `RED_CONTRACT_BACKEND=supabase` for retained proxy functions and build the frontend with `VITE_API_BASE_URL=/.netlify/functions`. Once D1 has accepted writes, first lock writes and reconcile/export the new records. Restoring an old deployment or unlocking Supabase alone would split/lose visibility of new data. Never leave both sources writable.

## Billing and remaining work

Workers + D1 moves API/database usage to the Cloudflare account. Keeping the frontend/media on Netlify means Netlify hosting/bandwidth charges can still exist; this change cannot guarantee a single bill. R2 is a separate media-migration decision and has not been configured or uploaded to. Exact costs depend on requests, database size and media delivery.

References: [D1](https://developers.cloudflare.com/d1/), [D1 binding API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
