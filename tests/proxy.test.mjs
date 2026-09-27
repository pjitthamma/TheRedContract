import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

test('cached-client proxy normalizes the API prefix, forwards data and never falls back on failure', async () => {
  const bundle = await build({entryPoints:['netlify/shared/backend.ts'],bundle:true,format:'esm',write:false,platform:'node'});
  const {withBackend} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.CLOUDFLARE_API_BASE_URL;
  let legacyCalled = false;
  const handler = withBackend('track-event', async () => { legacyCalled = true; throw new Error('Legacy must not run'); });
  try {
    delete process.env.RED_CONTRACT_BACKEND;
    for (const base of [undefined,'https://the-red-contract-api.patboke-jit.workers.dev','https://the-red-contract-api.patboke-jit.workers.dev/api']) {
      if (base) process.env.CLOUDFLARE_API_BASE_URL = base;
      else delete process.env.CLOUDFLARE_API_BASE_URL;
      globalThis.fetch = async (url, options) => {
        assert.equal(url.pathname,'/api/track-event');
        assert.equal(url.searchParams.get('roomKey'),'b');
        assert.equal(options.body.toString(),'{}');
        return new Response('{"ok":true}', {headers:{'cache-control':'no-store'}});
      };
      const response = await handler({httpMethod:'POST',body:'e30=',isBase64Encoded:true,queryStringParameters:{roomKey:'b'}});
      assert.equal(response.statusCode,200);
    }
    globalThis.fetch = async () => { throw new Error('Offline'); };
    assert.equal((await handler({httpMethod:'GET',body:null})).statusCode,503);
    assert.equal(legacyCalled,false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.CLOUDFLARE_API_BASE_URL;
    else process.env.CLOUDFLARE_API_BASE_URL = originalBase;
  }
});
