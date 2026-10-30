import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(path.join(process.cwd(),'package.json'));
const {encodeReply}=require('next/dist/compiled/react-server-dom-turbopack/client.node');
const {createClient}=require('@supabase/supabase-js');
require('@next/env').loadEnvConfig(process.cwd(),true);
const fixturePath=process.env.AUTH_TEST_FIXTURE_FILE;
if(!fixturePath)throw new Error('Set AUTH_TEST_FIXTURE_FILE to a private JSON file for a disposable example.invalid test account.');
const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
assert.ok(typeof fixture.email==='string'&&fixture.email.endsWith('@example.invalid'),'Use a disposable synthetic example.invalid account only');
assert.ok(typeof fixture.password==='string'&&typeof fixture.id==='string','Fixture requires id, email and password');
const manifest=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8')).node;
const actionId=name=>Object.entries(manifest).find(([,v])=>v.exportedName===name)?.[0];
const base='http://127.0.0.1:3102';
const jar=new Map();let output='';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3102'],{stdio:['ignore','pipe','pipe']});
child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
const results=[];
async function request(url,options={}){
 const headers=new Headers(options.headers);if(jar.size)headers.set('Cookie',[...jar].map(([k,v])=>`${k}=${v}`).join('; '));
 const r=await fetch(base+url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(60000)});
 for(const cookie of r.headers.getSetCookie()){const [name,...value]=cookie.split(';')[0].split('=');const val=value.join('=');if(!val)jar.delete(name);else jar.set(name,val);}
 return r;
}
function form(data){const f=new FormData();Object.entries(data).forEach(([k,v])=>f.set(k,v));return f;}
async function action(name,args,route,origin=base){return request(route,{method:'POST',headers:{'Next-Action':actionId(name),Accept:'text/x-component',Origin:origin},body:await encodeReply(args)});}
try{
 for(let i=0;i<100&&!output.includes('Ready');i++)await new Promise(r=>setTimeout(r,100));
 assert.ok(output.includes('Ready'),'server readiness');
 let r=await request('/dashboard');assert.equal(r.status,307);assert.ok(r.headers.get('location').startsWith('/masuk'));results.push('anonymous dashboard denied');
 r=await action('login',[{},form({email:'invalid',password:''})],'/masuk');assert.equal(r.status,200);assert.ok((await r.text()).includes('alamat email yang valid'));results.push('server validation through HTTP');
 r=await action('login',[{},form({email:fixture.email,password:fixture.password})],'/masuk');
 assert.ok([200,303].includes(r.status),'login response');
 const redirect=r.headers.get('x-action-redirect')||r.headers.get('location')||'';
 assert.ok(redirect.includes('/dashboard'),'login redirect');assert.ok(jar.size>0,'session cookies written');results.push('email/password login writes SSR cookies');
 r=await request('/dashboard');let html=await r.text();assert.equal(r.status,200);assert.ok(html.includes('Synthetic HTTP QA')||html.includes('Synthetic QA Updated'));assert.ok(html.includes('Belum ada penetapan peran tambahan'));assert.ok(r.headers.get('cache-control').includes('no-store'));results.push('authenticated dashboard and private cache headers');
 r=await action('updateProfile',[{},form({display_name:'Synthetic QA Updated',user_id:'forged',role:'program_admin'})],'/dashboard');assert.ok([200,303].includes(r.status));assert.ok((r.headers.get('x-action-redirect')||r.headers.get('location')||'').includes('profil-disimpan'));results.push('profile update through user session');
 r=await action('updateProfile',[{},form({display_name:'CSRF SHOULD FAIL'})],'/dashboard','https://other-origin.example');assert.ok(r.status>=400,'cross-origin action rejected');results.push('cross-origin mutation rejected');
 r=await request('/dashboard');html=await r.text();assert.ok(html.includes('Synthetic QA Updated'));assert.ok(!html.includes('CSRF SHOULD FAIL'));results.push('profile change persisted, rejected mutation did not');
 const api=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const signed=await api.auth.signInWithPassword({email:fixture.email,password:fixture.password});assert.equal(signed.error,null,'SDK sign-in');
 const own=await api.from('profiles').select('id,display_name');assert.equal(own.error,null,'Data API read');assert.equal(own.data.length,1);assert.equal(own.data[0].id,fixture.id);
 const promoted=await api.from('platform_role_grants').insert({user_id:fixture.id,role:'program_admin',starts_at:new Date().toISOString(),appointment_reference:'SELF'});assert.ok(promoted.error,'self promotion rejected');
 await api.auth.signOut({scope:'local'});results.push('Data API identity works and rejects role self-assignment');
 r=await action('logout',[],'/dashboard');assert.ok([200,303].includes(r.status));assert.ok((r.headers.get('x-action-redirect')||r.headers.get('location')||'').includes('/masuk'));results.push('logout clears browser session');
 r=await request('/dashboard');assert.equal(r.status,307);results.push('dashboard protected after logout');
 r=await request('/auth/callback?next=https://evil.example');assert.equal(r.status,303);assert.ok(!r.headers.get('location').includes('evil.example'));results.push('callback rejects untrusted destination');
 console.log(JSON.stringify({passed:results,not_tested:['real email confirmation','real recovery email','browser visual/interactions']}));
}catch(error){console.error(JSON.stringify({passed:results,error:error.message}));process.exitCode=1;}
finally{child.kill();}
