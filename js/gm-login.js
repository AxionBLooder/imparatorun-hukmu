const waitDb=()=>new Promise((resolve,reject)=>{if(window.IH?.db)return resolve(window.IH.db);const t=setTimeout(()=>reject(new Error('Canlı bağlantı açılamadı')),10000);addEventListener('ih-ready',()=>{clearTimeout(t);resolve(window.IH.db)},{once:true})});

(async()=>{
  const db=await waitDb();
  const email=document.querySelector('#gmAccount')?.value?.trim()||'';
  const status=document.querySelector('#statusMessage');
  const loginForm=document.querySelector('#gmLoginForm');
  const magicBtn=document.querySelector('#gmMagicButton');
  const setupPanel=document.querySelector('#passwordSetupPanel');
  const setupForm=document.querySelector('#passwordSetupForm');
  const goPanel=document.querySelector('#goPanel');
  const say=t=>{if(status)status.textContent=t};

  async function isGm(){
    const {data:{session}}=await db.auth.getSession();
    if(!session)return false;
    const {data:p}=await db.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
    return p?.role==='gm';
  }

  async function refreshUi(){
    if(await isGm()){
      setupPanel.hidden=false;
      say('GM oturumu açık. Şifreni belirleyebilir veya panele girebilirsin.');
      return true;
    }
    return false;
  }

  const params=new URLSearchParams(location.search);
  const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
  const authError=params.get('error_description')||hashParams.get('error_description');
  if(authError)say('Bağlantı hatası: '+authError);

  await refreshUi();

  db.auth.onAuthStateChange(async(event)=>{
    if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){
      await refreshUi();
    }
  });

  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const password=document.querySelector('#gmPassword').value;
    if(password.length<8)return say('Şifre en az 8 karakter olmalı.');
    say('Giriş yapılıyor...');
    const {error}=await db.auth.signInWithPassword({email,password});
    if(error)return say('Giriş hatası: '+error.message);
    if(!(await isGm())){await db.auth.signOut();return say('Bu hesap GM olarak yetkili değil.');}
    location.replace('karakterler.html');
  });

  magicBtn.addEventListener('click',async()=>{
    magicBtn.disabled=true;
    say('Giriş bağlantısı gönderiliyor...');
    const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('giris.html',location.href).href,shouldCreateUser:false}});
    say(error?('Hata: '+error.message):'Giriş bağlantısı gönderildi. En yeni bağlantıyı bu siteyi kullandığın aynı tarayıcıda aç.');
    magicBtn.disabled=false;
  });

  setupForm.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!(await isGm()))return say('Önce GM oturumu açılmalı.');
    const password=document.querySelector('#newPassword').value;
    if(password.length<8)return say('Yeni şifre en az 8 karakter olmalı.');
    const {error}=await db.auth.updateUser({password});
    if(error)return say('Şifre kaydedilemedi: '+error.message);
    say('GM şifresi kaydedildi. Bundan sonra şifreyle doğrudan giriş yapabilirsin.');
  });

  goPanel.addEventListener('click',()=>location.replace('karakterler.html'));
})().catch(e=>{const s=document.querySelector('#statusMessage');if(s)s.textContent='Hata: '+e.message});
