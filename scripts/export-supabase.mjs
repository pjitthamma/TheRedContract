import { mkdir, open, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tables, convertRow } from './migration-data.mjs';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIGRATION_PROXY_URL, MIGRATION_EXPORT_TOKEN } = process.env;
if ((!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) && (!MIGRATION_PROXY_URL || !MIGRATION_EXPORT_TOKEN)) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the terminal environment. Never commit them.');
}
const origin = new URL(SUPABASE_URL || MIGRATION_PROXY_URL);
if (origin.protocol !== 'https:') throw new Error('Supabase export requires HTTPS');
const directory = `migration-private/${new Date().toISOString().replaceAll(':','-')}`;
await mkdir(directory, { recursive: true });
const sqlFile = await open(`${directory}/data.sql`, 'wx');
const hash = createHash('sha256');
const manifest = { source: origin.origin, createdAt: new Date().toISOString(), tables: {}, sessionsInvalidated: true };
const seenNames = new Set();
try {
  for (const table of Object.keys(tables)) {
    let count = 0;
    let expectedTotal;
    const snapshot = await open(`${directory}/${table}.jsonl`, 'wx');
    try {
      while (true) {
        const url = MIGRATION_PROXY_URL ? new URL(MIGRATION_PROXY_URL) : new URL(`/rest/v1/${table}`, origin);
        if (MIGRATION_PROXY_URL) url.searchParams.set('table',table);
        else {url.searchParams.set('select','*'); url.searchParams.set('order','id.asc');}
        url.searchParams.set('offset',String(count));
        url.searchParams.set('limit','500');
        const response = await fetch(url, { headers: MIGRATION_PROXY_URL ? { 'x-migration-token': MIGRATION_EXPORT_TOKEN } : {
          apikey: SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, prefer:'count=exact',
        }, signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Export failed for ${table}: HTTP ${response.status}`);
        const totalString = response.headers.get('content-range')?.split('/')[1];
        if (!totalString || !/^\d+$/.test(totalString)) throw new Error(`Missing exact count for ${table}`);
        const total = Number(totalString);
        if (expectedTotal !== undefined && total !== expectedTotal) throw new Error('Source changed during export; pause writes and restart');
        expectedTotal = total;
        const rows = await response.json();
        if (!Array.isArray(rows) || (!rows.length && count < total)) throw new Error(`Incomplete export for ${table}`);
        for (const original of rows) {
          const { row, sql } = convertRow(table, original, seenNames);
          await snapshot.writeFile(`${JSON.stringify(row)}\n`);
          await sqlFile.writeFile(sql);
          hash.update(sql);
        }
        count += rows.length;
        if (count % 10_000 === 0) console.log(`${table}: ${count}/${total} rows exported`);
        if (count >= total) break;
      }
    } finally { await snapshot.close(); }
    if (count !== expectedTotal) throw new Error(`Count mismatch for ${table}`);
    manifest.tables[table] = count;
    console.log(`${table}: ${count} rows`);
  }
  manifest.sha256 = hash.digest('hex');
  await writeFile(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2), { flag: 'wx' });
  console.log(`Export complete: ${directory}. Import only into a fresh D1 database after verifying the manifest.`);
} catch (error) {
  await writeFile(`${directory}/INCOMPLETE.txt`, 'Export failed. Do not import this directory. Restart with source writes paused.\n');
  throw error;
} finally { await sqlFile.close(); }
