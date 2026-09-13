const waitDb=()=>new Promise((resolve,reject)=>{if(window.IH?.db)return resolve(window.IH.db);const t=setTimeout(()=>reject(new Error('Canlı bağlantı açılamadı')),10000);addEventListener('ih-ready',()=>{clearTimeout(t);resolve(window.IH.db)},{once:true})});

(async()=>{
  const db=await waitDb();
  const form=document.querySelector('#recoverForm');
  const input=document.querySelector('#brokenUrl');
  const status=document.querySelector('#statusMessage');
  const say=t=>{if(status)status.textContent=t};

  async function verifyGm(){
    const {data:{session}}=await db.auth.getSession();
    if(!session)return false;
    const {data:profile}=await db.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
    return profile?.role==='gm';
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const raw=input.value.trim();
    if(!raw)return say('Localhost adresini yapıştır.');

    let parsed;
    try{parsed=new URL(raw)}catch{return say('Adres biçimi geçersiz. Tarayıcı adres çubuğundaki tam localhost adresini yapıştır.');}

    try{
      say('Oturum kurtarılıyor...');
      const hash=new URLSearchParams(parsed.hash.replace(/^#/,''));
      const query=parsed.searchParams;
      const accessToken=hash.get('access_token');
      const refreshToken=hash.get('refresh_token');
      const code=query.get('code');
      const errorDescription=hash.get('error_description')||query.get('error_description');

      if(errorDescription)return say('Bağlantı hatası: '+errorDescription);

      if(accessToken&&refreshToken){
        const {error}=await db.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
        if(error)throw error;
      }else if(code){
        const {error}=await db.auth.exchangeCodeForSession(code);
        if(error)throw error;
      }else{
        return say('Bu adreste oturum bilgisi bulunamadı. Mail linkini açtıktan sonra oluşan son localhost adresini yapıştır.');
      }

      if(!(await verifyGm())){
        await db.auth.signOut();
        return say('Bu oturum GM hesabına ait değil.');
      }

      input.value='';
      say('GM oturumu kurtarıldı. Şifre belirleme ekranına yönlendiriliyorsun...');
      setTimeout(()=>location.replace('giris.html'),500);
    }catch(err){
      say('Kurtarma hatası: '+(err?.message||'Bilinmeyen hata'));
    }
  });
})().catch(e=>{const s=document.querySelector('#statusMessage');if(s)s.textContent='Hata: '+e.message});
