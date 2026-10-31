// Production HTTP/SDK test; no browser. Only disposable example.invalid users.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {emptyDraftDocument} from '../src/lib/drafts/schema.mjs';
const require=createRequire(path.join(process.cwd(),'package.json'));
require('@next/env').loadEnvConfig(process.cwd(),true);
const {encodeReply}=require('next/dist/compiled/react-server-dom-turbopack/client.node');
const {createClient}=require('@supabase/supabase-js');
assert.ok(process.env.AUTH_TEST_FIXTURE_FILE,'Set AUTH_TEST_FIXTURE_FILE to a private synthetic account JSON');
const fixture=JSON.parse(fs.readFileSync(process.env.AUTH_TEST_FIXTURE_FILE,'utf8'));
assert.ok(fixture.email?.endsWith('@example.invalid')&&fixture.id&&fixture.password&&fixture.rtId&&fixture.themeId);
const actions=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8')).node;
const actionId=name=>Object.entries(actions).find(([,value])=>value.exportedName===name)?.[0];
const base='http://127.0.0.1:3105',jar=new Map(),passed=[];
let output='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3105'],{stdio:['ignore','pipe','pipe']});
child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
async function request(url,options={}){
 const headers=new Headers(options.headers);if(jar.size)headers.set('Cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));
 const response=await fetch(base+url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 for(const cookie of response.headers.getSetCookie()){const [name,...rest]=cookie.split(';')[0].split('=');const value=rest.join('=');if(value)jar.set(name,value);else jar.delete(name);}
 return response;
}
const redirect=r=>r.headers.get('x-action-redirect')||r.headers.get('location')||'';
function form(values){const result=new FormData();for(const [key,value] of Object.entries(values))result.set(key,String(value));return result;}
async function action(name,args,route='/pengajuan'){
 assert.ok(actionId(name),`built ${name}`);
 return request(route,{method:'POST',headers:{'Next-Action':actionId(name),Accept:'text/x-component',Origin:base},body:await encodeReply(args)});
}
const api=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
 global:{fetch:(url,options={})=>fetch(url,{...options,signal:options.signal??AbortSignal.timeout(90000)})},
 auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
});
try{
 for(let i=0;i<100&&!output.includes('Ready');i++)await new Promise(r=>setTimeout(r,100));
 assert.ok(output.includes('Ready'),'production server readiness');
 for(const url of ['/pengajuan','/profil/wilayah']){const r=await request(url);assert.equal(r.status,307);assert.ok(redirect(r).includes('/masuk'));}
 passed.push('anonymous draft and domicile pages protected');
 let r=await action('login',[{},form({email:fixture.email,password:fixture.password})],'/masuk');assert.ok(redirect(r).includes('/dashboard'));
 r=await request('/pengajuan');assert.equal(r.status,200);assert.ok((await r.text()).includes('Lengkapi kelurahan'));passed.push('profile domicile gate rendered');
 r=await action('saveDomicile',[{},form({rt_id:'forged'})],'/profil/wilayah');assert.ok((await r.text()).includes('Pilih kelurahan'));passed.push('invalid domicile rejected');
 r=await action('saveDomicile',[{},form({rt_id:fixture.rtId,owner_id:randomUUID()})],'/profil/wilayah');assert.ok((await r.text()).includes('"saved":true'));passed.push('own domicile saved through server action');
 r=await request('/profil/wilayah');assert.equal(r.status,200);assert.ok((await r.text()).includes('DEMO Kelurahan'));passed.push('cascading territory controls render selected domicile');
 const requestId=fixture.requestId??randomUUID();
 r=await action('createDraft',[{},form({request_id:requestId,owner_id:randomUUID(),status:'approved'})]);
 const match=redirect(r).match(/\/pengajuan\/([a-f0-9-]{36})/);assert.ok(match,'draft redirect');const draftId=match[1];
 r=await action('createDraft',[{},form({request_id:requestId})]);assert.ok(redirect(r).includes(draftId));passed.push('idempotent creation and safe redirect');
 r=await request('/pengajuan/'+draftId);assert.equal(r.status,200);assert.ok(r.headers.get('cache-control').includes('no-store'));const html=await r.text();assert.ok(html.includes('Susun inovasimu')&&html.includes('PRD inovasi')&&html.includes('RAB'));passed.push('private four-step editor renders');
 const document=emptyDraftDocument(fixture.rtId);document.innovation.title='DEMO Synthetic HTTP Draft';document.innovation.theme_id=fixture.themeId;
 document.budget.items=[{id:randomUUID(),description:'DEMO Bahan',category:'Bahan',unit:'kg',quantity:'abc',unit_price:'1001',usage_stage:'Pembuatan'}];
 r=await action('saveDraft',[{},form({id:draftId,revision:0,step:3,document:JSON.stringify(document)})],'/pengajuan/'+draftId);assert.ok((await r.text()).includes('Volume berupa angka'));passed.push('invalid RAB rejected by server');
 document.budget.items[0].quantity='0,125';document.prd.problem='DEMO synthetic problem';
 r=await action('saveDraft',[{},form({id:draftId,revision:0,step:1,intent:'continue',document:JSON.stringify(document)})],'/pengajuan/'+draftId);assert.ok((await r.text()).includes('"saved":true'));passed.push('all steps saved through HTTP');
 const signed=await api.auth.signInWithPassword({email:fixture.email,password:fixture.password});assert.equal(signed.error,null);
 let saved=await api.from('innovation_drafts').select('*').eq('id',draftId).single();assert.equal(saved.error,null);assert.equal(saved.data.owner_id,fixture.id);assert.equal(saved.data.status,'draft');assert.equal(saved.data.revision,1);assert.equal(saved.data.current_step,2);assert.equal(saved.data.document.budget.items[0].quantity,'0.125');passed.push('persisted owner, revision, resume step, and decimal values verified');
 const stale=structuredClone(document);stale.innovation.title='SHOULD NEVER OVERWRITE';
 r=await action('saveDraft',[{},form({id:draftId,revision:0,step:1,document:JSON.stringify(stale)})],'/pengajuan/'+draftId);assert.ok((await r.text()).includes('Draf sudah berubah'));passed.push('stale HTTP save rejected');
 const first=structuredClone(saved.data.document),second=structuredClone(saved.data.document);first.innovation.title='DEMO Concurrent A';second.innovation.title='DEMO Concurrent B';
 const writes=await Promise.all([first,second].map(doc=>api.rpc('write_innovation_draft',{operation:'save',payload:{id:draftId,revision:1,step:4,document:doc}})));
 assert.equal(writes.filter(result=>!result.error).length,1);assert.ok(writes.some(result=>result.error?.message==='DRAFT_CONFLICT'));passed.push('two simultaneous saves produce one winner and one conflict');
 saved=await api.from('innovation_drafts').select('revision,title,owner_id').eq('id',draftId).single();assert.equal(saved.data.revision,2);assert.ok(['DEMO Concurrent A','DEMO Concurrent B'].includes(saved.data.title));
 const direct=await api.from('innovation_drafts').update({status:'approved'}).eq('id',draftId);assert.ok(direct.error);passed.push('direct state escalation rejected');
 r=await request('/pengajuan/'+randomUUID());assert.equal(r.status,404);passed.push('unavailable draft uses 404');
 r=await request('/pengajuan');assert.ok((await r.text()).includes(saved.data.title));passed.push('saved draft reappears in own list');
 r=await action('logout',[]);assert.ok(redirect(r).includes('/masuk'));r=await request('/pengajuan/'+draftId);assert.equal(r.status,307);passed.push('editor protected after logout');
 console.log(JSON.stringify({passed,not_tested:['browser layout, keyboard, dirty-navigation dialog','actual cross-account browser UAT (covered by rollback SQL)','submission, file upload, and program review (not enabled)']}));
}catch(error){console.error(JSON.stringify({passed,error:error.message}));process.exitCode=1;}
finally{await api.auth.signOut({scope:'local'});child.kill();}
