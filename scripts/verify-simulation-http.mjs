// Production HTTP/SDK test. Real RT-user interaction is left to human UAT;
// positive/negative RT authorization and note writes are tested in rollback SQL.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {completeDemoDocument} from '../tests/simulation-fixture.mjs';
const require=createRequire(path.join(process.cwd(),'package.json'));
require('@next/env').loadEnvConfig(process.cwd(),true);
const {encodeReply}=require('next/dist/compiled/react-server-dom-turbopack/client.node');
const {createClient}=require('@supabase/supabase-js');
assert.ok(process.env.AUTH_TEST_FIXTURE_FILE,'Private synthetic fixture JSON required');
const fixture=JSON.parse(fs.readFileSync(process.env.AUTH_TEST_FIXTURE_FILE,'utf8'));
assert.ok(fixture.email?.endsWith('@example.invalid')&&fixture.id&&fixture.password&&fixture.rtId&&fixture.themeId);
const manifest=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8')).node;
const actionId=name=>Object.entries(manifest).find(([,v])=>v.exportedName===name)?.[0];
const api=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{global:{fetch:(url,options={})=>fetch(url,{...options,signal:options.signal??AbortSignal.timeout(60000)})},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const base='http://127.0.0.1:3106',jar=new Map(),passed=[];
let output='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3106'],{stdio:['ignore','pipe','pipe']});
child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
async function request(url,options={}){
 const headers=new Headers(options.headers);if(jar.size)headers.set('Cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));
 const r=await fetch(base+url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 for(const cookie of r.headers.getSetCookie()){const [name,...parts]=cookie.split(';')[0].split('=');const value=parts.join('=');if(value)jar.set(name,value);else jar.delete(name);}
 return r;
}
const redirect=r=>r.headers.get('x-action-redirect')||r.headers.get('location')||'';
function form(values){const f=new FormData();Object.entries(values).forEach(([k,v])=>f.set(k,String(v)));return f;}
async function action(name,args,route){assert.ok(actionId(name),`built ${name}`);return request(route,{method:'POST',headers:{'Next-Action':actionId(name),Accept:'text/x-component',Origin:base},body:await encodeReply(args)});}
try{
 for(let i=0;i<100&&!output.includes('Ready');i++)await new Promise(r=>setTimeout(r,100));
 assert.ok(output.includes('Ready'));
 for(const url of ['/antrean/rt','/simulasi/'+randomUUID()]){const r=await request(url);assert.equal(r.status,307);assert.ok(redirect(r).includes('/masuk'));}passed.push('anonymous queue and snapshot routes protected');
 const login=await api.auth.signInWithPassword({email:fixture.email,password:fixture.password});assert.equal(login.error,null);
 let result=await api.rpc('write_innovation_draft',{operation:'domicile',payload:{rt_id:fixture.rtId}});assert.equal(result.error,null);
 const drafts=await api.from('innovation_drafts').select('id,revision');const previous=await api.from('innovation_simulations').select('draft_id');assert.equal(drafts.error,null);assert.equal(previous.error,null);
 let draft={data:drafts.data.find(row=>!previous.data.some(sim=>sim.draft_id===row.id))??null};
 if(!draft.data){const created=await api.rpc('write_innovation_draft',{operation:'create',payload:{request_id:randomUUID()}});assert.equal(created.error,null);draft={data:{id:created.data.id,revision:created.data.revision}};}
 const doc=completeDemoDocument(fixture.rtId,fixture.themeId),draftId=draft.data.id;
 const saved=await api.rpc('write_innovation_draft',{operation:'save',payload:{id:draftId,revision:draft.data.revision,step:4,document:doc}});assert.equal(saved.error,null);const revision=saved.data.revision;
 let r=await action('login',[{},form({email:fixture.email,password:fixture.password})],'/masuk');assert.ok(redirect(r).includes('/dashboard'));
 r=await request('/antrean/rt');assert.equal(r.status,200);assert.ok((await r.text()).includes('memerlukan mandat utama RT'));passed.push('ordinary owner cannot open staff queue');
 r=await request('/pengajuan/'+draftId);assert.equal(r.status,200);assert.ok((await r.text()).includes('Kirim simulasi ke antrean RT'));passed.push('saved complete draft renders simulation-sharing controls');
 r=await action('submitSimulation',[{},form({draft_id:draftId,revision})],'/pengajuan/'+draftId);assert.ok((await r.text()).includes('Konfirmasikan'));passed.push('explicit sharing acknowledgement required');
 r=await action('submitSimulation',[{},form({draft_id:draftId,revision:revision-1,acknowledged:'on'})],'/pengajuan/'+draftId);assert.ok((await r.text()).includes('Draf sudah berubah'));passed.push('stale source revision rejected');
 r=await action('submitSimulation',[{},form({draft_id:draftId,revision,acknowledged:'on',owner_id:randomUUID(),status:'approved'})],'/pengajuan/'+draftId);
 const match=redirect(r).match(/\/simulasi\/([a-f0-9-]{36})/);assert.ok(match,'snapshot redirect');const simulationId=match[1];passed.push('acknowledged DEMO submit creates snapshot');
 r=await action('submitSimulation',[{},form({draft_id:draftId,revision,acknowledged:'on'})],'/pengajuan/'+draftId);assert.ok(redirect(r).includes(simulationId));passed.push('duplicate submit returns same snapshot');
 r=await request('/simulasi/'+simulationId);assert.equal(r.status,200);assert.ok(r.headers.get('cache-control').includes('no-store'));let html=await r.text();assert.ok(html.includes('SALINAN SIMULASI DEMO')&&html.includes(doc.innovation.title));assert.ok(html.includes('Belum ada pemegang mandat utama RT'));assert.ok(!html.includes('Tambah catatan awal RT'));passed.push('owner snapshot is private and missing-RT routing is visible');
 const changed=structuredClone(doc);changed.innovation.title='DEMO source changed after submit';
 const edited=await api.rpc('write_innovation_draft',{operation:'save',payload:{id:draftId,revision,step:4,document:changed}});assert.equal(edited.error,null);
 const snapshot=await api.from('innovation_simulations').select('owner_id,document,status,mode,draft_revision').eq('id',simulationId).single();assert.equal(snapshot.error,null);assert.equal(snapshot.data.owner_id,fixture.id);assert.equal(snapshot.data.status,'waiting_rt');assert.equal(snapshot.data.mode,'demo');assert.equal(snapshot.data.document.innovation.title,doc.innovation.title);assert.equal(snapshot.data.draft_revision,revision);passed.push('source edits do not mutate shared snapshot');
 const mutation=await api.from('innovation_simulations').update({status:'approved'}).eq('id',simulationId);assert.ok(mutation.error);passed.push('direct approval and snapshot mutation denied');
 r=await action('saveRtNote',[{},form({id:simulationId,request_id:randomUUID(),body:'DEMO unauthorized note',conflict:'none'})],'/simulasi/'+simulationId);assert.ok((await r.text()).includes('mandat utama RT'));passed.push('owner direct RT-note action denied');
 r=await request('/pengajuan');assert.ok((await r.text()).includes('Lihat salinan simulasi DEMO'));passed.push('own draft list links to simulation history');
 r=await request('/simulasi/'+randomUUID());assert.equal(r.status,404);passed.push('missing or inaccessible snapshot uses 404');
 r=await action('logout',[],'/simulasi/'+simulationId);assert.ok(redirect(r).includes('/masuk'));r=await request('/simulasi/'+simulationId);assert.equal(r.status,307);passed.push('snapshot protected after logout');
 console.log(JSON.stringify({passed,not_tested:['staff HTTP UI using a second real login (authorization/note positives covered in rollback SQL)','browser visual, hydration, keyboard and consent checkbox interactions','official submission, RT/RW decisions and financial approvals (not enabled)']}));
}catch(error){console.error(JSON.stringify({passed,error:error.message}));process.exitCode=1;}
finally{await api.auth.signOut({scope:'local'});child.kill();}
