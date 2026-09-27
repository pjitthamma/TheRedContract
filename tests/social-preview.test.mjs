import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, stat } from 'node:fs/promises';

test('social crawlers receive static metadata and a small public JPEG without JavaScript', async () => {
  const html=await readFile('index.html','utf8');
  for (const property of ['og:type','og:title','og:description','og:url','og:image','og:image:type','og:image:width','og:image:height','og:image:alt']) {
    assert.ok(html.includes(`property="${property}"`),property);
  }
  assert.match(html,/name="twitter:card" content="summary_large_image"/);
  const image=html.match(/property="og:image" content="([^"]+)"/)[1];
  const url=new URL(image);
  assert.equal(url.origin,'https://the-red-contract.netlify.app');
  const file='public'+url.pathname;
  const bytes=await readFile(file);
  assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff');
  assert.ok((await stat(file)).size<300_000);
});
