import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const [mode, base] = process.argv.slice(2);
if (!['capture','compare'].includes(mode) || !base?.startsWith('https://')) throw new Error('Usage: capture|compare https://API-base');
const endpoints = ['get-questionnaire','get-counts', ...['b','d','s','m'].map(room => `get-mini-game-leaderboard?roomKey=${room}`)];
const values = {};
for (const endpoint of endpoints) {
  const response = await fetch(`${base}/${endpoint}`, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status,200,endpoint);
  values[endpoint] = await response.json();
}
if (mode === 'capture') {
  await writeFile('migration-private/public-api-baseline.json', JSON.stringify(values), { flag:'wx' });
  console.log('Public API baseline captured without logging guest data');
} else {
  const expected = JSON.parse(await readFile('migration-private/public-api-baseline.json','utf8'));
  for (const endpoint of endpoints) {
    assert.deepEqual(values[endpoint],expected[endpoint],`${endpoint} parity`);
    console.log(`${endpoint}: identical to original Supabase response`);
  }
}
