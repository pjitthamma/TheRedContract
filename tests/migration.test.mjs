import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convertRow, sqlValue } from '../scripts/migration-data.mjs';

test('migration preserves Thai, apostrophes, JSON and timestamps; invalidates sessions', () => {
  const seen = new Set();
  const source = { id:1,guest_name:"ทดสอบ O'Neil",answers:[{questionId:'q01',choiceId:'q01_a'}],scores:{b:2,d:0,s:0,m:0},created_at:'2026-09-27T10:00:00+07:00',active_play_token:'secret' };
  const {row,sql} = convertRow('invitation_results',source,seen);
  assert.equal(row.guest_name_key,"ทดสอบ o'neil");
  assert.equal(row.active_play_token,null);
  assert.equal(row.created_at,'2026-09-27T03:00:00.000Z');
  assert.ok(sql.includes("ทดสอบ O''Neil"));
  assert.ok(!sql.includes('secret'));
  assert.deepEqual(row.answers,source.answers);
  const duplicate = convertRow('invitation_results',{...source,id:2,guest_name:"ทดสอบ O'NEIL"},seen);
  assert.equal(duplicate.row.guest_name,"ทดสอบ O'NEIL");
  assert.equal(duplicate.row.guest_name_key,row.guest_name_key);
  assert.equal(sqlValue(true),'1');
  assert.equal(sqlValue(false),'0');
  assert.throws(()=>sqlValue(Number.MAX_SAFE_INTEGER+1),/Unsafe/);
});
