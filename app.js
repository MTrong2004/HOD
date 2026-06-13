window.HOD_DATA=[];
(function(){var s=document.createElement('script');s.type='application/json';s.id='data';s.textContent='[]';document.head.appendChild(s);})();

/* ===== merged app logic ===== */

﻿'use strict';const dataEl=document.getElementById('data'),BASE=[],STORE='hod102_user_edits_v1';let edits={};try{edits=JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){}function clone(x){return JSON.parse(JSON.stringify(x))}let RAW=[],pool=[],ci=Math.max(0,Math.min(+localStorage.getItem('hod102_ci')||0,BASE.length-1)),flipped=false,flipDir='horizontal',cardFontSize=localStorage.getItem('hod102_card_font_size_v3')||'1',flipMode=localStorage.getItem('hod102_flip_mode')||'single',hideOptions=localStorage.getItem('hod102_hide_options')==='1',randomActive=localStorage.getItem('hod102_random_active')==='1',qCnt=20,qSet=[],qDone={},qSel={},quizMode='practice',examSubmitted=false,timerInt=null,examStart=0,editDraft=null;function rebuild(){RAW=BASE.map(c=>Object.assign(clone(c),edits[c.num]||{}));pool=pool.length?pool.map(o=>RAW.find(c=>c.num===o.num)||o):[...RAW]}rebuild();const $=id=>document.getElementById(id);function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}function sortAns(s){return(s||'').split('').sort().join('')}function answerText(c){return(c.answer||'').split('').map(ch=>ch+'. '+(c.options?.[ch]||'')).join('; ')}function optionsHTML(c){return Object.entries(c.options||{}).map(([k,v])=>`<div class="opt"><div class="letter">${k}</div><div class="ot">${esc(v)}</div></div>`).join('')}function imgsHTML(c){return(c.images||[]).map(im=>`<img src="${im.src}" alt="">`).join('')}function setv(k,v){document.documentElement.style.setProperty(k,v)}function fit(c){
  setv('--qfs','1.08rem');setv('--ofs','.92rem');setv('--qlh','1.32');setv('--olh','1.36');setv('--afs','1rem');
  setv('--imgmax',(c.images&&c.images.length)?'380px':'0px');setv('--imgcol',(c.images&&c.images.length)?'620px':'0px');
  setv('--frontpad','14px 18px');setv('--optgap','6px');setv('--optpad','7px 10px');setv('--qmb','8px');setv('--imgmb','7px');setv('--tagmb','6px');setv('--letter','25px');setv('--letterfs','.76rem');setv('--tagfs','.62rem');setv('--tagpad','3px 10px');setv('--ogap','8px');
}
function fitVisible(){return;}
function renderCard(){let c=pool[ci]||RAW[0];if(!c)return;fit(c);applyCardFontSize();$('idx').textContent=ci+1;$('total').textContent=pool.length;$('bar').style.width=((ci+1)/pool.length*100)+'%';$('tag').textContent='CÂU '+c.num;$('question').textContent=c.question;$('images').innerHTML=imgsHTML(c);$('images').style.display=(c.images&&c.images.length)?'flex':'none';document.querySelector('#fc .front')?.classList.toggle('hasImg',!!(c.images&&c.images.length));$('options').innerHTML=optionsHTML(c);$('options').classList.toggle('hide',hideOptions);applyCardFontSize();$('toggleOpts').textContent='👁';$('toggleOpts').title=hideOptions?'Hiện lựa chọn':'Ẩn lựa chọn';updateCardTools();$('ansLetter').textContent=(c.answer||'').split('').join(', ');$('ansText').innerHTML=esc(c.answer_text||answerText(c)).replace(/; /g,'<br>');$('card').classList.remove('dir-horizontal','dir-up','dir-down');$('card').classList.add('dir-'+flipDir);$('card').classList.toggle('flip',flipped);$('mode').textContent=flipMode==='single'?'1x':'2x';var _sc=localStorage.getItem('learninghub_subject_code_merged_v1')||'';localStorage.setItem('hod102_ci',ci);if(_sc)localStorage.setItem('learninghub_progress_'+_sc,ci);localStorage.setItem('hod102_flip_mode',flipMode);localStorage.setItem('hod102_hide_options',hideOptions?'1':'0')}function flip(dir='horizontal'){flipDir=dir;flipped=!flipped;renderCard()}function next(){ci=(ci+1)%pool.length;flipped=false;flipDir='horizontal';renderCard()}function prev(){ci=(ci-1+pool.length)%pool.length;flipped=false;flipDir='horizontal';renderCard()}function shuffle(){for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}ci=0;flipped=false;flipDir='horizontal';randomActive=false;localStorage.setItem('hod102_random_active','0');renderCard();let sh=$('shuffle');if(sh){sh.classList.add('flash');setTimeout(()=>sh.classList.remove('flash'),650)}}let __allowUserReset=false;function reset(force){if(force!==true&&__allowUserReset!==true){try{renderCard()}catch(e){}return}__allowUserReset=false;pool=[...RAW];ci=0;flipped=false;flipDir='horizontal';randomActive=false;localStorage.setItem('hod102_random_active','0');renderCard()}function triggerReset(){__allowUserReset=true;reset(true)}function switchTab(n,b){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));$(n).classList.add('active');if(n==='study')renderStudy()}function sample(a,n){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return n?a.slice(0,n):a}function fmt(ms){let s=Math.floor(ms/1000),m=Math.floor(s/60);s%=60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}function startTimer(){clearInterval(timerInt);examStart=Date.now();timerInt=setInterval(()=>$('timer').textContent=fmt(Date.now()-examStart),1000)}function stopTimer(){clearInterval(timerInt)}function syncQuizSet(){if(qSet&&qSet.length){qSet=qSet.map(c=>RAW.find(x=>x.num===c.num)||c)}}function renderQuiz(){syncQuizSet();let body=$('quizBody');if(!qSet.length){body.innerHTML='<div class="qcard"><div class="qq">Chọn số câu rồi bấm Bắt đầu.</div></div>';return}let done=Object.keys(qDone).length;body.innerHTML=qSet.map((c,i)=>{let rev=quizMode==='practice'?qDone[i]:examSubmitted,hasImg=(c.images||[]).length?' hasImg':'';let opts=Object.entries(c.options).map(([k,v])=>{let sel=(qSel[i]||'').includes(k),cor=c.answer.includes(k),cls='qopt '+(sel?'sel ':'')+(rev&&cor?'cor ':'')+(rev&&sel&&!cor?'wrg ':'')+(rev?'dis':'');return`<div class="${cls}" data-qi="${i}" data-k="${k}"><div class="qkey">${k}</div><div class="qtxt">${esc(v)}</div></div>`}).join('');let fb='';if(rev){let ok=sortAns(qSel[i])===sortAns(c.answer);fb=`<div class="fb ${ok?'ok':'bad'}">${ok?'Đúng':'Chưa đúng'}. Đáp án: <b>${esc(c.answer_text||answerText(c))}</b></div>`}return`<div class="qcard${hasImg}"><div class="qnum">CÂU ${i+1}/${qSet.length} · #${c.num}</div><div class="qq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="qopts">${opts}</div>${quizMode==='practice'&&!qDone[i]?`<button class="check" data-check="${i}">Kiểm tra</button>`:''}${fb}</div>`}).join('')+(quizMode==='exam'&&!examSubmitted?`<button class="submitExam" id="submitExam">Nộp bài · đã chọn ${Object.keys(qSel).length}/${qSet.length}</button>`:(quizMode==='practice'&&done===qSet.length?'<button class="see" id="seeScore">Xem kết quả</button>':''))}function pickAns(i,k){if((quizMode==='practice'&&qDone[i])||examSubmitted)return;let c=qSet[i];if(c.answer.length>1){let set=new Set((qSel[i]||'').split('').filter(Boolean));set.has(k)?set.delete(k):set.add(k);qSel[i]=[...set].sort().join('')}else qSel[i]=k;renderQuiz()}function checkAns(i){if(!qSel[i]){alert('Bạn chọn đáp án trước nha.');return}qDone[i]=true;renderQuiz()}function score(){let ok=0;qSet.forEach((c,i)=>{if(sortAns(qSel[i])===sortAns(c.answer))ok++});let tot=qSet.length,p=Math.round(ok/tot*100);$('scoreOk').textContent=ok;$('scoreBad').textContent=tot-ok;$('scoreTot').textContent=tot;$('scorePct').textContent=p+'%';$('scoreLabel').textContent=p>=90?'Xuất sắc':p>=70?'Ổn áp rồi':p>=50?'Cần ôn thêm':'Làm lại vài vòng nha';$('overlay').classList.remove('hidden')}function smart(q){q=q.trim().toLowerCase();if(!q)return RAW;let m=q.match(/^#(\d+)$/);if(m)return RAW.filter(c=>c.num===+m[1]);m=q.match(/^answer\s*:\s*([a-e]+)$/i);if(m)return RAW.filter(c=>sortAns(c.answer)===sortAns(m[1].toUpperCase()));if(['multi','multiple','chọn nhiều'].includes(q))return RAW.filter(c=>c.answer.length>1);return RAW.filter(c=>(String(c.num)+' '+c.question+' '+c.answer+' '+(c.answer_text||'')+' '+Object.values(c.options).join(' ')).toLowerCase().includes(q))}function renderStudy(){let arr=smart($('search').value||''),max=120;$('studyList').innerHTML=arr.slice(0,max).map(c=>`<div class="sitem"><div class="snum">CÂU ${c.num}</div><div class="sq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${Object.entries(c.options).map(([k,v])=>`<div class="sopt ${c.answer.includes(k)?'ans':''}"><div class="skey">${c.answer.includes(k)?'✓':k}</div><div>${esc(k+'. '+v)}</div></div>`).join('')}</div></div>`).join('')+(arr.length>max?`<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`:arr.length?'':'<div class="more">Không tìm thấy kết quả.</div>')}function openEditor(){let c=pool[ci];editDraft=clone(c);let reporting=!!(window.HODSupabase?.getUser?.())&&!window.HODSupabase?.isAdmin?.();$('editTitle').textContent=(reporting?'Báo cáo / đề xuất sửa câu ':'Sửa câu ')+c.num;if($('saveEdit'))$('saveEdit').textContent=reporting?'Gửi báo cáo cho admin':'Lưu sửa';if($('restoreEdit'))$('restoreEdit').classList.toggle('hidden',reporting);$('editQuestion').value=c.question;$('editAnswer').value=c.answer;renderEditOptions();renderEditImages();$('editModal').classList.remove('hidden')}function renderEditOptions(){let ops=editDraft.options||{};$('editOptions').innerHTML=['A','B','C','D','E'].map(k=>`<div class="field"><label>Đáp án ${k}</label><textarea data-opt="${k}">${esc(ops[k]||'')}</textarea></div>`).join('')}function renderEditImages(){$('editImgs').innerHTML=(editDraft.images||[]).map((im,i)=>`<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${im.src}"></div>`).join('')||'<p style="color:var(--mist)">Chưa có hình.</p>'}function saveEditor(){let oldQ=clone(RAW.find(c=>c.num===editDraft.num)||pool[ci]||editDraft);editDraft.question=$('editQuestion').value.trim();editDraft.answer=$('editAnswer').value.trim().toUpperCase();let ops={};document.querySelectorAll('[data-opt]').forEach(t=>{if(t.value.trim())ops[t.dataset.opt]=t.value.trim()});editDraft.options=ops;editDraft.answer_text=answerText(editDraft);if(window.HODSupabase&&window.HODSupabase.isReady()){window.HODSupabase.submitEditRequest(editDraft,oldQ);return}if(window.HODSupabase?.getUser?.()){alert('Chưa kết nối được dữ liệu duyệt. Hãy tải lại trang rồi gửi lại báo cáo.');return}edits[editDraft.num]={question:editDraft.question,options:editDraft.options,answer:editDraft.answer,answer_text:editDraft.answer_text,images:editDraft.images||[]};localStorage.setItem(STORE,JSON.stringify(edits));rebuild();ci=pool.findIndex(c=>c.num===editDraft.num);if(ci<0)ci=0;flipped=false;renderCard();renderQuiz();renderStudy();$('editModal').classList.add('hidden');notify('Đã lưu sửa local')}function restoreEditor(){delete edits[editDraft.num];localStorage.setItem(STORE,JSON.stringify(edits));rebuild();syncQuizSet();renderCard();renderQuiz();renderStudy();$('editModal').classList.add('hidden');notify('Đã khôi phục')}function exportEdits(){let blob=new Blob([JSON.stringify(edits,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hod102_user_edits.json';a.click();URL.revokeObjectURL(a.href)}function importEditsFile(f){let fr=new FileReader();fr.onload=()=>{try{edits=JSON.parse(fr.result)||{};localStorage.setItem(STORE,JSON.stringify(edits));rebuild();renderCard();renderQuiz();renderStudy();notify('Đã nhập file sửa')}catch(e){alert('File JSON không hợp lệ')}};fr.readAsText(f)}function applyCardFontSize(){let n=parseFloat(cardFontSize||'1');if(!isFinite(n))n=1;n=Math.max(.8,Math.min(1.3,n));cardFontSize=String(n);let root=document.documentElement,fc=$('fc');let set=(k,v)=>{root.style.setProperty(k,v);if(fc)fc.style.setProperty(k,v)};let base=1.35*n;set('--card-qfs',(1.08*base).toFixed(3)+'rem');set('--card-ofs',(.92*base).toFixed(3)+'rem');set('--card-afs',(1.0*base).toFixed(3)+'rem');set('--card-letter',(25*Math.min(1.35,base)).toFixed(0)+'px');set('--card-letterfs',(.76*base).toFixed(3)+'rem');localStorage.setItem('hod102_card_font_size_v3',String(n));if($('stCardFont'))$('stCardFont').value=Math.round(n*100);if($('stCardFontState'))$('stCardFontState').textContent=Math.round(n*100)+'%'}function updateCardTools(){let sh=$('shuffle'),eye=$('toggleOpts');if(sh){sh.classList.remove('active');sh.title='Xáo ngẫu nhiên'}if(eye){eye.classList.toggle('active',!!hideOptions);eye.title=hideOptions?'Đang ẩn lựa chọn':'Đang hiện lựa chọn'}}function setupGlobalHeader(){let top=document.querySelector('#fc .top');let tabs=document.querySelector('.tabs');if(top&&!top.classList.contains('globalTop')){top.classList.add('globalTop');document.body.insertBefore(top,tabs||document.body.firstChild)}}function setupCardTools(){let card=$('card');if(!card||$('cardTools'))return;let tools=document.createElement('div');tools.id='cardTools';tools.className='cardTools';let sh=$('shuffle'),eye=$('toggleOpts'),ed=$('editCard');if(sh){sh.textContent='⚂';sh.classList.add('cardToolBtn','diceBtn');tools.appendChild(sh)}if(eye){eye.textContent='👁';eye.classList.add('cardToolBtn','eyeBtn');tools.appendChild(eye)}tools.addEventListener('click',e=>e.stopPropagation());tools.addEventListener('mousedown',e=>e.stopPropagation());card.insertBefore(tools,ed);updateCardTools()}function updateSettingsUI(){if(!$('stFlipState'))return;$('stFlipState').textContent='Đang dùng: '+(flipMode==='single'?'1x - bấm 1 lần để lật':'2x - hạn chế lật nhầm');$('stOptState').textContent=hideOptions?'Đang ẩn lựa chọn':'Đang hiện lựa chọn';if($('stGoInput'))$('stGoInput').value=(pool[ci]?.num)||'';applyCardFontSize();updateCardTools()}function toggleFlipMode(){flipMode=flipMode==='single'?'double':'single';flipped=false;renderCard();updateSettingsUI()}function goToQuestionNum(){let n=+$('stGoInput').value;if(!n){alert('Nhập số câu trước nha.');return}let i=pool.findIndex(c=>c.num===n);if(i<0)i=RAW.findIndex(c=>c.num===n);if(i<0){alert('Không tìm thấy câu '+n);return}if(!pool.find(c=>c.num===n))pool=[...RAW];ci=i;flipped=false;renderCard();updateSettingsUI();$('settingsModal').classList.add('hidden')}function init(){setupGlobalHeader();document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab,btn));$('shuffle').onclick=shuffle;$('reset').onclick=()=>triggerReset();$('toggleOpts').onclick=()=>{hideOptions=!hideOptions;renderCard()};$('openSettings').onclick=()=>{$('settingsModal').classList.remove('hidden');updateSettingsUI()};$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');document.querySelectorAll('.modal,.overlay').forEach(m=>{m.addEventListener('mousedown',e=>{if(e.target===m)m.classList.add('hidden')})});document.querySelectorAll('.modal .box,.overlay .box').forEach(box=>{if(!box.querySelector('.modalX')){let x=document.createElement('button');x.className='modalX';x.type='button';x.textContent='×';x.title='Đóng';x.onclick=e=>{e.stopPropagation();box.closest('.modal,.overlay')?.classList.add('hidden')};box.prepend(x)}});setupCardTools();if($('toggleGuide'))$('toggleGuide').onclick=()=>{let g=$('guidePanel'),open=g.classList.toggle('hidden')===false;$('toggleGuide').textContent=open?'Ẩn hướng dẫn':'Mở hướng dẫn'};if($('stCardFont'))$('stCardFont').oninput=e=>{cardFontSize=(+e.target.value/100).toFixed(2);applyCardFontSize();renderCard()};if($('stCardFontReset'))$('stCardFontReset').onclick=()=>{cardFontSize='1';applyCardFontSize();renderCard();updateSettingsUI()};if($('stToggleFlipMode'))$('stToggleFlipMode').onclick=toggleFlipMode;if($('stToggleOpts'))$('stToggleOpts').onclick=()=>{hideOptions=!hideOptions;renderCard();updateSettingsUI()};if($('stShuffle'))$('stShuffle').onclick=()=>{shuffle();updateSettingsUI()};if($('stReset'))$('stReset').onclick=()=>{triggerReset();updateSettingsUI()};if($('stGo'))$('stGo').onclick=goToQuestionNum;if($('stGoInput'))$('stGoInput').onkeydown=e=>{if(e.key==='Enter')goToQuestionNum()};if($('stEdit'))$('stEdit').onclick=()=>{openEditor();$('settingsModal').classList.add('hidden')};$('editCard').title='Báo cáo / đề xuất sửa câu';$('editCard').textContent='!';$('editCard').onclick=e=>{e.stopPropagation();openEditor()};$('prev').onclick=prev;$('next').onclick=next;$('mode').onclick=toggleFlipMode;$('zone').onclick=e=>{let r=$('card').getBoundingClientRect();if(!$('card').contains(e.target)){e.clientX<r.left?prev():next();return}if(e.target.closest('#editCard')||e.target.closest('#cardTools'))return;if(flipMode==='single')flip('horizontal')};$('practiceMode').onclick=()=>{quizMode='practice';$('practiceMode').classList.add('sel');$('examMode').classList.remove('sel');$('quizModeLabel').textContent='Practice: kiểm tra từng câu';stopTimer();$('timer').textContent='00:00'};$('examMode').onclick=()=>{quizMode='exam';$('examMode').classList.add('sel');$('practiceMode').classList.remove('sel');$('quizModeLabel').textContent='Exam: nộp bài mới hiện đáp án'};document.querySelectorAll('.cnt').forEach((b,i)=>b.onclick=()=>{qCnt=[10,20,30,40,100,0][i];document.querySelectorAll('.cnt').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')});$('start').onclick=()=>{qSet=sample(RAW,qCnt);qDone={};qSel={};examSubmitted=false;if(quizMode==='exam'){startTimer()}else{stopTimer();$('timer').textContent='00:00'}renderQuiz()};$('quizBody').onclick=e=>{let opt=e.target.closest('.qopt');if(opt)pickAns(+opt.dataset.qi,opt.dataset.k);let chk=e.target.closest('[data-check]');if(chk)checkAns(+chk.dataset.check);if(e.target.id==='seeScore')score();if(e.target.id==='submitExam'){examSubmitted=true;stopTimer();renderQuiz();score()}};$('retry').onclick=()=>{$('overlay').classList.add('hidden');qSet=sample(RAW,qCnt);qDone={};qSel={};examSubmitted=false;if(quizMode==='exam')startTimer();renderQuiz()};$('search').oninput=renderStudy;$('studyList').onclick=e=>{let it=e.target.closest('.sitem');if(it)it.classList.toggle('open')};$('closeEdit').onclick=()=>$('editModal').classList.add('hidden');$('saveEdit').onclick=saveEditor;$('restoreEdit').onclick=restoreEditor;$('editImgs').onclick=e=>{let b=e.target.closest('[data-rm]');if(b){editDraft.images.splice(+b.dataset.rm,1);renderEditImages()}};$('imgUpload').onchange=e=>{[...e.target.files].forEach(file=>{let fr=new FileReader();fr.onload=()=>{editDraft.images=editDraft.images||[];editDraft.images.push({id:'user_'+Date.now(),src:fr.result,source:'user-upload',name:file.name});renderEditImages()};fr.readAsDataURL(file)});e.target.value=''};$('exportEdits').onclick=exportEdits;$('importEdits').onclick=()=>$('importFile').click();$('importFile').onchange=e=>{if(e.target.files[0])importEditsFile(e.target.files[0])};$('clearEdits').onclick=()=>{if(confirm('Xóa tất cả chỉnh sửa đã lưu?')){edits={};localStorage.removeItem(STORE);rebuild();renderCard();notify('Đã xóa tất cả sửa')}};window.onkeydown=e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();flip('horizontal')}if(e.key==='ArrowUp'){e.preventDefault();flip('up')}if(e.key==='ArrowDown'){e.preventDefault();flip('down')}if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev();if(e.key.toLowerCase()==='r')triggerReset();if(e.key.toLowerCase()==='h'){hideOptions=!hideOptions;renderCard()}if(e.key.toLowerCase()==='e')openEditor();if(e.key==='1')document.querySelector('[data-tab="fc"]').click();if(e.key==='2')document.querySelector('[data-tab="quiz"]').click();if(e.key==='3')document.querySelector('[data-tab="study"]').click()};applyCardFontSize();setupCardTools();renderCard();renderQuiz()}document.addEventListener('DOMContentLoaded',init);

// ===============================
// HOD102 + Supabase MVP bridge
// 1-file frontend. Fill SUPABASE_URL and SUPABASE_ANON_KEY after creating your Supabase project.
// IMPORTANT: Never paste service_role key here. Use anon key only.
// ===============================
window.HODSupabase = (() => {
  const CONFIG = {
    SUPABASE_URL: 'https://bdbkpqnhavyoalgkvqtw.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB'
  };

  let client = null;
  let currentUser = null;
  let currentProfile = null;

  const configured = () => CONFIG.SUPABASE_URL.startsWith('https://') && !CONFIG.SUPABASE_ANON_KEY.startsWith('PASTE_');
  const isReady = () => !!client && !!currentUser;
  const isAdmin = () => currentProfile?.role === 'admin';
  const $id = id => document.getElementById(id);

  function safeJson(obj){
    try { return JSON.stringify(obj, null, 2); } catch(e){ return String(obj); }
  }

  function questionToRow(q){
    return {
      question: q.question,
      options: q.options || {},
      answer: q.answer,
      answer_text: q.answer_text || answerText(q),
      images: q.images || []
    };
  }

  function rowToQuestion(row){
    return {
      id: row.id,
      num: row.num,
      question: row.question,
      options: row.options || {},
      answer: row.answer,
      answer_text: row.answer_text,
      images: row.images || []
    };
  }

  function notify2(msg){
    if (typeof notify === 'function') notify(msg);
    else console.log('[HOD102]', msg);
  }

  function openAuth(){ $id('authModal')?.classList.remove('hidden'); }
  function closeAuth(){ $id('authModal')?.classList.add('hidden'); }
  function openAdmin(){ if (!isAdmin()) { alert('Tài khoản Google này chưa có quyền admin.'); return; } window.open('admin.html','_blank'); }
  function closeAdmin(){ $id('adminModal')?.classList.add('hidden'); }

  function setupHeaderAuthUI(){
    const actions = document.querySelector('.globalTop .actions') || document.querySelector('#fc .actions') || document.querySelector('.actions');
    if (!actions || $id('authStatusBtn')) return;

    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminOpenBtn';
    adminBtn.className = 'btn adminBtn hidden';
    adminBtn.title = 'Dashboard quản trị';
    adminBtn.textContent = ''; adminBtn.style.display='none';
    adminBtn.onclick = () => window.open('admin.html','_blank');

    const authBtn = document.createElement('button');
    authBtn.id = 'authStatusBtn';
    authBtn.className = 'btn authBtn';
    authBtn.title = 'Đăng nhập / Đăng xuất';
    authBtn.textContent = configured() ? 'Đăng nhập' : 'Local';
    authBtn.onclick = async () => {
      if (!configured()) return alert('Bạn cần điền SUPABASE_URL và SUPABASE_ANON_KEY trong file HTML trước.');
      if (currentUser) await signOut();
      else openAuth();
    };

    actions.prepend(authBtn);
    actions.prepend(adminBtn);
  }

  function updateAuthUI(){
    const authBtn = $id('authStatusBtn');
    const adminBtn = $id('adminOpenBtn');
    if (!authBtn) return;
    if (!configured()) {
      authBtn.textContent = 'Local';
      authBtn.classList.remove('userChip');
      adminBtn?.classList.add('hidden');
      return;
    }
    if (currentUser) {
      authBtn.textContent = currentProfile?.email || currentUser.email || 'User';
      authBtn.classList.add('userChip');
      const admin = isAdmin();
      adminBtn?.classList.toggle('hidden', !admin);
      if (adminBtn) adminBtn.style.display = admin ? '' : 'none';
      const floatAdmin = $id('hodFloatAdmin');
      floatAdmin?.classList.toggle('hidden', !admin);
      if (floatAdmin) floatAdmin.style.display = admin ? '' : 'none';
      if (!admin) $id('adminModal')?.classList.add('hidden');
    } else {
      authBtn.textContent = 'Đăng nhập';
      authBtn.classList.remove('userChip');
      adminBtn?.classList.add('hidden');
      if (adminBtn) adminBtn.style.display = 'none';
      const floatAdmin = $id('hodFloatAdmin');
      floatAdmin?.classList.add('hidden');
      if (floatAdmin) floatAdmin.style.display = 'none';
      $id('adminModal')?.classList.add('hidden');
    }
  }

  async function loadProfile(){
    if (!client || !currentUser) { currentProfile = null; updateAuthUI(); return null; }
    const now = new Date().toISOString();
    const base = { id: currentUser.id, email: currentUser.email, last_login: now };

    let existing = null;
    const sel = await client.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
    if (!sel.error) existing = sel.data;
    else console.warn('Không đọc được profile:', sel.error);

    if (!existing) {
      const ins = await client.from('profiles')
        .insert({ ...base, role: 'user', blocked: false })
        .select('*')
        .single();
      if (ins.error) {
        console.warn('Không tạo được profile mới:', ins.error);
        currentProfile = { ...base, role: 'user', blocked: false };
      } else currentProfile = ins.data;
    } else {
      const upd = await client.from('profiles')
        .update({ email: currentUser.email, last_login: now })
        .eq('id', currentUser.id)
        .select('*')
        .single();
      if (upd.error) {
        console.warn('Không cập nhật last_login:', upd.error);
        currentProfile = existing;
      } else currentProfile = upd.data;
    }

    if (currentProfile?.blocked || currentProfile?.is_blocked || currentProfile?.status === 'blocked') {
      alert('Tài khoản của bạn đã bị khóa.');
      await signOut();
      return null;
    }
    updateAuthUI();
    return currentProfile;
  }

  async function loadQuestionsFromSupabase(){
    if (!client || !currentUser) return false;
    const activeSubject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    let query = client.from('questions').select('*').eq('is_active', true);
    if (activeSubject) query = query.eq('subject_code', activeSubject);
    const { data, error } = await query.order('num', { ascending: true });
    if (error) { console.warn(error); notify2('Không tải được questions từ Supabase.'); return false; }
    if (!data?.length) { notify2(activeSubject ? `Môn ${activeSubject} chưa có câu hỏi.` : 'Supabase chưa có câu hỏi. Hãy import seed trước.'); return false; }
    const mapped = data.map(rowToQuestion);
    RAW = mapped;
    pool = [...RAW];
    var _asub = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    var _sci = _asub ? (+localStorage.getItem('learninghub_progress_'+_asub)||0) : ci;
    ci = Math.max(0, Math.min(_sci, pool.length - 1));
    flipped = false;
    if ($id('total')) $id('total').textContent = pool.length;
    renderCard();
    renderQuiz();
    renderStudy();
    notify2('Đã tải câu hỏi từ Supabase');
    return true;
  }


  async function signInGoogle(){
    if (!window.supabase) return alert('Không tải được Supabase. Kiểm tra mạng hoặc CDN.');
    if (!client) return alert('Supabase chưa sẵn sàng.');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] }
    });
    if (error) alert(error.message);
  }

  async function signIn(){
    if (!client) return;
    const email = $id('authEmail')?.value.trim();
    const password = $id('authPassword')?.value;
    if (!email || !password) return alert('Nhập email và mật khẩu nha.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    currentUser = data.user;
    await loadProfile();
    await loadQuestionsFromSupabase();
    closeAuth();
    notify2('Đã đăng nhập');
  }

  async function signUp(){
    if (!client) return;
    const email = $id('authEmail')?.value.trim();
    const password = $id('authPassword')?.value;
    if (!email || !password) return alert('Nhập email và mật khẩu nha.');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Đã tạo tài khoản. Nếu Supabase yêu cầu xác nhận email, hãy xác nhận rồi đăng nhập.');
  }

  async function signOut(){
    if (!client) return;
    await client.auth.signOut();
    currentUser = null;
    currentProfile = null;
    updateAuthUI();
    notify2('Đã đăng xuất');
  }

  async function submitEditRequest(newDraft, oldQ){
    if (!client) return alert('Chưa cấu hình Supabase.');
    if (!currentUser) { openAuth(); return; }
    if (!oldQ?.id) {
      alert('Câu hỏi hiện đang lấy từ data local. Hãy đăng nhập và tải questions từ Supabase trước khi gửi yêu cầu sửa.');
      return;
    }
    const payload = {
      question_id: oldQ.id,
      question_num: oldQ.num,
      user_id: currentUser.id,
      user_email: currentUser.email || currentProfile?.email || '',
      old_data: questionToRow(oldQ),
      new_data: questionToRow(newDraft),
      reason: '',
      status: 'pending'
    };
    const { error } = await client.from('edit_requests').insert(payload);
    if (error) return alert('Gửi yêu cầu sửa thất bại: ' + error.message);
    $id('editModal')?.classList.add('hidden');
    notify2('Đã gửi yêu cầu sửa, đang chờ admin duyệt');
  }

  async function loadPendingRequests(){
    if (!client || !isAdmin()) return;
    const list = $id('adminRequests');
    const count = $id('adminCount');
    if (list) list.innerHTML = '<div class="more">Đang tải...</div>';
    const { data, error } = await client.from('edit_requests').select('*').eq('status','pending').order('created_at',{ascending:false});
    if (error) { if(list) list.innerHTML = '<div class="more">'+error.message+'</div>'; return; }
    if (count) count.textContent = `${data.length} yêu cầu`;
    if (!list) return;
    list.innerHTML = data.length ? data.map(r => `
      <div class="adminReq" data-request-id="${r.id}">
        <div class="adminReqHead"><span>Request #${r.id} · Câu ${r.question_num || r.question_id}</span><span>${new Date(r.created_at).toLocaleString()}</span></div>
        <div class="compareGrid">
          <div class="compareBox"><h4>Nội dung cũ</h4><pre>${esc(safeJson(r.old_data))}</pre></div>
          <div class="compareBox"><h4>Nội dung đề xuất</h4><pre>${esc(safeJson(r.new_data))}</pre></div>
        </div>
        <div class="adminActions">
          <button class="btn approveBtn" data-approve="${r.id}">Duyệt</button>
          <button class="btn rejectBtn" data-reject="${r.id}">Từ chối</button>
        </div>
      </div>`).join('') : '<div class="more">Không có yêu cầu chờ duyệt.</div>';
    list.querySelectorAll('[data-approve]').forEach(btn => btn.onclick = () => approveRequest(Number(btn.dataset.approve), data.find(x=>x.id===Number(btn.dataset.approve))));
    list.querySelectorAll('[data-reject]').forEach(btn => btn.onclick = () => rejectRequest(Number(btn.dataset.reject)));
  }

  async function approveRequest(id, req){
    if (!client || !isAdmin()) return alert('Chỉ admin mới duyệt được.');
    if (!req) {
      const res = await client.from('edit_requests').select('*').eq('id', id).single();
      if (res.error) return alert(res.error.message);
      req = res.data;
    }
    const qUpdate = req.new_data || {};
    const { error: qErr } = await client.from('questions').update({
      question: qUpdate.question,
      options: qUpdate.options || {},
      answer: qUpdate.answer,
      answer_text: qUpdate.answer_text,
      images: qUpdate.images || []
    }).eq('id', req.question_id);
    if (qErr) return alert('Không cập nhật được question: ' + qErr.message);

    const { error: rErr } = await client.from('edit_requests').update({
      status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: currentUser.id
    }).eq('id', id);
    if (rErr) return alert('Không cập nhật request: ' + rErr.message);

    await client.from('question_history').insert({
      question_id: req.question_id,
      request_id: req.id,
      previous_data: req.old_data,
      new_data: req.new_data,
      changed_by: req.user_id,
      approved_by: currentUser.id
    });
    notify2('Đã duyệt yêu cầu');
    await loadPendingRequests();
    await loadQuestionsFromSupabase();
  }

  async function rejectRequest(id){
    if (!client || !isAdmin()) return alert('Chỉ admin mới từ chối được.');
    const note = prompt('Lý do từ chối (tuỳ chọn):') || '';
    const { error } = await client.from('edit_requests').update({
      status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: currentUser.id
    }).eq('id', id);
    if (error) return alert(error.message);
    notify2('Đã từ chối yêu cầu');
    await loadPendingRequests();
  }

  async function init(){
    setupHeaderAuthUI();
    $id('authGoogle')?.addEventListener('click', signInGoogle);
    $id('authLogin')?.addEventListener('click', signIn);
    $id('authSignup')?.addEventListener('click', signUp);
    $id('authClose')?.addEventListener('click', closeAuth);
    $id('adminClose')?.addEventListener('click', closeAdmin);
    $id('adminReload')?.addEventListener('click', loadPendingRequests);

    if (!configured()) { updateAuthUI(); return; }
    client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) { await loadProfile(); await loadQuestionsFromSupabase(); }
    else updateAuthUI();

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) { await loadProfile(); await loadQuestionsFromSupabase(); }
      else { currentProfile = null; updateAuthUI(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, isReady, isAdmin, submitEditRequest, loadQuestionsFromSupabase, openAuth, openAdmin, signOut, signInGoogle, getUser: () => currentUser, getProfile: () => currentProfile, get __client(){ return client; } };
})();

