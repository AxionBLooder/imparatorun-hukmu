import {authClient,verifyKey} from './gm-key-client.js?v=gm-email-20261023';

const status=document.querySelector('#statusMessage');
const openBtn=document.querySelector('#openSavedGm');
const sendBtn=document.querySelector('#sendGmLink');
const verifyBtn=document.querySelector('#verifyGmOtp');
const emailInput=document.querySelector('#gmEmail');
const otpInput=document.querySelector('#gmOtp');
const say=t=>{if(status)status.textContent=t};
const email=()=>emailInput.value.trim().toLowerCase();

async function enter(){
  say('Erişim kontrol ediliyor...');
  try{
    if(await verifyKey())location.replace('karakterler.html');
    else say('GM oturumu bulunamadı. E-postana giriş bağlantısı gönderebilirsin.');
  }catch(e){say('Bağlantı hatası: '+e.message)}
}

async function sendLink(){
  if(!emailInput.reportValidity())return;
  sendBtn.disabled=true;
  say('Giriş bağlantısı gönderiliyor...');
  try{
    const db=await authClient();
    const redirect=location.origin+location.pathname;
    const {error}=await db.auth.signInWithOtp({email:email(),options:{emailRedirectTo:redirect,shouldCreateUser:false}});
    if(error)throw error;
    say('Giriş bağlantısı gönderildi. E-postandaki bağlantıyı aç; geri dönünce GM yetkin kontrol edilecek. (Spam klasörünü de kontrol edebilirsin.)');
  }catch(e){say('Giriş bağlantısı gönderilemedi: '+e.message)}
  finally{sendBtn.disabled=false}
}

async function verifyOtp(){
  if(!emailInput.reportValidity())return;
  const token=otpInput.value.trim();
  if(!/^\d{6,8}$/.test(token)){say('E-postadaki 6 haneli kodu yaz.');return}
  verifyBtn.disabled=true;
  say('Kod doğrulanıyor...');
  try{
    const db=await authClient();
    const {error}=await db.auth.verifyOtp({email:email(),token,type:'email'});
    if(error)throw error;
    await enter();
  }catch(e){say('Kod doğrulanamadı: '+e.message)}
  finally{verifyBtn.disabled=false}
}

if(openBtn)openBtn.onclick=enter;
if(sendBtn)sendBtn.onclick=sendLink;
if(verifyBtn)verifyBtn.onclick=verifyOtp;
enter();
