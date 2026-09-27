import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

let mf, db, questions, saved;
async function call(endpoint, data, expected = 200, headers = {}) {
  const response = await mf.dispatchFetch(`https://test.local/api/${endpoint}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { origin: 'https://the-red-contract.netlify.app', 'content-type': 'application/json', ...headers },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  assert.equal(response.headers.get('cache-control')?.includes('public'), expected === 200 && ['get-questionnaire','get-counts','get-mini-game-leaderboard'].includes(endpoint.split('?')[0]));
  return result;
}
before(async () => {
  const bundled = await build({ entryPoints: ['cloudflare/src/index.ts'], bundle: true, format: 'esm', write: false });
  mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-27',
    d1Databases: ['DB'], bindings: { ALLOWED_ORIGINS: 'https://the-red-contract.netlify.app' } }));
  db = await mf.getD1Database('DB');
  const schema = await readFile('cloudflare/migrations/0001_initial.sql', 'utf8');
  // Keep the trigger body together when executing individual schema statements.
  const trigger = schema.match(/CREATE TRIGGER[\s\S]*?END;/)[0];
  for (const sql of schema.replace(trigger, '').split(';').filter(s => s.trim())) await db.prepare(sql).run();
  await db.prepare(trigger).run();
  const preservation = await readFile('cloudflare/migrations/0002_preserve_legacy_names.sql', 'utf8');
  for (const sql of preservation.split(';').filter(s => s.trim())) await db.prepare(sql).run();
  const seed = await readFile('supabase/questionnaire_seed.sql', 'utf8');
  for (const sql of seed.split(/\r?\n/).filter(s => s.startsWith('insert into '))) await db.prepare(sql).run();
});
after(async () => { await mf?.dispose(); });

test('questionnaire returns the original bilingual questions and choices', async () => {
  ({ questions } = await call('get-questionnaire'));
  assert.ok(questions.length >= 11);
  assert.ok(questions.every(q => q.text.th && q.text.en && q.choices.length));
});
function payload(guestName = 'ทดสอบ-Guest') {
  return { guestName, answeredDate: '2026-09-27', answers: questions.map(q => ({ questionId: q.id,
    choiceId: q.choices.find(c => !c.specialAction || c.specialAction === 'continue').id })) };
}
test('preview does not write; submission validates and saves a server-scored result', async () => {
  await call('check-guest-name', {guestName: 'ทดสอบ-Guest'});
  const preview = await call('preview-questionnaire-result', payload());
  assert.equal(await db.prepare('SELECT count(*) n FROM invitation_results').first('n'), 0);
  saved = await call('submit-questionnaire-result', {...payload(), invitationCode: preview.invitationCode});
  assert.deepEqual(saved.scores, preview.scores);
  assert.equal(saved.winningRoom, preview.winningRoom);
  assert.equal(saved.playToken.length, 64);
  await call('check-guest-name', {guestName: 'ทดสอบ-GUEST'}, 409);
  await call('submit-questionnaire-result', payload('ทดสอบ-GUEST'), 409);
});
test('duplicate, missing, cross-question, inactive and exit answers are rejected', async () => {
  const p = payload('Another');
  await call('submit-questionnaire-result', {...p, answers: p.answers.slice(1)}, 400);
  await call('submit-questionnaire-result', {...p, answers: p.answers.map(() => p.answers[0])}, 400);
  await call('submit-questionnaire-result', {...p, answers: p.answers.map((a,i) => i ? a : {...a, choiceId:p.answers[1].choiceId})}, 400);
  const exitQuestion = questions.find(q => q.choices.some(c => c.specialAction === 'too_young'));
  assert.ok(exitQuestion);
  await call('submit-questionnaire-result', {...p, answers: p.answers.map(a => a.questionId === exitQuestion.id ? {...a, choiceId: exitQuestion.choices.find(c=>c.specialAction==='too_young').id}:a)}, 400);
  await db.prepare('UPDATE questionnaire_choices SET active=0 WHERE id=?').bind(p.answers[0].choiceId).run();
  await call('submit-questionnaire-result', p, 400);
  await db.prepare('UPDATE questionnaire_choices SET active=1 WHERE id=?').bind(p.answers[0].choiceId).run();
  await call('submit-questionnaire-result', {...p, answeredDate:'2026-02-31'}, 400);
});
test('concurrent duplicate registration creates exactly one guest', async () => {
  const responses = await Promise.all([1,2].map(()=>mf.dispatchFetch('https://test.local/api/submit-questionnaire-result', {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload('Race')),
  })));
  assert.deepEqual(responses.map(r=>r.status).sort(), [200,409]);
});
test('atomic scores never decrease; tokens rotate and expired sessions cannot write', async () => {
  const query = new URLSearchParams({ roomKey:saved.winningRoom, guestName:saved.guestName, playToken:saved.playToken });
  assert.equal((await call(`get-mini-game-score?${query}`)).guestScore, 0);
  const p = {roomKey:saved.winningRoom, guestName:saved.guestName, playToken:saved.playToken};
  await Promise.all([100,20,80].map(clickCount => call('submit-mini-game-score',{...p,clickCount})));
  assert.equal((await call(`get-mini-game-score?${query}`)).guestScore,100);
  assert.equal((await call(`get-mini-game-leaderboard?roomKey=${saved.winningRoom}`)).leaderboard[0].score,100);
  await call('validate-invitation-code', {...p,invitationCode:'wrong'},403);
  const rotated=await call('validate-invitation-code',{...p,guestName:saved.guestName.toUpperCase(),invitationCode:saved.invitationCode.toLowerCase()});
  assert.notEqual(rotated.playToken,p.playToken);
  await call('submit-mini-game-score',{...p,clickCount:999},401);
  await call('submit-mini-game-score',{...p,playToken:rotated.playToken,clickCount:110});
  await db.prepare("UPDATE invitation_results SET active_play_expires_at='2000-01-01T00:00:00.000Z' WHERE guest_name=?").bind(saved.guestName).run();
  await call('submit-mini-game-score',{...p,playToken:rotated.playToken,clickCount:999},401);
  assert.equal(await db.prepare('SELECT click_count FROM mini_game_scores WHERE guest_name=?').bind(saved.guestName).first('click_count'),110);
});
test('legacy duplicate names survive and login updates exactly one matching invitation', async () => {
  await db.prepare(`INSERT INTO invitation_results (guest_name,guest_name_key,answered_date,answers,scores,winning_room,invitation_code)
    VALUES ('Legacy','legacy','2026-09-27','[]','{}','b','old-code'),('LEGACY','legacy','2026-09-27','[]','{}','b','old-code')`).run();
  await call('check-guest-name', {guestName:'legacy'},409);
  await call('submit-questionnaire-result',payload('legacy'),409);
  const login = await call('validate-invitation-code',{guestName:'legacy',roomKey:'b',invitationCode:'old-code'});
  assert.equal(await db.prepare('SELECT count(*) n FROM invitation_results WHERE active_play_token=?').bind(login.playToken).first('n'),1);
  assert.equal(await db.prepare("SELECT count(*) n FROM invitation_results WHERE guest_name_key='legacy'").first('n'),2);
});

test('counts update in the same transaction and include zero-valued events', async () => {
  await Promise.all([1,2,3].map(()=>call('track-event',{eventName:'door_clicked'})));
  const {counts}=await call('get-counts');
  assert.equal(counts.door_clicked,3);
  assert.equal(counts.club_visited,0);
  assert.equal(Object.keys(counts).length,34);
  await call('track-event',{eventName:'unknown'},400);
});
test('API rejects invalid JSON shapes, large payloads, disallowed origins and wrong methods',async()=>{
  await call('track-event',null,400);
  await call('track-event',{eventName:99},400);
  await call('track-event',{eventName:'x'.repeat(20_000)},413);
  await call('get-questionnaire',{},405);
  await call('get-questionnaire',undefined,403,{origin:'https://other.example'});
  const preflight=await mf.dispatchFetch('https://test.local/api/track-event',{method:'OPTIONS',headers:{origin:'https://the-red-contract.netlify.app'}});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('access-control-allow-origin'),'https://the-red-contract.netlify.app');
});
