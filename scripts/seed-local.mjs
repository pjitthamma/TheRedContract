import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// This command deliberately has no remote mode. Seed only an empty local database.
const args = ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'the-red-contract', '--local', '--config', 'cloudflare/wrangler.jsonc'];
const status = JSON.parse(execFileSync(process.execPath, [...args, '--command', 'SELECT count(*) AS n FROM questionnaire_questions', '--json'], { encoding: 'utf8' }));
if (status[0].results[0].n !== 0) throw new Error('Local questionnaire already exists; refusing to overwrite it.');
const source = await readFile('supabase/questionnaire_seed.sql', 'utf8');
const inserts = source.split(/\r?\n/).filter(line => line.startsWith('insert into '));
await mkdir('.wrangler', { recursive: true });
await writeFile('.wrangler/local-seed.sql', inserts.join('\n'));
execFileSync(process.execPath, [...args, '--file', '.wrangler/local-seed.sql', '--json'], { stdio: ['ignore', 'ignore', 'inherit'] });
console.log(`Seeded ${inserts.length} statements into local D1.`);
