window.HOD_DATA=[];
(function(){var s=document.createElement('script');s.type='application/json';s.id='data';s.textContent='[]';document.head.appendChild(s);})();

/* ===== merged app logic ===== */

﻿'use strict';const dataEl=document.getElementById('data'),BASE=[],STORE='hod102_user_edits_v1';let edits={};try{edits=JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){}function clone(x){return JSON.parse(JSON.stringify(x))}
function notify(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.remove('hidden');t.classList.add('show');clearTimeout(t._tid);t._tid=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('show')},2200)}let RAW=[],pool=[],ci=Math.max(0,Math.min(+localStorage.getItem('hod102_ci')||0,BASE.length-1)),flipped=false,flipDir='horizontal',cardFontSize=localStorage.getItem('hod102_card_font_size_v3')||'1',flipMode=localStorage.getItem('hod102_flip_mode')||'single',hideOptions=localStorage.getItem('hod102_hide_options')==='1',randomActive=localStorage.getItem('hod102_random_active')==='1',qCnt=20,qSet=[],qDone={},qSel={},quizMode='practice',examSubmitted=false,timerInt=null,examStart=0,editDraft=null;function rebuild(){RAW=BASE.map(c=>Object.assign(clone(c),edits[c.num]||{}));pool=pool.length?pool.map(o=>RAW.find(c=>c.num===o.num)||o):[...RAW]}rebuild();const $=id=>document.getElementById(id);function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}function sortAns(s){return(s||'').split('').sort().join('')}function answerText(c){return(c.answer||'').split('').map(ch=>ch+'. '+(c.options?.[ch]||'')).join('; ')}function optionsHTML(c){return Object.entries(c.options||{}).map(([k,v])=>`<div class="opt"><div class="letter">${k}</div><div class="ot">${esc(v)}</div></div>`).join('')}function imgsHTML(c){return(c.images||[]).map(im=>`<img src="${esc(im.src)}" alt="">`).join('')}function setv(k,v){document.documentElement.style.setProperty(k,v)}function fit(c){
  setv('--qfs','1.08rem');setv('--ofs','.92rem');setv('--qlh','1.32');setv('--olh','1.36');setv('--afs','1rem');
  setv('--imgmax',(c.images&&c.images.length)?'380px':'0px');setv('--imgcol',(c.images&&c.images.length)?'620px':'0px');
  setv('--frontpad','14px 18px');setv('--optgap','6px');setv('--optpad','7px 10px');setv('--qmb','8px');setv('--imgmb','7px');setv('--tagmb','6px');setv('--letter','25px');setv('--letterfs','.76rem');setv('--tagfs','.62rem');setv('--tagpad','3px 10px');setv('--ogap','8px');
}
function fitVisible(){return;}
function renderCard(){let c=pool[ci]||RAW[0];if(!c)return;fit(c);applyCardFontSize();$('idx').textContent=ci+1;$('total').textContent=pool.length;$('bar').style.width=((ci+1)/pool.length*100)+'%';$('tag').textContent='CÂU '+c.num;$('question').textContent=c.question;$('images').innerHTML=imgsHTML(c);$('images').style.display=(c.images&&c.images.length)?'flex':'none';document.querySelector('#fc .front')?.classList.toggle('hasImg',!!(c.images&&c.images.length));$('options').innerHTML=optionsHTML(c);$('options').classList.toggle('hide',hideOptions);applyCardFontSize();$('toggleOpts').textContent='👁';$('toggleOpts').title=hideOptions?'Hiện lựa chọn':'Ẩn lựa chọn';updateCardTools();$('ansLetter').textContent=(c.answer||'').split('').join(', ');$('ansText').innerHTML=esc(finalAnswerText(c)).replace(/; /g,'<br>');$('card').classList.remove('dir-horizontal','dir-up','dir-down');$('card').classList.add('dir-'+flipDir);$('card').classList.toggle('flip',flipped);$('mode').textContent=flipMode==='single'?'1x':'2x';var _sc=localStorage.getItem('learninghub_subject_code_merged_v1')||'';localStorage.setItem('hod102_ci',ci);if(_sc)localStorage.setItem('learninghub_progress_'+_sc,ci);localStorage.setItem('hod102_flip_mode',flipMode);localStorage.setItem('hod102_hide_options',hideOptions?'1':'0')}function flip(dir='horizontal'){flipDir=dir;flipped=!flipped;renderCard()}function next(){ci=(ci+1)%pool.length;flipped=false;flipDir='horizontal';renderCard()}function prev(){ci=(ci-1+pool.length)%pool.length;flipped=false;flipDir='horizontal';renderCard()}function shuffle(){for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}ci=0;flipped=false;flipDir='horizontal';randomActive=false;localStorage.setItem('hod102_random_active','0');renderCard();let sh=$('shuffle');if(sh){sh.classList.add('flash');setTimeout(()=>sh.classList.remove('flash'),650)}}let __allowUserReset=false;function reset(force){if(force!==true&&__allowUserReset!==true){try{renderCard()}catch(e){}return}__allowUserReset=false;pool=[...RAW];ci=0;flipped=false;flipDir='horizontal';randomActive=false;localStorage.setItem('hod102_random_active','0');renderCard()}function triggerReset(){__allowUserReset=true;reset(true)}function switchTab(n,b){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));$(n).classList.add('active');if(n==='study')renderStudy()}function sample(a,n){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return n?a.slice(0,n):a}function fmt(ms){let s=Math.floor(ms/1000),m=Math.floor(s/60);s%=60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}function startTimer(){clearInterval(timerInt);examStart=Date.now();timerInt=setInterval(()=>$('timer').textContent=fmt(Date.now()-examStart),1000)}function stopTimer(){clearInterval(timerInt)}function syncQuizSet(){if(qSet&&qSet.length){qSet=qSet.map(c=>RAW.find(x=>x.num===c.num)||c)}}function renderQuiz(){syncQuizSet();let body=$('quizBody');if(!qSet.length){body.innerHTML='<div class="qcard"><div class="qq">Chọn số câu rồi bấm Bắt đầu.</div></div>';return}let done=Object.keys(qDone).length;body.innerHTML=qSet.map((c,i)=>{let rev=quizMode==='practice'?qDone[i]:examSubmitted,hasImg=(c.images||[]).length?' hasImg':'';let opts=Object.entries(c.options).map(([k,v])=>{let sel=(qSel[i]||'').includes(k),cor=c.answer.includes(k),cls='qopt '+(sel?'sel ':'')+(rev&&cor?'cor ':'')+(rev&&sel&&!cor?'wrg ':'')+(rev?'dis':'');return`<div class="${cls}" data-qi="${i}" data-k="${k}"><div class="qkey">${k}</div><div class="qtxt">${esc(v)}</div></div>`}).join('');let fb='';if(rev){let ok=sortAns(qSel[i])===sortAns(c.answer);fb=`<div class="fb ${ok?'ok':'bad'}">${ok?'Đúng':'Chưa đúng'}. Đáp án: <b>${esc(finalAnswerText(c))}</b></div>`}return`<div class="qcard${hasImg}"><div class="qnum">CÂU ${i+1}/${qSet.length} · #${c.num}</div><div class="qq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="qopts">${opts}</div>${quizMode==='practice'&&!qDone[i]?`<button class="check" data-check="${i}">Kiểm tra</button>`:''}${fb}</div>`}).join('')+(quizMode==='exam'&&!examSubmitted?`<button class="submitExam" id="submitExam">Nộp bài · đã chọn ${Object.keys(qSel).length}/${qSet.length}</button>`:(quizMode==='practice'&&done===qSet.length?'<button class="see" id="seeScore">Xem kết quả</button>':''))}function pickAns(i,k){if((quizMode==='practice'&&qDone[i])||examSubmitted)return;let c=qSet[i];if(c.answer.length>1){let set=new Set((qSel[i]||'').split('').filter(Boolean));set.has(k)?set.delete(k):set.add(k);qSel[i]=[...set].sort().join('')}else qSel[i]=k;renderQuiz()}function checkAns(i){if(!qSel[i]){alert('Bạn chọn đáp án trước nha.');return}qDone[i]=true;renderQuiz()}function score(){let ok=0;qSet.forEach((c,i)=>{if(sortAns(qSel[i])===sortAns(c.answer))ok++});let tot=qSet.length,p=Math.round(ok/tot*100);$('scoreOk').textContent=ok;$('scoreBad').textContent=tot-ok;$('scoreTot').textContent=tot;$('scorePct').textContent=p+'%';$('scoreLabel').textContent=p>=90?'Xuất sắc':p>=70?'Ổn áp rồi':p>=50?'Cần ôn thêm':'Làm lại vài vòng nha';$('overlay').classList.remove('hidden')}function smart(q){q=q.trim().toLowerCase();if(!q)return RAW;let m=q.match(/^#(\d+)$/);if(m)return RAW.filter(c=>c.num===+m[1]);m=q.match(/^answer\s*:\s*([a-e]+)$/i);if(m)return RAW.filter(c=>sortAns(c.answer)===sortAns(m[1].toUpperCase()));if(['multi','multiple','chọn nhiều'].includes(q))return RAW.filter(c=>c.answer.length>1);return RAW.filter(c=>(String(c.num)+' '+c.question+' '+c.answer+' '+(c.answer_text||'')+' '+Object.values(c.options).join(' ')).toLowerCase().includes(q))}function renderStudy(){let arr=smart($('search').value||''),max=arr.length;$('studyList').innerHTML=arr.slice(0,max).map(c=>`<div class="sitem"><div class="snum">CÂU ${c.num}</div><div class="sq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${Object.entries(c.options).map(([k,v])=>`<div class="sopt ${c.answer.includes(k)?'ans':''}"><div class="skey">${c.answer.includes(k)?'✓':k}</div><div>${esc(k+'. '+v)}</div></div>`).join('')}</div></div>`).join('')+(arr.length>max?`<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`:arr.length?'':'<div class="more">Không tìm thấy kết quả.</div>')}function openEditor(){let c=pool[ci];editDraft=clone(c);let reporting=!!(window.HODSupabase?.getUser?.())&&!window.HODSupabase?.isAdmin?.();$('editTitle').textContent=(reporting?'Báo cáo / đề xuất sửa câu ':'Sửa câu ')+c.num;if($('saveEdit'))$('saveEdit').textContent=reporting?'Gửi báo cáo cho admin':'Lưu sửa';if($('restoreEdit'))$('restoreEdit').classList.toggle('hidden',reporting);$('editQuestion').value=c.question;$('editAnswer').value=c.answer;renderEditOptions();renderEditImages();$('editModal').classList.remove('hidden')}function renderEditOptions(){let ops=editDraft.options||{};$('editOptions').innerHTML=['A','B','C','D','E'].map(k=>`<div class="field"><label>Đáp án ${k}</label><textarea data-opt="${k}">${esc(ops[k]||'')}</textarea></div>`).join('')}function renderEditImages(){$('editImgs').innerHTML=(editDraft.images||[]).map((im,i)=>`<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${im.src}"></div>`).join('')||'<p style="color:var(--mist)">Chưa có hình.</p>'}function saveEditor(){let oldQ=clone(RAW.find(c=>c.num===editDraft.num)||pool[ci]||editDraft);editDraft.question=$('editQuestion').value.trim();editDraft.answer=$('editAnswer').value.trim().toUpperCase();let ops={};document.querySelectorAll('[data-opt]').forEach(t=>{if(t.value.trim())ops[t.dataset.opt]=t.value.trim()});editDraft.options=ops;editDraft.answer_text=answerText(editDraft);if(window.HODSupabase&&window.HODSupabase.isReady()){window.HODSupabase.submitEditRequest(editDraft,oldQ);return}if(window.HODSupabase?.getUser?.()){alert('Chưa kết nối được dữ liệu duyệt. Hãy tải lại trang rồi gửi lại báo cáo.');return}edits[editDraft.num]={question:editDraft.question,options:editDraft.options,answer:editDraft.answer,answer_text:editDraft.answer_text,images:editDraft.images||[]};localStorage.setItem(STORE,JSON.stringify(edits));rebuild();ci=pool.findIndex(c=>c.num===editDraft.num);if(ci<0)ci=0;flipped=false;renderCard();renderQuiz();renderStudy();$('editModal').classList.add('hidden');notify('Đã lưu sửa local')}function restoreEditor(){delete edits[editDraft.num];localStorage.setItem(STORE,JSON.stringify(edits));rebuild();syncQuizSet();renderCard();renderQuiz();renderStudy();$('editModal').classList.add('hidden');notify('Đã khôi phục')}function exportEdits(){let blob=new Blob([JSON.stringify(edits,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hod102_user_edits.json';a.click();URL.revokeObjectURL(a.href)}function importEditsFile(f){let fr=new FileReader();fr.onload=()=>{try{edits=JSON.parse(fr.result)||{};localStorage.setItem(STORE,JSON.stringify(edits));rebuild();renderCard();renderQuiz();renderStudy();notify('Đã nhập file sửa')}catch(e){alert('File JSON không hợp lệ')}};fr.readAsText(f)}function applyCardFontSize(){let n=parseFloat(cardFontSize||'1');if(!isFinite(n))n=1;n=Math.max(.8,Math.min(1.3,n));cardFontSize=String(n);let root=document.documentElement,fc=$('fc');let set=(k,v)=>{root.style.setProperty(k,v);if(fc)fc.style.setProperty(k,v)};let base=1.35*n;set('--card-qfs',(1.08*base).toFixed(3)+'rem');set('--card-ofs',(.92*base).toFixed(3)+'rem');set('--card-afs',(1.0*base).toFixed(3)+'rem');set('--card-letter',(25*Math.min(1.35,base)).toFixed(0)+'px');set('--card-letterfs',(.76*base).toFixed(3)+'rem');localStorage.setItem('hod102_card_font_size_v3',String(n));if($('stCardFont'))$('stCardFont').value=Math.round(n*100);if($('stCardFontState'))$('stCardFontState').textContent=Math.round(n*100)+'%'}function updateCardTools(){let sh=$('shuffle'),eye=$('toggleOpts');if(sh){sh.classList.remove('active');sh.title='Xáo ngẫu nhiên'}if(eye){eye.classList.toggle('active',!!hideOptions);eye.title=hideOptions?'Đang ẩn lựa chọn':'Đang hiện lựa chọn'}}function setupGlobalHeader(){let top=document.querySelector('#fc .top');let tabs=document.querySelector('.tabs');if(top&&!top.classList.contains('globalTop')){top.classList.add('globalTop');document.body.insertBefore(top,tabs||document.body.firstChild)}}function setupCardTools(){let card=$('card');if(!card||$('cardTools'))return;let tools=document.createElement('div');tools.id='cardTools';tools.className='cardTools';let sh=$('shuffle'),eye=$('toggleOpts'),ed=$('editCard');if(sh){sh.textContent='⚂';sh.classList.add('cardToolBtn','diceBtn');tools.appendChild(sh)}if(eye){eye.textContent='👁';eye.classList.add('cardToolBtn','eyeBtn');tools.appendChild(eye)}tools.addEventListener('click',e=>e.stopPropagation());tools.addEventListener('mousedown',e=>e.stopPropagation());card.insertBefore(tools,ed);updateCardTools()}function updateSettingsUI(){if(!$('stFlipState'))return;$('stFlipState').textContent='Đang dùng: '+(flipMode==='single'?'1x - bấm 1 lần để lật':'2x - hạn chế lật nhầm');$('stOptState').textContent=hideOptions?'Đang ẩn lựa chọn':'Đang hiện lựa chọn';if($('stGoInput'))$('stGoInput').value=(pool[ci]?.num)||'';applyCardFontSize();updateCardTools()}function toggleFlipMode(){flipMode=flipMode==='single'?'double':'single';flipped=false;renderCard();updateSettingsUI()}function goToQuestionNum(){let n=+$('stGoInput').value;if(!n){alert('Nhập số câu trước nha.');return}let i=pool.findIndex(c=>c.num===n);if(i<0)i=RAW.findIndex(c=>c.num===n);if(i<0){alert('Không tìm thấy câu '+n);return}if(!pool.find(c=>c.num===n))pool=[...RAW];ci=i;flipped=false;renderCard();updateSettingsUI();$('settingsModal').classList.add('hidden')}function init(){setupGlobalHeader();document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab,btn));$('shuffle').onclick=shuffle;$('reset').onclick=()=>triggerReset();$('toggleOpts').onclick=()=>{hideOptions=!hideOptions;renderCard()};$('openSettings').onclick=()=>{$('settingsModal').classList.remove('hidden');updateSettingsUI()};$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');document.querySelectorAll('.modal,.overlay').forEach(m=>{m.addEventListener('mousedown',e=>{if(e.target===m)m.classList.add('hidden')})});document.querySelectorAll('.modal .box,.overlay .box').forEach(box=>{if(!box.querySelector('.modalX')){let x=document.createElement('button');x.className='modalX';x.type='button';x.textContent='×';x.title='Đóng';x.onclick=e=>{e.stopPropagation();box.closest('.modal,.overlay')?.classList.add('hidden')};box.prepend(x)}});setupCardTools();if($('toggleGuide'))$('toggleGuide').onclick=()=>{let g=$('guidePanel'),open=g.classList.toggle('hidden')===false;$('toggleGuide').textContent=open?'Ẩn hướng dẫn':'Mở hướng dẫn'};if($('stCardFont'))$('stCardFont').oninput=e=>{cardFontSize=(+e.target.value/100).toFixed(2);applyCardFontSize();renderCard()};if($('stCardFontReset'))$('stCardFontReset').onclick=()=>{cardFontSize='1';applyCardFontSize();renderCard();updateSettingsUI()};if($('stToggleFlipMode'))$('stToggleFlipMode').onclick=toggleFlipMode;if($('stToggleOpts'))$('stToggleOpts').onclick=()=>{hideOptions=!hideOptions;renderCard();updateSettingsUI()};if($('stShuffle'))$('stShuffle').onclick=()=>{shuffle();updateSettingsUI()};if($('stReset'))$('stReset').onclick=()=>{triggerReset();updateSettingsUI()};if($('stGo'))$('stGo').onclick=goToQuestionNum;if($('stGoInput'))$('stGoInput').onkeydown=e=>{if(e.key==='Enter')goToQuestionNum()};if($('stEdit'))$('stEdit').onclick=()=>{openEditor();$('settingsModal').classList.add('hidden')};$('editCard').title='Báo cáo / đề xuất sửa câu';$('editCard').textContent='!';$('editCard').onclick=e=>{e.stopPropagation();openEditor()};$('prev').onclick=prev;$('next').onclick=next;$('mode').onclick=toggleFlipMode;$('zone').onclick=e=>{let r=$('card').getBoundingClientRect();if(!$('card').contains(e.target)){e.clientX<r.left?prev():next();return}if(e.target.closest('#editCard')||e.target.closest('#cardTools'))return;if(flipMode==='single')flip('horizontal')};$('practiceMode').onclick=()=>{quizMode='practice';$('practiceMode').classList.add('sel');$('examMode').classList.remove('sel');$('quizModeLabel').textContent='Practice: kiểm tra từng câu';stopTimer();$('timer').textContent='00:00'};$('examMode').onclick=()=>{quizMode='exam';$('examMode').classList.add('sel');$('practiceMode').classList.remove('sel');$('quizModeLabel').textContent='Exam: nộp bài mới hiện đáp án'};document.querySelectorAll('.cnt').forEach((b,i)=>b.onclick=()=>{qCnt=[10,20,30,40,100,0][i];document.querySelectorAll('.cnt').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')});$('start').onclick=()=>{qSet=sample(RAW,qCnt);qDone={};qSel={};examSubmitted=false;if(quizMode==='exam'){startTimer()}else{stopTimer();$('timer').textContent='00:00'}renderQuiz()};$('quizBody').onclick=e=>{let opt=e.target.closest('.qopt');if(opt)pickAns(+opt.dataset.qi,opt.dataset.k);let chk=e.target.closest('[data-check]');if(chk)checkAns(+chk.dataset.check);if(e.target.id==='seeScore')score();if(e.target.id==='submitExam'){examSubmitted=true;stopTimer();renderQuiz();score()}};$('retry').onclick=()=>{$('overlay').classList.add('hidden');qSet=sample(RAW,qCnt);qDone={};qSel={};examSubmitted=false;if(quizMode==='exam')startTimer();renderQuiz()};$('search').oninput=renderStudy;$('studyList').onclick=e=>{let it=e.target.closest('.sitem');if(it)it.classList.toggle('open')};$('closeEdit').onclick=()=>$('editModal').classList.add('hidden');$('saveEdit').onclick=saveEditor;$('restoreEdit').onclick=restoreEditor;$('editImgs').onclick=e=>{let b=e.target.closest('[data-rm]');if(b){editDraft.images.splice(+b.dataset.rm,1);renderEditImages()}};$('imgUpload').onchange=e=>{[...e.target.files].forEach(file=>{let fr=new FileReader();fr.onload=()=>{editDraft.images=editDraft.images||[];editDraft.images.push({id:'user_'+Date.now(),src:fr.result,source:'user-upload',name:file.name});renderEditImages()};fr.readAsDataURL(file)});e.target.value=''};$('exportEdits').onclick=exportEdits;$('importEdits').onclick=()=>$('importFile').click();$('importFile').onchange=e=>{if(e.target.files[0])importEditsFile(e.target.files[0])};$('clearEdits').onclick=()=>{if(confirm('Xóa tất cả chỉnh sửa đã lưu?')){edits={};localStorage.removeItem(STORE);rebuild();renderCard();notify('Đã xóa tất cả sửa')}};window.onkeydown=e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();flip('horizontal')}if(e.key==='ArrowUp'){e.preventDefault();flip('up')}if(e.key==='ArrowDown'){e.preventDefault();flip('down')}if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev();if(e.key.toLowerCase()==='r')triggerReset();if(e.key.toLowerCase()==='h'){hideOptions=!hideOptions;renderCard()}if(e.key.toLowerCase()==='e')openEditor();if(e.key==='1')document.querySelector('[data-tab="fc"]').click();if(e.key==='2')document.querySelector('[data-tab="quiz"]').click();if(e.key==='3')document.querySelector('[data-tab="study"]').click()};applyCardFontSize();setupCardTools();renderCard();renderQuiz()}document.addEventListener('DOMContentLoaded',init);

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
      answer_text: finalAnswerText(q),
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

  function showPendingApproval(){
    const el = $id('hodPendingApproval');
    if(el) el.classList.remove('hidden');
    const emailEl = $id('hodPendingEmail');
    if(emailEl) emailEl.textContent = currentUser?.email || '';
    $id('hodLoginGate')?.classList.add('hidden');
    document.body?.classList.add('hod-locked');
  }
  function hidePendingApproval(){
    const el = $id('hodPendingApproval');
    if(el) el.classList.add('hidden');
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
      let regMode = 'approval';
      try{
        const {data:setting} = await client.from('site_settings').select('value').eq('key','registration_mode').maybeSingle();
        if(setting && setting.value){
          regMode = typeof setting.value === 'string' ? setting.value.replace(/"/g,'') : String(setting.value);
        }
      }catch(e){}

      if(regMode === 'closed'){
        alert('Hệ thống hiện không cho phép đăng ký mới. Vui lòng liên hệ admin.');
        await signOut();
        return null;
      }

      const autoApprove = (regMode === 'open');
      const ins = await client.from('profiles')
        .insert({ ...base, role: 'user', blocked: false, approved: autoApprove })
        .select('*')
        .single();
      if (ins.error) {
        console.warn('Không tạo được profile mới:', ins.error);
        currentProfile = { ...base, role: 'user', blocked: false, approved: autoApprove };
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

    if (currentProfile?.approved === false) {
      showPendingApproval();
      return null;
    }
    hidePendingApproval();

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
    if (error) { if(list) list.innerHTML = '<div class="more">'+esc(error.message)+'</div>'; return; }
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

    const histResult = await client.from('question_history').insert({
      question_id: req.question_id,
      request_id: req.id,
      previous_data: req.old_data,
      new_data: req.new_data,
      changed_by: req.user_id,
      approved_by: currentUser.id
    });
    if (histResult.error) console.warn('Không lưu được lịch sử:', histResult.error);
    notify2('Đã duyệt yêu cầu');
    try { await loadPendingRequests(); } catch(e) { console.warn('loadPendingRequests failed:', e); }
    try { await loadQuestionsFromSupabase(); } catch(e) { console.warn('loadQuestions failed:', e); }
  }

  async function rejectRequest(id){
    if (!client || !isAdmin()) return alert('Chỉ admin mới từ chối được.');
    const note = prompt('Lý do từ chối (tuỳ chọn):') || '';
    const { error } = await client.from('edit_requests').update({
      status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: currentUser.id
    }).eq('id', id);
    if (error) return alert(error.message);
    notify2('Đã từ chối yêu cầu');
    try { await loadPendingRequests(); } catch(e) { console.warn('loadPendingRequests failed:', e); }
  }

  async function init(){
    setupHeaderAuthUI();
    $id('authGoogle')?.addEventListener('click', signInGoogle);
    $id('authLogin')?.addEventListener('click', signIn);
    $id('authSignup')?.addEventListener('click', signUp);
    $id('authClose')?.addEventListener('click', closeAuth);
    $id('adminClose')?.addEventListener('click', closeAdmin);
    $id('adminReload')?.addEventListener('click', loadPendingRequests);
    $id('hodPendingRefresh')?.addEventListener('click', async () => {
      const btn = $id('hodPendingRefresh');
      if(btn){ btn.disabled = true; btn.textContent = 'Đang kiểm tra...'; }
      await loadProfile();
      if(currentProfile?.approved !== false) await loadQuestionsFromSupabase();
      if(btn){ btn.disabled = false; btn.textContent = 'Kiểm tra lại'; }
    });
    $id('hodPendingLogout')?.addEventListener('click', async () => {
      await signOut();
      hidePendingApproval();
    });

    if (!configured()) { updateAuthUI(); return; }
    client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) { const prof = await loadProfile(); if(prof) await loadQuestionsFromSupabase(); }
    else updateAuthUI();

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) { const prof = await loadProfile(); if(prof) await loadQuestionsFromSupabase(); }
      else { currentProfile = null; updateAuthUI(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, isReady, isAdmin, submitEditRequest, loadQuestionsFromSupabase, openAuth, openAdmin, signOut, signInGoogle, getUser: () => currentUser, getProfile: () => currentProfile, get __client(){ if(typeof console!=='undefined')console.warn('__client is deprecated'); return client; } };
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
  function avatarHTML(){const u=meta().avatar_url || meta().picture || ''; const e=email(); const l=(e||'U').trim().charAt(0).toUpperCase(); return u ? '<img src="'+esc(u)+'" alt="avatar">' : l}
  function ensureAvatar(){const actions=document.querySelector('.globalTop .actions')||document.querySelector('#fc .actions')||document.querySelector('.actions'); if(!actions||$('hodTopAvatar'))return; const btn=document.createElement('button'); btn.id='hodTopAvatar'; btn.className='hodTopAvatar'; btn.type='button'; btn.onclick=toggleMenu; actions.appendChild(btn)}
  function toggleMenu(){ if(!user()) return showLogin(); updateMenu(); $('hodAccountMenu')?.classList.toggle('hidden') }
  function showLogin(){ document.body?.classList.add('hod-locked'); $('hodLoginGate')?.classList.remove('hidden'); $('hodAccountMenu')?.classList.add('hidden'); $('hodPendingApproval')?.classList.add('hidden'); }
  function hideLogin(){ document.body?.classList.remove('hod-locked'); $('hodLoginGate')?.classList.add('hidden'); }
  function login(){const api=window.HODSupabase;if(!api){alert('Supabase chưa sẵn sàng, hãy tải lại trang.');return} if(api.signInGoogle){api.signInGoogle();return} api.openAuth?.()}
  async function logout(){ await window.HODSupabase?.signOut?.(); showLogin(); updateAll() }
  function openDash(){ if(isAdmin()) window.open('admin.html','_blank'); else alert('Tài khoản này không có quyền admin.') }
  function updateMenu(){ const admin=isAdmin(); const mail=$('hodAccountEmail'); if(mail) mail.textContent=email()||'Chưa đăng nhập'; const role=$('hodAccountRole'); if(role) role.textContent=admin?'Admin':'Người học'; const av=$('hodAccountAvatarBig'); if(av) av.innerHTML=avatarHTML(); $('hodAccountDashboard')?.classList.toggle('hidden',!admin) }
  function updateAll(){ ensureAvatar(); const u=user(); const p=profile(); const admin=isAdmin(); const pending=u && p && p.approved===false; document.body?.classList.toggle('hod-is-admin-final',admin); if(pending){ $('hodLoginGate')?.classList.add('hidden'); $('hodPendingApproval')?.classList.remove('hidden'); document.body?.classList.add('hod-locked'); const emailEl=$('hodPendingEmail'); if(emailEl) emailEl.textContent=p.email||u.email||''; } else if(u){ hideLogin(); $('hodPendingApproval')?.classList.add('hidden'); } else { showLogin(); } const top=$('hodTopAvatar'); if(top){top.innerHTML=avatarHTML(); top.style.display=(u&&!pending)?'grid':'none'} const headerAdmin=$('adminOpenBtn'); if(headerAdmin){headerAdmin.remove();} if(!admin)$('adminModal')?.classList.add('hidden'); updateMenu() }
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
  function isApproved(){ const p=window.HODSupabase?.getProfile?.()||null; return !p || p.approved !== false; }
  function bind(){ ensureChip(); ensureChangeBtn(); syncSubjectTexts(); $('subjectRefresh')?.addEventListener('click', refreshSubjects); $('subjectSearch')?.addEventListener('input', renderSubjects); $('subjectEnter')?.addEventListener('click', enterSubject); $('subjectLogout')?.addEventListener('click', logoutGate); if(logged() && isApproved() && subjectCode()) loadBySubject(subjectCode()); setInterval(async()=>{ if(lock) return; lock=true; try{ ensureChip(); ensureChangeBtn(); patchSubmit(); patchSave(); patchSignOut(); syncSubjectTexts(); if(logged() && isApproved()){ if(!subjectCode()) openGate(); } else if(!logged()) { closeGate(); setSubject(''); } } finally { lock=false; } }, 700); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====


// ===== ADD_SUBJECT_FEATURE_20260625 =====
(function(){
  const HUB_URL='https://bdbkpqnhavyoalgkvqtw.supabase.co';
  const HUB_KEY='sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB';
  const $=id=>document.getElementById(id);
  let supa=null;
  function client(){ if(!window.supabase) return null; if(!supa) supa=window.supabase.createClient(HUB_URL,HUB_KEY); return supa; }
  function esc2(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function isLoggedIn(){
    return !!window.HODSupabase?.getUser?.();
  }
  function isAdminOrEditor(){
    const p=window.HODSupabase?.getProfile?.()||null;
    const role=String(p?.role||'').toLowerCase();
    return isLoggedIn() && (role==='admin'||role==='editor') && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }
  function isAdmin(){
    const p=window.HODSupabase?.getProfile?.()||null;
    return isLoggedIn() && String(p?.role||'').toLowerCase()==='admin' && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }
  function canAdd(){
    const p=window.HODSupabase?.getProfile?.()||null;
    return isLoggedIn() && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }

  function showAddBtn(){
    const btn=$('addSubjectBtn');
    if(!btn) return;
    btn.classList.toggle('hidden', !canAdd());
  }

  const AI_PROMPT = `Bạn là trợ lý tạo ngân hàng câu hỏi trắc nghiệm. Hãy đọc tài liệu tôi gửi và tạo câu hỏi trắc nghiệm.

YÊU CẦU:
- Mỗi câu hỏi có 4 đáp án A, B, C, D (có thể thêm E nếu cần)
- Đáp án đúng ghi chữ cái (VD: "A" hoặc "AC" nếu nhiều đáp án)
- Câu hỏi phải rõ ràng, chính xác theo nội dung tài liệu
- Giải thích ngắn gọn tại sao đáp án đó đúng
- Nếu câu hỏi CÓ HÌNH ẢNH đi kèm (biểu đồ, sơ đồ, hình minh họa...), hãy thêm trường "images" chứa mô tả hình ảnh cần thiết
- Trả về kết quả dưới dạng file .md hoặc .txt chứa JSON bên trong block code
- Trả về ĐÚNG format JSON bên trong block \`\`\`json ... \`\`\`, không thêm text nào khác bên ngoài block

FORMAT (trả về trong file .md hoặc .txt):
\`\`\`json
[
  {
    "num": 1,
    "question": "Nội dung câu hỏi?",
    "options": {
      "A": "Lựa chọn A",
      "B": "Lựa chọn B",
      "C": "Lựa chọn C",
      "D": "Lựa chọn D"
    },
    "answer": "A",
    "answer_text": "Giải thích ngắn gọn",
    "images": []
  },
  {
    "num": 2,
    "question": "Câu hỏi có hình ảnh minh họa (xem hình bên dưới)?",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "answer": "B",
    "answer_text": "Giải thích",
    "images": [{"src": "URL_HÌNH_ẢNH_HOẶC_MÔ_TẢ", "alt": "Mô tả hình ảnh"}]
  }
]
\`\`\`

LƯU Ý VỀ HÌNH ẢNH:
- Nếu tài liệu có hình ảnh liên quan đến câu hỏi, hãy thêm vào trường "images"
- Trường "src" có thể là URL trực tiếp của hình hoặc mô tả để người dùng tự thêm sau
- Trường "alt" là mô tả ngắn về nội dung hình ảnh
- Nếu câu không có hình, để "images": []

Hãy tạo càng nhiều câu hỏi càng tốt từ tài liệu, bao phủ tất cả các chủ đề quan trọng.`;

  let parsedQuestions = [];

  function getAddSubjectHTML(){
    return `<div class="userAddSubjectWrap">
      <div class="addSubjectFields">
        <div class="addSubjectField">
          <label for="addSubjectCode">Mã môn <span class="req">*</span></label>
          <input id="addSubjectCode" type="text" placeholder="VD: ABC123" maxlength="20">
        </div>
        <div class="addSubjectField">
          <label for="addSubjectName">Tên môn <span class="req">*</span></label>
          <input id="addSubjectName" type="text" placeholder="VD: ABC123 Learning" maxlength="100">
        </div>
        <div class="addSubjectField full">
          <label for="addSubjectDesc">Mô tả</label>
          <textarea id="addSubjectDesc" placeholder="Mô tả ngắn về môn học..." rows="2" maxlength="300"></textarea>
        </div>
      </div>

      <div class="aiImportTabs userAiTabs">
        <button class="aiTab active" onclick="window.__switchUserImportTab('prompt')">1. Lấy Prompt</button>
        <button class="aiTab" onclick="window.__switchUserImportTab('import')">2. Import câu hỏi</button>
      </div>

      <div id="userAiTabPrompt" class="aiTabContent active">
        <div class="aiStepCard">
          <div class="aiStepNum">1</div>
          <div class="aiStepBody">
            <h4>Copy prompt bên dưới</h4>
            <p>Bấm nút copy để sao chép prompt tạo câu hỏi.</p>
          </div>
        </div>
        <div class="aiPromptBox">
          <pre id="userAiPromptText">${esc2(AI_PROMPT)}</pre>
          <button class="primary aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()">📋 Copy Prompt</button>
        </div>

        <div class="aiStepCard">
          <div class="aiStepNum">2</div>
          <div class="aiStepBody">
            <h4>Mở AI và gửi tài liệu</h4>
            <p>Dán prompt vào AI, upload tài liệu môn học. AI sẽ trả về file .md hoặc .txt chứa JSON câu hỏi.</p>
          </div>
        </div>
        <div class="aiToolLinks">
          <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">
            <span class="aiToolIcon">✦</span> Google Gemini
          </a>
          <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">
            <span class="aiToolIcon">◉</span> ChatGPT
          </a>
          <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">
            <span class="aiToolIcon">◈</span> Claude
          </a>
        </div>

        <div class="aiStepCard">
          <div class="aiStepNum">3</div>
          <div class="aiStepBody">
            <h4>Tải file .md / .txt hoặc copy JSON</h4>
            <p>Tải file AI trả về rồi import, hoặc copy JSON và dán vào tab <b>"Import câu hỏi"</b>.</p>
          </div>
        </div>
        <div class="addSubjectActions">
          <button class="primary" type="button" onclick="window.__switchUserImportTab('import')">Tiếp → Import câu hỏi</button>
        </div>
      </div>

      <div id="userAiTabImport" class="aiTabContent">
        <div class="userImportForm">
          <div class="addSubjectField full">
            <label>Import từ file .md / .txt</label>
            <input type="file" id="userImportFile" accept=".md,.txt,.json" class="userFileInput">
            <p class="userFileHint">Chọn file .md hoặc .txt mà AI đã trả về. Hệ thống sẽ tự trích xuất JSON từ file.</p>
          </div>
          <div class="addSubjectField full">
            <label>Hoặc dán JSON trực tiếp</label>
            <textarea id="userImportData" rows="10" placeholder='Dán mảng JSON câu hỏi vào đây...&#10;&#10;[&#10;  {&#10;    "num": 1,&#10;    "question": "...",&#10;    "options": {"A":"...","B":"...","C":"...","D":"..."},&#10;    "answer": "A",&#10;    "answer_text": "...",&#10;    "images": []&#10;  }&#10;]'></textarea>
          </div>
          <div id="userImportPreview" class="aiImportPreview hidden"></div>
          <div class="addSubjectActions">
            <button class="btn" type="button" onclick="window.__previewUserImport()">Xem trước</button>
            <button class="primary" type="button" id="userImportBtn" onclick="window.__submitSubjectRequest()" disabled>Gửi yêu cầu thêm môn</button>
            <button class="btn" type="button" onclick="window.__closeAddSubject()">Hủy</button>
          </div>
        </div>
      </div>

      ${!isAdminOrEditor() ? '<div class="userApprovalNote">⏳ Yêu cầu của bạn sẽ được gửi đến admin để duyệt trước khi môn học được thêm vào hệ thống.</div>' : ''}
    </div>`;
  }

  function toggleForm(show){
    const form=$('addSubjectForm');
    if(!form) return;
    form.classList.toggle('hidden', !show);
    if(show){
      form.innerHTML = getAddSubjectHTML();
      parsedQuestions = [];
      $('addSubjectCode')?.addEventListener('input', function(){ this.value=this.value.toUpperCase().replace(/[^A-Z0-9_]/g,''); });
      $('userImportFile')?.addEventListener('change', handleFileImport);
    }
  }

  function handleFileImport(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      const text = reader.result;
      let jsonStr = text;
      const mdMatch = text.match(/```json\s*([\s\S]*?)```/);
      if(mdMatch) jsonStr = mdMatch[1];
      else {
        const jsonMatch = text.match(/```\s*([\s\S]*?)```/);
        if(jsonMatch) jsonStr = jsonMatch[1];
      }
      if($('userImportData')) $('userImportData').value = jsonStr.trim();
      notify('Đã đọc file ' + file.name);
      window.__previewUserImport();
    };
    reader.readAsText(file);
  }

  window.__switchUserImportTab = function(tab){
    document.querySelectorAll('.userAiTabs .aiTab').forEach(b => b.classList.toggle('active', b.textContent.includes(tab === 'prompt' ? 'Prompt' : 'Import')));
    $('userAiTabPrompt')?.classList.toggle('active', tab === 'prompt');
    $('userAiTabImport')?.classList.toggle('active', tab === 'import');
  };

  window.__copyUserAIPrompt = function(){
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      notify('Đã copy prompt!');
    }).catch(() => {
      const el = $('userAiPromptText');
      if(el){
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        notify('Hãy bấm Ctrl+C để copy');
      }
    });
  };

  window.__previewUserImport = function(){
    const raw = ($('userImportData')?.value || '').trim();
    const preview = $('userImportPreview');
    const btn = $('userImportBtn');
    if(!raw){ alert('Chưa dán dữ liệu JSON.'); return; }

    let data;
    try {
      let cleaned = raw;
      if(cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      else if(cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      data = JSON.parse(cleaned);
    } catch(e){
      alert('JSON không hợp lệ. Hãy kiểm tra lại format.\n\nLỗi: ' + e.message);
      return;
    }

    if(!Array.isArray(data)){
      if(data.questions && Array.isArray(data.questions)) data = data.questions;
      else { alert('Dữ liệu phải là mảng JSON [...]'); return; }
    }

    const errors = [];
    data.forEach((q, i) => {
      if(!q.question) errors.push('Câu '+(i+1)+': thiếu "question"');
      if(!q.options || typeof q.options !== 'object') errors.push('Câu '+(i+1)+': thiếu "options"');
      if(!q.answer) errors.push('Câu '+(i+1)+': thiếu "answer"');
    });
    if(errors.length){
      alert('Dữ liệu có lỗi:\n\n' + errors.slice(0, 10).join('\n'));
      return;
    }

    parsedQuestions = data;
    if(preview){
      const imgCount = data.filter(q => q.images && q.images.length > 0).length;
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div class="aiPreviewHeader">
          <b>Xem trước: ${data.length} câu hỏi${imgCount ? ' ('+imgCount+' câu có hình ảnh)' : ''}</b>
        </div>
        <div class="aiPreviewList">${data.slice(0, 8).map((q, i) => `
          <div class="aiPreviewItem">
            <span class="aiPreviewNum">Câu ${q.num || (i+1)}</span>
            <span class="aiPreviewQ">${esc2((q.question || '').substring(0, 100))}${(q.question||'').length>100?'...':''}</span>
            <span class="aiPreviewA">${q.images&&q.images.length?'🖼 ':''} Đáp án: ${esc2(q.answer || '?')}</span>
          </div>
        `).join('')}${data.length > 8 ? '<div class="aiPreviewMore">...và '+(data.length - 8)+' câu khác</div>' : ''}</div>
      `;
    }
    if(btn) btn.disabled = false;
    notify('OK! ' + data.length + ' câu hỏi sẵn sàng');
  };

  window.__submitSubjectRequest = async function(){
    const code=($('addSubjectCode')?.value||'').trim().toUpperCase();
    const name=($('addSubjectName')?.value||'').trim();
    const desc=($('addSubjectDesc')?.value||'').trim();

    if(!code){ notify('Vui lòng nhập mã môn'); $('addSubjectCode')?.focus(); return; }
    if(!/^[A-Z0-9_]{2,20}$/.test(code)){ notify('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)'); $('addSubjectCode')?.focus(); return; }
    if(!name){ notify('Vui lòng nhập tên môn'); $('addSubjectName')?.focus(); return; }

    const c=client();
    if(!c){ notify('Chưa kết nối Supabase'); return; }

    const btn=$('userImportBtn');
    if(btn){ btn.disabled=true; btn.textContent='Đang gửi...'; }

    try{
      const {data:existing}=await c.from('subjects').select('code').eq('code',code).maybeSingle();
      if(existing){
        notify('Mã môn '+code+' đã tồn tại');
        return;
      }

      if(isAdminOrEditor()){
        const maxOrder=await c.from('subjects').select('sort_order').order('sort_order',{ascending:false}).limit(1);
        const nextOrder=((maxOrder.data?.[0]?.sort_order)||0)+1;

        const {error}=await c.from('subjects').insert({
          code: code, name: name, description: desc || null,
          is_active: true, sort_order: nextOrder
        });
        if(error){ notify('Lỗi: '+error.message); return; }

        if(parsedQuestions.length){
          let success=0, errors=0;
          for(let i=0; i<parsedQuestions.length; i++){
            const q=parsedQuestions[i];
            const payload={
              subject_code: code,
              num: q.num || (i+1),
              question: q.question || '',
              options: q.options || {},
              answer: (q.answer || '').toUpperCase(),
              answer_text: q.answer_text || '',
              images: q.images || [],
              is_active: true,
              updated_at: new Date().toISOString()
            };
            const r=await c.from('questions').insert(payload);
            if(r.error) errors++; else success++;
          }
          notify('Đã thêm môn '+code+' với '+success+' câu hỏi'+(errors?' ('+errors+' lỗi)':''));
        } else {
          notify('Đã thêm môn '+code);
        }

        toggleForm(false);
        $('subjectRefresh')?.click();
      } else {
        const u=window.HODSupabase?.getUser?.();
        const p=window.HODSupabase?.getProfile?.()||null;
        const {error}=await c.from('subject_requests').insert({
          code: code,
          name: name,
          description: desc || null,
          questions_data: parsedQuestions || [],
          user_id: u?.id,
          user_email: u?.email || p?.email || '',
          status: 'pending'
        });
        if(error){
          notify('Lỗi: '+error.message);
          return;
        }
        notify('Đã gửi yêu cầu thêm môn '+code+'. Vui lòng chờ admin duyệt.');
        toggleForm(false);
      }

      parsedQuestions = [];
    } catch(e){
      console.warn('Add subject error:', e);
      notify('Lỗi khi gửi yêu cầu');
    } finally {
      if(btn){ btn.disabled=false; btn.textContent=isAdminOrEditor()?'Thêm môn học':'Gửi yêu cầu thêm môn'; }
    }
  };

  window.__closeAddSubject = function(){ toggleForm(false); };

  function bind(){
    $('addSubjectBtn')?.addEventListener('click', ()=>toggleForm(true));
    showAddBtn();
    setInterval(showAddBtn, 2000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== ADD_SUBJECT_FEATURE END =====


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


// ===== FINAL_FLOATING_PARTICLES_CANVAS_20260613 =====
if (typeof finalAnswerText !== 'function') { function finalAnswerText(c){const raw=String(c?.answer_text??'').trim();const ans=String(c?.answer??'').trim().toUpperCase();if(!raw||raw.toUpperCase()===ans||/^[A-E]+$/i.test(raw))return answerText(c);return raw;} }
(function(){
  let canvas,ctx,w=0,h=0,dpr=1,parts=[],raf=0;
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ensureCanvas(){const gate=document.getElementById('hodLoginGate');if(!gate||reduce)return null;canvas=document.getElementById('landingParticles');if(!canvas){canvas=document.createElement('canvas');canvas.id='landingParticles';gate.prepend(canvas);}ctx=canvas.getContext('2d');return gate;}
  function resize(){if(!canvas||!ctx)return;dpr=Math.min(window.devicePixelRatio||1,2);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);init();}
  function init(){const count=Math.min(140,Math.max(55,Math.floor(w*h/14000)));parts=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.7+Math.random()*2.4,vx:(Math.random()-.5)*.22,vy:-.10-Math.random()*.42,a:.18+Math.random()*.55,p:Math.random()*Math.PI*2,hue:Math.random()<.55?'255,255,255':(Math.random()<.5?'255,226,170':'135,225,255')}));}
  function draw(){if(!ctx||document.hidden){raf=requestAnimationFrame(draw);return;}ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';for(const p of parts){p.p+=.012;p.x+=p.vx+Math.sin(p.p)*.10;p.y+=p.vy;if(p.y<-20){p.y=h+20;p.x=Math.random()*w}if(p.x<-30)p.x=w+30;if(p.x>w+30)p.x=-30;const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*7);glow.addColorStop(0,`rgba(${p.hue},${p.a})`);glow.addColorStop(.45,`rgba(${p.hue},${p.a*.22})`);glow.addColorStop(1,`rgba(${p.hue},0)`);ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,p.r*7,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(${p.hue},${Math.min(1,p.a+.15)})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}raf=requestAnimationFrame(draw);}
  function ux(){const b=document.getElementById('subjectEnter');if(b)b.textContent='Bắt đầu';const i=document.getElementById('subjectSearch');if(i)i.placeholder='Tìm môn học...';const l=document.getElementById('subjectLoading'),r=document.getElementById('subjectRefresh');if(l&&r){const on=!l.classList.contains('hidden');r.classList.toggle('is-loading',on);r.setAttribute('aria-busy',on?'true':'false')}}
  function parallax(){const g=document.getElementById('hodLoginGate');if(!g||g.__particles3d)return;g.__particles3d=true;g.addEventListener('pointermove',e=>{const r=g.getBoundingClientRect();const x=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));const y=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100));g.style.setProperty('--mx',x.toFixed(1)+'%');g.style.setProperty('--my',y.toFixed(1)+'%')},{passive:true});}
  function boot(){ux();parallax();if(ensureCanvas()){resize();cancelAnimationFrame(raf);draw();}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();window.addEventListener('resize',resize,{passive:true});setInterval(ux,150);
})();
(function(){const $=id=>document.getElementById(id);function prof(){return window.HODSupabase?.getProfile?.()||null}function can(){const p=prof();return !!p&&['admin','editor'].includes(p.role)&&!(p.blocked||p.is_blocked||p.status==='blocked')}function cli(){return window.HODSupabase?.__client||null}function sc(){return localStorage.getItem('learninghub_subject_code_merged_v1')||''}function build(){editDraft.question=($('editQuestion')?.value||'').trim();editDraft.answer=($('editAnswer')?.value||'').trim().toUpperCase();const ops={};document.querySelectorAll('[data-opt]').forEach(t=>{if((t.value||'').trim())ops[t.dataset.opt]=t.value.trim()});editDraft.options=ops;editDraft.answer_text=typeof answerText==='function'?answerText(editDraft):'';editDraft.subject_code=sc()||editDraft.subject_code||'';editDraft.images=editDraft.images||[];return editDraft}async function qid(oldQ,draft){if(oldQ?.id)return oldQ.id;const c=cli();if(!c)return null;const code=oldQ?.subject_code||draft?.subject_code||sc(),num=oldQ?.num||draft?.num;if(!code||!num)return null;const{data,error}=await c.from('questions').select('id').eq('subject_code',code).eq('num',num).maybeSingle();return(error||!data)?null:data.id}async function direct(){const c=cli();if(!c||!window.HODSupabase?.isReady?.()){alert('Bạn cần đăng nhập trước.');return false}if(!can())return false;const oldQ=clone(RAW.find(x=>x.num===editDraft.num)||pool[ci]||editDraft),d=build(),id=await qid(oldQ,d);if(!id){alert('Không tìm thấy ID câu hỏi trên Supabase. Hãy tải lại trang rồi thử lại.');return true}const payload={question:d.question,options:d.options||{},answer:d.answer,answer_text:d.answer_text,images:d.images||[],updated_at:new Date().toISOString()};const{error}=await c.from('questions').update(payload).eq('id',id);if(error){alert('Sửa trực tiếp thất bại: '+error.message);return true}try{const u=window.HODSupabase?.getUser?.();await c.from('question_history').insert({question_id:id,request_id:null,previous_data:{question:oldQ.question,options:oldQ.options||{},answer:oldQ.answer,answer_text:oldQ.answer_text,images:oldQ.images||[]},new_data:payload,changed_by:u?.id||null,approved_by:u?.id||null})}catch(e){}$('editModal')?.classList.add('hidden');if(typeof notify==='function')notify('Đã sửa trực tiếp');if(typeof window.loadCurrentSubjectOnly==='function')await window.loadCurrentSubjectOnly();else if(window.HODSupabase?.loadQuestionsFromSupabase)await window.HODSupabase.loadQuestionsFromSupabase();return true}const oldSave=typeof saveEditor==='function'?saveEditor:null;saveEditor=async function(){if(can()){const h=await direct();if(h)return}return oldSave?oldSave.apply(this,arguments):undefined};window.saveEditor=saveEditor;const oldOpen=typeof openEditor==='function'?openEditor:null;openEditor=function(){if(oldOpen)oldOpen.apply(this,arguments);setTimeout(()=>{if(can()){if($('editTitle'))$('editTitle').textContent='Sửa trực tiếp câu '+((pool&&pool[ci]?.num)||'');if($('saveEdit'))$('saveEdit').textContent='Lưu trực tiếp';if($('restoreEdit'))$('restoreEdit').classList.remove('hidden')}},0)};window.openEditor=openEditor})();


// ===== FINAL_REPORT_BUTTON_OPEN_TAB_20260613 =====
// Thay khu vực "Báo cáo đã gửi" trong menu tài khoản thành nút bấm mở tab/modal xem báo cáo.
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const supa = () => window.HODSupabase?.__client || null;
  const user = () => window.HODSupabase?.getUser?.() || null;

  function ensureReportModal(){
    if ($('hodReportModal')) return;
    const modal = document.createElement('div');
    modal.id = 'hodReportModal';
    modal.className = 'modal hidden hodReportModal';
    modal.innerHTML = `
      <div class="box hodReportModalBox">
        <button class="modalX" id="hodReportModalClose" type="button" title="Đóng">×</button>
        <div class="hodReportModalHead">
          <div>
            <div class="hodReportModalLabel">BÁO CÁO ĐÃ GỬI</div>
            <h2>Danh sách báo cáo</h2>
            <p>Xem trạng thái các báo cáo/chỉnh sửa bạn đã gửi cho admin.</p>
          </div>
          <button id="hodReportModalReload" class="btn" type="button">Tải lại</button>
        </div>
        <div id="hodReportModalList" class="hodReportModalList">Chưa tải.</div>
      </div>`;
    document.body.appendChild(modal);
    $('hodReportModalClose')?.addEventListener('click', () => modal.classList.add('hidden'));
    $('hodReportModalReload')?.addEventListener('click', loadReportModalList);
    modal.addEventListener('mousedown', e => { if(e.target === modal) modal.classList.add('hidden'); });
  }

  function ensureReportButton(){
    const menu = $('hodAccountMenu');
    if(!menu) return;
    let box = $('hodReportBox');
    if(!box){
      box = document.createElement('div');
      box.id = 'hodReportBox';
      box.className = 'hodReportBox';
      const logout = $('hodLogoutBtn');
      logout ? menu.insertBefore(box, logout) : menu.appendChild(box);
    }
    box.innerHTML = `
      <button id="hodOpenReportsBtn" class="hodOpenReportsBtn" type="button">
        <span>Báo cáo đã gửi</span>
        <b>Xem</b>
      </button>`;
    $('hodOpenReportsBtn')?.addEventListener('click', openReportsTab);
  }

  function statusText(s){
    return ({pending:'Đang chờ', approved:'Đã duyệt', rejected:'Từ chối'}[s] || s || 'Không rõ');
  }
  function statusClass(s){
    return s === 'approved' ? 'approved' : (s === 'rejected' ? 'rejected' : 'pending');
  }

  async function loadReportModalList(){
    ensureReportModal();
    const list = $('hodReportModalList');
    const c = supa();
    const u = user();
    if(!list) return;
    if(!c || !u){
      list.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem báo cáo.</div>';
      return;
    }
    list.innerHTML = '<div class="hodReportEmpty">Đang tải...</div>';
    const {data, error} = await c.from('edit_requests')
      .select('id,question_num,status,admin_note,created_at')
      .eq('user_id', u.id)
      .order('created_at', {ascending:false})
      .limit(50);
    if(error){
      list.innerHTML = '<div class="hodReportEmpty">Không tải được báo cáo.</div>';
      return;
    }
    if(!data || !data.length){
      list.innerHTML = '<div class="hodReportEmpty">Bạn chưa gửi báo cáo nào.</div>';
      return;
    }
    list.innerHTML = data.map(r => `
      <div class="hodReportRow">
        <div class="hodReportRowTop">
          <b>Câu ${esc(r.question_num || '?')}</b>
          <span class="hodReportStatus ${statusClass(r.status)}">${esc(statusText(r.status))}</span>
        </div>
        <div class="hodReportTime">Gửi: ${esc(new Date(r.created_at).toLocaleString('vi-VN'))}</div>
        ${r.admin_note ? `<div class="hodReportNote">Ghi chú admin: ${esc(r.admin_note)}</div>` : ''}
      </div>`).join('');
  }

  async function openReportsTab(){
    ensureReportModal();
    $('hodAccountMenu')?.classList.add('hidden');
    $('hodReportModal')?.classList.remove('hidden');
    await loadReportModalList();
  }

  function boot(){
    ensureReportModal();
    ensureReportButton();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(ensureReportButton, 700);
})();


// ===== FINAL_MOBILE_FLASHCARD_NAVIGATION_20260613 =====
// Mobile: thêm nút chuyển câu và vuốt trái/phải để đổi flashcard.
(function(){
  function $(id){ return document.getElementById(id); }
  function goPrev(){ if(typeof prev === 'function') prev(); }
  function goNext(){ if(typeof next === 'function') next(); }

  function ensureMobileNav(){
    const zone = $('zone');
    if(!zone || $('mobileCardNav')) return;
    const nav = document.createElement('div');
    nav.id = 'mobileCardNav';
    nav.className = 'mobileCardNav';
    nav.innerHTML = `
      <button id="mobilePrev" type="button" aria-label="Câu trước">‹</button>
      <div class="mobileSwipeHint">Vuốt trái / phải để đổi câu</div>
      <button id="mobileNext" type="button" aria-label="Câu sau">›</button>`;
    zone.appendChild(nav);
    $('mobilePrev')?.addEventListener('click', e => { e.stopPropagation(); goPrev(); });
    $('mobileNext')?.addEventListener('click', e => { e.stopPropagation(); goNext(); });
  }

  function bindSwipe(){
    const zone = $('zone');
    if(!zone || zone.__mobileSwipeBound) return;
    zone.__mobileSwipeBound = true;
    let sx = 0, sy = 0, st = 0;
    zone.addEventListener('touchstart', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if(!t) return;
      sx = t.clientX; sy = t.clientY; st = Date.now();
    }, {passive:true});
    zone.addEventListener('touchend', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if(!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const fastEnough = Date.now() - st < 900;
      if(!fastEnough) return;
      if(Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.25){
        e.preventDefault?.();
        if(dx < 0) goNext(); else goPrev();
      }
    }, {passive:false});
  }

  function boot(){ ensureMobileNav(); bindSwipe(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();


// ===== FINAL_USER_LAST_ACTIVITY_TRACKING_20260613 =====
// Cập nhật hoạt động gần nhất của người dùng trên web.
(function(){
  const MIN_GAP = 45000;
  let lastSent = 0;
  let sending = false;

  function client(){ return window.HODSupabase?.__client || null; }
  function user(){ return window.HODSupabase?.getUser?.() || null; }

  async function touchActivity(force=false){
    const c = client();
    const u = user();
    if(!c || !u || sending) return;
    const nowMs = Date.now();
    if(!force && nowMs - lastSent < MIN_GAP) return;
    sending = true;
    lastSent = nowMs;
    try{
      await c.from('profiles').update({
        email: u.email || '',
        last_activity: new Date().toISOString()
      }).eq('id', u.id);
    }catch(e){
      console.warn('[last_activity]', e);
    }finally{
      sending = false;
    }
  }

  function bindActivityEvents(){
    ['click','touchstart','keydown','mousemove','scroll'].forEach(ev => {
      window.addEventListener(ev, () => touchActivity(false), {passive:true});
    });
    document.addEventListener('visibilitychange', () => {
      if(!document.hidden) touchActivity(true);
    });
    window.addEventListener('focus', () => touchActivity(true));
    setInterval(() => {
      if(!document.hidden) touchActivity(false);
    }, 60000);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindActivityEvents);
  else bindActivityEvents();
  setTimeout(() => touchActivity(true), 2500);
  setTimeout(() => touchActivity(true), 7000);
})();

// ===== FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613 =====
// Bỏ chữ "Đổi môn" bên trái, tiêu đề tự đổi theo môn đang chọn.
(function(){
  const STORE='learninghub_subject_code_merged_v1';
  function $(id){return document.getElementById(id)}
  function currentCode(){return localStorage.getItem(STORE)||''}
  function titleFromCode(code){
    code=String(code||'').trim();
    if(!code) return 'Learning Hub';
    return code + ' Learning';
  }
  function fixCounter(){
    const counter=document.querySelector('.globalTop .counter')||document.querySelector('#fc .top .counter')||document.querySelector('.counter');
    if(!counter) return;
    if(counter.querySelector('#subjectInlineText') || /Đổi môn|Chưa chọn môn|·/.test(counter.textContent||'')){
      const idx=$('idx')?.textContent||'0';
      const total=$('total')?.textContent||'0';
      counter.innerHTML='Câu <b id="idx">'+idx+'</b> / <b id="total">'+total+'</b>';
    }
  }
  function fixBrand(){
    const brand=document.querySelector('.globalTop .brand')||document.querySelector('#fc .top .brand')||document.querySelector('.brand');
    if(!brand) return;
    const title=titleFromCode(currentCode());
    if((brand.textContent||'').trim()!==title) brand.textContent=title;
  }
  function run(){fixCounter();fixBrand();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setTimeout(run,50);
  setTimeout(run,300);
  setInterval(run,300);
})();

// ===== FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613 =====
// Đưa nút Đổi môn nằm ngay bên trái nút Cài đặt.
(function(){
  function $(id){return document.getElementById(id)}
  function moveSubjectButton(){
    const actions=document.querySelector('.globalTop .actions')||document.querySelector('#fc .actions')||document.querySelector('.actions');
    if(!actions) return;
    let btn=$('subjectTopChip');
    if(!btn){
      btn=document.createElement('button');
      btn.id='subjectTopChip';
      btn.type='button';
      btn.className='subjectChip';
      btn.onclick=function(){ $('hodChangeSubjectBtn')?.click(); };
    }
    btn.textContent='Đổi môn';
    btn.classList.remove('hidden');
    btn.style.display='inline-flex';
    const settings=$('openSettings');
    if(settings && settings.parentNode===actions){
      if(settings.previousElementSibling!==btn) actions.insertBefore(btn,settings);
    }else if(!actions.contains(btn)){
      actions.prepend(btn);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',moveSubjectButton); else moveSubjectButton();
  setTimeout(moveSubjectButton,200);
  setTimeout(moveSubjectButton,800);
  setInterval(moveSubjectButton,700);
})();

// ===== FINAL_APP_ADMIN_LIKE_SMART_SEARCH_20260614 =====
// Search bám kiểu Admin: bỏ dấu tiếng Việt, hỗ trợ #12, answer:B, multi, nhiều từ khóa, fuzzy nhẹ, highlight.
(function(){
  function normText(s){
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d')
      .replace(/[^a-z0-9#:\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function rawTokens(q){
    return normText(q).split(/\s+/).map(x=>x.trim()).filter(Boolean);
  }
  function parseQuery(q){
    const raw = String(q ?? '').trim();
    const n = normText(raw);
    const out = { raw, norm:n, num:null, answer:null, multi:false, tokens:[] };
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if(m) out.num = Number(m[1]);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if(m) out.answer = m[1].toUpperCase().split('').sort().join('');
    out.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu cau|nhieu lua chon)(\s|$)/.test(n);
    out.tokens = rawTokens(raw).filter(t => {
      if(/^#?\d+$/.test(t) && out.num !== null) return false;
      if(/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua|chonnhieu)$/.test(t)) return false;
      if(/^[a-e]+$/.test(t) && out.answer) return false;
      if(t.includes(':')) return false;
      return t.length >= 2;
    });
    return out;
  }
  function hay(c){
    return normText([c?.num,c?.question,c?.answer,c?.answer_text,Object.values(c?.options || {}).join(' ')].join(' '));
  }
  function fuzzyHas(h, token){
    if(!token) return true;
    if(h.includes(token)) return true;
    let i = 0;
    for(const ch of h){
      if(ch === token[i]) i++;
      if(i >= token.length) return true;
    }
    return token.length <= 4 && i >= token.length - 1;
  }
  function scoreOne(c, p){
    if(p.num !== null && Number(c.num) !== p.num) return -1;
    const ans = sortAns(String(c.answer || '').toUpperCase());
    if(p.answer && ans !== p.answer) return -1;
    if(p.multi && String(c.answer || '').length <= 1) return -1;
    const h = hay(c);
    let score = 0;
    if(p.num !== null) score += 1000;
    if(p.answer) score += 700;
    if(p.multi) score += 250;
    if(p.norm && h.includes(p.norm)) score += 180;
    for(const t of p.tokens){
      if(h.includes(t)) score += 70;
      else if(fuzzyHas(h,t)) score += 18;
      else return -1;
    }
    if(normText(c.question).includes(p.norm)) score += 60;
    return score;
  }
  function smartAdminLike(q){
    const p = parseQuery(q);
    if(!p.raw) return RAW;
    return RAW.map(c => ({ c, s: scoreOne(c,p) }))
      .filter(x => x.s >= 0)
      .sort((a,b) => b.s - a.s || Number(a.c.num) - Number(b.c.num))
      .map(x => x.c);
  }
  function markText(text, query, cls='tokenMark'){
    const parser = (typeof parseQuery === 'function') ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s){ return esc(s); }

    function normWithMap(s){
      let norm = '', map = [], lastSpace = true;
      for(let i=0;i<s.length;i++){
        const ch = s[i];
        const n = normText(ch);
        if(n){
          for(const c of n){ norm += c; map.push(i); }
          lastSpace = false;
        }else if(!lastSpace){
          norm += ' '; map.push(i); lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while(norm.startsWith(' ')){ norm = norm.slice(1); map.shift(); }
      return {norm, map};
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if(cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi){
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if(hit >= 0){
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? (source.length - 1)) + 1;
        return escLocal(source.slice(0,start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start,end))}</mark>` +
          escLocal(source.slice(end));
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0,10);
    if(!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts.map(part => {
      const np = normText(part);
      if(np && tokens.some(t => np === t || np.includes(t) || t.includes(np))){
        return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
      }
      return escLocal(part);
    }).join('');
  }
  function optionHTMLStudy(c, q){
    return Object.entries(c.options || {}).map(([k,v]) => {
      const right = String(c.answer || '').includes(k);
      return `<div class="sopt ${right?'ans correct':''}"><div class="skey">${right?'✓':esc(k)}</div><div>${esc(k+'. ')}${markText(v,q)}</div></div>`;
    }).join('');
  }
  function renderStudyAdminLike(){
    const input = $('search');
    const q = input ? (input.value || '') : '';
    if(input) input.placeholder = 'Tìm: #12, answer:B, multi, triết học...';
    const arr = smartAdminLike(q);
    const max = arr.length;
    const p = parseQuery(q);
    const html = arr.slice(0,max).map(c => {
      const ansHit = p.answer && sortAns(String(c.answer || '').toUpperCase()) === p.answer;
      return `<div class="sitem compactStudyCard" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question,q,'phraseMark')}</div>
          <div class="compactCardRight">${ansHit?'<span class="answerMatchChip">Đúng đáp án</span>':''}<span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails">
          <div class="qimgs">${imgsHTML(c)}</div>
          <div class="sopts">${optionHTMLStudy(c,q)}</div>
        </div>
      </div>`;
    }).join('');
    const more = arr.length > max ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>` : (arr.length ? '' : '<div class="more">Không tìm thấy kết quả.</div>');
    $('studyList').innerHTML = html + more;
  }
  function bindCompactList(){
    const s = $('search');
    if(s){
      s.placeholder = 'Tìm: #12, answer:B, multi, triết học...';
      s.oninput = renderStudyAdminLike;
    }
    const list = $('studyList');
    if(list){
      // Ghi đè onclick cũ để không bị toggle 2 lần
      list.onclick = function(e){
        const it = e.target.closest('.sitem');
        if(!it) return;
        it.classList.toggle('open');
      };
      list.onkeydown = function(e){
        if(e.key !== 'Enter' && e.key !== ' ') return;
        const it = e.target.closest('.sitem');
        if(!it) return;
        e.preventDefault();
        it.classList.toggle('open');
      };
    }
  }

  smart = smartAdminLike;
  renderStudy = renderStudyAdminLike;
  document.addEventListener('DOMContentLoaded', function(){
    bindCompactList();
    setTimeout(bindCompactList, 100);
    setTimeout(bindCompactList, 500);
    try{ renderStudyAdminLike(); }catch(e){}
  });
})();

// ===== FINAL_APP_SEARCH_NUM_AUTOOPEN_NO_DOUBLE_OPEN_20260614 =====
// Fix search: nhập 3 => chỉ câu 3 hoặc câu có đáp án chứa 3. Nếu keyword nằm trong đáp án đúng thì tự xổ thẻ.
(function(){
  function normText(s){
    return String(s ?? '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')
      .replace(/[^a-z0-9#:\s]/g,' ').replace(/\s+/g,' ').trim();
  }
  function answerOnlyText(c){
    const ans = String(c?.answer || '').toUpperCase();
    const opts = c?.options || {};
    const correct = ans.split('').map(k => opts[k] || '').join(' ');
    return [ans, c?.answer_text || '', correct].join(' ');
  }
  function allText(c){
    return [c?.num, c?.question, c?.answer, c?.answer_text, Object.values(c?.options || {}).join(' ')].join(' ');
  }
  function parseQ(q){
    const raw = String(q ?? '').trim();
    const n = normText(raw);
    const p = {raw,n,num:null,answer:null,multi:false,tokens:[],numericOnly:false};
    p.numericOnly = /^\d+$/.test(n);
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if(m) p.num = Number(m[1]);
    if(p.numericOnly) p.num = Number(n);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if(m) p.answer = m[1].toUpperCase().split('').sort().join('');
    p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    p.tokens = n.split(/\s+/).filter(t => t && t.length >= 1).filter(t => {
      if(p.numericOnly && t === String(p.num)) return true;
      if(/^#?\d+$/.test(t) && p.num !== null) return false;
      if(/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua)$/.test(t)) return false;
      if(t.includes(':')) return false;
      return t.length >= 2;
    });
    return p;
  }
  function hasWholeNumber(text, num){
    return new RegExp('(^|\\D)' + String(num).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?=\\D|$)').test(String(text ?? ''));
  }
  function fuzzyHas(h,t){
    if(!t) return true;
    if(h.includes(t)) return true;
    if(t.length <= 1) return false;
    let i=0;
    for(const ch of h){ if(ch === t[i]) i++; if(i >= t.length) return true; }
    return t.length <= 4 && i >= t.length - 1;
  }
  function matchQuestion(c,p){
    if(!p.raw) return {ok:true, auto:false, score:0};
    const ans = sortAns(String(c.answer || '').toUpperCase());
    if(p.answer && ans !== p.answer) return {ok:false, auto:false, score:-1};
    if(p.multi && String(c.answer || '').length <= 1) return {ok:false, auto:false, score:-1};
    const answerNorm = normText(answerOnlyText(c));
    const allNorm = normText(allText(c));
    let auto = false;
    let score = 0;
    if(p.num !== null){
      const exactNum = Number(c.num) === p.num;
      const answerHasNum = hasWholeNumber(answerOnlyText(c), p.num);
      if(p.numericOnly){
        if(!exactNum && !answerHasNum) return {ok:false, auto:false, score:-1};
        auto = answerHasNum;
        score += exactNum ? 1000 : 650;
      }else if(!exactNum){
        return {ok:false, auto:false, score:-1};
      }else score += 1000;
    }
    if(p.answer){ auto = true; score += 700; }
    if(p.multi){ score += 250; }
    if(p.tokens.length){
      for(const t of p.tokens){
        const inAnswer = fuzzyHas(answerNorm,t);
        const inAll = fuzzyHas(allNorm,t);
        if(!inAll && !inAnswer) return {ok:false, auto:false, score:-1};
        if(inAnswer) { auto = true; score += 90; }
        else score += 45;
      }
    }else if(!p.num && !p.answer && !p.multi){
      return {ok:false, auto:false, score:-1};
    }
    return {ok:true, auto, score};
  }
  function smartFixed(q){
    const p=parseQ(q);
    if(!p.raw) return RAW;
    return RAW.map(c => ({c, m:matchQuestion(c,p)}))
      .filter(x => x.m.ok)
      .sort((a,b)=>b.m.score-a.m.score || Number(a.c.num)-Number(b.c.num))
      .map(x => Object.assign({}, x.c, {__autoOpenAnswer: x.m.auto}));
  }
  function markText(text, query, cls='tokenMark'){
    const parser = (typeof parseQuery === 'function') ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s){ return esc(s); }

    function normWithMap(s){
      let norm = '', map = [], lastSpace = true;
      for(let i=0;i<s.length;i++){
        const ch = s[i];
        const n = normText(ch);
        if(n){
          for(const c of n){ norm += c; map.push(i); }
          lastSpace = false;
        }else if(!lastSpace){
          norm += ' '; map.push(i); lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while(norm.startsWith(' ')){ norm = norm.slice(1); map.shift(); }
      return {norm, map};
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if(cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi){
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if(hit >= 0){
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? (source.length - 1)) + 1;
        return escLocal(source.slice(0,start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start,end))}</mark>` +
          escLocal(source.slice(end));
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0,10);
    if(!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts.map(part => {
      const np = normText(part);
      if(np && tokens.some(t => np === t || np.includes(t) || t.includes(np))){
        return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
      }
      return escLocal(part);
    }).join('');
  }
  function optionStudy(c,q){
    return Object.entries(c.options || {}).map(([k,v])=>{
      const right=String(c.answer||'').includes(k);
      return `<div class="sopt ${right?'ans correct':''}"><div class="skey">${right?'✓':esc(k)}</div><div>${esc(k+'. ')}${markText(v,q)}</div></div>`;
    }).join('');
  }
  function renderStudyFixed(){
    const input=$('search');
    const q=input ? (input.value || '') : '';
    if(input) input.placeholder='Tìm: 3, #3, answer:B, multi, từ khóa...';
    const arr=smartFixed(q), max=arr.length;
    $('studyList').innerHTML = arr.slice(0,max).map(c=>{
      const auto=!!c.__autoOpenAnswer;
      return `<div class="sitem compactStudyCard ${auto?'autoOpenAnswer open':''}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question,q,'phraseMark')}</div>
          <div class="compactCardRight">${auto?'<span class="answerMatchChip">Khớp đáp án</span>':''}<span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails">
          <div class="qimgs">${imgsHTML(c)}</div>
          <div class="sopts">${optionStudy(c,q)}</div>
        </div>
      </div>`;
    }).join('') + (arr.length>max?`<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`:arr.length?'':'<div class="more">Không tìm thấy kết quả.</div>');
  }
  function bindStudyFixed(){
    const s=$('search');
    if(s){s.oninput=renderStudyFixed; s.placeholder='Tìm: 3, #3, answer:B, multi, từ khóa...';}
    const list=$('studyList');
    if(list && !list.__finalSearchFixedCapture){
      list.__finalSearchFixedCapture=true;
      list.addEventListener('click',function(e){
        const it=e.target.closest('.sitem');
        if(!it) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        it.classList.toggle('open');
        it.classList.remove('autoOpenAnswer');
      },true);
      list.addEventListener('keydown',function(e){
        if(e.key!=='Enter' && e.key!==' ') return;
        const it=e.target.closest('.sitem');
        if(!it) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        it.classList.toggle('open');
        it.classList.remove('autoOpenAnswer');
      },true);
    }
  }
  smart=smartFixed;
  renderStudy=renderStudyFixed;
  document.addEventListener('DOMContentLoaded',function(){
    bindStudyFixed();
    setTimeout(bindStudyFixed,100);
    setTimeout(bindStudyFixed,500);
    try{renderStudyFixed();}catch(e){}
  });
})();

// ===== FINAL_APP_STUDY_REPORT_BUTTON_20260614 =====
// Thêm nút báo cáo cạnh nút Mở ở tab Tất cả + mở đúng câu cần báo cáo.
(function(){
  function normText(s){
    return String(s ?? '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d')
      .replace(/[^a-z0-9#:\s]/g,' ').replace(/\s+/g,' ').trim();
  }
  function answerOnlyText(c){
    const ans = String(c?.answer || '').toUpperCase();
    const opts = c?.options || {};
    const correct = ans.split('').map(k => opts[k] || '').join(' ');
    return [ans, c?.answer_text || '', correct].join(' ');
  }
  function allText(c){ return [c?.num,c?.question,c?.answer,c?.answer_text,Object.values(c?.options||{}).join(' ')].join(' '); }
  function parseQ(q){
    const raw=String(q??'').trim(), n=normText(raw);
    const p={raw,n,num:null,answer:null,multi:false,tokens:[],numericOnly:/^\d+$/.test(n)};
    let m=n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/)||n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if(m)p.num=Number(m[1]); if(p.numericOnly)p.num=Number(n);
    m=n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if(m)p.answer=m[1].toUpperCase().split('').sort().join('');
    p.multi=/(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    p.tokens=n.split(/\s+/).filter(t=>t&&t.length>=1).filter(t=>{
      if(p.numericOnly&&t===String(p.num))return true;
      if(/^#?\d+$/.test(t)&&p.num!==null)return false;
      if(/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua)$/.test(t))return false;
      if(t.includes(':'))return false;
      return t.length>=2;
    });
    return p;
  }
  function hasWholeNumber(text,num){return new RegExp('(^|\\D)'+String(num).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\D|$)').test(String(text??''));}
  function fuzzyHas(h,t){if(!t)return true;if(h.includes(t))return true;if(t.length<=1)return false;let i=0;for(const ch of h){if(ch===t[i])i++;if(i>=t.length)return true;}return t.length<=4&&i>=t.length-1;}
  function matchQuestion(c,p){
    if(!p.raw)return{ok:true,auto:false,score:0};
    const ans=sortAns(String(c.answer||'').toUpperCase());
    if(p.answer&&ans!==p.answer)return{ok:false,auto:false,score:-1};
    if(p.multi&&String(c.answer||'').length<=1)return{ok:false,auto:false,score:-1};
    const answerNorm=normText(answerOnlyText(c)), allNorm=normText(allText(c));
    let auto=false, score=0;
    if(p.num!==null){
      const exact=Number(c.num)===p.num, answerHas=hasWholeNumber(answerOnlyText(c),p.num);
      if(p.numericOnly){if(!exact&&!answerHas)return{ok:false,auto:false,score:-1};auto=answerHas;score+=exact?1000:650;}
      else if(!exact)return{ok:false,auto:false,score:-1}; else score+=1000;
    }
    if(p.answer){auto=true;score+=700;} if(p.multi)score+=250;
    if(p.tokens.length){for(const t of p.tokens){const ia=fuzzyHas(answerNorm,t), ial=fuzzyHas(allNorm,t);if(!ial&&!ia)return{ok:false,auto:false,score:-1};if(ia){auto=true;score+=90;}else score+=45;}}
    else if(!p.num&&!p.answer&&!p.multi)return{ok:false,auto:false,score:-1};
    return{ok:true,auto,score};
  }
  function smartStudy(q){const p=parseQ(q);if(!p.raw)return RAW;return RAW.map(c=>({c,m:matchQuestion(c,p)})).filter(x=>x.m.ok).sort((a,b)=>b.m.score-a.m.score||Number(a.c.num)-Number(b.c.num)).map(x=>Object.assign({},x.c,{__autoOpenAnswer:x.m.auto}));}
  function markText(text, query, cls='tokenMark'){
    const parser = (typeof parseQuery === 'function') ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s){ return esc(s); }

    function normWithMap(s){
      let norm = '', map = [], lastSpace = true;
      for(let i=0;i<s.length;i++){
        const ch = s[i];
        const n = normText(ch);
        if(n){
          for(const c of n){ norm += c; map.push(i); }
          lastSpace = false;
        }else if(!lastSpace){
          norm += ' '; map.push(i); lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while(norm.startsWith(' ')){ norm = norm.slice(1); map.shift(); }
      return {norm, map};
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if(cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi){
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if(hit >= 0){
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? (source.length - 1)) + 1;
        return escLocal(source.slice(0,start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start,end))}</mark>` +
          escLocal(source.slice(end));
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0,10);
    if(!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts.map(part => {
      const np = normText(part);
      if(np && tokens.some(t => np === t || np.includes(t) || t.includes(np))){
        return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
      }
      return escLocal(part);
    }).join('');
  }
  function optionStudy(c,q){return Object.entries(c.options||{}).map(([k,v])=>{const right=String(c.answer||'').includes(k);return `<div class="sopt ${right?'ans correct':''}"><div class="skey">${right?'✓':esc(k)}</div><div>${esc(k+'. ')}${markText(v,q)}</div></div>`;}).join('');}
  function renderStudyWithReport(){
    const input=$('search');const q=input?(input.value||''):'';if(input)input.placeholder='Tìm: 3, #3, answer:B, multi, từ khóa...';
    const arr=smartStudy(q), max=arr.length;
    $('studyList').innerHTML=arr.slice(0,max).map(c=>{const auto=!!c.__autoOpenAnswer;return `<div class="sitem compactStudyCard ${auto?'autoOpenAnswer open':''}" data-num="${esc(c.num)}" tabindex="0">
      <div class="compactCardLine">
        <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
        <div class="sq compactQuestionText">${markText(c.question,q,'phraseMark')}</div>
        <div class="compactCardRight">${auto?'<span class="answerMatchChip">Khớp đáp án</span>':''}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="Báo cáo câu ${esc(c.num)}">!</button><span class="expandHint"></span></div>
      </div>
      <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c,q)}</div></div>
    </div>`;}).join('')+(arr.length>max?`<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`:arr.length?'':'<div class="more">Không tìm thấy kết quả.</div>');
  }
  window.openStudyReport=function(num){
    num=Number(num);const i=pool.findIndex(c=>Number(c.num)===num);const ri=RAW.findIndex(c=>Number(c.num)===num);
    if(i>=0)ci=i;else if(ri>=0){pool=[...RAW];ci=ri;}else return alert('Không tìm thấy câu '+num);
    flipped=false;try{renderCard();}catch(e){}
    try{openEditor();}catch(e){alert('Không mở được báo cáo câu '+num);}
  };
  function bindStudyReport(){
    const s=$('search');if(s){s.oninput=renderStudyWithReport;s.placeholder='Tìm: 3, #3, answer:B, multi, từ khóa...';}
    const list=$('studyList');if(!list||list.__studyReportBound)return;list.__studyReportBound=true;
    list.addEventListener('click',function(e){
      const rb=e.target.closest('[data-report-num]');
      if(rb){e.preventDefault();e.stopImmediatePropagation();window.openStudyReport(rb.dataset.reportNum);return;}
      const it=e.target.closest('.sitem');if(!it)return;e.preventDefault();e.stopImmediatePropagation();it.classList.toggle('open');it.classList.remove('autoOpenAnswer');
    },true);
    list.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;const it=e.target.closest('.sitem');if(!it)return;e.preventDefault();e.stopImmediatePropagation();it.classList.toggle('open');it.classList.remove('autoOpenAnswer');},true);
  }
  smart=smartStudy;renderStudy=renderStudyWithReport;
  document.addEventListener('DOMContentLoaded',function(){bindStudyReport();setTimeout(bindStudyReport,100);setTimeout(bindStudyReport,500);try{renderStudyWithReport();}catch(e){}});
})();

// ===== FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614 =====
// Nút báo cáo ở tab Tất cả: không toggle thẻ, mở form báo cáo đúng câu như nút ! ở Flashcard.
(function(){
  function getQuestionByNum(num){
    num = Number(num);
    return (RAW || []).find(c => Number(c.num) === num) || (pool || []).find(c => Number(c.num) === num) || null;
  }
  function setCurrentQuestionByNum(num){
    num = Number(num);
    let idx = (pool || []).findIndex(c => Number(c.num) === num);
    if(idx < 0){
      const rawIdx = (RAW || []).findIndex(c => Number(c.num) === num);
      if(rawIdx >= 0){
        pool = [...RAW];
        idx = rawIdx;
      }
    }
    if(idx >= 0){
      ci = idx;
      flipped = false;
      flipDir = 'horizontal';
      try{ renderCard(); }catch(e){}
      return true;
    }
    return false;
  }
  window.openStudyReport = function(num, ev){
    if(ev){
      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
    }
    const q = getQuestionByNum(num);
    if(!q) return alert('Không tìm thấy câu ' + num);
    if(!setCurrentQuestionByNum(num)) return alert('Không mở được câu ' + num);
    // Mở cùng form báo cáo/sửa như nút ! bên Flashcard
    try{ openEditor(); }catch(e){ alert('Không mở được báo cáo câu ' + num); }
    return false;
  };

  function hardBindReportButtons(){
    const list = document.getElementById('studyList');
    if(!list) return;

    // Chặn sớm từ document để không bị handler toggle khác bắt tiếp
    if(!document.__studyReportNoToggleDoc){
      document.__studyReportNoToggleDoc = true;
      document.addEventListener('click', function(e){
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if(!btn) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.openStudyReport(btn.dataset.reportNum, e);
        return false;
      }, true);
      document.addEventListener('pointerdown', function(e){
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if(!btn) return;
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
      document.addEventListener('mousedown', function(e){
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if(!btn) return;
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
    }

    list.querySelectorAll('.studyReportBtn,[data-report-num]').forEach(btn => {
      btn.setAttribute('type','button');
      btn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return window.openStudyReport(this.dataset.reportNum, e);
      };
      btn.onmousedown = function(e){ e.stopPropagation(); e.stopImmediatePropagation(); };
      btn.onpointerdown = function(e){ e.stopPropagation(); e.stopImmediatePropagation(); };
      btn.ontouchstart = function(e){ e.stopPropagation(); };
    });
  }

  // Gắn lại sau mỗi lần renderStudy vì danh sách được dựng lại bằng innerHTML
  const oldRenderStudy = typeof renderStudy === 'function' ? renderStudy : null;
  if(oldRenderStudy && !window.__studyReportRenderPatched){
    window.__studyReportRenderPatched = true;
    renderStudy = function(){
      const result = oldRenderStudy.apply(this, arguments);
      setTimeout(hardBindReportButtons, 0);
      return result;
    };
    window.renderStudy = renderStudy;
  }

  document.addEventListener('DOMContentLoaded', function(){
    hardBindReportButtons();
    setTimeout(hardBindReportButtons, 100);
    setTimeout(hardBindReportButtons, 500);
    setInterval(hardBindReportButtons, 1000);
  });
})();

// ===== FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614 =====
// Tăng biên độ nền landing lên nhẹ một chút, vẫn chậm và mềm.
(function(){
  let raf = 0;

  function injectStyle(){
    let st = document.getElementById('landingBgMoverRuntimeStyle');
    if(!st){
      st = document.createElement('style');
      st.id = 'landingBgMoverRuntimeStyle';
      document.head.appendChild(st);
    }
    st.textContent = `
      #hodLoginGate{
        position:fixed!important;
        inset:0!important;
        overflow:hidden!important;
        background:#03070d!important;
        isolation:isolate!important;
      }
      #hodLoginGate::before,#hodLoginGate:before,
      #hodLoginGate::after,#hodLoginGate:after{
        display:none!important;
        content:none!important;
        animation:none!important;
        background:none!important;
      }
      #landingBgMover{
        position:absolute!important;
        left:-9vw!important;
        top:-9vh!important;
        width:118vw!important;
        height:118vh!important;
        z-index:0!important;
        pointer-events:none!important;
        background-image:linear-gradient(180deg,rgba(3,7,13,.08),rgba(3,7,13,.42)),url('background.webp')!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        background-size:cover!important;
        transform-origin:center center!important;
        will-change:transform,filter!important;
      }
      #landingBgShade{
        position:absolute!important;
        inset:0!important;
        z-index:1!important;
        pointer-events:none!important;
        background:linear-gradient(90deg,rgba(3,10,20,.22),rgba(3,10,20,.04),rgba(3,10,20,.14))!important;
        opacity:.18!important;
      }
      #landingParticles{z-index:2!important;}
      .hodLoginGatePanel.simpleLanding{position:relative!important;z-index:3!important;}
    `;
  }

  function ensureLayer(){
    const gate = document.getElementById('hodLoginGate');
    if(!gate) return null;
    injectStyle();
    let bg = document.getElementById('landingBgMover');
    if(!bg){
      bg = document.createElement('div');
      bg.id = 'landingBgMover';
      gate.insertBefore(bg, gate.firstChild);
    }
    let shade = document.getElementById('landingBgShade');
    if(!shade){
      shade = document.createElement('div');
      shade.id = 'landingBgShade';
      gate.insertBefore(shade, bg.nextSibling);
    }
    return bg;
  }

  function isVisible(){
    const gate = document.getElementById('hodLoginGate');
    return !!gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
  }

  function frame(t){
    const bg = ensureLayer();
    if(bg && isVisible()){
      const x = Math.sin(t / 4200) * 12;
      const y = Math.cos(t / 5200) * 8;
      const r = Math.sin(t / 6800) * 0.08;
      const s = 1.048 + Math.sin(t / 7600) * 0.008;
      bg.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
      bg.style.filter = `saturate(${(1.04 + Math.sin(t/6200)*0.018).toFixed(3)}) contrast(1.02) brightness(${(1 + Math.cos(t/7000)*0.008).toFixed(3)})`;
    }
    raf = requestAnimationFrame(frame);
  }

  function boot(){
    cancelAnimationFrame(raf);
    ensureLayer();
    raf = requestAnimationFrame(frame);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('focus', boot);
  window.addEventListener('resize', boot, {passive:true});
})();

// ===== FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614 =====
// Search khôn hơn: bỏ từ rác như what/the/are, ưu tiên đúng cụm, ẩn câu không liên quan, chỉ highlight từ quan trọng.
(function(){
  const STOPWORDS = new Set([
    'a','an','the','and','or','but','if','then','else','when','where','why','how','what','which','who','whom','whose',
    'is','am','are','was','were','be','been','being','do','does','did','done','have','has','had','having',
    'can','could','should','would','will','shall','may','might','must',
    'in','on','at','by','for','from','to','of','with','without','into','onto','over','under','between','among','about','as','than','that','this','these','those','it','its','their','there','here',
    'two','three','four','five','one','option','options','choose','check','select','following','main',
    'la','là','cua','của','va','và','cac','các','nhung','những','mot','một','cho','voi','với','trong','ngoai','ngoài','duoc','được','khong','không','nao','nào','gi','gì','hay','hoac','hoặc','dap','an','dapan','dapán','cau','câu'
  ]);

  function normText(s){
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d')
      .replace(/[^a-z0-9#:\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function splitTokens(s){ return normText(s).split(/\s+/).filter(Boolean); }
  function meaningfulTokens(q){
    const raw = splitTokens(q);
    return raw.filter(t => {
      if(!t) return false;
      if(STOPWORDS.has(t)) return false;
      if(t.length < 3 && !/^\d+$/.test(t)) return false;
      if(/^(answer|ans|multi|multiple|chon|nhieu|lua|dap|an|dapan)$/.test(t)) return false;
      if(t.includes(':')) return false;
      return true;
    });
  }
  function parseQuery(q){
    const raw = String(q ?? '').trim();
    const n = normText(raw);
    const p = { raw, norm:n, num:null, answer:null, multi:false, tokens:[], numericOnly:false, phrase:'' };
    p.numericOnly = /^\d+$/.test(n);
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if(m) p.num = Number(m[1]);
    if(p.numericOnly) p.num = Number(n);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if(m) p.answer = m[1].toUpperCase().split('').sort().join('');
    p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    p.tokens = meaningfulTokens(raw).filter(t => {
      if(/^#?\d+$/.test(t) && p.num !== null) return false;
      if(/^[a-e]+$/.test(t) && p.answer) return false;
      return true;
    });
    p.phrase = p.tokens.join(' ');
    return p;
  }
  function optionText(c){ return Object.values(c?.options || {}).join(' '); }
  function correctAnswerText(c){
    const ans = String(c?.answer || '').toUpperCase();
    const opts = c?.options || {};
    return ans.split('').map(k => opts[k] || '').join(' ');
  }
  function hasWholeNumber(text,num){
    return new RegExp('(^|\\D)' + String(num).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?=\\D|$)').test(String(text ?? ''));
  }
  function editDistanceOne(a,b){
    if(a === b) return true;
    if(Math.abs(a.length - b.length) > 1) return false;
    let i=0,j=0,ed=0;
    while(i<a.length && j<b.length){
      if(a[i] === b[j]){ i++; j++; continue; }
      ed++; if(ed>1) return false;
      if(a.length > b.length) i++;
      else if(a.length < b.length) j++;
      else { i++; j++; }
    }
    return ed + (i<a.length?1:0) + (j<b.length?1:0) <= 1;
  }
  function tokenInText(token, textNorm){
    if(!token) return true;
    if(textNorm.includes(token)) return true;
    if(token.length < 5) return false;
    const words = textNorm.split(/\s+/).filter(w => Math.abs(w.length-token.length)<=1);
    return words.some(w => editDistanceOne(token,w));
  }
  function countMatches(tokens, textNorm){
    let n=0;
    for(const t of tokens) if(tokenInText(t,textNorm)) n++;
    return n;
  }
  function scoreQuestion(c,p){
    if(!p.raw) return {ok:true, score:0, auto:false};
    const ansSorted = sortAns(String(c.answer || '').toUpperCase());
    if(p.answer && ansSorted !== p.answer) return {ok:false, score:-1, auto:false};
    if(p.multi && String(c.answer || '').length <= 1) return {ok:false, score:-1, auto:false};

    const qNorm = normText(c.question || '');
    const optNorm = normText(optionText(c));
    const corNorm = normText(correctAnswerText(c));
    const ansLineNorm = normText([c.answer, c.answer_text, correctAnswerText(c)].join(' '));
    const allNorm = normText([c.num, c.question, c.answer, c.answer_text, optionText(c)].join(' '));
    let score = 0, auto = false;

    if(p.num !== null){
      const exact = Number(c.num) === p.num;
      const answerHasNum = hasWholeNumber([c.answer_text, correctAnswerText(c)].join(' '), p.num);
      if(p.numericOnly){
        if(!exact && !answerHasNum) return {ok:false, score:-1, auto:false};
        score += exact ? 2000 : 850;
        auto = answerHasNum;
      }else{
        if(!exact) return {ok:false, score:-1, auto:false};
        score += 2000;
      }
    }

    if(p.answer){ score += 900; auto = true; }
    if(p.multi){ score += 350; }

    const tokens = p.tokens;
    if(tokens.length){
      const qHit = countMatches(tokens, qNorm);
      const optHit = countMatches(tokens, optNorm);
      const corHit = countMatches(tokens, corNorm);
      const allHit = countMatches(tokens, allNorm);

      // Nếu query có nhiều từ quan trọng, bắt buộc khớp phần lớn từ.
      const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.72);
      if(allHit < required) return {ok:false, score:-1, auto:false};

      // Ưu tiên đúng cụm liên tiếp.
      if(p.phrase && qNorm.includes(p.phrase)) score += 1200;
      if(p.phrase && optNorm.includes(p.phrase)) score += 850;
      if(p.phrase && corNorm.includes(p.phrase)) { score += 1000; auto = true; }

      score += qHit * 180 + optHit * 95 + corHit * 160;
      if(corHit > 0 || (p.phrase && ansLineNorm.includes(p.phrase))) auto = true;

      // Phạt nặng mấy câu chỉ trúng từ quá chung rải rác.
      if(tokens.length >= 3 && qHit === 0 && optHit < required) return {ok:false, score:-1, auto:false};
      if(tokens.length >= 4 && allHit < tokens.length) score -= (tokens.length - allHit) * 220;
    } else if(!p.num && !p.answer && !p.multi){
      return {ok:false, score:-1, auto:false};
    }

    return {ok:true, score, auto};
  }
  function smartBetter(q){
    const p = parseQuery(q);
    if(!p.raw) return RAW;
    return RAW.map(c => ({c, m:scoreQuestion(c,p)}))
      .filter(x => x.m.ok)
      .sort((a,b) => b.m.score - a.m.score || Number(a.c.num)-Number(b.c.num))
      .map(x => Object.assign({}, x.c, {__autoOpenAnswer:x.m.auto}));
  }
  function markText(text, query, cls='tokenMark'){
    const parser = (typeof parseQuery === 'function') ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s){ return esc(s); }

    function normWithMap(s){
      let norm = '', map = [], lastSpace = true;
      for(let i=0;i<s.length;i++){
        const ch = s[i];
        const n = normText(ch);
        if(n){
          for(const c of n){ norm += c; map.push(i); }
          lastSpace = false;
        }else if(!lastSpace){
          norm += ' '; map.push(i); lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while(norm.startsWith(' ')){ norm = norm.slice(1); map.shift(); }
      return {norm, map};
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if(cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi){
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if(hit >= 0){
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? (source.length - 1)) + 1;
        return escLocal(source.slice(0,start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start,end))}</mark>` +
          escLocal(source.slice(end));
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0,10);
    if(!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts.map(part => {
      const np = normText(part);
      if(np && tokens.some(t => np === t || np.includes(t) || t.includes(np))){
        return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
      }
      return escLocal(part);
    }).join('');
  }
  function optionStudy(c,q){
    return Object.entries(c.options || {}).map(([k,v]) => {
      const right = String(c.answer || '').includes(k);
      return `<div class="sopt ${right?'ans correct':''}"><div class="skey">${right?'✓':esc(k)}</div><div>${esc(k+'. ')}${markText(v,q)}</div></div>`;
    }).join('');
  }
  function renderStudyBetter(){
    const input = $('search');
    const q = input ? (input.value || '') : '';
    if(input) input.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
    const arr = smartBetter(q);
    const max = arr.length;
    const html = arr.slice(0,max).map(c => {
      const auto = !!c.__autoOpenAnswer;
      return `<div class="sitem compactStudyCard ${auto?'autoOpenAnswer open':''}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question,q,'phraseMark')}</div>
          <div class="compactCardRight">${auto?'<span class="answerMatchChip">Khớp đáp án</span>':''}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="Báo cáo câu ${esc(c.num)}">!</button><span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c,q)}</div></div>
      </div>`;
    }).join('');
    $('studyList').innerHTML = html + (arr.length>max ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>` : arr.length ? '' : '<div class="more">Không tìm thấy kết quả.</div>');
  }
  function bindBetterSearch(){
    const s = $('search');
    if(s){ s.oninput = renderStudyBetter; s.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...'; }
    const list = $('studyList');
    if(list && !list.__betterSearchBound){
      list.__betterSearchBound = true;
      list.addEventListener('click', function(e){
        const rb = e.target.closest('[data-report-num]');
        if(rb){ e.preventDefault(); e.stopImmediatePropagation(); window.openStudyReport?.(rb.dataset.reportNum, e); return; }
        const it = e.target.closest('.sitem');
        if(!it) return;
        e.preventDefault(); e.stopImmediatePropagation();
        it.classList.toggle('open'); it.classList.remove('autoOpenAnswer');
      }, true);
    }
  }

  smart = smartBetter;
  renderStudy = renderStudyBetter;
  window.renderStudy = renderStudyBetter;
  document.addEventListener('DOMContentLoaded', function(){
    bindBetterSearch();
    setTimeout(bindBetterSearch,100);
    setTimeout(bindBetterSearch,600);
    try{ renderStudyBetter(); }catch(e){}
  });
})();


// ===== FINAL_ADMIN_EDITOR_ADD_QUESTION_AND_SHOW_ALL_20260614 =====
// 1) Tab "Tất cả" hiện toàn bộ kết quả, không dừng ở 180.
// 2) Thêm nút + góc phải để admin/editor thêm câu hỏi trực tiếp vào Supabase.
(function(){
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const $ = id => document.getElementById(id);
  const escLocal = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const subjectCode = () => localStorage.getItem(SUBJECT_STORE) || '';
  const client = () => window.HODSupabase?.__client || null;
  const user = () => window.HODSupabase?.getUser?.() || null;
  const profile = () => window.HODSupabase?.getProfile?.() || null;
  function canManageQuestions(){
    const p = profile();
    const role = String(p?.role || '').toLowerCase();
    return !!user() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function notifyAdd(msg){ if(typeof notify === 'function') notify(msg); else alert(msg); }

  // Chặn mọi giới hạn 120/160/180 còn sót lại trong dòng thông báo nếu hàm cũ vẫn chạy.
  function cleanupLimitText(){
    const list = $('studyList');
    if(!list) return;
    list.querySelectorAll('.more').forEach(x => {
      if(/Đang hiển thị\s+\d+\s*\//i.test(x.textContent || '')) x.remove();
    });
  }
  const oldRenderStudy = typeof renderStudy === 'function' ? renderStudy : null;
  if(oldRenderStudy && !window.__showAllStudyPatched20260614){
    window.__showAllStudyPatched20260614 = true;
    renderStudy = function(){
      const r = oldRenderStudy.apply(this, arguments);
      setTimeout(cleanupLimitText, 0);
      return r;
    };
    window.renderStudy = renderStudy;
  }

  function ensureAddQuestionUI(){
    if(!$('addQuestionFab')){
      const btn = document.createElement('button');
      btn.id = 'addQuestionFab';
      btn.type = 'button';
      btn.title = 'Thêm câu hỏi';
      btn.textContent = '+';
      btn.onclick = openAddQuestionModal;
      document.body.appendChild(btn);
    }
    if(!$('addQuestionModal')){
      const modal = document.createElement('div');
      modal.id = 'addQuestionModal';
      modal.className = 'modal hidden addQuestionModal';
      modal.innerHTML = `
        <div class="box addQuestionBox">
          <button type="button" class="modalX" id="addQuestionClose">×</button>
          <h2>Thêm câu hỏi</h2>
          <p class="addQuestionHint">Chỉ admin/editor mới thấy và dùng được chức năng này.</p>
          <div class="field"><label>Số câu</label><input id="addQuestionNum" type="number" min="1" placeholder="Tự lấy số tiếp theo nếu để trống"></div>
          <div class="field"><label>Câu hỏi</label><textarea id="addQuestionText" placeholder="Nhập nội dung câu hỏi..."></textarea></div>
          <div class="editGrid addQuestionOptions">
            <div class="field"><label>Đáp án A</label><textarea id="addOptA"></textarea></div>
            <div class="field"><label>Đáp án B</label><textarea id="addOptB"></textarea></div>
            <div class="field"><label>Đáp án C</label><textarea id="addOptC"></textarea></div>
            <div class="field"><label>Đáp án D</label><textarea id="addOptD"></textarea></div>
            <div class="field"><label>Đáp án E</label><textarea id="addOptE" placeholder="Có thể bỏ trống"></textarea></div>
            <div class="field"><label>Đáp án đúng</label><input id="addQuestionAnswer" placeholder="Ví dụ: A hoặc BC"></div>
          </div>
          <div class="row addQuestionActions">
            <button type="button" class="primary" id="saveAddQuestion">Lưu câu hỏi</button>
            <button type="button" class="btn" id="cancelAddQuestion">Hủy</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      $('addQuestionClose').onclick = closeAddQuestionModal;
      $('cancelAddQuestion').onclick = closeAddQuestionModal;
      $('saveAddQuestion').onclick = saveNewQuestion;
      modal.addEventListener('mousedown', e => { if(e.target === modal) closeAddQuestionModal(); });
    }
    updateAddQuestionVisibility();
  }

  function updateAddQuestionVisibility(){
    const btn = $('addQuestionFab');
    if(!btn) return;
    const show = canManageQuestions();
    btn.classList.toggle('hidden', !show);
    btn.style.display = show ? 'flex' : 'none';
    document.body.classList.toggle('can-add-question', show);
    if(!show) $('addQuestionModal')?.classList.add('hidden');
  }

  function nextQuestionNum(){
    const nums = (RAW || []).map(q => Number(q.num)).filter(Number.isFinite);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function openAddQuestionModal(){
    if(!canManageQuestions()) return;
    ensureAddQuestionUI();
    $('addQuestionNum').value = nextQuestionNum();
    $('addQuestionText').value = '';
    ['A','B','C','D','E'].forEach(k => { const el = $('addOpt'+k); if(el) el.value = ''; });
    $('addQuestionAnswer').value = '';
    $('addQuestionModal').classList.remove('hidden');
    setTimeout(() => $('addQuestionText')?.focus(), 60);
  }
  function closeAddQuestionModal(){ $('addQuestionModal')?.classList.add('hidden'); }

  function buildAnswerText(answer, options){
    return String(answer || '').toUpperCase().split('').filter(Boolean).map(k => k + '. ' + (options[k] || '')).join('; ');
  }

  async function saveNewQuestion(){
    if(!canManageQuestions()) return alert('Tài khoản này không có quyền thêm câu hỏi.');
    const c = client();
    if(!c) return alert('Chưa kết nối Supabase.');
    const subject = subjectCode();
    if(!subject) return alert('Bạn cần chọn môn trước.');

    const num = Number(($('addQuestionNum')?.value || '').trim()) || nextQuestionNum();
    const question = ($('addQuestionText')?.value || '').trim();
    const answer = ($('addQuestionAnswer')?.value || '').trim().toUpperCase().replace(/[^A-E]/g,'');
    const options = {};
    ['A','B','C','D','E'].forEach(k => {
      const v = ($('addOpt'+k)?.value || '').trim();
      if(v) options[k] = v;
    });

    if(!question) return alert('Nhập câu hỏi trước.');
    if(Object.keys(options).length < 2) return alert('Nhập ít nhất 2 đáp án.');
    if(!answer) return alert('Nhập đáp án đúng, ví dụ A hoặc BC.');
    for(const k of answer){ if(!options[k]) return alert('Đáp án đúng '+k+' chưa có nội dung.'); }

    const payload = {
      subject_code: subject,
      num,
      question,
      options,
      answer,
      answer_text: buildAnswerText(answer, options),
      images: [],
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const btn = $('saveAddQuestion');
    if(btn){ btn.disabled = true; btn.textContent = 'Đang lưu...'; }
    try{
      const { data, error } = await c.from('questions').insert(payload).select('*').single();
      if(error) throw error;
      try{
        await c.from('question_history').insert({
          question_id: data?.id || null,
          request_id: null,
          previous_data: null,
          new_data: payload,
          changed_by: user()?.id || null,
          approved_by: user()?.id || null
        });
      }catch(e){}
      closeAddQuestionModal();
      notifyAdd('Đã thêm câu hỏi');
      if(typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly();
      else if(window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
      try{
        const idx = (RAW || []).findIndex(q => Number(q.num) === num);
        if(idx >= 0){ pool = [...RAW]; ci = idx; flipped = false; renderCard?.(); renderStudy?.(); }
      }catch(e){}
    }catch(err){
      alert('Thêm câu hỏi thất bại: ' + (err?.message || err));
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = 'Lưu câu hỏi'; }
    }
  }

  function bootAddQuestion(){
    ensureAddQuestionUI();
    updateAddQuestionVisibility();
    cleanupLimitText();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootAddQuestion);
  else bootAddQuestion();
  setTimeout(bootAddQuestion, 300);
  setTimeout(bootAddQuestion, 1200);
  setInterval(updateAddQuestionVisibility, 700);
})();


// ===== HOTFIX_SHOW_PLUS_ONLY_STUDY_TAB_20260614 =====
// Sửa lỗi CSS display:none!important làm mất nút +. Nút + chỉ hiện ở tab Tất cả cho admin/editor.
(function(){
  const $ = id => document.getElementById(id);
  function canManage(){
    const p = window.HODSupabase?.getProfile?.() || null;
    const u = window.HODSupabase?.getUser?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return !!u && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isStudyTab(){
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function ensurePlus(){
    let btn = $('addQuestionFab');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'addQuestionFab';
      btn.type = 'button';
      btn.title = 'Thêm câu hỏi';
      btn.textContent = '+';
      document.body.appendChild(btn);
    }
    if(!btn.__hotfixPlusClick){
      btn.__hotfixPlusClick = true;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(typeof openAddModal === 'function') return openAddModal();
        const modal = $('addQuestionModal');
        if(modal) modal.classList.remove('hidden');
      });
    }
    return btn;
  }
  function updatePlus(){
    const btn = ensurePlus();
    const show = canManage() && isStudyTab();
    document.body.classList.toggle('add-question-visible', show);
    btn.classList.toggle('hidden', !show);
    btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
    btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
    btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
    btn.style.setProperty('opacity', show ? '1' : '0', 'important');
  }
  function boot(){
    updatePlus();
    document.querySelectorAll('.tab').forEach(t => {
      if(t.__hotfixPlusBound) return;
      t.__hotfixPlusBound = true;
      t.addEventListener('click', () => setTimeout(updatePlus, 80));
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
  setInterval(updatePlus, 250);
})();


// ===== FINAL_PRETTY_ADD_QUESTION_EDIT_STYLE_20260614 =====
// Form thêm câu mới dùng layout giống form Sửa trực tiếp câu + nút cộng đẹp hơn.
(function(){
  const SUBJECT_STORE='learninghub_subject_code_merged_v1';
  const $=id=>document.getElementById(id);
  const subjectCode=()=>localStorage.getItem(SUBJECT_STORE)||'';
  const client=()=>window.HODSupabase?.__client||null;
  const user=()=>window.HODSupabase?.getUser?.()||null;
  const profile=()=>window.HODSupabase?.getProfile?.()||null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let addImages=[];

  function canManage(){
    const p=profile();
    const role=String(p?.role||'').toLowerCase();
    return !!user() && (role==='admin'||role==='editor') && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }
  function isAllTab(){
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function nextNum(){
    const nums=(RAW||[]).map(q=>Number(q.num)).filter(Number.isFinite);
    return nums.length?Math.max(...nums)+1:1;
  }
  function notifyOk(msg){ if(typeof notify==='function') notify(msg); else alert(msg); }

  function ensurePlus(){
    let btn=$('addQuestionFab');
    if(!btn){
      btn=document.createElement('button');
      btn.id='addQuestionFab';
      btn.type='button';
      btn.title='Thêm câu hỏi';
      btn.textContent='+';
      document.body.appendChild(btn);
    }
    btn.classList.add('prettyAddFab');
    btn.innerHTML='<span>+</span>';
    btn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      openPrettyAddModal();
    };
    return btn;
  }

  function updatePlus(){
    const btn=ensurePlus();
    const show=canManage() && isAllTab();
    document.body.classList.toggle('add-question-visible',show);
    btn.classList.toggle('hidden',!show);
    btn.style.setProperty('display',show?'flex':'none','important');
    btn.style.setProperty('visibility',show?'visible':'hidden','important');
    btn.style.setProperty('opacity',show?'1':'0','important');
    btn.style.setProperty('pointer-events',show?'auto':'none','important');
    if(!show) $('addQuestionModal')?.classList.add('hidden');
  }

  function ensurePrettyModal(){
    let modal=$('addQuestionModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='addQuestionModal';
      modal.className='modal hidden addQuestionModal';
      document.body.appendChild(modal);
    }
    if(modal.dataset.prettyVersion==='20260614') return modal;
    modal.dataset.prettyVersion='20260614';
    modal.className='modal hidden addQuestionModal prettyAddModal';
    modal.innerHTML=`
      <div class="box prettyAddBox">
        <button type="button" class="modalX" id="addQuestionClose">×</button>
        <h2>Thêm câu hỏi mới</h2>

        <div class="field addFieldQuestion">
          <label>Câu hỏi</label>
          <textarea id="addQuestionText" placeholder="Nhập nội dung câu hỏi..."></textarea>
        </div>

        <div class="field addFieldA">
          <label>Đáp án A</label>
          <textarea id="addOptA" placeholder="Nhập đáp án A"></textarea>
        </div>
        <div class="field addFieldB">
          <label>Đáp án B</label>
          <textarea id="addOptB" placeholder="Nhập đáp án B"></textarea>
        </div>

        <div class="field addFieldAnswer">
          <label>Đáp án đúng</label>
          <input id="addQuestionAnswer" placeholder="Ví dụ: A hoặc BC">
        </div>
        <div class="field addFieldC">
          <label>Đáp án C</label>
          <textarea id="addOptC" placeholder="Nhập đáp án C"></textarea>
        </div>
        <div class="field addFieldD">
          <label>Đáp án D</label>
          <textarea id="addOptD" placeholder="Nhập đáp án D"></textarea>
        </div>

        <div class="field addFieldImage">
          <label>Hình ảnh</label>
          <input id="addImgUpload" type="file" accept="image/*" multiple>
          <div id="addImgs" class="editImgs addImgs">Chưa có hình.</div>
        </div>
        <div class="field addFieldE">
          <label>Đáp án E</label>
          <textarea id="addOptE" placeholder="Có thể bỏ trống"></textarea>
        </div>
        <div class="field addFieldNum">
          <label>Số câu</label>
          <input id="addQuestionNum" type="number" min="1" placeholder="Tự lấy số tiếp theo nếu để trống">
        </div>

        <div class="row addQuestionActions">
          <button type="button" class="primary" id="saveAddQuestion">Lưu câu hỏi</button>
          <button type="button" class="btn" id="cancelAddQuestion">Đóng</button>
        </div>
      </div>`;

    $('addQuestionClose').onclick=closePrettyAddModal;
    $('cancelAddQuestion').onclick=closePrettyAddModal;
    $('saveAddQuestion').onclick=savePrettyQuestion;
    $('addImgUpload').onchange=e=>{
      [...(e.target.files||[])].forEach(file=>{
        const fr=new FileReader();
        fr.onload=()=>{
          addImages.push({id:'add_'+Date.now()+'_'+Math.random().toString(16).slice(2),src:fr.result,source:'user-upload',name:file.name});
          renderPrettyImages();
        };
        fr.readAsDataURL(file);
      });
      e.target.value='';
    };
    $('addImgs').onclick=e=>{
      const b=e.target.closest('[data-add-rm]');
      if(!b) return;
      addImages.splice(Number(b.dataset.addRm),1);
      renderPrettyImages();
    };
    modal.addEventListener('mousedown',e=>{if(e.target===modal)closePrettyAddModal();});
    return modal;
  }

  function renderPrettyImages(){
    const box=$('addImgs');
    if(!box) return;
    box.innerHTML=addImages.length?addImages.map((im,i)=>`
      <div class="editImg addPreviewImg">
        <button type="button" class="rm" data-add-rm="${i}">×</button>
        <img src="${esc(im.src)}" alt="">
      </div>`).join(''):'Chưa có hình.';
  }

  function openPrettyAddModal(){
    if(!canManage()) return;
    if(!isAllTab()) return;
    const modal=ensurePrettyModal();
    addImages=[];
    $('addQuestionNum').value=nextNum();
    $('addQuestionText').value='';
    ['A','B','C','D','E'].forEach(k=>{const el=$('addOpt'+k); if(el) el.value='';});
    $('addQuestionAnswer').value='';
    renderPrettyImages();
    modal.classList.remove('hidden');
    setTimeout(()=>$('addQuestionText')?.focus(),80);
  }
  function closePrettyAddModal(){ $('addQuestionModal')?.classList.add('hidden'); }

  function answerTextLine(answer,options){
    return String(answer||'').toUpperCase().split('').filter(Boolean).map(k=>k+'. '+(options[k]||'')).join('; ');
  }
  async function savePrettyQuestion(){
    if(!canManage()) return alert('Tài khoản này không có quyền thêm câu hỏi.');
    const c=client(); if(!c) return alert('Chưa kết nối Supabase.');
    const subject=subjectCode(); if(!subject) return alert('Bạn cần chọn môn trước.');

    const num=Number(($('addQuestionNum')?.value||'').trim())||nextNum();
    const question=($('addQuestionText')?.value||'').trim();
    const answer=($('addQuestionAnswer')?.value||'').trim().toUpperCase().replace(/[^A-E]/g,'');
    const options={};
    ['A','B','C','D','E'].forEach(k=>{const v=($('addOpt'+k)?.value||'').trim(); if(v) options[k]=v;});

    if(!question) return alert('Nhập câu hỏi trước.');
    if(Object.keys(options).length<2) return alert('Nhập ít nhất 2 đáp án.');
    if(!answer) return alert('Nhập đáp án đúng, ví dụ A hoặc BC.');
    for(const k of answer){ if(!options[k]) return alert('Đáp án đúng '+k+' chưa có nội dung.'); }

    const payload={subject_code:subject,num,question,options,answer,answer_text:answerTextLine(answer,options),images:addImages,is_active:true,updated_at:new Date().toISOString()};
    const btn=$('saveAddQuestion');
    if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
    try{
      const {data,error}=await c.from('questions').insert(payload).select('*').single();
      if(error) throw error;
      try{await c.from('question_history').insert({question_id:data?.id||null,request_id:null,previous_data:null,new_data:payload,changed_by:user()?.id||null,approved_by:user()?.id||null});}catch(e){}
      closePrettyAddModal();
      notifyOk('Đã thêm câu hỏi');
      if(typeof window.loadCurrentSubjectOnly==='function') await window.loadCurrentSubjectOnly();
      else if(window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
      try{
        const idx=(RAW||[]).findIndex(q=>Number(q.num)===num);
        if(idx>=0){pool=[...RAW];ci=idx;flipped=false;renderCard?.();renderStudy?.();}
      }catch(e){}
    }catch(err){
      alert('Thêm câu hỏi thất bại: '+(err?.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Lưu câu hỏi';}
    }
  }

  function boot(){
    ensurePlus();
    ensurePrettyModal();
    updatePlus();
    document.querySelectorAll('.tab').forEach(t=>{
      if(t.__prettyAddTabBound) return;
      t.__prettyAddTabBound=true;
      t.addEventListener('click',()=>setTimeout(updatePlus,80));
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,300); setTimeout(boot,1000);
  setInterval(updatePlus,250);
})();


// ===== HOTFIX_ADD_MODAL_COMPACT_HIDE_PLUS_20260614 =====
// Ẩn nút + khi đang mở form thêm câu hỏi. Form thêm câu hỏi gọn lại để thấy đủ nút Lưu/Đóng trong một màn hình.
(function(){
  const $ = id => document.getElementById(id);
  function canManage(){
    const p = window.HODSupabase?.getProfile?.() || null;
    const u = window.HODSupabase?.getUser?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return !!u && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isStudyTab(){
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function modalOpen(){
    const m = $('addQuestionModal');
    return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
  }
  function updatePlusFinal(){
    const btn = $('addQuestionFab');
    const show = !!btn && canManage() && isStudyTab() && !modalOpen();
    document.body.classList.toggle('add-question-visible', show);
    document.body.classList.toggle('add-question-modal-open', modalOpen());
    if(btn){
      btn.classList.toggle('hidden', !show);
      btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
      btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
      btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
      btn.style.setProperty('opacity', show ? '1' : '0', 'important');
    }
  }
  function patchModalButtons(){
    const modal = $('addQuestionModal');
    if(!modal || modal.__compactHidePlusPatched) return;
    modal.__compactHidePlusPatched = true;
    modal.addEventListener('mousedown', () => setTimeout(updatePlusFinal, 30), true);
    modal.addEventListener('click', () => setTimeout(updatePlusFinal, 30), true);
    const obs = new MutationObserver(() => setTimeout(updatePlusFinal, 30));
    obs.observe(modal, {attributes:true, attributeFilter:['class','style']});
  }
  function boot(){
    patchModalButtons();
    updatePlusFinal();
    document.querySelectorAll('.tab').forEach(t => {
      if(t.__finalAddPlusHideBound) return;
      t.__finalAddPlusHideBound = true;
      t.addEventListener('click', () => setTimeout(updatePlusFinal, 100));
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
  setInterval(updatePlusFinal, 200);
})();


// ===== HOTFIX_ADD_PLUS_CLEAN_NO_GHOST_20260614 =====
// Bảo đảm nút + chỉ có 1 icon, không sinh thêm lớp lạ.
(function(){
  function cleanPlus(){
    const btn=document.getElementById('addQuestionFab');
    if(!btn) return;
    btn.classList.add('prettyAddFab');
    if(!btn.querySelector('span')) btn.innerHTML='<span>+</span>';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',cleanPlus); else cleanPlus();
  setTimeout(cleanPlus,300);
  setInterval(cleanPlus,1000);
})();


// ===== HOTFIX_STOP_PLUS_FLICKER_WHEN_ADD_MODAL_OPEN_20260614 =====
// Chặn các interval cũ bật lại nút + khi form Thêm câu hỏi đang mở.
(function(){
  const $ = id => document.getElementById(id);
  let raf = 0;
  function modalOpen(){
    const m = $('addQuestionModal');
    return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
  }
  function hardHidePlus(){
    const btn = $('addQuestionFab');
    if(!btn) return;
    btn.classList.add('hidden');
    btn.setAttribute('aria-hidden','true');
    btn.style.setProperty('display','none','important');
    btn.style.setProperty('visibility','hidden','important');
    btn.style.setProperty('opacity','0','important');
    btn.style.setProperty('pointer-events','none','important');
    document.body.classList.add('add-question-modal-open');
    document.body.classList.remove('add-question-visible');
  }
  function canManage(){
    const p = window.HODSupabase?.getProfile?.() || null;
    const u = window.HODSupabase?.getUser?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return !!u && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isStudyTab(){
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function showPlusIfAllowed(){
    const btn = $('addQuestionFab');
    if(!btn) return;
    const show = canManage() && isStudyTab() && !modalOpen();
    document.body.classList.toggle('add-question-visible', show);
    document.body.classList.toggle('add-question-modal-open', modalOpen());
    btn.classList.toggle('hidden', !show);
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
    btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
    btn.style.setProperty('opacity', show ? '1' : '0', 'important');
    btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
  }
  function frameLock(){
    if(modalOpen()){
      hardHidePlus();
      raf = requestAnimationFrame(frameLock);
    }else{
      cancelAnimationFrame(raf);
      raf = 0;
      document.body.classList.remove('add-question-modal-open');
      showPlusIfAllowed();
    }
  }
  function startLock(){
    if(raf) return;
    raf = requestAnimationFrame(frameLock);
  }
  function boot(){
    const modal = $('addQuestionModal');
    if(modal && !modal.__plusFlickerObserver){
      modal.__plusFlickerObserver = true;
      const obs = new MutationObserver(() => { modalOpen() ? startLock() : showPlusIfAllowed(); });
      obs.observe(modal, {attributes:true, attributeFilter:['class','style']});
      modal.addEventListener('click', () => setTimeout(() => modalOpen() ? startLock() : showPlusIfAllowed(), 0), true);
      modal.addEventListener('mousedown', () => setTimeout(() => modalOpen() ? startLock() : showPlusIfAllowed(), 0), true);
    }
    const btn = $('addQuestionFab');
    if(btn && !btn.__plusFlickerCapture){
      btn.__plusFlickerCapture = true;
      btn.addEventListener('click', () => { hardHidePlus(); startLock(); }, true);
      btn.addEventListener('mousedown', () => { hardHidePlus(); startLock(); }, true);
      btn.addEventListener('pointerdown', () => { hardHidePlus(); startLock(); }, true);
    }
    modalOpen() ? startLock() : showPlusIfAllowed();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 100);
  setTimeout(boot, 500);
  setInterval(() => { modalOpen() ? startLock() : showPlusIfAllowed(); }, 80);
})();


// ===== FINAL_DELETE_BUTTON_BESIDE_OPEN_20260614 =====
// Nút Xóa nằm CẠNH nút Mở/Thu gọn, không xóa nút Mở.
(function(){
  function $(id){ return document.getElementById(id); }
  function canManage(){
    const p = window.HODSupabase?.getProfile?.() || null;
    const u = window.HODSupabase?.getUser?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return !!u && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isStudyTab(){
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function getNum(card){
    const d = card?.dataset?.num || card?.getAttribute?.('data-num');
    if(d && /^\d+$/.test(String(d))) return Number(d);
    const m = String(card?.textContent || '').match(/CÂU\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  }
  function addDeleteButtons(){
    const list = $('studyList');
    if(!list) return;
    const show = canManage() && isStudyTab();
    document.body.classList.toggle('study-has-delete', show);

    list.querySelectorAll('.sitem, .compactStudyCard').forEach(card => {
      let holder = card.querySelector('.compactCardRight');
      if(!holder){
        holder = document.createElement('div');
        holder.className = 'compactCardRight';
        const line = card.querySelector('.compactCardLine');
        if(line) line.appendChild(holder); else card.appendChild(holder);
      }
      const existing = card.querySelector('.studyDeleteAction');
      if(!show){ if(existing) existing.remove(); return; }
      const num = getNum(card);
      if(!num) return;
      card.dataset.num = String(num);
      if(existing){ existing.dataset.deleteNum = String(num); return; }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'studyDeleteAction';
      btn.dataset.deleteNum = String(num);
      btn.title = 'Xóa câu ' + num;
      btn.textContent = 'Xóa';
      holder.appendChild(btn);
    });
  }
  function patchRender(){
    if(window.__deleteButtonRenderPatched) return;
    const old = typeof renderStudy === 'function' ? renderStudy : null;
    if(!old) return;
    window.__deleteButtonRenderPatched = true;
    renderStudy = function(){
      const r = old.apply(this, arguments);
      setTimeout(addDeleteButtons, 0);
      setTimeout(addDeleteButtons, 100);
      return r;
    };
    window.renderStudy = renderStudy;
  }
  function boot(){
    patchRender();
    addDeleteButtons();
    document.querySelectorAll('.tab').forEach(t => {
      if(t.__deleteBtnBound) return;
      t.__deleteBtnBound = true;
      t.addEventListener('click', () => setTimeout(addDeleteButtons, 100));
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
  setInterval(addDeleteButtons, 1500);
})();


// ===== FIX_DELETE_BUTTON_WORKS_20260614 =====
(function(){
  const $ = id => document.getElementById(id);
  function client(){ return window.HODSupabase?.__client || null; }
  function user(){ return window.HODSupabase?.getUser?.() || null; }
  function profile(){ return window.HODSupabase?.getProfile?.() || null; }
  function canManage(){
    const p = profile();
    const role = String(p?.role || '').toLowerCase();
    return !!user() && (role==='admin' || role==='editor');
  }
  function getQ(num){ num=Number(num); return (RAW||[]).find(q=>Number(q.num)===num) || null; }

  async function doDelete(num){
    num = Number(num);
    const q=getQ(num); if(!q) return notify('Không thấy câu ' + num);
    if(!canManage()) return notify('Không có quyền xóa');
    if(!confirm('Xóa câu '+num+'?\nCâu hỏi sẽ bị ẩn (soft delete).')) return;
    const c=client(); if(!c) return notify('Chưa kết nối Supabase');
    const col = q.id ? 'id' : 'num';
    const val = q.id || num;
    const {error}= await c.from('questions').update({is_active:false, updated_at:new Date().toISOString()}).eq(col, val);
    if(error) return notify('Lỗi xóa: '+error.message);
    RAW = (RAW||[]).filter(x=>Number(x.num)!==num);
    pool = (pool||[]).filter(x=>Number(x.num)!==num);
    try{ renderStudy?.(); renderCard?.(); renderQuiz?.(); }catch(e){}
    notify('Đã xóa câu ' + num);
  }

  if(!document.__deleteActionBound){
    document.__deleteActionBound=true;
    document.addEventListener('click', e=>{
      const btn = e.target.closest && e.target.closest('.studyDeleteAction');
      if(!btn) return;
      e.preventDefault();
      e.stopPropagation();
      doDelete(btn.dataset.deleteNum);
    });
  }
})();
