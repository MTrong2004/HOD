window.HOD_DATA=[];
(function(){var s=document.createElement('script');s.type='application/json';s.id='data';s.textContent='[]';document.head.appendChild(s);})();

// === LOCAL DEV BYPASS: skip login when opened from file:// ===
if(location.protocol === 'file:'){
  window.__LOCAL_DEV_MODE = true;
  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('hodLoginGate')?.classList.add('hidden');
    document.getElementById('hodPendingApproval')?.classList.add('hidden');
    document.body?.classList.remove('hod-locked');
    var sg = document.getElementById('subjectGate');
    if(sg){ sg.classList.remove('hidden'); sg.setAttribute('aria-hidden','false'); document.body.classList.add('has-subject-gate'); }
  });
}

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


  // ===== APP_DISCORD_LOGIN_NOTIFY_PATCH_20260625 =====
  async function sendLoginToDiscord(email, role) {
    const discordUrl = 'https://discord.com/api/webhooks/1519452717947420732/j-EVKdyuRYHRXU6MJbW9z_2lAy-wV2XnEOVULJEtDSgtignSVh2fWTTJKFgHj2MgoTJQ';

    let embedColor = 3447003;
    if (role === 'admin') embedColor = 10038562;
    else if (role === 'editor') embedColor = 3066993;

    const payload = {
      embeds: [{
        title: '🔑 ĐĂNG NHẬP WEB THÀNH CÔNG',
        color: embedColor,
        fields: [
          { name: '👤 Tài khoản Gmail', value: email || 'N/A', inline: true },
          { name: '🎭 Vai trò', value: role || 'user', inline: true },
          { name: '⏰ Thời điểm', value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), inline: false }
        ]
      }]
    };

    try {
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn('Lỗi gửi thông báo login web:', error);
    }
  }

  async function notifyLoginToDiscordOnce(){
    try {
      if (!currentUser) return;
      const loginKey = 'hod_web_login_discord_notified';
      const userKey = currentUser.id || currentUser.email || 'unknown';
      if (sessionStorage.getItem(loginKey) === userKey) return;
      await sendLoginToDiscord(currentProfile?.email || currentUser.email || '', currentProfile?.role || 'user');
      sessionStorage.setItem(loginKey, userKey);
    } catch (e) {
      console.warn('Không gửi được thông báo Discord login web:', e);
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
      let regMode = 'approval';
      try{
        const {data:setting} = await client.from('site_settings').select('value').eq('key','registration_mode').maybeSingle();
        if(setting && setting.value){
          regMode = typeof setting.value === 'string' ? setting.value.replace(/"/g,'') : String(setting.value);
        }
      }catch(e){ console.warn('Không đọc được registration_mode, mặc định approval:', e); }

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

    await notifyLoginToDiscordOnce();

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
    sessionStorage.removeItem('hod_web_login_discord_notified');
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
  function showLogin(){ if(window.__LOCAL_DEV_MODE) return; document.body?.classList.add('hod-locked'); $('hodLoginGate')?.classList.remove('hidden'); $('hodAccountMenu')?.classList.add('hidden'); $('hodPendingApproval')?.classList.add('hidden'); }
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
  function fallbackSubjects(){ return [{code:'HOD102', name:'HOD102 Learning', description:'Môn mặc định để bắt đầu học.', cover:'', is_active:true, question_count:0},{code:'MLN111', name:'MLN111 Learning', description:'Bộ câu hỏi và tài liệu MLN111.', cover:'', is_active:true, question_count:0}]; }
  async function addQuestionCounts(subjects){
    const supa=c();
    if(!supa||!logged()||!subjects?.length) return subjects;
    const codes=subjects.map(s=>s.code).filter(Boolean);
    if(!codes.length) return subjects;
    try{
      const {data,error}=await supa.from('questions').select('subject_code').eq('is_active', true).in('subject_code', codes);
      if(error) throw error;
      const counts={};
      (data||[]).forEach(q=>{ const code=q.subject_code; if(code) counts[code]=(counts[code]||0)+1; });
      return subjects.map(s=>({...s, question_count: counts[s.code]||0}));
    }catch(e){
      console.warn('Không tải được số câu từng môn:', e);
      return subjects;
    }
  }
  async function getSubjects(){ const supa=c(); if(!supa||!logged()) return fallbackSubjects(); const {data,error}=await supa.from('subjects').select('*').eq('is_active', true).order('sort_order',{ascending:true}).order('code',{ascending:true}); if(error || !data || !data.length){ console.warn(error||'No subjects'); showErr('Không tải được danh sách môn học. Đang dùng môn mặc định.'); return fallbackSubjects(); } return await addQuestionCounts(data); }
  function card(s){
    const code = esc2(s.code || '');
    const name = esc2(s.name || s.code || 'Chưa có tên môn');
    const desc = esc2(s.description || 'Môn học chưa có mô tả.');
    const rawCount = Number(s.question_count ?? s.questions_count ?? s.count);
    const countText = Number.isFinite(rawCount) ? `${rawCount} câu` : '— câu';
    const status = s.is_active===false ? 'Tạm ẩn' : countText;
    const chosen = pickedCode===s.code;
    return `<button class="subjectCard ${chosen?'active':''}" data-code="${code}" type="button" title="${code} - ${name} - ${countText}">
      <span class="subjectCardCode"><span>${code}</span></span>
      <span class="subjectCardTitle">${name}</span>
      <span class="subjectCardDesc">${desc}</span>
      <span class="subjectMeta">
        <span>${status}</span>
        <span class="subjectChoose">${chosen?'Đã chọn':'Chọn môn'}</span>
      </span>
    </button>`;
  }
  function applyPicked(){
    if($('subjectPickedText')) $('subjectPickedText').textContent=pickedCode?label(pickedCode):'Chưa chọn môn';
    if($('subjectEnter')) $('subjectEnter').disabled=!pickedCode;
    document.querySelectorAll('.subjectCard').forEach(x=>{
      const active = x.dataset.code === pickedCode;
      x.classList.toggle('active', active);
      x.setAttribute('aria-pressed', active ? 'true' : 'false');
      const choose = x.querySelector('.subjectChoose');
      if(choose) choose.textContent = active ? 'Đã chọn' : 'Chọn môn';
    });
  }
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
  function bind(){
    ensureChip();
    ensureChangeBtn();
    patchSubmit();
    patchSave();
    patchSignOut();
    syncSubjectTexts();
    $('subjectRefresh')?.addEventListener('click', refreshSubjects);
    $('subjectSearch')?.addEventListener('input', renderSubjects);
    $('subjectEnter')?.addEventListener('click', enterSubject);
    $('subjectLogout')?.addEventListener('click', logoutGate);

    // Bỏ tự kiểm tra/tự tải môn học liên tục.
    // Chỉ tải môn đã chọn 1 lần khi mở web. Danh sách môn chỉ tải khi người dùng mở bảng chọn môn hoặc bấm Tải lại.
    let checkedOnce = false;
    const runSubjectCheckOnce = () => {
      if (checkedOnce) return;
      if (!logged() || !isApproved()) return;
      checkedOnce = true;
      syncSubjectTexts();
      if (subjectCode()) loadBySubject(subjectCode());
      else openGate();
    };

    runSubjectCheckOnce();
    setTimeout(runSubjectCheckOnce, 800);
    setTimeout(runSubjectCheckOnce, 2000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====


// ===== ADD_SUBJECT_FEATURE_20260625 (UPGRADED TAB UX/UI) =====
(function(){
  const HUB_URL='https://bdbkpqnhavyoalgkvqtw.supabase.co';
  const HUB_KEY='sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB';
  const $=id=>document.getElementById(id);
  let supa=null;
  function client(){ if(!window.supabase) return null; if(!supa) supa=window.supabase.createClient(HUB_URL,HUB_KEY); return supa; }
  function esc2(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]))}

  function isLoggedIn(){
    return !!window.HODSupabase?.getUser?.();
  }
  function isAdminOrEditor(){
    const p=window.HODSupabase?.getProfile?.()||null;
    const role=String(p?.role||'').toLowerCase();
    return isLoggedIn() && (role==='admin'||role==='editor') && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }
  function canAdd(){
    const p=window.HODSupabase?.getProfile?.()||null;
    return isLoggedIn() && !(p?.blocked||p?.is_blocked||p?.status==='blocked');
  }

  // Tiêm CSS động cho cấu trúc Tab mới trong bảng Chọn môn học
  function injectStyles() {
    if ($('subjectTabsStyle')) return;
    const style = document.createElement('style');
    style.id = 'subjectTabsStyle';
    style.textContent = `
      .subjectGateTabs {
        display: flex;
        gap: 6px;
        margin: -5px 0 15px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 0;
      }
      .subjectGateTab {
        background: none;
        border: none;
        color: var(--mist, #a0aec0);
        padding: 10px 18px;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .subjectGateTab.active {
        color: var(--gold, #e8d4a8);
        border-bottom: 2px solid var(--gold, #e8d4a8);
      }
      .userAddSubjectWrap {
        animation: fadeInPane 0.25s ease-out;
        padding-top: 5px;
      }
      @keyframes fadeInPane {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Hàm chuyển đổi Tab thông minh chuyên biệt
  window.__switchSubjectGateTab = function(mode) {
    const isAdd = mode === 'add';
    
    // Cập nhật trạng thái Active trên nút bấm Tab
    document.querySelectorAll('.subjectGateTab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sgtab === mode);
    });
    
    // Ẩn/Hiện toàn bộ các thành phần thuộc danh sách môn học cũ
    const listElements = [
      document.querySelector('.subjectGateSubline'),
      document.querySelector('.subjectGateTools'),
      $('subjectList'),
      $('subjectLoading'),
      $('subjectError'),
      $('subjectEmpty'),
      document.querySelector('.subjectGateFooter')
    ];
    
    listElements.forEach(el => {
      if (el) el.style.setProperty('display', isAdd ? 'none' : '', isAdd ? 'important' : '');
    });
    
    // Quản lý Pane nội dung Form thêm môn học
    const form = $('addSubjectForm');
    if (form) {
      form.classList.toggle('hidden', !isAdd);
      if (isAdd) {
        form.innerHTML = getAddSubjectHTML();
        parsedQuestions = [];
        $('addSubjectCode')?.addEventListener('input', function(){ this.value=this.value.toUpperCase().replace(/[^A-Z0-9_]/g,''); });
        $('userImportFile')?.addEventListener('change', handleFileImport);
      }
    }
  };

  // Khởi tạo thanh Tab điều hướng nằm dưới Header Chọn môn học
  function ensureSubjectGateTabs() {
    const panel = document.querySelector('.polishedSubjectPanel');
    const header = document.querySelector('.subjectGateHeader');
    if (!panel || !header || $('subjectGateTabsBar')) return;
    
    injectStyles();
    
    const tabsBar = document.createElement('div');
    tabsBar.id = 'subjectGateTabsBar';
    tabsBar.className = 'subjectGateTabs';
    tabsBar.innerHTML = `
      <button type="button" class="subjectGateTab active" data-sgtab="list">Danh sách môn học</button>
      <button type="button" class="subjectGateTab" id="subjectGateTabAdd" data-sgtab="add" style="display:none;">Thêm môn mới</button>
    `;
    
    header.insertAdjacentElement('afterend', tabsBar);
    
    tabsBar.querySelectorAll('.subjectGateTab').forEach(btn => {
      btn.onclick = () => window.__switchSubjectGateTab(btn.dataset.sgtab);
    });
  }

  function showAddBtn(){
    ensureSubjectGateTabs();
    const btn=$('addSubjectBtn');
    const tabBtn=$('subjectGateTabAdd');
    const allowed = canAdd();
    if(btn) btn.classList.toggle('hidden', !allowed);
    if(tabBtn) tabBtn.style.display = allowed ? 'block' : 'none';
  }

  const AI_PROMPT = `Bạn là trợ lý tạo ngân hàng câu hỏi trắc nghiệm. Đọc tài liệu tôi gửi và tạo câu hỏi trắc nghiệm theo đúng format bên dưới.

QUY TẮC BATCH (QUAN TRỌNG):
- Tạo TỐI ĐA số câu có thể trong MỖI lần trả lời (mục tiêu 40-50 câu/batch).
- Để tiết kiệm token: "answer_text" chỉ viết 1 dòng ngắn, KHÔNG giải thích dài.
- Nếu chưa hết tài liệu, DỪNG ở cuối batch và nói: "Gõ 'tiếp' để tôi tạo phần tiếp (câu X-Y)."
- Khi tôi gõ "tiếp", tiếp tục batch sau, đánh số "num" liên tục, CÙNG format.
- Mỗi batch là mảng JSON hoàn chỉnh, parse được độc lập.
- KHÔNG thêm text giải thích bên ngoài block JSON.

YÊU CẦU:
- 4 đáp án A-D (thêm E nếu cần). Đáp án đúng = chữ cái (VD: "A" hoặc "AC").
- Câu hỏi rõ ràng, chính xác theo tài liệu.
- "answer_text": giải thích TỐI ĐA 1 câu ngắn.
- "has_image": true/false — câu CẦN hình ảnh (biểu đồ, sơ đồ...) hay không.
- "error_risk": "low" | "medium" | "high"
- "error_risk_reason": lý do ngắn gọn (tối đa 10 từ).

FORMAT:
\`\`\`json
[
  {"num":1,"question":"...?","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","answer_text":"Giải thích ngắn","images":[],"has_image":false,"error_risk":"low","error_risk_reason":"Định nghĩa rõ ràng"}
]
\`\`\`

Bắt đầu ngay, tạo nhiều câu nhất có thể. Khi hết token thì dừng và nhắc tôi gõ "tiếp".`;

  window.__ADD_SUBJECT_AI_PROMPT = AI_PROMPT;
  let parsedQuestions = [];

  // MÃ MỚI: Giao diện form chia 3 bước (Stepper)
  function getAddSubjectHTML(){
    return `<div class="userAddSubjectWrap">
      <div class="subject-stepper" id="subjectStepper">
        <div class="step active" data-step="1"><span>1</span> Thông tin</div>
        <div class="step-line"></div>
        <div class="step" data-step="2"><span>2</span> Lấy Prompt</div>
        <div class="step-line"></div>
        <div class="step" data-step="3"><span>3</span> Import</div>
      </div>

      <div id="addStep1" class="add-step-content active">
        <div class="addSubjectFields">
          <div class="addSubjectField">
            <label>Mã môn <span class="req">*</span></label>
            <input id="addSubjectCode" type="text" placeholder="VD: ABC123" maxlength="20">
          </div>
          <div class="addSubjectField">
            <label>Tên môn <span class="req">*</span></label>
            <input id="addSubjectName" type="text" placeholder="VD: Tên môn học" maxlength="100">
          </div>
          <div class="addSubjectField full">
            <label>Mô tả ngắn</label>
            <textarea id="addSubjectDesc" placeholder="Mô tả môn học..." rows="2" maxlength="300"></textarea>
          </div>
        </div>
        <div class="step-actions right">
          <button class="primary" type="button" onclick="window.__switchStep(2)">Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep2" class="add-step-content">
        <div class="aiStepCard" style="margin-bottom:0;">
          <p>Copy prompt dưới đây và dán vào AI (Gemini/ChatGPT/Claude) kèm theo tài liệu môn học của bạn.</p>
        </div>
        
        <div class="aiPromptActions">
          <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
          <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
        </div>

        <div class="aiToolLinks" style="margin-bottom: 25px;">
          <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
          <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
          <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
        </div>

        <div class="step-actions">
          <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
          <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep3" class="add-step-content">
        <div class="importUnifiedBox">
          <div class="userFileInputWrap" id="importDropZone" onclick="document.getElementById('userImportFile').click()">
            <span class="icon">☁️</span>
            <p><b>Kéo thả file .md hoặc .txt vào đây</b><br><span style="font-size:0.85rem; opacity:0.6;">Hoặc bấm để chọn file từ máy</span></p>
            <input type="file" id="userImportFile" accept=".md,.txt,.json" style="display:none;">
          </div>

          <textarea id="userImportData" class="hiddenImportData" aria-hidden="true"></textarea>
          <div id="userImportFileCard" class="userImportFileCard hidden">
            <div class="fileIcon">📄</div>
            <div class="fileInfo">
              <b id="userImportFileName">Chưa chọn file</b>
              <span id="userImportFileMeta">File import câu hỏi</span>
            </div>
            <button class="removeFileBtn" type="button" onclick="window.__clearUserImportFile()">Xóa file</button>
          </div>

          <div class="step-actions importStepActions">
            <button class="btn" type="button" onclick="window.__switchStep(2)">⬅ Quay lại</button>
            <div>
              <button class="btn previewImportBtn hidden" type="button" id="previewImportBtn" onclick="window.__previewUserImport()">Xem trước</button>
              <button class="primary" type="button" id="userImportBtn" onclick="window.__submitSubjectRequest()" disabled>Lưu Môn Học</button>
            </div>
          </div>
        </div>
      </div>
      
      ${!isAdminOrEditor() ? '<div class="userApprovalNote" style="margin-top:15px;">⏳ Yêu cầu sẽ được gửi cho admin duyệt trước.</div>' : ''}
    </div>`;
  }

  // Logic chuyển bước & Khởi tạo tính năng kéo thả
  window.__switchStep = function(step) {
    // Ẩn tất cả các bước
    document.querySelectorAll('.add-step-content').forEach(el => el.classList.remove('active'));
    // Hiện bước hiện tại
    const target = document.getElementById('addStep' + step);
    if(target) target.classList.add('active');
    
    // Đổi màu thanh tiến trình
    document.querySelectorAll('.subject-stepper .step').forEach(el => {
      const s = parseInt(el.getAttribute('data-step'));
      if(s <= step) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Kích hoạt tính năng kéo thả file ở Bước 3
    if(step === 3 && !window._dropZoneInit) {
      const dropZone = document.getElementById('importDropZone');
      const fileInput = document.getElementById('userImportFile');
      if(dropZone && fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
          dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(evt => {
          dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'), false);
        });
        ['dragleave', 'drop'].forEach(evt => {
          dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'), false);
        });
        dropZone.addEventListener('drop', e => {
          const dt = e.dataTransfer;
          if(dt.files && dt.files.length) {
            const one = new DataTransfer();
            one.items.add(dt.files[0]);
            fileInput.files = one.files;
            fileInput.dispatchEvent(new Event('change')); // Gọi hàm đọc file
          }
        }, false);
        window._dropZoneInit = true; // Đánh dấu đã khởi tạo
      }
    }
  };


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
      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if(dropZone) dropZone.classList.add('hidden');
      if(card) card.classList.remove('hidden');
      if(nameEl) nameEl.textContent = file.name;
      if(metaEl) metaEl.textContent = Math.max(1, Math.round(file.size/1024)) + ' KB · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if(pv){ pv.classList.remove('hidden'); pv.disabled = false; }
      const saveBtn = $('userImportBtn');
      if(saveBtn) saveBtn.disabled = true;
      parsedQuestions = [];
      notify('Đã đọc file ' + file.name + '. Bấm Xem trước để kiểm tra.');
    };
    reader.readAsText(file);
  }

  window.__previewUserImport = function(){
    const raw = ($('userImportData')?.value || '').trim();
    const btn = $('userImportBtn');
    if(!raw){ alert('Bạn hãy chọn file .md / .txt / .json trước.'); return; }

    let data;
    try {
      var jsonBlocks = raw.match(/```json\s*([\s\S]*?)```/g);
      if(jsonBlocks && jsonBlocks.length > 0){
        data = [];
        jsonBlocks.forEach(function(block){
          var cleaned = block.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          var parsed = JSON.parse(cleaned);
          if(Array.isArray(parsed)) data = data.concat(parsed);
          else if(parsed.questions && Array.isArray(parsed.questions)) data = data.concat(parsed.questions);
        });
      } else {
        var cleaned = raw;
        if(cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\w*\s*/, '').replace(/```\s*$/, '');
        data = JSON.parse(cleaned);
      }
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
    window.__previewSelections = {};
    const metaEl = $('userImportFileMeta');
    if(metaEl) metaEl.textContent = data.length + ' câu hỏi đã kiểm tra · Có thể lưu';
    if(btn) btn.disabled = false;
    window.__openImportPreviewModal(data);
    notify('OK! ' + data.length + ' câu hỏi sẵn sàng');
  };

  window.__closeImportPreviewModal = function(){
    document.getElementById('importPreviewModal')?.classList.add('hidden');
  };

  
window.__submitSubjectRequest = async function(){
    const code=($('addSubjectCode')?.value||'').trim().toUpperCase();
    const name=($('addSubjectName')?.value||'').trim();
    const desc=($('addSubjectDesc')?.value||'').trim();

    if(!code){ alert('Vui lòng nhập mã môn'); $('addSubjectCode')?.focus(); return; }
    if(!/^[A-Z0-9_]{2,20}$/.test(code)){ alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)'); $('addSubjectCode')?.focus(); return; }
    if(!name){ alert('Vui lòng nhập tên môn'); $('addSubjectName')?.focus(); return; }
    if(!parsedQuestions.length){ alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.'); return; }

    const c=client();
    if(!c){ alert('Chưa kết nối Supabase'); return; }

    const btn=$('userImportBtn');
    if(btn){ btn.disabled=true; btn.textContent='Đang lưu...'; }

    try{
      const {data:existing, error:exErr}=await c.from('subjects').select('code').eq('code',code).maybeSingle();
      if(exErr){ alert('Không kiểm tra được mã môn: '+exErr.message); return; }
      if(existing){ alert('Mã môn '+code+' đã tồn tại'); return; }

      let successMsg = '';
      if(isAdminOrEditor()){
        const maxOrder=await c.from('subjects').select('sort_order').order('sort_order',{ascending:false}).limit(1);
        const nextOrder=((maxOrder.data?.[0]?.sort_order)||0)+1;

        const {error}=await c.from('subjects').insert({
          code: code, name: name, description: desc || null,
          is_active: true, sort_order: nextOrder
        });
        if(error){ alert('Lỗi tạo môn: '+error.message); return; }

        let success=0, errors=0, firstErr='';
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
          if(r.error){ errors++; if(!firstErr) firstErr=r.error.message; }
          else success++;
        }
        successMsg = 'Đã thêm môn '+code+' với '+success+' câu hỏi'+(errors?' ('+errors+' lỗi: '+firstErr+')':'');
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
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
        if(error){ alert('Lỗi gửi yêu cầu: '+error.message); return; }
        successMsg = 'Đã gửi yêu cầu thêm môn '+code+'. Vui lòng chờ admin duyệt.';
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
      }

      parsedQuestions = [];
      document.getElementById('importPreviewModal')?.classList.add('hidden');
    } catch(e){
      console.warn('Add subject error:', e);
      alert('Lỗi khi lưu môn học: ' + (e?.message || e));
      notify('Lỗi khi lưu môn học');
    } finally {
      if(btn){ btn.disabled=false; btn.textContent='Lưu Môn Học'; }
    }
  };

  
  window.__closeAddSubject = function(){ 
    window.__switchSubjectGateTab('list'); 
  };

  function bind(){
    $('addSubjectBtn')?.addEventListener('click', ()=>window.__switchSubjectGateTab('add'));
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


// ===== FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625 =====
(function(){
  function escPrompt(s){
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getPromptText(){
    return window.__ADD_SUBJECT_AI_PROMPT || window.AI_PROMPT || document.getElementById('userAiPromptText')?.textContent || '';
  }
  window.__openUserAIPromptModal = function(){
    const prompt = getPromptText();
    let modal = document.getElementById('userPromptModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'userPromptModal';
      modal.className = 'modal userPromptModal hidden';
      modal.innerHTML = `<div class="box userPromptModalBox">
        <button class="modalX" type="button" id="userPromptModalClose">×</button>
        <div class="userPromptModalHead">
          <div>
            <span class="userPromptLabel">PROMPT TẠO CÂU HỎI</span>
            <h2>Xem prompt</h2>
            <p>Copy prompt này rồi dán vào Gemini / ChatGPT / Claude kèm tài liệu môn học.</p>
          </div>
          <button class="primary userPromptCopyTop" type="button" id="userPromptModalCopy">📋 Sao chép</button>
        </div>
        <pre class="userPromptModalPre" id="userPromptModalPre"></pre>
      </div>`;
      modal.addEventListener('mousedown', e => { if(e.target === modal) window.__closeUserAIPromptModal(); });
      document.body.appendChild(modal);
      document.getElementById('userPromptModalClose')?.addEventListener('click', window.__closeUserAIPromptModal);
      document.getElementById('userPromptModalCopy')?.addEventListener('click', window.__copyUserAIPrompt);
    }
    const pre = document.getElementById('userPromptModalPre');
    if(pre) pre.textContent = prompt;
    modal.classList.remove('hidden');
  };
  window.__closeUserAIPromptModal = function(){
    document.getElementById('userPromptModal')?.classList.add('hidden');
  };
  window.__copyUserAIPrompt = function(){
    const prompt = getPromptText();
    const done = () => {
      const btn = document.getElementById('btnCopyPrompt');
      if(btn){
        const oldText = btn.innerHTML;
        btn.innerHTML = '✅ Đã copy';
        setTimeout(() => { btn.innerHTML = oldText; }, 1800);
      }
      if(typeof notify === 'function') notify('Đã copy prompt!');
    };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(prompt).then(done).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      });
    }else{
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    }
  };
  document.addEventListener('click', function(e){
    const viewBtn = e.target.closest && e.target.closest('#btnViewPrompt,.aiViewPromptBtn');
    if(viewBtn){
      e.preventDefault();
      e.stopPropagation();
      window.__openUserAIPromptModal();
      return;
    }
    const copyBtn = e.target.closest && e.target.closest('#btnCopyPrompt');
    if(copyBtn){
      e.preventDefault();
      e.stopPropagation();
      window.__copyUserAIPrompt();
    }
  }, true);
})();

// ===== FIX_DELETE_IMPORT_FILE_20260625 =====
// Sửa nút "Xóa file" trong bước Import môn học.
(function(){
  function $(id){ return document.getElementById(id); }
  function notifySafe(msg){
    if(typeof notify === 'function') notify(msg);
    else console.log(msg);
  }
  window.__clearUserImportFile = function(){
    const fileInput = $('userImportFile');
    const hiddenData = $('userImportData');
    const dropZone = $('importDropZone');
    const fileCard = $('userImportFileCard');
    const fileName = $('userImportFileName');
    const fileMeta = $('userImportFileMeta');
    const previewBtn = $('previewImportBtn');
    const saveBtn = $('userImportBtn');

    if(fileInput) fileInput.value = '';
    if(hiddenData) hiddenData.value = '';
    if(dropZone) dropZone.classList.remove('hidden');
    if(fileCard) fileCard.classList.add('hidden');
    if(fileName) fileName.textContent = 'Chưa chọn file';
    if(fileMeta) fileMeta.textContent = 'File import câu hỏi';
    if(previewBtn){
      previewBtn.classList.add('hidden');
      previewBtn.disabled = true;
    }
    if(saveBtn) saveBtn.disabled = true;

    window.__previewSelections = {};
    try{ window.__closeImportPreviewModal?.(); }catch(e){}
    notifySafe('Đã xóa file import');
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest?.('.removeFileBtn');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    window.__clearUserImportFile();
  }, true);
})();

// ===== PROMPT_STEP_UX_UI_POLISH_20260625 =====
// Nâng cấp giao diện bước "Lấy Prompt" trong form thêm môn.
(function(){
  function $(id){ return document.getElementById(id); }
  function enhancePromptStep(){
    const step = $('addStep2');
    if(!step || step.dataset.promptPolished === '1') return;
    step.dataset.promptPolished = '1';
    step.classList.add('promptPolished');
    step.innerHTML = `
      <div class="promptStepGrid">
        <section class="promptMainCard">
          <div class="promptEyebrow">Bước 2 · Tạo file câu hỏi</div>
          <h3 class="promptMainTitle">Lấy prompt rồi đưa tài liệu cho AI</h3>
          <p class="promptMainDesc">Bấm sao chép prompt, dán vào AI bạn muốn dùng, sau đó gửi kèm tài liệu môn học. AI sẽ trả về file câu hỏi để import ở bước tiếp theo.</p>

          <div class="promptActionGrid">
            <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
            <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
          </div>

          <div class="promptMiniGuide">
            <div class="guideRow"><div class="guideNum">1</div><div><b>Copy prompt</b><span>Prompt đã có sẵn format JSON đúng cho hệ thống.</span></div></div>
            <div class="guideRow"><div class="guideNum">2</div><div><b>Dán vào AI + gửi tài liệu</b><span>Gửi PDF, Word, slide hoặc nội dung môn học cho AI.</span></div></div>
            <div class="guideRow"><div class="guideNum">3</div><div><b>Tải file .md / .txt</b><span>Sau khi AI tạo xong, qua bước Import để lưu môn học.</span></div></div>
          </div>
        </section>

        <aside class="promptSideCard">
          <div class="promptToolTitle">Chọn công cụ AI</div>
          <div class="promptToolGrid">
            <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
            <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
            <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
          </div>
          <div class="promptNoteBox">Mẹo: nếu tài liệu dài, hãy yêu cầu AI tạo từng phần rồi gộp lại thành một file JSON.</div>
        </aside>
      </div>

      <div class="step-actions">
        <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
        <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, tiếp tục ➔</button>
      </div>
    `;
  }
  const oldSwitch = window.__switchStep;
  window.__switchStep = function(step){
    if(typeof oldSwitch === 'function') oldSwitch.apply(this, arguments);
    setTimeout(()=>{ if(Number(step) === 2) enhancePromptStep(); }, 0);
  };
  document.addEventListener('click', function(e){
    const btn = e.target.closest?.('[onclick*="__switchStep(2)"]');
    if(btn) setTimeout(enhancePromptStep, 0);
  }, true);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(enhancePromptStep, 800));
})();

// ===== PROMPT_STEP_INSIDE_PANEL_FIX_20260625 =====
// Xóa nút "Sao chép prompt" bị trôi ra ngoài khung tab lớn.
(function(){
  function cleanStrayPromptButtons(){
    document.querySelectorAll('.subjectGate .polishedSubjectPanel > .aiCopyBtn, .subjectGate .polishedSubjectPanel > #btnCopyPrompt, .subjectGate > .aiCopyBtn, .subjectGate > #btnCopyPrompt').forEach(btn=>{
      if(!btn.closest('#addStep2')) btn.remove();
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    cleanStrayPromptButtons();
    setTimeout(cleanStrayPromptButtons,300);
    setTimeout(cleanStrayPromptButtons,1000);
  });
  document.addEventListener('click',()=>setTimeout(cleanStrayPromptButtons,0),true);
})();

// ===== REMOVE_PROMPT_GUIDE_ROWS_20260625 =====
// Bỏ 3 dòng hướng dẫn trong bước Lấy Prompt.
(function(){
  function removePromptGuideRows(){
    document.querySelectorAll('#addStep2 .promptMiniGuide').forEach(el => el.remove());
  }
  document.addEventListener('DOMContentLoaded', () => {
    removePromptGuideRows();
    setTimeout(removePromptGuideRows, 300);
    setTimeout(removePromptGuideRows, 1000);
  });
  document.addEventListener('click', () => setTimeout(removePromptGuideRows, 0), true);
})();

// ===== FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625 =====
// Sửa modal "Xem prompt" để không ảnh hưởng khung lớn + bỏ ô mẹo.
(function(){
  function cleanPromptTip(){
    document.querySelectorAll('#addStep2 .promptNoteBox, .promptNoteBox').forEach(el => el.remove());
  }
  function patchPromptModal(){
    const modal = document.getElementById('userPromptModal');
    if(!modal) return;
    modal.classList.remove('modal');
    modal.classList.add('userPromptModal');
    const box = modal.querySelector('.userPromptModalBox');
    if(box) box.classList.remove('box');
  }
  const oldOpen = window.__openUserAIPromptModal;
  window.__openUserAIPromptModal = function(){
    if(typeof oldOpen === 'function') oldOpen.apply(this, arguments);
    setTimeout(()=>{ patchPromptModal(); cleanPromptTip(); }, 0);
  };
  document.addEventListener('DOMContentLoaded',()=>{
    cleanPromptTip();
    patchPromptModal();
    setTimeout(()=>{ cleanPromptTip(); patchPromptModal(); },300);
    setTimeout(()=>{ cleanPromptTip(); patchPromptModal(); },1000);
  });
  document.addEventListener('click',()=>setTimeout(()=>{ cleanPromptTip(); patchPromptModal(); },0),true);
})();


// ===== IMPORT_PREVIEW_INLINE_EDIT_20260625 =====
// Sửa trực tiếp ngay trên card xem trước, không mở modal riêng.
(function(){
  function escHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getPreviewData(data){
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    return arr;
  }
  function opt(q,k){ return q?.options?.[k] || ''; }
  window.__previewQualityFilter = 'all';

  function autoDetectQuality(q){
    const hasImg = !!(q.has_image || (q.images && q.images.length > 0));
    let risk = q.error_risk || '';
    let reason = q.error_risk_reason || '';
    if(!risk){
      if(hasImg && (!q.images || !q.images.length || q.images.some(im => {
        const src = typeof im === 'string' ? im : (im.src || im.url || '');
        return !src || src.includes('URL_') || src.includes('MÔ_TẢ');
      }))){
        risk = 'high'; reason = reason || 'Câu cần hình ảnh nhưng chưa có ảnh thực tế';
      } else if(String(q.answer||'').length > 1){
        risk = 'medium'; reason = reason || 'Câu có nhiều đáp án đúng, cần kiểm tra kỹ';
      } else { risk = 'low'; }
    }
    q.has_image = hasImg;
    q.error_risk = risk;
    q.error_risk_reason = reason;
  }
  function riskLabel(r){ return {low:'Thấp',medium:'Trung bình',high:'Cao'}[r]||r; }
  function riskColor(r){ return {low:'#27ae60',medium:'#f39c12',high:'#e74c3c'}[r]||'#999'; }

  function renderQualityStats(data){
    var stats = document.getElementById('importPreviewStats');
    if(!stats) return;
    var imgCount = data.filter(function(q){ return q.has_image; }).length;
    var highCount = data.filter(function(q){ return q.error_risk === 'high'; }).length;
    var medCount = data.filter(function(q){ return q.error_risk === 'medium'; }).length;
    var lowCount = data.filter(function(q){ return q.error_risk === 'low'; }).length;
    var f = window.__previewQualityFilter;
    stats.textContent = '';
    var statRow = document.createElement('div');
    statRow.className = 'previewStatRow';
    var statItems = [
      {text: data.length + ' câu', color: ''},
      {text: imgCount + ' có ảnh', color: '#3498db'},
      {text: highCount + ' rủi ro cao', color: '#e74c3c'},
      {text: medCount + ' trung bình', color: '#f39c12'},
      {text: lowCount + ' thấp', color: '#27ae60'}
    ];
    statItems.forEach(function(item){
      var span = document.createElement('span');
      span.className = 'previewStatItem';
      span.textContent = item.text;
      if(item.color) span.style.color = item.color;
      statRow.appendChild(span);
    });
    var filterRow = document.createElement('div');
    filterRow.className = 'previewFilterRow';
    var filters = [
      {key: 'all', label: 'Tất cả', border: ''},
      {key: 'has_image', label: '📷 Có ảnh', border: ''},
      {key: 'high', label: 'Rủi ro cao', border: '#e74c3c'},
      {key: 'medium', label: 'Trung bình', border: '#f39c12'},
      {key: 'low', label: 'Thấp', border: '#27ae60'}
    ];
    filters.forEach(function(fl){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'previewFilterBtn' + (f === fl.key ? ' active' : '');
      btn.textContent = fl.label;
      if(fl.border) btn.style.borderColor = fl.border;
      btn.addEventListener('click', function(){ window.__setQualityFilter(fl.key); });
      filterRow.appendChild(btn);
    });
    stats.appendChild(statRow);
    stats.appendChild(filterRow);
  }

  window.__setQualityFilter = function(f){
    window.__previewQualityFilter = f;
    const data = getPreviewData();
    renderQualityStats(data);
    renderQualityList(data);
  };

  window.__toggleQualityImage = function(i, val){
    const data = getPreviewData();
    if(data[i]){ data[i].has_image = val; renderQualityStats(data); }
  };

  window.__setQualityRisk = function(i, val){
    const data = getPreviewData();
    if(data[i]){
      data[i].error_risk = val;
      renderQualityStats(data);
      const card = document.querySelector(`[data-pcard=”${i}”]`);
      if(card){
        card.style.borderLeftColor = riskColor(val);
        card.style.background = {low:'rgba(39,174,96,0.08)',medium:'rgba(243,156,18,0.08)',high:'rgba(231,76,60,0.08)'}[val]||'';
        const badge = card.querySelector('.riskBadge');
        if(badge){ badge.style.background = riskColor(val); badge.textContent = riskLabel(val); }
      }
    }
  };

  function renderQualityList(data){
    var list = document.getElementById('importPreviewList');
    if(!list) return;
    var f = window.__previewQualityFilter;
    var filtered = data.filter(function(q){
      if(f==='all') return true;
      if(f==='has_image') return q.has_image;
      return q.error_risk === f;
    });
    list.textContent = '';
    if(!filtered.length){
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:30px;opacity:.6';
      empty.textContent = 'Không có câu hỏi nào phù hợp bộ lọc.';
      list.appendChild(empty);
      return;
    }
    filtered.forEach(function(q){
      var i = data.indexOf(q);
      list.appendChild(buildCard(q, i));
    });
  }

  function renderPreviewInline(data){
    data = getPreviewData(data);
    data.forEach(autoDetectQuality);
    window.__previewQualityFilter = 'all';
    let modal = document.getElementById('importPreviewModal');
    if(modal){ modal.remove(); modal = null; }
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal importPreviewModal';
    var box = document.createElement('div');
    box.className = 'box importPreviewModalBox';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'modalX';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.onclick = function(){ window.__closeImportPreviewModal(); };
    var head = document.createElement('div');
    head.className = 'importPreviewHead';
    var headLeft = document.createElement('div');
    var label = document.createElement('span');
    label.className = 'importPreviewLabel';
    label.textContent = 'XEM TRƯỚC IMPORT';
    var h2 = document.createElement('h2');
    h2.textContent = 'Kiểm tra câu hỏi';
    var desc = document.createElement('p');
    desc.textContent = 'Đáp án đúng đã hiển thị sẵn. Đánh dấu câu có ảnh và mức rủi ro, bấm “Sửa” để chỉnh nội dung.';
    headLeft.appendChild(label);
    headLeft.appendChild(h2);
    headLeft.appendChild(desc);
    var saveBtn = document.createElement('button');
    saveBtn.className = 'primary importPreviewSaveTop';
    saveBtn.type = 'button';
    saveBtn.textContent = 'Lưu Môn Học';
    saveBtn.onclick = function(){ window.__closeImportPreviewModal(); window.__submitSubjectRequest(); };
    head.appendChild(headLeft);
    head.appendChild(saveBtn);
    var stats = document.createElement('div');
    stats.id = 'importPreviewStats';
    stats.className = 'importPreviewStats';
    var list = document.createElement('div');
    list.id = 'importPreviewList';
    list.className = 'importPreviewList';
    box.appendChild(closeBtn);
    box.appendChild(head);
    box.appendChild(stats);
    box.appendChild(list);
    modal.appendChild(box);
    modal.addEventListener('mousedown', function(e){ if(e.target === modal) window.__closeImportPreviewModal(); });
    document.body.appendChild(modal);
    renderQualityStats(data);
    renderQualityList(data);
    modal.classList.remove('hidden');
  }
  function buildCard(q, i){
    var answer = String(q.answer || '').toUpperCase();
    var risk = q.error_risk || 'low';
    var riskBg = {low:'rgba(39,174,96,0.08)',medium:'rgba(243,156,18,0.08)',high:'rgba(231,76,60,0.08)'}[risk]||'';
    var card = document.createElement('article');
    card.className = 'previewQuestionCard';
    card.dataset.pcard = i;
    card.style.borderLeft = '4px solid ' + riskColor(risk);
    card.style.background = riskBg;
    // Header
    var top = document.createElement('div');
    top.className = 'previewQuestionTop';
    var numB = document.createElement('b');
    numB.textContent = 'Câu ' + (q.num || (i+1));
    var actions = document.createElement('div');
    actions.className = 'previewTopActions';
    if(q.has_image){
      var imgBadge = document.createElement('span');
      imgBadge.className = 'previewBadge imgBadge';
      imgBadge.textContent = '📷 Có ảnh';
      actions.appendChild(imgBadge);
    }
    var rBadge = document.createElement('span');
    rBadge.className = 'previewBadge riskBadge';
    rBadge.style.background = riskColor(risk);
    rBadge.style.color = '#fff';
    rBadge.textContent = riskLabel(risk);
    actions.appendChild(rBadge);
    var ansBadge = document.createElement('span');
    ansBadge.className = 'previewAnswerBadge';
    ansBadge.textContent = 'Đáp án: ' + (answer || '?');
    actions.appendChild(ansBadge);
    var editBtn = document.createElement('button');
    editBtn.className = 'previewEditBtn';
    editBtn.type = 'button';
    editBtn.textContent = 'Sửa';
    editBtn.addEventListener('click', function(){ window.__editImportPreviewQuestion(i); });
    actions.appendChild(editBtn);
    top.appendChild(numB);
    top.appendChild(actions);
    card.appendChild(top);
    // Risk reason
    if(q.error_risk_reason){
      var reasonDiv = document.createElement('div');
      reasonDiv.className = 'previewRiskReason';
      reasonDiv.textContent = '⚠ ' + q.error_risk_reason;
      card.appendChild(reasonDiv);
    }
    // Question text
    var qText = document.createElement('div');
    qText.className = 'previewQuestionText';
    qText.textContent = q.question || '';
    card.appendChild(qText);
    // Images area (always show for upload)
    var imgArea = document.createElement('div');
    imgArea.className = 'previewImgArea';
    imgArea.dataset.imgIdx = i;
    function renderImgThumbs(){
      imgArea.textContent = '';
      var imgs = q.images || [];
      if(imgs.length){
        var thumbRow = document.createElement('div');
        thumbRow.className = 'previewQuestionImages';
        imgs.forEach(function(im, idx){
          var src = typeof im === 'string' ? im : (im.src || im.url || '');
          if(!src) return;
          var wrap = document.createElement('div');
          wrap.className = 'previewImgThumb';
          var img = document.createElement('img');
          img.src = src;
          img.alt = 'Ảnh ' + (idx+1);
          img.loading = 'lazy';
          var rmBtn = document.createElement('button');
          rmBtn.className = 'previewImgRm';
          rmBtn.type = 'button';
          rmBtn.textContent = '×';
          rmBtn.addEventListener('click', function(){
            q.images.splice(idx, 1);
            renderImgThumbs();
            renderQualityStats(getPreviewData());
          });
          wrap.appendChild(rmBtn);
          wrap.appendChild(img);
          thumbRow.appendChild(wrap);
        });
        imgArea.appendChild(thumbRow);
      }
      var uploadRow = document.createElement('div');
      uploadRow.className = 'previewImgUploadRow';
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.className = 'previewImgFileInput';
      fileInput.addEventListener('change', function(e){
        var files = e.target.files || [];
        Array.prototype.forEach.call(files, function(file){
          var fr = new FileReader();
          fr.onload = function(){
            if(!q.images) q.images = [];
            q.images.push({id:'prev_'+Date.now()+'_'+Math.random().toString(16).slice(2), src:fr.result, source:'user-upload', name:file.name});
            if(!q.has_image){ q.has_image = true; }
            renderImgThumbs();
            renderQualityStats(getPreviewData());
          };
          fr.readAsDataURL(file);
        });
        e.target.value = '';
      });
      var uploadBtn = document.createElement('button');
      uploadBtn.className = 'previewImgUploadBtn';
      uploadBtn.type = 'button';
      uploadBtn.textContent = '📷 Thêm ảnh';
      uploadBtn.addEventListener('click', function(){ fileInput.click(); });
      uploadRow.appendChild(fileInput);
      uploadRow.appendChild(uploadBtn);
      if(q.images && q.images.length){
        var countSpan = document.createElement('span');
        countSpan.className = 'previewImgCount';
        countSpan.textContent = q.images.length + ' ảnh';
        uploadRow.appendChild(countSpan);
      }
      imgArea.appendChild(uploadRow);
    }
    renderImgThumbs();
    card.appendChild(imgArea);
    // Options grid
    var grid = document.createElement('div');
    grid.className = 'previewAnswerGrid';
    Object.entries(q.options || {}).forEach(function(entry){
      var k = entry[0], v = entry[1];
      var key = String(k).toUpperCase();
      var isCorrect = answer.includes(key);
      var optDiv = document.createElement('div');
      optDiv.className = 'previewAnswerOption' + (isCorrect ? ' correct' : '');
      optDiv.dataset.pi = i;
      optDiv.dataset.k = key;
      var b = document.createElement('b');
      b.textContent = key;
      var s = document.createElement('span');
      s.textContent = v;
      optDiv.appendChild(b);
      optDiv.appendChild(s);
      grid.appendChild(optDiv);
    });
    card.appendChild(grid);
    // Quality controls
    var controls = document.createElement('div');
    controls.className = 'previewQualityControls';
    var toggleLabel = document.createElement('label');
    toggleLabel.className = 'previewToggle';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!q.has_image;
    cb.addEventListener('change', function(){ window.__toggleQualityImage(i, this.checked); });
    var cbText = document.createElement('span');
    cbText.textContent = 'Có ảnh';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(cbText);
    var riskDiv = document.createElement('div');
    riskDiv.className = 'previewRiskSelect';
    var riskSpan = document.createElement('span');
    riskSpan.textContent = 'Rủi ro:';
    var sel = document.createElement('select');
    ['low','medium','high'].forEach(function(val){
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = {low:'Thấp',medium:'Trung bình',high:'Cao'}[val];
      if(risk === val) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function(){ window.__setQualityRisk(i, this.value); });
    riskDiv.appendChild(riskSpan);
    riskDiv.appendChild(sel);
    controls.appendChild(toggleLabel);
    controls.appendChild(riskDiv);
    card.appendChild(controls);
    return card;
  }
  window.__openImportPreviewModal = renderPreviewInline;
})();


// ===== FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625 =====
// Sửa tại chỗ trên đúng layout card hiện tại, không thay card thành form nên không bị co/bung.
(function(){
  const LETTERS = ['A','B','C','D','E','F','G'];
  function escHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getData(){ return window.__previewImportData || []; }
  function optionKeys(q){
    const keys = Object.keys(q?.options || {}).map(k => String(k).toUpperCase());
    return LETTERS.filter(k => keys.includes(k));
  }
  function nextKey(keys){ return LETTERS.find(k => !keys.includes(k)); }
  function markCorrect(card, answer){
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      opt.classList.toggle('correct', answer.includes(k));
    });
  }
  function refreshCardOnly(i){
    const q = getData()[i];
    if(!q) return;
    const open = window.__openImportPreviewModal;
    if(typeof open === 'function'){
      // render lại toàn preview để đồng bộ, nhưng giữ đúng layout xem
      open(getData());
    }
  }

  window.__editImportPreviewQuestion = function(i){
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if(!q || !card) return;
    if(card.classList.contains('inlineEditing')) return;

    card.dataset.backupHtml = card.innerHTML;
    card.classList.add('inlineEditing');

    const questionEl = card.querySelector('.previewQuestionText');
    if(questionEl){
      questionEl.setAttribute('contenteditable','true');
      questionEl.dataset.field = 'question';
    }

    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const span = opt.querySelector('span');
      if(span){
        span.setAttribute('contenteditable','true');
        span.dataset.optText = opt.dataset.k || '';
      }
    });

    const badge = card.querySelector('.previewAnswerBadge');
    if(badge){
      badge.innerHTML = `Đáp án đúng: <input class="inlineCorrectInput" value="${escHtml(String(q.answer || '').toUpperCase())}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">`;
      const input = badge.querySelector('input');
      input?.addEventListener('input', () => markCorrect(card, String(input.value || '').toUpperCase()));
    }

    const grid = card.querySelector('.previewAnswerGrid');
    if(grid && !card.querySelector('.inlineAddOptionMini')){
      grid.insertAdjacentHTML('afterend', `<button class="inlineAddOptionMini" type="button" title="Thêm đáp án" onclick="window.__inlineAddPreviewOption(${i})">+</button>`);
    }
    if(!card.querySelector('.inlineEditActionsMini')){
      card.insertAdjacentHTML('beforeend', `<div class="inlineEditActionsMini"><button class="btn" type="button" onclick="window.__cancelInlineKeepEdit(${i})">Hủy</button><button class="primary" type="button" onclick="window.__saveInlineKeepEdit(${i})">Lưu sửa</button></div>`);
    }
    questionEl?.focus();
  };

  window.__inlineAddPreviewOption = function(i){
    const card = document.querySelector(`[data-pcard="${i}"]`);
    const grid = card?.querySelector('.previewAnswerGrid');
    if(!card || !grid) return;
    const keys = Array.from(grid.querySelectorAll('.previewAnswerOption')).map(x => String(x.dataset.k || '').toUpperCase());
    const k = nextKey(keys);
    if(!k) return alert('Đã đủ số lựa chọn.');
    grid.insertAdjacentHTML('beforeend', `<div class="previewAnswerOption" data-pi="${i}" data-k="${k}"><b>${k}</b><span contenteditable="true" data-opt-text="${k}"></span></div>`);
    grid.querySelector(`[data-k="${k}"] span`)?.focus();
  };

  window.__cancelInlineKeepEdit = function(i){
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if(!card) return;
    card.innerHTML = card.dataset.backupHtml || card.innerHTML;
    card.classList.remove('inlineEditing');
    delete card.dataset.backupHtml;
  };

  window.__saveInlineKeepEdit = function(i){
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if(!q || !card) return;

    const question = (card.querySelector('.previewQuestionText')?.textContent || '').trim();
    const answer = (card.querySelector('.inlineCorrectInput')?.value || '').trim().toUpperCase();
    if(!question) return alert('Câu hỏi không được để trống.');
    if(!answer) return alert('Đáp án đúng không được để trống.');

    const options = {};
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      const v = (opt.querySelector('span')?.textContent || '').trim();
      if(k && v) options[k] = v;
    });
    if(!Object.keys(options).length) return alert('Cần có ít nhất một đáp án lựa chọn.');

    q.question = question;
    q.options = options;
    q.answer = answer;
    refreshCardOnly(i);
    if(typeof notify === 'function') notify('Đã cập nhật câu hỏi');
  };
})();

// ===== INLINE_DELETE_OPTION_20260625 =====
// Thêm nút xóa từng đáp án khi sửa trực tiếp trong Xem trước import.
(function(){
  function ensureDeleteButtons(card){
    if(!card) return;
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      if(opt.querySelector('.inlineDeleteOptionBtn')) return;
      const k = opt.dataset.k || '';
      opt.insertAdjacentHTML('beforeend', `<button class="inlineDeleteOptionBtn" type="button" title="Xóa đáp án ${k}" onclick="window.__deleteInlinePreviewOption(this)">×</button>`);
    });
  }
  window.__deleteInlinePreviewOption = function(btn){
    const opt = btn?.closest?.('.previewAnswerOption');
    const card = btn?.closest?.('.previewQuestionCard');
    if(!opt || !card) return;
    const count = card.querySelectorAll('.previewAnswerOption').length;
    if(count <= 1) return alert('Phải còn ít nhất 1 đáp án.');
    const k = String(opt.dataset.k || '').toUpperCase();
    const input = card.querySelector('.inlineCorrectInput');
    if(input && k){
      input.value = String(input.value || '').toUpperCase().replaceAll(k, '');
      card.querySelectorAll('.previewAnswerOption').forEach(o => {
        const ok = String(input.value || '').includes(String(o.dataset.k || '').toUpperCase());
        o.classList.toggle('correct', ok);
      });
    }
    opt.remove();
  };

  const oldEdit = window.__editImportPreviewQuestion;
  window.__editImportPreviewQuestion = function(i){
    if(typeof oldEdit === 'function') oldEdit.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };

  const oldAdd = window.__inlineAddPreviewOption;
  window.__inlineAddPreviewOption = function(i){
    if(typeof oldAdd === 'function') oldAdd.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };
})();


// ===== IMPORT PREVIEW COMPACT UX PATCH 20260626 =====
(function(){
  const STORE='learninghub_import_preview_compact_v1';
  function applyCompact(modal, compact){
    if(!modal)return;
    modal.classList.toggle('compactMode',!!compact);
    const btn=modal.querySelector('.previewCompactToggle');
    if(btn){btn.classList.toggle('active',!!compact);btn.textContent=compact?'Chi tiết':'Danh sách nhanh';btn.title=compact?'Bấm để xem đầy đủ đáp án và công cụ':'Bấm để xem nhiều câu hơn';}
  }
  function enhanceImportPreview(){
    const modal=document.getElementById('importPreviewModal');
    if(!modal||modal.dataset.compactEnhanced==='1')return;
    const save=modal.querySelector('.importPreviewSaveTop');
    if(!save||!save.parentNode)return;
    modal.dataset.compactEnhanced='1';
    let compact=localStorage.getItem(STORE); compact=compact===null?true:compact==='1';
    const actions=document.createElement('div'); actions.className='importPreviewHeadActions';
    const toggle=document.createElement('button'); toggle.type='button'; toggle.className='previewCompactToggle';
    toggle.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();compact=!modal.classList.contains('compactMode');localStorage.setItem(STORE,compact?'1':'0');applyCompact(modal,compact);});
    save.parentNode.insertBefore(actions,save); actions.appendChild(toggle); actions.appendChild(save); applyCompact(modal,compact);
  }
  function start(){enhanceImportPreview(); if(window.MutationObserver&&document.body){new MutationObserver(enhanceImportPreview).observe(document.body,{childList:true,subtree:true});} setInterval(enhanceImportPreview,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();


// SIMPLE_IMPORT_PREVIEW_ANSWER_ONLY_FINAL_20260626
(function(){
  const LETTERS=['A','B','C','D','E','F','G','H'];
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getData(data){const arr=data||window.__previewImportData||[];window.__previewImportData=arr;return arr;}
  function normAns(q){return String(q?.answer||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function correctText(q){const ans=normAns(q);if(!ans)return 'Chưa có đáp án';return ans.split('').map(k=>k+'. '+(q.options?.[k]||'')).join(' | ');}
  function nextKey(opts){const used=new Set(Object.keys(opts||{}).map(k=>String(k).toUpperCase()));return LETTERS.find(k=>!used.has(k));}
  function renderCard(q,i){const ans=normAns(q)||'?';return `<article class="simplePreviewCard" data-simple-card="${i}"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num||i+1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question||'')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></article>`;}
  function renderEditCard(q,i){const opts=q.options||{};const optionRows=Object.keys(opts).sort().map(k=>`<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k]||'')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`).join('');return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num||i+1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question||'')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;}
  function renderList(data){const list=document.getElementById('simplePreviewList');if(list)list.innerHTML=data.map(renderCard).join('');}
  function openSimplePreview(data){data=getData(data);let modal=document.getElementById('importPreviewModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='importPreviewModal';modal.className='modal simpleImportPreviewModal';modal.innerHTML=`<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Bấm “Sửa” để chỉnh toàn bộ câu và các đáp án.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div class="simplePreviewCount">${data.length} câu hỏi</div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;document.body.appendChild(modal);renderList(data);}
  function saveEdit(i){const data=getData();const q=data[i];const card=document.querySelector(`[data-simple-card="${i}"]`);if(!q||!card)return;const question=(card.querySelector('[data-edit-question]')?.value||'').trim();const answer=(card.querySelector('[data-edit-answer]')?.value||'').trim().toUpperCase().replace(/[^A-Z]/g,'');if(!question)return alert('Câu hỏi không được để trống.');if(!answer)return alert('Đáp án đúng không được để trống.');const options={};card.querySelectorAll('[data-edit-opt]').forEach(inp=>{const k=String(inp.dataset.editOpt||'').toUpperCase();const v=(inp.value||'').trim();if(k&&v)options[k]=v;});if(!Object.keys(options).length)return alert('Cần ít nhất 1 đáp án.');for(const k of answer.split('')){if(!options[k])return alert('Đáp án đúng '+k+' chưa có nội dung.');}q.question=question;q.answer=answer;q.options=options;q.answer_text=answer.split('').map(k=>k+'. '+(options[k]||'')).join('; ');renderList(data);if(typeof notify==='function')notify('Đã lưu sửa câu '+(q.num||i+1));}
  document.addEventListener('click',function(e){if(e.target.closest('[data-simple-close]')){document.getElementById('importPreviewModal')?.classList.add('hidden');return;}if(e.target.closest('[data-simple-save]')){document.getElementById('importPreviewModal')?.classList.add('hidden');window.__submitSubjectRequest?.();return;}const edit=e.target.closest('[data-simple-edit]');if(edit){const i=+edit.dataset.simpleEdit;const data=getData();const card=document.querySelector(`[data-simple-card="${i}"]`);if(card&&data[i]){card.outerHTML=renderEditCard(data[i],i);document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();}return;}const cancel=e.target.closest('[data-cancel-simple]');if(cancel){renderList(getData());return;}const save=e.target.closest('[data-save-simple]');if(save){saveEdit(+save.dataset.saveSimple);return;}const add=e.target.closest('[data-add-opt]');if(add){const i=+add.dataset.addOpt;const data=getData();const q=data[i];const k=nextKey(q.options||{});if(!k)return alert('Đã đủ số đáp án.');q.options=q.options||{};q.options[k]='';const card=document.querySelector(`[data-simple-card="${i}"]`);if(card){card.outerHTML=renderEditCard(q,i);document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();}return;}const del=e.target.closest('[data-del-opt]');if(del){const card=del.closest('[data-simple-card]');const i=+(card?.dataset.simpleCard||0);const q=getData()[i];const k=del.dataset.delOpt;if(q?.options&&k){delete q.options[k];card.outerHTML=renderEditCard(q,i);}return;}});
  window.__openImportPreviewModal=openSimplePreview;
  window.__editImportPreviewQuestion=function(i){const data=getData();const card=document.querySelector(`[data-simple-card="${i}"]`);if(card&&data[i])card.outerHTML=renderEditCard(data[i],i);};
})();


// FILTERED_ANSWER_ONLY_PREVIEW_20260626
(function(){
  const LETTERS=['A','B','C','D','E','F','G','H'];
  let currentFilter='all';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getData(data){const arr=data||window.__previewImportData||[];window.__previewImportData=arr;arr.forEach(detect);return arr;}
  function normAns(q){return String(q?.answer||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function detect(q){
    q.has_image=!!(q.has_image||(q.images&&q.images.length));
    if(!q.error_risk) q.error_risk=normAns(q).length>1?'medium':'low';
    return q;
  }
  function correctText(q){const ans=normAns(q);if(!ans)return 'Chưa có đáp án';return ans.split('').map(k=>k+'. '+(q.options?.[k]||'')).join(' | ');}
  function riskColor(r){return {high:'#e74c3c',medium:'#f39c12',low:'#27ae60'}[r]||'#999';}
  function riskLabel(r){return {high:'Cao',medium:'Trung bình',low:'Thấp'}[r]||r;}
  function nextKey(opts){const used=new Set(Object.keys(opts||{}).map(k=>String(k).toUpperCase()));return LETTERS.find(k=>!used.has(k));}
  function pass(q){if(currentFilter==='all')return true;if(currentFilter==='has_image')return !!q.has_image;return q.error_risk===currentFilter;}
  function stat(data){return {total:data.length,img:data.filter(q=>q.has_image).length,high:data.filter(q=>q.error_risk==='high').length,medium:data.filter(q=>q.error_risk==='medium').length,low:data.filter(q=>q.error_risk==='low').length};}
  function renderStats(data){
    const s=stat(data); const box=document.getElementById('simplePreviewStats'); if(!box)return;
    const filters=[['all','Tất cả'],['has_image','📷 Có ảnh'],['high','Rủi ro cao'],['medium','Trung bình'],['low','Thấp']];
    box.innerHTML=`<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f=>`<button type="button" class="simpleFilterBtn ${currentFilter===f[0]?'active':''}" data-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
  }
  function renderCard(q,i){const ans=normAns(q)||'?';return `<article class="simplePreviewCard" data-simple-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num||i+1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question||'')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span>${q.has_image?'<span class="simplePreviewImgMark">📷</span>':''}<button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></div></article>`;}
  function renderEditCard(q,i){const opts=q.options||{};const optionRows=Object.keys(opts).sort().map(k=>`<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k]||'')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`).join('');return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num||i+1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question||'')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;}
  function renderList(data){const list=document.getElementById('simplePreviewList');if(!list)return;const filtered=data.map((q,i)=>({q,i})).filter(x=>pass(x.q));list.innerHTML=filtered.length?filtered.map(x=>renderCard(x.q,x.i)).join(''):'<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';renderStats(data);}
  function openSimplePreview(data){data=getData(data);let modal=document.getElementById('importPreviewModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='importPreviewModal';modal.className='modal simpleImportPreviewModal';modal.innerHTML=`<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Dùng bộ lọc để xem câu có ảnh hoặc câu dễ sai.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;document.body.appendChild(modal);renderList(data);}
  function saveEdit(i){const data=getData();const q=data[i];const card=document.querySelector(`[data-simple-card="${i}"]`);if(!q||!card)return;const question=(card.querySelector('[data-edit-question]')?.value||'').trim();const answer=(card.querySelector('[data-edit-answer]')?.value||'').trim().toUpperCase().replace(/[^A-Z]/g,'');if(!question)return alert('Câu hỏi không được để trống.');if(!answer)return alert('Đáp án đúng không được để trống.');const options={};card.querySelectorAll('[data-edit-opt]').forEach(inp=>{const k=String(inp.dataset.editOpt||'').toUpperCase();const v=(inp.value||'').trim();if(k&&v)options[k]=v;});if(!Object.keys(options).length)return alert('Cần ít nhất 1 đáp án.');for(const k of answer.split('')){if(!options[k])return alert('Đáp án đúng '+k+' chưa có nội dung.');}q.question=question;q.answer=answer;q.options=options;q.answer_text=answer.split('').map(k=>k+'. '+(options[k]||'')).join('; ');renderList(data);if(typeof notify==='function')notify('Đã lưu sửa câu '+(q.num||i+1));}
  document.addEventListener('click',function(e){const filter=e.target.closest('.simpleFilterBtn');if(filter){currentFilter=filter.dataset.filter||'all';renderList(getData());return;}if(e.target.closest('[data-simple-close]')){document.getElementById('importPreviewModal')?.classList.add('hidden');return;}if(e.target.closest('[data-simple-save]')){document.getElementById('importPreviewModal')?.classList.add('hidden');window.__submitSubjectRequest?.();return;}const edit=e.target.closest('[data-simple-edit]');if(edit){const i=+edit.dataset.simpleEdit;const data=getData();const card=document.querySelector(`[data-simple-card="${i}"]`);if(card&&data[i]){card.outerHTML=renderEditCard(data[i],i);document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();}return;}const cancel=e.target.closest('[data-cancel-simple]');if(cancel){renderList(getData());return;}const save=e.target.closest('[data-save-simple]');if(save){saveEdit(+save.dataset.saveSimple);return;}const add=e.target.closest('[data-add-opt]');if(add){const i=+add.dataset.addOpt;const data=getData();const q=data[i];const k=nextKey(q.options||{});if(!k)return alert('Đã đủ số đáp án.');q.options=q.options||{};q.options[k]='';const card=document.querySelector(`[data-simple-card="${i}"]`);if(card){card.outerHTML=renderEditCard(q,i);document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();}return;}const del=e.target.closest('[data-del-opt]');if(del){const card=del.closest('[data-simple-card]');const i=+(card?.dataset.simpleCard||0);const q=getData()[i];const k=del.dataset.delOpt;if(q?.options&&k){delete q.options[k];card.outerHTML=renderEditCard(q,i);}return;}});
  window.__openImportPreviewModal=openSimplePreview;
  window.__editImportPreviewQuestion=function(i){const data=getData();const card=document.querySelector(`[data-simple-card="${i}"]`);if(card&&data[i])card.outerHTML=renderEditCard(data[i],i);};
})();


// IMAGE_THUMB_PREVIEW_TOP_EDIT_ACTIONS_20260626
(function(){
  const LETTERS=['A','B','C','D','E','F','G','H'];
  let currentFilter='all';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getData(data){const arr=data||window.__previewImportData||[];window.__previewImportData=arr;arr.forEach(detect);return arr;}
  function normAns(q){return String(q?.answer||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function detect(q){q.images=q.images||[];q.has_image=!!(q.has_image||(q.images&&q.images.length));if(!q.error_risk)q.error_risk=normAns(q).length>1?'medium':'low';return q;}
  function correctText(q){const ans=normAns(q);if(!ans)return 'Chưa có đáp án';return ans.split('').map(k=>k+'. '+(q.options?.[k]||'')).join(' | ');}
  function riskColor(r){return {high:'#e74c3c',medium:'#f39c12',low:'#27ae60'}[r]||'#999';}
  function riskLabel(r){return {high:'Cao',medium:'Trung bình',low:'Thấp'}[r]||r;}
  function nextKey(opts){const used=new Set(Object.keys(opts||{}).map(k=>String(k).toUpperCase()));return LETTERS.find(k=>!used.has(k));}
  function imgSrc(im){return typeof im==='string'?im:(im?.src||im?.url||'');}
  function pass(q){if(currentFilter==='all')return true;if(currentFilter==='has_image')return !!q.has_image;return q.error_risk===currentFilter;}
  function stat(data){return {total:data.length,img:data.filter(q=>q.has_image).length,high:data.filter(q=>q.error_risk==='high').length,medium:data.filter(q=>q.error_risk==='medium').length,low:data.filter(q=>q.error_risk==='low').length};}
  function renderStats(data){const s=stat(data),box=document.getElementById('simplePreviewStats');if(!box)return;const filters=[['all','Tất cả'],['has_image','📷 Có ảnh'],['high','Rủi ro cao'],['medium','Trung bình'],['low','Thấp']];box.innerHTML=`<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f=>`<button type="button" class="imagePreviewFilterBtn ${currentFilter===f[0]?'active':''}" data-imgui-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;}
  function miniImages(q){const imgs=(q.images||[]).map(imgSrc).filter(Boolean);if(!imgs.length)return '<div class="imageMiniPreview"></div>';return `<div class="imageMiniPreview"><img src="${esc(imgs[0])}" alt="Ảnh preview">${imgs.length>1?`<span class="imageMiniCount">+${imgs.length-1}</span>`:''}</div>`;}
  function renderCard(q,i){const ans=normAns(q)||'?';return `<article class="simplePreviewCard" data-imgui-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="imagePreviewListRow"><div class="simplePreviewNum">Câu ${esc(q.num||i+1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question||'')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="simplePreviewEditBtn" type="button" data-imgui-edit="${i}">Sửa</button></div></div></article>`;}
  function renderImages(q,i){const imgs=q.images||[];return `<div class="simpleEditImages"><div class="simpleEditImagesHead"><span>Ảnh của câu hỏi</span><button class="simpleImageUploadBtn" type="button" data-imgui-pick-img="${i}">+ Thêm ảnh</button><input class="simpleImgHiddenInput" type="file" accept="image/*" multiple data-imgui-input="${i}"></div><div class="simpleImageThumbs">${imgs.length?imgs.map((im,idx)=>`<div class="simpleImageThumb"><button class="simpleImageRemove" type="button" data-imgui-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx+1}"></div>`).join(''):'<div class="simpleNoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;}
  function renderEditCard(q,i){const opts=q.options||{};const optionRows=Object.keys(opts).sort().map(k=>`<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k]||'')}" data-imgui-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-imgui-del-opt="${esc(k)}">×</button></div>`).join('');return `<article class="simplePreviewCard simpleEditCard" data-imgui-card="${i}"><div class="simpleEditHead imageEditHeadTop"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num||i+1)}</div><div class="imageEditHeadActions"><button class="btn" type="button" data-imgui-cancel="${i}">Hủy</button><button class="primary" type="button" data-imgui-save="${i}">Lưu sửa</button></div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-imgui-question>${esc(q.question||'')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-imgui-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div>${renderImages(q,i)}<div class="simpleEditBottom imageEditBottomOnlyAdd"><button class="btn" type="button" data-imgui-add-opt="${i}">+ Thêm đáp án</button></div></article>`;}
  function renderList(data){const list=document.getElementById('simplePreviewList');if(!list)return;const filtered=data.map((q,i)=>({q,i})).filter(x=>pass(x.q));list.innerHTML=filtered.length?filtered.map(x=>renderCard(x.q,x.i)).join(''):'<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';renderStats(data);}
  function openPreview(data){data=getData(data);let modal=document.getElementById('importPreviewModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='importPreviewModal';modal.className='modal simpleImportPreviewModal';modal.innerHTML=`<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-imgui-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-imgui-submit>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;document.body.appendChild(modal);renderList(data);}
  function saveEdit(i){const data=getData();const q=data[i];const card=document.querySelector(`[data-imgui-card="${i}"]`);if(!q||!card)return;const question=(card.querySelector('[data-imgui-question]')?.value||'').trim();const answer=(card.querySelector('[data-imgui-answer]')?.value||'').trim().toUpperCase().replace(/[^A-Z]/g,'');if(!question)return alert('Câu hỏi không được để trống.');if(!answer)return alert('Đáp án đúng không được để trống.');const options={};card.querySelectorAll('[data-imgui-opt]').forEach(inp=>{const k=String(inp.dataset.imguiOpt||'').toUpperCase();const v=(inp.value||'').trim();if(k&&v)options[k]=v;});if(!Object.keys(options).length)return alert('Cần ít nhất 1 đáp án.');for(const k of answer.split('')){if(!options[k])return alert('Đáp án đúng '+k+' chưa có nội dung.');}q.question=question;q.answer=answer;q.options=options;q.answer_text=answer.split('').map(k=>k+'. '+(options[k]||'')).join('; ');q.has_image=!!(q.images&&q.images.length);renderList(data);if(typeof notify==='function')notify('Đã lưu sửa câu '+(q.num||i+1));}
  document.addEventListener('click',function(e){const filter=e.target.closest('[data-imgui-filter]');if(filter){currentFilter=filter.dataset.imguiFilter||'all';renderList(getData());return;}if(e.target.closest('[data-imgui-close]')){document.getElementById('importPreviewModal')?.classList.add('hidden');return;}if(e.target.closest('[data-imgui-submit]')){document.getElementById('importPreviewModal')?.classList.add('hidden');window.__submitSubjectRequest?.();return;}const edit=e.target.closest('[data-imgui-edit]');if(edit){const i=+edit.dataset.imguiEdit;const data=getData();const card=document.querySelector(`[data-imgui-card="${i}"]`);if(card&&data[i]){card.outerHTML=renderEditCard(data[i],i);document.querySelector(`[data-imgui-card="${i}"] textarea`)?.focus();}return;}const cancel=e.target.closest('[data-imgui-cancel]');if(cancel){renderList(getData());return;}const save=e.target.closest('[data-imgui-save]');if(save){saveEdit(+save.dataset.imguiSave);return;}const pick=e.target.closest('[data-imgui-pick-img]');if(pick){document.querySelector(`[data-imgui-input="${pick.dataset.imguiPickImg}"]`)?.click();return;}const rm=e.target.closest('[data-imgui-rm-img]');if(rm){const card=rm.closest('[data-imgui-card]');const i=+(card?.dataset.imguiCard||0);const q=getData()[i];if(q?.images){q.images.splice(+rm.dataset.imguiRmImg,1);q.has_image=!!q.images.length;card.outerHTML=renderEditCard(q,i);}return;}const add=e.target.closest('[data-imgui-add-opt]');if(add){const i=+add.dataset.imguiAddOpt;const data=getData();const q=data[i];const k=nextKey(q.options||{});if(!k)return alert('Đã đủ số đáp án.');q.options=q.options||{};q.options[k]='';const card=document.querySelector(`[data-imgui-card="${i}"]`);if(card){card.outerHTML=renderEditCard(q,i);document.querySelector(`[data-imgui-card="${i}"] [data-imgui-opt="${k}"]`)?.focus();}return;}const del=e.target.closest('[data-imgui-del-opt]');if(del){const card=del.closest('[data-imgui-card]');const i=+(card?.dataset.imguiCard||0);const q=getData()[i];const k=del.dataset.imguiDelOpt;if(q?.options&&k){delete q.options[k];card.outerHTML=renderEditCard(q,i);}return;}});
  document.addEventListener('change',function(e){const inp=e.target.closest('[data-imgui-input]');if(!inp)return;const i=+inp.dataset.imguiInput;const q=getData()[i];if(!q)return;q.images=q.images||[];Array.from(inp.files||[]).forEach(file=>{const fr=new FileReader();fr.onload=function(){q.images.push({id:'import_'+Date.now()+'_'+Math.random().toString(16).slice(2),src:fr.result,source:'user-upload',name:file.name});q.has_image=true;const card=document.querySelector(`[data-imgui-card="${i}"]`);if(card)card.outerHTML=renderEditCard(q,i);};fr.readAsDataURL(file);});inp.value='';});
  window.__openImportPreviewModal=openPreview;
  window.__editImportPreviewQuestion=function(i){const data=getData();const card=document.querySelector(`[data-imgui-card="${i}"]`);if(card&&data[i])card.outerHTML=renderEditCard(data[i],i);};
})();


// FINAL_CLEAN_IMPORT_PREVIEW_V7_20260626
(function(){
  const LETTERS=['A','B','C','D','E','F','G','H'];
  let currentFilter='all';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getData(data){const arr=data||window.__previewImportData||[];window.__previewImportData=arr;arr.forEach(detect);return arr;}
  function normAns(q){return String(q?.answer||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function detect(q){q.images=q.images||[];q.has_image=!!(q.has_image||(q.images&&q.images.length));if(!q.error_risk)q.error_risk=normAns(q).length>1?'medium':'low';return q;}
  function correctText(q){const ans=normAns(q);if(!ans)return 'Chưa có đáp án';return ans.split('').map(k=>k+'. '+(q.options?.[k]||'')).join(' | ');}
  function riskColor(r){return {high:'#e74c3c',medium:'#f39c12',low:'#27ae60'}[r]||'#999';}
  function riskLabel(r){return {high:'Cao',medium:'Trung bình',low:'Thấp'}[r]||r;}
  function nextKey(opts){const used=new Set(Object.keys(opts||{}).map(k=>String(k).toUpperCase()));return LETTERS.find(k=>!used.has(k));}
  function imgSrc(im){return typeof im==='string'?im:(im?.src||im?.url||'');}
  function pass(q){if(currentFilter==='all')return true;if(currentFilter==='has_image')return !!q.has_image;return q.error_risk===currentFilter;}
  function stats(data){return {total:data.length,img:data.filter(q=>q.has_image).length,high:data.filter(q=>q.error_risk==='high').length,medium:data.filter(q=>q.error_risk==='medium').length,low:data.filter(q=>q.error_risk==='low').length};}
  function renderStats(data){const s=stats(data),box=document.getElementById('v7Stats');if(!box)return;const filters=[['all','Tất cả'],['has_image','📷 Có ảnh'],['high','Rủi ro cao'],['medium','Trung bình'],['low','Thấp']];box.innerHTML=`<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${filters.map(f=>`<button type="button" class="v7FilterBtn ${currentFilter===f[0]?'active':''}" data-v7-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;}
  function miniImages(q){const imgs=(q.images||[]).map(imgSrc).filter(Boolean);if(!imgs.length)return '<div class="v7MiniImgs"></div>';return `<div class="v7MiniImgs"><img src="${esc(imgs[0])}" alt="Ảnh preview">${imgs.length>1?`<span class="v7ImgCount">+${imgs.length-1}</span>`:''}</div>`;}
  function renderCard(q,i){const ans=normAns(q)||'?';return `<article class="v7Card" data-v7-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="v7Row"><div class="v7Num">Câu ${esc(q.num||i+1)}</div><div class="v7Main"><div class="v7Question">${esc(q.question||'')}</div><div class="v7Answer"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="v7EditBtn" type="button" data-v7-edit="${i}">Sửa</button></div></div></article>`;}
  function renderImages(q,i){const imgs=q.images||[];return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-v7-pick-img="${i}">+ Thêm ảnh</button><input class="v7HiddenInput" type="file" accept="image/*" multiple data-v7-input="${i}"></div><div class="v7Thumbs">${imgs.length?imgs.map((im,idx)=>`<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-v7-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx+1}"></div>`).join(''):'<div class="v7NoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;}
  function renderEditCard(q,i){const opts=q.options||{};const optionRows=Object.keys(opts).sort().map(k=>`<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k]||'')}" data-v7-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-v7-del-opt="${esc(k)}">×</button></div>`).join('');return `<article class="v7Card" data-v7-card="${i}"><div class="v7EditHead"><div class="v7EditTitle">Sửa toàn bộ Câu ${esc(q.num||i+1)}</div><div class="v7EditHeadActions"><button class="btn" type="button" data-v7-cancel="${i}">Hủy</button><button class="primary" type="button" data-v7-save="${i}">Lưu sửa</button></div></div><div class="v7EditGrid"><div class="v7Field"><label>Câu hỏi</label><textarea data-v7-question>${esc(q.question||'')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-v7-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="v7Field" style="margin-top:10px"><label>Các đáp án</label><div class="v7Options">${optionRows}</div></div>${renderImages(q,i)}<div class="v7Bottom"><button class="btn" type="button" data-v7-add-opt="${i}">+ Thêm đáp án</button></div></article>`;}
  function renderList(data){const list=document.getElementById('v7List');if(!list)return;const filtered=data.map((q,i)=>({q,i})).filter(x=>pass(x.q));list.innerHTML=filtered.length?filtered.map(x=>renderCard(x.q,x.i)).join(''):'<div class="v7Empty">Không có câu nào phù hợp bộ lọc.</div>';renderStats(data);}
  function openPreview(data){data=getData(data);let modal=document.getElementById('importPreviewModal');if(modal)modal.remove();modal=document.createElement('div');modal.id='importPreviewModal';modal.className='modal v7ImportModal';modal.innerHTML=`<div class="box v7ImportBox"><button class="modalX" type="button" data-v7-close>×</button><div class="v7Head"><div><span class="v7Label">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="v7Hint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="v7TopActions"><button class="primary v7SaveTop" type="button" data-v7-submit>Lưu Môn Học</button></div></div><div id="v7Stats" class="v7Stats"></div><div id="v7List" class="v7List"></div></div>`;document.body.appendChild(modal);renderList(data);}
  function saveEdit(i){const data=getData();const q=data[i];const card=document.querySelector(`[data-v7-card="${i}"]`);if(!q||!card)return;const question=(card.querySelector('[data-v7-question]')?.value||'').trim();const answer=(card.querySelector('[data-v7-answer]')?.value||'').trim().toUpperCase().replace(/[^A-Z]/g,'');if(!question)return alert('Câu hỏi không được để trống.');if(!answer)return alert('Đáp án đúng không được để trống.');const options={};card.querySelectorAll('[data-v7-opt]').forEach(inp=>{const k=String(inp.dataset.v7Opt||'').toUpperCase();const v=(inp.value||'').trim();if(k&&v)options[k]=v;});if(!Object.keys(options).length)return alert('Cần ít nhất 1 đáp án.');for(const k of answer.split('')){if(!options[k])return alert('Đáp án đúng '+k+' chưa có nội dung.');}q.question=question;q.answer=answer;q.options=options;q.answer_text=answer.split('').map(k=>k+'. '+(options[k]||'')).join('; ');q.has_image=!!(q.images&&q.images.length);renderList(data);if(typeof notify==='function')notify('Đã lưu sửa câu '+(q.num||i+1));}
  document.addEventListener('click',function(e){const filter=e.target.closest('[data-v7-filter]');if(filter){currentFilter=filter.dataset.v7Filter||'all';renderList(getData());return;}if(e.target.closest('[data-v7-close]')){document.getElementById('importPreviewModal')?.classList.add('hidden');return;}if(e.target.closest('[data-v7-submit]')){document.getElementById('importPreviewModal')?.classList.add('hidden');window.__submitSubjectRequest?.();return;}const edit=e.target.closest('[data-v7-edit]');if(edit){const i=+edit.dataset.v7Edit;const data=getData();const card=document.querySelector(`[data-v7-card="${i}"]`);if(card&&data[i]){card.outerHTML=renderEditCard(data[i],i);document.querySelector(`[data-v7-card="${i}"] textarea`)?.focus();}return;}const cancel=e.target.closest('[data-v7-cancel]');if(cancel){renderList(getData());return;}const save=e.target.closest('[data-v7-save]');if(save){saveEdit(+save.dataset.v7Save);return;}const pick=e.target.closest('[data-v7-pick-img]');if(pick){document.querySelector(`[data-v7-input="${pick.dataset.v7PickImg}"]`)?.click();return;}const rm=e.target.closest('[data-v7-rm-img]');if(rm){const card=rm.closest('[data-v7-card]');const i=+(card?.dataset.v7Card||0);const q=getData()[i];if(q?.images){q.images.splice(+rm.dataset.v7RmImg,1);q.has_image=!!q.images.length;card.outerHTML=renderEditCard(q,i);}return;}const add=e.target.closest('[data-v7-add-opt]');if(add){const i=+add.dataset.v7AddOpt;const data=getData();const q=data[i];const k=nextKey(q.options||{});if(!k)return alert('Đã đủ số đáp án.');q.options=q.options||{};q.options[k]='';const card=document.querySelector(`[data-v7-card="${i}"]`);if(card){card.outerHTML=renderEditCard(q,i);document.querySelector(`[data-v7-card="${i}"] [data-v7-opt="${k}"]`)?.focus();}return;}const del=e.target.closest('[data-v7-del-opt]');if(del){const card=del.closest('[data-v7-card]');const i=+(card?.dataset.v7Card||0);const q=getData()[i];const k=del.dataset.v7DelOpt;if(q?.options&&k){delete q.options[k];card.outerHTML=renderEditCard(q,i);}return;}});
  document.addEventListener('change',function(e){const inp=e.target.closest('[data-v7-input]');if(!inp)return;const i=+inp.dataset.v7Input;const q=getData()[i];if(!q)return;q.images=q.images||[];Array.from(inp.files||[]).forEach(file=>{const fr=new FileReader();fr.onload=function(){q.images.push({id:'import_'+Date.now()+'_'+Math.random().toString(16).slice(2),src:fr.result,source:'user-upload',name:file.name});q.has_image=true;const card=document.querySelector(`[data-v7-card="${i}"]`);if(card)card.outerHTML=renderEditCard(q,i);};fr.readAsDataURL(file);});inp.value='';});
  window.__openImportPreviewModal=openPreview;
  window.__editImportPreviewQuestion=function(i){const data=getData();const card=document.querySelector(`[data-v7-card="${i}"]`);if(card&&data[i])card.outerHTML=renderEditCard(data[i],i);};
})();


// IMAGE_LIGHTBOX_PREVIEW_CLICK_20260626
(function(){
  function ensureLightbox(){
    let lb=document.getElementById('v7ImageLightbox');
    if(lb) return lb;
    lb=document.createElement('div');
    lb.id='v7ImageLightbox';
    lb.className='v7Lightbox hidden';
    lb.innerHTML='<div class="v7LightboxInner"><button class="v7LightboxClose" type="button" aria-label="Đóng">×</button><img class="v7LightboxImg" alt="Ảnh phóng to"></div>';
    document.body.appendChild(lb);
    return lb;
  }
  function openImg(src){
    if(!src) return;
    const lb=ensureLightbox();
    const img=lb.querySelector('.v7LightboxImg');
    if(img) img.src=src;
    lb.classList.remove('hidden');
  }
  function closeImg(){
    const lb=document.getElementById('v7ImageLightbox');
    if(!lb) return;
    lb.classList.add('hidden');
    const img=lb.querySelector('.v7LightboxImg');
    if(img) img.removeAttribute('src');
  }
  document.addEventListener('click',function(e){
    const thumb=e.target.closest('.v7MiniImgs img, .v7Thumb img');
    if(thumb){
      e.preventDefault();
      e.stopPropagation();
      openImg(thumb.currentSrc || thumb.src);
      return;
    }
    if(e.target.closest('.v7LightboxClose') || e.target.id==='v7ImageLightbox'){
      closeImg();
    }
  }, true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') closeImg();
  });
})();
