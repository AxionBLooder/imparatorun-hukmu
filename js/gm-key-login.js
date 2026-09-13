import {captureKey,verifyKey} from './gm-key-client.js';

const status=document.querySelector('#statusMessage');
const openBtn=document.querySelector('#openSavedGm');
const say=t=>{if(status)status.textContent=t};

async function enter(){
  const key=captureKey();
  if(!key){say('Bu cihazda GM erişimi bulunamadı.');return}
  say('Erişim kontrol ediliyor...');
  try{
    if(await verifyKey())location.replace('karakterler.html');
    else say('GM erişimi geçersiz veya yenilenmiş.');
  }catch(e){say('Bağlantı hatası: '+e.message)}
}

if(openBtn)openBtn.onclick=enter;
enter();
