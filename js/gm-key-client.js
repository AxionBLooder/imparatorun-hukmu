const FN='https://zhawcmqsbkmgjdhevtbl.supabase.co/functions/v1/';
const STORAGE='ih_gm_private_key';

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
export function clearKey(){localStorage.removeItem(STORAGE)}
export function logout(){clearKey();location.replace('giris.html')}

export async function verifyKey(){
  const key=captureKey();
  if(!key)return false;
  const r=await fetch(FN+'gm-key-list',{headers:{'x-gm-key':key},cache:'no-store'});
  if(!r.ok){if(r.status===403||r.status===404)clearKey();return false}
  return true;
}

export async function api(slug,body={}){
  const key=captureKey();
  if(!key){const e=new Error('GM özel bağlantısı gerekli.');e.code='NO_KEY';throw e}
  const r=await fetch(FN+slug,{method:'POST',headers:{'Content-Type':'application/json','x-gm-key':key},body:JSON.stringify(body),cache:'no-store'});
  let data={};try{data=await r.json()}catch{}
  if(r.status===403||r.status===404){clearKey();const e=new Error('GM özel bağlantısı geçersiz.');e.code='BAD_KEY';throw e}
  if(!r.ok)throw new Error(data.error||'GM işlemi başarısız.')
  return data;
}

export function requireKey(){
  if(!captureKey()){location.replace('giris.html');return false}
  return true;
}
