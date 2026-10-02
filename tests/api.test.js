import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const post=(endpoint,body)=>fetch(base+'/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('application serves the frontend',async()=>{const r=await fetch(base);assert.equal(r.status,200);assert.match(await r.text(),/NovelHub/);});
test('API health exposes translation provider',async()=>{const r=await fetch(base+'/api/health');assert.deepEqual(await r.json(),{ok:true,translationProvider:'MyMemory'});});
test('translation rejects invalid language and empty text',async()=>{for(const body of [{text:'',source:'ja',target:'en'},{text:'hello',source:'xx',target:'en'},{text:'hello',source:'en',target:'en'},{text:'a'.repeat(15001),source:'ja',target:'en'}]){const r=await post('translate',body);assert.equal(r.status,400);assert.ok((await r.json()).error);}});
test('import rejects private, encoded loopback, metadata and non-HTTP URLs',async()=>{for(const url of ['http://127.0.0.1/','http://2130706433/','http://169.254.169.254/','http://10.0.0.1/','http://[::1]/','file:///etc/passwd','http://user:password@example.com/']){const r=await post('import',{url});assert.equal(r.status,400);assert.ok((await r.json()).error);}});