// ===== HOD Login + Admin UI (added) =====
(function(){
  function $(id){ return document.getElementById(id); }
  function hideLanding(){ $('hodLoginScreen')?.classList.add('hidden'); }
  function openLogin(){ hideLanding(); if(window.HODSupabase?.openAuth) window.HODSupabase.openAuth(); else alert('Supabase UI chưa sẵn sàng, hãy tải lại trang.'); }
  function openAdmin(){ hideLanding(); if(window.HODSupabase?.isAdmin?.()) window.HODSupabase.openAdmin(); else { if(window.HODSupabase?.openAuth) window.HODSupabase.openAuth(); setTimeout(()=>alert('Đăng nhập tài khoản admin trước. Sau đó bấm nút Admin lại.'),80); } }
  function bind(){
    $('hodGuestEnter')?.addEventListener('click', hideLanding);
    $('hodOpenLogin')?.addEventListener('click', openLogin);
    $('hodOpenAdmin')?.addEventListener('click', openAdmin);
    $('hodFloatLogin')?.addEventListener('click', openLogin);
    $('hodFloatAdmin')?.addEventListener('click', openAdmin);
    const box = document.querySelector('#authModal .box.authBox');
    if(box && !document.getElementById('hodAuthExtraHint')){
      const hint=document.createElement('div');
      hint.id='hodAuthExtraHint';
      hint.className='hodAuthHint';
      hint.textContent='Người học dùng Đăng nhập/Đăng ký. Admin đăng nhập bằng tài khoản đã được set role = admin trong Supabase.';
      box.appendChild(hint);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();

// ===== Admin visibility hard fix =====
(function(){
  function applyAdminGuard(){
    const isAdmin = !!window.HODSupabase?.isAdmin?.();
    document.body?.classList.toggle('hod-is-admin', isAdmin);
    ['adminOpenBtn','hodFloatAdmin'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.classList.toggle('hidden', !isAdmin);
      el.style.display = isAdmin ? '' : 'none';
    });
    const modal=document.getElementById('adminModal');
    if(modal && !isAdmin) modal.classList.add('hidden');
  }
  function patchOpenAdmin(){
    if(!window.HODSupabase || window.HODSupabase.__adminGuardPatched) return;
    const oldOpen = window.HODSupabase.openAdmin;
    window.HODSupabase.openAdmin = function(){
      if(!window.HODSupabase.isAdmin?.()){
        document.getElementById('adminModal')?.classList.add('hidden');
        alert('Tài khoản Google này chưa có quyền admin.');
        applyAdminGuard();
        return;
      }
      return oldOpen?.apply(this, arguments);
    };
    window.HODSupabase.__adminGuardPatched = true;
  }
  function tick(){ patchOpenAdmin(); applyAdminGuard(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 500);
})();

// ===== ACCOUNT AVATAR CLEAN FINAL =====
(function(){
  function $(id){return document.getElementById(id)}
  function user(){return window.HODSupabase?.getUser?.()||null}
  function profile(){return window.HODSupabase?.getProfile?.()||null}
  function isAdmin(){return !!window.HODSupabase?.isAdmin?.()}
  function email(){return profile()?.email || user()?.email || ''}
  function meta(){return user()?.user_metadata || {}}
  function avatarHTML(){const u=meta().avatar_url || meta().picture || ''; const e=email(); const l=(e||'U').trim().charAt(0).toUpperCase(); return u ? '<img src="'+u+'" alt="avatar">' : l}
  function ensureAvatar(){const actions=document.querySelector('.globalTop .actions')||document.querySelector('#fc .actions')||document.querySelector('.actions'); if(!actions||$('hodTopAvatar'))return; const btn=document.createElement('button'); btn.id='hodTopAvatar'; btn.className='hodTopAvatar'; btn.type='button'; btn.onclick=toggleMenu; actions.appendChild(btn)}
  function toggleMenu(){ if(!user()) return showLogin(); updateMenu(); $('hodAccountMenu')?.classList.toggle('hidden') }
  function showLogin(){ document.body?.classList.add('hod-locked'); $('hodLoginGate')?.classList.remove('hidden'); $('hodAccountMenu')?.classList.add('hidden') }
  function hideLogin(){ document.body?.classList.remove('hod-locked'); $('hodLoginGate')?.classList.add('hidden') }
  function login(){const api=window.HODSupabase;if(!api){alert('Supabase chưa sẵn sàng, hãy tải lại trang.');return} if(api.signInGoogle){api.signInGoogle();return} api.openAuth?.()}
  async function logout(){ await window.HODSupabase?.signOut?.(); showLogin(); updateAll() }
  function openDash(){ if(isAdmin()) window.open('admin.html','_blank'); else alert('Tài khoản này không có quyền admin.') }
  function updateMenu(){ const admin=isAdmin(); const mail=$('hodAccountEmail'); if(mail) mail.textContent=email()||'Chưa đăng nhập'; const role=$('hodAccountRole'); if(role) role.textContent=admin?'Admin':'Người học'; const av=$('hodAccountAvatarBig'); if(av) av.innerHTML=avatarHTML(); $('hodAccountDashboard')?.classList.toggle('hidden',!admin) }
  function updateAll(){ ensureAvatar(); const u=user(); const admin=isAdmin(); document.body?.classList.toggle('hod-is-admin-final',admin); if(u) hideLogin(); else showLogin(); const top=$('hodTopAvatar'); if(top){top.innerHTML=avatarHTML(); top.style.display=u?'grid':'none'} const headerAdmin=$('adminOpenBtn'); if(headerAdmin){headerAdmin.remove();} if(!admin)$('adminModal')?.classList.add('hidden'); updateMenu() }
  function patchAdmin(){ if(!window.HODSupabase||window.HODSupabase.__avatarCleanPatch)return; const old=window.HODSupabase.openAdmin; window.HODSupabase.openAdmin=function(){ if(!window.HODSupabase.isAdmin?.()){ $('adminModal')?.classList.add('hidden'); alert('Tài khoản này không có quyền admin.'); return } return old?.apply(this,arguments)}; window.HODSupabase.__avatarCleanPatch=true }
  function bind(){ $('hodGateLoginBtn')?.addEventListener('click',login); $('hodLogoutBtn')?.addEventListener('click',logout); $('hodAccountDashboard')?.addEventListener('click',openDash); document.addEventListener('click',e=>{const m=$('hodAccountMenu'),a=$('hodTopAvatar'); if(m&&!m.contains(e.target)&&a&&!a.contains(e.target))m.classList.add('hidden')}); setInterval(()=>{patchAdmin();updateAll()},500); setTimeout(()=>{patchAdmin();updateAll()},250) }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind); else bind();
})();







// ===== LEARNING HUB MERGED SUBJECT PATCH START =====
(function(){
  const HUB_URL='https://bdbkpqnhavyoalgkvqtw.supabase.co';
  const HUB_KEY='sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB';
  const SUBJECT_STORE='learninghub_subject_code_merged_v1';
  let subjectClient=null, subjectsCache=[], pickedCode=localStorage.getItem(SUBJECT_STORE)||'', lock=false;
  function c(){ if(!window.supabase) return null; if(!subjectClient) subjectClient=window.supabase.createClient(HUB_URL,HUB_KEY); return subjectClient; }
  function $(id){ return document.getElementById(id); }
  function esc2(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function user(){ return window.HODSupabase?.getUser?.() || null; }
  function logged(){ return !!user(); }
  function subjectCode(){ return localStorage.getItem(SUBJECT_STORE)||''; }
  function setSubject(code){ if(code) localStorage.setItem(SUBJECT_STORE,code); else localStorage.removeItem(SUBJECT_STORE); pickedCode=code||''; syncSubjectTexts(); }
  function meta(code){ return subjectsCache.find(x=>x.code===code) || null; }
  function label(code){ const m=meta(code); return m ? `${m.code} · ${m.name||''}` : (code || 'Chưa chọn môn'); }
  function notifyUX(msg){ if(typeof notify==='function') notify(msg); else console.log(msg); }
  function syncSubjectTexts(){ const code=subjectCode(); if($('subjectInlineText')) $('subjectInlineText').textContent=code?label(code):'Chưa chọn môn'; if($('hodAccountSubjectText')) $('hodAccountSubjectText').textContent=code?label(code):'Chưa chọn môn'; ensureChip(); const chip=$('subjectTopChip'); if(chip){ chip.textContent=code?label(code):'Chọn môn'; chip.classList.toggle('hidden',!logged()); } }
  function ensureChip(){ const actions=document.querySelector('#fc .actions')||document.querySelector('.actions'); if(!actions||$('subjectTopChip')) return; const b=document.createElement('button'); b.id='subjectTopChip'; b.type='button'; b.className='subjectChip hidden'; b.onclick=()=>openGate(); actions.prepend(b); }
  function updateBrand(code){ const b=document.querySelector('.brand'); if(!b) return; const m=meta(code)||{code:code||'LEARN', name:code?'':'Hub'}; b.innerHTML=`${esc2(m.code||'LEARN')}<span>${esc2(m.name ? ' / '+m.name : ' Hub')}</span>`; }
  function closeAccountMenu(){ $('hodAccountMenu')?.classList.add('hidden'); }
  function gateOn(on){ document.body.classList.toggle('has-subject-gate',!!on); $('subjectGate')?.classList.toggle('hidden',!on); $('subjectGate')?.setAttribute('aria-hidden', on?'false':'true'); }
  function showErr(msg){ const e=$('subjectError'); if(e){ e.textContent=msg; e.classList.remove('hidden'); } }
  function clearErr(){ $('subjectError')?.classList.add('hidden'); }
  function showLoading(on,msg='Đang tải danh sách môn học...'){ const e=$('subjectLoading'); if(e){ e.textContent=msg; e.classList.toggle('hidden',!on);} }
  function fallbackSubjects(){ return [{code:'HOD102', name:'HOD102 Learning', description:'Môn mặc định để bắt đầu học.', cover:'', is_active:true},{code:'MLN111', name:'MLN111 Learning', description:'Bộ câu hỏi và tài liệu MLN111.', cover:'', is_active:true}]; }
  async function getSubjects(){ const supa=c(); if(!supa||!logged()) return fallbackSubjects(); const {data,error}=await supa.from('subjects').select('*').eq('is_active', true).order('sort_order',{ascending:true}).order('code',{ascending:true}); if(error || !data || !data.length){ console.warn(error||'No subjects'); showErr('Không tải được danh sách môn học. Đang dùng môn mặc định.'); return fallbackSubjects(); } return data; }
  function card(s){ return `<button class="subjectCard ${pickedCode===s.code?'active':''}" data-code="${esc2(s.code)}" type="button"><span class="subjectCardCode">${esc2(s.code)}</span><h3>${esc2(s.name||s.code)}</h3><p>${esc2(s.description||'Môn học chưa có mô tả.')}</p><div class="subjectMeta"><span>${s.is_active===false?'Tạm ẩn':'Sẵn sàng học'}</span><span class="subjectChoose">${pickedCode===s.code?'Đã chọn':'Chọn môn'}</span></div></button>`; }
  function applyPicked(){ if($('subjectPickedText')) $('subjectPickedText').textContent=pickedCode?label(pickedCode):'Chưa chọn môn'; if($('subjectEnter')) $('subjectEnter').disabled=!pickedCode; document.querySelectorAll('.subjectCard').forEach(x=>x.classList.toggle('active',x.dataset.code===pickedCode)); }
  function renderSubjects(){ const list=$('subjectList'); if(!list) return; const q=(($('subjectSearch')?.value)||'').trim().toLowerCase(); const arr=subjectsCache.filter(s=>!q||`${s.code||''} ${s.name||''} ${s.description||''}`.toLowerCase().includes(q)); list.innerHTML=arr.map(card).join(''); $('subjectEmpty')?.classList.toggle('hidden',!!arr.length); list.querySelectorAll('.subjectCard').forEach(x=>x.onclick=()=>{ pickedCode=x.dataset.code; applyPicked(); }); applyPicked(); }
  async function refreshSubjects(){ if(!logged()) return; clearErr(); showLoading(true); try{ subjectsCache=await getSubjects(); if(!pickedCode && subjectCode()) pickedCode=subjectCode(); if(!pickedCode && subjectsCache[0]) pickedCode=subjectsCache[0].code; renderSubjects(); syncSubjectTexts(); } finally { showLoading(false); } }
  function openGate(){ if(!logged()) return; if($('subjectUserEmail')) $('subjectUserEmail').textContent=user()?.email||'Chưa đăng nhập'; gateOn(true); closeAccountMenu(); refreshSubjects(); }
  function closeGate(){ gateOn(false); }
  async function loadBySubject(code){ const supa=c(); if(!supa || !logged() || !code) return false; const {data,error}=await supa.from('questions').select('*').eq('is_active', true).eq('subject_code', code).order('num',{ascending:true}); if(error){ console.warn(error); notifyUX('Không tải được dữ liệu môn học.'); return false; } if(!data || !data.length){ RAW=[]; pool=[]; ci=0; if($('idx')) $('idx').textContent='0'; if($('total')) $('total').textContent='0'; try{renderStudy()}catch(e){} try{renderQuiz()}catch(e){} notifyUX(`Môn ${code} chưa có dữ liệu.`); return false; } RAW=data.map(r=>({ id:r.id, subject_code:r.subject_code||code, num:r.num, question:r.question, options:r.options||{}, answer:r.answer, answer_text:r.answer_text, images:r.images || [] })); pool=[...RAW]; var _saved=+localStorage.getItem('learninghub_progress_'+code)||0; ci=Math.max(0,Math.min(_saved,pool.length-1)); flipped=false; if($('idx')) $('idx').textContent=String(ci+1); if($('total')) $('total').textContent=String(pool.length); updateBrand(code); syncSubjectTexts(); try{renderCard()}catch(e){} try{renderQuiz()}catch(e){} try{renderStudy()}catch(e){} notifyUX(`Đã tải ${label(code)}`); return true; }
  async function enterSubject(){ if(!pickedCode) return; setSubject(pickedCode); closeGate(); await loadBySubject(pickedCode); }
  async function logoutGate(){ closeGate(); setSubject(''); await window.HODSupabase?.signOut?.(); }
  function patchSubmit(){ if(window.__hubPatchSubmitMerged || !window.HODSupabase?.submitEditRequest) return; window.__hubPatchSubmitMerged=true; const old=window.HODSupabase.submitEditRequest.bind(window.HODSupabase); window.HODSupabase.submitEditRequest=async function(newDraft, oldQ){ if(oldQ?.id) return old(newDraft, oldQ); const supa=c(); const code=oldQ?.subject_code || subjectCode(); const num=oldQ?.num; if(supa && code && num){ const {data,error}=await supa.from('questions').select('*').eq('subject_code', code).eq('num', num).maybeSingle(); if(!error && data) oldQ={...oldQ,id:data.id,subject_code:data.subject_code||code}; } return old(newDraft, oldQ); }; }
  function patchSave(){ if(window.__hubPatchSaveMerged || typeof saveEditor!=='function') return; window.__hubPatchSaveMerged=true; const old=saveEditor; saveEditor=async function(){ let oldQ=clone(RAW.find(c=>c.num===editDraft.num)||pool[ci]||editDraft); editDraft.question=$('editQuestion').value.trim(); editDraft.answer=$('editAnswer').value.trim().toUpperCase(); let ops={}; document.querySelectorAll('[data-opt]').forEach(t=>{ if(t.value.trim()) ops[t.dataset.opt]=t.value.trim(); }); editDraft.options=ops; editDraft.answer_text=answerText(editDraft); editDraft.subject_code=subjectCode(); if(window.HODSupabase&&window.HODSupabase.isReady()){ await window.HODSupabase.submitEditRequest(editDraft, oldQ); return; } return old(); }; }
  function patchSignOut(){ if(window.__hubPatchSignoutMerged || !window.HODSupabase?.signOut) return; window.__hubPatchSignoutMerged=true; const old=window.HODSupabase.signOut.bind(window.HODSupabase); window.HODSupabase.signOut=async function(){ setSubject(''); return old(); }; }
  function ensureChangeBtn(){ if(!$('hodChangeSubjectBtn')) return; $('hodChangeSubjectBtn').onclick=e=>{ e?.preventDefault?.(); openGate(); }; }
  function bind(){ ensureChip(); ensureChangeBtn(); syncSubjectTexts(); $('subjectRefresh')?.addEventListener('click', refreshSubjects); $('subjectSearch')?.addEventListener('input', renderSubjects); $('subjectEnter')?.addEventListener('click', enterSubject); $('subjectLogout')?.addEventListener('click', logoutGate); if(logged() && subjectCode()) loadBySubject(subjectCode()); setInterval(async()=>{ if(lock) return; lock=true; try{ ensureChip(); ensureChangeBtn(); patchSubmit(); patchSave(); patchSignOut(); syncSubjectTexts(); if(logged()){ if(!subjectCode()) openGate(); } else { closeGate(); setSubject(''); } } finally { lock=false; } }, 700); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====


// ===== PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY =====
(function(){
  const SUBJECT_STORE='learninghub_subject_code_merged_v1';
  const $=id=>document.getElementById(id);
  const code=()=>localStorage.getItem(SUBJECT_STORE)||'';
  const supa=()=>window.HODSupabase?.__client||null;
  const logged=()=>!!window.HODSupabase?.getUser?.();
  function empty(msg){
    try{RAW=[];pool=[];ci=0;flipped=false;randomActive=false;localStorage.setItem('hod102_random_active','0')}catch(e){}
    try{if($('idx'))$('idx').textContent='0';if($('total'))$('total').textContent='0';if($('bar'))$('bar').style.width='0%';if($('question'))$('question').textContent=msg||'Chưa tải dữ liệu từ Supabase';if($('options'))$('options').innerHTML='';if($('images'))$('images').innerHTML='';renderQuiz?.();renderStudy?.();}catch(e){}
  }
  async function loadSubjectOnly(){
    const c=supa(), subject=code();
    if(!c||!logged()){empty('Đăng nhập để tải dữ liệu từ Supabase');return false;}
    if(!subject){empty('Chọn môn để tải dữ liệu từ Supabase');return false;}
    const {data,error}=await c.from('questions').select('*').eq('is_active',true).eq('subject_code',subject).order('num',{ascending:true});
    if(error){console.warn('[NO LOCAL] Supabase load error',error);empty('Không tải được dữ liệu Supabase');return false;}
    RAW=(data||[]).map(r=>({id:r.id,subject_code:r.subject_code||subject,num:r.num,question:r.question,options:r.options||{},answer:r.answer,answer_text:r.answer_text,images:r.images||[]}));
    var _saved2=+localStorage.getItem('learninghub_progress_'+subject)||0;pool=[...RAW];ci=Math.max(0,Math.min(_saved2,pool.length-1));flipped=false;randomActive=false;localStorage.setItem('hod102_random_active','0');
    try{if($('idx'))$('idx').textContent=RAW.length?String(ci+1):'0';if($('total'))$('total').textContent=String(RAW.length);renderCard();renderQuiz();renderStudy();syncSubjectTexts?.();updateCardTools?.();}catch(e){console.warn('[NO LOCAL] render error',e)}
    return true;
  }
  window.loadCurrentSubjectOnly=loadSubjectOnly;
  function patchLoaders(){
    try{window.rebuild=function(){RAW=[];pool=[];return RAW}}catch(e){}
    if(window.HODSupabase){
      window.HODSupabase.loadQuestionsFromSupabase=loadSubjectOnly;
    }
  }
  function enforceNoLocal(){
    patchLoaders();
    const subject=code();
    try{
      if(!Array.isArray(RAW)||!RAW.length){ if(logged()&&subject) loadSubjectOnly(); return; }
      if(RAW.some(q=>!q.id || !q.subject_code || q.subject_code!==subject)) loadSubjectOnly();
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    empty('Đang chờ dữ liệu Supabase...');
    patchLoaders();
    setTimeout(loadSubjectOnly,150);
    setTimeout(loadSubjectOnly,600);
    setInterval(enforceNoLocal,1000);
  });
  patchLoaders();
})();


// ===== PATCH_REMOVE_RANDOM_FEATURE_FINAL =====
(function(){
  function $(id){return document.getElementById(id)}
  function hide(){['shuffle','stShuffle'].forEach(id=>{let e=$(id);if(e){e.style.display='none';e.disabled=true;e.onclick=()=>false;}});try{randomActive=false;localStorage.setItem('hod102_random_active','0')}catch(e){}}
  window.shuffle=shuffle=function(){hide();return false};
  document.addEventListener('DOMContentLoaded',()=>{hide();setTimeout(hide,300);setTimeout(hide,1000)});
  hide();
})();


// ===== PATCH_REPORT_UX_SIMPLE_SEND_AND_LIST =====
(function(){
  const $=id=>document.getElementById(id);
  const supa=()=>window.HODSupabase?.__client||null;
  const user=()=>window.HODSupabase?.getUser?.()||null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function patchText(){if($('saveEdit'))$('saveEdit').textContent='Gửi báo cáo';if($('editTitle'))$('editTitle').textContent=$('editTitle').textContent.replace('Báo cáo / đề xuất sửa câu','Báo cáo câu').replace('Sửa câu','Báo cáo câu');}
  const oldOpen=window.openEditor||openEditor;
  window.openEditor=openEditor=function(){oldOpen&&oldOpen();setTimeout(patchText,0);};
  function ensureBox(){let m=$('hodAccountMenu');if(!m||$('hodReportBox'))return;let box=document.createElement('div');box.id='hodReportBox';box.className='hodReportBox';box.innerHTML='<div class="hodReportTitle"><span>Báo cáo đã gửi</span><button id="hodReportRefresh" class="hodReportRefresh" type="button">Tải lại</button></div><div id="hodReportList" class="hodReportList"><div class="hodReportMeta">Chưa tải.</div></div>';let lo=$('hodLogoutBtn');lo?m.insertBefore(box,lo):m.appendChild(box);$('hodReportRefresh').onclick=loadReports;}
  async function loadReports(){ensureBox();let list=$('hodReportList'),c=supa(),u=user();if(!list)return;if(!c||!u){list.innerHTML='<div class="hodReportMeta">Đăng nhập để xem báo cáo.</div>';return;}list.innerHTML='<div class="hodReportMeta">Đang tải...</div>';let {data,error}=await c.from('edit_requests').select('id,question_num,status,admin_note,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(20);if(error){list.innerHTML='<div class="hodReportMeta">Không tải được báo cáo.</div>';return;}if(!data?.length){list.innerHTML='<div class="hodReportMeta">Bạn chưa gửi báo cáo nào.</div>';return;}let st=s=>({pending:'Đang chờ',approved:'Đã duyệt',rejected:'Từ chối'}[s]||s);list.innerHTML=data.map(r=>`<div class="hodReportItem"><b>Câu ${esc(r.question_num||'?')}</b><span class="hodReportStatus ${esc(r.status)}">${esc(st(r.status))}</span><div class="hodReportMeta">Gửi: ${esc(new Date(r.created_at).toLocaleString('vi-VN'))}</div>${r.admin_note?`<div class="hodReportMeta">Ghi chú: ${esc(r.admin_note)}</div>`:''}</div>`).join('');}
  document.addEventListener('DOMContentLoaded',()=>{ensureBox();setTimeout(ensureBox,500);$('hodTopAvatar')?.addEventListener('click',()=>setTimeout(loadReports,150));});
})();


// ===== PATCH_SUPABASE_SINGLE_SOURCE_ONLY =====
(function(){
  try { window.HOD_DATA = []; } catch(e) {}
  try {
    const dataNode = document.getElementById('data');
    if (dataNode) dataNode.textContent = '[]';
  } catch(e) {}
})();
