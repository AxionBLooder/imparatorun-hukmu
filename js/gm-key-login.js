import {verifyKey} from './gm-key-client.js?v=gm-link-20261023';

const status=document.querySelector('#statusMessage');
const openBtn=document.querySelector('#openSavedGm');
const say=t=>{if(status)status.textContent=t};

async function enter(){
  say('Erişim kontrol ediliyor...');
  try{
    if(await verifyKey())location.replace('karakterler.html');
    else say('Bu cihazda GM erişimi henüz bulunamadı. Sana verilen özel GM bağlantısını aç.');
  }catch(e){say('Bağlantı hatası: '+e.message)}
}

if(openBtn)openBtn.onclick=enter;
enter();
