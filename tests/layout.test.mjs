import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

test('mini-game dimensions match the original desktop and mobile layout', async () => {
  const css = await readFile('src/styles.css','utf8');
  const block = selector => css.slice(css.indexOf(selector+' {')).split('}')[0];
  assert.match(block('.bot-test-stage'), /inset: 0;/);
  assert.doesNotMatch(block('.bot-test-stage'), /bottom:/);
  assert.match(block('.bot-test-side-video'), /bottom: 0;/);
  assert.match(block('.bot-test-side-video'), /width: 16rem;/);
  assert.match(block('.bot-test-leaderboard'), /height: min\(78vh, 48rem\);/);
  assert.match(block('.bot-test-leaderboard'), /width: min\(24vw, 22.5rem\);/);
  const mobile = css.slice(css.indexOf('@media (max-width: 720px)'));
  const board = mobile.slice(mobile.indexOf('.bot-test-leaderboard {')).split('}')[0];
  for (const value of ['top: auto;','right: 0.75rem;','bottom: 0.75rem;','width: auto;','max-height: 26vh;']) {
    assert.ok(board.includes(value),value);
  }
  assert.doesNotMatch(mobile,/\.bot-test-stage[^}]*bottom:\s*7rem/);
  const game = await readFile('src/BotClickTest.tsx','utf8');
  assert.match(game,/<\/main>\s*<p className="bot-test-event-notice">/);
  assert.doesNotMatch(game,/submit-mini-game-score/);
});

test('landing retains original full-screen 16:9 scene geometry and still-image rendering', async () => {
  const css=await readFile('src/styles.css','utf8');
  assert.match(css,/\.scene-stage\s*\{[^}]*width: 100vw;[^}]*height: 100vh;/);
  assert.ok(css.includes('width: max(100vw, calc(100vh * var(--scene-aspect-ratio)));'));
  assert.ok(css.includes('height: max(100vh, calc(100vw / var(--scene-aspect-ratio)));'));
  const scenes=await readFile('src/scenes.ts','utf8');
  assert.match(scenes,/atrium: \{[^}]*posterSrc: "\/assets\/outside.webp",[^}]*aspectRatio: 16 \/ 9,/);
});
