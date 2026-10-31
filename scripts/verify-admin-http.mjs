// Non-browser checks against a production build and a disposable QA account.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(path.join(process.cwd(),'package.json'));
const {encodeReply}=require('next/dist/compiled/react-server-dom-turbopack/client.node');
const {createClient}=require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd(),true);
assert.ok(process.env.AUTH_TEST_FIXTURE_FILE,'Set AUTH_TEST_FIXTURE_FILE to a private disposable QA account JSON file');
const fixture=JSON.parse(fs.readFileSync(process.env.AUTH_TEST_FIXTURE_FILE,'utf8'));
assert.ok(fixture.email?.endsWith('@example.invalid')&&fixture.id&&fixture.password,'Synthetic QA account required');
const citizen=process.argv.includes('--citizen');
const manifest=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8')).node;
const actionId=name=>Object.entries(manifest).find(([,v])=>v.exportedName===name)?.[0];
const base='http://127.0.0.1:3103',jar=new Map(),passed=[];
let output='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3103'],{stdio:['ignore','pipe','pipe']});
child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
async function request(url,options={}){
 const headers=new Headers(options.headers);if(jar.size)headers.set('Cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));
 const r=await fetch(base+url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(60000)});
 for(const cookie of r.headers.getSetCookie()){const [name,...value]=cookie.split(';')[0].split('=');const val=value.join('=');if(!val)jar.delete(name);else jar.set(name,val);}
 return r;
}
function form(values){const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;}
async function action(name,args){assert.ok(actionId(name),`built action ${name}`);return request('/admin',{method:'POST',headers:{'Next-Action':actionId(name),Accept:'text/x-component',Origin:base},body:await encodeReply(args)});}
const redirect=r=>r.headers.get('x-action-redirect')||r.headers.get('location')||'';
let api;
try{
 for(let i=0;i<100&&!output.includes('Ready');i++)await new Promise(r=>setTimeout(r,100));
 assert.ok(output.includes('Ready'));
 let r=await request('/admin');assert.equal(r.status,307);assert.ok(redirect(r).includes('/masuk'));passed.push('anonymous admin page denied');
 r=await request('/masuk',{method:'POST',headers:{'Next-Action':actionId('login'),Accept:'text/x-component',Origin:base},body:await encodeReply([{},form({email:fixture.email,password:fixture.password})])});assert.ok(redirect(r).includes('/dashboard'));
 if(citizen){
   r=await request('/admin');assert.equal(r.status,307);assert.ok(redirect(r).includes('akses-ditolak'));passed.push('citizen admin page denied');
   r=await action('lookupAccess',[{},form({email:fixture.email})]);assert.ok(redirect(r).includes('akses-ditolak'));passed.push('direct citizen admin action denied');
 }else{
   r=await request('/dashboard');assert.ok((await r.text()).includes('Buka pengelolaan admin'));passed.push('authorized dashboard navigation');
   r=await request('/admin');assert.equal(r.status,200);assert.ok(r.headers.get('cache-control').includes('no-store'));assert.ok((await r.text()).includes('Cari akun penerima akses'));passed.push('admin page and private cache headers');
   r=await action('lookupAccess',[{},form({email:'invalid'})]);assert.ok((await r.text()).includes('alamat email lengkap'));passed.push('lookup server validation');
   r=await action('lookupAccess',[{},form({email:fixture.email})]);assert.ok(redirect(r).includes(`user=${fixture.id}`));passed.push('exact email lookup through server action');
   r=await request(`/admin?user=${fixture.id}`);assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes('Synthetic QA Updated'));assert.ok(html.includes('memerlukan admin aktif lain'));assert.ok(html.includes('Lihat penerima penetapan'));passed.push('target detail, audit recipient links, grants and self-admin protection');
   r=await action('updateAccess',[{},form({operation:'grant_role',user_id:fixture.id,role:'super_admin'})]);assert.ok((await r.text()).includes('Pilih opsi yang tersedia'));passed.push('forged role rejected by server');
   r=await action('updateAccess',[{},form({operation:'grant_role',user_id:fixture.id,role:'program_admin',starts_at:'2026-10-30T21:00',reference:'QA-ONLY',verified:'on'})]);assert.ok((await r.text()).includes('Akses admin milikmu sendiri'));passed.push('database self-admin check through HTTP');
   api=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   const signed=await api.auth.signInWithPassword({email:fixture.email,password:fixture.password});assert.equal(signed.error,null);
   const allowed=await api.rpc('is_program_admin');assert.equal(allowed.error,null);assert.equal(allowed.data,true);
   const view=await api.rpc('admin_access',{p_operation:'overview'});assert.equal(view.error,null);assert.ok(Array.isArray(view.data.audit));passed.push('admin Data API RPC with user token');
   const profiles=await api.from('profiles').select('id');assert.equal(profiles.error,null);assert.deepEqual(profiles.data,[{id:fixture.id}]);passed.push('admin has no direct cross-user profile read');
   const token=signed.data.session.access_token;await api.auth.signOut({scope:'local'});
   const stale=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
   const denied=await stale.rpc('is_program_admin');assert.equal(denied.error,null);assert.equal(denied.data,false);passed.push('signed-out SDK token loses admin access');
 }
 r=await action('logout',[]);assert.ok(redirect(r).includes('/masuk'));
 r=await request('/admin');assert.equal(r.status,307);passed.push('admin page protected after logout');
 console.log(JSON.stringify({mode:citizen?'citizen':'admin',passed,not_tested:['browser layout and interactions','positive live writes (covered by rollback SQL instead)']}));
}catch(error){console.error(JSON.stringify({passed,error:error.message}));process.exitCode=1;}
finally{if(api)await api.auth.signOut({scope:'local'});child.kill();}
