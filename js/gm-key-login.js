import {captureKey,verifyKey,clearKey} from './gm-key-client.js';

const status=document.querySelector('#statusMessage');
const openBtn=document.querySelector('#openSavedGm');
const say=t=>{if(status)status.textContent=t};

async function enter(){
  const key=captureKey();
  if(!key){say('GM paneli artık e-posta veya şifre istemez. Sana özel GM bağlantısını açman yeterli.');return}
  say('Özel GM anahtarı doğrulanıyor...');
  try{
    if(await verifyKey())location.replace('karakterler.html');
    else say('Kayıtlı GM anahtarı geçersiz. Yeni özel GM bağlantısını kullan.');
  }catch(e){say('Bağlantı hatası: '+e.message)}
}

if(openBtn)openBtn.onclick=enter;
enter();
