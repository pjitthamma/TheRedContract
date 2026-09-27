import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { tables } from './migration-data.mjs';

const [snapshot, remoteExport] = process.argv.slice(2);
if (!snapshot) throw new Error('Usage: node scripts/verify-migration.mjs snapshot-directory [remote-export.sql]');
const manifest = JSON.parse(await readFile(`${snapshot}/manifest.json`, 'utf8'));
const sourceSql = await readFile(`${snapshot}/data.sql`, 'utf8');
assert.equal(createHash('sha256').update(sourceSql).digest('hex'), manifest.sha256);
const expected = new DatabaseSync(':memory:');
expected.exec(await readFile('cloudflare/migrations/0001_initial.sql', 'utf8'));
expected.exec(await readFile('cloudflare/migrations/0002_preserve_legacy_names.sql', 'utf8'));
expected.exec(sourceSql);
const actual = remoteExport ? new DatabaseSync(':memory:') : expected;
if (remoteExport) actual.exec(await readFile(remoteExport, 'utf8'));
for (const [table, columns] of Object.entries(tables)) {
  const rows = actual.prepare(`SELECT ${columns.join(',')} FROM ${table} ORDER BY id`).all();
  assert.equal(rows.length, manifest.tables[table], `${table} count`);
  assert.deepEqual(rows, expected.prepare(`SELECT ${columns.join(',')} FROM ${table} ORDER BY id`).all(), `${table} contents`);
  console.log(`${table}: ${rows.length} rows; every migrated column matches`);
}
assert.deepEqual(actual.prepare('SELECT * FROM event_counts ORDER BY event_name').all(),
  expected.prepare('SELECT * FROM event_counts ORDER BY event_name').all());
assert.equal(actual.prepare('PRAGMA foreign_key_check').all().length, 0);
console.log('SHA256, complete row comparison, event counters and foreign keys: PASS');
if (actual !== expected) actual.close();
expected.close();
