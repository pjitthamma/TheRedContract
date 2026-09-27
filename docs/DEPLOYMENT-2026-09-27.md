# Production migration record — 2026-09-27

## Live services

- Frontend: https://the-red-contract.netlify.app/ (unchanged)
- API: https://the-red-contract-api.patboke-jit.workers.dev/api
- D1: `the-red-contract`, `dde559d5-2cc2-4fd5-a012-ee4f9ba9c93b`, APAC/Singapore
- Worker version at cutover: `ba08e594-e8ff-419d-9cd4-7322dfe12b61`
- Netlify cutover deploy: `6ab8ec339c6ca3c7116de8bb`, published 2026-09-27 10:20:23 UTC
- Original Netlify rollback deploy: `6a4e80d41d095200089d200f`
- Workers Paid was upgraded by the owner and confirmed in the dashboard before import.

## Data reconciliation

| Original table | Rows migrated |
| --- | ---: |
| questionnaire_questions | 11 |
| questionnaire_choices | 34 |
| invitation_codes | 80 |
| invitation_results | 653 |
| mini_game_scores | 130 |
| site_events | 114,229 |
| **Total original rows** | **115,137** |

Import used 460,537 D1 row writes including indexes/counters. Post-import database size: 15,364,096 bytes. The source remains retained, not deleted.

The original Supabase tables were locked against INSERT/UPDATE/DELETE/TRUNCATE with `scripts/freeze-supabase.sql` before authoritative export. This also blocks old immutable Netlify deployments from writing to the old database. An initial export detected pre-existing duplicate normalized names and stopped before import. Source writes were restored while migration 0002 was added, then locked again for the complete export. Every historical record/name is retained. New duplicate registrations are rejected atomically. Old play tokens are deliberately invalidated: existing visitors must enter their invitation code again. Timestamps are normalized to UTC millisecond precision.

Private, Git-ignored backups on the deployment machine:

`C:\Users\User\Desktop\WHIF\TheRedContract\migration-private\2026-09-27T10-16-34.502Z\`

Contains six JSONL snapshots, `data.sql`, `manifest.json`, and a full post-import `d1-verified.sql` export. These contain private guest results/invitation codes; do not publish or commit them. Incomplete earlier export folders contain `INCOMPLETE.txt` and must never be imported.

Snapshot SQL SHA256: `7dd2e8a6570091fb2f3b0fc7ad5b6203554d8cbecdc03f4b856431b58d869257`.

Verification completed before enabling writes:

- Exported the actual remote D1 database back to disk and compared every migrated column of every row to the normalized source snapshot: PASS.
- Snapshot SHA256, table counts, foreign keys and trigger-built event counters: PASS.
- Questionnaire, aggregate counts and all four leaderboards matched original Supabase API responses exactly, including through the compatibility Netlify proxies: PASS.
- Production scoring preview, CORS/preflight, private no-store and foreign-origin rejection: PASS. No fake guest or score was added.
- Live browser homepage → front door → invitation prompt: PASS, no console warnings/errors observed. The two genuine QA visit/door events increased D1 history and counters from 114,229 to 114,231; guests remained 653 and score rows 130.
- Temporary token-protected exporter deploy `6ab8e9a1b824cd6715ed648e` was deleted after verification. Its URL returns HTTP 404 even with the task token. Database keys were not exposed to the frontend.

## Deployment and rollback safety

`netlify.toml` versions the frontend API URL. Netlify Functions proxy old cached clients to Cloudflare by default, accepting either the Worker origin or `/api` base. Explicit `RED_CONTRACT_BACKEND=supabase` is required for source rollback; there is no automatic fallback after an API error. The CLI's environment setter returned without saving new values, so the tested/versioned configuration is used instead.

Cloudflare is now writable (`READ_ONLY=false`), while Supabase remains read-only. **Do not simply restore the old deployment or run the unfreeze script now:** new D1 writes must first be exported/reconciled. See `REFACTOR-AND-MIGRATION.md` for the rollback procedure.

Do not delete the Supabase project or its credentials until the owner is satisfied with the migration and the rollback retention window. No R2 media migration, Supabase cancellation or other account's database changes were performed. Frontend/media still use Netlify, so Netlify charges may remain separate from Cloudflare.
