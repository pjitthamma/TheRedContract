import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access } from 'node:fs/promises';
import { build } from 'esbuild';

test('all four room bells point to their own restored game routes', async () => {
  const bundle = await build({entryPoints:['src/scenes.ts'],bundle:true,format:'esm',write:false});
  const {scenes} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
  for (const [room,id,path] of [['B-room','b-item-1','/b-mini-game'],['D-room','d-item-2','/d-mini-game'],
    ['S-room','s-item-2','/s-mini-game'],['M-room','m-item-2','/m-mini-game']]) {
    const bell = scenes[room].overlays.find(overlay => overlay.id===id);
    assert.deepEqual(bell.action,{type:'path',path,audioSrc:'/assets/bell-ring.mp3'});
    assert.match(bell.label,/Ring bell/);
  }
  await access('public/assets/event_poster.jpg');
  for (const scene of Object.values(scenes)) {
    assert.equal(scene.videoSrc, '');
    assert.ok(scene.posterSrc, scene.id);
    await access('public' + scene.posterSrc);
  }
});
