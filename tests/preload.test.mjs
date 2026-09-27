import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { readFile, readdir } from 'node:fs/promises';

async function moduleFor(assets) {
  const bundle=await build({entryPoints:['src/preloadAssets.ts'],bundle:true,format:'esm',write:false,
    plugins:[{name:'manifest',setup(build){
      build.onResolve({filter:/^virtual:site-assets$/},()=>({path:'manifest',namespace:'test'}));
      build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export default '+JSON.stringify({assets,missing:[]})}));
    }}]});
  return import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
}

test('preloader waits for every asset, shares concurrent loads and retries only failures', async () => {
  const originalFetch=globalThis.fetch;
  const stored=new Map();
  const calls=new Map();
  let fail=true, decoded=0, active=0, maxActive=0;
  globalThis.window={caches:{open:async()=>({
    match:async key=>stored.get(key)?.clone(),
    put:async(key,response)=>{stored.set(key,response.clone());},
    delete:async key=>stored.delete(key),
  })}};
  globalThis.Image=class { async decode(){decoded++;} };
  globalThis.fetch=async url=>{
    calls.set(url,(calls.get(url)??0)+1);
    active++; maxActive=Math.max(maxActive,active);
    await new Promise(resolve=>setTimeout(resolve,2)); active--;
    if (fail && url.includes('bad')) return new Response('<html>',{headers:{'content-type':'text/html'}});
    return new Response('1234',{headers:{'content-type':'image/png'}});
  };
  try {
    const assets=['first.png','second.mp3','third.mp4','fourth.png','bad.png'].map(name=>({url:'/assets/'+name,bytes:4,hash:'1234'}));
    const api=await moduleFor(assets);
    const progress=[];
    const [failed,alsoFailed]=await Promise.all([
      api.preloadSiteAssets(p=>progress.push(p)),api.preloadSiteAssets(()=>{}),
    ]);
    assert.deepEqual(failed,['/assets/bad.png']);
    assert.deepEqual(alsoFailed,failed);
    assert.equal([...calls.values()].reduce((s,n)=>s+n,0),5);
    assert.ok(maxActive<=4);
    assert.equal(progress.at(-1).loadedCount,4);
    assert.equal(api.assetUrl('/assets/bad.png'),'/assets/bad.png');
    assert.match(api.assetUrl('/assets/first.png'),/^blob:/);
    fail=false;
    assert.deepEqual(await api.preloadSiteAssets(p=>progress.push(p)),[]);
    assert.equal(calls.get('/assets/first.png?asset=1234'),1);
    assert.equal(calls.get('/assets/bad.png?asset=1234'),2);
    assert.equal(progress.at(-1).loadedCount,5);
    assert.equal(progress.at(-1).loadedBytes,20);
    assert.equal(decoded,3);
    assert.equal(stored.size,5);
    await api.preloadSiteAssets(()=>{});
    assert.equal([...calls.values()].reduce((s,n)=>s+n,0),6);
  } finally { globalThis.fetch=originalFetch;delete globalThis.window;delete globalThis.Image; }
});

test('completed preload reuses cache and removes only obsolete media entries', async () => {
  const originalFetch=globalThis.fetch;
  const origin='https://example.test';
  const current=origin+'/assets/cached.mp3?asset=current';
  const obsolete=origin+'/assets/retired.png?asset=old';
  const stored=new Map([[current,new Response('1234')],[obsolete,new Response('old')]]);
  const deleted=[];
  globalThis.window={location:{origin},caches:{open:async()=>({
    match:async key=>stored.get(new URL(key,origin).href)?.clone(),
    keys:async()=>[...stored.keys()].map(url=>({url})),
    delete:async request=>{deleted.push(request.url);return stored.delete(request.url);},
    put:async()=>{throw new Error('Cache hit should not be rewritten');},
  })}};
  globalThis.fetch=async()=>{throw new Error('Cached asset should not be fetched');};
  try {
    const api=await moduleFor([{url:'/assets/cached.mp3',bytes:4,hash:'current'}]);
    assert.deepEqual(await api.preloadSiteAssets(()=>{}),[]);
    assert.deepEqual(deleted,[obsolete]);
    assert.ok(stored.has(current));
  } finally {globalThis.fetch=originalFetch;delete globalThis.window;}
});

test('asset manifest includes active game media but excludes retired background videos and sign',async()=>{
  const bundled=await build({entryPoints:['scripts/siteAssets.ts'],bundle:true,platform:'node',format:'esm',write:false});
  const {collectSiteAssets}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
  const {assets,missing}=collectSiteAssets(process.cwd());
  assert.ok(assets.length>100);
  assert.ok(assets.some(a=>a.url==='/assets/b-bot-start.mp4'));
  assert.ok(assets.some(a=>a.url==='/assets/event_poster.webp'));
  assert.ok(assets.reduce((sum,a)=>sum+a.bytes,0)<100_000_000, 'active assets stay below 100 MB');
  assert.deepEqual((await readdir('public/assets')).sort(),assets.map(a=>a.url.slice('/assets/'.length)).sort(), 'no unused files shipped in public/assets');
  assert.ok(!assets.some(a=>a.url==='/assets/landing-page.mp4'||a.url==='/assets/invitation-sign.png'));
  assert.ok(missing.every(url=>url.endsWith('.mp3')));
  const app=await readFile('src/App.tsx','utf8');
  assert.doesNotMatch(app,/invitation-sign-overlay|controller.abort\(\), 2500/);
  assert.ok(app.includes('preloadPublicData()'));
  assert.ok(app.includes('navigateTo(overlay.action.path)'));
});
