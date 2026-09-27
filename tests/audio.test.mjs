import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

test('one persistent switch mutes music, voice, current and reused effects', async () => {
  const storage = new Map([['red-contract-sound-enabled', 'false']]);
  globalThis.window = Object.assign(new EventTarget(), {localStorage:{
    getItem:key=>storage.get(key), setItem:(key,value)=>storage.set(key,value),
  }});
  const created=[];
  globalThis.Audio = class extends EventTarget {
    constructor(src) { super(); this.src=src; this.muted=false; this.paused=true; created.push(this); }
    play() { this.paused=false; return Promise.resolve(); }
    pause() { this.paused=true; }
  };
  const bundle=await build({entryPoints:['src/audio.ts'],bundle:true,format:'esm',write:false,
    plugins:[{name:'test-manifest',setup(build){
      build.onResolve({filter:/^virtual:site-assets$/},()=>({path:'manifest',namespace:'test'}));
      build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export default {assets:[],missing:[]}'}));
    }}]});
  const {createAudio,setSoundEnabled,isSoundEnabled,playSound,releaseAudio} =
    await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  assert.equal(isSoundEnabled(),false);
  const music=createAudio('music'),voice=createAudio('voice'),effect=createAudio('effect');
  assert.ok(created.every(audio=>audio.muted));
  setSoundEnabled(true);
  await Promise.all([music.play(),voice.play(),effect.play()]);
  assert.ok(created.every(audio=>!audio.muted));
  effect.dispatchEvent(new Event('ended'));
  setSoundEnabled(false);
  assert.ok(created.every(audio=>audio.muted));
  await effect.play();
  assert.ok(effect.muted);
  assert.ok(createAudio('new-effect').muted);
  const count=created.length;
  playSound('optional');
  assert.equal(created.length,count);
  assert.equal(storage.get('red-contract-sound-enabled'),'false');
  setSoundEnabled(true);
  assert.ok(created.every(audio=>!audio.muted));
  releaseAudio(music);
  assert.ok(music.paused);
  delete globalThis.window;
  delete globalThis.Audio;
});
