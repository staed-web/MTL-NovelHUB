import express from 'express';
import { load } from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import { Agent, EnvHttpProxyAgent, fetch as networkFetch } from 'undici';
import { StringDecoder } from 'node:string_decoder';
const app = express();
app.disable('x-powered-by');
const allowedOrigins = new Set((process.env.FRONTEND_ORIGINS || 'https://staed-web.github.io').split(',').map(s=>s.trim()).filter(Boolean));
app.use((req,res,next)=>{
 const origin=req.headers.origin;
 if(origin && allowedOrigins.has(origin)) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
 if(req.method==='OPTIONS')return res.sendStatus(origin && allowedOrigins.has(origin)?204:403);
 next();
});
app.use(express.json({limit:'100kb'}));
const languages = new Set(['en','es','fr','de','hi','pt','id','zh-CN','ja','ko']);
function isPrivate(ip) {
 try { return ipaddr.process(ip).range() !== 'unicast'; } catch { return true; }
}
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const proxyDispatcher = proxy ? new EnvHttpProxyAgent() : null;
const providerDispatcher = proxyDispatcher || new Agent();
async function publicFetch(url, options) {
 const records=await lookup(url.hostname,{all:true});
 if(records.some(r=>isPrivate(r.address)))throw new Error('Private network addresses cannot be imported.');
 const record=records[0];
 const dispatcher=proxyDispatcher || new Agent({connect:{lookup:(_host,_options,callback)=>callback(null,record.address,record.family)}});
 return networkFetch(url,{...options,dispatcher});
}
export async function validateUrl(value) {
 const u = new URL(value);
 if (!['http:','https:'].includes(u.protocol) || u.username || u.password || (u.port && !['80','443'].includes(u.port))) throw new Error('Use a public HTTP or HTTPS chapter URL.');
 const host=u.hostname.replace(/^\[|\]$/g,'');
 const addresses=isIP(host)?[{address:host}]:await lookup(host,{all:true});
 if(!addresses.length || addresses.some(a=>isPrivate(a.address))) throw new Error('Private network addresses cannot be imported.');
 return u;
}
app.get('/api/health',(_,res)=>res.json({ok:true,translationProvider:'MyMemory'}));
app.post('/api/import', async(req,res)=>{
 try {
  let url=await validateUrl(req.body.url), response;
  for(let i=0;i<5;i++) {
   response=await publicFetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'NovelHub/1.0 (chapter reader)'}});
   if([301,302,303,307,308].includes(response.status)){url=await validateUrl(new URL(response.headers.get('location'),url).href);continue;}
   break;
  }
  if(!response.ok) throw new Error('This site could not be imported. Paste the chapter text instead.');
  if(!(response.headers.get('content-type')||'').includes('text/html')) throw new Error('Please use a chapter webpage, not a file.');
  let html='',bytes=0; const decoder=new StringDecoder('utf8'); for await (const chunk of response.body){bytes+=chunk.length;if(bytes>2_000_000)throw new Error('This page is too large to import.'); html+=decoder.write(Buffer.from(chunk));} html+=decoder.end();
  const $=load(html); $('script,style,nav,footer,header,aside,form').remove();
  const title=$('h1').first().text().trim()||$('title').text().trim();
  const main=$('article, .chapter-content, #chaptercontent, #content, .entry-content, main').first();
  const body=main.length?main:$('body'); body.find('br').replaceWith('\n'); body.find('p').append('\n\n');
  const text=body.text().replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n\n').trim().slice(0,15000);
  if(text.length<40)throw new Error('No readable chapter found. This site may require JavaScript or login. Paste the text instead.');
  res.json({title,text,url:url.href});
 }catch(e){res.status(400).json({error:e.message});}
});
app.post('/api/translate',async(req,res)=>{
 const {text,target}=req.body;
 let source=req.body.source;
 if(source==='auto' && typeof text==='string'){source=/[\uac00-\ud7af]/.test(text)?'ko':/[\u3040-\u30ff]/.test(text)?'ja':/[\u3400-\u9fff]/.test(text)?'zh-CN':null;}
 if(typeof text!=='string'||!text.trim()||text.length>15000||!languages.has(source)||!languages.has(target)||source===target)return res.status(400).json({error:'Enter up to 15,000 characters and choose different source and target languages.'});
 try {
  const chunks=[];let chunk='';for(const character of text){if(Buffer.byteLength(chunk+character)>450){chunks.push(chunk);chunk='';}chunk+=character;}if(chunk)chunks.push(chunk);
  const result=[];
  for(const q of chunks){const url=new URL('https://api.mymemory.translated.net/get');url.searchParams.set('q',q);url.searchParams.set('langpair',`${source}|${target}`);
   const r=await networkFetch(url,{signal:AbortSignal.timeout(20000),dispatcher:providerDispatcher});if(!r.ok)throw new Error(r.status===403?'Access to the translation provider was denied. Check that api.mymemory.translated.net is allowed in network settings.':'Translation service is unavailable. Please try again later.');const data=await r.json();
   if(Number(data.responseStatus)!==200||data.quotaFinished)throw new Error(data.responseDetails||'The translation provider’s daily limit has been reached.');
   if(!data.responseData?.translatedText)throw new Error('The provider returned an empty translation.');result.push(data.responseData.translatedText);
  }
  res.json({text:result.join(''),provider:'MyMemory'});
 }catch(e){res.status(502).json({error:e.message==='fetch failed'?'Cannot reach the translation provider. Check network access to api.mymemory.translated.net and try again.':e.message});}
});

export default app;
