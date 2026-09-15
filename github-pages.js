/* VORTEXUS 26 — GitHub Pages + Firebase shared media backend */
(() => {
  'use strict';
  const JURUSAN={PPLDG26:'PPLDG 26',OTOMOTIF26:'OTOMOTIF 26',ATPH26:'ATPH 26',BUSANA26:'BUSANA 26',SEMUA:'Semua Jurusan / Gabungan',LAINNYA:'Lainnya'};
  const CLASSES=['PPLDG26','OTOMOTIF26','ATPH26','BUSANA26'];
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const configured=()=>window.VORTEXUS_FIREBASE_CONFIG && !String(window.VORTEXUS_FIREBASE_CONFIG.apiKey||'').startsWith('ISI_') && window.firebase;
  let db=null, auth=null, firebaseReady=false;
  let authStatePromise=null;
  const waitForAuthUser=()=>{
    if(!firebaseReady||!auth) return Promise.resolve(null);
    if(auth.currentUser) return Promise.resolve(auth.currentUser);
    if(authStatePromise) return authStatePromise;
    authStatePromise=new Promise(resolve=>{
      let finished=false;
      const unsub=auth.onAuthStateChanged(user=>{
        if(finished)return; finished=true; unsub(); resolve(user||null);
      });
      setTimeout(()=>{if(finished)return; finished=true; try{unsub()}catch(e){} resolve(auth.currentUser||null)},5000);
    }).finally(()=>{authStatePromise=null});
    return authStatePromise;
  };
  const cloudinaryReady=()=>window.VORTEXUS_CLOUDINARY && window.VORTEXUS_CLOUDINARY.cloudName && window.VORTEXUS_CLOUDINARY.uploadPreset;
  if(configured()){
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.VORTEXUS_FIREBASE_CONFIG);
      auth=firebase.auth(); db=firebase.firestore(); firebaseReady=true;
    }catch(e){console.error(e)}
  }
  const loginClass=()=>localStorage.getItem('vortexus_session')||'';
  const setClass=cls=>localStorage.setItem('vortexus_session',cls);
  const logout=async()=>{try{if(auth&&auth.currentUser) await auth.signOut()}catch(e){} localStorage.removeItem('vortexus_session'); location.href='login.html'};
  const fmtDate=t=>new Date(t?.toDate?t.toDate():t).toLocaleString('id-ID');
  const storageExt=f=>{const n=f.name.toLowerCase(); if(f.type==='image/png')return 'png'; if(f.type==='image/webp')return 'webp'; if(f.type==='video/webm')return 'webm'; if(f.type==='video/quicktime')return 'mov'; return n.split('.').pop()||'bin'};
  const backendError=()=>!firebaseReady?'Backend online belum dikonfigurasi. Isi firebase-config.js lalu upload ulang ke GitHub Pages.':'';

  async function ensureAuth(){
    if(!firebaseReady) throw new Error(backendError());
    if(auth.currentUser) return auth.currentUser;
    // Public visitors can read approved media without logging in. Upload requires a real class account.
    return null;
  }

  function makeCard(m){
    const url=m.fileUrl, date=fmtDate(m.createdAt), article=document.createElement('article');
    article.className='media-card'; article.dataset.category=m.category; article.dataset.jurusan=m.jurusan;
    article.dataset.search=(m.title+' '+m.uploader+' '+(JURUSAN[m.jurusan]||'')).toLowerCase();
    if(m.type==='photo') article.innerHTML=`<button type="button" class="media-open" aria-label="Buka foto"><img src="${esc(url)}" alt="${esc(m.title)}" loading="lazy"></button><div class="card-info"><div><b>${esc(m.title)}</b><span>${esc(m.uploader)} · ${esc(date)}</span></div><em>${esc(JURUSAN[m.jurusan]||'Lainnya')}</em></div>`;
    else article.innerHTML=`<video controls preload="metadata" playsinline src="${esc(url)}"></video><div class="card-info"><div><b>${esc(m.title)}</b><span>${esc(m.uploader)} · ${esc(date)}</span></div><em>${esc(JURUSAN[m.jurusan]||'Lainnya')}</em></div>`;
    if(m.type==='photo') article.querySelector('.media-open').addEventListener('click',()=>{const lb=$('#lightbox');$('#lightboxImage').src=url;$('#lightboxImage').alt=m.title;$('#lightboxTitle').textContent=m.title;lb.classList.add('show');lb.setAttribute('aria-hidden','false')});
    return article;
  }

  async function renderGallery(){
    const pg=$('#photoGrid'),vg=$('#videoGrid'); if(!pg||!vg)return;
    if(!firebaseReady){
      pg.innerHTML='';vg.innerHTML='';$('#photoEmpty').textContent='⚙️ Backend belum dikonfigurasi. Isi firebase-config.js terlebih dahulu.';$('#videoEmpty').textContent='⚙️ Backend belum dikonfigurasi. Isi firebase-config.js terlebih dahulu.';$('#photoEmpty').style.display='';$('#videoEmpty').style.display='';return;
    }
    try{
      const snap=await db.collection('media').where('status','==','approved').get();
      const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt?.toDate?b.createdAt.toDate():b.createdAt)-new Date(a.createdAt?.toDate?a.createdAt.toDate():a.createdAt));
      pg.innerHTML='';vg.innerHTML='';items.filter(x=>x.type==='photo').forEach(x=>pg.appendChild(makeCard(x)));items.filter(x=>x.type==='video').forEach(x=>vg.appendChild(makeCard(x)));
      $('#photoEmpty').textContent='Belum ada foto yang disetujui. Jadilah yang pertama mengunggah! 📸';$('#videoEmpty').textContent='Belum ada video yang disetujui. Upload momen terbaikmu! 🎬';
      $('#photoEmpty').style.display=pg.children.length?'none':'';$('#videoEmpty').style.display=vg.children.length?'none':'';
      $('#totalCount').textContent=items.length;$('#photoCount').textContent=items.filter(x=>x.type==='photo').length;$('#videoCount').textContent=items.filter(x=>x.type==='video').length;applyAllFilters();
    }catch(e){console.error(e); $('#photoEmpty').textContent='Gagal memuat kenangan online. Cek Firebase/Firestore Rules.';$('#videoEmpty').textContent='Gagal memuat kenangan online. Cek Firebase/Firestore Rules.';$('#photoEmpty').style.display='';$('#videoEmpty').style.display=''}
  }

  async function initLogin(){
    const form=$('#loginForm');if(!form)return;
    $('#passwordToggle')?.addEventListener('click',()=>{const i=$('#class_password');i.type=i.type==='password'?'text':'password';$('#passwordToggle').textContent=i.type==='password'?'👁':'🙈'});
    form.addEventListener('submit',async e=>{e.preventDefault();const cls=$('#class_name').value,p=$('#class_password').value.trim(),err=$('#loginError');err.hidden=true;
      if(!firebaseReady){err.textContent='Website belum terhubung ke Firebase. Admin perlu mengisi firebase-config.js.';err.hidden=false;return}
      if(!CLASSES.includes(cls)||!p){err.textContent='Jurusan/kelas atau password salah.';err.hidden=false;return}
      const email=window.VORTEXUS_CLASS_ACCOUNTS?.[cls];if(!email||String(email).startsWith('ISI_')){err.textContent='Akun Firebase kelas ini belum diset oleh admin.';err.hidden=false;return}
      try{await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);await auth.signInWithEmailAndPassword(email,p);setClass(cls);const next=new URLSearchParams(location.search).get('next');location.href=next==='upload'?'index.html#upload':'index.html'}catch(ex){console.error(ex);const code=ex?.code||'';const messages={'auth/invalid-credential':'Email atau password kelas salah.','auth/invalid-login-credentials':'Email atau password kelas salah.','auth/user-not-found':'Akun kelas tidak ditemukan di Firebase.','auth/wrong-password':'Password kelas salah.','auth/operation-not-allowed':'Login Email/Password belum aktif di Firebase.','auth/unauthorized-domain':'Domain GitHub Pages belum diizinkan di Firebase Authentication.','auth/too-many-requests':'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.'};err.textContent=messages[code]||`Login kelas gagal (${code||'unknown'}). Cek Console browser untuk detail.`;err.hidden=false}
    });
  }

  async function initSite(){
    if(!$('#photoGrid'))return;
    const session=loginClass(), account=$('#accountPill'),out=$('#logoutBtn');
    const locked=$('#uploadLocked'),wrap=$('#uploadFormWrap');
    const syncAuthUI=user=>{
      const cls=loginClass();
      if(user&&cls){
        if(account)account.textContent='🔐 '+(JURUSAN[cls]||cls);
        if(out){out.textContent='🚪 Keluar';out.href='#';out.onclick=e=>{e.preventDefault();logout()}}
        if(locked)locked.hidden=true;if(wrap)wrap.hidden=false;
      }else{
        if(account)account.textContent='👤 Tamu';
        if(out){out.textContent='🔐 Masuk';out.href='login.html';out.onclick=null}
        if(locked)locked.hidden=false;if(wrap)wrap.hidden=true;
      }
    };
    syncAuthUI(null);
    if(firebaseReady&&auth) auth.onAuthStateChanged(user=>syncAuthUI(user));
    const type=$('#typeSelect'),input=$('#mediaInput'),preview=$('#preview'),updateAccept=()=>{if(input)input.accept=type.value==='video'?'video/mp4,video/webm,video/quicktime':'image/jpeg,image/png,image/webp'};type?.addEventListener('change',updateAccept);updateAccept();
    input?.addEventListener('change',()=>{preview.innerHTML='';const f=input.files?.[0];if(!f)return;const url=URL.createObjectURL(f),el=document.createElement(type.value==='video'?'video':'img');el.src=url;if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true}preview.appendChild(el)});
    const js=$('#jurusanSelect');if(js&&JURUSAN[session]){js.value=session;js.disabled=false}
    $('#uploadForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=input.files?.[0],data=new FormData(e.currentTarget),err=$('#uploadError'),ok=$('#uploadNotice');err.hidden=true;ok.hidden=true;
      if(!session){err.textContent='🔐 Kamu harus login terlebih dahulu sebelum mengunggah.';err.hidden=false;setTimeout(()=>location.href='login.html?next=upload',700);return}
      if(!firebaseReady){err.textContent=backendError();err.hidden=false;return}
      if(!f){err.textContent='Pilih file terlebih dahulu.';err.hidden=false;return}
      const isVideo=data.get('type')==='video',max=isVideo?100*1024*1024:10*1024*1024;if(f.size>max){err.textContent=`Ukuran ${isVideo?'video':'foto'} terlalu besar. Maksimal ${isVideo?'100 MB':'10 MB'}.`;err.hidden=false;return}
      const valid=isVideo?/^video\/(mp4|webm|quicktime)$/:/^image\/(jpeg|png|webp)$/;if(!valid.test(f.type)){err.textContent='Format file tidak didukung.';err.hidden=false;return}
      try{const user=await waitForAuthUser();if(!user)throw new Error('AUTH_REQUIRED');if(!cloudinaryReady())throw new Error('CLOUDINARY_NOT_CONFIGURED');const resourceType=isVideo?'video':'image';const endpoint=`https://api.cloudinary.com/v1_1/${encodeURIComponent(window.VORTEXUS_CLOUDINARY.cloudName)}/${resourceType}/upload`;const fd=new FormData();fd.append('file',f);fd.append('upload_preset',window.VORTEXUS_CLOUDINARY.uploadPreset);fd.append('folder','vortexus26');const uploadRes=await fetch(endpoint,{method:'POST',body:fd});let uploadJson={};try{uploadJson=await uploadRes.json()}catch(_){}if(!uploadRes.ok||!uploadJson.secure_url)throw new Error(`CLOUDINARY: ${uploadJson.error?.message||`HTTP ${uploadRes.status}`}`);const fileUrl=uploadJson.secure_url;await db.collection('media').add({title:String(data.get('title')||'').trim(),uploader:String(data.get('uploader')||'').trim(),category:data.get('category'),type:data.get('type'),jurusan:String(data.get('jurusan')||session),status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp(),fileUrl,cloudinaryPublicId:uploadJson.public_id,resourceType:uploadJson.resource_type,uploaderUid:user.uid});e.currentTarget.reset();js.value=session;js.disabled=false;preview.innerHTML='';ok.textContent='✅ Upload berhasil! Sekarang menunggu persetujuan Admin. Setelah disetujui, foto akan muncul untuk SEMUA orang.';ok.hidden=false}catch(ex){console.error(ex);const code=ex?.code||'';let msg=ex?.message||'Terjadi kesalahan tidak diketahui.';if(code==='permission-denied')msg='Firestore menolak penyimpanan data (permission-denied). Pastikan Firestore Rules sudah di-Publish.';else if(code==='unauthenticated')msg='Sesi Firebase tidak aktif. Silakan login lagi.';else if(ex.message==='AUTH_REQUIRED')msg='Sesi login belum siap. Tunggu sebentar lalu coba lagi, atau login ulang.';else if(ex.message==='CLOUDINARY_NOT_CONFIGURED')msg='Cloudinary belum dikonfigurasi.';err.textContent=`Upload gagal: ${msg}`;err.hidden=false}}
    );
    await renderGallery();initFilters();initLightbox();
  }

  const states={photoGrid:{category:'all',jurusan:'all',search:''},videoGrid:{category:'all',jurusan:'all',search:''}};
  function apply(grid){const s=states[grid];$$(`#${grid} .media-card`).forEach(c=>{const ok=(s.category==='all'||c.dataset.category===s.category)&&(s.jurusan==='all'||c.dataset.jurusan===s.jurusan)&&(!s.search||c.dataset.search.includes(s.search));c.style.display=ok?'':'none'});}
  const applyAllFilters=()=>Object.keys(states).forEach(apply);
  function initFilters(){
    $$('.filter').forEach(group=>{const target=group.dataset.target,grid=target.startsWith('photos')?'photoGrid':'videoGrid',key=target.includes('jurusan')?'jurusan':'category';group.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');states[grid][key]=btn.dataset.filter;apply(grid)}))});
    $$('.gallery-search').forEach(i=>i.addEventListener('input',()=>{states[i.dataset.grid].search=i.value.trim().toLowerCase();apply(i.dataset.grid)}));
    $$('.random-btn').forEach(b=>b.addEventListener('click',()=>{const cards=$$(`#${b.dataset.grid} .media-card`).filter(c=>c.style.display!=='none');if(!cards.length)return;cards.forEach(c=>c.classList.remove('spotlight'));const c=cards[Math.floor(Math.random()*cards.length)];c.classList.add('spotlight');c.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>c.classList.remove('spotlight'),1800)}));
  }
  function initLightbox(){const lb=$('#lightbox');if(!lb)return;const close=()=>{lb.classList.remove('show');lb.setAttribute('aria-hidden','true');$('#lightboxImage').src=''};$('.lightbox-close')?.addEventListener('click',close);lb.addEventListener('click',e=>{if(e.target===lb)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}

  async function initAdminLogin(){const form=$('#adminLoginForm');if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();const entered=$('#adminUsername').value.trim(),email=entered.toLowerCase()==='admin'?window.VORTEXUS_ADMIN_EMAIL:entered,p=$('#adminPassword').value,err=$('#adminLoginError');err.hidden=true;if(!firebaseReady){err.textContent='Firebase belum dikonfigurasi.';err.hidden=false;return}if(email!==window.VORTEXUS_ADMIN_EMAIL){err.textContent='Email admin tidak cocok.';err.hidden=false;return}try{await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);await auth.signInWithEmailAndPassword(email,p);location.href='admin.html'}catch(ex){console.error(ex);const code=ex?.code||'';const messages={'auth/invalid-credential':'Email atau password admin salah.','auth/invalid-login-credentials':'Email atau password admin salah.','auth/user-not-found':'Akun admin tidak ditemukan di Firebase.','auth/wrong-password':'Password admin salah.','auth/operation-not-allowed':'Login Email/Password belum aktif di Firebase.','auth/unauthorized-domain':'Domain GitHub Pages belum diizinkan di Firebase Authentication.','auth/too-many-requests':'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.'};err.textContent=messages[code]||`Login admin gagal (${code||'unknown'}).`;err.hidden=false}})}

  async function requireAdmin(){if(!firebaseReady||!auth){location.replace('admin-login.html');return null}const u=await new Promise(resolve=>{let done=false;const unsub=auth.onAuthStateChanged(user=>{if(done)return;done=true;unsub();resolve(user)})});if(!u||u.email!==window.VORTEXUS_ADMIN_EMAIL){location.replace('admin-login.html');return null}return u}
  async function initAdmin(){
    if(!$('#adminBody'))return;const u=await requireAdmin();if(!u)return;
    const warning=$('#adminWarning');if(warning)warning.innerHTML='☁️ Mode server aktif. Data upload tersimpan online dan dapat dilihat dari semua perangkat.';
    let filter='all';
    async function draw(){let snap;try{snap=await db.collection('media').get()}catch(e){console.error(e);const body=$('#adminBody');if(body)body.innerHTML=`<tr><td colspan="8" class="empty-admin">Gagal membaca Firestore: ${esc(e?.code||e?.message||'unknown')}</td></tr>`;return}const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt?.toDate?b.createdAt.toDate():0)-new Date(a.createdAt?.toDate?a.createdAt.toDate():0));const body=$('#adminBody');body.innerHTML='';const counts={total:items.length,pending:items.filter(x=>x.status==='pending').length,approved:items.filter(x=>x.status==='approved').length,rejected:items.filter(x=>x.status==='rejected').length};$('#sTotal').textContent=counts.total;$('#sPending').textContent=counts.pending;$('#sApproved').textContent=counts.approved;$('#sRejected').textContent=counts.rejected;$('#mediaSummary').textContent=`${items.filter(x=>x.type==='photo').length} foto · ${items.filter(x=>x.type==='video').length} video`;const shown=filter==='all'?items:items.filter(x=>x.status===filter);if(!shown.length){body.innerHTML='<tr><td colspan="8" class="empty-admin">Belum ada upload.</td></tr>';return}
      shown.forEach(m=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${m.type==='photo'?`<a href="${esc(m.fileUrl)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(m.fileUrl)}" alt=""></a>`:'🎬'}</td><td><b>${esc(m.title)}</b><br><small style="color:#7694b2">#${esc(m.id)}</small></td><td>${esc(m.uploader)}</td><td>${esc(JURUSAN[m.jurusan]||m.jurusan)}</td><td>${esc(m.type)}</td><td><span class="badge ${esc(m.status)}">${esc(m.status)}</span></td><td>${esc(fmtDate(m.createdAt))}</td><td><div class="row-actions">${m.status!=='approved'?'<button data-act="approve">✓ Setujui</button>':''}${m.status!=='rejected'?'<button class="reject" data-act="reject">✕ Tolak</button>':''}<button class="delete" data-act="delete">Hapus</button></div></td>`;
        tr.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=async()=>{const act=btn.dataset.act;if(act==='delete'&&!confirm('Hapus upload ini dari arsip? File Cloudinary tidak dihapus otomatis.'))return;try{if(act==='delete'){await db.collection('media').doc(m.id).delete()}else await db.collection('media').doc(m.id).update({status:act==='approve'?'approved':'rejected',reviewedAt:firebase.firestore.FieldValue.serverTimestamp(),reviewedBy:u.email});await draw();await renderGallery()}catch(e){alert('Gagal menyimpan perubahan admin. Cek Firebase Security Rules.')}});body.appendChild(tr)});
    }
    $$('.admin-filter button').forEach(b=>b.onclick=()=>{$$('.admin-filter button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.adminFilter;draw()});
    $('#clearData')?.addEventListener('click',async()=>{if(!confirm('Hapus SEMUA data upload? Tindakan ini tidak dapat dibatalkan.'))return;const snap=await db.collection('media').get();for(const d of snap.docs){await d.ref.delete()}draw()});
    $('#adminLogout')?.addEventListener('click',async()=>{await auth.signOut();location.href='admin-login.html'});draw();
  }

  // Make the class login persist visually, but Firebase is the real authentication backend.
  if(firebaseReady && auth){auth.onAuthStateChanged(user=>{if(user?.email===window.VORTEXUS_ADMIN_EMAIL && $('#adminBody')){} });}
  initAdminLogin();initLogin();initSite();initAdmin();
})();
