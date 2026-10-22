const FN='https://zhawcmqsbkmgjdhevtbl.supabase.co/functions/v1/';
const SUPABASE_URL='https://zhawcmqsbkmgjdhevtbl.supabase.co';
// Supabase publishable key: tarayıcıda kullanılmak üzere tasarlanmıştır (service-role değildir).
const PUBLISHABLE_KEY='sb_publishable_k3-pXbc61FKhQMg1m7agIQ_VDJe9Xer';
const STORAGE='ih_gm_private_key';
const CACHE_PREFIX='ih_gm_api_cache:';
const CACHE_TTL=5000;
const inFlight=new Map();
let clientPromise;

export function authClient(){
  if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(({createClient})=>createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ih-gm-auth'}
    }));
  return clientPromise;
}

async function accessHeaders(){
  const db=await authClient();
  const {data:{session}}=await db.auth.getSession();
  if(session?.access_token)return {Authorization:'Bearer '+session.access_token};
  const key=captureKey();
  return key?{'x-gm-key':key}:null;
}

function clearApiCache(){
  try{
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i);
      if(k&&k.startsWith(CACHE_PREFIX))sessionStorage.removeItem(k);
    }
  }catch{}
}

function isReadOnly(slug,body){
  return (slug==='gm-key-characters'&&body?.action==='list')||
    (slug==='gm-key-details'&&!!body?.character_id)||
    (slug==='gm-key-glyphs'&&body?.action==='library');
}

function makeCacheKey(slug,body){return CACHE_PREFIX+slug+':'+JSON.stringify(body||{})}

function readCache(key){
  try{
    const raw=sessionStorage.getItem(key);if(!raw)return null;
    const hit=JSON.parse(raw);
    if(!hit||Date.now()-hit.t>CACHE_TTL){sessionStorage.removeItem(key);return null}
    return hit.data??null;
  }catch{return null}
}

function writeCache(key,data){try{sessionStorage.setItem(key,JSON.stringify({t:Date.now(),data}))}catch{}}

function warmNavigation(){
  try{
    if(!document.querySelector('link[data-ih-preconnect]')){
      const p=document.createElement('link');p.rel='preconnect';p.href='https://zhawcmqsbkmgjdhevtbl.supabase.co';p.crossOrigin='anonymous';p.dataset.ihPreconnect='1';document.head.appendChild(p);
    }
    const warm=()=>{
      document.querySelectorAll('.nav a[href]').forEach(a=>{
        const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;
        if(document.querySelector(`link[data-ih-prefetch="${CSS.escape(u.href)}"]`))return;
        const l=document.createElement('link');l.rel='prefetch';l.href=u.href;l.as='document';l.dataset.ihPrefetch=u.href;document.head.appendChild(l);
      });
    };
    document.querySelectorAll('.nav a[href]').forEach(a=>a.addEventListener('pointerenter',warm,{once:true,passive:true}));
    if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1200});else setTimeout(warm,250);
  }catch{}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',warmNavigation,{once:true});else warmNavigation();

export function captureKey(){
  const u=new URL(location.href);
  const incoming=u.searchParams.get('gm');
  if(incoming&&incoming.length>40){
    localStorage.setItem(STORAGE,incoming);
    u.searchParams.delete('gm');
    history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||''));
  }
  return localStorage.getItem(STORAGE)||'';
}

export function hasKey(){return !!captureKey()}
export function clearKey(){localStorage.removeItem(STORAGE);clearApiCache()}
export async function logout(){
  clearKey();
  try{const db=await authClient();await db.auth.signOut()}catch{}
  location.replace('giris.html');
}

export async function verifyKey(){
  const headers=await accessHeaders();
  if(!headers)return false;
  const r=await fetch(FN+'gm-key-list',{headers,cache:'no-store'});
  if(!r.ok){if('x-gm-key'in headers&&(r.status===403||r.status===404))clearKey();return false}
  return true;
}

export async function api(slug,body={}){
  const auth=await accessHeaders();
  if(!auth){const e=new Error('GM girişi gerekli.');e.code='NO_KEY';throw e}
  const readOnly=isReadOnly(slug,body);
  const cacheKey=readOnly?makeCacheKey(slug,body):'';
  if(readOnly){
    const cached=readCache(cacheKey);if(cached!==null)return cached;
    if(inFlight.has(cacheKey))return inFlight.get(cacheKey);
  }
  const run=(async()=>{
    const r=await fetch(FN+slug,{method:'POST',headers:{'Content-Type':'application/json',...auth},body:JSON.stringify(body),cache:'no-store',keepalive:true});
    let data={};try{data=await r.json()}catch{}
    if(r.status===403||r.status===404){if('x-gm-key'in auth)clearKey();const e=new Error('GM oturumu veya yetkisi geçersiz.');e.code='BAD_KEY';throw e}
    if(!r.ok)throw new Error(data.error||'GM işlemi başarısız.')
    if(readOnly)writeCache(cacheKey,data);else clearApiCache();
    return data;
  })();
  if(readOnly)inFlight.set(cacheKey,run);
  try{return await run}finally{if(readOnly)inFlight.delete(cacheKey)}
}

export async function requireKey(){
  if(!await accessHeaders()){location.replace('giris.html');return false}
  return true;
}
