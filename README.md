# The Red Contract

Interactive invitation experience built with React and Vite. The frontend stays on Netlify. A Cloudflare Workers + D1 backend is prepared alongside the legacy Netlify Functions/Supabase backend.

See [refactor findings, local setup and production migration runbook](docs/REFACTOR-AND-MIGRATION.md).

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Legacy Netlify Functions environment variables (emergency rollback only, with `RED_CONTRACT_BACKEND=supabase`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The frontend Cloudflare API URL is versioned in `netlify.toml`; cached clients using Netlify Functions are proxied to the same backend. See the migration report before changing backend settings or unlocking the old Supabase database. Private backups are Git-ignored under `migration-private/`.
