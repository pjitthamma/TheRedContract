import assert from 'node:assert/strict';
const base = 'https://the-red-contract-api.patboke-jit.workers.dev/api';
const origin = 'https://the-red-contract.netlify.app';
const q = await fetch(`${base}/get-questionnaire`,{headers:{origin}});
assert.equal(q.headers.get('access-control-allow-origin'),origin);
const {questions} = await q.json();
assert.equal(questions.length,11);
const preview = await fetch(`${base}/preview-questionnaire-result`,{
  method:'POST',headers:{origin,'content-type':'application/json'},
  body:JSON.stringify({guestName:'Migration-QA',answeredDate:'2026-09-27',answers:questions.map(q => ({questionId:q.id,
    choiceId:q.choices.find(c => !c.specialAction || c.specialAction==='continue').id}))}),
});
assert.equal(preview.status,200);
assert.equal(preview.headers.get('cache-control'),'no-store');
const result = await preview.json();
assert.ok(['b','d','s','m'].includes(result.winningRoom));
assert.ok(result.invitationCode);
const preflight = await fetch(`${base}/track-event`,{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST'}});
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
const forbidden = await fetch(`${base}/get-questionnaire`,{headers:{origin:'https://untrusted.example'}});
assert.equal(forbidden.status,403);
console.log('Production: 11 questions, read-only scored preview, private no-store, CORS/preflight and rejected foreign origin PASS. No guest registration or score created.');
