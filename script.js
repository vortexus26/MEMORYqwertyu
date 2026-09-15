/* VORTEXUS 26 — GitHub Pages edition
   Static-only mode: IndexedDB + localStorage. GitHub Pages cannot run PHP/MySQL.
*/
(() => {
  'use strict';
  const DB='vortexus26-pages', STORE='media', VERSION=2;
  const JURUSAN={PPLDG26:'PPLDG 26',OTOMOTIF26:'OTOMOTIF 26',ATPH26:'ATPH 26',BUSANA26:'BUSANA 26',LAINNYA:'Lainnya'};
  const CLASSES=Object.keys(JURUSAN).filter(x=>x!=='LAINNYA');
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const openDB=()=>new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('Browser tidak mendukung IndexedDB.'));return;}
    const r=indexedDB.open(DB,VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(STORE)){
        const st=db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});
        st.createIndex('status','status'); st.createIndex('createdAt','createdAt');
      }
    };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
  const all=async()=>{const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})};
  const put=async item=>{const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(item);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})};
  const remove=async id=>{const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).delete(Number(id));r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})};
  const clear=async()=>{const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})};

  const loginUser=()=>localStorage.getItem('vortexus_session')||'';
  const setSession=cls=>localStorage.setItem('vortexus_session',cls);
  const logout=()=>{localStorage.removeItem('vortexus_session');location.href='login.html'};

  function initLogin(){
    const form=$('#loginForm'); if(!form)return;
    $('#passwordToggle')?.addEventListener('click',()=>{const i=$('#class_password');i.type=i.type==='password'?'text':'password';$('#passwordToggle').textContent=i.type==='password'?'👁':'🙈'});
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const cls=$('#class_name').value,p=$('#class_password').value.trim(),err=$('#loginError');
      err.hidden=true;
      if(CLASSES.includes(cls)&&p===cls){setSession(cls);const next=new URLSearchParams(location.search).get('next');location.href=next==='upload'?'index.html#upload':'index.html'}
      else{err.textContent='Jurusan/kelas atau password salah. Password demo = kode kelas.';err.hidden=false}
    });
  }

  function makeCard(m){
    const url=URL.createObjectURL(m.blob), date=new Date(m.createdAt).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
    const article=document.createElement('article');
    article.className='media-card'; article.dataset.category=m.category; article.dataset.jurusan=m.jurusan;
    article.dataset.search=(m.title+' '+m.uploader+' '+(JURUSAN[m.jurusan]||'')).toLowerCase();
    if(m.type==='photo') article.innerHTML=`<button type="button" class="media-open" aria-label="Buka foto"><img src="${url}" alt="${esc(m.title)}" loading="lazy"></button><div class="card-info"><div><b>${esc(m.title)}</b><span>${esc(m.uploader)} · ${date}</span></div><em>${esc(JURUSAN[m.jurusan]||'Lainnya')}</em></div>`;
    else article.innerHTML=`<video controls preload="metadata" playsinline src="${url}"></video><div class="card-info"><div><b>${esc(m.title)}</b><span>${esc(m.uploader)} · ${date}</span></div><em>${esc(JURUSAN[m.jurusan]||'Lainnya')}</em></div>`;
    if(m.type==='photo') article.querySelector('.media-open').addEventListener('click',()=>{
      const lb=$('#lightbox'); $('#lightboxImage').src=url; $('#lightboxImage').alt=m.title; $('#lightboxTitle').textContent=m.title;
      lb.classList.add('show'); lb.setAttribute('aria-hidden','false');
    });
    return article;
  }

  async function initSite(){
    if(!$('#photoGrid'))return;
    const session=loginUser();
    const account=$('#accountPill');
    const uploadLocked=$('#uploadLocked');
    const uploadWrap=$('#uploadFormWrap');
    if(uploadLocked) uploadLocked.hidden=!!session;
    if(uploadWrap) uploadWrap.hidden=!session;
    const out=$('#logoutBtn');
    if(session){
      if(account) account.textContent='🔐 '+(JURUSAN[session]||session);
      if(out){out.textContent='🚪 Keluar';out.href='#';out.onclick=e=>{e.preventDefault();logout()};}
    }else{
      if(account) account.textContent='👤 Tamu';
      if(out){out.textContent='🔐 Masuk';out.href='login.html';out.onclick=null;}
    }
    const type=$('#typeSelect'), input=$('#mediaInput'), preview=$('#preview');
    const updateAccept=()=>{if(input)input.accept=type.value==='video'?'video/mp4,video/webm,video/quicktime':'image/jpeg,image/png,image/webp'};
    type?.addEventListener('change',updateAccept); updateAccept();
    input?.addEventListener('change',()=>{
      preview.innerHTML=''; const f=input.files?.[0]; if(!f)return;
      const url=URL.createObjectURL(f),el=document.createElement(type.value==='video'?'video':'img'); el.src=url;
      if(el.tagName==='VIDEO'){el.controls=true;el.playsInline=true} preview.appendChild(el);
    });
    const js=$('#jurusanSelect'); if(js&&JURUSAN[session]){js.value=session;js.disabled=true;}
    $('#uploadForm')?.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!loginUser()){location.href='login.html?next=upload';return;}
      const f=input.files?.[0],data=new FormData(e.currentTarget),err=$('#uploadError'),ok=$('#uploadNotice'); err.hidden=true;ok.hidden=true;
      if(!f){err.textContent='Pilih file terlebih dahulu.';err.hidden=false;return}
      const isVideo=data.get('type')==='video',max=isVideo?100*1024*1024:10*1024*1024;
      if(f.size>max){err.textContent=`Ukuran ${isVideo?'video':'foto'} terlalu besar. Maksimal ${isVideo?'100 MB':'10 MB'}.`;err.hidden=false;return}
      const valid=isVideo?/^video\/(mp4|webm|quicktime)$/:/^image\/(jpeg|png|webp)$/;
      if(!valid.test(f.type)){err.textContent='Format file tidak didukung.';err.hidden=false;return}
      try{
        const activeSession=loginUser();
        if(!CLASSES.includes(activeSession)){location.href='login.html?next=upload';return;}
        await put({title:String(data.get('title')||'').trim(),uploader:String(data.get('uploader')||'').trim(),category:data.get('category'),type:data.get('type'),jurusan:activeSession,status:'pending',createdAt:Date.now(),blob:f});
        e.currentTarget.reset(); js.value=activeSession; js.disabled=true; preview.innerHTML='';
        ok.textContent='✅ Kenangan tersimpan sebagai pending. Admin Lokal dapat menyetujuinya di perangkat ini.';ok.hidden=false;
      }catch(ex){err.textContent='Gagal menyimpan upload di browser. Coba browser lain atau aktifkan penyimpanan situs.';err.hidden=false}
    });
    await renderGallery(); initFilters(); initLightbox();
  }

  let galleryItems=[];
  async function renderGallery(){
    galleryItems=(await all()).filter(x=>x.status==='approved').sort((a,b)=>b.createdAt-a.createdAt);
    const pg=$('#photoGrid'),vg=$('#videoGrid'); if(!pg||!vg)return;
    pg.innerHTML='';vg.innerHTML='';
    galleryItems.filter(x=>x.type==='photo').forEach(x=>pg.appendChild(makeCard(x)));
    galleryItems.filter(x=>x.type==='video').forEach(x=>vg.appendChild(makeCard(x)));
    $('#photoEmpty').style.display=pg.children.length?'none':''; $('#videoEmpty').style.display=vg.children.length?'none':'';
    $('#totalCount').textContent=galleryItems.length; $('#photoCount').textContent=galleryItems.filter(x=>x.type==='photo').length; $('#videoCount').textContent=galleryItems.filter(x=>x.type==='video').length;
    applyAllFilters();
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

  async function initAdmin(){
    if(!$('#adminBody'))return; if(!loginUser()){location.replace('login.html');return}
    let filter='all';
    async function draw(){
      const items=(await all()).sort((a,b)=>b.createdAt-a.createdAt),body=$('#adminBody');body.innerHTML='';
      const counts={total:items.length,pending:items.filter(x=>x.status==='pending').length,approved:items.filter(x=>x.status==='approved').length,rejected:items.filter(x=>x.status==='rejected').length};
      $('#sTotal').textContent=counts.total;$('#sPending').textContent=counts.pending;$('#sApproved').textContent=counts.approved;$('#sRejected').textContent=counts.rejected;
      $('#mediaSummary').textContent=`${items.filter(x=>x.type==='photo').length} foto · ${items.filter(x=>x.type==='video').length} video`;
      const shown=filter==='all'?items:items.filter(x=>x.status===filter);
      if(!shown.length){body.innerHTML='<tr><td colspan="8" class="empty-admin">Belum ada upload pada browser ini.</td></tr>';return}
      shown.forEach(m=>{
        const tr=document.createElement('tr'),url=URL.createObjectURL(m.blob),date=new Date(m.createdAt).toLocaleString('id-ID');
        tr.innerHTML=`<td>${m.type==='photo'?`<a href="${url}" target="_blank" rel="noopener"><img class="thumb" src="${url}" alt=""></a>`:'🎬'}</td><td><b>${esc(m.title)}</b><br><small style="color:#7694b2">#${m.id}</small></td><td>${esc(m.uploader)}</td><td>${esc(JURUSAN[m.jurusan]||m.jurusan)}</td><td>${esc(m.type)}</td><td><span class="badge ${esc(m.status)}">${esc(m.status)}</span></td><td>${date}</td><td><div class="row-actions">${m.status!=='approved'?'<button data-act="approve">✓ Setujui</button>':''}${m.status!=='rejected'?'<button class="reject" data-act="reject">✕ Tolak</button>':''}<button class="delete" data-act="delete">Hapus</button></div></td>`;
        tr.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=async()=>{const act=btn.dataset.act;if(act==='delete'&&!confirm('Hapus upload ini?'))return;m.status=act==='approve'?'approved':act==='reject'?'rejected':m.status;if(act==='delete')await remove(m.id);else await put(m);await draw()});
        body.appendChild(tr);
      });
    }
    $$('.admin-filter button').forEach(b=>b.onclick=()=>{$$('.admin-filter button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.adminFilter;draw()});
    $('#clearData')?.addEventListener('click',async()=>{if(confirm('Hapus SEMUA data upload dari browser ini?')){await clear();draw()}}); draw();
  }
  initLogin();initSite();initAdmin();
})();
