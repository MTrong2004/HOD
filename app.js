/* AI_JS_MAP_START
Mục đích: Bản đồ nhanh cho AI đọc app.js, tránh sửa nhầm và tránh vá chồng. Không ảnh hưởng chức năng web.
Quy tắc sửa: giữ nguyên 1 file app.js, chỉ sửa nhóm liên quan, ưu tiên gộp vào block đang dùng. KHÔNG ĐỤNG Discord webhook.

NHÓM CHÍNH TRONG app.js
1) Config / dữ liệu ban đầu
- Tìm: APP_CONFIG, HOD_DATA, data, BASE, RAW, pool, STORE, rebuild
- Dùng cho: cấu hình Supabase, Cloudinary, dữ liệu câu hỏi, localStorage.

2) Helper chung
- Tìm: clone, notify, showProgress, hideProgress, esc, sortAns, answerText, finalAnswerText, imgsHTML, optionsHTML
- Dùng cho: thông báo, progress, escape HTML, đáp án, ảnh.

3) Flashcard
- Tìm: renderCard, fit, fitVisible, applyCardFontSize, flip, next, prev, reset, triggerReset, setupCardTools, updateCardTools
- Dùng cho: thẻ học, lật thẻ, câu trước/sau, ẩn lựa chọn, cỡ chữ.

4) Tab / Study / Search
- Tìm: switchTab, smart, renderStudy, studyList, search, openStudyReport, compactStudyCard, FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE
- Dùng cho: tab Thư viện, tìm kiếm, mở/thu gọn câu, báo cáo từ thư viện.

5) Quiz / Exam
- Tìm: renderQuiz, pickAns, checkAns, score, startTimer, stopTimer, __examOnlyRender, FINAL_EXAM_ONLY_QUIZ_UI
- Dùng cho: luyện tập, thi, timer, chấm điểm.

6) Editor / Report câu hỏi
- Tìm: openEditor, renderEditOptions, renderEditImages, saveEditor, restoreEditor, submitEditRequest, edit_requests, question_history
- Dùng cho: báo cáo câu sai, sửa trực tiếp admin/editor, lưu lịch sử.

7) Supabase Auth / Profile
- Tìm: HODSupabase, signInGoogle, signIn, signUp, signOut, loadProfile, loadQuestionsFromSupabase, applyOAuthHashSession, currentUser, currentProfile
- Dùng cho: đăng nhập Google, profile, phân quyền admin/editor/user.

8) Discord login notify
- Tìm: sendLoginToDiscord, notifyLoginToDiscordOnce, discord.com/api/webhooks
- Dùng cho: thông báo đăng nhập Discord. LƯU Ý: KHÔNG ĐỤNG webhook theo yêu cầu.

9) Admin / quyền / dashboard
- Tìm: isAdmin, openAdmin, applyAdminGuard, patchAdmin, adminOpenBtn, hodFloatAdmin, adminModal
- Dùng cho: ẩn/hiện quyền admin, mở admin.html.

10) Account UI
- Tìm: hodTopAvatar, hodAccountMenu, avatarHTML, updateAll, updateMenu, hodReportModal
- Dùng cho: avatar, menu tài khoản, đăng xuất, xem báo cáo đã gửi.

11) Subject / Chọn môn
- Tìm: SUBJECT_STORE, subjectGate, getSubjects, renderSubjects, refreshSubjects, loadBySubject, setSubject, subjectTopChip, hodChangeSubjectBtn
- Dùng cho: chọn môn, tải câu hỏi theo subject_code, lưu tiến độ từng môn.

12) Add Subject / Import câu hỏi
- Tìm: ADD_SUBJECT_FEATURE, AI_PROMPT, getAddSubjectHTML, handleFileImport, __previewUserImport, __submitSubjectRequest, parsedQuestions, IMPORT_PREVIEW_INLINE_EDIT
- Dùng cho: thêm môn, copy prompt AI, import JSON/MD/TXT, xem trước câu hỏi.

13) Add Question / Nút + Thư viện
- Tìm: COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629, addQuestionFab, addQuestionModal, savePrettyQuestion, addImgUpload
- Dùng cho: admin/editor thêm câu hỏi trực tiếp. Đây là bản đã gộp, không thêm HOTFIX nút + mới nếu không cần.

14) Image / Cloudinary / Upload
- Tìm: CLOUDINARY, cleanImages, upload, image, imgUpload, user-upload, COPILOT_CLOUDINARY_IMAGE_FIX, CLEAN_IMAGE_REQUEST, __LHUploadCloudinary, __LHCleanImages
- Dùng cho: upload ảnh câu hỏi, sửa/đổi ảnh, chuẩn hóa URL ảnh.

15) Mobile / UX runtime
- Tìm: mobileCardNav, touchstart, touchend, landingParticles, landingBgMover, last_activity
- Dùng cho: vuốt flashcard mobile, nền landing, cập nhật hoạt động người dùng.

16) Cache / Supabase
- Tìm: APP_F5_SUPABASE_CACHE_20260629, APP_REALTIME_CACHE_INVALIDATE
- Dùng cho: giảm gọi Supabase, cache dữ liệu; không dùng bảng thống kê băng thông cũ.

17) Block vá cuối file
- Tìm: FINAL_, PATCH_, HOTFIX_, COPILOT_
- Dùng cho: bản vá runtime. Khi sửa, ưu tiên hợp nhất vào block chính thay vì thêm vá chồng.

GỢI Ý AI
- Lỗi flashcard: xem nhóm 2 + 3 + 14 + 15.
- Lỗi thư viện/tìm kiếm: xem nhóm 4 + 6 + 13.
- Lỗi quiz/thi: xem nhóm 5.
- Lỗi đăng nhập/quyền: xem nhóm 7 + 8 + 9 + 10.
- Lỗi chọn môn/thêm môn: xem nhóm 11 + 12 + 13.
- Lỗi ảnh/upload: xem nhóm 6 + 14.
- Lỗi cache/Supabase: xem nhóm 16.
- NOTE_20260629: Đã bỏ chức năng tự ghi/thống kê băng thông; không thêm lại cơ chế ghi băng thông tự động.
AI_JS_MAP_END */

// ===== FIX_OAUTH_SESSION_FINAL_20260628 =====
if (location.hash && location.hash.includes('&amp;')) {
  history.replaceState(null, '', location.href.replace(/&amp;/g, '&'));
}
// ===== END FIX_OAUTH_SESSION_FINAL_20260628 =====

// ===== CONFIG LOADED FROM config.js =====
window.APP_CONFIG = window.APP_CONFIG || {
  SUPABASE_URL: 'https://kxyukiwhhorvxgxxxmfq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f',
  LOGIN_NOTIFY_ENDPOINT: 'https://kxyukiwhhorvxgxxxmfq.supabase.co/functions/v1/login-notify',
  CLOUDINARY_CLOUD_NAME: 'ddc4uvm7m',
  CLOUDINARY_UPLOAD_PRESET: 'learninghub_unsigned',
  CLOUDINARY_UPLOAD_FOLDER: 'learninghub/questions',
  CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload'
};
// ===== END CONFIG FALLBACK =====
window.HOD_DATA = [];
(function () { var s = document.createElement('script'); s.type = 'application/json'; s.id = 'data'; s.textContent = '[]'; document.head.appendChild(s); })();

// === LOCAL DEV BYPASS: skip login when opened from file:// ===
if (location.protocol === 'file:') {
  window.__LOCAL_DEV_MODE = true;
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('hodLoginGate')?.classList.add('hidden');
    document.getElementById('hodPendingApproval')?.classList.add('hidden');
    document.body?.classList.remove('hod-locked');
    var sg = document.getElementById('subjectGate');
    if (sg) { sg.classList.remove('hidden'); sg.setAttribute('aria-hidden', 'false'); document.body.classList.add('has-subject-gate'); }
  });
}





// ===== APP_F5_SUPABASE_CACHE_20260629 =====
// F5 giảm gọi Supabase: cache GET Supabase + chống gọi lặp questions/profiles.
// Có realtime clear cache khi questions/subjects đổi.
(function(){
  if(window.__APP_F5_SUPABASE_CACHE_20260629) return;
  window.__APP_F5_SUPABASE_CACHE_20260629 = true;

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if(!nativeFetch) return;

  const PREFIX = 'lh_f5_cache:';
  const mem = new Map();
  const pending = new Map();
  const MAX_BODY = 900 * 1024;
  const profilePatchLast = new Map();

  function methodOf(init){ return String(init && init.method ? init.method : 'GET').toUpperCase(); }
  function isSupabaseRest(url){ return /\/rest\/v1\//.test(url.pathname); }
  function isCacheablePath(path){ return /\/(questions|subjects|profiles|site_settings)\b/.test(path); }
  function ttlFor(url){
    const p = url.pathname;
    const q = url.search || '';
    if(/\/questions\b/.test(p)) return 10 * 60 * 1000;
    if(/\/subjects\b/.test(p)) return 10 * 60 * 1000;
    if(/\/profiles\b/.test(p) && /id=eq\./.test(q)) return 10 * 60 * 1000;
    if(/\/site_settings\b/.test(p)) return 10 * 60 * 1000;
    return 0;
  }
  function keyOf(url){ return url.origin + url.pathname + url.search; }
  function headersObj(headers){
    const o = {'x-learninghub-cache':'1'};
    try{ headers.forEach((v,k)=>{ if(k.toLowerCase() !== 'content-length') o[k]=v; }); }catch(e){}
    return o;
  }
  function makeResponse(entry){
    return new Response(entry.body, {status:entry.status || 200, statusText:entry.statusText || 'OK', headers:entry.headers || {'x-learninghub-cache':'1'}});
  }
  function readStore(key){
    try{
      const raw = sessionStorage.getItem(PREFIX + key);
      if(!raw) return null;
      const e = JSON.parse(raw);
      if(!e || !e.exp || Date.now() > e.exp) return null;
      return e;
    }catch(err){ return null; }
  }
  function writeStore(key, entry){ try{ sessionStorage.setItem(PREFIX + key, JSON.stringify(entry)); }catch(err){} }
  async function saveFromResponse(key, ttl, res){
    try{
      const txt = await res.clone().text();
      if(txt.length > MAX_BODY) return;
      const entry = {body:txt, status:res.status, statusText:res.statusText, headers:headersObj(res.headers), exp:Date.now()+ttl};
      mem.set(key, entry);
      writeStore(key, entry);
    }catch(err){}
  }
  function matchKind(text, kind){
    if(!kind || kind === 'all') return true;
    if(kind === 'questions') return text.includes('/questions');
    if(kind === 'subjects') return text.includes('/subjects');
    if(kind === 'profiles') return text.includes('/profiles');
    return text.includes('/' + kind);
  }
  function clearCache(kind){
    try{
      Object.keys(sessionStorage).forEach(k => {
        if(k.startsWith(PREFIX) && matchKind(k, kind)) sessionStorage.removeItem(k);
      });
      Array.from(mem.keys()).forEach(k => { if(matchKind(k, kind)) mem.delete(k); });
      Array.from(pending.keys()).forEach(k => { if(matchKind(k, kind)) pending.delete(k); });
      window.__LH_LAST_CACHE_CLEAR = {kind: kind || 'all', at: Date.now()};
    }catch(e){}
  }
  function shouldSkipProfilePatch(url, init){
    const method = methodOf(init);
    if(method !== 'PATCH' && method !== 'PUT') return false;
    if(!/\/profiles\b/.test(url.pathname)) return false;
    const body = String(init && init.body ? init.body : '');
    // Chỉ chặn các update hoạt động/avatar/email lặp, không chặn cập nhật quyền từ admin.
    if(!/last_activity|last_login|avatar_url|email/.test(body)) return false;
    if(/last_login/.test(body)) return false; // đăng nhập/mở web phải được ghi nhận
    if(/role|approved|blocked|is_blocked|status/.test(body)) return false;
    const key = keyOf(url) + '|' + body.replace(/"last_activity"\s*:\s*"[^"]+"/g, '"last_activity":"TIME"');
    const last = profilePatchLast.get(key) || 0;
    if(Date.now() - last < 5 * 60 * 1000) return true;
    profilePatchLast.set(key, Date.now());
    return false;
  }

  window.clearLearningHubQuestionCache = function(){ clearCache('questions'); };
  window.clearLearningHubSupabaseCache = clearCache;

  window.fetch = async function(input, init){
    let url;
    try{ url = new URL(typeof input === 'string' ? input : input.url, location.href); }catch(e){ return nativeFetch(input, init); }

    // Giảm profiles?id=... status 204 lặp lại do update hoạt động/avatar.
    if(isSupabaseRest(url) && shouldSkipProfilePatch(url, init)){
      return new Response(null, {status:204, statusText:'No Content', headers:{'x-learninghub-skip':'profile-patch-duplicate'}});
    }

    if(methodOf(init) !== 'GET' || !isSupabaseRest(url) || !isCacheablePath(url.pathname)) return nativeFetch(input, init);

    const ttl = ttlFor(url);
    if(!ttl) return nativeFetch(input, init);
    const key = keyOf(url);

    const m = mem.get(key);
    if(m && Date.now() <= m.exp) return makeResponse(m);
    const s = readStore(key);
    if(s){ mem.set(key, s); return makeResponse(s); }

    if(pending.has(key)){
      const entry = await pending.get(key).catch(()=>null);
      if(entry) return makeResponse(entry);
    }

    // Quan trọng: chỉ gọi network 1 lần. Bản cũ gọi nativeFetch 2 lần khi cache miss.
    const network = nativeFetch(input, init).then(async res => {
      if(res && res.ok) await saveFromResponse(key, ttl, res);
      return res;
    }).finally(()=>pending.delete(key));

    pending.set(key, network.then(()=>mem.get(key) || null));
    return network;
  };
})();
// ===== END APP_F5_SUPABASE_CACHE_20260629 =====

/* ===== merged app logic ===== */

'use strict'; const dataEl = document.getElementById('data'), BASE = [], STORE = 'hod102_user_edits_v1'; let edits = {}; try { edits = JSON.parse(localStorage.getItem(STORE) || '{}') } catch (e) { } function clone(x) { return JSON.parse(JSON.stringify(x)) }
function notify(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.remove('hidden'); t.classList.add('show'); clearTimeout(t._tid); t._tid = setTimeout(() => { t.classList.add('hidden'); t.classList.remove('show') }, 2200) }

function showProgress(title, current, total, detail = '') {
  let el = document.getElementById('adminProgressOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminProgressOverlay';
    el.className = 'adminProgressOverlay hidden';
    el.innerHTML = `
      <div class="adminProgressBox">
        <h3 id="adminProgressTitle">Đang xử lý...</h3>
        <div class="adminProgressTrack">
          <div id="adminProgressBar" class="adminProgressBar"></div>
        </div>
        <div class="adminProgressSub">
          <span id="adminProgressPercent" class="adminProgressPercent">0% (0/0)</span>
          <span id="adminProgressDetail" class="adminProgressDetail"></span>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  document.getElementById('adminProgressTitle').textContent = title;
  document.getElementById('adminProgressBar').style.width = pct + '%';
  document.getElementById('adminProgressPercent').textContent = pct + '% (' + current + '/' + total + ')';
  document.getElementById('adminProgressDetail').textContent = detail;
  el.classList.remove('hidden');
}

function hideProgress() {
  const el = document.getElementById('adminProgressOverlay');
  if (el) el.classList.add('hidden');
}

let RAW = [], pool = [], ci = Math.max(0, Math.min(+localStorage.getItem('hod102_ci') || 0, BASE.length - 1)), flipped = false, flipDir = 'horizontal', cardFontSize = localStorage.getItem('hod102_card_font_size_v3') || '1', flipMode = localStorage.getItem('hod102_flip_mode') || 'single', hideOptions = false, randomActive = localStorage.getItem('hod102_random_active') === '1', qCnt = 20, qSet = [], qDone = {}, qSel = {}, quizMode = 'practice', examSubmitted = false, timerInt = null, examStart = 0, editDraft = null; function rebuild() { RAW = BASE.map(c => Object.assign(clone(c), edits[c.num] || {})); pool = pool.length ? pool.map(o => RAW.find(c => c.num === o.num) || o) : [...RAW] } rebuild(); const $ = id => document.getElementById(id); function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) } function sortAns(s) { return (s || '').split('').sort().join('') } function answerText(c) { return (c.answer || '').split('').map(ch => ch + '. ' + (c.options?.[ch] || '')).join('; ') } function optionsHTML(c) { return Object.entries(c.options || {}).map(([k, v]) => `<div class="opt"><div class="letter">${k}</div><div class="ot">${esc(v)}</div></div>`).join('') } function imgsHTML(c) { return (c.images || []).map(im => `<img src="${esc(im.src)}" alt="">`).join('') } function setv(k, v) { document.documentElement.style.setProperty(k, v) } function fit(c) {
  setv('--qfs', '1.08rem'); setv('--ofs', '.92rem'); setv('--qlh', '1.32'); setv('--olh', '1.36'); setv('--afs', '1rem');
  setv('--imgmax', (c.images && c.images.length) ? '380px' : '0px'); setv('--imgcol', (c.images && c.images.length) ? '620px' : '0px');
  setv('--frontpad', '14px 18px'); setv('--optgap', '6px'); setv('--optpad', '7px 10px'); setv('--qmb', '8px'); setv('--imgmb', '7px'); setv('--tagmb', '6px'); setv('--letter', '25px'); setv('--letterfs', '.76rem'); setv('--tagfs', '.62rem'); setv('--tagpad', '3px 10px'); setv('--ogap', '8px');
}
function fitVisible() { return; }
function renderCard() { let c = pool[ci] || RAW[0]; if (!c) return; fit(c); applyCardFontSize(); $('idx').textContent = ci + 1; $('total').textContent = pool.length; $('bar').style.width = ((ci + 1) / pool.length * 100) + '%'; $('tag').textContent = 'CÂU ' + c.num; $('question').textContent = c.question; const __imgEl = $('images'); const __imgKey = JSON.stringify((c.images || []).map(im => String((im && typeof im === 'object' ? (im.src || im.url || im.secure_url || im.publicUrl || im.public_url) : im) || ''))); if (__imgEl.dataset.imgKey !== __imgKey) { __imgEl.innerHTML = imgsHTML(c); __imgEl.dataset.imgKey = __imgKey; } __imgEl.style.display = (c.images && c.images.length) ? 'flex' : 'none'; document.querySelector('#fc .front')?.classList.toggle('hasImg', !!(c.images && c.images.length)); $('options').innerHTML = optionsHTML(c); $('options').classList.remove('hide'); hideOptions = false; applyCardFontSize(); updateCardTools(); $('ansLetter').textContent = (c.answer || '').split('').join(', '); $('ansText').innerHTML = esc(finalAnswerText(c)).replace(/; /g, '<br>'); $('card').classList.remove('dir-horizontal', 'dir-up', 'dir-down'); $('card').classList.add('dir-' + flipDir); $('card').classList.toggle('flip', flipped); $('mode').textContent = flipMode === 'single' ? '1x' : '2x'; var _sc = localStorage.getItem('learninghub_subject_code_merged_v1') || ''; localStorage.setItem('hod102_ci', ci); if (_sc) localStorage.setItem('learninghub_progress_' + _sc, ci); localStorage.setItem('hod102_flip_mode', flipMode) } function flip(dir = 'horizontal') { flipDir = dir; flipped = !flipped; renderCard() } function next() { ci = (ci + 1) % pool.length; flipped = false; flipDir = 'horizontal'; renderCard() } function prev() { ci = (ci - 1 + pool.length) % pool.length; flipped = false; flipDir = 'horizontal'; renderCard() } function shuffle() { for (let i = pool.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1));[pool[i], pool[j]] = [pool[j], pool[i]] } ci = 0; flipped = false; flipDir = 'horizontal'; randomActive = false; localStorage.setItem('hod102_random_active', '0'); renderCard(); let sh = $('shuffle'); if (sh) { sh.classList.add('flash'); setTimeout(() => sh.classList.remove('flash'), 650) } } let __allowUserReset = false; function reset(force) { if (force !== true && __allowUserReset !== true) { try { renderCard() } catch (e) { } return } __allowUserReset = false; pool = [...RAW]; ci = 0; flipped = false; flipDir = 'horizontal'; randomActive = false; localStorage.setItem('hod102_random_active', '0'); renderCard() } function triggerReset() { __allowUserReset = true; reset(true) } function switchTab(n, b) { try { localStorage.setItem('learninghub_last_tab_v1', n) } catch (e) { } document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.pane').forEach(x => x.classList.remove('active')); $(n).classList.add('active'); if (n === 'study') renderStudy(); if (n === 'quiz') try { renderQuiz() } catch (e) { } } function sample(a, n) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return n ? a.slice(0, n) : a } function fmt(ms) { let s = Math.floor(ms / 1000), m = Math.floor(s / 60); s %= 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') } function startTimer() { clearInterval(timerInt); examStart = Date.now(); timerInt = setInterval(() => $('timer').textContent = fmt(Date.now() - examStart), 1000) } function stopTimer() { clearInterval(timerInt) } function syncQuizSet() { if (qSet && qSet.length) { qSet = qSet.map(c => RAW.find(x => x.num === c.num) || c) } } function renderQuiz() { if (typeof window.__examOnlyRender === 'function') return window.__examOnlyRender(); const body = $('quizBody'); if (body) body.innerHTML = ''; } function pickAns(i, k) { if ((quizMode === 'practice' && qDone[i]) || examSubmitted) return; let c = qSet[i]; if (c.answer.length > 1) { let set = new Set((qSel[i] || '').split('').filter(Boolean)); set.has(k) ? set.delete(k) : set.add(k); qSel[i] = [...set].sort().join('') } else qSel[i] = k; renderQuiz() } function checkAns(i) { if (!qSel[i]) { alert('Bạn chọn đáp án trước nha.'); return } qDone[i] = true; renderQuiz() } function score() {/* old practice score overlay removed */ } function smart(q) { q = q.trim().toLowerCase(); if (!q) return RAW; let m = q.match(/^#(\d+)$/); if (m) return RAW.filter(c => c.num === +m[1]); m = q.match(/^answer\s*:\s*([a-e]+)$/i); if (m) return RAW.filter(c => sortAns(c.answer) === sortAns(m[1].toUpperCase())); if (['multi', 'multiple', 'chọn nhiều'].includes(q)) return RAW.filter(c => c.answer.length > 1); return RAW.filter(c => (String(c.num) + ' ' + c.question + ' ' + c.answer + ' ' + (c.answer_text || '') + ' ' + Object.values(c.options).join(' ')).toLowerCase().includes(q)) } function renderStudy() { let arr = smart($('search').value || ''), max = arr.length; $('studyList').innerHTML = arr.slice(0, max).map(c => `<div class="sitem"><div class="snum">CÂU ${c.num}</div><div class="sq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${Object.entries(c.options).map(([k, v]) => `<div class="sopt ${c.answer.includes(k) ? 'ans' : ''}"><div class="skey">${c.answer.includes(k) ? '✓' : k}</div><div>${esc(k + '. ' + v)}</div></div>`).join('')}</div></div>`).join('') + (arr.length > max ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>` : arr.length ? '' : '<div class="more">Không tìm thấy kết quả.</div>') } function openEditor() { let c = pool[ci]; editDraft = clone(c); let reporting = !!(window.HODSupabase?.getUser?.()) && !window.HODSupabase?.isAdmin?.(); $('editTitle').textContent = (reporting ? 'Báo cáo / đề xuất sửa câu ' : 'Sửa câu ') + c.num; if ($('saveEdit')) $('saveEdit').textContent = reporting ? 'Gửi báo cáo cho admin' : 'Lưu sửa'; if ($('restoreEdit')) $('restoreEdit').classList.toggle('hidden', reporting); $('editQuestion').value = c.question; $('editAnswer').value = c.answer; renderEditOptions(); renderEditImages(); $('editModal').classList.remove('hidden') } function renderEditOptions() { let ops = editDraft.options || {}; let box = $('editOptions'); if (!box) return; box.innerHTML = ['A', 'B', 'C', 'D', 'E'].map(k => `<div class="field"><label>Đáp án ${k}</label><textarea data-opt="${k}">${esc(ops[k] || '')}</textarea></div>`).join('') } function renderEditImages() { let box = $('editImgs'); if (!box) { const input = $('imgUpload'); if (!input) return; box = document.createElement('div'); box.id = 'editImgs'; box.className = 'editImgs'; input.insertAdjacentElement('afterend', box); } box.innerHTML = (editDraft.images || []).map((im, i) => { const src = im && typeof im === 'object' ? (im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '') : im; return `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${esc(src)}"><input class="imgUrlBox" value="${esc(src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`; }).join('') || '<p style="color:var(--mist)">Chưa có hình.</p>' } function saveEditor() { let oldQ = clone(RAW.find(c => c.num === editDraft.num) || pool[ci] || editDraft); editDraft.question = $('editQuestion').value.trim(); editDraft.answer = $('editAnswer').value.trim().toUpperCase(); let ops = {}; document.querySelectorAll('[data-opt]').forEach(t => { if (t.value.trim()) ops[t.dataset.opt] = t.value.trim() }); editDraft.options = ops; editDraft.answer_text = answerText(editDraft); if (window.HODSupabase && window.HODSupabase.isReady()) { window.HODSupabase.submitEditRequest(editDraft, oldQ); return } if (window.HODSupabase?.getUser?.()) { alert('Chưa kết nối được dữ liệu duyệt. Hãy tải lại trang rồi gửi lại báo cáo.'); return } edits[editDraft.num] = { question: editDraft.question, options: editDraft.options, answer: editDraft.answer, answer_text: editDraft.answer_text, images: editDraft.images || [] }; localStorage.setItem(STORE, JSON.stringify(edits)); rebuild(); ci = pool.findIndex(c => c.num === editDraft.num); if (ci < 0) ci = 0; flipped = false; renderCard(); renderQuiz(); renderStudy(); $('editModal').classList.add('hidden'); notify('Đã lưu sửa local') } function restoreEditor() { delete edits[editDraft.num]; localStorage.setItem(STORE, JSON.stringify(edits)); rebuild(); syncQuizSet(); renderCard(); renderQuiz(); renderStudy(); $('editModal').classList.add('hidden'); notify('Đã khôi phục') } function exportEdits() { let blob = new Blob([JSON.stringify(edits, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hod102_user_edits.json'; a.click(); URL.revokeObjectURL(a.href) } function importEditsFile(f) { let fr = new FileReader(); fr.onload = () => { try { edits = JSON.parse(fr.result) || {}; localStorage.setItem(STORE, JSON.stringify(edits)); rebuild(); renderCard(); renderQuiz(); renderStudy(); notify('Đã nhập file sửa') } catch (e) { alert('File JSON không hợp lệ') } }; fr.readAsText(f) } function applyCardFontSize() { let n = parseFloat(cardFontSize || '1'); if (!isFinite(n)) n = 1; n = Math.max(.8, Math.min(1.3, n)); cardFontSize = String(n); let root = document.documentElement, fc = $('fc'); let set = (k, v) => { root.style.setProperty(k, v); if (fc) fc.style.setProperty(k, v) }; let base = 1.35 * n; set('--card-qfs', (1.08 * base).toFixed(3) + 'rem'); set('--card-ofs', (.92 * base).toFixed(3) + 'rem'); set('--card-afs', (1.0 * base).toFixed(3) + 'rem'); set('--card-letter', (25 * Math.min(1.35, base)).toFixed(0) + 'px'); set('--card-letterfs', (.76 * base).toFixed(3) + 'rem'); localStorage.setItem('hod102_card_font_size_v3', String(n)); if ($('stCardFont')) $('stCardFont').value = Math.round(n * 100); if ($('stCardFontState')) $('stCardFontState').textContent = Math.round(n * 100) + '%' } function updateCardTools() { hideOptions = false; try { localStorage.removeItem('hod102_hide_options'); } catch(e) {} let sh = $('shuffle'), eye = $('toggleOpts'); if (sh) { sh.classList.remove('active'); sh.title = 'Xáo ngẫu nhiên' } if (eye) eye.remove(); } function setupGlobalHeader() { let top = document.querySelector('#fc .top'); let tabs = document.querySelector('.tabs'); if (top && !top.classList.contains('globalTop')) { top.classList.add('globalTop'); document.body.insertBefore(top, tabs || document.body.firstChild) } } function setupCardTools() { let card = $('card'); if (!card || $('cardTools')) return; let tools = document.createElement('div'); tools.id = 'cardTools'; tools.className = 'cardTools'; let sh = $('shuffle'), eye = $('toggleOpts'), ed = $('editCard'); if (eye) eye.remove(); if (sh) { sh.textContent = '⚂'; sh.classList.add('cardToolBtn', 'diceBtn'); tools.appendChild(sh) } tools.addEventListener('click', e => e.stopPropagation()); tools.addEventListener('mousedown', e => e.stopPropagation()); card.insertBefore(tools, ed); updateCardTools() } function updateSettingsUI() { if (!$('stFlipState')) return; $('stFlipState').textContent = 'Đang dùng: ' + (flipMode === 'single' ? '1x - bấm 1 lần để lật' : '2x - hạn chế lật nhầm'); if ($('stOptState')) $('stOptState').textContent = 'Đang hiện lựa chọn'; if ($('stToggleOpts')) $('stToggleOpts').style.display = 'none'; if ($('stGoInput')) $('stGoInput').value = (pool[ci]?.num) || ''; applyCardFontSize(); updateCardTools() } function toggleFlipMode() { flipMode = flipMode === 'single' ? 'double' : 'single'; flipped = false; renderCard(); updateSettingsUI() } function goToQuestionNum() { let n = +$('stGoInput').value; if (!n) { alert('Nhập số câu trước nha.'); return } let i = pool.findIndex(c => c.num === n); if (i < 0) i = RAW.findIndex(c => c.num === n); if (i < 0) { alert('Không tìm thấy câu ' + n); return } if (!pool.find(c => c.num === n)) pool = [...RAW]; ci = i; flipped = false; renderCard(); updateSettingsUI(); $('settingsModal').classList.add('hidden') } function init() { setupGlobalHeader(); document.querySelectorAll('.tab').forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab, btn)); $('shuffle').onclick = shuffle; $('reset').onclick = () => triggerReset(); if ($('toggleOpts')) $('toggleOpts').remove(); try { localStorage.removeItem('hod102_hide_options'); } catch(e) {} $('openSettings').onclick = () => { $('settingsModal').classList.remove('hidden'); updateSettingsUI() }; $('closeSettings').onclick = () => $('settingsModal').classList.add('hidden'); document.querySelectorAll('.modal,.overlay').forEach(m => { m.addEventListener('mousedown', e => { if (e.target === m) m.classList.add('hidden') }) }); document.querySelectorAll('.modal .box,.overlay .box').forEach(box => { if (!box.querySelector('.modalX')) { let x = document.createElement('button'); x.className = 'modalX'; x.type = 'button'; x.textContent = '×'; x.title = 'Đóng'; x.onclick = e => { e.stopPropagation(); box.closest('.modal,.overlay')?.classList.add('hidden') }; box.prepend(x) } }); setupCardTools(); if ($('toggleGuide')) $('toggleGuide').onclick = () => { let g = $('guidePanel'), open = g.classList.toggle('hidden') === false; $('toggleGuide').textContent = open ? 'Ẩn hướng dẫn' : 'Mở hướng dẫn' }; if ($('stCardFont')) $('stCardFont').oninput = e => { cardFontSize = (+e.target.value / 100).toFixed(2); applyCardFontSize(); renderCard() }; if ($('stCardFontReset')) $('stCardFontReset').onclick = () => { cardFontSize = '1'; applyCardFontSize(); renderCard(); updateSettingsUI() }; if ($('stToggleFlipMode')) $('stToggleFlipMode').onclick = toggleFlipMode; if ($('stToggleOpts')) $('stToggleOpts').style.display = 'none'; if ($('stShuffle')) $('stShuffle').onclick = () => { shuffle(); updateSettingsUI() }; if ($('stReset')) $('stReset').onclick = () => { triggerReset(); updateSettingsUI() }; if ($('stGo')) $('stGo').onclick = goToQuestionNum; if ($('stGoInput')) $('stGoInput').onkeydown = e => { if (e.key === 'Enter') goToQuestionNum() }; if ($('stEdit')) $('stEdit').onclick = () => { openEditor(); $('settingsModal').classList.add('hidden') }; $('editCard').title = 'Báo cáo / đề xuất sửa câu'; $('editCard').textContent = '!'; $('editCard').onclick = e => { e.stopPropagation(); openEditor() }; $('prev').onclick = prev; $('next').onclick = next; $('mode').onclick = toggleFlipMode; $('zone').onclick = e => { let r = $('card').getBoundingClientRect(); if (!$('card').contains(e.target)) { e.clientX < r.left ? prev() : next(); return } if (e.target.closest('#editCard') || e.target.closest('#cardTools')) return; if (flipMode === 'single') flip('horizontal') };/* old Practice/Exam quiz UI bindings removed */$('search').oninput = renderStudy; $('studyList').onclick = e => { let it = e.target.closest('.sitem'); if (it) it.classList.toggle('open') }; $('closeEdit').onclick = () => $('editModal').classList.add('hidden'); $('saveEdit').onclick = saveEditor; $('restoreEdit').onclick = restoreEditor; $('editImgs').onclick = e => { let b = e.target.closest('[data-rm]'); if (b) { editDraft.images.splice(+b.dataset.rm, 1); renderEditImages() } }; $('imgUpload').onchange = e => { [...e.target.files].forEach(file => { let fr = new FileReader(); fr.onload = () => { editDraft.images = editDraft.images || []; editDraft.images.push({ id: 'user_' + Date.now(), src: fr.result, source: 'user-upload', name: file.name }); renderEditImages() }; fr.readAsDataURL(file) }); e.target.value = '' }; $('exportEdits').onclick = exportEdits; $('importEdits').onclick = () => $('importFile').click(); $('importFile').onchange = e => { if (e.target.files[0]) importEditsFile(e.target.files[0]) }; $('clearEdits').onclick = () => { if (confirm('Xóa tất cả chỉnh sửa đã lưu?')) { edits = {}; localStorage.removeItem(STORE); rebuild(); renderCard(); notify('Đã xóa tất cả sửa') } };  window.onkeydown = e => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if ($('quiz') && $('quiz').classList.contains('active')) {
      return;
    }
    if (e.code === 'Space') { e.preventDefault(); flip('horizontal') }
    if (e.key === 'ArrowUp') { e.preventDefault(); flip('up') }
    if (e.key === 'ArrowDown') { e.preventDefault(); flip('down') }
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
    if (e.key.toLowerCase() === 'r') triggerReset();
    if (e.key.toLowerCase() === 'e') openEditor();
    if (e.key === '1') document.querySelector('[data-tab="fc"]').click();
    if (e.key === '2') document.querySelector('[data-tab="quiz"]').click();
    if (e.key === '3') document.querySelector('[data-tab="study"]').click()
  }; applyCardFontSize(); setupCardTools(); renderCard(); renderQuiz() } document.addEventListener('DOMContentLoaded', init);

// ===============================
// HOD102 + Supabase MVP bridge
// 1-file frontend. Fill SUPABASE_URL and SUPABASE_ANON_KEY after creating your Supabase project.
// IMPORTANT: Never paste service_role key here. Use anon key only.
// ===============================
window.HODSupabase = (() => {
  const CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
  };

  let client = null;
  let currentUser = null;
  let currentProfile = null;

  const configured = () => CONFIG.SUPABASE_URL.startsWith('https://') && !CONFIG.SUPABASE_ANON_KEY.startsWith('PASTE_');
  const isReady = () => !!client && !!currentUser;
  const isAdmin = () => currentProfile?.role === 'admin';
  const $id = id => document.getElementById(id);

  function safeJson(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
  }

  function questionToRow(q) {
    const imgs = q.images || [];
    return {
      question: q.question,
      options: q.options || {},
      answer: q.answer,
      answer_text: finalAnswerText(q),
      images: imgs,
      has_image: !!(q.has_image || imgs.length),
      error_risk: q.error_risk || 'low',
      error_risk_reason: q.error_risk_reason || null
    };
  }

  function rowToQuestion(row) {
    return {
      id: row.id,
      subject_code: row.subject_code,
      num: row.num,
      question: row.question,
      options: row.options || {},
      answer: row.answer,
      answer_text: row.answer_text,
      images: row.images || [],
      has_image: !!(row.has_image || (row.images || []).length),
      error_risk: row.error_risk || 'low',
      error_risk_reason: row.error_risk_reason || ''
    };
  }

  function notify2(msg) {
    if (typeof notify === 'function') notify(msg);
    else console.log('[HOD102]', msg);
  }

  function openAuth() { $id('authModal')?.classList.remove('hidden'); }
  function closeAuth() { $id('authModal')?.classList.add('hidden'); }
  function openAdmin() { if (!isAdmin()) { alert('Tài khoản Google này chưa có quyền admin.'); return; } window.open('admin.html', '_blank'); }
  function closeAdmin() { $id('adminModal')?.classList.add('hidden'); }

  function setupHeaderAuthUI() {
    const actions = document.querySelector('.globalTop .actions') || document.querySelector('#fc .actions') || document.querySelector('.actions');
    if (!actions || $id('authStatusBtn')) return;

    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminOpenBtn';
    adminBtn.className = 'btn adminBtn hidden';
    adminBtn.title = 'Dashboard quản trị';
    adminBtn.textContent = ''; adminBtn.style.display = 'none';
    adminBtn.onclick = () => window.open('admin.html', '_blank');

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

  function updateAuthUI() {
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

  function showPendingApproval() {
    const el = $id('hodPendingApproval');
    if (el) el.classList.remove('hidden');
    const emailEl = $id('hodPendingEmail');
    if (emailEl) emailEl.textContent = currentUser?.email || '';
    $id('hodLoginGate')?.classList.add('hidden');
    document.body?.classList.add('hod-locked');
  }
  function hidePendingApproval() {
    const el = $id('hodPendingApproval');
    if (el) el.classList.add('hidden');
  }


  // ===== APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 =====
  // Gửi thông báo đăng nhập web trực tiếp qua Discord webhook giống admin.js.
  async function sendLoginToDiscord(email, role) {
    const discordUrl = 'https://discord.com/api/webhooks/1519452717947420732/j-EVKdyuRYHRXU6MJbW9z_2lAy-wV2XnEOVULJEtDSgtignSVh2fWTTJKFgHj2MgoTJQ';

    let embedColor = 3447003;
    if (role === 'admin') embedColor = 10038562;
    else if (role === 'editor') embedColor = 3066993;

    const payload = {
      embeds: [{
        title: '🔑 NGƯỜI DÙNG ĐĂNG NHẬP WEB',
        color: embedColor,
        fields: [
          { name: '👤 Gmail', value: email || 'N/A', inline: true },
          { name: '🎭 Vai trò', value: role || 'user', inline: true },
          { name: '🌐 Nguồn', value: 'Web học', inline: true },
          { name: '🔗 Trang', value: location.href.split('#')[0] || 'N/A', inline: false },
          { name: '⏰ Thời điểm', value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), inline: false }
        ]
      }]
    };

    try {
      const res = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) console.warn('Discord login notify failed:', res.status, await res.text().catch(() => ''));
    } catch (error) {
      console.warn('Lỗi gửi thông báo login web:', error);
    }
  }
  async function notifyLoginToDiscordOnce() {
    if (!currentUser) return;
    const key = 'hod_web_login_discord_notified_' + currentUser.id;
    if (sessionStorage.getItem(key)) return;
    await sendLoginToDiscord(currentProfile?.email || currentUser.email, currentProfile?.role || 'user');
    sessionStorage.setItem(key, 'true');
  }
  let activeProfilePromise = null;
  async function loadProfile() {
    if (!client || !currentUser) { currentProfile = null; updateAuthUI(); return null; }
    if (activeProfilePromise) return activeProfilePromise;

    activeProfilePromise = (async () => {
      try {
        const now = new Date().toISOString();
        const base = { id: currentUser.id, email: currentUser.email, last_login: now, last_activity: now };

        // Role/quyền phải luôn lấy mới, không dùng cache cũ kẻo admin bị hiện thành user.
        try { window.clearLearningHubSupabaseCache?.('profiles'); } catch(e) {}

        let existing = null;
        const sel = await client.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
        if (!sel.error) existing = sel.data;
        else console.warn('Không đọc được profile:', sel.error);

        if (!existing) {
          let regMode = 'approval';
          try {
            const { data: setting } = await client.from('site_settings').select('value').eq('key', 'registration_mode').maybeSingle();
            if (setting && setting.value) {
              regMode = typeof setting.value === 'string' ? setting.value.replace(/"/g, '') : String(setting.value);
            }
          } catch (e) { console.warn('Không đọc được registration_mode, mặc định approval:', e); }

          if (regMode === 'closed') {
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
          // Giới hạn cập nhật last_login tối đa 1 lần mỗi 5 phút để tránh spam khi reload trang liên tục
          const lastLoginUpdateKey = 'lh_last_login_update_' + currentUser.id;
          const lastUpdate = sessionStorage.getItem(lastLoginUpdateKey);
          let updData = existing;

          if (!lastUpdate || Date.now() - Number(lastUpdate) > 5 * 60 * 1000) {
            const upd = await client.from('profiles')
              .update({ email: currentUser.email, last_login: now, last_activity: now })
              .eq('id', currentUser.id)
              .select('*')
              .single();
            if (upd.error) {
              console.warn('Không cập nhật last_login:', upd.error);
            } else {
              updData = upd.data;
              sessionStorage.setItem(lastLoginUpdateKey, String(Date.now()));
            }
          }

          currentProfile = { ...existing, ...(updData || {}) };
          if (existing?.role && (!updData?.role || updData.role === 'user')) currentProfile.role = existing.role;
          if (existing?.approved !== undefined && updData?.approved === undefined) currentProfile.approved = existing.approved;
          if (existing?.blocked !== undefined && updData?.blocked === undefined) currentProfile.blocked = existing.blocked;
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
      } finally {
        activeProfilePromise = null;
      }
    })();

    return activeProfilePromise;
  }

  async function loadQuestionsFromSupabase() {
    if (!client || !currentUser) return false;
    const activeSubject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    let query = client.from('questions').select('id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason').eq('is_active', true);
    if (activeSubject) query = query.eq('subject_code', activeSubject);
    const { data, error } = await query.order('num', { ascending: true });
    if (error) { console.warn(error); notify2('Không tải được questions từ Supabase.'); return false; }
    if (!data?.length) { notify2(activeSubject ? `Môn ${activeSubject} chưa có câu hỏi.` : 'Supabase chưa có câu hỏi. Hãy import seed trước.'); return false; }
    const mapped = data.map(rowToQuestion);
    RAW = mapped;
    pool = [...RAW];
    var _asub = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    var _sci = _asub ? (+localStorage.getItem('learninghub_progress_' + _asub) || 0) : ci;
    ci = Math.max(0, Math.min(_sci, pool.length - 1));
    flipped = false;
    if ($id('total')) $id('total').textContent = pool.length;
    renderCard();
    renderQuiz();
    renderStudy();
    notify2('Đã tải câu hỏi từ Supabase');
    return true;
  }


  async function signInGoogle() {
    if (!window.supabase) return alert('Không tải được Supabase. Kiểm tra mạng hoặc CDN.');
    if (!client) return alert('Supabase chưa sẵn sàng.');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] }
    });
    if (error) alert(error.message);
  }

  async function signIn() {
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

  async function signUp() {
    if (!client) return;
    const email = $id('authEmail')?.value.trim();
    const password = $id('authPassword')?.value;
    if (!email || !password) return alert('Nhập email và mật khẩu nha.');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Đã tạo tài khoản. Nếu Supabase yêu cầu xác nhận email, hãy xác nhận rồi đăng nhập.');
  }

  async function signOut() {
    if (!client) return;
    Object.keys(sessionStorage).filter(k => k.startsWith('hod_web_login_discord_notified_')).forEach(k => sessionStorage.removeItem(k));
    await client.auth.signOut();
    currentUser = null;
    currentProfile = null;
    updateAuthUI();
    notify2('Đã đăng xuất');
  }

  async function submitEditRequest(newDraft, oldQ) {
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

  async function loadPendingRequests() {
    if (!client || !isAdmin()) return;
    const list = $id('adminRequests');
    const count = $id('adminCount');
    if (list) list.innerHTML = '<div class="more">Đang tải...</div>';
    const { data, error } = await client.from('edit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) { if (list) list.innerHTML = '<div class="more">' + esc(error.message) + '</div>'; return; }
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
    list.querySelectorAll('[data-approve]').forEach(btn => btn.onclick = () => approveRequest(Number(btn.dataset.approve), data.find(x => x.id === Number(btn.dataset.approve))));
    list.querySelectorAll('[data-reject]').forEach(btn => btn.onclick = () => rejectRequest(Number(btn.dataset.reject)));
  }

  async function approveRequest(id, req) {
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
      images: qUpdate.images || [],
      has_image: !!(qUpdate.has_image || (qUpdate.images || []).length),
      error_risk: qUpdate.error_risk || 'low',
      error_risk_reason: qUpdate.error_risk_reason || null
    }).eq('id', req.question_id);
    if (qErr) return alert('Không cập nhật được question: ' + qErr.message);
    if (typeof window.clearLearningHubQuestionCache === 'function') {
      window.clearLearningHubQuestionCache();
    }

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
    try { await loadPendingRequests(); } catch (e) { console.warn('loadPendingRequests failed:', e); }
    try { await loadQuestionsFromSupabase(); } catch (e) { console.warn('loadQuestions failed:', e); }
  }

  async function rejectRequest(id) {
    if (!client || !isAdmin()) return alert('Chỉ admin mới từ chối được.');
    const note = prompt('Lý do từ chối (tuỳ chọn):') || '';
    const { error } = await client.from('edit_requests').update({
      status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: currentUser.id
    }).eq('id', id);
    if (error) return alert(error.message);
    notify2('Đã từ chối yêu cầu');
    try { await loadPendingRequests(); } catch (e) { console.warn('loadPendingRequests failed:', e); }
  }


  async function applyOAuthHashSession(supaClient) {
    try {
      let h = window.location.hash || '';
      if (!h) return false;
      h = h.replace(/^#/, '').replace(/&amp;/g, '&');
      const p = new URLSearchParams(h);
      const access_token = p.get('access_token');
      const refresh_token = p.get('refresh_token');
      if (!access_token || !refresh_token) return false;
      const { error } = await supaClient.auth.setSession({ access_token, refresh_token });
      if (error) { console.warn('setSession from hash failed:', error); return false; }
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    } catch (e) { console.warn('applyOAuthHashSession error:', e); return false; }
  }
  async function init() {
    setupHeaderAuthUI();
    $id('authGoogle')?.addEventListener('click', signInGoogle);
    $id('authLogin')?.addEventListener('click', signIn);
    $id('authSignup')?.addEventListener('click', signUp);
    $id('authClose')?.addEventListener('click', closeAuth);
    $id('adminClose')?.addEventListener('click', closeAdmin);
    $id('adminReload')?.addEventListener('click', loadPendingRequests);
    $id('hodPendingRefresh')?.addEventListener('click', async () => {
      const btn = $id('hodPendingRefresh');
      if (btn) { btn.disabled = true; btn.textContent = 'Đang kiểm tra...'; }
      await loadProfile();
      if (currentProfile?.approved !== false) await loadQuestionsFromSupabase();
      if (btn) { btn.disabled = false; btn.textContent = 'Kiểm tra lại'; }
    });
    $id('hodPendingLogout')?.addEventListener('click', async () => {
      await signOut();
      hidePendingApproval();
    });

    if (!configured()) { updateAuthUI(); return; }
    client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    await applyOAuthHashSession(client);
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) { const prof = await loadProfile(); if (prof) await loadQuestionsFromSupabase(); }
    else updateAuthUI();

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) { const prof = await loadProfile(); if (prof) await loadQuestionsFromSupabase(); }
      else { currentProfile = null; updateAuthUI(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, isReady, isAdmin, submitEditRequest, loadQuestionsFromSupabase, openAuth, openAdmin, signOut, signInGoogle, getUser: () => currentUser, getProfile: () => currentProfile, get __client() { return client; } };
})();

// ===== HOD Login + Admin UI (added) =====
(function () {
  function $(id) { return document.getElementById(id); }
  function hideLanding() { $('hodLoginScreen')?.classList.add('hidden'); }
  function openLogin() { hideLanding(); if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth(); else alert('Supabase UI chưa sẵn sàng, hãy tải lại trang.'); }
  function openAdmin() { hideLanding(); if (window.HODSupabase?.isAdmin?.()) window.HODSupabase.openAdmin(); else { if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth(); setTimeout(() => alert('Đăng nhập tài khoản admin trước. Sau đó bấm nút Admin lại.'), 80); } }
  function bind() {
    $('hodGuestEnter')?.addEventListener('click', hideLanding);
    $('hodOpenLogin')?.addEventListener('click', openLogin);
    $('hodOpenAdmin')?.addEventListener('click', openAdmin);
    $('hodFloatLogin')?.addEventListener('click', openLogin);
    $('hodFloatAdmin')?.addEventListener('click', openAdmin);
    const box = document.querySelector('#authModal .box.authBox');
    if (box && !document.getElementById('hodAuthExtraHint')) {
      const hint = document.createElement('div');
      hint.id = 'hodAuthExtraHint';
      hint.className = 'hodAuthHint';
      hint.textContent = 'Người học dùng Đăng nhập/Đăng ký. Admin đăng nhập bằng tài khoản đã được set role = admin trong Supabase.';
      box.appendChild(hint);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();

// ===== Admin visibility hard fix =====
(function () {
  function applyAdminGuard() {
    const isAdmin = !!window.HODSupabase?.isAdmin?.();
    document.body?.classList.toggle('hod-is-admin', isAdmin);
    ['adminOpenBtn', 'hodFloatAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('hidden', !isAdmin);
      el.style.display = isAdmin ? '' : 'none';
    });
    const modal = document.getElementById('adminModal');
    if (modal && !isAdmin) modal.classList.add('hidden');
  }
  function patchOpenAdmin() {
    if (!window.HODSupabase || window.HODSupabase.__adminGuardPatched) return;
    const oldOpen = window.HODSupabase.openAdmin;
    window.HODSupabase.openAdmin = function () {
      if (!window.HODSupabase.isAdmin?.()) {
        document.getElementById('adminModal')?.classList.add('hidden');
        alert('Tài khoản Google này chưa có quyền admin.');
        applyAdminGuard();
        return;
      }
      return oldOpen?.apply(this, arguments);
    };
    window.HODSupabase.__adminGuardPatched = true;
  }
  function tick() { patchOpenAdmin(); applyAdminGuard(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 500);
})();

// ===== ACCOUNT AVATAR CLEAN FINAL =====
(function () {
  function $(id) { return document.getElementById(id) }
  function user() { return window.HODSupabase?.getUser?.() || null }
  function profile() { return window.HODSupabase?.getProfile?.() || null }
  function isAdmin() { return !!window.HODSupabase?.isAdmin?.() }
  function email() { return profile()?.email || user()?.email || '' }
  function meta() { return user()?.user_metadata || {} }
  function avatarHTML() { const u = meta().avatar_url || meta().picture || ''; const e = email(); const l = (e || 'U').trim().charAt(0).toUpperCase(); return u ? '<img src="' + esc(u) + '" alt="avatar">' : l }
  function ensureAvatar() { const actions = document.querySelector('.globalTop .actions') || document.querySelector('#fc .actions') || document.querySelector('.actions'); if (!actions || $('hodTopAvatar')) return; const btn = document.createElement('button'); btn.id = 'hodTopAvatar'; btn.className = 'hodTopAvatar'; btn.type = 'button'; btn.onclick = toggleMenu; actions.appendChild(btn) }
  function toggleMenu() { if (!user()) return showLogin(); updateMenu(); $('hodAccountMenu')?.classList.toggle('hidden') }
  function showLogin() { if (window.__LOCAL_DEV_MODE) return; document.body?.classList.add('hod-locked'); $('hodLoginGate')?.classList.remove('hidden'); $('hodAccountMenu')?.classList.add('hidden'); $('hodPendingApproval')?.classList.add('hidden'); }
  function hideLogin() { document.body?.classList.remove('hod-locked'); $('hodLoginGate')?.classList.add('hidden'); }
  function login() { const api = window.HODSupabase; if (!api) { alert('Supabase chưa sẵn sàng, hãy tải lại trang.'); return } if (api.signInGoogle) { api.signInGoogle(); return } api.openAuth?.() }
  async function logout() { await window.HODSupabase?.signOut?.(); showLogin(); updateAll() }
  function openDash() { if (isAdmin()) window.open('admin.html', '_blank'); else alert('Tài khoản này không có quyền admin.') }
  function updateMenu() { const admin = isAdmin(); const mail = $('hodAccountEmail'); if (mail) mail.textContent = email() || 'Chưa đăng nhập'; const role = $('hodAccountRole'); if (role) role.textContent = admin ? 'Admin' : 'Người học'; const av = $('hodAccountAvatarBig'); if (av) av.innerHTML = avatarHTML(); $('hodAccountDashboard')?.classList.toggle('hidden', !admin) }
  function updateAll() { ensureAvatar(); const u = user(); const p = profile(); const admin = isAdmin(); const pending = u && p && p.approved === false; document.body?.classList.toggle('hod-is-admin-final', admin); if (pending) { $('hodLoginGate')?.classList.add('hidden'); $('hodPendingApproval')?.classList.remove('hidden'); document.body?.classList.add('hod-locked'); const emailEl = $('hodPendingEmail'); if (emailEl) emailEl.textContent = p.email || u.email || ''; } else if (u) { hideLogin(); $('hodPendingApproval')?.classList.add('hidden'); } else { showLogin(); } const top = $('hodTopAvatar'); if (top) { top.innerHTML = avatarHTML(); top.style.display = (u && !pending) ? 'grid' : 'none' } const headerAdmin = $('adminOpenBtn'); if (headerAdmin) { headerAdmin.remove(); } if (!admin) $('adminModal')?.classList.add('hidden'); updateMenu() }
  function patchAdmin() { if (!window.HODSupabase || window.HODSupabase.__avatarCleanPatch) return; const old = window.HODSupabase.openAdmin; window.HODSupabase.openAdmin = function () { if (!window.HODSupabase.isAdmin?.()) { $('adminModal')?.classList.add('hidden'); alert('Tài khoản này không có quyền admin.'); return } return old?.apply(this, arguments) }; window.HODSupabase.__avatarCleanPatch = true }
  function bind() { $('hodGateLoginBtn')?.addEventListener('click', login); $('hodLogoutBtn')?.addEventListener('click', logout); $('hodAccountDashboard')?.addEventListener('click', openDash); document.addEventListener('click', e => { const m = $('hodAccountMenu'), a = $('hodTopAvatar'); if (m && !m.contains(e.target) && a && !a.contains(e.target)) m.classList.add('hidden') }); setInterval(() => { patchAdmin(); updateAll() }, 500); setTimeout(() => { patchAdmin(); updateAll() }, 250) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();







// ===== LEARNING HUB MERGED SUBJECT PATCH START =====
(function () {
  const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || '';
  const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  let subjectClient = null, subjectsCache = [], pickedCode = localStorage.getItem(SUBJECT_STORE) || '', lock = false;
  function c() { if (window.HODSupabase?.__client) return window.HODSupabase.__client; if (!window.supabase) return null; if (!subjectClient) subjectClient = window.supabase.createClient(HUB_URL, HUB_KEY); return subjectClient; }
  function $(id) { return document.getElementById(id); }
  function esc2(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function displayCode(code) { return String(code || '').replace(/_\d+$/i, ''); }
  function user() { return window.HODSupabase?.getUser?.() || null; }
  function logged() { return !!user(); }
  function subjectCode() { return localStorage.getItem(SUBJECT_STORE) || ''; }
  function setSubject(code) { if (code) localStorage.setItem(SUBJECT_STORE, code); else localStorage.removeItem(SUBJECT_STORE); pickedCode = code || ''; syncSubjectTexts(); }
  function meta(code) { return subjectsCache.find(x => x.code === code) || null; }
  function label(code) { const m = meta(code); return m ? `${displayCode(m.code)} · ${m.name || ''}` : (displayCode(code) || 'Chưa chọn môn'); }
  function notifyUX(msg) { if (typeof notify === 'function') notify(msg); else console.log(msg); }
  function syncSubjectTexts() { const code = subjectCode(); if ($('subjectInlineText')) $('subjectInlineText').textContent = code ? label(code) : 'Chưa chọn môn'; if ($('hodAccountSubjectText')) $('hodAccountSubjectText').textContent = code ? label(code) : 'Chưa chọn môn'; ensureChip(); const chip = $('subjectTopChip'); if (chip) { chip.textContent = code ? label(code) : 'Chọn môn'; chip.classList.toggle('hidden', !logged()); } }
  function ensureChip() { const actions = document.querySelector('#fc .actions') || document.querySelector('.actions'); if (!actions || $('subjectTopChip')) return; const b = document.createElement('button'); b.id = 'subjectTopChip'; b.type = 'button'; b.className = 'subjectChip hidden'; b.onclick = () => openGate(); actions.prepend(b); }
  function updateBrand(code) { const b = document.querySelector('.brand'); if (!b) return; const m = meta(code) || { code: code || 'LEARN', name: code ? '' : 'Hub' }; const dc = displayCode(m.code || 'LEARN'); b.innerHTML = `${esc2(dc)}<span>${esc2(m.name ? ' / ' + m.name : ' Hub')}</span>`; }
  function closeAccountMenu() { $('hodAccountMenu')?.classList.add('hidden'); }
  function gateOn(on) { document.body.classList.toggle('has-subject-gate', !!on); $('subjectGate')?.classList.toggle('hidden', !on); $('subjectGate')?.setAttribute('aria-hidden', on ? 'false' : 'true'); }
  function showErr(msg) { const e = $('subjectError'); if (e) { e.textContent = msg; e.classList.remove('hidden'); } }
  function clearErr() { $('subjectError')?.classList.add('hidden'); }
  function showLoading(on, msg = 'Đang tải danh sách môn học...') { const e = $('subjectLoading'); if (e) { e.textContent = msg; e.classList.toggle('hidden', !on); } }
  function fallbackSubjects() { return [{ code: 'HOD102', name: 'HOD102 Learning', description: 'Môn mặc định để bắt đầu học.', cover: '', is_active: true, question_count: 0 }, { code: 'MLN111', name: 'MLN111 Learning', description: 'Bộ câu hỏi và tài liệu MLN111.', cover: '', is_active: true, question_count: 0 }]; }
  async function addQuestionCounts(subjects) {
const list = subjects || [];
// Giảm gọi Supabase: không query questions ở bước render môn.
// Số câu lấy từ subjects nếu có, hoặc cache localStorage đã đếm một lần.
let store = { counts: {}, confirmed: {} };
try { store = JSON.parse(localStorage.getItem('learninghub_subject_counts_cache_v3') || '{}') || store; } catch(e) {}
store.counts = store.counts || {};
store.confirmed = store.confirmed || {};
const active = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
const current = {};
try {
  (RAW || []).forEach(q => {
    const code = q.subject_code || active || '';
    if(code) current[code] = (current[code] || 0) + 1;
  });
} catch(e) {}
return list.map(s => {
  const code = s.code || '';
  let n = s.question_count ?? s.questions_count ?? s.count;
  if(n === undefined || n === null || Number(n) === 0) n = current[code] ?? store.counts[code] ?? 0;
  n = Number(n);
  if(!Number.isFinite(n)) n = 0;
  return { ...s, question_count: n };
});
}
async function getSubjects() { const supa = c(); if (!supa || !logged()) return fallbackSubjects(); const { data, error } = await supa.from('subjects').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('code', { ascending: true }); if (error || !data || !data.length) { console.warn(error || 'No subjects'); showErr('Không tải được danh sách môn học. Đang dùng môn mặc định.'); return fallbackSubjects(); } return await addQuestionCounts(data); }
  function card(s) {
    const rawCode = String(s.code || '');
    const code = esc2(displayCode(rawCode));
    const name = esc2(s.name || displayCode(rawCode) || 'Chưa có tên môn');
    const desc = esc2(s.description || 'Môn học chưa có mô tả.');
    const rawCount = Number(s.question_count ?? s.questions_count ?? s.count);
    const countText = Number.isFinite(rawCount) ? `${rawCount} câu` : '— câu';
    const status = s.is_active === false ? 'Tạm ẩn' : countText;
    const chosen = pickedCode === s.code;
    return `<button class="subjectCard ${chosen ? 'active' : ''}" data-code="${esc2(rawCode)}" type="button" title="${code} - ${name} - ${countText}">
      <span class="subjectCardCode"><span>${code}</span></span>
      <span class="subjectCardTitle">${name}</span>
      <span class="subjectCardDesc">${desc}</span>
      <span class="subjectMeta">
        <span>${status}</span>
        <span class="subjectChoose">${chosen ? 'Đã chọn' : 'Chọn môn'}</span>
      </span>
    </button>`;
  }
  function applyPicked() {
    if ($('subjectPickedText')) $('subjectPickedText').textContent = pickedCode ? label(pickedCode) : 'Chưa chọn môn';
    if ($('subjectEnter')) $('subjectEnter').disabled = !pickedCode;
    document.querySelectorAll('.subjectCard').forEach(x => {
      const active = x.dataset.code === pickedCode;
      x.classList.toggle('active', active);
      x.setAttribute('aria-pressed', active ? 'true' : 'false');
      const choose = x.querySelector('.subjectChoose');
      if (choose) choose.textContent = active ? 'Đã chọn' : 'Chọn môn';
    });
  }
  function renderSubjects() { const list = $('subjectList'); if (!list) return; const q = (($('subjectSearch')?.value) || '').trim().toLowerCase(); const arr = subjectsCache.filter(s => !q || `${s.code || ''} ${s.name || ''} ${s.description || ''}`.toLowerCase().includes(q)); list.innerHTML = arr.map(card).join(''); $('subjectEmpty')?.classList.toggle('hidden', !!arr.length); list.querySelectorAll('.subjectCard').forEach(x => x.onclick = () => { pickedCode = x.dataset.code; applyPicked(); }); applyPicked(); }
  let lastRefreshTime = 0;
  async function refreshSubjects() {
    const now = Date.now();
    if (now - lastRefreshTime < 5000) {
      console.warn('[refreshSubjects] Bị chặn do gọi quá nhanh (throttle 5s)');
      return;
    }
    lastRefreshTime = now;
    if (!logged()) return;
    clearErr();
    showLoading(true);
    try {
      subjectsCache = await getSubjects();
      if (!pickedCode && subjectCode()) pickedCode = subjectCode();
      if (!pickedCode && subjectsCache[0]) pickedCode = subjectsCache[0].code;
      renderSubjects();
      syncSubjectTexts();
    } finally {
      showLoading(false);
    }
  }
  let lastOpenGateTime = 0;
  function openGate() {
    const now = Date.now();
    if (now - lastOpenGateTime < 3000) {
      console.warn('[openGate] Bị chặn do gọi quá nhanh (throttle 3s)');
      return;
    }
    lastOpenGateTime = now;
    if (!logged()) return;
    localStorage.setItem('learninghub_subject_gate_open_v1', 'true');
    if ($('subjectUserEmail')) $('subjectUserEmail').textContent = user()?.email || 'Chưa đăng nhập';
    gateOn(true);
    closeAccountMenu();
    refreshSubjects();
  }
  function closeGate() {
    localStorage.setItem('learninghub_subject_gate_open_v1', 'false');
    gateOn(false);
  }
  async function loadBySubject(code) { const supa = c(); if (!supa || !logged() || !code) return false; const { data, error } = await supa.from('questions').select('id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason').eq('is_active', true).eq('subject_code', code).order('num', { ascending: true }); if (error) { console.warn(error); notifyUX('Không tải được dữ liệu môn học.'); return false; } if (!data || !data.length) { RAW = []; pool = []; ci = 0; if ($('idx')) $('idx').textContent = '0'; if ($('total')) $('total').textContent = '0'; try { renderStudy() } catch (e) { } try { renderQuiz() } catch (e) { } notifyUX(`Môn ${code} chưa có dữ liệu.`); return false; } RAW = data.map(r => ({ id: r.id, subject_code: r.subject_code || code, num: r.num, question: r.question, options: r.options || {}, answer: r.answer, answer_text: r.answer_text, images: (typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || []), has_image: !!(r.has_image || (r.images || []).length), error_risk: r.error_risk || 'low', error_risk_reason: r.error_risk_reason || '' })); pool = [...RAW]; var _saved = +localStorage.getItem('learninghub_progress_' + code) || 0; ci = Math.max(0, Math.min(_saved, pool.length - 1)); flipped = false; if ($('idx')) $('idx').textContent = String(ci + 1); if ($('total')) $('total').textContent = String(pool.length); updateBrand(code); syncSubjectTexts(); try { renderCard() } catch (e) { } try { renderQuiz() } catch (e) { } try { renderStudy() } catch (e) { } notifyUX(`Đã tải ${label(code)}`); return true; }
  async function enterSubject() { if (!pickedCode) return; setSubject(pickedCode); closeGate(); if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(false); else await loadBySubject(pickedCode); }
  async function logoutGate() { closeGate(); setSubject(''); await window.HODSupabase?.signOut?.(); }
  function patchSubmit() { if (window.__hubPatchSubmitMerged || !window.HODSupabase?.submitEditRequest) return; window.__hubPatchSubmitMerged = true; const old = window.HODSupabase.submitEditRequest.bind(window.HODSupabase); window.HODSupabase.submitEditRequest = async function (newDraft, oldQ) { if (oldQ?.id) return old(newDraft, oldQ); const supa = c(); const code = oldQ?.subject_code || subjectCode(); const num = oldQ?.num; if (supa && code && num) { const { data, error } = await supa.from('questions').select('id,subject_code').eq('subject_code', code).eq('num', num).maybeSingle(); if (!error && data) oldQ = { ...oldQ, id: data.id, subject_code: data.subject_code || code }; } return old(newDraft, oldQ); }; }
  function patchSave() { if (window.__hubPatchSaveMerged || typeof saveEditor !== 'function') return; window.__hubPatchSaveMerged = true; const old = saveEditor; saveEditor = async function () { let oldQ = clone(RAW.find(c => c.num === editDraft.num) || pool[ci] || editDraft); editDraft.question = $('editQuestion').value.trim(); editDraft.answer = $('editAnswer').value.trim().toUpperCase(); let ops = {}; document.querySelectorAll('[data-opt]').forEach(t => { if (t.value.trim()) ops[t.dataset.opt] = t.value.trim(); }); editDraft.options = ops; editDraft.answer_text = answerText(editDraft); editDraft.subject_code = subjectCode(); if (window.HODSupabase && window.HODSupabase.isReady()) { await window.HODSupabase.submitEditRequest(editDraft, oldQ); return; } return old(); }; }
  function patchSignOut() { if (window.__hubPatchSignoutMerged || !window.HODSupabase?.signOut) return; window.__hubPatchSignoutMerged = true; const old = window.HODSupabase.signOut.bind(window.HODSupabase); window.HODSupabase.signOut = async function () { setSubject(''); return old(); }; }
  function ensureChangeBtn() { if (!$('hodChangeSubjectBtn')) return; $('hodChangeSubjectBtn').onclick = e => { e?.preventDefault?.(); openGate(); }; }
  function isApproved() { const p = window.HODSupabase?.getProfile?.() || null; return !p || p.approved !== false; }
  function bind() {
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
    const runSubjectCheckOnce = () => {
      if (window.__LHCheckedOnce) return;
      if (!logged() || !isApproved()) return;
      window.__LHCheckedOnce = true;
      syncSubjectTexts();
      const isGateOpen = localStorage.getItem('learninghub_subject_gate_open_v1') === 'true';
      if (subjectCode() && !isGateOpen) loadBySubject(subjectCode());
      else openGate();
    };

    runSubjectCheckOnce();
    setTimeout(runSubjectCheckOnce, 800);
  }
  window.getSubjectsCache = () => subjectsCache;
  window.loadBySubject = loadBySubject;
  window.setSubject = setSubject;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====


// ===== ADD_SUBJECT_FEATURE_20260625 (UPGRADED TAB UX/UI) =====
(function () {
  const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || '';
  const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
  const $ = id => document.getElementById(id);
  let supa = null;
  function client() { if (!window.supabase) return null; if (!supa) supa = window.supabase.createClient(HUB_URL, HUB_KEY); return supa; }
  function esc2(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[c])) }

  function isLoggedIn() {
    return !!window.HODSupabase?.getUser?.();
  }
  function isAdminOrEditor() {
    const p = window.HODSupabase?.getProfile?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return isLoggedIn() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function canAdd() {
    const p = window.HODSupabase?.getProfile?.() || null;
    return isLoggedIn() && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
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
  window.__switchSubjectGateTab = function (mode) {
    const isAdd = mode === 'add';
    localStorage.setItem('learninghub_subject_gate_tab_v1', mode);

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
        restoreAddSubjectState();
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

    const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
    if (savedTab === 'add' && canAdd()) {
      window.__switchSubjectGateTab('add');
    } else {
      window.__switchSubjectGateTab('list');
    }
  }

  function showAddBtn() {
    ensureSubjectGateTabs();
    const btn = $('addSubjectBtn');
    const tabBtn = $('subjectGateTabAdd');
    const allowed = canAdd();
    if (btn) btn.classList.toggle('hidden', !allowed);

    const note = $('userApprovalNote');
    if (note) {
      note.style.setProperty('display', (allowed && !isAdminOrEditor()) ? 'block' : 'none', 'important');
    }

    if (tabBtn) {
      const wasHidden = tabBtn.style.display === 'none';
      tabBtn.style.display = allowed ? 'block' : 'none';
      if (allowed && wasHidden) {
        const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
        if (savedTab === 'add') {
          window.__switchSubjectGateTab('add');
        }
      }
    }
  }

  const AI_PROMPT = `Bạn là trợ lý chuyển đổi ngân hàng câu hỏi trắc nghiệm sang JSON trong file Markdown.

ĐỌC FILE và chuyển đổi NGUYÊN VẸN (KHÔNG tự biên thêm, KHÔNG bỏ bớt).

QUY TẮC BATCH:

- Sau mỗi batch DỪNG và nói: "Gõ 'tiếp' để xuất câu X-Y."
- Khi nhận "tiếp", xuất batch tiếp theo, đánh số "num" liên tục.
- Mỗi batch xuất 1 file .md hoàn chỉnh, tải được ngay.

QUY TẮC CHUYỂN ĐỔI:
- Đáp án: chỉ lấy ký tự chữ cái đầu tiên sau "**Đáp án:**" (bỏ mọi chú thích phía sau).
- Nếu câu chỉ có A/B/C (không có D): bỏ key "D" khỏi object options.
- Giữ NGUYÊN nội dung câu hỏi và lựa chọn, KHÔNG paraphrase.
- "has_image": false (trừ khi câu đề cập hình ảnh/biểu đồ).
- "error_risk": "low" (câu ngắn, rõ) | "medium" (câu trung bình) | "high" (câu dài, phức tạp, dễ nhầm).

FORMAT FILE .MD OUTPUT:
---
# [Tên môn] - Batch [N] (Câu [X]-[Y])
> Xuất ngày: [ngày hôm nay] | Tổng: [số câu trong batch] câu
---

\`\`\`json
[
  {
    "num": 1,
    "question": "…?",
    "options": {
      "A": "…",
      "B": "…",
      "C": "…",
      "D": "…"
    },
    "answer": "B",
    "images": [],
    "has_image": false,
    "error_risk": "low"
  }
]
\`\`\`
---

KHÔNG thêm bất kỳ text giải thích nào bên ngoài cấu trúc trên.
Bắt đầu ngay từ câu 1.`;

  window.__ADD_SUBJECT_AI_PROMPT = AI_PROMPT;
  let parsedQuestions = [];

  function clearAddSubjectLocalStorage() {
    localStorage.removeItem('learninghub_add_subject_code_v1');
    localStorage.removeItem('learninghub_add_subject_name_v1');
    localStorage.removeItem('learninghub_add_subject_desc_v1');
    localStorage.removeItem('learninghub_add_subject_step_v1');
    localStorage.removeItem('learninghub_add_subject_file_name_v1');
    localStorage.removeItem('learninghub_add_subject_file_size_v1');
    localStorage.removeItem('learninghub_add_subject_file_data_v1');
    localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
  }

  function restoreAddSubjectState() {
    const code = localStorage.getItem('learninghub_add_subject_code_v1') || '';
    const name = localStorage.getItem('learninghub_add_subject_name_v1') || '';
    const desc = localStorage.getItem('learninghub_add_subject_desc_v1') || '';
    const savedStep = parseInt(localStorage.getItem('learninghub_add_subject_step_v1') || '1');

    const codeInp = $('addSubjectCode');
    const nameInp = $('addSubjectName');
    const descInp = $('addSubjectDesc');

    if (codeInp) codeInp.value = code;
    if (nameInp) nameInp.value = name;
    if (descInp) descInp.value = desc;

    codeInp?.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      localStorage.setItem('learninghub_add_subject_code_v1', this.value);
    });
    nameInp?.addEventListener('input', function () {
      localStorage.setItem('learninghub_add_subject_name_v1', this.value);
    });
    descInp?.addEventListener('input', function () {
      localStorage.setItem('learninghub_add_subject_desc_v1', this.value);
    });

    const fileName = localStorage.getItem('learninghub_add_subject_file_name_v1');
    const fileSize = localStorage.getItem('learninghub_add_subject_file_size_v1');
    const fileData = localStorage.getItem('learninghub_add_subject_file_data_v1');

    if (fileName && fileData) {
      if ($('userImportData')) $('userImportData').value = fileData;
      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if (dropZone) dropZone.classList.add('hidden');
      if (card) card.classList.remove('hidden');
      if (nameEl) nameEl.textContent = fileName;
      if (metaEl) metaEl.textContent = Math.max(1, Math.round(parseInt(fileSize || '0') / 1024)) + ' KB · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if (pv) { pv.classList.remove('hidden'); pv.disabled = false; }
      
      const wasPreviewed = localStorage.getItem('learninghub_add_subject_file_previewed_v1') === 'true';
      if (wasPreviewed) {
        setTimeout(() => {
          if (typeof window.__previewUserImport === 'function') {
            window.__previewUserImport();
          }
        }, 100);
      }
    }

    $('userImportFile')?.addEventListener('change', handleFileImport);

    if (savedStep > 1 && code && name) {
      setTimeout(() => {
        window.__switchStep(savedStep);
      }, 50);
    }
  }

  // MÃ MỚI: Giao diện form chia 3 bước (Stepper)
  function getAddSubjectHTML() {
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
      
      <div class="userApprovalNote" id="userApprovalNote" style="margin-top:15px; display:none;">⏳ Yêu cầu sẽ được gửi cho admin duyệt trước.</div>
    </div>`;
  }

  // Logic chuyển bước & Khởi tạo tính năng kéo thả
  window.__switchStep = function (step) {
    // Bắt buộc nhập mã môn + tên môn trước khi qua bước 2 (Prompt)
    if (step >= 2) {
      const code = (document.getElementById('addSubjectCode')?.value || '').trim();
      const name = (document.getElementById('addSubjectName')?.value || '').trim();
      if (!code) { alert('Vui lòng nhập mã môn trước khi tiếp tục.'); document.getElementById('addSubjectCode')?.focus(); return; }
      if (!name) { alert('Vui lòng nhập tên môn trước khi tiếp tục.'); document.getElementById('addSubjectName')?.focus(); return; }
    }

    localStorage.setItem('learninghub_add_subject_step_v1', step);

    // Ẩn tất cả các bước
    document.querySelectorAll('.add-step-content').forEach(el => el.classList.remove('active'));
    // Hiện bước hiện tại
    const target = document.getElementById('addStep' + step);
    if (target) target.classList.add('active');

    // Đổi màu thanh tiến trình
    document.querySelectorAll('.subject-stepper .step').forEach(el => {
      const s = parseInt(el.getAttribute('data-step'));
      if (s <= step) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Kích hoạt tính năng kéo thả file ở Bước 3
    if (step === 3 && !window._dropZoneInit) {
      const dropZone = document.getElementById('importDropZone');
      const fileInput = document.getElementById('userImportFile');
      if (dropZone && fileInput) {
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
          if (dt.files && dt.files.length) {
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


  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const text = reader.result;
      let jsonStr = text;
      const mdMatch = text.match(/```json\s*([\s\S]*?)```/);
      if (mdMatch) jsonStr = mdMatch[1];
      else {
        const jsonMatch = text.match(/```\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
      }
      const cleanedData = jsonStr.trim();
      if ($('userImportData')) $('userImportData').value = cleanedData;

      // Lưu file data vào localStorage
      localStorage.setItem('learninghub_add_subject_file_name_v1', file.name);
      localStorage.setItem('learninghub_add_subject_file_size_v1', String(file.size));
      localStorage.setItem('learninghub_add_subject_file_data_v1', cleanedData);
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if (dropZone) dropZone.classList.add('hidden');
      if (card) card.classList.remove('hidden');
      if (nameEl) nameEl.textContent = file.name;
      if (metaEl) metaEl.textContent = Math.max(1, Math.round(file.size / 1024)) + ' KB · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if (pv) { pv.classList.remove('hidden'); pv.disabled = false; }
      const saveBtn = $('userImportBtn');
      if (saveBtn) saveBtn.disabled = true;
      parsedQuestions = [];
      notify('Đã đọc file ' + file.name + '. Bấm Xem trước để kiểm tra.');
    };
    reader.readAsText(file);
  }

  window.__previewUserImport = function () {
    const raw = ($('userImportData')?.value || '').trim();
    const btn = $('userImportBtn');
    if (!raw) { alert('Bạn hãy chọn file .md / .txt / .json trước.'); return; }

    let data;
    try {
      var jsonBlocks = raw.match(/```json\s*([\s\S]*?)```/g);
      if (jsonBlocks && jsonBlocks.length > 0) {
        data = [];
        jsonBlocks.forEach(function (block) {
          var cleaned = block.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          var parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) data = data.concat(parsed);
          else if (parsed.questions && Array.isArray(parsed.questions)) data = data.concat(parsed.questions);
        });
      } else {
        var cleaned = raw;
        if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\w*\s*/, '').replace(/```\s*$/, '');
        data = JSON.parse(cleaned);
      }
    } catch (e) {
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
      alert('JSON không hợp lệ. Hãy kiểm tra lại format.\n\nLỗi: ' + e.message);
      return;
    }

    if (!Array.isArray(data)) {
      if (data.questions && Array.isArray(data.questions)) data = data.questions;
      else {
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
        alert('Dữ liệu phải là mảng JSON [...]');
        return;
      }
    }

    const errors = [];
    data.forEach((q, i) => {
      if (!q.question) errors.push('Câu ' + (i + 1) + ': thiếu "question"');
      if (!q.options || typeof q.options !== 'object') errors.push('Câu ' + (i + 1) + ': thiếu "options"');
      if (!q.answer) errors.push('Câu ' + (i + 1) + ': thiếu "answer"');
    });
    if (errors.length) {
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
      alert('Dữ liệu có lỗi:\n\n' + errors.slice(0, 10).join('\n'));
      return;
    }

    localStorage.setItem('learninghub_add_subject_file_previewed_v1', 'true');
    parsedQuestions = data;
    window.__previewSelections = {};
    const metaEl = $('userImportFileMeta');
    if (metaEl) metaEl.textContent = data.length + ' câu hỏi đã kiểm tra · Có thể lưu';
    if (btn) btn.disabled = false;
    window.__openImportPreviewModal(data);
    notify('OK! ' + data.length + ' câu hỏi sẵn sàng');
  };

  window.__closeImportPreviewModal = function () {
    document.getElementById('importPreviewModal')?.classList.add('hidden');
  };


  window.__submitSubjectRequest = async function () {
    const code = ($('addSubjectCode')?.value || '').trim().toUpperCase();
    const name = ($('addSubjectName')?.value || '').trim();
    const desc = ($('addSubjectDesc')?.value || '').trim();

    if (!code) { alert('Vui lòng nhập mã môn'); $('addSubjectCode')?.focus(); return; }
    if (!/^[A-Z0-9_]{2,20}$/.test(code)) { alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)'); $('addSubjectCode')?.focus(); return; }
    if (!name) { alert('Vui lòng nhập tên môn'); $('addSubjectName')?.focus(); return; }
    if (!parsedQuestions.length) { alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.'); return; }

    const c = client();
    if (!c) { alert('Chưa kết nối Supabase'); return; }

    const btn = $('userImportBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

    // Hiển thị thanh tiến trình ngay từ khi bắt đầu
    showProgress('Bắt đầu khởi tạo môn học...', 0, 100, 'Đang chuẩn bị dữ liệu...');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Cho phép trùng mã môn + tên môn (nhiều bộ câu hỏi cùng mã)

      let successMsg = '';
      if (isAdminOrEditor()) {
        // Cho phép thêm nhiều môn cùng mã gốc: HOD102, HOD102_2, HOD102_3...
        // Như vậy không bị lỗi trùng câu số 1,2,3... trong database.
        let finalCode = code;
        const { data: existedList } = await c.from('subjects').select('code').or('code.eq.' + code + ',code.like.' + code + '_%');
        const usedCodes = new Set((existedList || []).map(x => String(x.code || '').toUpperCase()));
        if (usedCodes.has(finalCode)) {
          let n = 2;
          while (usedCodes.has(code + '_' + n)) n++;
          finalCode = code + '_' + n;
        }

        const maxOrder = await c.from('subjects').select('sort_order').order('sort_order', { ascending: false }).limit(1);
        const nextOrder = ((maxOrder.data?.[0]?.sort_order) || 0) + 1;
        const { error } = await c.from('subjects').insert({
          code: finalCode, name: name || code, description: desc || null,
          is_active: true, sort_order: nextOrder
        });
        if (error) { alert('Lỗi tạo môn: ' + error.message); return; }

        let success = 0, errors = 0, firstErr = '';
        const total = parsedQuestions.length;
        for (let i = 0; i < total; i++) {
          const q = parsedQuestions[i];
          // Nhường luồng cho trình duyệt vẽ lại giao diện tiến trình
          showProgress('Đang lưu câu hỏi...', i + 1, total, `Đang xử lý câu ${q.num || i + 1}: ${q.question ? q.question.substring(0, 50) + '...' : ''}`);
          await new Promise(r => setTimeout(r, 10));

          const list = q.images || [];
          const localHasImg = !!(list.length || q.has_image);
          const text = (q.question || '') + ' ' + Object.values(q.options || {}).join(' ');
          const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
          const hasPlaceholder = list.some(im => {
            const src = typeof im === 'string' ? im : (im.src || im.url || im.secure_url || '');
            return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
          });

          let risk = q.error_risk || '';
          let reason = q.error_risk_reason || '';
          if (!risk) {
            if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) {
              risk = 'high';
              reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
            } else if ((q.answer || '').length > 1) {
              risk = 'medium';
              reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
            } else {
              risk = 'low';
            }
          }

          const payload = {
            subject_code: finalCode,
            num: q.num || (i + 1),
            question: q.question || '',
            options: q.options || {},
            answer: (q.answer || '').toUpperCase(),
            answer_text: q.answer_text || '',
            images: q.images || [],
            is_active: true,
            updated_at: new Date().toISOString(),
            has_image: localHasImg || needsImg,
            error_risk: risk,
            error_risk_reason: reason || null
          };
          const r = await c.from('questions').insert(payload);
          if (r.error) { errors++; if (!firstErr) firstErr = r.error.message; }
          else success++;
        }
        successMsg = 'Đã thêm môn ' + finalCode + ' với ' + success + ' câu hỏi' + (errors ? ' (' + errors + ' lỗi: ' + firstErr + ')' : '');
        try {
          const key = 'learninghub_subject_counts_cache_v3';
          const store = JSON.parse(localStorage.getItem(key) || '{}') || {};
          store.counts = store.counts || {};
          store.confirmed = store.confirmed || {};
          store.counts[finalCode] = success;
          store.confirmed[finalCode] = true;
          store.updated_at = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(store));
          localStorage.setItem('learninghub_subjects_dirty_v3', String(Date.now()));
          localStorage.removeItem('learninghub_subjects_cache_v1');
          sessionStorage.removeItem('learninghub_subject_counts_cache_v1');
          window.clearLearningHubSupabaseCache?.('subjects');
          window.clearLearningHubSupabaseCache?.('questions');
        } catch(e) {}
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
        try {
          $('subjectRefresh')?.click();
          setTimeout(() => $('subjectRefresh')?.click(), 5600);
          setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
        } catch(e) {}
      } else {
        // Học viên/User gửi request: Hiển thị thanh tiến trình khi upload tệp tin lớn
        showProgress('Đang gửi yêu cầu tạo môn học...', 50, 100, 'Đang tải dữ liệu câu hỏi lên máy chủ...');
        await new Promise(resolve => setTimeout(resolve, 100));

        const u = window.HODSupabase?.getUser?.();
        const p = window.HODSupabase?.getProfile?.() || null;
        const { error } = await c.from('subject_requests').insert({
          code: code,
          name: name,
          description: desc || null,
          questions_data: parsedQuestions || [],
          user_id: u?.id,
          user_email: u?.email || p?.email || '',
          status: 'pending'
        });
        if (error) { alert('Lỗi gửi yêu cầu: ' + error.message); return; }
        successMsg = 'Đã gửi yêu cầu thêm môn ' + code + '. Vui lòng chờ admin duyệt.';
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
      }

      parsedQuestions = [];
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      clearAddSubjectLocalStorage();
    } catch (e) {
      console.warn('Add subject error:', e);
      alert('Lỗi khi lưu môn học: ' + (e?.message || e));
      notify('Lỗi khi lưu môn học');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Lưu Môn Học'; }
      hideProgress();
    }
  };


  window.__closeAddSubject = function () {
    window.__switchSubjectGateTab('list');
  };

  function bind() {
    $('addSubjectBtn')?.addEventListener('click', () => window.__switchSubjectGateTab('add'));
    showAddBtn();
    setInterval(showAddBtn, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
// ===== ADD_SUBJECT_FEATURE END =====


// ===== PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY =====
(function () {
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const $ = id => document.getElementById(id);
  const code = () => localStorage.getItem(SUBJECT_STORE) || '';
  const supa = () => window.HODSupabase?.__client || null;
  const logged = () => !!window.HODSupabase?.getUser?.();
  function empty(msg) {
    try { RAW = []; pool = []; ci = 0; flipped = false; randomActive = false; localStorage.setItem('hod102_random_active', '0') } catch (e) { }
    try { if ($('idx')) $('idx').textContent = '0'; if ($('total')) $('total').textContent = '0'; if ($('bar')) $('bar').style.width = '0%'; if ($('question')) $('question').textContent = msg || 'Chưa tải dữ liệu từ Supabase'; if ($('options')) $('options').innerHTML = ''; if ($('images')) $('images').innerHTML = ''; renderQuiz?.(); renderStudy?.(); } catch (e) { }
  }
  async function loadSubjectOnly() {
    const c = supa(), subject = code();
    if (!c || !logged()) { empty('Đăng nhập để tải dữ liệu từ Supabase'); return false; }
    if (!subject) { empty('Chọn môn để tải dữ liệu từ Supabase'); return false; }
    const { data, error } = await c.from('questions').select('id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason').eq('is_active', true).eq('subject_code', subject).order('num', { ascending: true });
    if (error) { console.warn('[NO LOCAL] Supabase load error', error); empty('Không tải được dữ liệu Supabase'); return false; }
    RAW = (data || []).map(r => ({ id: r.id, subject_code: r.subject_code || subject, num: r.num, question: r.question, options: r.options || {}, answer: r.answer, answer_text: r.answer_text, images: (typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || []), has_image: !!(r.has_image || (r.images || []).length), error_risk: r.error_risk || 'low', error_risk_reason: r.error_risk_reason || '' }));
    var _saved2 = +localStorage.getItem('learninghub_progress_' + subject) || 0; pool = [...RAW]; ci = Math.max(0, Math.min(_saved2, pool.length - 1)); flipped = false; randomActive = false; localStorage.setItem('hod102_random_active', '0');
    try { if ($('idx')) $('idx').textContent = RAW.length ? String(ci + 1) : '0'; if ($('total')) $('total').textContent = String(RAW.length); renderCard(); renderQuiz(); renderStudy(); syncSubjectTexts?.(); updateCardTools?.(); } catch (e) { console.warn('[NO LOCAL] render error', e) }
    return true;
  }
  window.loadCurrentSubjectOnly = loadSubjectOnly;
  function patchLoaders() {
    try { window.rebuild = function () { RAW = []; pool = []; return RAW } } catch (e) { }
    if (window.HODSupabase) {
      window.HODSupabase.loadQuestionsFromSupabase = loadSubjectOnly;
    }
  }
  function enforceNoLocal() {
    patchLoaders();
    const subject = code();
    try {
      if (!Array.isArray(RAW) || !RAW.length) { if (logged() && subject) loadSubjectOnly(); return; }
      if (RAW.some(q => !q.id || !q.subject_code || q.subject_code !== subject)) loadSubjectOnly();
    } catch (e) { }
  }
  document.addEventListener('DOMContentLoaded', () => {
    empty('Đang chờ dữ liệu Supabase...');
    patchLoaders();
    // Tắt tự load lặp lại: chỉ load khi đăng nhập/chọn môn.
    // setTimeout(loadSubjectOnly,150);
    // setTimeout(loadSubjectOnly,600);
    // setInterval(enforceNoLocal,1000);
  });
  patchLoaders();
})();


// ===== PATCH_REMOVE_RANDOM_FEATURE_FINAL =====
(function () {
  function $(id) { return document.getElementById(id) }
  function hide() { ['shuffle', 'stShuffle'].forEach(id => { let e = $(id); if (e) { e.style.display = 'none'; e.disabled = true; e.onclick = () => false; } }); try { randomActive = false; localStorage.setItem('hod102_random_active', '0') } catch (e) { } }
  window.shuffle = shuffle = function () { hide(); return false };
  document.addEventListener('DOMContentLoaded', () => { hide(); setTimeout(hide, 300); setTimeout(hide, 1000) });
  hide();
})();


// ===== PATCH_SUPABASE_SINGLE_SOURCE_ONLY =====
(function () {
  try { window.HOD_DATA = []; } catch (e) { }
  try {
    const dataNode = document.getElementById('data');
    if (dataNode) dataNode.textContent = '[]';
  } catch (e) { }
})();


// ===== FINAL_FLOATING_PARTICLES_CANVAS_20260613 =====
if (typeof finalAnswerText !== 'function') { function finalAnswerText(c) { const raw = String(c?.answer_text ?? '').trim(); const ans = String(c?.answer ?? '').trim().toUpperCase(); if (!raw || raw.toUpperCase() === ans || /^[A-E]+$/i.test(raw)) return answerText(c); return raw; } }
(function () {
  let canvas, ctx, w = 0, h = 0, dpr = 1, parts = [], raf = 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ensureCanvas() { const gate = document.getElementById('hodLoginGate'); if (!gate || reduce) return null; canvas = document.getElementById('landingParticles'); if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'landingParticles'; gate.prepend(canvas); } ctx = canvas.getContext('2d'); return gate; }
  function resize() { if (!canvas || !ctx) return; dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight; canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); init(); }
  function init() { const count = Math.min(140, Math.max(55, Math.floor(w * h / 14000))); parts = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .7 + Math.random() * 2.4, vx: (Math.random() - .5) * .22, vy: -.10 - Math.random() * .42, a: .18 + Math.random() * .55, p: Math.random() * Math.PI * 2, hue: Math.random() < .55 ? '255,255,255' : (Math.random() < .5 ? '255,226,170' : '135,225,255') })); }
  function draw() { if (!ctx || document.hidden) { raf = requestAnimationFrame(draw); return; } ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter'; for (const p of parts) { p.p += .012; p.x += p.vx + Math.sin(p.p) * .10; p.y += p.vy; if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w } if (p.x < -30) p.x = w + 30; if (p.x > w + 30) p.x = -30; const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7); glow.addColorStop(0, `rgba(${p.hue},${p.a})`); glow.addColorStop(.45, `rgba(${p.hue},${p.a * .22})`); glow.addColorStop(1, `rgba(${p.hue},0)`); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(${p.hue},${Math.min(1, p.a + .15)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); } raf = requestAnimationFrame(draw); }
  function ux() { const b = document.getElementById('subjectEnter'); if (b) b.textContent = 'Bắt đầu'; const i = document.getElementById('subjectSearch'); if (i) i.placeholder = 'Tìm môn học...'; const l = document.getElementById('subjectLoading'), r = document.getElementById('subjectRefresh'); if (l && r) { const on = !l.classList.contains('hidden'); r.classList.toggle('is-loading', on); r.setAttribute('aria-busy', on ? 'true' : 'false') } }
  function parallax() { const g = document.getElementById('hodLoginGate'); if (!g || g.__particles3d) return; g.__particles3d = true; g.addEventListener('pointermove', e => { const r = g.getBoundingClientRect(); const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)); const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)); g.style.setProperty('--mx', x.toFixed(1) + '%'); g.style.setProperty('--my', y.toFixed(1) + '%') }, { passive: true }); }
  function boot() { ux(); parallax(); if (ensureCanvas()) { resize(); cancelAnimationFrame(raf); draw(); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); window.addEventListener('resize', resize, { passive: true }); setInterval(ux, 150);
})();
(function () {
  const $ = id => document.getElementById(id); function prof() { return window.HODSupabase?.getProfile?.() || null } function can() { const p = prof(); return !!p && ['admin', 'editor'].includes(p.role) && !(p.blocked || p.is_blocked || p.status === 'blocked') } function cli() { return window.HODSupabase?.__client || null } function sc() { return localStorage.getItem('learninghub_subject_code_merged_v1') || '' } function build() { editDraft.question = ($('editQuestion')?.value || '').trim(); editDraft.answer = ($('editAnswer')?.value || '').trim().toUpperCase(); const ops = {}; document.querySelectorAll('[data-opt]').forEach(t => { if ((t.value || '').trim()) ops[t.dataset.opt] = t.value.trim() }); editDraft.options = ops; editDraft.answer_text = typeof answerText === 'function' ? answerText(editDraft) : ''; editDraft.subject_code = sc() || editDraft.subject_code || ''; editDraft.images = editDraft.images || []; return editDraft } async function qid(oldQ, draft) { if (oldQ?.id) return oldQ.id; const c = cli(); if (!c) return null; const code = oldQ?.subject_code || draft?.subject_code || sc(), num = oldQ?.num || draft?.num; if (!code || !num) return null; const { data, error } = await c.from('questions').select('id').eq('subject_code', code).eq('num', num).maybeSingle(); return (error || !data) ? null : data.id } async function direct() {
    const c = cli(); if (!c || !window.HODSupabase?.isReady?.()) { alert('Bạn cần đăng nhập trước.'); return false } if (!can()) return false; const oldQ = clone(RAW.find(x => x.num === editDraft.num) || pool[ci] || editDraft), d = build(), id = await qid(oldQ, d); if (!id) { alert('Không tìm thấy ID câu hỏi trên Supabase. Hãy tải lại trang rồi thử lại.'); return true }
    const list = d.images || [];
    const localHasImg = oldQ?.__imagesLoaded ? (list.length > 0) : !!(list.length || oldQ.has_image);
    const text = d.question + ' ' + Object.values(d.options || {}).join(' ');
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    const hasPlaceholder = list.some(im => {
      const src = typeof im === 'string' ? im : (im.src || im.url || im.secure_url || '');
      return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
    });
    let risk = '';
    let reason = '';
    if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) {
      risk = 'high';
      reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
    } else if (d.answer.length > 1) {
      risk = 'medium';
      reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
    } else {
      risk = 'low';
    }
    const payload = {
      question: d.question,
      options: d.options || {},
      answer: d.answer,
      answer_text: d.answer_text,
      images: d.images || [],
      updated_at: new Date().toISOString(),
      has_image: localHasImg || needsImg,
      error_risk: risk,
      error_risk_reason: reason || null
    };
    const { error } = await c.from('questions').update(payload).eq('id', id);
    if (error) { alert('Sửa trực tiếp thất bại: ' + error.message); return true }
    if (typeof window.clearLearningHubQuestionCache === 'function') {
      window.clearLearningHubQuestionCache();
    }
    try { const u = window.HODSupabase?.getUser?.(); await c.from('question_history').insert({ question_id: id, request_id: null, previous_data: { question: oldQ.question, options: oldQ.options || {}, answer: oldQ.answer, answer_text: oldQ.answer_text, images: oldQ.images || [] }, new_data: payload, changed_by: u?.id || null, approved_by: u?.id || null }) } catch (e) { } $('editModal')?.classList.add('hidden'); if (typeof notify === 'function') notify('Đã sửa trực tiếp'); if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(); else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase(); return true
  } const oldSave = typeof saveEditor === 'function' ? saveEditor : null; saveEditor = async function () { if (can()) { const h = await direct(); if (h) return } return oldSave ? oldSave.apply(this, arguments) : undefined }; window.saveEditor = saveEditor; const oldOpen = typeof openEditor === 'function' ? openEditor : null; openEditor = function () { if (oldOpen) oldOpen.apply(this, arguments); setTimeout(() => { if (can()) { if ($('editTitle')) $('editTitle').textContent = 'Sửa trực tiếp câu ' + ((pool && pool[ci]?.num) || ''); if ($('saveEdit')) $('saveEdit').textContent = 'Lưu trực tiếp'; if ($('restoreEdit')) $('restoreEdit').classList.remove('hidden') } }, 0) }; window.openEditor = openEditor
})();


// ===== FINAL_REPORT_BUTTON_OPEN_TAB_20260613 =====
// Thay khu vực "Báo cáo đã gửi" trong menu tài khoản thành nút bấm mở tab/modal xem báo cáo.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const supa = () => window.HODSupabase?.__client || null;
  const user = () => window.HODSupabase?.getUser?.() || null;

  function ensureReportModal() {
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
    modal.addEventListener('mousedown', e => { if (e.target === modal) modal.classList.add('hidden'); });
  }

  function ensureReportButton() {
    const menu = $('hodAccountMenu');
    if (!menu) return;
    let box = $('hodReportBox');
    if (!box) {
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

  function statusText(s) {
    return ({ pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || 'Không rõ');
  }
  function statusClass(s) {
    return s === 'approved' ? 'approved' : (s === 'rejected' ? 'rejected' : 'pending');
  }

  async function loadReportModalList() {
    ensureReportModal();
    const list = $('hodReportModalList');
    const c = supa();
    const u = user();
    if (!list) return;
    if (!c || !u) {
      list.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem báo cáo.</div>';
      return;
    }
    list.innerHTML = '<div class="hodReportEmpty">Đang tải...</div>';
    const { data, error } = await c.from('edit_requests')
      .select('id,question_num,status,admin_note,created_at')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      list.innerHTML = '<div class="hodReportEmpty">Không tải được báo cáo.</div>';
      return;
    }
    if (!data || !data.length) {
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

  async function openReportsTab() {
    ensureReportModal();
    $('hodAccountMenu')?.classList.add('hidden');
    $('hodReportModal')?.classList.remove('hidden');
    await loadReportModalList();
  }

  function boot() {
    ensureReportModal();
    ensureReportButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(ensureReportButton, 700);
})();


// ===== FINAL_MOBILE_FLASHCARD_NAVIGATION_20260613 =====
// Mobile: thêm nút chuyển câu và vuốt trái/phải để đổi flashcard.
(function () {
  function $(id) { return document.getElementById(id); }
  function goPrev() { if (typeof prev === 'function') prev(); }
  function goNext() { if (typeof next === 'function') next(); }

  function ensureMobileNav() {
    const zone = $('zone');
    if (!zone || $('mobileCardNav')) return;
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

  function bindSwipe() {
    const zone = $('zone');
    if (!zone || zone.__mobileSwipeBound) return;
    zone.__mobileSwipeBound = true;
    let sx = 0, sy = 0, st = 0;
    zone.addEventListener('touchstart', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      sx = t.clientX; sy = t.clientY; st = Date.now();
    }, { passive: true });
    zone.addEventListener('touchend', e => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const fastEnough = Date.now() - st < 900;
      if (!fastEnough) return;
      if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        e.preventDefault?.();
        if (dx < 0) goNext(); else goPrev();
      }
    }, { passive: false });
  }

  function boot() { ensureMobileNav(); bindSwipe(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();


// ===== FINAL_USER_LAST_ACTIVITY_TRACKING_20260613 =====
// Cập nhật hoạt động gần nhất của người dùng trên web.
(function () {
  if (window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613) return;
  window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613 = true;

  const MIN_GAP = 60 * 1000; // tối đa 1 lần / 1 phút
  const GLOBAL_KEY = '__LH_LAST_ACTIVITY_SENT_AT_20260613';
  let sending = false;

  function client() { return window.HODSupabase?.__client || null; }
  function user() { return window.HODSupabase?.getUser?.() || null; }
  function lastSent() { return Number(window[GLOBAL_KEY] || 0); }
  function markSent(t) { window[GLOBAL_KEY] = t || Date.now(); }

  async function touchActivity(force = false) {
    const c = client();
    const u = user();
    if (!c || !u || sending) return;
    const nowMs = Date.now();
    if (!force && nowMs - lastSent() < MIN_GAP) return;
    sending = true;
    markSent(nowMs);
    try {
      await c.from('profiles').update({
        email: u.email || '',
        last_activity: new Date().toISOString()
      }).eq('id', u.id);
    } catch (e) {
      console.warn('[last_activity]', e);
    } finally {
      sending = false;
    }
  }

  function bindActivityEvents() {
    ['click', 'touchstart', 'keydown'].forEach(ev => {
      window.addEventListener(ev, () => touchActivity(false), { passive: true });
    });
    // Tắt ping activity khi focus/interval để giảm gọi Supabase.
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindActivityEvents);
  else bindActivityEvents();
  setTimeout(() => touchActivity(true), 2500);
})();

// ===== FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613 =====
// Bỏ chữ "Đổi môn" bên trái, tiêu đề tự đổi theo môn đang chọn.
(function () {
  const STORE = 'learninghub_subject_code_merged_v1';
  function $(id) { return document.getElementById(id) }
  function currentCode() { return localStorage.getItem(STORE) || '' }
  function titleFromCode(code) {
    code = String(code || '').trim().replace(/_\d+$/i, '');
    if (!code) return 'Learning Hub';
    return code + ' Learning';
  }
  function fixCounter() {
    const counter = document.querySelector('.globalTop .counter') || document.querySelector('#fc .top .counter') || document.querySelector('.counter');
    if (!counter) return;
    if (counter.querySelector('#subjectInlineText') || /Đổi môn|Chưa chọn môn|·/.test(counter.textContent || '')) {
      const idx = $('idx')?.textContent || '0';
      const total = $('total')?.textContent || '0';
      counter.innerHTML = 'Câu <b id="idx">' + idx + '</b> / <b id="total">' + total + '</b>';
    }
  }
  function fixBrand() {
    const brand = document.querySelector('.globalTop .brand') || document.querySelector('#fc .top .brand') || document.querySelector('.brand');
    if (!brand) return;
    const title = titleFromCode(currentCode());
    if ((brand.textContent || '').trim() !== title) brand.textContent = title;
  }
  function run() { fixCounter(); fixBrand(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  setTimeout(run, 50);
  setTimeout(run, 300);
  setInterval(run, 300);
})();

// ===== FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613 =====
// Đưa nút Đổi môn nằm ngay bên trái nút Cài đặt.
(function () {
  function $(id) { return document.getElementById(id) }
  function moveSubjectButton() {
    const actions = document.querySelector('.globalTop .actions') || document.querySelector('#fc .actions') || document.querySelector('.actions');
    if (!actions) return;
    let btn = $('subjectTopChip');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'subjectTopChip';
      btn.type = 'button';
      btn.className = 'subjectChip';
      btn.onclick = function () { $('hodChangeSubjectBtn')?.click(); };
    }
    btn.textContent = 'Đổi môn';
    btn.classList.remove('hidden');
    btn.style.display = 'inline-flex';
    const settings = $('openSettings');
    if (settings && settings.parentNode === actions) {
      if (settings.previousElementSibling !== btn) actions.insertBefore(btn, settings);
    } else if (!actions.contains(btn)) {
      actions.prepend(btn);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', moveSubjectButton); else moveSubjectButton();
  setTimeout(moveSubjectButton, 200);
  setTimeout(moveSubjectButton, 800);
  setInterval(moveSubjectButton, 700);
})();

// ===== FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614 =====
// Nút báo cáo ở tab Thư viện: không toggle thẻ, mở form báo cáo đúng câu như nút ! ở Flashcard.
(function () {
  function getQuestionByNum(num) {
    num = Number(num);
    return (RAW || []).find(c => Number(c.num) === num) || (pool || []).find(c => Number(c.num) === num) || null;
  }
  function setCurrentQuestionByNum(num) {
    num = Number(num);
    let idx = (pool || []).findIndex(c => Number(c.num) === num);
    if (idx < 0) {
      const rawIdx = (RAW || []).findIndex(c => Number(c.num) === num);
      if (rawIdx >= 0) {
        pool = [...RAW];
        idx = rawIdx;
      }
    }
    if (idx >= 0) {
      ci = idx;
      flipped = false;
      flipDir = 'horizontal';
      try { renderCard(); } catch (e) { }
      return true;
    }
    return false;
  }
  window.openStudyReport = function (num, ev) {
    if (ev) {
      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
    }
    const q = getQuestionByNum(num);
    if (!q) return alert('Không tìm thấy câu ' + num);
    if (!setCurrentQuestionByNum(num)) return alert('Không mở được câu ' + num);
    // Mở cùng form báo cáo/sửa như nút ! bên Flashcard
    try { openEditor(); } catch (e) { alert('Không mở được báo cáo câu ' + num); }
    return false;
  };

  function hardBindReportButtons() {
    const list = document.getElementById('studyList');
    if (!list) return;

    // Chặn sớm từ document để không bị handler toggle khác bắt tiếp
    if (!document.__studyReportNoToggleDoc) {
      document.__studyReportNoToggleDoc = true;
      document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.openStudyReport(btn.dataset.reportNum, e);
        return false;
      }, true);
      document.addEventListener('pointerdown', function (e) {
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if (!btn) return;
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
      document.addEventListener('mousedown', function (e) {
        const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
        if (!btn) return;
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
    }

    list.querySelectorAll('.studyReportBtn,[data-report-num]').forEach(btn => {
      btn.setAttribute('type', 'button');
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return window.openStudyReport(this.dataset.reportNum, e);
      };
      btn.onmousedown = function (e) { e.stopPropagation(); e.stopImmediatePropagation(); };
      btn.onpointerdown = function (e) { e.stopPropagation(); e.stopImmediatePropagation(); };
      btn.ontouchstart = function (e) { e.stopPropagation(); };
    });
  }

  // Gắn lại sau mỗi lần renderStudy vì danh sách được dựng lại bằng innerHTML
  const oldRenderStudy = typeof renderStudy === 'function' ? renderStudy : null;
  if (oldRenderStudy && !window.__studyReportRenderPatched) {
    window.__studyReportRenderPatched = true;
    renderStudy = function () {
      const result = oldRenderStudy.apply(this, arguments);
      setTimeout(hardBindReportButtons, 0);
      return result;
    };
    window.renderStudy = renderStudy;
  }

  document.addEventListener('DOMContentLoaded', function () {
    hardBindReportButtons();
    setTimeout(hardBindReportButtons, 100);
    setTimeout(hardBindReportButtons, 500);
    setInterval(hardBindReportButtons, 1000);
  });
})();

// ===== FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614 =====
// Tăng biên độ nền landing lên nhẹ một chút, vẫn chậm và mềm.
(function () {
  let raf = 0;

  function injectStyle() {
    let st = document.getElementById('landingBgMoverRuntimeStyle');
    if (!st) {
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

  function ensureLayer() {
    const gate = document.getElementById('hodLoginGate');
    if (!gate) return null;
    injectStyle();
    let bg = document.getElementById('landingBgMover');
    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'landingBgMover';
      gate.insertBefore(bg, gate.firstChild);
    }
    let shade = document.getElementById('landingBgShade');
    if (!shade) {
      shade = document.createElement('div');
      shade.id = 'landingBgShade';
      gate.insertBefore(shade, bg.nextSibling);
    }
    return bg;
  }

  function isVisible() {
    const gate = document.getElementById('hodLoginGate');
    return !!gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
  }

  function frame(t) {
    const bg = ensureLayer();
    if (bg && isVisible()) {
      const x = Math.sin(t / 4200) * 12;
      const y = Math.cos(t / 5200) * 8;
      const r = Math.sin(t / 6800) * 0.08;
      const s = 1.048 + Math.sin(t / 7600) * 0.008;
      bg.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
      bg.style.filter = `saturate(${(1.04 + Math.sin(t / 6200) * 0.018).toFixed(3)}) contrast(1.02) brightness(${(1 + Math.cos(t / 7000) * 0.008).toFixed(3)})`;
    }
    raf = requestAnimationFrame(frame);
  }

  function boot() {
    cancelAnimationFrame(raf);
    ensureLayer();
    raf = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('focus', boot);
  window.addEventListener('resize', boot, { passive: true });
})();

// ===== FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614 =====
// Search khôn hơn: bỏ từ rác như what/the/are, ưu tiên đúng cụm, ẩn câu không liên quan, chỉ highlight từ quan trọng.
(function () {
  const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'done', 'have', 'has', 'had', 'having',
    'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
    'in', 'on', 'at', 'by', 'for', 'from', 'to', 'of', 'with', 'without', 'into', 'onto', 'over', 'under', 'between', 'among', 'about', 'as', 'than', 'that', 'this', 'these', 'those', 'it', 'its', 'their', 'there', 'here',
    'two', 'three', 'four', 'five', 'one', 'option', 'options', 'choose', 'check', 'select', 'following', 'main',
    'la', 'là', 'cua', 'của', 'va', 'và', 'cac', 'các', 'nhung', 'những', 'mot', 'một', 'cho', 'voi', 'với', 'trong', 'ngoai', 'ngoài', 'duoc', 'được', 'khong', 'không', 'nao', 'nào', 'gi', 'gì', 'hay', 'hoac', 'hoặc', 'dap', 'an', 'dapan', 'dapán', 'cau', 'câu'
  ]);

  function normText(s) {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9#:\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function splitTokens(s) { return normText(s).split(/\s+/).filter(Boolean); }
  function meaningfulTokens(q) {
    const raw = splitTokens(q);
    return raw.filter(t => {
      if (!t) return false;
      if (STOPWORDS.has(t)) return false;
      if (t.length < 3 && !/^\d+$/.test(t)) return false;
      if (/^(answer|ans|multi|multiple|chon|nhieu|lua|dap|an|dapan)$/.test(t)) return false;
      if (t.includes(':')) return false;
      return true;
    });
  }
  function parseQuery(q) {
    const raw = String(q ?? '').trim();
    const n = normText(raw);
    const p = { raw, norm: n, num: null, answer: null, multi: false, tokens: [], numericOnly: false, phrase: '' };
    p.numericOnly = /^\d+$/.test(n);
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if (m) p.num = Number(m[1]);
    if (p.numericOnly) p.num = Number(n);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if (m) p.answer = m[1].toUpperCase().split('').sort().join('');
    p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    p.tokens = meaningfulTokens(raw).filter(t => {
      if (/^#?\d+$/.test(t) && p.num !== null) return false;
      if (/^[a-e]+$/.test(t) && p.answer) return false;
      return true;
    });
    p.phrase = p.tokens.join(' ');
    return p;
  }
  function optionText(c) { return Object.values(c?.options || {}).join(' '); }
  function correctAnswerText(c) {
    const ans = String(c?.answer || '').toUpperCase();
    const opts = c?.options || {};
    return ans.split('').map(k => opts[k] || '').join(' ');
  }
  function hasWholeNumber(text, num) {
    return new RegExp('(^|\\D)' + String(num).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=\\D|$)').test(String(text ?? ''));
  }
  function editDistanceOne(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, ed = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      ed++; if (ed > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return ed + (i < a.length ? 1 : 0) + (j < b.length ? 1 : 0) <= 1;
  }
  function tokenInText(token, textNorm) {
    if (!token) return true;
    if (textNorm.includes(token)) return true;
    if (token.length < 5) return false;
    const words = textNorm.split(/\s+/).filter(w => Math.abs(w.length - token.length) <= 1);
    return words.some(w => editDistanceOne(token, w));
  }
  function countMatches(tokens, textNorm) {
    let n = 0;
    for (const t of tokens) if (tokenInText(t, textNorm)) n++;
    return n;
  }
  function scoreQuestion(c, p) {
    if (!p.raw) return { ok: true, score: 0, auto: false };
    const ansSorted = sortAns(String(c.answer || '').toUpperCase());
    if (p.answer && ansSorted !== p.answer) return { ok: false, score: -1, auto: false };
    if (p.multi && String(c.answer || '').length <= 1) return { ok: false, score: -1, auto: false };

    const qNorm = normText(c.question || '');
    const optNorm = normText(optionText(c));
    const corNorm = normText(correctAnswerText(c));
    const ansLineNorm = normText([c.answer, c.answer_text, correctAnswerText(c)].join(' '));
    const allNorm = normText([c.num, c.question, c.answer, c.answer_text, optionText(c)].join(' '));
    let score = 0, auto = false;

    if (p.num !== null) {
      const exact = Number(c.num) === p.num;
      const answerHasNum = hasWholeNumber([c.answer_text, correctAnswerText(c)].join(' '), p.num);
      if (p.numericOnly) {
        if (!exact && !answerHasNum) return { ok: false, score: -1, auto: false };
        score += exact ? 2000 : 850;
        auto = answerHasNum;
      } else {
        if (!exact) return { ok: false, score: -1, auto: false };
        score += 2000;
      }
    }

    if (p.answer) { score += 900; auto = true; }
    if (p.multi) { score += 350; }

    const tokens = p.tokens;
    if (tokens.length) {
      const qHit = countMatches(tokens, qNorm);
      const optHit = countMatches(tokens, optNorm);
      const corHit = countMatches(tokens, corNorm);
      const allHit = countMatches(tokens, allNorm);

      // Nếu query có nhiều từ quan trọng, bắt buộc khớp phần lớn từ.
      const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.72);
      if (allHit < required) return { ok: false, score: -1, auto: false };

      // Ưu tiên đúng cụm liên tiếp.
      if (p.phrase && qNorm.includes(p.phrase)) score += 1200;
      if (p.phrase && optNorm.includes(p.phrase)) score += 850;
      if (p.phrase && corNorm.includes(p.phrase)) { score += 1000; auto = true; }

      score += qHit * 180 + optHit * 95 + corHit * 160;
      if (corHit > 0 || (p.phrase && ansLineNorm.includes(p.phrase))) auto = true;

      // Phạt nặng mấy câu chỉ trúng từ quá chung rải rác.
      if (tokens.length >= 3 && qHit === 0 && optHit < required) return { ok: false, score: -1, auto: false };
      if (tokens.length >= 4 && allHit < tokens.length) score -= (tokens.length - allHit) * 220;
    } else if (!p.num && !p.answer && !p.multi) {
      return { ok: false, score: -1, auto: false };
    }

    return { ok: true, score, auto };
  }
  function smartBetter(q) {
    const p = parseQuery(q);
    if (!p.raw) return RAW;
    return RAW.map(c => ({ c, m: scoreQuestion(c, p) }))
      .filter(x => x.m.ok)
      .sort((a, b) => b.m.score - a.m.score || Number(a.c.num) - Number(b.c.num))
      .map(x => Object.assign({}, x.c, { __autoOpenAnswer: x.m.auto }));
  }
  function markText(text, query, cls = 'tokenMark') {
    const parser = (typeof parseQuery === 'function') ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s) { return esc(s); }

    function normWithMap(s) {
      let norm = '', map = [], lastSpace = true;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const n = normText(ch);
        if (n) {
          for (const c of n) { norm += c; map.push(i); }
          lastSpace = false;
        } else if (!lastSpace) {
          norm += ' '; map.push(i); lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while (norm.startsWith(' ')) { norm = norm.slice(1); map.shift(); }
      return { norm, map };
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if (cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi) {
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if (hit >= 0) {
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? (source.length - 1)) + 1;
        return escLocal(source.slice(0, start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start, end))}</mark>` +
          escLocal(source.slice(end));
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0, 10);
    if (!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts.map(part => {
      const np = normText(part);
      if (np && tokens.some(t => np === t || np.includes(t) || t.includes(np))) {
        return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
      }
      return escLocal(part);
    }).join('');
  }
  function optionStudy(c, q) {
    return Object.entries(c.options || {}).map(([k, v]) => {
      const right = String(c.answer || '').includes(k);
      return `<div class="sopt ${right ? 'ans correct' : ''}"><div class="skey">${right ? '✓' : esc(k)}</div><div>${esc(k + '. ')}${markText(v, q)}</div></div>`;
    }).join('');
  }
  function renderStudyBetter() {
    const input = $('search');
    const q = input ? (input.value || '') : '';
    if (input) input.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
    const arr = smartBetter(q);
    const max = arr.length;
    const html = arr.slice(0, max).map(c => {
      const auto = !!c.__autoOpenAnswer;
      return `<div class="sitem compactStudyCard ${auto ? 'autoOpenAnswer open' : ''}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question, q, 'phraseMark')}</div>
          <div class="compactCardRight">${auto ? '<span class="answerMatchChip">Khớp đáp án</span>' : ''}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="Báo cáo câu ${esc(c.num)}">!</button><span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c, q)}</div></div>
      </div>`;
    }).join('');
    $('studyList').innerHTML = html + (arr.length > max ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>` : arr.length ? '' : '<div class="more">Không tìm thấy kết quả.</div>');
  }
  function bindBetterSearch() {
    const s = $('search');
    if (s) { s.oninput = renderStudyBetter; s.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...'; }
    const list = $('studyList');
    if (list && !list.__betterSearchBound) {
      list.__betterSearchBound = true;
      list.addEventListener('click', function (e) {
        const rb = e.target.closest('[data-report-num]');
        if (rb) { e.preventDefault(); e.stopImmediatePropagation(); window.openStudyReport?.(rb.dataset.reportNum, e); return; }
        const it = e.target.closest('.sitem');
        if (!it) return;
        e.preventDefault(); e.stopImmediatePropagation();
        it.classList.toggle('open'); it.classList.remove('autoOpenAnswer');
      }, true);
    }
  }

  smart = smartBetter;
  renderStudy = renderStudyBetter;
  window.renderStudy = renderStudyBetter;
  document.addEventListener('DOMContentLoaded', function () {
    bindBetterSearch();
    setTimeout(bindBetterSearch, 100);
    setTimeout(bindBetterSearch, 600);
    try { renderStudyBetter(); } catch (e) { }
  });
})();


// ===== COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====
// Đã gộp các bản vá nút + / form thêm câu để tránh chồng lấn. Giữ giao diện đang hiển thị: form đẹp, nút + chỉ ở tab Thư viện và ẩn khi modal mở.
(function () {
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const $ = id => document.getElementById(id);
  const subjectCode = () => localStorage.getItem(SUBJECT_STORE) || '';
  const client = () => window.HODSupabase?.__client || null;
  const user = () => window.HODSupabase?.getUser?.() || null;
  const profile = () => window.HODSupabase?.getProfile?.() || null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let addImages = [];
  let addUploading = 0;

  function canManage() {
    const p = profile();
    const role = String(p?.role || '').toLowerCase();
    return !!user() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isAllTab() {
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function nextNum() {
    const nums = (RAW || []).map(q => Number(q.num)).filter(Number.isFinite);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }
  function notifyOk(msg) { if (typeof notify === 'function') notify(msg); else alert(msg); }

  function ensurePlus() {
    let btn = $('addQuestionFab');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'addQuestionFab';
      btn.type = 'button';
      btn.title = 'Thêm câu hỏi';
      btn.textContent = '+';
      document.body.appendChild(btn);
    }
    btn.classList.add('prettyAddFab');
    btn.innerHTML = '<span>+</span>'; // khóa 1 icon, không tạo bóng/ghost
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPrettyAddModal();
    };
    return btn;
  }

  function modalOpen() {
    const m = $('addQuestionModal');
    return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
  }

  function updatePlus() {
    const btn = ensurePlus();
    const open = modalOpen();
    const show = canManage() && isAllTab() && !open;
    document.body.classList.toggle('add-question-visible', show);
    document.body.classList.toggle('add-question-modal-open', open);
    btn.classList.toggle('hidden', !show);
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
    btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
    btn.style.setProperty('opacity', show ? '1' : '0', 'important');
    btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
    if (!canManage() || !isAllTab()) $('addQuestionModal')?.classList.add('hidden');
  }

  function cleanupLimitText() {
    const list = $('studyList');
    if (!list) return;
    list.querySelectorAll('.more').forEach(x => {
      if (/Đang hiển thị\s+\d+\s*\//i.test(x.textContent || '')) x.remove();
    });
  }


  function getImageFilesFromPaste(e) {
    const items = [...(e.clipboardData?.items || [])];
    return items
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }

  async function uploadPrettyImageFiles(files, sourceLabel) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    const st = $('addUploadStatus');
    const input = $('addImgUpload');
    const saveBtn = $('saveAddQuestion');
    if (!files.length) return;
    if (!window.__LHUploadCloudinary) {
      alert('Chưa sẵn sàng upload Cloudinary. Tải lại trang rồi thử lại.');
      return;
    }
    addUploading++;
    if (input) input.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (st) {
      st.style.display = 'block';
      st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...';
    }
    notifyOk(sourceLabel === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh lên Cloudinary...');
    try {
      let done = 0;
      for (const file of files) {
        const uploaded = await window.__LHUploadCloudinary(file);
        if (uploaded) addImages.push(uploaded);
        done++;
        if (st) st.textContent = 'Đang upload ảnh ' + done + '/' + files.length + '...';
      }
      if (window.__LHCleanImages) addImages = window.__LHCleanImages(addImages);
      renderPrettyImages();
      if (st) {
        st.textContent = 'Đã upload xong. URL nằm dưới ảnh.';
        setTimeout(() => { if (addUploading === 0) st.style.display = 'none'; }, 2200);
      }
      notifyOk('Đã upload ảnh thành URL');
    } catch (err) {
      if (st) st.textContent = 'Upload lỗi: ' + (err.message || err);
      alert(err.message || err);
    } finally {
      addUploading = Math.max(0, addUploading - 1);
      if (addUploading === 0) {
        if (input) { input.disabled = false; input.value = ''; }
        if (saveBtn) saveBtn.disabled = false;
      }
    }
  }

  function ensurePrettyModal() {
    let modal = $('addQuestionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'addQuestionModal';
      modal.className = 'modal hidden addQuestionModal';
      document.body.appendChild(modal);
    }
    if (modal.dataset.prettyVersion === '20260614') return modal;
    modal.dataset.prettyVersion = '20260614';
    modal.className = 'modal hidden addQuestionModal';
    modal.innerHTML = `
      <div class="box editPreviewBox quizEditLayoutV2">
        <button type="button" class="modalX" id="addQuestionClose">×</button>
        <div class="v7Head editPreviewHead">
          <div>
            <span class="v7Label">THÊM MỚI</span>
            <h2>Thêm câu hỏi mới</h2>
            <p class="v7Hint">Nhập nội dung câu hỏi, các đáp án và upload ảnh nếu có.</p>
          </div>
        </div>
        <article class="v7Card editPreviewCard" style="margin:0!important; border:0!important; background:transparent!important; padding:0!important;">
          <div class="editPreviewTwoColumns">
            <div class="editPreviewLeftCol">
              <div class="v7Field">
                <label>Câu hỏi</label>
                <textarea id="addQuestionText" placeholder="Nhập nội dung câu hỏi..." style="min-height: 120px;"></textarea>
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Đáp án đúng</label>
                <input id="addQuestionAnswer" placeholder="Ví dụ: A hoặc BC">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Số câu</label>
                <input id="addQuestionNum" type="number" min="1" placeholder="Tự lấy số tiếp theo nếu để trống">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Hình ảnh</label>
                <input id="addImgUpload" type="file" accept="image/*" multiple>
                <div class="pasteImageHint addPasteImageHint">Có thể chụp/copy ảnh rồi bấm Ctrl + V trong khung này để tự upload URL.</div>
                <div id="addUploadStatus" style="display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;">Đang upload ảnh...</div>
                <div id="addImgs" class="editImgs addImgs" style="margin-top: 8px;">Chưa có hình.</div>
              </div>
            </div>
            <div class="editPreviewRightCol">
              <div class="v7Field" style="margin: 0!important;">
                <label>Các đáp án</label>
                <div id="editPreviewOptions" class="v7Options">
                  <div class="v7OptRow">
                    <div class="v7Key">A</div>
                    <input id="addOptA" placeholder="Nhập đáp án A">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptA').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">B</div>
                    <input id="addOptB" placeholder="Nhập đáp án B">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptB').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">C</div>
                    <input id="addOptC" placeholder="Nhập đáp án C">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptC').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">D</div>
                    <input id="addOptD" placeholder="Nhập đáp án D">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptD').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">E</div>
                    <input id="addOptE" placeholder="Có thể bỏ trống (E)">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptE').value=''">×</button>
                  </div>
                </div>
              </div>
              <div class="v7Bottom" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
                <button type="button" class="btn" id="cancelAddQuestion">Đóng</button>
                <button type="button" class="primary" id="saveAddQuestion">Lưu câu hỏi</button>
              </div>
            </div>
          </div>
        </article>
      </div>`;

    $('addQuestionClose').onclick = closePrettyAddModal;
    $('cancelAddQuestion').onclick = closePrettyAddModal;
    $('saveAddQuestion').onclick = savePrettyQuestion;
    $('addImgUpload').onchange = e => uploadPrettyImageFiles(e.target.files, 'file');
    modal.addEventListener('paste', e => {
      const files = getImageFilesFromPaste(e);
      if (!files.length) return;
      e.preventDefault();
      uploadPrettyImageFiles(files, 'paste');
    });
    modal.addEventListener('dragover', e => {
      const hasFile = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
      if (!hasFile) return;
      e.preventDefault();
      modal.classList.add('dragImageOver');
    });
    modal.addEventListener('dragleave', () => modal.classList.remove('dragImageOver'));
    modal.addEventListener('drop', e => {
      const files = [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      modal.classList.remove('dragImageOver');
      uploadPrettyImageFiles(files, 'drop');
    });
    $('addImgs').onclick = e => {
      const b = e.target.closest('[data-add-rm]');
      if (!b) return;
      addImages.splice(Number(b.dataset.addRm), 1);
      renderPrettyImages();
    };
    modal.addEventListener('mousedown', e => { if (e.target === modal) closePrettyAddModal(); });
    return modal;
  }

  function renderPrettyImages() {
    const box = $('addImgs');
    if (!box) return;
    box.innerHTML = addImages.length ? addImages.map((im, i) => `
      <div class="editImg addPreviewImg">
        <button type="button" class="rm" data-add-rm="${i}">×</button>
        <img src="${esc(im.src)}" alt="">
        <input class="imgUrlBox" value="${esc(im.src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;">
      </div>`).join('') : 'Chưa có hình.';
  }

  function openPrettyAddModal() {
    if (!canManage()) return;
    if (!isAllTab()) return;
    const modal = ensurePrettyModal();
    addImages = [];
    $('addQuestionNum').value = nextNum();
    $('addQuestionText').value = '';
    ['A', 'B', 'C', 'D', 'E'].forEach(k => { const el = $('addOpt' + k); if (el) el.value = ''; });
    $('addQuestionAnswer').value = '';
    renderPrettyImages();
    modal.classList.remove('hidden');
    updatePlus();
    setTimeout(() => $('addQuestionText')?.focus(), 80);
  }
  function closePrettyAddModal() { $('addQuestionModal')?.classList.add('hidden'); setTimeout(updatePlus, 30); }

  function answerTextLine(answer, options) {
    return String(answer || '').toUpperCase().split('').filter(Boolean).map(k => k + '. ' + (options[k] || '')).join('; ');
  }
  async function savePrettyQuestion() {
    if (!canManage()) return alert('Tài khoản này không có quyền thêm câu hỏi.');
    if (addUploading > 0) return alert('Ảnh đang upload, chờ xong rồi lưu nha.');
    const c = client(); if (!c) return alert('Chưa kết nối Supabase.');
    const subject = subjectCode(); if (!subject) return alert('Bạn cần chọn môn trước.');

    const num = Number(($('addQuestionNum')?.value || '').trim()) || nextNum();
    const question = ($('addQuestionText')?.value || '').trim();
    const answer = ($('addQuestionAnswer')?.value || '').trim().toUpperCase().replace(/[^A-E]/g, '');
    const options = {};
    ['A', 'B', 'C', 'D', 'E'].forEach(k => { const v = ($('addOpt' + k)?.value || '').trim(); if (v) options[k] = v; });

    if (!question) return alert('Nhập câu hỏi trước.');
    if (Object.keys(options).length < 2) return alert('Nhập ít nhất 2 đáp án.');
    if (!answer) return alert('Nhập đáp án đúng, ví dụ A hoặc BC.');
    for (const k of answer) { if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); }

    const payload = { subject_code: subject, num, question, options, answer, answer_text: answerTextLine(answer, options), images: addImages, is_active: true, updated_at: new Date().toISOString() };
    const btn = $('saveAddQuestion');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }
    try {
      const { data, error } = await c.from('questions').insert(payload).select('*').single();
      if (error) throw error;
      try { await c.from('question_history').insert({ question_id: data?.id || null, request_id: null, previous_data: null, new_data: payload, changed_by: user()?.id || null, approved_by: user()?.id || null }); } catch (e) { }
      closePrettyAddModal();
      notifyOk('Đã thêm câu hỏi');
      if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly();
      else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
      try {
        const idx = (RAW || []).findIndex(q => Number(q.num) === num);
        if (idx >= 0) { pool = [...RAW]; ci = idx; flipped = false; renderCard?.(); renderStudy?.(); }
      } catch (e) { }
    } catch (err) {
      alert('Thêm câu hỏi thất bại: ' + (err?.message || err));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Lưu câu hỏi'; }
    }
  }

  function boot() {
    ensurePlus();
    const modal = ensurePrettyModal();
    cleanupLimitText();
    updatePlus();
    if (modal && !modal.__mergedAddObserver) {
      modal.__mergedAddObserver = true;
      const obs = new MutationObserver(() => setTimeout(updatePlus, 30));
      obs.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
      modal.addEventListener('click', () => setTimeout(updatePlus, 30), true);
      modal.addEventListener('mousedown', () => setTimeout(updatePlus, 30), true);
    }
    document.querySelectorAll('.tab').forEach(t => {
      if (t.__prettyAddTabBound) return;
      t.__prettyAddTabBound = true;
      t.addEventListener('click', () => setTimeout(() => { cleanupLimitText(); updatePlus(); }, 80));
    });
  }
  window.openAddQuestionModal = openPrettyAddModal;
  window.openPrettyAddModal = openPrettyAddModal;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 300); setTimeout(boot, 1000);
  setInterval(updatePlus, 250);
})();
// ===== END COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====

// ===== FINAL_DELETE_BUTTON_BESIDE_OPEN_20260614 =====
// Nút Xóa nằm CẠNH nút Mở/Thu gọn, không xóa nút Mở.
(function () {
  function $(id) { return document.getElementById(id); }
  function canManage() {
    const p = window.HODSupabase?.getProfile?.() || null;
    const u = window.HODSupabase?.getUser?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return !!u && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function isStudyTab() {
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function getNum(card) {
    const d = card?.dataset?.num || card?.getAttribute?.('data-num');
    if (d && /^\d+$/.test(String(d))) return Number(d);
    const m = String(card?.textContent || '').match(/CÂU\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  }
  function addDeleteButtons() {
    const list = $('studyList');
    if (!list) return;
    const show = canManage() && isStudyTab();
    document.body.classList.toggle('study-has-delete', show);

    list.querySelectorAll('.sitem, .compactStudyCard').forEach(card => {
      let holder = card.querySelector('.compactCardRight');
      if (!holder) {
        holder = document.createElement('div');
        holder.className = 'compactCardRight';
        const line = card.querySelector('.compactCardLine');
        if (line) line.appendChild(holder); else card.appendChild(holder);
      }
      const existing = card.querySelector('.studyDeleteAction');
      if (!show) { if (existing) existing.remove(); return; }
      const num = getNum(card);
      if (!num) return;
      card.dataset.num = String(num);
      if (existing) { existing.dataset.deleteNum = String(num); return; }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'studyDeleteAction';
      btn.dataset.deleteNum = String(num);
      btn.title = 'Xóa câu ' + num;
      btn.textContent = 'Xóa';
      holder.appendChild(btn);
    });
  }
  function patchRender() {
    if (window.__deleteButtonRenderPatched) return;
    const old = typeof renderStudy === 'function' ? renderStudy : null;
    if (!old) return;
    window.__deleteButtonRenderPatched = true;
    renderStudy = function () {
      const r = old.apply(this, arguments);
      setTimeout(addDeleteButtons, 0);
      setTimeout(addDeleteButtons, 100);
      return r;
    };
    window.renderStudy = renderStudy;
  }
  function boot() {
    patchRender();
    addDeleteButtons();
    document.querySelectorAll('.tab').forEach(t => {
      if (t.__deleteBtnBound) return;
      t.__deleteBtnBound = true;
      t.addEventListener('click', () => setTimeout(addDeleteButtons, 100));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
  setInterval(addDeleteButtons, 1500);
})();


// ===== FIX_DELETE_NO_TOGGLE_20260627 =====
(function () {
  function isDeleteTarget(e) { return e.target?.closest?.('.studyDeleteAction,[data-delete-num]'); }
  function notifySafe(msg) { if (typeof notify === 'function') notify(msg); else alert(msg); }
  function client() { return window.HODSupabase?.__client || null; }
  function user() { return window.HODSupabase?.getUser?.() || null; }
  function profile() { return window.HODSupabase?.getProfile?.() || null; }
  function canManage() {
    const p = profile();
    const role = String(p?.role || '').toLowerCase();
    return !!user() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }
  function getQ(num) { num = Number(num); return (RAW || []).find(q => Number(q.num) === num) || null; }
  async function deleteQuestion(num) {
    num = Number(num);
    if (!num) return;
    const q = getQ(num);
    if (!q) return notifySafe('Không thấy câu ' + num);
    if (!canManage()) return notifySafe('Không có quyền xóa');
    if (!confirm('Xóa câu ' + num + '?\nCâu hỏi sẽ bị ẩn khỏi thư viện.')) return;
    const c = client();
    if (!c) return notifySafe('Chưa kết nối Supabase');
    const query = q.id ? c.from('questions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', q.id)
      : c.from('questions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('subject_code', q.subject_code).eq('num', num);
    const { error } = await query;
    if (error) return notifySafe('Lỗi xóa: ' + error.message);
    if (typeof window.clearLearningHubQuestionCache === 'function') {
      window.clearLearningHubQuestionCache();
    }
    RAW = (RAW || []).filter(x => Number(x.num) !== num);
    pool = (pool || []).filter(x => Number(x.num) !== num);
    if (ci >= pool.length) ci = Math.max(0, pool.length - 1);
    try { renderStudy?.(); renderCard?.(); renderQuiz?.(); } catch (e) { }
    notifySafe('Đã xóa câu ' + num);
  }
  function stopOnly(e) {
    const btn = isDeleteTarget(e);
    if (!btn) return;
    e.preventDefault?.();
    e.stopPropagation?.();
    e.stopImmediatePropagation?.();
    return btn;
  }
  if (!document.__deleteNoToggleFinal20260627) {
    document.__deleteNoToggleFinal20260627 = true;
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, function (e) { stopOnly(e); }, true);
    });
    document.addEventListener('click', function (e) {
      const btn = stopOnly(e);
      if (!btn) return;
      deleteQuestion(btn.dataset.deleteNum || btn.getAttribute('data-delete-num'));
      return false;
    }, true);
  }
})();
// ===== FIX_DELETE_NO_TOGGLE_20260627 END =====

// ===== FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625 =====
(function () {
  function escPrompt(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function getPromptText() {
    return window.__ADD_SUBJECT_AI_PROMPT || window.AI_PROMPT || document.getElementById('userAiPromptText')?.textContent || '';
  }
  window.__openUserAIPromptModal = function () {
    const prompt = getPromptText();
    let modal = document.getElementById('userPromptModal');
    if (!modal) {
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
      modal.addEventListener('mousedown', e => { if (e.target === modal) window.__closeUserAIPromptModal(); });
      document.body.appendChild(modal);
      document.getElementById('userPromptModalClose')?.addEventListener('click', window.__closeUserAIPromptModal);
      document.getElementById('userPromptModalCopy')?.addEventListener('click', window.__copyUserAIPrompt);
    }
    const pre = document.getElementById('userPromptModalPre');
    if (pre) pre.textContent = prompt;
    modal.classList.remove('hidden');
  };
  window.__closeUserAIPromptModal = function () {
    document.getElementById('userPromptModal')?.classList.add('hidden');
  };
  window.__copyUserAIPrompt = function () {
    const prompt = getPromptText();
    const done = () => {
      const btn = document.getElementById('btnCopyPrompt');
      if (btn) {
        const oldText = btn.innerHTML;
        btn.innerHTML = '✅ Đã copy';
        setTimeout(() => { btn.innerHTML = oldText; }, 1800);
      }
      if (typeof notify === 'function') notify('Đã copy prompt!');
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prompt).then(done).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    }
  };
  document.addEventListener('click', function (e) {
    const viewBtn = e.target.closest && e.target.closest('#btnViewPrompt,.aiViewPromptBtn');
    if (viewBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.__openUserAIPromptModal();
      return;
    }
    const copyBtn = e.target.closest && e.target.closest('#btnCopyPrompt');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.__copyUserAIPrompt();
    }
  }, true);
})();

// ===== FIX_DELETE_IMPORT_FILE_20260625 =====
// Sửa nút "Xóa file" trong bước Import môn học.
(function () {
  function $(id) { return document.getElementById(id); }
  function notifySafe(msg) {
    if (typeof notify === 'function') notify(msg);
    else console.log(msg);
  }
  window.__clearUserImportFile = function () {
    const fileInput = $('userImportFile');
    const hiddenData = $('userImportData');
    const dropZone = $('importDropZone');
    const fileCard = $('userImportFileCard');
    const fileName = $('userImportFileName');
    const fileMeta = $('userImportFileMeta');
    const previewBtn = $('previewImportBtn');
    const saveBtn = $('userImportBtn');

    if (fileInput) fileInput.value = '';
    if (hiddenData) hiddenData.value = '';
    if (dropZone) dropZone.classList.remove('hidden');
    if (fileCard) fileCard.classList.add('hidden');
    if (fileName) fileName.textContent = 'Chưa chọn file';
    if (fileMeta) fileMeta.textContent = 'File import câu hỏi';
    if (previewBtn) {
      previewBtn.classList.add('hidden');
      previewBtn.disabled = true;
    }
    if (saveBtn) saveBtn.disabled = true;

    localStorage.removeItem('learninghub_add_subject_file_name_v1');
    localStorage.removeItem('learninghub_add_subject_file_size_v1');
    localStorage.removeItem('learninghub_add_subject_file_data_v1');
    localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

    window.__previewSelections = {};
    try { window.__closeImportPreviewModal?.(); } catch (e) { }
    notifySafe('Đã xóa file import');
  };

  document.addEventListener('click', function (e) {
    const btn = e.target.closest?.('.removeFileBtn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    window.__clearUserImportFile();
  }, true);
})();

// ===== PROMPT_STEP_UX_UI_POLISH_20260625 =====
// Nâng cấp giao diện bước "Lấy Prompt" trong form thêm môn.
(function () {
  function $(id) { return document.getElementById(id); }
  function enhancePromptStep() {
    const step = $('addStep2');
    if (!step || step.dataset.promptPolished === '1') return;
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
  window.__switchStep = function (step) {
    if (typeof oldSwitch === 'function') oldSwitch.apply(this, arguments);
    setTimeout(() => { if (Number(step) === 2) enhancePromptStep(); }, 0);
  };
  document.addEventListener('click', function (e) {
    const btn = e.target.closest?.('[onclick*="__switchStep(2)"]');
    if (btn) setTimeout(enhancePromptStep, 0);
  }, true);
  document.addEventListener('DOMContentLoaded', () => setTimeout(enhancePromptStep, 800));
})();

// ===== PROMPT_STEP_INSIDE_PANEL_FIX_20260625 =====
// Xóa nút "Sao chép prompt" bị trôi ra ngoài khung tab lớn.
(function () {
  function cleanStrayPromptButtons() {
    document.querySelectorAll('.subjectGate .polishedSubjectPanel > .aiCopyBtn, .subjectGate .polishedSubjectPanel > #btnCopyPrompt, .subjectGate > .aiCopyBtn, .subjectGate > #btnCopyPrompt').forEach(btn => {
      if (!btn.closest('#addStep2')) btn.remove();
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    cleanStrayPromptButtons();
    setTimeout(cleanStrayPromptButtons, 300);
    setTimeout(cleanStrayPromptButtons, 1000);
  });
  document.addEventListener('click', () => setTimeout(cleanStrayPromptButtons, 0), true);
})();

// ===== REMOVE_PROMPT_GUIDE_ROWS_20260625 =====
// Bỏ 3 dòng hướng dẫn trong bước Lấy Prompt.
(function () {
  function removePromptGuideRows() {
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
(function () {
  function cleanPromptTip() {
    document.querySelectorAll('#addStep2 .promptNoteBox, .promptNoteBox').forEach(el => el.remove());
  }
  function patchPromptModal() {
    const modal = document.getElementById('userPromptModal');
    if (!modal) return;
    modal.classList.remove('modal');
    modal.classList.add('userPromptModal');
    const box = modal.querySelector('.userPromptModalBox');
    if (box) box.classList.remove('box');
  }
  const oldOpen = window.__openUserAIPromptModal;
  window.__openUserAIPromptModal = function () {
    if (typeof oldOpen === 'function') oldOpen.apply(this, arguments);
    setTimeout(() => { patchPromptModal(); cleanPromptTip(); }, 0);
  };
  document.addEventListener('DOMContentLoaded', () => {
    cleanPromptTip();
    patchPromptModal();
    setTimeout(() => { cleanPromptTip(); patchPromptModal(); }, 300);
    setTimeout(() => { cleanPromptTip(); patchPromptModal(); }, 1000);
  });
  document.addEventListener('click', () => setTimeout(() => { cleanPromptTip(); patchPromptModal(); }, 0), true);
})();


// ===== IMPORT_PREVIEW_INLINE_EDIT_20260625 =====
// Sửa trực tiếp ngay trên card xem trước, không mở modal riêng.
(function () {
  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function getPreviewData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    return arr;
  }
  function opt(q, k) { return q?.options?.[k] || ''; }
  window.__previewQualityFilter = 'all';

  function autoDetectQuality(q) {
    const hasImg = !!(q.has_image || (q.images && q.images.length > 0));
    let risk = q.error_risk || '';
    let reason = q.error_risk_reason || '';
    if (!risk) {
      if (hasImg && (!q.images || !q.images.length || q.images.some(im => {
        const src = typeof im === 'string' ? im : (im.src || im.url || '');
        return !src || src.includes('URL_') || src.includes('MÔ_TẢ');
      }))) {
        risk = 'high'; reason = reason || 'Câu cần hình ảnh nhưng chưa có ảnh thực tế';
      } else if (String(q.answer || '').length > 1) {
        risk = 'medium'; reason = reason || 'Câu có nhiều đáp án đúng, cần kiểm tra kỹ';
      } else { risk = 'low'; }
    }
    q.has_image = hasImg;
    q.error_risk = risk;
    q.error_risk_reason = reason;
  }
  function riskLabel(r) { return { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[r] || r; }
  function riskColor(r) { return { low: '#27ae60', medium: '#f39c12', high: '#e74c3c' }[r] || '#999'; }

  function renderQualityStats(data) {
    var stats = document.getElementById('importPreviewStats');
    if (!stats) return;
    var imgCount = data.filter(function (q) { return q.has_image; }).length;
    var highCount = data.filter(function (q) { return q.error_risk === 'high'; }).length;
    var medCount = data.filter(function (q) { return q.error_risk === 'medium'; }).length;
    var lowCount = data.filter(function (q) { return q.error_risk === 'low'; }).length;
    var f = window.__previewQualityFilter;
    stats.textContent = '';
    var statRow = document.createElement('div');
    statRow.className = 'previewStatRow';
    var statItems = [
      { text: data.length + ' câu', color: '' },
      { text: imgCount + ' có ảnh', color: '#3498db' },
      { text: highCount + ' rủi ro cao', color: '#e74c3c' },
      { text: medCount + ' trung bình', color: '#f39c12' },
      { text: lowCount + ' thấp', color: '#27ae60' }
    ];
    statItems.forEach(function (item) {
      var span = document.createElement('span');
      span.className = 'previewStatItem';
      span.textContent = item.text;
      if (item.color) span.style.color = item.color;
      statRow.appendChild(span);
    });
    var filterRow = document.createElement('div');
    filterRow.className = 'previewFilterRow';
    var filters = [
      { key: 'all', label: 'Thư viện', border: '' },
      { key: 'has_image', label: '📷 Có ảnh', border: '' },
      { key: 'high', label: 'Rủi ro cao', border: '#e74c3c' },
      { key: 'medium', label: 'Trung bình', border: '#f39c12' },
      { key: 'low', label: 'Thấp', border: '#27ae60' }
    ];
    filters.forEach(function (fl) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'previewFilterBtn' + (f === fl.key ? ' active' : '');
      btn.textContent = fl.label;
      if (fl.border) btn.style.borderColor = fl.border;
      btn.addEventListener('click', function () { window.__setQualityFilter(fl.key); });
      filterRow.appendChild(btn);
    });
    stats.appendChild(statRow);
    stats.appendChild(filterRow);
  }

  window.__setQualityFilter = function (f) {
    window.__previewQualityFilter = f;
    const data = getPreviewData();
    renderQualityStats(data);
    renderQualityList(data);
  };

  window.__toggleQualityImage = function (i, val) {
    const data = getPreviewData();
    if (data[i]) { data[i].has_image = val; renderQualityStats(data); }
  };

  window.__setQualityRisk = function (i, val) {
    const data = getPreviewData();
    if (data[i]) {
      data[i].error_risk = val;
      renderQualityStats(data);
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (card) {
        card.style.borderLeftColor = riskColor(val);
        card.style.background = { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[val] || '';
        const badge = card.querySelector('.riskBadge');
        if (badge) { badge.style.background = riskColor(val); badge.textContent = riskLabel(val); }
      }
    }
  };

  function renderQualityList(data) {
    var list = document.getElementById('importPreviewList');
    if (!list) return;
    var f = window.__previewQualityFilter;
    var filtered = data.filter(function (q) {
      if (f === 'all') return true;
      if (f === 'has_image') return q.has_image;
      return q.error_risk === f;
    });
    list.textContent = '';
    if (!filtered.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:30px;opacity:.6';
      empty.textContent = 'Không có câu hỏi nào phù hợp bộ lọc.';
      list.appendChild(empty);
      return;
    }
    filtered.forEach(function (q) {
      var i = data.indexOf(q);
      list.appendChild(buildCard(q, i));
    });
  }

  function renderPreviewInline(data) {
    data = getPreviewData(data);
    data.forEach(autoDetectQuality);
    window.__previewQualityFilter = 'all';
    let modal = document.getElementById('importPreviewModal');
    if (modal) { modal.remove(); modal = null; }
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal importPreviewModal';
    var box = document.createElement('div');
    box.className = 'box importPreviewModalBox';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'modalX';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.onclick = function () { window.__closeImportPreviewModal(); };
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
    saveBtn.onclick = function () { window.__closeImportPreviewModal(); window.__submitSubjectRequest(); };
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
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) window.__closeImportPreviewModal(); });
    document.body.appendChild(modal);
    renderQualityStats(data);
    renderQualityList(data);
    modal.classList.remove('hidden');
  }
  function buildCard(q, i) {
    var answer = String(q.answer || '').toUpperCase();
    var risk = q.error_risk || 'low';
    var riskBg = { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[risk] || '';
    var card = document.createElement('article');
    card.className = 'previewQuestionCard';
    card.dataset.pcard = i;
    card.style.borderLeft = '4px solid ' + riskColor(risk);
    card.style.background = riskBg;
    // Header
    var top = document.createElement('div');
    top.className = 'previewQuestionTop';
    var numB = document.createElement('b');
    numB.textContent = 'Câu ' + (q.num || (i + 1));
    var actions = document.createElement('div');
    actions.className = 'previewTopActions';
    if (q.has_image) {
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
    editBtn.addEventListener('click', function () { window.__editImportPreviewQuestion(i); });
    actions.appendChild(editBtn);
    top.appendChild(numB);
    top.appendChild(actions);
    card.appendChild(top);
    // Risk reason
    if (q.error_risk_reason) {
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
    function renderImgThumbs() {
      imgArea.textContent = '';
      var imgs = q.images || [];
      if (imgs.length) {
        var thumbRow = document.createElement('div');
        thumbRow.className = 'previewQuestionImages';
        imgs.forEach(function (im, idx) {
          var src = typeof im === 'string' ? im : (im.src || im.url || '');
          if (!src) return;
          var wrap = document.createElement('div');
          wrap.className = 'previewImgThumb';
          var img = document.createElement('img');
          img.src = src;
          img.alt = 'Ảnh ' + (idx + 1);
          img.loading = 'lazy';
          var rmBtn = document.createElement('button');
          rmBtn.className = 'previewImgRm';
          rmBtn.type = 'button';
          rmBtn.textContent = '×';
          rmBtn.addEventListener('click', function () {
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
      fileInput.addEventListener('change', function (e) {
        var files = e.target.files || [];
        Array.prototype.forEach.call(files, function (file) {
          var fr = new FileReader();
          fr.onload = function () {
            if (!q.images) q.images = [];
            q.images.push({ id: 'prev_' + Date.now() + '_' + Math.random().toString(16).slice(2), src: fr.result, source: 'user-upload', name: file.name });
            if (!q.has_image) { q.has_image = true; }
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
      uploadBtn.addEventListener('click', function () { fileInput.click(); });
      uploadRow.appendChild(fileInput);
      uploadRow.appendChild(uploadBtn);
      if (q.images && q.images.length) {
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
    Object.entries(q.options || {}).forEach(function (entry) {
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
    cb.addEventListener('change', function () { window.__toggleQualityImage(i, this.checked); });
    var cbText = document.createElement('span');
    cbText.textContent = 'Có ảnh';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(cbText);
    var riskDiv = document.createElement('div');
    riskDiv.className = 'previewRiskSelect';
    var riskSpan = document.createElement('span');
    riskSpan.textContent = 'Rủi ro:';
    var sel = document.createElement('select');
    ['low', 'medium', 'high'].forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[val];
      if (risk === val) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { window.__setQualityRisk(i, this.value); });
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
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function getData() { return window.__previewImportData || []; }
  function optionKeys(q) {
    const keys = Object.keys(q?.options || {}).map(k => String(k).toUpperCase());
    return LETTERS.filter(k => keys.includes(k));
  }
  function nextKey(keys) { return LETTERS.find(k => !keys.includes(k)); }
  function markCorrect(card, answer) {
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      opt.classList.toggle('correct', answer.includes(k));
    });
  }
  function refreshCardOnly(i) {
    const q = getData()[i];
    if (!q) return;
    const open = window.__openImportPreviewModal;
    if (typeof open === 'function') {
      // render lại toàn preview để đồng bộ, nhưng giữ đúng layout xem
      open(getData());
    }
  }

  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!q || !card) return;
    if (card.classList.contains('inlineEditing')) return;

    card.dataset.backupHtml = card.innerHTML;
    card.classList.add('inlineEditing');

    const questionEl = card.querySelector('.previewQuestionText');
    if (questionEl) {
      questionEl.setAttribute('contenteditable', 'true');
      questionEl.dataset.field = 'question';
    }

    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const span = opt.querySelector('span');
      if (span) {
        span.setAttribute('contenteditable', 'true');
        span.dataset.optText = opt.dataset.k || '';
      }
    });

    const badge = card.querySelector('.previewAnswerBadge');
    if (badge) {
      badge.innerHTML = `Đáp án đúng: <input class="inlineCorrectInput" value="${escHtml(String(q.answer || '').toUpperCase())}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">`;
      const input = badge.querySelector('input');
      input?.addEventListener('input', () => markCorrect(card, String(input.value || '').toUpperCase()));
    }

    const grid = card.querySelector('.previewAnswerGrid');
    if (grid && !card.querySelector('.inlineAddOptionMini')) {
      grid.insertAdjacentHTML('afterend', `<button class="inlineAddOptionMini" type="button" title="Thêm đáp án" onclick="window.__inlineAddPreviewOption(${i})">+</button>`);
    }
    if (!card.querySelector('.inlineEditActionsMini')) {
      card.insertAdjacentHTML('beforeend', `<div class="inlineEditActionsMini"><button class="btn" type="button" onclick="window.__cancelInlineKeepEdit(${i})">Hủy</button><button class="primary" type="button" onclick="window.__saveInlineKeepEdit(${i})">Lưu sửa</button></div>`);
    }
    questionEl?.focus();
  };

  window.__inlineAddPreviewOption = function (i) {
    const card = document.querySelector(`[data-pcard="${i}"]`);
    const grid = card?.querySelector('.previewAnswerGrid');
    if (!card || !grid) return;
    const keys = Array.from(grid.querySelectorAll('.previewAnswerOption')).map(x => String(x.dataset.k || '').toUpperCase());
    const k = nextKey(keys);
    if (!k) return alert('Đã đủ số lựa chọn.');
    grid.insertAdjacentHTML('beforeend', `<div class="previewAnswerOption" data-pi="${i}" data-k="${k}"><b>${k}</b><span contenteditable="true" data-opt-text="${k}"></span></div>`);
    grid.querySelector(`[data-k="${k}"] span`)?.focus();
  };

  window.__cancelInlineKeepEdit = function (i) {
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!card) return;
    card.innerHTML = card.dataset.backupHtml || card.innerHTML;
    card.classList.remove('inlineEditing');
    delete card.dataset.backupHtml;
  };

  window.__saveInlineKeepEdit = function (i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!q || !card) return;

    const question = (card.querySelector('.previewQuestionText')?.textContent || '').trim();
    const answer = (card.querySelector('.inlineCorrectInput')?.value || '').trim().toUpperCase();
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');

    const options = {};
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      const v = (opt.querySelector('span')?.textContent || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần có ít nhất một đáp án lựa chọn.');

    q.question = question;
    q.options = options;
    q.answer = answer;
    refreshCardOnly(i);
    if (typeof notify === 'function') notify('Đã cập nhật câu hỏi');
  };
})();

// ===== INLINE_DELETE_OPTION_20260625 =====
// Thêm nút xóa từng đáp án khi sửa trực tiếp trong Xem trước import.
(function () {
  function ensureDeleteButtons(card) {
    if (!card) return;
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      if (opt.querySelector('.inlineDeleteOptionBtn')) return;
      const k = opt.dataset.k || '';
      opt.insertAdjacentHTML('beforeend', `<button class="inlineDeleteOptionBtn" type="button" title="Xóa đáp án ${k}" onclick="window.__deleteInlinePreviewOption(this)">×</button>`);
    });
  }
  window.__deleteInlinePreviewOption = function (btn) {
    const opt = btn?.closest?.('.previewAnswerOption');
    const card = btn?.closest?.('.previewQuestionCard');
    if (!opt || !card) return;
    const count = card.querySelectorAll('.previewAnswerOption').length;
    if (count <= 1) return alert('Phải còn ít nhất 1 đáp án.');
    const k = String(opt.dataset.k || '').toUpperCase();
    const input = card.querySelector('.inlineCorrectInput');
    if (input && k) {
      input.value = String(input.value || '').toUpperCase().replaceAll(k, '');
      card.querySelectorAll('.previewAnswerOption').forEach(o => {
        const ok = String(input.value || '').includes(String(o.dataset.k || '').toUpperCase());
        o.classList.toggle('correct', ok);
      });
    }
    opt.remove();
  };

  const oldEdit = window.__editImportPreviewQuestion;
  window.__editImportPreviewQuestion = function (i) {
    if (typeof oldEdit === 'function') oldEdit.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };

  const oldAdd = window.__inlineAddPreviewOption;
  window.__inlineAddPreviewOption = function (i) {
    if (typeof oldAdd === 'function') oldAdd.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };
})();


// ===== IMPORT PREVIEW COMPACT UX PATCH 20260626 =====
(function () {
  const STORE = 'learninghub_import_preview_compact_v1';
  function applyCompact(modal, compact) {
    if (!modal) return;
    modal.classList.toggle('compactMode', !!compact);
    const btn = modal.querySelector('.previewCompactToggle');
    if (btn) { btn.classList.toggle('active', !!compact); btn.textContent = compact ? 'Chi tiết' : 'Danh sách nhanh'; btn.title = compact ? 'Bấm để xem đầy đủ đáp án và công cụ' : 'Bấm để xem nhiều câu hơn'; }
  }
  function enhanceImportPreview() {
    const modal = document.getElementById('importPreviewModal');
    if (!modal || modal.dataset.compactEnhanced === '1') return;
    const save = modal.querySelector('.importPreviewSaveTop');
    if (!save || !save.parentNode) return;
    modal.dataset.compactEnhanced = '1';
    let compact = localStorage.getItem(STORE); compact = compact === null ? true : compact === '1';
    const actions = document.createElement('div'); actions.className = 'importPreviewHeadActions';
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'previewCompactToggle';
    toggle.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); compact = !modal.classList.contains('compactMode'); localStorage.setItem(STORE, compact ? '1' : '0'); applyCompact(modal, compact); });
    save.parentNode.insertBefore(actions, save); actions.appendChild(toggle); actions.appendChild(save); applyCompact(modal, compact);
  }
  function start() { enhanceImportPreview(); if (window.MutationObserver && document.body) { new MutationObserver(enhanceImportPreview).observe(document.body, { childList: true, subtree: true }); } setInterval(enhanceImportPreview, 700); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


// SIMPLE_IMPORT_PREVIEW_ANSWER_ONLY_FINAL_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function getData(data) { const arr = data || window.__previewImportData || []; window.__previewImportData = arr; return arr; }
  function normAns(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function correctText(q) { const ans = normAns(q); if (!ans) return 'Chưa có đáp án'; return ans.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | '); }
  function nextKey(opts) { const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase())); return LETTERS.find(k => !used.has(k)); }
  function renderCard(q, i) { const ans = normAns(q) || '?'; return `<article class="simplePreviewCard" data-simple-card="${i}"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></article>`; }
  function renderEditCard(q, i) { const opts = q.options || {}; const optionRows = Object.keys(opts).sort().map(k => `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`).join(''); return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`; }
  function renderList(data) { const list = document.getElementById('simplePreviewList'); if (list) list.innerHTML = data.map(renderCard).join(''); }
  function openSimplePreview(data) { data = getData(data); let modal = document.getElementById('importPreviewModal'); if (modal) modal.remove(); modal = document.createElement('div'); modal.id = 'importPreviewModal'; modal.className = 'modal simpleImportPreviewModal'; modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Bấm “Sửa” để chỉnh toàn bộ câu và các đáp án.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div class="simplePreviewCount">${data.length} câu hỏi</div><div id="simplePreviewList" class="simplePreviewList"></div></div>`; document.body.appendChild(modal); renderList(data); }
  function saveEdit(i) { const data = getData(); const q = data[i]; const card = document.querySelector(`[data-simple-card="${i}"]`); if (!q || !card) return; const question = (card.querySelector('[data-edit-question]')?.value || '').trim(); const answer = (card.querySelector('[data-edit-answer]')?.value || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); if (!question) return alert('Câu hỏi không được để trống.'); if (!answer) return alert('Đáp án đúng không được để trống.'); const options = {}; card.querySelectorAll('[data-edit-opt]').forEach(inp => { const k = String(inp.dataset.editOpt || '').toUpperCase(); const v = (inp.value || '').trim(); if (k && v) options[k] = v; }); if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.'); for (const k of answer.split('')) { if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); } q.question = question; q.answer = answer; q.options = options; q.answer_text = answer.split('').map(k => k + '. ' + (options[k] || '')).join('; '); renderList(data); if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1)); }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-simple-close]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); return; } if (e.target.closest('[data-simple-save]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); window.__submitSubjectRequest?.(); return; } const edit = e.target.closest('[data-simple-edit]'); if (edit) { const i = +edit.dataset.simpleEdit; const data = getData(); const card = document.querySelector(`[data-simple-card="${i}"]`); if (card && data[i]) { card.outerHTML = renderEditCard(data[i], i); document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus(); } return; } const cancel = e.target.closest('[data-cancel-simple]'); if (cancel) { renderList(getData()); return; } const save = e.target.closest('[data-save-simple]'); if (save) { saveEdit(+save.dataset.saveSimple); return; } const add = e.target.closest('[data-add-opt]'); if (add) { const i = +add.dataset.addOpt; const data = getData(); const q = data[i]; const k = nextKey(q.options || {}); if (!k) return alert('Đã đủ số đáp án.'); q.options = q.options || {}; q.options[k] = ''; const card = document.querySelector(`[data-simple-card="${i}"]`); if (card) { card.outerHTML = renderEditCard(q, i); document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus(); } return; } const del = e.target.closest('[data-del-opt]'); if (del) { const card = del.closest('[data-simple-card]'); const i = +(card?.dataset.simpleCard || 0); const q = getData()[i]; const k = del.dataset.delOpt; if (q?.options && k) { delete q.options[k]; card.outerHTML = renderEditCard(q, i); } return; } });
  window.__openImportPreviewModal = openSimplePreview;
  window.__editImportPreviewQuestion = function (i) { const data = getData(); const card = document.querySelector(`[data-simple-card="${i}"]`); if (card && data[i]) card.outerHTML = renderEditCard(data[i], i); };
})();


// FILTERED_ANSWER_ONLY_PREVIEW_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function getData(data) { const arr = data || window.__previewImportData || []; window.__previewImportData = arr; arr.forEach(detect); return arr; }
  function normAns(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function detect(q) {
    q.has_image = !!(q.has_image || (q.images && q.images.length));
    if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
    return q;
  }
  function correctText(q) { const ans = normAns(q); if (!ans) return 'Chưa có đáp án'; return ans.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | '); }
  function riskColor(r) { return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999'; }
  function riskLabel(r) { return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r; }
  function nextKey(opts) { const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase())); return LETTERS.find(k => !used.has(k)); }
  function pass(q) { if (currentFilter === 'all') return true; if (currentFilter === 'has_image') return !!q.has_image; return q.error_risk === currentFilter; }
  function stat(data) { return { total: data.length, img: data.filter(q => q.has_image).length, high: data.filter(q => q.error_risk === 'high').length, medium: data.filter(q => q.error_risk === 'medium').length, low: data.filter(q => q.error_risk === 'low').length }; }
  function renderStats(data) {
    const s = stat(data); const box = document.getElementById('simplePreviewStats'); if (!box) return;
    const filters = [['all', 'Thư viện'], ['has_image', '📷 Có ảnh'], ['high', 'Rủi ro cao'], ['medium', 'Trung bình'], ['low', 'Thấp']];
    box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="simpleFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
  }
  function renderCard(q, i) { const ans = normAns(q) || '?'; return `<article class="simplePreviewCard" data-simple-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span>${q.has_image ? '<span class="simplePreviewImgMark">📷</span>' : ''}<button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></div></article>`; }
  function renderEditCard(q, i) { const opts = q.options || {}; const optionRows = Object.keys(opts).sort().map(k => `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`).join(''); return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`; }
  function renderList(data) { const list = document.getElementById('simplePreviewList'); if (!list) return; const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q)); list.innerHTML = filtered.length ? filtered.map(x => renderCard(x.q, x.i)).join('') : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>'; renderStats(data); }
  function openSimplePreview(data) { data = getData(data); let modal = document.getElementById('importPreviewModal'); if (modal) modal.remove(); modal = document.createElement('div'); modal.id = 'importPreviewModal'; modal.className = 'modal simpleImportPreviewModal'; modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Dùng bộ lọc để xem câu có ảnh hoặc câu dễ sai.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`; document.body.appendChild(modal); renderList(data); }
  function saveEdit(i) { const data = getData(); const q = data[i]; const card = document.querySelector(`[data-simple-card="${i}"]`); if (!q || !card) return; const question = (card.querySelector('[data-edit-question]')?.value || '').trim(); const answer = (card.querySelector('[data-edit-answer]')?.value || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); if (!question) return alert('Câu hỏi không được để trống.'); if (!answer) return alert('Đáp án đúng không được để trống.'); const options = {}; card.querySelectorAll('[data-edit-opt]').forEach(inp => { const k = String(inp.dataset.editOpt || '').toUpperCase(); const v = (inp.value || '').trim(); if (k && v) options[k] = v; }); if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.'); for (const k of answer.split('')) { if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); } q.question = question; q.answer = answer; q.options = options; q.answer_text = answer.split('').map(k => k + '. ' + (options[k] || '')).join('; '); renderList(data); if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1)); }
  document.addEventListener('click', function (e) { const filter = e.target.closest('.simpleFilterBtn'); if (filter) { currentFilter = filter.dataset.filter || 'all'; renderList(getData()); return; } if (e.target.closest('[data-simple-close]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); return; } if (e.target.closest('[data-simple-save]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); window.__submitSubjectRequest?.(); return; } const edit = e.target.closest('[data-simple-edit]'); if (edit) { const i = +edit.dataset.simpleEdit; const data = getData(); const card = document.querySelector(`[data-simple-card="${i}"]`); if (card && data[i]) { card.outerHTML = renderEditCard(data[i], i); document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus(); } return; } const cancel = e.target.closest('[data-cancel-simple]'); if (cancel) { renderList(getData()); return; } const save = e.target.closest('[data-save-simple]'); if (save) { saveEdit(+save.dataset.saveSimple); return; } const add = e.target.closest('[data-add-opt]'); if (add) { const i = +add.dataset.addOpt; const data = getData(); const q = data[i]; const k = nextKey(q.options || {}); if (!k) return alert('Đã đủ số đáp án.'); q.options = q.options || {}; q.options[k] = ''; const card = document.querySelector(`[data-simple-card="${i}"]`); if (card) { card.outerHTML = renderEditCard(q, i); document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus(); } return; } const del = e.target.closest('[data-del-opt]'); if (del) { const card = del.closest('[data-simple-card]'); const i = +(card?.dataset.simpleCard || 0); const q = getData()[i]; const k = del.dataset.delOpt; if (q?.options && k) { delete q.options[k]; card.outerHTML = renderEditCard(q, i); } return; } });
  window.__openImportPreviewModal = openSimplePreview;
  window.__editImportPreviewQuestion = function (i) { const data = getData(); const card = document.querySelector(`[data-simple-card="${i}"]`); if (card && data[i]) card.outerHTML = renderEditCard(data[i], i); };
})();


// IMAGE_THUMB_PREVIEW_TOP_EDIT_ACTIONS_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function getData(data) { const arr = data || window.__previewImportData || []; window.__previewImportData = arr; arr.forEach(detect); return arr; }
  function normAns(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function detect(q) { q.images = q.images || []; q.has_image = !!(q.has_image || (q.images && q.images.length)); if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low'; return q; }
  function correctText(q) { const ans = normAns(q); if (!ans) return 'Chưa có đáp án'; return ans.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | '); }
  function riskColor(r) { return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999'; }
  function riskLabel(r) { return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r; }
  function nextKey(opts) { const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase())); return LETTERS.find(k => !used.has(k)); }
  function imgSrc(im) { return typeof im === 'string' ? im : (im?.src || im?.url || ''); }
  function pass(q) { if (currentFilter === 'all') return true; if (currentFilter === 'has_image') return !!q.has_image; return q.error_risk === currentFilter; }
  function stat(data) { return { total: data.length, img: data.filter(q => q.has_image).length, high: data.filter(q => q.error_risk === 'high').length, medium: data.filter(q => q.error_risk === 'medium').length, low: data.filter(q => q.error_risk === 'low').length }; }
  function renderStats(data) { const s = stat(data), box = document.getElementById('simplePreviewStats'); if (!box) return; const filters = [['all', 'Thư viện'], ['has_image', '📷 Có ảnh'], ['high', 'Rủi ro cao'], ['medium', 'Trung bình'], ['low', 'Thấp']]; box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="imagePreviewFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-imgui-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`; }
  function miniImages(q) { const imgs = (q.images || []).map(imgSrc).filter(Boolean); if (!imgs.length) return '<div class="imageMiniPreview"></div>'; return `<div class="imageMiniPreview"><img src="${esc(imgs[0])}" alt="Ảnh preview">${imgs.length > 1 ? `<span class="imageMiniCount">+${imgs.length - 1}</span>` : ''}</div>`; }
  function renderCard(q, i) { const ans = normAns(q) || '?'; return `<article class="simplePreviewCard" data-imgui-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="imagePreviewListRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="simplePreviewEditBtn" type="button" data-imgui-edit="${i}">Sửa</button></div></div></article>`; }
  function renderImages(q, i) { const imgs = q.images || []; return `<div class="simpleEditImages"><div class="simpleEditImagesHead"><span>Ảnh của câu hỏi</span><button class="simpleImageUploadBtn" type="button" data-imgui-pick-img="${i}">+ Thêm ảnh</button><input class="simpleImgHiddenInput" type="file" accept="image/*" multiple data-imgui-input="${i}"></div><div class="simpleImageThumbs">${imgs.length ? imgs.map((im, idx) => `<div class="simpleImageThumb"><button class="simpleImageRemove" type="button" data-imgui-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}"></div>`).join('') : '<div class="simpleNoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`; }
  function renderEditCard(q, i) { const opts = q.options || {}; const optionRows = Object.keys(opts).sort().map(k => `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-imgui-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-imgui-del-opt="${esc(k)}">×</button></div>`).join(''); return `<article class="simplePreviewCard simpleEditCard" data-imgui-card="${i}"><div class="simpleEditHead imageEditHeadTop"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="imageEditHeadActions"><button class="btn" type="button" data-imgui-cancel="${i}">Hủy</button><button class="primary" type="button" data-imgui-save="${i}">Lưu sửa</button></div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-imgui-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-imgui-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div>${renderImages(q, i)}<div class="simpleEditBottom imageEditBottomOnlyAdd"><button class="btn" type="button" data-imgui-add-opt="${i}">+ Thêm đáp án</button></div></article>`; }
  function renderList(data) { const list = document.getElementById('simplePreviewList'); if (!list) return; const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q)); list.innerHTML = filtered.length ? filtered.map(x => renderCard(x.q, x.i)).join('') : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>'; renderStats(data); }
  function openPreview(data) { data = getData(data); let modal = document.getElementById('importPreviewModal'); if (modal) modal.remove(); modal = document.createElement('div'); modal.id = 'importPreviewModal'; modal.className = 'modal simpleImportPreviewModal'; modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-imgui-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-imgui-submit>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`; document.body.appendChild(modal); renderList(data); }
  function saveEdit(i) { const data = getData(); const q = data[i]; const card = document.querySelector(`[data-imgui-card="${i}"]`); if (!q || !card) return; const question = (card.querySelector('[data-imgui-question]')?.value || '').trim(); const answer = (card.querySelector('[data-imgui-answer]')?.value || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); if (!question) return alert('Câu hỏi không được để trống.'); if (!answer) return alert('Đáp án đúng không được để trống.'); const options = {}; card.querySelectorAll('[data-imgui-opt]').forEach(inp => { const k = String(inp.dataset.imguiOpt || '').toUpperCase(); const v = (inp.value || '').trim(); if (k && v) options[k] = v; }); if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.'); for (const k of answer.split('')) { if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); } q.question = question; q.answer = answer; q.options = options; q.answer_text = answer.split('').map(k => k + '. ' + (options[k] || '')).join('; '); q.has_image = !!(q.images && q.images.length); renderList(data); if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1)); }
  document.addEventListener('click', function (e) { const filter = e.target.closest('[data-imgui-filter]'); if (filter) { currentFilter = filter.dataset.imguiFilter || 'all'; renderList(getData()); return; } if (e.target.closest('[data-imgui-close]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); return; } if (e.target.closest('[data-imgui-submit]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); window.__submitSubjectRequest?.(); return; } const edit = e.target.closest('[data-imgui-edit]'); if (edit) { const i = +edit.dataset.imguiEdit; const data = getData(); const card = document.querySelector(`[data-imgui-card="${i}"]`); if (card && data[i]) { card.outerHTML = renderEditCard(data[i], i); document.querySelector(`[data-imgui-card="${i}"] textarea`)?.focus(); } return; } const cancel = e.target.closest('[data-imgui-cancel]'); if (cancel) { renderList(getData()); return; } const save = e.target.closest('[data-imgui-save]'); if (save) { saveEdit(+save.dataset.imguiSave); return; } const pick = e.target.closest('[data-imgui-pick-img]'); if (pick) { document.querySelector(`[data-imgui-input="${pick.dataset.imguiPickImg}"]`)?.click(); return; } const rm = e.target.closest('[data-imgui-rm-img]'); if (rm) { const card = rm.closest('[data-imgui-card]'); const i = +(card?.dataset.imguiCard || 0); const q = getData()[i]; if (q?.images) { q.images.splice(+rm.dataset.imguiRmImg, 1); q.has_image = !!q.images.length; card.outerHTML = renderEditCard(q, i); } return; } const add = e.target.closest('[data-imgui-add-opt]'); if (add) { const i = +add.dataset.imguiAddOpt; const data = getData(); const q = data[i]; const k = nextKey(q.options || {}); if (!k) return alert('Đã đủ số đáp án.'); q.options = q.options || {}; q.options[k] = ''; const card = document.querySelector(`[data-imgui-card="${i}"]`); if (card) { card.outerHTML = renderEditCard(q, i); document.querySelector(`[data-imgui-card="${i}"] [data-imgui-opt="${k}"]`)?.focus(); } return; } const del = e.target.closest('[data-imgui-del-opt]'); if (del) { const card = del.closest('[data-imgui-card]'); const i = +(card?.dataset.imguiCard || 0); const q = getData()[i]; const k = del.dataset.imguiDelOpt; if (q?.options && k) { delete q.options[k]; card.outerHTML = renderEditCard(q, i); } return; } });
  document.addEventListener('change', async function (e) { const inp = e.target.closest('[data-imgui-input]'); if (!inp) return; const i = +inp.dataset.imguiInput; const q = getData()[i]; if (!q) return; q.images = q.images || []; const files = Array.from(inp.files || []); if (!files.length) return; inp.disabled = true; if (typeof notify === 'function') notify('Đang upload ảnh...'); try { for (const file of files) { if (window.__LHUploadCloudinary) { const uploaded = await window.__LHUploadCloudinary(file); if (uploaded) q.images.push(uploaded); } else { const fr = new FileReader(); const p = new Promise(resolve => { fr.onload = function () { q.images.push({ id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2), src: fr.result, source: 'user-upload', name: file.name }); resolve() }; fr.readAsDataURL(file) }); await p; } } q.has_image = true; const card = document.querySelector(`[data-imgui-card="${i}"]`); if (card) card.outerHTML = renderEditCard(q, i); if (typeof notify === 'function') notify('Đã upload ảnh thành URL'); } catch (err) { alert(err.message || err) } finally { inp.disabled = false; inp.value = ''; } });
  window.__openImportPreviewModal = openPreview;
  window.__editImportPreviewQuestion = function (i) { const data = getData(); const card = document.querySelector(`[data-imgui-card="${i}"]`); if (card && data[i]) card.outerHTML = renderEditCard(data[i], i); };
})();


// FINAL_CLEAN_IMPORT_PREVIEW_V7_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function getData(data) { const arr = data || window.__previewImportData || []; window.__previewImportData = arr; arr.forEach(detect); return arr; }
  function normAns(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function detect(q) { q.images = q.images || []; q.has_image = !!(q.has_image || (q.images && q.images.length)); if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low'; return q; }
  function correctText(q) { const ans = normAns(q); if (!ans) return 'Chưa có đáp án'; return ans.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | '); }
  function riskColor(r) { return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999'; }
  function riskLabel(r) { return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r; }
  function nextKey(opts) { const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase())); return LETTERS.find(k => !used.has(k)); }
  function imgSrc(im) { return typeof im === 'string' ? im : (im?.src || im?.url || ''); }
  function pass(q) { if (currentFilter === 'all') return true; if (currentFilter === 'has_image') return !!q.has_image; return q.error_risk === currentFilter; }
  function stats(data) { return { total: data.length, img: data.filter(q => q.has_image).length, high: data.filter(q => q.error_risk === 'high').length, medium: data.filter(q => q.error_risk === 'medium').length, low: data.filter(q => q.error_risk === 'low').length }; }
  function renderStats(data) { const s = stats(data), box = document.getElementById('v7Stats'); if (!box) return; const filters = [['all', 'Thư viện'], ['has_image', '📷 Có ảnh'], ['high', 'Rủi ro cao'], ['medium', 'Trung bình'], ['low', 'Thấp']]; box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${filters.map(f => `<button type="button" class="v7FilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-v7-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`; }
  function miniImages(q) { const imgs = (q.images || []).map(imgSrc).filter(Boolean); if (!imgs.length) return '<div class="v7MiniImgs"></div>'; return `<div class="v7MiniImgs"><img src="${esc(imgs[0])}" alt="Ảnh preview">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ''}</div>`; }
  function renderCard(q, i) { const ans = normAns(q) || '?'; return `<article class="v7Card" data-v7-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="v7Row"><div class="v7Num">Câu ${esc(q.num || i + 1)}</div><div class="v7Main"><div class="v7Question">${esc(q.question || '')}</div><div class="v7Answer"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="v7EditBtn" type="button" data-v7-edit="${i}">Sửa</button></div></div></article>`; }
  function renderImages(q, i) { const imgs = q.images || []; return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-v7-pick-img="${i}">+ Thêm ảnh</button><input class="v7HiddenInput" type="file" accept="image/*" multiple data-v7-input="${i}"></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, idx) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-v7-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}"></div>`).join('') : '<div class="v7NoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`; }
  function renderEditCard(q, i) { const opts = q.options || {}; const optionRows = Object.keys(opts).sort().map(k => `<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-v7-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-v7-del-opt="${esc(k)}">×</button></div>`).join(''); return `<article class="v7Card" data-v7-card="${i}"><div class="v7EditHead"><div class="v7EditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="v7EditHeadActions"><button class="btn" type="button" data-v7-cancel="${i}">Hủy</button><button class="primary" type="button" data-v7-save="${i}">Lưu sửa</button></div></div><div class="v7EditGrid"><div class="v7Field"><label>Câu hỏi</label><textarea data-v7-question>${esc(q.question || '')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-v7-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="v7Field" style="margin-top:10px"><label>Các đáp án</label><div class="v7Options">${optionRows}</div></div>${renderImages(q, i)}<div class="v7Bottom"><button class="btn" type="button" data-v7-add-opt="${i}">+ Thêm đáp án</button></div></article>`; }
  function renderList(data) { const list = document.getElementById('v7List'); if (!list) return; const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q)); list.innerHTML = filtered.length ? filtered.map(x => renderCard(x.q, x.i)).join('') : '<div class="v7Empty">Không có câu nào phù hợp bộ lọc.</div>'; renderStats(data); }
  function openPreview(data) { data = getData(data); let modal = document.getElementById('importPreviewModal'); if (modal) modal.remove(); modal = document.createElement('div'); modal.id = 'importPreviewModal'; modal.className = 'modal v7ImportModal'; modal.innerHTML = `<div class="box v7ImportBox"><button class="modalX" type="button" data-v7-close>×</button><div class="v7Head"><div><span class="v7Label">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="v7Hint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="v7TopActions"><button class="primary v7SaveTop" type="button" data-v7-submit>Lưu Môn Học</button></div></div><div id="v7Stats" class="v7Stats"></div><div id="v7List" class="v7List"></div></div>`; document.body.appendChild(modal); renderList(data); }
  function saveEdit(i) { const data = getData(); const q = data[i]; const card = document.querySelector(`[data-v7-card="${i}"]`); if (!q || !card) return; const question = (card.querySelector('[data-v7-question]')?.value || '').trim(); const answer = (card.querySelector('[data-v7-answer]')?.value || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); if (!question) return alert('Câu hỏi không được để trống.'); if (!answer) return alert('Đáp án đúng không được để trống.'); const options = {}; card.querySelectorAll('[data-v7-opt]').forEach(inp => { const k = String(inp.dataset.v7Opt || '').toUpperCase(); const v = (inp.value || '').trim(); if (k && v) options[k] = v; }); if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.'); for (const k of answer.split('')) { if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); } q.question = question; q.answer = answer; q.options = options; q.answer_text = answer.split('').map(k => k + '. ' + (options[k] || '')).join('; '); q.has_image = !!(q.images && q.images.length); renderList(data); if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1)); }
  document.addEventListener('click', function (e) { const filter = e.target.closest('[data-v7-filter]'); if (filter) { currentFilter = filter.dataset.v7Filter || 'all'; renderList(getData()); return; } if (e.target.closest('[data-v7-close]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); return; } if (e.target.closest('[data-v7-submit]')) { document.getElementById('importPreviewModal')?.classList.add('hidden'); window.__submitSubjectRequest?.(); return; } const edit = e.target.closest('[data-v7-edit]'); if (edit) { const i = +edit.dataset.v7Edit; const data = getData(); const card = document.querySelector(`[data-v7-card="${i}"]`); if (card && data[i]) { card.outerHTML = renderEditCard(data[i], i); document.querySelector(`[data-v7-card="${i}"] textarea`)?.focus(); } return; } const cancel = e.target.closest('[data-v7-cancel]'); if (cancel) { renderList(getData()); return; } const save = e.target.closest('[data-v7-save]'); if (save) { saveEdit(+save.dataset.v7Save); return; } const pick = e.target.closest('[data-v7-pick-img]'); if (pick) { document.querySelector(`[data-v7-input="${pick.dataset.v7PickImg}"]`)?.click(); return; } const rm = e.target.closest('[data-v7-rm-img]'); if (rm) { const card = rm.closest('[data-v7-card]'); const i = +(card?.dataset.v7Card || 0); const q = getData()[i]; if (q?.images) { q.images.splice(+rm.dataset.v7RmImg, 1); q.has_image = !!q.images.length; card.outerHTML = renderEditCard(q, i); } return; } const add = e.target.closest('[data-v7-add-opt]'); if (add) { const i = +add.dataset.v7AddOpt; const data = getData(); const q = data[i]; const k = nextKey(q.options || {}); if (!k) return alert('Đã đủ số đáp án.'); q.options = q.options || {}; q.options[k] = ''; const card = document.querySelector(`[data-v7-card="${i}"]`); if (card) { card.outerHTML = renderEditCard(q, i); document.querySelector(`[data-v7-card="${i}"] [data-v7-opt="${k}"]`)?.focus(); } return; } const del = e.target.closest('[data-v7-del-opt]'); if (del) { const card = del.closest('[data-v7-card]'); const i = +(card?.dataset.v7Card || 0); const q = getData()[i]; const k = del.dataset.v7DelOpt; if (q?.options && k) { delete q.options[k]; card.outerHTML = renderEditCard(q, i); } return; } });
  document.addEventListener('change', async function (e) { const inp = e.target.closest('[data-v7-input]'); if (!inp) return; const i = +inp.dataset.v7Input; const q = getData()[i]; if (!q) return; q.images = q.images || []; const files = Array.from(inp.files || []); if (!files.length) return; inp.disabled = true; if (typeof notify === 'function') notify('Đang upload ảnh...'); try { for (const file of files) { if (window.__LHUploadCloudinary) { const uploaded = await window.__LHUploadCloudinary(file); if (uploaded) q.images.push(uploaded); } else { const fr = new FileReader(); const p = new Promise(resolve => { fr.onload = function () { q.images.push({ id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2), src: fr.result, source: 'user-upload', name: file.name }); resolve() }; fr.readAsDataURL(file) }); await p; } } q.has_image = true; const card = document.querySelector(`[data-v7-card="${i}"]`); if (card) card.outerHTML = renderEditCard(q, i); if (typeof notify === 'function') notify('Đã upload ảnh thành URL'); } catch (err) { alert(err.message || err) } finally { inp.disabled = false; inp.value = ''; } });
  window.__openImportPreviewModal = openPreview;
  window.__editImportPreviewQuestion = function (i) { const data = getData(); const card = document.querySelector(`[data-v7-card="${i}"]`); if (card && data[i]) card.outerHTML = renderEditCard(data[i], i); };
})();


// IMAGE_LIGHTBOX_PREVIEW_CLICK_20260626
(function () {
  function ensureLightbox() {
    let lb = document.getElementById('v7ImageLightbox');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'v7ImageLightbox';
    lb.className = 'v7Lightbox hidden';
    lb.innerHTML = '<div class="v7LightboxInner"><button class="v7LightboxClose" type="button" aria-label="Đóng">×</button><img class="v7LightboxImg" alt="Ảnh phóng to"></div>';
    document.body.appendChild(lb);
    return lb;
  }
  function openImg(src) {
    if (!src) return;
    const lb = ensureLightbox();
    const img = lb.querySelector('.v7LightboxImg');
    if (img) img.src = src;
    lb.classList.remove('hidden');
  }
  function closeImg() {
    const lb = document.getElementById('v7ImageLightbox');
    if (!lb) return;
    lb.classList.add('hidden');
    const img = lb.querySelector('.v7LightboxImg');
    if (img) img.removeAttribute('src');
  }
  document.addEventListener('click', function (e) {
    const thumb = e.target.closest('.v7MiniImgs img, .v7Thumb img');
    if (thumb) {
      e.preventDefault();
      e.stopPropagation();
      openImg(thumb.currentSrc || thumb.src);
      return;
    }
    if (e.target.closest('.v7LightboxClose') || e.target.id === 'v7ImageLightbox') {
      closeImg();
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeImg();
  });
})();


;/* FINAL APP CLEANUP 20260627: remove old/duplicate UI shells after load */
(function () {
  window.__APP_UI_CLEAN_FINAL__ = '20260627';
  function cleanupOldUI() {
    ['#hodLoginScreen', '#hodRoleBar', '#hodUserDock', '#hodFinalRoleBar', '#hodFinalLogin', '.hodAuthLanding', '.hodFloatingAuth', '.legacyLogin', '.legacyAuth', '.oldLanding'].forEach(function (s) {
      document.querySelectorAll(s).forEach(function (el) { el.remove(); });
    });
    // Giữ 1 avatar/menu/chip cuối, tránh patch cũ tạo trùng.
    ['#hodTopAvatar', '#subjectTopChip', '#hodAccountMenu'].forEach(function (s) {
      var arr = Array.from(document.querySelectorAll(s));
      arr.slice(0, Math.max(0, arr.length - 1)).forEach(function (el) { el.remove(); });
    });
    // Không cho nút admin cũ/float hiện với user thường.
    if (!window.HODSupabase?.isAdmin?.()) {
      document.querySelectorAll('#adminOpenBtn,#hodFloatAdmin').forEach(function (el) { el.remove(); });
      document.getElementById('adminModal')?.classList.add('hidden');
    }
    // Tắt nút random nếu theme cũ còn inject lại.
    document.querySelectorAll('#shuffle,#stShuffle').forEach(function (el) { el.style.display = 'none'; el.disabled = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanupOldUI); else cleanupOldUI();
  setTimeout(cleanupOldUI, 300);
  setTimeout(cleanupOldUI, 1200);
})();


// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 =====
(function () {
  let examOnlyIndex = 0;
  let examOnlyReview = false;
  let examSelectedCodes = [];
  let timerInt = null;
  let examStart = 0;
  let examBaseMs = 0;
  let examElapsed = '00:00';

  const EXAM_STORE = 'learninghub_exam_state_v1';
  const $ = id => document.getElementById(id);
  const E = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = s => typeof sortAns === 'function' ? sortAns(s || '') : String(s || '').split('').sort().join('');
  const FMT = ms => typeof fmt === 'function' ? fmt(ms) : String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  const IMG = c => { try { return typeof imgsHTML === 'function' ? imgsHTML(c) : '' } catch (e) { return '' } };
  const EXPLAIN = c => {
    try { return typeof finalAnswerText === 'function' ? finalAnswerText(c) : answerText(c) }
    catch (e) { return String(c?.answer || '').split('').map(k => k + '. ' + ((c?.options || {})[k] || '')).join('; ') }
  };
  const done = () => Object.keys(qSel || {}).filter(k => qSel[k]).length;
  const examSubject = () => { try { return localStorage.getItem('learninghub_subject_code_merged_v1') || '' } catch (e) { return '' } };
  const displayCode = code => String(code || '').replace(/_\d+$/i, '');
  const baseCode = code => String(code || '').split(/[_\-\s]/)[0].toUpperCase();

  function timeMsFromText(t) {
    const m = String(t || '').match(/^(\d+):(\d+)$/);
    return m ? ((+m[1] * 60 + +m[2]) * 1000) : 0;
  }
  function setTimerText() {
    const el = $('examTimer');
    if (el) el.textContent = examElapsed;
  }
  function startTimer(resumeMs = 0) {
    clearInterval(timerInt);
    examBaseMs = Math.max(0, resumeMs || 0);
    examStart = Date.now();
    examElapsed = FMT(examBaseMs);
    setTimerText();
    timerInt = setInterval(() => {
      examElapsed = FMT(examBaseMs + Date.now() - examStart);
      setTimerText();
    }, 1000);
  }
  function stopTimer() { clearInterval(timerInt); timerInt = null; }
  function resetTimer() { stopTimer(); examBaseMs = 0; examStart = 0; examElapsed = '00:00'; setTimerText(); }
  function nowTimerMs() { return examSubmitted || !timerInt ? timeMsFromText(examElapsed) : examBaseMs + Date.now() - examStart; }

  function saveExam() {
    try {
      if (!qSet || !qSet.length) return;
      localStorage.setItem(EXAM_STORE, JSON.stringify({
        subject: examSubject(),
        nums: (qSet || []).map(c => c.num),
        ids: (qSet || []).map(c => c.id || ''),
        qSel: qSel || {},
        submitted: !!examSubmitted,
        index: examOnlyIndex || 0,
        review: !!examOnlyReview,
        qCnt: qCnt || 0,
        timerMs: nowTimerMs(),
        timer: examElapsed
      }));
    } catch (e) { }
  }
  function clearExam() { try { localStorage.removeItem(EXAM_STORE) } catch (e) { } }
  function restoreExam() {
    try {
      const st = JSON.parse(localStorage.getItem(EXAM_STORE) || 'null');
      if (!st || !Array.isArray(st.nums) || !st.nums.length || !Array.isArray(RAW) || !RAW.length) return false;
      if (st.subject && examSubject() && st.subject !== examSubject()) return false;
      const restored = st.nums.map((n, i) => RAW.find(c => String(c.id || '') === String(st.ids?.[i] || '') || Number(c.num) === Number(n))).filter(Boolean);
      if (!restored.length) return false;
      qSet = restored;
      qSel = st.qSel || {};
      examSubmitted = !!st.submitted;
      examOnlyIndex = Math.max(0, Math.min(+st.index || 0, qSet.length - 1));
      examOnlyReview = !!st.review;
      qCnt = st.qCnt || 0;
      quizMode = 'exam';
      examElapsed = st.timer || FMT(+st.timerMs || 0);
      if (!examSubmitted && !timerInt) startTimer(+st.timerMs || timeMsFromText(examElapsed));
      return true;
    } catch (e) { return false }
  }

  function markTab() { document.querySelectorAll('.tab').forEach(t => { if (t.dataset?.tab === 'quiz') t.textContent = 'Kiểm tra' }); }
  function removeOldQuizUI() { document.querySelectorAll('#quiz .modeRow,#quiz .cntGrid:not(.examOnlyCountGrid),#practiceMode,#examMode').forEach(x => x.remove()) }

  function cachedSubjects() {
    let subjects = typeof window.getSubjectsCache === 'function' ? (window.getSubjectsCache() || []) : [];
    try {
      if (!subjects.length) {
        const cached = JSON.parse(localStorage.getItem('learninghub_subjects_cache_v1') || '[]');
        if (Array.isArray(cached)) subjects = cached;
      }
    } catch (e) { }
    return subjects;
  }

  function setup() {
    const box = document.querySelector('#quiz .setup');
    if (!box) return;
    const activeSubject = examSubject();
    const subjects = cachedSubjects();
    const totalCount = (RAW || []).length;
    if (activeSubject && (!examSelectedCodes.length || !examSelectedCodes.includes(activeSubject))) examSelectedCodes = [activeSubject];
    const activeBase = baseCode(activeSubject);
    const activeSub = subjects.find(s => s.code === activeSubject) || (activeSubject ? { code: activeSubject, name: displayCode(activeSubject), question_count: totalCount } : null);
    const matchingSubjects = subjects.filter(s => s.code !== activeSubject && baseCode(s.code) === activeBase);

    const activeCard = activeSub ? `
      <div class="examActiveSubjectCard">
        <div class="examActiveSubjectTop"><span class="examActiveSubjectCode">${E(displayCode(activeSub.code))}</span><span class="examActiveSubjectName">${E(activeSub.name || displayCode(activeSub.code))}</span></div>
        <div class="examActiveSubjectDesc">${E(activeSub.description || 'Môn học chưa có mô tả.')}</div>
        <div class="examActiveSubjectMeta">${E(activeSub.question_count || totalCount || 0)} câu</div>
      </div>` : '';

    const extraChips = matchingSubjects.map(s => {
      const checked = examSelectedCodes.includes(s.code);
      return `<label class="examSubjectChip ${checked ? 'checked' : ''}" data-exam-subj="${E(s.code)}">
        <input type="checkbox" value="${E(s.code)}" ${checked ? 'checked' : ''}>
        <span class="examSubjectChipTop"><span class="examSubjectChipCode">${E(displayCode(s.code))}</span><span class="examSubjectChipName">${E(s.name || '')}</span></span>
        <span class="examSubjectChipDesc">${E(s.description || 'Môn học chưa có mô tả.')}</span>
        <span class="examSubjectChipDivider"></span>
        <span class="examSubjectChipBottom"><span class="examSubjectChipCount">${E(s.question_count || 0)} câu</span><span class="examSubjectChipChoose">${checked ? 'Đã chọn' : 'Chọn'}</span></span>
      </label>`;
    }).join('');

    box.innerHTML = `
      <div class="examOnlyStart">
        <div class="examOnlyBadge">KIỂM TRA</div>
        <div class="examOnlyLabel">Môn đang học</div>
        ${activeCard || '<span style="color:var(--mist)">Chưa chọn môn học</span>'}
        ${extraChips ? `<div class="examOnlyLabel">Gộp thêm môn <span style="font-weight:400;color:var(--mist);font-size:.85rem">(chọn thêm môn cùng mã để gộp đề)</span></div><div class="examSubjectChips" id="examSubjectChipsExtra">${extraChips}</div>` : ''}
        <div class="examOnlyLabel">Số câu kiểm tra <span style="font-weight:400;color:var(--mist);font-size:.85rem">(Thư viện hiện có: <span id="examTotalCountVal">${totalCount}</span> câu)</span></div>
        <div class="examOnlyCountGrid">
          <button class="cnt" data-exam-cnt="10">10</button>
          <button class="cnt" data-exam-cnt="20">20</button>
          <button class="cnt" data-exam-cnt="30">30</button>
          <button class="cnt" data-exam-cnt="50">50</button>
          <button class="cnt" data-exam-cnt="100">100</button>
          <button class="cnt" data-exam-cnt="0">Tất cả</button>
        </div>
        <div class="examCustomCntRow"><label class="examCustomCntLabel">Tùy chỉnh:</label><input type="number" id="examCustomCnt" class="examCustomCntInput" min="1" placeholder="Nhập số câu..."><button type="button" class="cnt examCustomCntApply" id="examCustomCntApply">Áp dụng</button></div>
        <button id="start" class="start" type="button">Bắt đầu kiểm tra</button>
      </div>`;

    const updateMergedCount = () => {
      const sum = subjects.filter(s => examSelectedCodes.includes(s.code)).reduce((acc, s) => acc + (+s.question_count || 0), 0) || totalCount;
      const el = $('examTotalCountVal');
      if (el) el.textContent = sum;
    };
    updateMergedCount();
    box.querySelectorAll('.examSubjectChip input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => {
        const code = cb.value;
        const label = cb.closest('.examSubjectChip');
        if (cb.checked) { if (!examSelectedCodes.includes(code)) examSelectedCodes.push(code); label?.classList.add('checked'); }
        else { examSelectedCodes = examSelectedCodes.filter(c => c !== code); label?.classList.remove('checked'); }
        const choose = label?.querySelector('.examSubjectChipChoose');
        if (choose) choose.textContent = cb.checked ? 'Đã chọn' : 'Chọn';
        updateMergedCount();
      };
    });
    box.querySelectorAll('[data-exam-cnt]').forEach(b => {
      const cnt = +b.dataset.examCnt;
      b.classList.toggle('sel', cnt === qCnt);
      b.onclick = () => { qCnt = cnt; box.querySelectorAll('[data-exam-cnt]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); const input = $('examCustomCnt'); if (input) input.value = ''; };
    });
    const applyBtn = $('examCustomCntApply');
    const customInput = $('examCustomCnt');
    if (applyBtn && customInput) {
      const applyCustom = () => { const v = parseInt(customInput.value, 10); if (v > 0) { qCnt = v; box.querySelectorAll('[data-exam-cnt]').forEach(x => x.classList.remove('sel')); } };
      applyBtn.onclick = applyCustom;
      customInput.onkeydown = e => { if (e.key === 'Enter') applyCustom(); };
    }
    const startBtn = $('start');
    if (startBtn) startBtn.onclick = start;
  }

  async function loadQuestionsForCodes(codes) {
    const c = window.HODSupabase?.__client || (window.supabase && window.APP_CONFIG?.SUPABASE_URL && window.APP_CONFIG?.SUPABASE_ANON_KEY ? window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY) : null);
    if (!c || !codes.length) return [];
    const { data, error } = await c.from('questions').select('id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason').eq('is_active', true).in('subject_code', codes).order('num', { ascending: true });
    if (error || !data) { console.warn(error); return []; }
    return data.map(r => ({ id: r.id, subject_code: r.subject_code, num: r.num, question: r.question, options: r.options || {}, answer: r.answer, answer_text: r.answer_text, images: (typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || []), has_image: !!(r.has_image || (r.images || []).length), error_risk: r.error_risk || 'low', error_risk_reason: r.error_risk_reason || '' }));
  }

  async function start() {
    quizMode = 'exam';
    examSubmitted = false;
    examOnlyReview = false;
    examOnlyIndex = 0;
    const activeSubject = examSubject();
    const extraCodes = examSelectedCodes.filter(c => c && c !== activeSubject);
    let mergedPool = [...(RAW || [])];
    if (extraCodes.length) {
      if (typeof showProgress === 'function') showProgress('Đang tải câu hỏi từ các môn đã chọn...', 0, 100);
      const extraQuestions = await loadQuestionsForCodes(extraCodes);
      if (typeof hideProgress === 'function') hideProgress();
      const seen = new Set(mergedPool.map(q => q.id || (q.subject_code + ':' + q.num)));
      extraQuestions.forEach(q => { const key = q.id || (q.subject_code + ':' + q.num); if (!seen.has(key)) { mergedPool.push(q); seen.add(key); } });
    }
    if (!mergedPool.length) { alert('Chưa có câu hỏi để kiểm tra.'); return; }
    qSet = sample(mergedPool, qCnt || 0);
    qDone = {};
    qSel = {};
    clearExam();
    startTimer(0);
    saveExam();
    draw();
  }

  function scoreExam() {
    let ok = 0;
    (qSet || []).forEach((c, i) => { if (S(qSel[i]) === S(c.answer)) ok++; });
    const total = (qSet || []).length;
    const pct = total ? Math.round(ok / total * 100) : 0;
    return { ok, bad: total - ok, total, pct };
  }

  function draw() {
    window.__examOnlyRender = draw;
    const body = $('quizBody');
    if (!body) return;
    if (!qSet || !qSet.length) restoreExam();
    const box = document.querySelector('#quiz .setup');
    if (!qSet || !qSet.length) { setup(); if (box) box.classList.remove('hidden'); body.innerHTML = ''; return; }
    if (box) box.classList.add('hidden');
    if (examSubmitted && !examOnlyReview) { result(); return; }
    
    const c = qSet[examOnlyIndex];
    const total = qSet.length;
    const p = Math.round((examOnlyIndex + 1) / total * 100);

    const ch = qSel[examOnlyIndex] || '';
    const correctAns = c.answer || '';
    
    let opts = '';
    if (examOnlyReview) {
      opts = Object.entries(c.options || {}).map(([k, v]) => {
        const isUserChose = ch.includes(k);
        const isCorrect = correctAns.includes(k);
        let stateClass = '';
        let badgeHTML = '';
        if (isCorrect) {
          stateClass = 'review-opt-correct';
          badgeHTML = `<span class="review-opt-badge correct">✓</span>`;
        } else if (isUserChose && !isCorrect) {
          stateClass = 'review-opt-incorrect';
          badgeHTML = `<span class="review-opt-badge incorrect">×</span>`;
        } else {
          stateClass = 'review-opt-normal';
        }
        return `<button type="button" class="examOnlyOption ${stateClass}" disabled><span class="qkey">${E(k)}</span><span class="qtxt">${E(v)}</span>${badgeHTML}</button>`;
      }).join('');
    } else {
      opts = Object.entries(c.options || {}).map(([k, v]) => `<button type="button" class="examOnlyOption ${String(ch).includes(k) ? 'sel' : ''}" data-exam-opt="${E(k)}"><span class="qkey">${E(k)}</span><span class="qtxt">${E(v)}</span></button>`).join('');
    }

    const gridItems = (qSet || []).map((q, i) => {
      let stateClass = '';
      if (examOnlyReview) {
        const userAns = qSel[i] || '';
        const corrAns = q.answer || '';
        stateClass = (S(userAns) === S(corrAns)) ? 'review-grid-correct' : 'review-grid-incorrect';
      } else {
        stateClass = qSel[i] ? 'answered' : '';
      }
      return `<button type="button" class="examGridItem ${examOnlyIndex === i ? 'active' : ''} ${stateClass}" data-exam-jump="${i}">${i + 1}</button>`;
    }).join('');

    const titleHTML = examOnlyReview 
      ? `Câu ${examOnlyIndex + 1} / ${total} <span class="reviewModeHeaderTag" style="font-size:0.88rem;color:var(--gold2);background:rgba(200,169,110,0.1);padding:3px 8px;border-radius:999px;border:1px solid rgba(200,169,110,0.3);margin-left:8px;vertical-align:middle;font-weight:800;letter-spacing:0.04em;">XEM LẠI</span>`
      : `Câu ${examOnlyIndex + 1} / ${total}`;

    const subtitleHTML = examOnlyReview
      ? `Đúng: <b style="color:#72c58c;">${scoreExam().ok}</b> · Sai: <b style="color:#e9877b;">${scoreExam().bad}</b> · Thời gian: <b>${timeText()}</b>`
      : `Đã làm: ${done()} / ${total} · Thời gian: <span id="examTimer">${timeText()}</span>`;

    const exitBtn = examOnlyReview
      ? `<button type="button" class="examOnlyExit review-exit-btn" id="examOnlyExitToResult">Xem điểm</button>`
      : `<button type="button" class="examOnlyExit" id="examOnlyExit">Thoát</button>`;

    const footerHTML = examOnlyReview
      ? `<div class="examOnlyFooter review-mode"><div class="examOnlyNav" style="grid-column: 1 / -1 !important;"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? 'disabled' : ''}>← Câu trước</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? 'disabled' : ''}>Câu tiếp →</button></div></div>`
      : `<div class="examOnlyFooter"><div class="examOnlyNav"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? 'disabled' : ''}>← Câu trước</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? 'disabled' : ''}>Câu tiếp →</button></div><button type="button" class="submitExam" id="examSubmit">Nộp bài</button></div>`;

    body.innerHTML = `
      <div class="examOnlyGridContainer">
        <section class="examOnlyCard">
          <div class="examOnlyTopline">
            <div>
              <div class="examOnlyQuestionNo">${titleHTML}</div>
              <div class="examOnlyMeta">${subtitleHTML}</div>
            </div>
            ${exitBtn}
          </div>
          <div class="examOnlyProgress"><div style="width:${p}%"></div></div>
          <div class="examOnlyContentBody">
            <div class="examOnlyQuestionZone">
              <div class="qq">${E(c.question)}</div>
              <div class="qimgs">${IMG(c)}</div>
            </div>
            <div class="examOnlyRightZone">
              <div class="examOnlyOptions">${opts}</div>
              ${examOnlyReview && (c.answer_text || (c.explain || EXPLAIN(c))) ? `
                <div class="examOnlyExplain">
                  <div class="explainTitle">💡 Giải thích đáp án</div>
                  <div class="explainContent"><b>Đáp án đúng: ${E(c.answer)}</b> · ${E(EXPLAIN(c))}</div>
                </div>
              ` : ''}
            </div>
          </div>
          ${footerHTML}
        </section>
        <aside class="examOnlySidebar">
          <div class="examSidebarHead"><h4>Bản đồ câu hỏi</h4></div>
          <div class="examSidebarGrid">${gridItems}</div>
        </aside>
      </div>
    `;
    setTimerText();
  }
  function timeText() { return examElapsed || '00:00'; }

  function result() {
    const body = $('quizBody');
    if (!body) return;
    const s = scoreExam();
    const label = s.pct >= 90 ? 'Xuất sắc' : s.pct >= 70 ? 'Khá ổn rồi' : s.pct >= 50 ? 'Cần ôn thêm' : 'Nên làm lại vài vòng';
    body.innerHTML = `<section class="examOnlyResult"><div class="examOnlyBadge">KẾT QUẢ KIỂM TRA</div><h2>${s.ok} / ${s.total} câu đúng</h2><div class="examOnlyScore">${s.pct}%</div><p>${label}</p><div class="examOnlyStats"><span>Đúng: <b>${s.ok}</b></span><span>Sai: <b>${s.bad}</b></span><span>Thời gian: <b>${timeText()}</b></span></div><div class="examOnlyActions"><button type="button" class="primary" id="examReviewBtn">Xem lại bài làm</button><button type="button" class="btn" id="examRetryBtn">Làm lại bộ này</button><button type="button" class="btn" id="examNewBtn">Tạo đề mới</button></div><div id="examReviewList" class="examOnlyReviewList hidden"></div></section>`;
    if (examOnlyReview) review();
  }

  function review() {
    const list = $('examReviewList');
    if (!list) return;
    list.classList.remove('hidden');
    list.innerHTML = (qSet || []).map((c, i) => {
      const ch = qSel[i] || '';
      const correctAns = c.answer || '';
      const ok = S(ch) === S(correctAns);
      
      const reviewOpts = Object.entries(c.options || {}).map(([k, v]) => {
        const isUserChose = ch.includes(k);
        const isCorrect = correctAns.includes(k);
        
        let stateClass = '';
        let badgeHTML = '';
        
        if (isCorrect) {
          stateClass = 'review-opt-correct';
          badgeHTML = `<span class="review-opt-badge correct">✓</span>`;
        } else if (isUserChose && !isCorrect) {
          stateClass = 'review-opt-incorrect';
          badgeHTML = `<span class="review-opt-badge incorrect">×</span>`;
        } else {
          stateClass = 'review-opt-normal';
        }
        
        return `<div class="examReviewOpt ${stateClass}"><span class="qkey">${k}</span><span class="qtxt">${E(v)}</span>${badgeHTML}</div>`;
      }).join('');

      return `
        <div class="examOnlyReviewItem ${ok ? 'item-correct' : 'item-incorrect'}">
          <div class="examOnlyReviewHeader">
            <span class="reviewItemNo">CÂU ${i + 1}</span>
            <span class="reviewStatusBadge ${ok ? 'correct' : 'incorrect'}">${ok ? 'ĐÚNG' : 'SAI'}</span>
          </div>
          <div class="examOnlyReviewQ">${E(c.question)}</div>
          <div class="qimgs">${IMG(c)}</div>
          <div class="examOnlyReviewOptionsList">${reviewOpts}</div>
          ${c.answer_text || (c.explain || EXPLAIN(c)) ? `
            <div class="examOnlyExplain">
              <div class="explainTitle">💡 Giải thích đáp án</div>
              <div class="explainContent"><b>Đáp án đúng: ${E(c.answer)}</b> · ${E(EXPLAIN(c))}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function submit() {
    if (!confirm('Bạn chắc chắn muốn nộp bài?\n\nĐã làm: ' + done() + ' / ' + (qSet || []).length + ' câu')) return;
    examElapsed = FMT(nowTimerMs());
    examSubmitted = true;
    stopTimer();
    saveExam();
    result();
  }

  function bind() {
    markTab();
    removeOldQuizUI();
    setup();
    const label = $('quizModeLabel');
    if (label) label.textContent = 'Kiểm tra: nộp bài mới hiện đáp án';
    const body = $('quizBody');
    if (body && body.dataset.examOnlyBound !== '1') {
      body.dataset.examOnlyBound = '1';

      // KEYDOWN EVENT LISTENER FOR EXAM PANE (IN CLOSURE SCOPE)
      document.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if ($('quiz') && $('quiz').classList.contains('active')) {
          if (e.key === 'ArrowRight') {
            if (qSet && qSet.length) {
              examOnlyIndex = Math.min(qSet.length - 1, examOnlyIndex + 1);
              saveExam(); draw();
            }
            return;
          }
          if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            if (qSet && qSet.length) {
              examOnlyIndex = Math.max(0, examOnlyIndex - 1);
              saveExam(); draw();
            }
            if (e.key === 'Backspace') e.preventDefault();
            return;
          }
          if (e.key === 'Escape') {
            if (examOnlyReview) {
              examOnlyReview = false;
              saveExam(); draw();
            } else {
              const exitBtn = $('examOnlyExit') || $('examOnlyExitToResult');
              if (exitBtn) exitBtn.click();
            }
            return;
          }
          if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
          }
        }
      }, true);

      body.addEventListener('click', e => {
        const opt = e.target.closest('[data-exam-opt]');
        if (opt && !examSubmitted && qSet && qSet.length) {
          const c = qSet[examOnlyIndex];
          const k = opt.dataset.examOpt;
          if (c && String(c.answer || '').length > 1) {
            const set = new Set(String(qSel[examOnlyIndex] || '').split('').filter(Boolean));
            set.has(k) ? set.delete(k) : set.add(k);
            qSel[examOnlyIndex] = Array.from(set).sort().join('');
          } else qSel[examOnlyIndex] = k;
          saveExam(); draw(); return;
        }
        if (e.target.id === 'examPrev') { examOnlyIndex = Math.max(0, examOnlyIndex - 1); saveExam(); draw(); return; }
        if (e.target.id === 'examNext') { examOnlyIndex = Math.min((qSet || []).length - 1, examOnlyIndex + 1); saveExam(); draw(); return; }
        if (e.target.id === 'examSubmit') { submit(); return; }
        if (e.target.id === 'examReviewBtn') { examOnlyReview = true; saveExam(); draw(); return; }
        if (e.target.id === 'examOnlyExitToResult') { examOnlyReview = false; saveExam(); draw(); return; }
        if (e.target.id === 'examRetryBtn') { qSel = {}; examSubmitted = false; examOnlyReview = false; examOnlyIndex = 0; startTimer(0); saveExam(); draw(); return; }
        if (e.target.id === 'examNewBtn' || e.target.id === 'examOnlyExit') {
          if (e.target.id === 'examOnlyExit' && !confirm('Thoát bài kiểm tra hiện tại?')) return;
          clearExam(); qSet = []; qSel = {}; examSubmitted = false; examOnlyReview = false; examOnlyIndex = 0; resetTimer(); draw(); return;
        }
        const jump = e.target.closest('[data-exam-jump]');
        if (jump) { examOnlyIndex = +jump.dataset.examJump; saveExam(); draw(); }
      });
    }
    restoreExam();
    draw();
  }

  try { renderQuiz = function () { setup(); draw(); } } catch (e) { window.renderQuiz = function () { setup(); draw(); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(bind, 120)); else setTimeout(bind, 120);
  setTimeout(bind, 900);
})();
// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 END =====



// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 =====
(function () {
  function fixLibraryText() {
    document.querySelectorAll('.tab,[data-tab="study"],button,a,span,div,h1,h2,h3,p').forEach(el => {
      if (!el || el.children.length) return;
      const t = (el.textContent || '').trim();
      if (t === 'Thư viện' || t === 'Thư viện' || t === 'All' || (el.dataset && el.dataset.tab === 'study')) {
        el.textContent = 'Thư viện';
      }
    });
    document.querySelectorAll('[data-tab="study"]').forEach(el => { el.textContent = 'Thư viện'; });
    const search = document.getElementById('search') || document.getElementById('studySearch');
    if (search) search.placeholder = 'Tìm trong thư viện: #12, đáp án, từ khóa...';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixLibraryText); else fixLibraryText();
  setTimeout(fixLibraryText, 100);
  setTimeout(fixLibraryText, 600);
  setInterval(fixLibraryText, 1200);
})();
// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 END =====


// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 =====
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const FILTER_STORE = 'learninghub_library_filter_v1';
  let libraryFilter = localStorage.getItem(FILTER_STORE) || 'all';
  function $(id) { return document.getElementById(id) }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function ans(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function src(im) { return typeof im === 'string' ? im : (im?.src || im?.url || ''); }
  function hasImg(q) { return !!((q?.images || []).map(src).filter(Boolean).length || q?.has_image) }
  function risk(q) { return q?.error_risk || (ans(q).length > 1 ? 'medium' : 'low') }
  function rColor(r) { return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999' }
  function rLabel(r) { return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r }
  function pass(q) { if (libraryFilter === 'all') return true; if (libraryFilter === 'has_image') return hasImg(q); return risk(q) === libraryFilter }
  function answerText2(q) { const a = ans(q); return a ? a.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | ') : 'Chưa có đáp án' }
  function nextKey(opts) { const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase())); return LETTERS.find(k => !used.has(k)) }
  function miniImg(q) { const imgs = (q.images || []).map(src).filter(Boolean); return imgs.length ? `<div class="v7MiniImgs libraryMiniImgs"><img src="${esc(imgs[0])}" alt="Ảnh câu hỏi">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ''}</div>` : '<div class="v7MiniImgs libraryMiniImgs"></div>' }
  function stat(data) { return { total: data.length, img: data.filter(hasImg).length, high: data.filter(q => risk(q) === 'high').length, medium: data.filter(q => risk(q) === 'medium').length, low: data.filter(q => risk(q) === 'low').length } }
  function renderLibraryStats(data) { const list = $('studyList'); if (!list) return; let box = $('libraryQuestionFilters'); if (!box) { box = document.createElement('div'); box.id = 'libraryQuestionFilters'; box.className = 'v7Stats libraryQuestionFilters'; list.parentNode.insertBefore(box, list) } const s = stat(data), fs = [['all', 'Thư viện'], ['has_image', '📷 Có ảnh'], ['high', 'Rủi ro cao'], ['medium', 'Trung bình'], ['low', 'Thấp']]; box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${fs.map(f => `<button type="button" class="v7FilterBtn ${libraryFilter === f[0] ? 'active' : ''}" data-library-filter="${f[0]}">${f[1]}</button>`).join('')}</div>` }
  function libraryCard(q) { const a = ans(q) || '?', r = risk(q); const opts = Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? 'correct' : ''}"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join(''); return `<article class="v7Card libraryQuestionCard" style="border-left-color:${rColor(r)}!important"><div class="v7Row"><div class="v7Num">Câu ${esc(q.num || '')}</div><div class="v7Main"><div class="v7Question">${esc(q.question || '')}</div><div class="v7Answer"><b>Đáp án: ${esc(a)}</b><span>${esc(answerText2(q))}</span></div><div class="libraryOptions">${opts}</div></div>${miniImg(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${rColor(r)}" title="Rủi ro: ${esc(rLabel(r))}"></span></div></div></article>` }
  try { renderStudy = function () { const base = (typeof smart === 'function') ? smart(($('search')?.value) || '') : (typeof RAW !== 'undefined' ? RAW : []); renderLibraryStats(base); const arr = base.filter(pass); const list = $('studyList'); if (list) list.innerHTML = arr.length ? arr.map(libraryCard).join('') : '<div class="v7Empty">Không có câu nào phù hợp bộ lọc.</div>' } } catch (e) { }
  document.addEventListener('click', e => { const f = e.target.closest('[data-library-filter]'); if (f) { libraryFilter = f.dataset.libraryFilter || 'all'; localStorage.setItem(FILTER_STORE, libraryFilter); try { renderStudy() } catch (_) { } } });
  function editImgs(q) { const imgs = q.images || []; return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-edit-pick-img>+ Thêm ảnh</button><input id="editPreviewImgInput" class="v7HiddenInput" type="file" accept="image/*" multiple></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, i) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-edit-rm-img="${i}">×</button><img src="${esc(src(im))}" alt="Ảnh ${i + 1}"></div>`).join('') : '<div class="v7NoImage">Chưa có ảnh.</div>'}</div></div>` }
  function optRows(opts) { return Object.keys(opts || {}).sort().map(k => `<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-edit-del-opt="${esc(k)}">×</button></div>`).join('') }
  function redrawImg() { const h = $('editPreviewImageHost'); if (h && window.editDraft) h.innerHTML = editImgs(window.editDraft) }
  function redrawOpt() { const h = $('editPreviewOptions'); if (h && window.editDraft) h.innerHTML = optRows(window.editDraft.options || {}) }
  function openEditPreview() { const c = ((typeof pool !== 'undefined' && pool[ci]) || (typeof RAW !== 'undefined' && RAW[0])); if (!c) return; window.editDraft = clone(c); if (typeof editDraft !== 'undefined') editDraft = window.editDraft; const role = String(window.HODSupabase?.getProfile?.()?.role || '').trim().toLowerCase(); const canDirect = ['admin', 'editor'].includes(role); const reporting = !!(window.HODSupabase?.getUser?.()) && !canDirect; const modal = $('editModal'), box = modal?.querySelector('.box'); if (!modal || !box) return; box.classList.add('editPreviewBox', 'quizEditLayoutV2'); box.innerHTML = `<button class="modalX" type="button" data-edit-preview-close>×</button><div class="v7Head editPreviewHead"><div><span class="v7Label">SỬA CÂU HỎI</span><h2>${esc((reporting ? 'Báo cáo / đề xuất sửa câu ' : 'Sửa câu ') + (c.num || ''))}</h2><p class="v7Hint">Sửa nhanh nội dung quiz, đáp án và ảnh.</p></div><div class="v7TopActions"><button class="btn ${reporting ? 'hidden' : ''}" type="button" data-edit-preview-restore>Khôi phục</button><button class="primary v7SaveTop" type="button" data-edit-preview-save>${canDirect ? 'Lưu trực tiếp' : reporting ? 'Gửi báo cáo' : 'Lưu sửa'}</button></div></div><article class="v7Card editPreviewCard"><div class="editPreviewTwoColumns"><div class="editPreviewLeftCol"><div class="v7Field"><label>Câu hỏi</label><textarea data-edit-question>${esc(c.question || '')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-edit-answer value="${esc(ans(c))}" placeholder="VD: A hoặc AC"></div><div id="editPreviewImageHost">${editImgs(c)}</div></div><div class="editPreviewRightCol"><div class="v7Field"><label>Các đáp án</label><div id="editPreviewOptions" class="v7Options">${optRows(c.options || {})}</div></div><div class="v7Bottom"><button class="btn" type="button" data-edit-add-opt>+ Thêm đáp án</button></div></div></div></article>`; modal.classList.remove('hidden') }
  async function saveEditPreview() { if (!window.editDraft) return; const oldQ = clone((typeof RAW !== 'undefined' && (RAW.find(c => c.num === window.editDraft.num))) || window.editDraft); const modal = $('editModal'); const q = (modal?.querySelector('[data-edit-question]')?.value || '').trim(); const a = (modal?.querySelector('[data-edit-answer]')?.value || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); if (!q) return alert('Câu hỏi không được để trống.'); if (!a) return alert('Đáp án đúng không được để trống.'); const opts = {}; modal?.querySelectorAll('[data-edit-opt]').forEach(inp => { const k = String(inp.dataset.editOpt || '').toUpperCase(), v = (inp.value || '').trim(); if (k && v) opts[k] = v }); if (!Object.keys(opts).length) return alert('Cần ít nhất 1 đáp án.'); for (const k of a.split('')) if (!opts[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.'); Object.assign(window.editDraft, { question: q, answer: a, options: opts, answer_text: a.split('').map(k => k + '. ' + (opts[k] || '')).join('; '), subject_code: localStorage.getItem('learninghub_subject_code_merged_v1') || window.editDraft.subject_code || '' }); if (window.HODSupabase && window.HODSupabase.isReady()) { const role = String(window.HODSupabase?.getProfile?.()?.role || '').trim().toLowerCase(); const canDirect = ['admin', 'editor'].includes(role); if (canDirect) { const c = window.HODSupabase?.__client; const id = oldQ?.id || window.editDraft?.id; if (!c || !id) { alert('Không tìm thấy ID câu hỏi trên Supabase. Hãy tải lại trang rồi thử lại.'); return } const list = window.editDraft.images || []; const localHasImg = oldQ?.__imagesLoaded ? (list.length > 0) : !!(list.length || oldQ?.has_image); const text = window.editDraft.question + ' ' + Object.values(window.editDraft.options || {}).join(' '); const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text); const hasPlaceholder = list.some(im => { const src = typeof im === 'string' ? im : (im.src || im.url || im.secure_url || ''); return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER') }); let risk = ''; let reason = ''; if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) { risk = 'high'; reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế' } else if (window.editDraft.answer.length > 1) { risk = 'medium'; reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ' } else { risk = 'low' } const payload = { question: window.editDraft.question, options: window.editDraft.options || {}, answer: window.editDraft.answer, answer_text: window.editDraft.answer_text, images: window.editDraft.images || [], updated_at: new Date().toISOString(), has_image: localHasImg || needsImg, error_risk: risk, error_risk_reason: reason || null }; const r = await c.from('questions').update(payload).eq('id', id); if (r.error) { alert('Sửa trực tiếp thất bại: ' + r.error.message); return } if (typeof window.clearLearningHubQuestionCache === 'function') { window.clearLearningHubQuestionCache(); } try { const u = window.HODSupabase?.getUser?.(); await c.from('question_history').insert({ question_id: id, request_id: null, previous_data: { question: oldQ.question, options: oldQ.options || {}, answer: oldQ.answer, answer_text: oldQ.answer_text, images: oldQ.images || [] }, new_data: payload, changed_by: u?.id || null, approved_by: u?.id || null }) } catch (e) { } $('editModal')?.classList.add('hidden'); notify('Đã sửa trực tiếp'); if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true); else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase(true); return } await window.HODSupabase.submitEditRequest(window.editDraft, oldQ); return } if (window.HODSupabase?.getUser?.()) { alert('Chưa kết nối được dữ liệu duyệt. Hãy tải lại trang rồi gửi lại báo cáo.'); return } edits[window.editDraft.num] = { question: window.editDraft.question, options: window.editDraft.options, answer: window.editDraft.answer, answer_text: window.editDraft.answer_text, images: window.editDraft.images || [] }; localStorage.setItem('hod102_user_edits_v1', JSON.stringify(edits)); rebuild(); ci = pool.findIndex(c => c.num === window.editDraft.num); if (ci < 0) ci = 0; flipped = false; renderCard(); renderQuiz(); renderStudy(); $('editModal')?.classList.add('hidden'); notify('Đã lưu sửa local') }
  function apply() { try { openEditor = openEditPreview; saveEditor = saveEditPreview } catch (e) { } window.openEditor = openEditPreview; window.saveEditor = saveEditPreview }
  apply(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 0)); else setTimeout(apply, 0); setTimeout(apply, 900);
  document.addEventListener('click', e => { if (e.target.closest('[data-edit-preview-close]')) return $('editModal')?.classList.add('hidden'); if (e.target.closest('[data-edit-preview-save]')) return saveEditPreview(); if (e.target.closest('[data-edit-preview-restore]')) return typeof restoreEditor === 'function' && restoreEditor(); if (e.target.closest('[data-edit-pick-img]')) return $('editPreviewImgInput')?.click(); const rm = e.target.closest('[data-edit-rm-img]'); if (rm && window.editDraft) { window.editDraft.images = window.editDraft.images || []; window.editDraft.images.splice(+rm.dataset.editRmImg, 1); redrawImg(); return } if (e.target.closest('[data-edit-add-opt]') && window.editDraft) { window.editDraft.options = window.editDraft.options || {}; const k = nextKey(window.editDraft.options); if (!k) return alert('Đã đủ số đáp án.'); window.editDraft.options[k] = ''; redrawOpt(); setTimeout(() => document.querySelector(`[data-edit-opt="${k}"]`)?.focus(), 0); return } const del = e.target.closest('[data-edit-del-opt]'); if (del && window.editDraft) { delete window.editDraft.options[String(del.dataset.editDelOpt || '').toUpperCase()]; redrawOpt() } });
  document.addEventListener('change', async e => { if (e.target?.id === 'editPreviewImgInput' && window.editDraft) { const inp = e.target; const files = Array.from(inp.files || []); if (!files.length) return; inp.disabled = true; if (typeof notify === 'function') notify('Đang upload ảnh...'); try { window.editDraft.images = window.editDraft.images || []; if (window.__LHCleanImages) window.editDraft.images = window.__LHCleanImages(window.editDraft.images); for (const file of files) { if (window.__LHUploadCloudinary) { const uploaded = await window.__LHUploadCloudinary(file); if (uploaded) window.editDraft.images.push(uploaded); } else { const fr = new FileReader(); const p = new Promise(resolve => { fr.onload = () => { window.editDraft.images.push({ id: 'edit_' + Date.now(), src: fr.result, source: 'user-upload', name: file.name }); resolve() }; fr.readAsDataURL(file) }); await p; } } redrawImg(); if (typeof notify === 'function') notify('Đã upload ảnh thành URL'); } catch (err) { alert(err.message || err) } finally { inp.disabled = false; inp.value = '' } } });
  setTimeout(() => { try { if ($('studyList')) renderStudy() } catch (e) { } }, 350);
})();
// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 END =====


// ===== LIBRARY_UX_STEP2_PREVIEW_CARDS_20260627 =====
(function () {
  const FILTER_STORE = 'learninghub_library_filter_v1';
  function $(id) { return document.getElementById(id) }
  function esc2(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function ans(q) { return String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, '') }
  function imgSrc(im) { return typeof im === 'string' ? im : (im?.src || im?.url || '') }
  function hasImg(q) { return !!((q?.images || []).map(imgSrc).filter(Boolean).length || q?.has_image) }
  function risk(q) { return q?.error_risk || (ans(q).length > 1 ? 'medium' : 'low') }
  function riskColor(r) { return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999' }
  function pass(q) { const f = localStorage.getItem(FILTER_STORE) || 'all'; if (f === 'all') return true; if (f === 'has_image') return hasImg(q); return risk(q) === f }
  function correctText(q) { const a = ans(q); return a ? a.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | ') : 'Chưa có đáp án' }
  function miniImages(q) { const imgs = (q.images || []).map(imgSrc).filter(Boolean); if (!imgs.length) return '<div class="libraryV2Img empty"></div>'; return `<div class="libraryV2Img"><img src="${esc2(imgs[0])}" alt="Ảnh câu hỏi">${imgs.length > 1 ? `<span>+${imgs.length - 1}</span>` : ''}</div>` }
  function allImages(q) { const imgs = (q.images || []).map(imgSrc).filter(Boolean); if (!imgs.length) return ''; return `<div class="libraryV2Images">${imgs.map((s, i) => `<img src="${esc2(s)}" alt="Ảnh ${i + 1}">`).join('')}</div>` }
  function stats(data) { return { total: data.length, img: data.filter(hasImg).length, high: data.filter(q => risk(q) === 'high').length, medium: data.filter(q => risk(q) === 'medium').length, low: data.filter(q => risk(q) === 'low').length } }
  function renderStats(data) {
    const list = $('studyList'); if (!list) return;
    let box = $('libraryQuestionFilters');
    if (!box) { box = document.createElement('div'); box.id = 'libraryQuestionFilters'; box.className = 'v7Stats libraryQuestionFilters'; list.parentNode.insertBefore(box, list) }
    const f = localStorage.getItem(FILTER_STORE) || 'all', s = stats(data);
    const filters = [['all', 'Thư viện'], ['has_image', '📷 Có ảnh'], ['high', 'Rủi ro cao'], ['medium', 'Trung bình'], ['low', 'Thấp']];
    box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${filters.map(x => `<button type="button" class="v7FilterBtn ${f === x[0] ? 'active' : ''}" data-library-filter="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  }
  function optionList(q) { const a = ans(q); return Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? 'correct' : ''}"><b>${esc2(k)}</b><span>${esc2(v)}</span></div>`).join('') }
  function card(q, i) { const a = ans(q) || '?', r = risk(q); return `<article class="libraryV2Card libraryQuestionCard" data-library-v2-card="${i}" data-num="${esc2(q.num || '')}" style="border-left-color:${riskColor(r)}!important"><div class="libraryV2Row"><div class="libraryV2Num">Câu ${esc2(q.num || i + 1)}</div><div class="libraryV2Main"><div class="libraryV2Question">${esc2(q.question || '')}</div><div class="libraryV2Answer"><b>Đáp án: ${esc2(a)}</b><span>${esc2(correctText(q))}</span></div></div>${miniImages(q)}<div class="libraryV2Actions"><button type="button" class="libraryV2Study" data-library-study="${i}">Học</button><button type="button" class="libraryV2Report" data-library-report="${i}">!</button><button type="button" class="libraryV2Toggle" data-library-toggle="${i}">Mở</button></div></div><div class="libraryV2Details"><div class="libraryOptions">${optionList(q)}</div>${allImages(q)}</div></article>` }
  function getBase() { const q = ($('search')?.value || $('studySearch')?.value || ''); try { return (typeof smart === 'function' ? smart(q) : (typeof RAW !== 'undefined' ? RAW : [])) || [] } catch (e) { return typeof RAW !== 'undefined' ? RAW : [] } }
  function render() { const base = getBase(); renderStats(base); const arr = base.filter(pass); const list = $('studyList'); if (!list) return; list.innerHTML = arr.length ? arr.map(card).join('') : '<div class="v7Empty libraryV2Empty">Không có câu nào phù hợp bộ lọc.</div>'; setTimeout(() => { try { document.dispatchEvent(new CustomEvent('library-v2-rendered')) } catch (e) { } }, 0) }
  function goStudy(i) { const q = getBase().filter(pass)[i] || getBase()[i]; if (!q) return; let idx = (pool || []).findIndex(x => Number(x.num) === Number(q.num)); if (idx < 0) { pool = [...RAW]; idx = pool.findIndex(x => Number(x.num) === Number(q.num)) } if (idx >= 0) { ci = idx; flipped = false; flipDir = 'horizontal'; try { renderCard() } catch (e) { } document.querySelector('[data-tab="fc"]')?.click?.(); } }
  function report(i) { const q = getBase().filter(pass)[i] || getBase()[i]; if (!q) return; if (typeof window.openStudyReport === 'function') return window.openStudyReport(q.num); let idx = (pool || []).findIndex(x => Number(x.num) === Number(q.num)); if (idx < 0) { pool = [...RAW]; idx = pool.findIndex(x => Number(x.num) === Number(q.num)) } if (idx >= 0) { ci = idx; flipped = false; try { renderCard(); openEditor() } catch (e) { } } }
  try { renderStudy = render; window.renderStudy = render } catch (e) { window.renderStudy = render }
  document.addEventListener('click', function (e) {
    const f = e.target.closest('[data-library-filter]'); if (f) { localStorage.setItem(FILTER_STORE, f.dataset.libraryFilter || 'all'); render(); return }
    const t = e.target.closest('[data-library-toggle]'); if (t) { const card = t.closest('.libraryV2Card'); card?.classList.toggle('open'); t.textContent = card?.classList.contains('open') ? 'Thu gọn' : 'Mở'; return }
    const h = e.target.closest('[data-library-study]'); if (h) { goStudy(+h.dataset.libraryStudy); return }
    const r = e.target.closest('[data-library-report]'); if (r) { report(+r.dataset.libraryReport); return }
  }, true);
  document.addEventListener('DOMContentLoaded', () => setTimeout(render, 60));
  setTimeout(render, 500);
})();
// ===== LIBRARY_UX_STEP2_PREVIEW_CARDS_20260627 END =====


// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 =====
(function () {
  const FILTER_STORE = 'learninghub_library_filter_v1';
  const VIEW_STORE = 'learninghub_library_view_v1';
  const OPEN_STORE = 'learninghub_library_open_nums_v1';
  const SEARCH_STORE = 'learninghub_library_search_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9#:\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const ans = q => String(q?.answer || '').toUpperCase().replace(/[^A-Z]/g, '');
  const imgSrc = im => typeof im === 'string' ? im : (im?.src || im?.url || '');
  const optimizeImageUrl = src => {
    if (!src) return '';
    if (src.includes('res.cloudinary.com/') && src.includes('/image/upload/')) {
      if (!src.includes('q_auto') && !src.includes('f_auto')) {
        return src.replace('/image/upload/', '/image/upload/c_limit,w_600,q_auto,f_auto/');
      }
    }
    return src;
  };
  const hasImg = q => {
    const list = q?.images || [];
    const localHasImg = !!(list.map(imgSrc).filter(Boolean).length || q?.has_image);
    if (localHasImg) return true;
    const text = (q?.question || '') + ' ' + Object.values(q?.options || {}).join(' ');
    return /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
  };
  const risk = q => {
    if (q?.error_risk) return q.error_risk;
    const list = (q?.images || []).map(imgSrc).filter(Boolean);
    const localHasImg = !!(list.length || q?.has_image);
    const text = (q?.question || '') + ' ' + Object.values(q?.options || {}).join(' ');
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    const hasPlaceholder = list.some(im => {
      const src = typeof im === 'string' ? im : (im.src || im.url || '');
      return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
    });
    if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) {
      return 'high';
    }
    if (ans(q).length > 1) return 'medium';
    return 'low';
  };
  const riskColor = r => ({ high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999');
  const filterVal = () => localStorage.getItem(FILTER_STORE) || 'all';
  const viewVal = () => localStorage.getItem(VIEW_STORE) || 'compact';
  let lastList = [];
  const libraryOpenNums = new Set();
  try { JSON.parse(localStorage.getItem(OPEN_STORE) || '[]').forEach(n => libraryOpenNums.add(String(n))) } catch (e) { }
  function saveOpenState() { try { localStorage.setItem(OPEN_STORE, JSON.stringify([...libraryOpenNums])) } catch (e) { } }
  function answerText(q) { const a = ans(q); return a ? a.split('').map(k => k + '. ' + (q.options?.[k] || '')).join(' | ') : 'Chưa có đáp án' }
  function allText(q) { return norm([q?.num, q?.question, q?.answer, q?.answer_text, Object.values(q?.options || {}).join(' ')].join(' ')) }
  function parseQuery(raw) { const q = String(raw || '').trim(), n = norm(q); const p = { raw: q, n, num: null, answer: null, multi: false, tokens: [] }; if (/^\d+$/.test(n)) p.num = Number(n); let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)|(?:^|\s)cau\s*(\d+)(?:\s|$)/); if (m) p.num = Number(m[1] || m[2]); m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i); if (m) p.answer = m[1].toUpperCase().split('').sort().join(''); p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n); let tokens = n.split(/\s+/).filter(t => t.length >= 2 && !/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua|cau)$/.test(t) && !t.includes(':') && !/^#?\d+$/.test(t)); const cleanN = n.replace(/(?:answer|ans|dap\s*an|dapan)\s*:\s*[a-e]+/gi, '').replace(/(?:^|\s)#\s*\d+(?:\s|$)|(?:^|\s)cau\s*\d+(?:\s|$)/gi, '').replace(/(?:^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/gi, '').replace(/\s+/g, ' ').trim(); if (cleanN.includes(' ') && cleanN.length >= 3) { tokens.unshift(cleanN); } p.tokens = tokens; return p }
  function hlt(text) { const raw = ($('search')?.value || $('studySearch')?.value || ''); const p = parseQuery(raw); const tokens = [...new Set((p.tokens || []).filter(t => t.length >= 2))].sort((a, b) => b.length - a.length); const src = String(text ?? ''); if (!tokens.length) return esc(src); let ns = '', map = []; for (let i = 0; i < src.length; i++) { let c = norm(src[i]); if (!c) continue; for (const ch of c) { ns += ch; map.push(i) } } let ranges = []; for (const t of tokens) { let pos = 0; while ((pos = ns.indexOf(t, pos)) > -1) { let a = map[pos], b = map[pos + t.length - 1] + 1; if (a != null && b != null && !ranges.some(r => !(b <= r[0] || a >= r[1]))) ranges.push([a, b]); pos += t.length } } if (!ranges.length) return esc(src); ranges.sort((a, b) => a[0] - b[0]); let out = '', last = 0; for (const [a, b] of ranges) { out += esc(src.slice(last, a)); out += `<mark class="searchMark tokenMark">${esc(src.slice(a, b))}</mark>`; last = b } return out + esc(src.slice(last)) }
  function searchList() { const raw = ($('search')?.value || $('studySearch')?.value || ''); const p = parseQuery(raw); let data = Array.isArray(RAW) ? RAW : []; if (!p.raw) return data; return data.map(q => { let score = 0; if (p.num !== null) { if (Number(q.num) !== p.num) return null; score += 2000 } const a = ans(q).split('').sort().join(''); if (p.answer) { if (a !== p.answer) return null; score += 900 } if (p.multi) { if (ans(q).length <= 1) return null; score += 350 } const h = allText(q); for (const t of p.tokens) { if (!h.includes(t)) return null; score += 80 } return { q, score } }).filter(Boolean).sort((x, y) => y.score - x.score || Number(x.q.num) - Number(y.q.num)).map(x => x.q) }
  function passFilter(q) { const f = filterVal(); if (f === 'all') return true; if (f === 'has_image') return hasImg(q); return risk(q) === f }
  function stats(data) { return { total: data.length, img: data.filter(hasImg).length, high: data.filter(q => risk(q) === 'high').length, medium: data.filter(q => risk(q) === 'medium').length, low: data.filter(q => risk(q) === 'low').length } }
  function ensureToolbar() { const list = $('studyList'); if (!list) return; let tool = $('libraryStableToolbar'); if (!tool) { tool = document.createElement('section'); tool.id = 'libraryStableToolbar'; tool.className = 'libraryStableToolbar'; tool.innerHTML = '<div class="libStableHead libStableHeadCompact"><div class="libStableInfo"><b id="libStableFilterText">Tất cả</b><em id="libStableCount">0 câu</em></div></div><div id="libStableSearchSlot"></div><div id="libStableFilters"></div>'; const searchBox = ($('search') || $('studySearch'))?.closest('.search'); (searchBox?.parentNode || list.parentNode).insertBefore(tool, searchBox || list) } const searchBox = ($('search') || $('studySearch'))?.closest('.search'); if (searchBox && $('libStableSearchSlot') && searchBox.parentNode !== $('libStableSearchSlot')) $('libStableSearchSlot').appendChild(searchBox); const input = $('search') || $('studySearch'); if (input) { input.placeholder = 'Tìm câu hoặc #12...'; if (!input.value) { try { input.value = localStorage.getItem(SEARCH_STORE) || '' } catch (e) { } } if (!$('libStableClear')) { const b = document.createElement('button'); b.id = 'libStableClear'; b.type = 'button'; b.textContent = '×'; b.title = 'Xóa tìm kiếm'; b.onclick = function () { input.value = ''; try { localStorage.removeItem(SEARCH_STORE) } catch (e) { } renderUnified(); input.focus() }; input.insertAdjacentElement('afterend', b) } input.oninput = function () { try { localStorage.setItem(SEARCH_STORE, input.value || '') } catch (e) { } renderUnified() }; $('libStableClear')?.classList.toggle('show', !!input.value.trim()) } }
  function renderFilters(base, shown) { ensureToolbar(); const box = $('libStableFilters'); if (!box) return; const s = stats(base), f = filterVal(); const filters = [['all', 'Tất cả', s.total], ['has_image', 'Có ảnh', s.img], ['high', 'Rủi ro cao', s.high], ['medium', 'Trung bình', s.medium], ['low', 'Thấp', s.low]]; box.innerHTML = '<div class="libStableFilterLine">' + filters.map(x => `<button type="button" class="${f === x[0] ? 'active' : ''}" data-stable-filter="${x[0]}">${x[1]} <small>${x[2]}</small></button>`).join('') + '</div>'; const ft = $('libStableFilterText'), ct = $('libStableCount'); if (ft) ft.textContent = 'Đang lọc: ' + (filters.find(x => x[0] === f)?.[1] || 'Tất cả'); if (ct) ct.textContent = shown.length + ' / ' + base.length + ' câu'; }
  function miniImg(q) {
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (imgs.length) {
      return `<div class="libraryV2Img noAutoImg" title="Có ${imgs.length} ảnh"><img src="${esc(optimizeImageUrl(imgs[0]))}" alt="thumb"></div>`;
    }
    return q.has_image ? `<div class="libraryV2Img noAutoImg" title="Có ảnh"><span>🖼</span></div>` : '<div class="libraryV2Img empty"></div>';
  }
  function options(q) { const a = ans(q); return Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? 'correct' : ''}"><b>${esc(k)}</b><span>${hlt(v)}</span></div>`).join('') }
  function images(q, open) {
    if (!open) return '';
    if (q.has_image && !q.__imagesLoaded && !q.__imagesLoading) {
      q.__imagesLoading = true;
      const supa = window.HODSupabase?.__client;
      if (supa && q.id) {
        supa.from('questions').select('id,images,updated_at').eq('id', q.id).maybeSingle().then(res => {
          q.__imagesLoading = false;
          q.__imagesLoaded = true;
          if (res.data) {
            q.images = cleanImages(res.data.images);
            if (typeof renderStudy === 'function') renderStudy();
          }
        }).catch(() => {
          q.__imagesLoading = false;
          q.__imagesLoaded = true;
        });
      }
    }
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (!imgs.length) {
      return q.has_image ? `<div class="libraryV2Images"><div class="imgLoading" style="color:var(--mist);font-size:.8rem;padding:10px 0;">Đang tải ảnh từ database...</div></div>` : '';
    }
    return `<div class="libraryV2Images">${imgs.map((s, i) => `<img loading="lazy" src="${esc(optimizeImageUrl(s))}" alt="Ảnh ${i + 1}" class="zoomableImg">`).join('')}</div>`
  }
  function card(q, i) {
    const a = ans(q) || '?', r = risk(q);
    const rawSearch = ($('search')?.value || $('studySearch')?.value || '').trim();
    const queryObj = parseQuery(rawSearch);
    let isMatchInDetails = false;
    if (queryObj.tokens && queryObj.tokens.length) {
      const detailsText = norm(Object.values(q.options || {}).join(' ') + ' ' + (q.answer_text || ''));
      isMatchInDetails = queryObj.tokens.every(t => detailsText.includes(t));
    }
    const open = viewVal() === 'full' || libraryOpenNums.has(String(q.num)) || isMatchInDetails || !!rawSearch;
    return `<article class="libraryV2Card libraryQuestionCard ${open ? 'open' : ''}" data-num="${esc(q.num || '')}" data-stable-index="${i}" style="border-left-color:${riskColor(r)}!important"><div class="libraryV2Row"><div class="libraryV2Num">Câu ${esc(q.num || i + 1)}</div><div class="libraryV2Main"><div class="libraryV2Question">${hlt(q.question || '')}</div><div class="libraryV2Answer"><b>Đáp án: ${esc(a)}</b><span>${hlt(answerText(q))}</span></div></div>${miniImg(q)}<div class="libraryV2Actions"><button type="button" class="libraryV2Study" data-stable-study="${i}" title="Học câu này">Học</button><button type="button" class="libraryV2Report" data-stable-report="${i}" title="Báo cáo / sửa câu">!</button><button type="button" class="libraryV2Toggle" data-stable-toggle="${i}">${open ? 'Thu gọn' : 'Mở'}</button></div></div><div class="libraryV2Details"><div class="libraryOptions">${options(q)}</div>${images(q, open)}</div></article>`
  }
  function renderUnified() { ensureToolbar(); const base = searchList(); lastList = base.filter(passFilter); renderFilters(base, lastList); const list = $('studyList'); if (!list) return; list.innerHTML = lastList.length ? lastList.map(card).join('') : '<div class="libraryStableEmpty"><b>Không có câu phù hợp.</b><button type="button" data-stable-clear-all>Xóa tìm kiếm & bộ lọc</button></div>'; if ($('libStableClear')) $('libStableClear').classList.toggle('show', !!(($('search') || $('studySearch'))?.value || '').trim()) }
  function setCurrent(q) { let idx = (pool || []).findIndex(x => Number(x.num) === Number(q.num)); if (idx < 0) { pool = [...RAW]; idx = pool.findIndex(x => Number(x.num) === Number(q.num)) } if (idx >= 0) { ci = idx; flipped = false; flipDir = 'horizontal'; try { renderCard() } catch (e) { } return true } return false }

  function showImageLightbox(src) {
    let overlay = document.getElementById('lhImageLightbox');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lhImageLightbox';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        cursor: zoom-out;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;
      overlay.innerHTML = `<img id="lhLightboxImg" src="" style="width:90vw;height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);transition:transform 0.25s ease;transform:scale(0.95);">`;
      overlay.onclick = () => {
        overlay.style.opacity = '0';
        overlay.querySelector('img').style.transform = 'scale(0.95)';
        setTimeout(() => overlay.classList.add('hidden'), 250);
      };
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
    overlay.querySelector('img').src = src;
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.querySelector('img').style.transform = 'scale(1)';
    }, 10);
  }

  document.addEventListener('click', function (e) {
    // 1. Phóng to bất kỳ ảnh nào khi bấm vào
    const zoomImg = e.target.closest('.libraryV2Images img, #images img, .sitem img, .dqEditImg img, .libraryV2Img img');
    if (zoomImg && zoomImg.src) {
      e.preventDefault();
      e.stopPropagation();
      showImageLightbox(zoomImg.src);
      return;
    }

    const f = e.target.closest('[data-stable-filter]');
    if (f) {
      e.preventDefault();
      localStorage.setItem(FILTER_STORE, f.dataset.stableFilter || 'all');
      renderUnified();
      return;
    }
    if (e.target.closest('[data-stable-clear-all]')) {
      e.preventDefault();
      const input = $('search') || $('studySearch');
      if (input) input.value = '';
      try { localStorage.removeItem(SEARCH_STORE) } catch (_e) { }
      localStorage.setItem(FILTER_STORE, 'all');
      renderUnified();
      return;
    }

    const h = e.target.closest('[data-stable-study]');
    if (h) {
      e.preventDefault();
      const q = lastList[+h.dataset.stableStudy];
      if (q && setCurrent(q)) document.querySelector('[data-tab="fc"]')?.click?.();
      return;
    }
    const r = e.target.closest('[data-stable-report]');
    if (r) {
      e.preventDefault();
      const q = lastList[+r.dataset.stableReport];
      if (q) {
        if (typeof window.openStudyReport === 'function') window.openStudyReport(q.num, e);
        else if (setCurrent(q)) openEditor?.()
      }
      return;
    }

    // 2. Nhấp vào hàng để co/giãn câu hỏi
    const cardRow = e.target.closest('.libraryV2Row');
    if (cardRow) {
      const card = cardRow.closest('.libraryV2Card');
      if (card) {
        e.preventDefault();
        card.classList.toggle('open');
        const num = card.dataset.num;
        if (num) {
          if (card.classList.contains('open')) libraryOpenNums.add(String(num));
          else libraryOpenNums.delete(String(num));
          saveOpenState();
        }
        const toggleBtn = card.querySelector('[data-stable-toggle]');
        if (toggleBtn) {
          toggleBtn.textContent = card.classList.contains('open') ? 'Thu gọn' : 'Mở';
        }
        return;
      }
    }
  }, true);
  function apply() { try { renderStudy = renderUnified; window.renderStudy = renderUnified } catch (e) { window.renderStudy = renderUnified } const s = $('search') || $('studySearch'); if (s) { try { if (!s.value) s.value = localStorage.getItem(SEARCH_STORE) || '' } catch (e) { } s.oninput = function () { try { localStorage.setItem(SEARCH_STORE, s.value || '') } catch (e) { } renderUnified() } } renderUnified() }
  window.__renderStudyUnified = renderUnified;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 0)); else setTimeout(apply, 0);
  setTimeout(apply, 700);
})();
// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 END =====




// ===== COPILOT_CLOUDINARY_IMAGE_FIX_20260627 =====
// Ảnh mới sẽ upload lên Cloudinary, KHÔNG lưu Base64 vào Supabase nữa.
(function () {
  const CLOUDINARY_CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
  const CLOUDINARY_UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
  const CLOUDINARY_UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
  const CLOUDINARY_UPLOAD_URL = window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (CLOUDINARY_CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` : '');
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const QUESTION_LIGHT_COLUMNS = 'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
  function $(id) { return document.getElementById(id); }
  function supa() { return window.HODSupabase?.__client || null; }
  function user() { return window.HODSupabase?.getUser?.() || null; }
  function subject() { return localStorage.getItem(SUBJECT_STORE) || ''; }
  function notifyX(t) { if (typeof notify === 'function') notify(t); else console.log(t); }
  async function uploadCloudinary(file) {
    if (!CLOUDINARY_UPLOAD_URL || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder', CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
    return { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: 'cloudinary' };
  }
  async function loadSubjectLight(force = false) {
    const c = supa(), code = subject();
    if (!c || !user()) return false;
    if (!code) return false;
    const { data, error } = await c.from('questions').select(QUESTION_LIGHT_COLUMNS).eq('is_active', true).eq('subject_code', code).order('num', { ascending: true });
    if (error) { console.warn('[light load]', error); return false; }
    RAW = (data || []).map(r => ({ id: r.id, subject_code: r.subject_code || code, num: r.num, question: r.question, options: r.options || {}, answer: r.answer || '', answer_text: r.answer_text || '', images: (typeof cleanImages === 'function' ? cleanImages(r.images || []) : (r.images || [])), has_image: r.has_image, error_risk: r.error_risk, error_risk_reason: r.error_risk_reason, __imagesChecked: true, __imagesLoaded: true }));
    pool = [...RAW];
    const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
    ci = Math.max(0, Math.min(saved, Math.max(0, pool.length - 1)));
    flipped = false;
    try { renderCard(); renderQuiz(); renderStudy(); } catch (e) { }
    return true;
  }
  window.loadCurrentSubjectOnly = loadSubjectLight;
  function patchApi() { if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight; }
  patchApi(); setTimeout(patchApi, 500); setTimeout(patchApi, 1500);

  async function fetchImagesForCurrent() {
    const c = supa(); const q = (pool && pool[ci]) || null;
    if (!c || !q || !q.id || q.__imagesChecked) return;
    q.__imagesChecked = true;
    const { data, error } = await c.from('questions').select('id,images').eq('id', q.id).maybeSingle();
    if (!error && data) { q.images = data.images || []; q.__imagesLoaded = true; try { renderCard(); } catch (e) { } }
  }
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__cloudinaryLazy) {
    renderCard = function () { oldRenderCard.apply(this, arguments); }; // tắt auto fetch ảnh để tránh nhấp nháy
    renderCard.__cloudinaryLazy = true; window.renderCard = renderCard;
  }

  function bindEditorUpload() {
    const inp = $('imgUpload');
    if (!inp || inp.__cloudinaryBound) return;
    inp.__cloudinaryBound = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      inp.disabled = true; notifyX('Đang upload ảnh lên Cloudinary...');
      try {
        editDraft.images = editDraft.images || [];
        for (const file of files) { editDraft.images.push(await uploadCloudinary(file)); }
        if (typeof renderEditImages === 'function') renderEditImages();
        notifyX('Đã upload ảnh lên Cloudinary');
      } catch (err) { alert(err.message || err); }
      finally { inp.disabled = false; e.target.value = ''; }
    };
  }
  const oldOpenEditor = typeof openEditor === 'function' ? openEditor : null;
  if (oldOpenEditor && !oldOpenEditor.__cloudinaryPatch) {
    openEditor = async function () {
      const q = (pool && pool[ci]) || null;
      if (q && q.id && !q.__imagesLoaded) {
        try { const c = supa(); const { data } = await c.from('questions').select('*').eq('id', q.id).maybeSingle(); if (data) Object.assign(q, data, { images: data.images || [], __imagesLoaded: true }); } catch (e) { }
      }
      const r = oldOpenEditor.apply(this, arguments);
      setTimeout(bindEditorUpload, 0);
      return r;
    };
    openEditor.__cloudinaryPatch = true; window.openEditor = openEditor;
  }
  document.addEventListener('DOMContentLoaded', () => { patchApi(); setTimeout(bindEditorUpload, 300); });
})();

// ===== FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====
// Mục tiêu: không lưu Base64 mới, chỉ lưu URL ảnh, tải câu nhẹ, có nút/tự reload câu hiện tại.
(function () {
  const CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
  const UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
  const UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
  const UPLOAD_URL = window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : '');
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const LIGHT_COLUMNS = 'id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason';
  const FULL_COLUMNS = 'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
  let lastAutoReload = 0;

  function $(id) { return document.getElementById(id); }
  function supa() { return window.HODSupabase?.__client || null; }
  function user() { return window.HODSupabase?.getUser?.() || null; }
  function subject() { return localStorage.getItem(SUBJECT_STORE) || ''; }
  function notifyX(msg) { if (typeof notify === 'function') notify(msg); else console.log(msg); }

  function isDataImage(s) { return /^data:image\//i.test(String(s || '')); }
  function isLikelyBase64(s) {
    s = String(s || '').trim();
    return s.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s);
  }
  function cleanImageOne(im) {
    if (!im) return null;
    if (typeof im === 'string') {
      const s = im.trim();
      if (!s || isDataImage(s) || isLikelyBase64(s)) return null;
      if (/^https?:\/\//i.test(s)) return { src: s, url: s, source: 'url' };
      return null;
    }
    if (typeof im === 'object') {
      const raw = im.secure_url || im.src || im.url || im.publicUrl || im.public_url || im.image_url || im.imageUrl || im.file_url || im.fileUrl || im.href || im.path || '';
      if (!raw || isDataImage(raw) || isLikelyBase64(raw)) return null;
      if (!/^https?:\/\//i.test(String(raw))) return null;
      return {
        id: im.public_id || im.id || undefined,
        public_id: im.public_id || im.id || undefined,
        src: String(raw),
        url: String(raw),
        width: im.width || undefined,
        height: im.height || undefined,
        source: im.source || 'url'
      };
    }
    return null;
  }
  function cleanImages(arr) {
    let raw = arr || [];
    if (typeof raw === 'string') {
      const s = raw.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try { raw = JSON.parse(s); } catch (e) { raw = [raw]; }
      } else raw = [raw];
    }
    if (!Array.isArray(raw)) raw = [raw];
    return raw.map(cleanImageOne).filter(Boolean);
  }
  function imageUrl(im) {
    const c = cleanImageOne(im);
    return c?.src || '';
  }

  async function uploadCloudinary(file) {
    if (!UPLOAD_URL || !UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', UPLOAD_FOLDER);
    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || 'Upload ảnh lên Cloudinary thất bại');
    return cleanImageOne({
      public_id: data.public_id,
      secure_url: data.secure_url,
      width: data.width,
      height: data.height,
      source: 'cloudinary'
    });
  }

  window.__LHCleanImages = cleanImages;
  window.__LHUploadCloudinary = uploadCloudinary;

  function optimizeImageUrl(src) {
    if (!src) return '';
    if (src.includes('res.cloudinary.com/') && src.includes('/image/upload/')) {
      if (!src.includes('q_auto') && !src.includes('f_auto')) {
        return src.replace('/image/upload/', '/image/upload/c_limit,w_600,q_auto,f_auto/');
      }
    }
    return src;
  }

  // Hiển thị ảnh chỉ từ URL hợp lệ.
  window.imgsHTML = imgsHTML = function (c) {
    return cleanImages(c?.images || []).map(im => `<img src="${esc(optimizeImageUrl(im.src))}" alt="" loading="lazy">`).join('');
  };

  function bindEditorUpload() {
    const inp = $('imgUpload');
    if (!inp || inp.__urlOnlyBound) return;
    inp.__urlOnlyBound = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      inp.disabled = true;
      notifyX('Đang upload ảnh...');
      try {
        editDraft.images = cleanImages(editDraft.images);
        for (const file of files) {
          const uploaded = await uploadCloudinary(file);
          if (uploaded) editDraft.images.push(uploaded);
        }
        if (typeof renderEditImages === 'function') renderEditImages();
        notifyX('Đã upload ảnh bằng URL');
      } catch (err) { alert(err.message || err); }
      finally { inp.disabled = false; inp.value = ''; }
    };
  }

  // Không cho render/sửa ảnh Base64 cũ ở form.
  const oldRenderEditImages = typeof renderEditImages === 'function' ? renderEditImages : null;
  renderEditImages = window.renderEditImages = function () {
    const box = $('editImgs');
    if (!box) return oldRenderEditImages ? oldRenderEditImages() : undefined;
    editDraft.images = cleanImages(editDraft.images);
    box.innerHTML = editDraft.images.length
      ? editDraft.images.map((im, i) => `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${esc(im.src)}" loading="lazy"></div>`).join('')
      : '<p style="color:var(--mist)">Chưa có hình.</p>';
  };

  const oldOpenEditor = typeof openEditor === 'function' ? openEditor : null;
  if (oldOpenEditor && !oldOpenEditor.__urlOnlyPatch) {
    openEditor = window.openEditor = async function () {
      const q = (pool && pool[ci]) || null;
      if (q?.id && !q.__imagesLoaded) {
        try {
          const c = supa();
          const { data } = await c.from('questions').select(FULL_COLUMNS).eq('id', q.id).maybeSingle();
          if (data) Object.assign(q, data, { images: cleanImages(data.images), __imagesLoaded: true });
        } catch (e) { }
      }
      const r = oldOpenEditor.apply(this, arguments);
      setTimeout(bindEditorUpload, 0);
      setTimeout(() => { if (editDraft) editDraft.images = cleanImages(editDraft.images); if (typeof renderEditImages === 'function') renderEditImages(); }, 20);
      return r;
    };
    openEditor.__urlOnlyPatch = true;
  }

  // Chặn Base64 trước mọi luồng gửi báo cáo/sửa.
  if (window.HODSupabase?.submitEditRequest && !window.HODSupabase.submitEditRequest.__urlOnlyPatch) {
    const oldSubmit = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
    window.HODSupabase.submitEditRequest = async function (newDraft, oldQ) {
      if (newDraft) newDraft.images = cleanImages(newDraft.images);
      if (oldQ) oldQ.images = cleanImages(oldQ.images);
      return oldSubmit(newDraft, oldQ);
    };
    window.HODSupabase.submitEditRequest.__urlOnlyPatch = true;
  }


  const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 giờ
  function cacheKey(code) { return 'learninghub_questions_cache_v1_' + code; }
  function readQuestionCache(code) {
    try {
      const raw = localStorage.getItem(cacheKey(code));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.savedAt || !Array.isArray(obj.rows)) return null;
      if (Date.now() - obj.savedAt > CACHE_TTL) return null;
      return obj.rows;
    } catch (e) { return null; }
  }
  function writeQuestionCache(code, rows) {
    try { localStorage.setItem(cacheKey(code), JSON.stringify({ savedAt: Date.now(), rows: rows || [] })); } catch (e) { }
  }
  function applyQuestionRows(rows, code) {
    RAW = (rows || []).map(r => ({
      id: r.id, subject_code: r.subject_code || code, num: r.num,
      question: r.question, options: r.options || {}, answer: r.answer || '', answer_text: r.answer_text || '',
      images: cleanImages(r.images || []), is_active: r.is_active, updated_at: r.updated_at,
      has_image: r.has_image, error_risk: r.error_risk, error_risk_reason: r.error_risk_reason,
      __imagesChecked: !!(r.images && r.images.length), 
      __imagesLoaded: !!(r.images && r.images.length)
    }));
    pool = [...RAW];
    const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
    ci = Math.max(0, Math.min(saved, Math.max(0, pool.length - 1)));
    flipped = false;
    try { renderCard(); renderQuiz(); renderStudy(); } catch (e) { }
  }

  let activeLoadPromises = {};
  async function loadSubjectLight(force = false) {
    const c = supa(), code = subject();
    if (!c || !user() || !code) return false;
    if (!force) {
      const cached = readQuestionCache(code);
      if (cached && cached.length) { applyQuestionRows(cached, code); return true; }
    }
    
    // Nếu môn học này đang được tải từ Supabase, trả về Promise đang chạy đó
    if (activeLoadPromises[code]) {
      console.warn('[loadSubjectLight] Trả về promise tải đang chạy cho môn:', code);
      return activeLoadPromises[code];
    }
    
    activeLoadPromises[code] = (async () => {
      try {
        const { data, error } = await c.from('questions')
          .select(LIGHT_COLUMNS)
          .eq('is_active', true)
          .eq('subject_code', code)
          .order('num', { ascending: true });
        if (error) { console.warn('[loadSubjectLight]', error); return false; }
        writeQuestionCache(code, data || []);
        applyQuestionRows(data || [], code);
        return true;
      } finally {
        delete activeLoadPromises[code];
      }
    })();
    
    return activeLoadPromises[code];
  }

  async function fetchImagesForCurrent(force = false) {
    const c = supa();
    const q = (pool && pool[ci]) || null;
    if (!c || !q?.id) return false;
    
    // Nếu đã kiểm tra ảnh rồi thì không fetch lại nữa, kể cả images rỗng.
    if (!force && (q.__imagesLoaded || q.__imagesChecked)) return true;
    if (q.__imagesLoading) return true;
    
    // Nếu câu hỏi không có ảnh và không force thì không cần fetch
    if (!q.has_image && !force) {
      q.__imagesChecked = true;
      q.__imagesLoaded = true;
      q.images = [];
      return true;
    }

    q.__imagesChecked = true;
    q.__imagesLoading = true;
    const { data, error } = await c.from('questions').select('id,images,updated_at').eq('id', q.id).maybeSingle();
    q.__imagesLoading = false;
    if (error || !data) { q.__imagesLoaded = true; return false; }
    q.images = cleanImages(data.images);
    q.updated_at = data.updated_at || q.updated_at;
    q.__imagesLoaded = true;
    
    // Lưu ngược lại cache localStorage
    try {
      const code = subject();
      if (code && pool) {
        const cacheData = pool.map(x => ({
          id: x.id, subject_code: x.subject_code, num: x.num,
          question: x.question, options: x.options, answer: x.answer, answer_text: x.answer_text,
          images: x.images, is_active: x.is_active, updated_at: x.updated_at,
          has_image: x.has_image, error_risk: x.error_risk, error_risk_reason: x.error_risk_reason
        }));
        writeQuestionCache(code, cacheData);
      }
    } catch(e){}

    try { renderCard(); renderQuiz(); renderStudy(); } catch (e) { }
    return true;
  }

  async function reloadCurrentQuestion(silent = false) {
    const c = supa();
    const q = (pool && pool[ci]) || null;
    if (!c || !q?.id) return false;
    const { data, error } = await c.from('questions').select(FULL_COLUMNS).eq('id', q.id).maybeSingle();
    if (error || !data) { if (!silent) alert('Không reload được câu hiện tại.'); return false; }
    const clean = { ...data, images: cleanImages(data.images), __imagesChecked: true, __imagesLoaded: true };
    const upd = row => String(row.id) === String(clean.id) ? Object.assign(row, clean) : row;
    RAW = (RAW || []).map(upd);
    pool = (pool || []).map(upd);
    try { renderCard(); renderQuiz(); renderStudy(); } catch (e) { }
    if (!silent) notifyX('Đã reload câu hiện tại');
    return true;
  }

  window.loadCurrentSubjectOnly = loadSubjectLight;
  window.reloadCurrentQuestion = reloadCurrentQuestion;
  if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;

  let lazyLoadTimeout = null;
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__urlOnlyLazy) {
    renderCard = window.renderCard = function () {
      oldRenderCard.apply(this, arguments);
      // Gọi fetchImagesForCurrent tự động sau khi render có debounce 300ms
      if (lazyLoadTimeout) clearTimeout(lazyLoadTimeout);
      lazyLoadTimeout = setTimeout(() => {
        fetchImagesForCurrent(false);
      }, 300);
    };
    renderCard.__urlOnlyLazy = true;
  }

  function ensureReloadButton() { return; }

  function autoReloadCurrent() {
    const now = Date.now();
    if (now - lastAutoReload < 45000) return;
    lastAutoReload = now;
    reloadCurrentQuestion(true);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Tắt tự reload câu hiện tại sau mỗi 60 giây/focus.
    // setTimeout(()=>loadSubjectLight(), 900);
    // setInterval(autoReloadCurrent, 60000);
  });
  // window.addEventListener('focus', autoReloadCurrent);
  // document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) autoReloadCurrent(); });
})();
// ===== END FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====

// ===== REMOVE_RELOAD_CURRENT_QUESTION_BUTTON_20260628 =====
// Bỏ nút "↻ Câu" trên giao diện học. Vẫn giữ các tối ưu URL ảnh và tải nhẹ.
(function () {
  function removeBtn() {
    const btn = document.getElementById('reloadCurrentQuestionBtn');
    if (btn) btn.remove();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeBtn);
  else removeBtn();
  setTimeout(removeBtn, 100);
  setTimeout(removeBtn, 500);
  setInterval(removeBtn, 1000);
})();
// ===== END REMOVE_RELOAD_CURRENT_QUESTION_BUTTON_20260628 =====

// ===== FINAL_UI_DEDUP_CLEANER_20260628 =====
// Dọn rác giao diện do nhiều patch cũ tạo trùng: avatar, report box, nút đổi môn, nút tải câu, modal report.
(function () {
  function all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function keepFirstById(id) {
    const arr = all('#' + id);
    arr.slice(1).forEach(x => x.remove());
    return arr[0] || null;
  }
  function removeAll(id) { all('#' + id).forEach(x => x.remove()); }
  function cleanButtons() {
    // Bỏ hoàn toàn nút tải/reload câu theo yêu cầu.
    removeAll('reloadCurrentQuestionBtn');

    // Chỉ giữ 1 avatar tài khoản.
    const avatar = keepFirstById('hodTopAvatar');
    if (avatar) {
      avatar.style.display = avatar.style.display === 'none' ? '' : avatar.style.display;
      avatar.classList.remove('ghost', 'duplicate');
    }

    // Chỉ giữ 1 menu report và 1 modal report.
    keepFirstById('hodReportBox');
    keepFirstById('hodReportModal');

    // Chỉ giữ 1 nút đổi môn, đặt nằm trước nút cài đặt nếu có.
    const chip = keepFirstById('subjectTopChip');
    const actions = document.querySelector('.globalTop .actions') || document.querySelector('#fc .actions') || document.querySelector('.actions');
    const settings = document.getElementById('openSettings');
    if (chip && actions) {
      chip.textContent = 'Đổi môn';
      chip.classList.remove('hidden', 'ghost', 'duplicate');
      chip.style.display = 'inline-flex';
      if (settings && settings.parentNode === actions && settings.previousElementSibling !== chip) {
        actions.insertBefore(chip, settings);
      } else if (!actions.contains(chip)) {
        actions.prepend(chip);
      }
    }

    // Bỏ nút admin header cũ nếu có, tránh chồng với menu avatar.
    removeAll('adminOpenBtn');

    // Chỉ giữ 1 nút login status nếu code cũ tạo trùng.
    keepFirstById('authStatusBtn');

    // Chỉ giữ 1 canvas hạt nền và 1 mobile nav.
    keepFirstById('landingParticles');
    keepFirstById('mobileCardNav');

    // Chỉ giữ 1 thanh tab trong chọn môn.
    keepFirstById('subjectGateTabsBar');
  }

  function cleanModals() {
    // Nếu có nhiều modal report trùng class/id thì giữ cái đầu tiên.
    const reportModals = all('.hodReportModal');
    reportModals.slice(1).forEach(x => x.remove());

    // Xóa các nút đóng modalX bị tạo trùng trong cùng một box.
    document.querySelectorAll('.modal .box, .overlay .box').forEach(box => {
      const xs = Array.from(box.querySelectorAll(':scope > .modalX'));
      xs.slice(1).forEach(x => x.remove());
    });
  }

  function cleanAddQuestionGhosts() {
    // Tránh nhiều nút + Thêm câu hỏi bị hiện cùng lúc trong tab thư viện.
    const buttons = all('.addQuestionFloat, .lhAddQuestionFloat, #addQuestionFloatBtn, #lhAddQuestionBtn');
    const visible = buttons.filter(b => !b.classList.contains('hidden') && b.style.display !== 'none');
    visible.slice(1).forEach(b => b.remove());
  }

  function runCleaner() {
    cleanButtons();
    cleanModals();
    cleanAddQuestionGhosts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runCleaner);
  else runCleaner();
  setTimeout(runCleaner, 100);
  setTimeout(runCleaner, 500);
  setTimeout(runCleaner, 1500);
  setInterval(runCleaner, 3000);
})();
// ===== END FINAL_UI_DEDUP_CLEANER_20260628 =====

// ===== REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628 =====
(function () {
  function kill() {
    document.querySelectorAll('button').forEach(function (b) {
      const txt = (b.textContent || '').trim().toLowerCase();
      const title = (b.getAttribute('title') || '').toLowerCase();
      if (b.id === 'reloadCurrentQuestionBtn' || txt === '↻ câu' || title.includes('reload câu') || title.includes('tải câu')) b.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kill); else kill();
  setTimeout(kill, 50); setTimeout(kill, 200); setTimeout(kill, 800);
  setInterval(kill, 500);
})();
// ===== END REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628 =====

// ===== FINAL_ADMIN_EDITOR_SKIP_APPROVAL_APP_20260628 =====
// Admin / Editor không cần chờ phê duyệt tài khoản.
(function () {
  function isPrivileged(p) {
    const role = String(p?.role || '').toLowerCase();
    return role === 'admin' || role === 'editor';
  }
  async function approvePrivilegedProfile() {
    try {
      const api = window.HODSupabase;
      const p = api?.getProfile?.();
      const u = api?.getUser?.();
      const c = api?.__client || null;
      if (!p || !u || !isPrivileged(p)) return false;

      // Nếu tài khoản đã được duyệt từ trước, ẩn màn khóa và dừng luôn, không gửi request dư thừa
      if (p.approved === true && p.blocked === false) {
        document.getElementById('hodPendingApproval')?.classList.add('hidden');
        document.getElementById('hodLoginGate')?.classList.add('hidden');
        document.body?.classList.remove('hod-locked');
        return true;
      }

      // Sửa ngay trên object profile đang dùng trong app để khỏi bị màn chờ duyệt chặn.
      p.approved = true;
      p.blocked = false;
      p.is_blocked = false;
      if (p.status === 'blocked') p.status = 'active';

      // Lưu lại Supabase nếu cột approved đang false.
      if (c) {
        await c.from('profiles')
          .update({ approved: true, blocked: false })
          .eq('id', u.id)
          .in('role', ['admin', 'editor']);
      }

      // Ẩn màn chờ duyệt nếu đang hiện.
      document.getElementById('hodPendingApproval')?.classList.add('hidden');
      document.getElementById('hodLoginGate')?.classList.add('hidden');
      document.body?.classList.remove('hod-locked');

      // Nếu đang có môn đã chọn thì tải lại câu hỏi sau khi tự duyệt.
      try {
        if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly();
        else if (api?.loadQuestionsFromSupabase) await api.loadQuestionsFromSupabase();
      } catch (e) { }
      return true;
    } catch (e) {
      console.warn('[skip approval admin/editor]', e);
      return false;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', approvePrivilegedProfile);
  else approvePrivilegedProfile();
  setTimeout(approvePrivilegedProfile, 300);
  setTimeout(approvePrivilegedProfile, 1200);
  setTimeout(approvePrivilegedProfile, 3000);
  // setInterval(approvePrivilegedProfile, 5000); // tắt update Supabase mỗi 5 giây để giảm gọi Supabase
})();
// ===== END FINAL_ADMIN_EDITOR_SKIP_APPROVAL_APP_20260628 =====

// ===== FINAL_RESET_KEEP_CURRENT_TAB_20260628 =====
// Bấm Reset chỉ reset câu/thứ tự, không nhảy tab. Đang ở Flashcard/Kiểm tra/Thư viện thì giữ nguyên tab đó.
(function () {
  function currentTabId() {
    return document.querySelector('.pane.active')?.id || document.querySelector('.tab.active')?.dataset?.tab || 'fc';
  }
  function restoreTab(id) {
    if (!id) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === id));
  }
  function doResetKeepTab() {
    const tab = currentTabId();
    try {
      if (Array.isArray(RAW)) pool = [...RAW];
      ci = 0;
      flipped = false;
      flipDir = 'horizontal';
      randomActive = false;
      localStorage.setItem('hod102_random_active', '0');
      const subject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
      if (subject) localStorage.setItem('learninghub_progress_' + subject, '0');
      localStorage.setItem('hod102_ci', '0');
      if (typeof renderCard === 'function') renderCard();
      if (typeof renderQuiz === 'function') renderQuiz();
      if (typeof renderStudy === 'function') renderStudy();
      if (typeof updateSettingsUI === 'function') updateSettingsUI();
    } catch (e) { console.warn('[reset keep tab]', e); }
    restoreTab(tab);
    if (typeof notify === 'function') notify('Đã reset');
  }

  window.resetKeepCurrentTab = doResetKeepTab;
  if (typeof reset === 'function') reset = window.reset = function () { doResetKeepTab(); };
  if (typeof triggerReset === 'function') triggerReset = window.triggerReset = function () { doResetKeepTab(); };

  function bindReset() {
    ['reset', 'stReset'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn || btn.__keepTabBound) return;
      btn.__keepTabBound = true;
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        doResetKeepTab();
        return false;
      };
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindReset);
  else bindReset();
  setTimeout(bindReset, 300);
  setTimeout(bindReset, 1000);
  setInterval(bindReset, 2000);
})();
// ===== END FINAL_RESET_KEEP_CURRENT_TAB_20260628 =====



// ===== FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628 =====
// Tải trước ảnh câu gần kề và không gọi lại Supabase mỗi lần chuyển câu.
(function () {
  function srcOf(im) { return typeof im === 'string' ? im : (im?.src || im?.url || im?.secure_url || im?.publicUrl || im?.public_url || ''); }
  function preloadQuestionImages(q) {
    try {
      (q?.images || []).map(srcOf).filter(Boolean).forEach(src => {
        if (window.__LH_PRELOADED_IMAGES?.has(src)) return;
        window.__LH_PRELOADED_IMAGES = window.__LH_PRELOADED_IMAGES || new Set();
        window.__LH_PRELOADED_IMAGES.add(src);
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = src;
      });
    } catch (e) { }
  }
  function preloadAround() {
    try {
      if (!Array.isArray(pool) || !pool.length) return;
      preloadQuestionImages(pool[ci]);
      preloadQuestionImages(pool[(ci + 1) % pool.length]);
      preloadQuestionImages(pool[(ci - 1 + pool.length) % pool.length]);
    } catch (e) { }
  }
  const oldNext = typeof next === 'function' ? next : null;
  const oldPrev = typeof prev === 'function' ? prev : null;
  if (oldNext && !oldNext.__noFlicker) {
    next = function () { oldNext.apply(this, arguments); setTimeout(preloadAround, 0) };
    next.__noFlicker = true; window.next = next;
  }
  if (oldPrev && !oldPrev.__noFlicker) {
    prev = function () { oldPrev.apply(this, arguments); setTimeout(preloadAround, 0) };
    prev.__noFlicker = true; window.prev = prev;
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(preloadAround, 800));
})();
// ===== END FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628 =====


// ===== PERSIST_LAST_TAB_AND_EXAM_20260628 =====
(function () {
  const TAB_STORE = 'learninghub_last_tab_v1';
  function restoreLastTab() {
    let tab = '';
    try { tab = localStorage.getItem(TAB_STORE) || '' } catch (e) { }
    if (!/^(fc|quiz|study)$/.test(tab)) return;
    const btn = document.querySelector(`.tab[data-tab="${tab}"],[data-tab="${tab}"]`);
    if (btn && !btn.classList.contains('active')) btn.click();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]');
    if (t?.dataset?.tab) try { localStorage.setItem(TAB_STORE, t.dataset.tab) } catch (_e) { }
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { setTimeout(restoreLastTab, 250); setTimeout(restoreLastTab, 1200); setTimeout(restoreLastTab, 2500); });
  else { setTimeout(restoreLastTab, 250); setTimeout(restoreLastTab, 1200); setTimeout(restoreLastTab, 2500); }
})();
// ===== END PERSIST_LAST_TAB_AND_EXAM_20260628 =====


// ===== SUPABASE_CACHE_CLEAR_HELPER_20260628 =====
// Dùng trong Console nếu cần tải mới từ Supabase: localStorage.removeItem('learninghub_questions_cache_v1_' + localStorage.getItem('learninghub_subject_code_merged_v1')); location.reload();
window.clearLearningHubQuestionCache = function () {
  try {
    const code = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    if (code) localStorage.removeItem('learninghub_questions_cache_v1_' + code);
    if (typeof notify === 'function') notify('Đã xóa cache câu hỏi. Reload trang để tải mới.');
  } catch (e) { }
};
// ===== END SUPABASE_CACHE_CLEAR_HELPER_20260628 =====






// ===== CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628 =====
// 1 luồng duy nhất cho nút Lưu:
// - User thường: xóa request pending cũ của cùng câu rồi tạo request mới.
// - Admin/editor: lưu trực tiếp vào bảng questions.
// - Ảnh gửi lên request chỉ dùng URL, không lưu base64.
(function () {
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  let sending = false;
  const $ = id => document.getElementById(id);
  const supa = () => window.HODSupabase?.__client || null;
  const me = () => window.HODSupabase?.getUser?.() || null;
  const prof = () => window.HODSupabase?.getProfile?.() || null;
  const currentSubject = () => localStorage.getItem(SUBJECT_STORE) || '';
  const notifyUser = t => typeof notify === 'function' ? notify(t) : alert(t);
  const isEditorRole = () => ['admin', 'editor'].includes(String(prof()?.role || '').toLowerCase());

  function imgSrc(im) {
    if (!im) return '';
    if (typeof im === 'string') return im.trim();
    return String(im.secure_url || im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.path || '').trim();
  }
  function cleanImages(list) {
    let raw = list || [];
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (!t) return [];
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) { try { raw = JSON.parse(t) } catch (e) { raw = [t] } }
      else raw = [t];
    }
    if (!Array.isArray(raw)) raw = [raw];
    return raw.map((im, i) => {
      const src = imgSrc(im);
      if (!src) return null;
      if (/^data:image\//i.test(src)) return null;
      if (src.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(src)) return null;
      const o = (typeof im === 'object' && im) ? { ...im } : {};
      o.id = o.id || o.public_id || ('img_' + i + '_' + Date.now());
      o.src = src;
      o.url = src;
      o.source = o.source || (/cloudinary/i.test(src) ? 'cloudinary' : 'url');
      delete o.data; delete o.base64; delete o.dataUrl; delete o.data_url;
      return o;
    }).filter(Boolean);
  }
  function buildDraft() {
    const d = (typeof editDraft !== 'undefined') ? editDraft : window.editDraft;
    if (!d) return null;
    d.question = ($('editQuestion')?.value || '').trim();
    d.answer = ($('editAnswer')?.value || '').trim().toUpperCase();
    const ops = {};
    document.querySelectorAll('[data-opt]').forEach(t => { const v = (t.value || '').trim(); if (v) ops[t.dataset.opt] = v; });
    d.options = ops;
    d.answer_text = typeof answerText === 'function' ? answerText(d) : '';
    d.subject_code = d.subject_code || currentSubject();
    d.images = cleanImages(d.images || []);
    return d;
  }
  async function fetchQuestion(oldQ, d) {
    const c = supa();
    let q = oldQ || {};
    const code = q.subject_code || d?.subject_code || currentSubject();
    const num = q.num || d?.num;
    if (c && (q.id || (code && num))) {
      try {
        let query = c.from('questions').select('id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason');
        query = q.id ? query.eq('id', q.id) : query.eq('subject_code', code).eq('num', num);
        const { data, error } = await query.maybeSingle();
        if (!error && data) q = { ...q, ...data };
      } catch (e) { }
    }
    return q;
  }
  function row(q) {
    return {
      question: q?.question || '',
      options: q?.options || {},
      answer: q?.answer || '',
      answer_text: q?.answer_text || (typeof finalAnswerText === 'function' ? finalAnswerText(q) : ''),
      images: cleanImages(q?.images || [])
    };
  }
  async function saveClean(e) {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); e.stopImmediatePropagation?.(); }
    if (sending) return false;
    const c = supa(), u = me();
    if (!c || !u) { alert('Bạn cần đăng nhập trước.'); return false; }
    const d = buildDraft();
    if (!d) return false;
    if (!d.question) return alert('Chưa có nội dung câu hỏi.'), false;
    if (!d.answer) return alert('Chưa nhập đáp án đúng.'), false;
    if (!d.options || !Object.keys(d.options).length) return alert('Chưa có lựa chọn đáp án.'), false;

    const oldQ = await fetchQuestion((RAW || []).find(x => x.num === d.num) || (pool || [])[ci] || d, d);
    if (!oldQ?.id) return alert('Không tìm thấy ID câu hỏi. Hãy tải lại trang rồi thử lại.'), false;
    const oldRow = row(oldQ), newRow = row(d);
    const btn = $('saveEdit'), oldText = btn?.textContent || '';
    sending = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }
    try {
      if (isEditorRole()) {
        const payload = { ...newRow, updated_at: new Date().toISOString() };
        const res = await c.from('questions').update(payload).eq('id', oldQ.id);
        if (res.error) return alert('Lưu trực tiếp thất bại: ' + res.error.message), false;
        if (typeof window.clearLearningHubQuestionCache === 'function') {
          window.clearLearningHubQuestionCache();
        }
        try { await c.from('question_history').insert({ question_id: oldQ.id, request_id: null, previous_data: oldRow, new_data: payload, changed_by: u.id, approved_by: u.id }); } catch (e) { }
        $('editModal')?.classList.add('hidden');
        notifyUser('Đã lưu trực tiếp');
        if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true);
        return false;
      }

      const existed = await c.from('edit_requests').select('id').eq('question_id', oldQ.id).eq('user_id', u.id).eq('status', 'pending');
      if (existed.error) return alert('Không kiểm tra được request cũ: ' + existed.error.message), false;
      const ids = (existed.data || []).map(x => x.id).filter(Boolean);
      if (ids.length) {
        const del = await c.from('edit_requests').delete().in('id', ids).select('id');
        if (del.error) return alert('Xóa request cũ thất bại: ' + del.error.message), false;
        if ((del.data || []).length < ids.length) {
          return alert('Supabase chưa cho user xóa request cũ. Cần bật quyền DELETE cho bảng edit_requests.'), false;
        }
      }

      const payload = {
        question_id: oldQ.id,
        question_num: oldQ.num || d.num || null,
        user_id: u.id,
        user_email: u.email || prof()?.email || '',
        old_data: oldRow,
        new_data: newRow,
        reason: '',
        status: 'pending'
      };
      const ins = await c.from('edit_requests').insert(payload);
      if (ins.error) return alert('Gửi yêu cầu sửa thất bại: ' + ins.error.message), false;
      $('editModal')?.classList.add('hidden');
      notifyUser(ids.length ? 'Đã xóa request cũ và tạo request mới' : 'Đã tạo request mới');
      return false;
    } finally {
      sending = false;
      if (btn) { btn.disabled = false; btn.textContent = oldText || (isEditorRole() ? 'Lưu trực tiếp' : 'Gửi báo cáo'); }
    }
  }

  saveEditor = window.saveEditor = saveClean;
  function bind() {
    const b = $('saveEdit');
    if (!b) return;
    b.onclick = saveClean;
    if (!b.__cleanRequestSaveBound) {
      b.__cleanRequestSaveBound = true;
      b.addEventListener('click', saveClean, true);
    }
  }
  const oldOpen = typeof openEditor === 'function' ? openEditor : null;
  openEditor = window.openEditor = function () {
    if (oldOpen) oldOpen.apply(this, arguments);
    setTimeout(bind, 0);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  setTimeout(bind, 300);
  setInterval(bind, 1000);
})();
// ===== END CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628 =====


// ===== COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====
// Chốt lại upload ảnh: hiện trạng thái rõ ràng + kiểm tra config Cloudinary.
(function () {
  const CFG = window.APP_CONFIG = Object.assign({
    CLOUDINARY_CLOUD_NAME: 'ddc4uvm7m',
    CLOUDINARY_UPLOAD_PRESET: 'learninghub_unsigned',
    CLOUDINARY_UPLOAD_FOLDER: 'learninghub/questions',
    CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload'
  }, window.APP_CONFIG || {});
  function $(id) { return document.getElementById(id); }
  function msg(t) { if (typeof notify === 'function') notify(t); else console.log(t); }
  function ensureStatus(inputId, statusId) {
    const inp = $(inputId); if (!inp) return null;
    let st = $(statusId);
    if (!st) {
      st = document.createElement('div');
      st.id = statusId;
      st.style.cssText = 'display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;';
      inp.insertAdjacentElement('afterend', st);
    }
    return st;
  }
  async function directUpload(file) {
    const url = CFG.CLOUDINARY_UPLOAD_URL || (CFG.CLOUDINARY_CLOUD_NAME ? 'https://api.cloudinary.com/v1_1/' + CFG.CLOUDINARY_CLOUD_NAME + '/image/upload' : '');
    const preset = CFG.CLOUDINARY_UPLOAD_PRESET;
    if (!url || !preset) throw new Error('Thiếu Cloudinary config / upload preset.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    if (CFG.CLOUDINARY_UPLOAD_FOLDER) fd.append('folder', CFG.CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || ('Cloudinary lỗi HTTP ' + res.status));
    const img = { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: 'cloudinary' };
    console.log('[Cloudinary uploaded]', img);
    return img;
  }
  window.__LHUploadCloudinary = window.__LHUploadCloudinary || directUpload;
  window.__LHTestCloudinaryConfig = function () {
    console.log('[Cloudinary config]', {
      url: CFG.CLOUDINARY_UPLOAD_URL,
      cloud: CFG.CLOUDINARY_CLOUD_NAME,
      preset: CFG.CLOUDINARY_UPLOAD_PRESET,
      folder: CFG.CLOUDINARY_UPLOAD_FOLDER
    });
    return CFG;
  };
  function bindEditUploadFinal() {
    const inp = $('imgUpload');
    if (!inp || inp.__copilotFinalUpload) return;
    inp.__copilotFinalUpload = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      const st = ensureStatus('imgUpload', 'editUploadStatus');
      if (!files.length) return;
      inp.disabled = true;
      if (st) { st.style.display = 'block'; st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...'; }
      msg('Đang upload ảnh lên Cloudinary...');
      try {
        editDraft.images = (window.__LHCleanImages ? window.__LHCleanImages(editDraft.images || []) : (editDraft.images || []));
        for (const file of files) {
          const uploaded = await (window.__LHUploadCloudinary || directUpload)(file);
          editDraft.images.push(uploaded);
        }
        if (typeof renderEditImages === 'function') renderEditImages();
        if (st) { st.textContent = 'Đã upload xong. URL nằm dưới ảnh.'; setTimeout(() => { st.style.display = 'none' }, 2200); }
        msg('Đã upload ảnh thành URL');
      } catch (err) {
        if (st) { st.textContent = 'Upload lỗi: ' + (err.message || err); }
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    };
  }
  const oldOpen = typeof window.openEditor === 'function' ? window.openEditor : null;
  if (oldOpen && !oldOpen.__copilotFinalUploadOpen) {
    window.openEditor = openEditor = function () {
      const r = oldOpen.apply(this, arguments);
      setTimeout(bindEditUploadFinal, 0);
      setTimeout(bindEditUploadFinal, 100);
      return r;
    };
    window.openEditor.__copilotFinalUploadOpen = true;
  }
  function boot() { bindEditUploadFinal(); window.__LHTestCloudinaryConfig(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 500);
})();
// ===== END COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====


// ===== COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628 =====
// Fix: bấm Sửa flashcard -> chọn ảnh -> Lưu trực tiếp phải upload ảnh trước rồi mới lưu Supabase.
(function () {
  function $(id) { return document.getElementById(id); }
  function msg(t) { if (typeof notify === 'function') notify(t); else console.log(t); }
  function isDataUrl(s) { return /^data:image\//i.test(String(s || '')); }
  function dataUrlToFile(dataUrl, name) {
    const arr = String(dataUrl).split(',');
    const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
    const bin = atob(arr[1] || '');
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name || ('upload_' + Date.now() + '.png'), { type: mime });
  }
  async function uploadOne(file) {
    if (window.__LHUploadCloudinary) return await window.__LHUploadCloudinary(file);
    const cfg = window.APP_CONFIG || {};
    const url = cfg.CLOUDINARY_UPLOAD_URL || (cfg.CLOUDINARY_CLOUD_NAME ? 'https://api.cloudinary.com/v1_1/' + cfg.CLOUDINARY_CLOUD_NAME + '/image/upload' : '');
    if (!url || !cfg.CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary config.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', cfg.CLOUDINARY_UPLOAD_PRESET);
    if (cfg.CLOUDINARY_UPLOAD_FOLDER) fd.append('folder', cfg.CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || ('Cloudinary lỗi HTTP ' + res.status));
    return { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: 'cloudinary' };
  }
  function cleanList(arr) {
    return (arr || []).filter(Boolean).map(im => {
      if (typeof im === 'string') return { src: im, url: im, source: isDataUrl(im) ? 'data' : 'url' };
      const src = im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '';
      return Object.assign({}, im, { src: src, url: src || im.url });
    }).filter(im => im.src || im.url);
  }
  async function uploadPendingEditImages() {
    if (!window.editDraft && typeof editDraft === 'undefined') return;
    const draft = window.editDraft || editDraft;
    if (!draft) return;
    const inp = $('imgUpload');
    const files = Array.from(inp?.files || []);
    let list = cleanList(draft.images || []);
    let need = list.some(im => isDataUrl(im.src || im.url)) || files.length > 0;
    if (!need) { draft.images = window.__LHCleanImages ? window.__LHCleanImages(list) : list; return; }
    const st = $('editUploadStatus') || (() => { const e = document.createElement('div'); e.id = 'editUploadStatus'; e.style.cssText = 'display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;'; inp?.insertAdjacentElement('afterend', e); return e; })();
    st.style.display = 'block'; st.textContent = 'Đang upload ảnh lên Cloudinary trước khi lưu...';
    msg('Đang upload ảnh lên Cloudinary trước khi lưu...');
    const out = [];
    for (const im of list) {
      const src = im.src || im.url;
      if (isDataUrl(src)) out.push(await uploadOne(dataUrlToFile(src, im.name || 'image.png')));
      else out.push(im);
    }
    for (const f of files) out.push(await uploadOne(f));
    draft.images = window.__LHCleanImages ? window.__LHCleanImages(out) : out;
    if (inp) inp.value = '';
    if (typeof renderEditImages === 'function') renderEditImages();
    st.textContent = 'Đã upload ảnh xong, đang lưu...';
  }
  function bindUploadInput() {
    const inp = $('imgUpload');
    if (!inp || inp.__copilotSaveUploadBound) return;
    inp.__copilotSaveUploadBound = true;
    inp.onchange = async function (e) {
      const draft = window.editDraft || (typeof editDraft !== 'undefined' ? editDraft : null);
      if (!draft) return;
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      inp.disabled = true;
      let st = $('editUploadStatus');
      if (!st) { st = document.createElement('div'); st.id = 'editUploadStatus'; st.style.cssText = 'display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;'; inp.insertAdjacentElement('afterend', st); }
      st.style.display = 'block'; st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...';
      try {
        draft.images = cleanList(draft.images || []);
        for (const f of files) draft.images.push(await uploadOne(f));
        draft.images = window.__LHCleanImages ? window.__LHCleanImages(draft.images) : draft.images;
        if (typeof renderEditImages === 'function') renderEditImages();
        st.textContent = 'Đã upload xong. URL nằm dưới ảnh.';
        msg('Đã upload ảnh thành URL');
      } catch (err) { st.textContent = 'Upload lỗi: ' + (err.message || err); alert(err.message || err); }
      finally { inp.disabled = false; inp.value = ''; }
    };
  }
  const oldOpen = window.openEditor || (typeof openEditor === 'function' ? openEditor : null);
  if (oldOpen && !oldOpen.__copilotEditSaveUploadOpen) {
    window.openEditor = openEditor = function () {
      const r = oldOpen.apply(this, arguments);
      setTimeout(bindUploadInput, 0);
      setTimeout(bindUploadInput, 150);
      setTimeout(rebindSaveButton, 180);
      return r;
    };
    window.openEditor.__copilotEditSaveUploadOpen = true;
  }
  const oldSave = window.saveEditor || (typeof saveEditor === 'function' ? saveEditor : null);
  if (oldSave && !oldSave.__copilotUploadBeforeSave) {
    window.saveEditor = saveEditor = async function () {
      const btn = $('saveEdit');
      const oldText = btn ? btn.textContent : '';
      try {
        if (btn) { btn.disabled = true; btn.textContent = 'Đang upload/lưu...'; }
        await uploadPendingEditImages();
        return await oldSave.apply(this, arguments);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = oldText || 'Lưu trực tiếp'; }
      }
    };
    window.saveEditor.__copilotUploadBeforeSave = true;
  }
  function rebindSaveButton() {
    const btn = $('saveEdit');
    if (!btn) return;
    btn.onclick = function (e) { e?.preventDefault?.(); return window.saveEditor ? window.saveEditor() : (typeof saveEditor === 'function' ? saveEditor() : undefined); };
  }
  function boot() { bindUploadInput(); rebindSaveButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 500); setTimeout(boot, 1500);
})();
// ===== END COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628 =====


// ===== COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====
(function () {
  const STORE = 'learninghub_subject_code_merged_v1';
  let pending = null;
  function $(id) { return document.getElementById(id) }
  function msg(t) { if (typeof notify === 'function') notify(t); else console.log(t) }
  function c() { return window.HODSupabase?.__client || null }
  function u() { return window.HODSupabase?.getUser?.() || null }
  function p() { return window.HODSupabase?.getProfile?.() || null }
  function can() { const x = p(), r = String(x?.role || '').toLowerCase(); return !!u() && (r === 'admin' || r === 'editor') && !(x?.blocked || x?.is_blocked || x?.status === 'blocked') }
  function sc() { return localStorage.getItem(STORE) || '' }
  function draft() { try { return editDraft || null } catch (e) { return null } }
  function dataUrl(s) { return /^data:image\//i.test(String(s || '')) }
  function escx(s) { return String(s ?? '').replace(/[&<>"']/g, a => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[a])) }
  function toFile(data, name) { const a = String(data).split(','), m = (a[0].match(/:(.*?);/) || [])[1] || 'image/png', b = atob(a[1] || ''), u8 = new Uint8Array(b.length); for (let i = 0; i < b.length; i++)u8[i] = b.charCodeAt(i); return new File([u8], name || 'image.png', { type: m }) }
  async function up(file) {
    if (window.__LHUploadCloudinary) return await window.__LHUploadCloudinary(file);
    const cfg = window.APP_CONFIG || {}, url = cfg.CLOUDINARY_UPLOAD_URL || (cfg.CLOUDINARY_CLOUD_NAME ? 'https://api.cloudinary.com/v1_1/' + cfg.CLOUDINARY_CLOUD_NAME + '/image/upload' : '');
    if (!url || !cfg.CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary config/upload preset');
    const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', cfg.CLOUDINARY_UPLOAD_PRESET); if (cfg.CLOUDINARY_UPLOAD_FOLDER) fd.append('folder', cfg.CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(url, { method: 'POST', body: fd }), j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error?.message || ('Cloudinary lỗi ' + res.status));
    return { id: j.public_id, public_id: j.public_id, src: j.secure_url, url: j.secure_url, width: j.width, height: j.height, source: 'cloudinary' };
  }
  function imgs(a) { return (a || []).map(im => { if (!im) return null; if (typeof im === 'string') return { src: im, url: im }; const src = im.secure_url || im.src || im.url || im.publicUrl || im.public_url || ''; return src ? Object.assign({}, im, { src: String(src), url: String(src) }) : null }).filter(Boolean) }
  function status(t) { let inp = $('imgUpload'), s = $('editUploadStatus'); if (!inp) return null; if (!s) { s = document.createElement('div'); s.id = 'editUploadStatus'; s.style.cssText = 'display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;'; inp.insertAdjacentElement('afterend', s) } s.style.display = 'block'; if (t) s.textContent = t; return s }
  function renderUrls() { const d = draft(), box = $('editImgs'); if (!d || !box) return; d.images = imgs(d.images).filter(x => !dataUrl(x.src || x.url)); box.innerHTML = d.images.length ? d.images.map((im, i) => `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${escx(im.src)}"><input value="${escx(im.src)}" readonly onclick="this.select()" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`).join('') : '<p style="color:var(--mist)">Chưa có hình.</p>' }
  async function runUpload(files) { const d = draft(); if (!d) return; files = [...(files || [])]; if (!files.length) return; const btn = $('saveEdit'); if (btn) { btn.disabled = true; btn.textContent = 'Đang upload ảnh...' } status('Đang upload ' + files.length + ' ảnh lên Cloudinary...'); msg('Đang upload ảnh lên Cloudinary...'); d.images = imgs(d.images).filter(x => !dataUrl(x.src || x.url)); for (const f of files) { const x = await up(f); console.log('[EDIT UPLOADED]', x); d.images.push(x) } d.images = window.__LHCleanImages ? window.__LHCleanImages(d.images) : imgs(d.images); renderUrls(); status('Đã upload xong. URL nằm dưới ảnh.'); msg('Đã upload ảnh thành URL'); if (btn) { btn.disabled = false; btn.textContent = 'Lưu trực tiếp' } }
  function bindInput() { const inp = $('imgUpload'); if (!inp || inp.__ultraUpload) return; inp.__ultraUpload = true; inp.onchange = null; inp.addEventListener('change', e => { const files = [...(e.target.files || [])]; if (!files.length) return; e.preventDefault(); e.stopImmediatePropagation(); pending = runUpload(files).catch(err => { status('Upload lỗi: ' + (err.message || err)); alert(err.message || err); throw err }).finally(() => { inp.value = '' }); }, true) }
  function build() { const d = draft(); if (!d) return null; d.question = ($('editQuestion')?.value || '').trim(); d.answer = ($('editAnswer')?.value || '').trim().toUpperCase(); const o = {}; document.querySelectorAll('[data-opt]').forEach(t => { if ((t.value || '').trim()) o[t.dataset.opt] = t.value.trim() }); d.options = o; d.answer_text = typeof answerText === 'function' ? answerText(d) : ''; d.subject_code = sc() || d.subject_code || ''; d.images = window.__LHCleanImages ? window.__LHCleanImages(imgs(d.images)) : imgs(d.images).filter(x => /^https?:\/\//i.test(x.src || x.url)); return d }
  async function uploadDataUrls() { const d = draft(); if (!d) return; const list = imgs(d.images); if (!list.some(x => dataUrl(x.src || x.url))) { d.images = window.__LHCleanImages ? window.__LHCleanImages(list) : list; return } status('Đang upload ảnh trước khi lưu...'); const out = []; for (const im of list) { const s = im.src || im.url; out.push(dataUrl(s) ? await up(toFile(s, im.name)) : im) } d.images = window.__LHCleanImages ? window.__LHCleanImages(out) : out; renderUrls() }
  async function qid(d) { if (d.id) return d.id; const db = c(), code = d.subject_code || sc(); if (!db || !code || !d.num) return null; const { data, error } = await db.from('questions').select('id').eq('subject_code', code).eq('num', d.num).maybeSingle(); return error || !data ? null : data.id }
  async function saveDirect() { if (!can()) return false; const db = c(); if (!db || !draft()) { alert('Chưa sẵn sàng dữ liệu'); return true } const btn = $('saveEdit'); try { if (btn) { btn.disabled = true; btn.textContent = 'Đang upload/lưu...' } if (pending) await pending; await uploadDataUrls(); const d = build(), id = await qid(d); if (!id) { alert('Không tìm thấy ID câu hỏi trên Supabase'); return true } const payload = { question: d.question, options: d.options || {}, answer: d.answer, answer_text: d.answer_text, images: d.images || [], updated_at: new Date().toISOString() }; const { error } = await db.from('questions').update(payload).eq('id', id); if (error) { alert('Lưu trực tiếp thất bại: ' + error.message); return true } if (typeof window.clearLearningHubQuestionCache === 'function') { window.clearLearningHubQuestionCache(); } $('editModal')?.classList.add('hidden'); msg('Đã lưu trực tiếp'); if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true); return true } finally { pending = null; if (btn) { btn.disabled = false; btn.textContent = 'Lưu trực tiếp' } } }
  function bindSave() { const b = $('saveEdit'); if (!b || b.__ultraSave) return; b.__ultraSave = true; b.onclick = null; b.addEventListener('click', async e => { if (!can()) return; e.preventDefault(); e.stopImmediatePropagation(); await saveDirect() }, true) }
  const old = window.openEditor || (typeof openEditor === 'function' ? openEditor : null); if (old && !old.__ultraOpen) { window.openEditor = openEditor = function () { const r = old.apply(this, arguments); setTimeout(() => { bindInput(); bindSave(); renderUrls(); if (can() && $('saveEdit')) $('saveEdit').textContent = 'Lưu trực tiếp' }, 0); setTimeout(() => { bindInput(); bindSave(); renderUrls() }, 250); return r }; window.openEditor.__ultraOpen = true }
  function boot() { bindInput(); bindSave() } if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); setTimeout(boot, 500); setTimeout(boot, 1500); setInterval(boot, 1000);
})();
// ===== END COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====

// ===== COPILOT_CLEAN_RUNTIME_GUARD_20260628 =====
// Bản sạch: cache request Supabase + chống spam profile/question/image. Đã xóa ghi thống kê băng thông.
(function(){
  if (window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628) return;
  window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628 = true;
  if (!window.fetch) return;

  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();
  const pending = new Map();

  function supabaseOrigin() {
    try { return new URL(window.APP_CONFIG?.SUPABASE_URL || '').origin; } catch(e) { return ''; }
  }
  function methodOf(init) {
    return String(init?.method || 'GET').toUpperCase();
  }
  function urlOf(input) {
    try {
      const raw = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      return new URL(raw, location.href);
    } catch(e) { return null; }
  }
  function isSupabase(url) {
    const origin = supabaseOrigin();
    return !!url && !!origin && url.origin === origin;
  }
  function isRest(url) {
    return isSupabase(url) && url.pathname.includes('/rest/v1/');
  }
  function currentSubject() {
    return (localStorage.getItem(SUBJECT_STORE) || '').trim();
  }
  function normalizeUrlForSubject(url, method) {
    if (!isRest(url)) return url;
    if (method !== 'GET' && method !== 'HEAD') return url;
    if (!url.pathname.includes('/rest/v1/questions')) return url;
    const subject = currentSubject();
    if (!subject) return url;
    if (url.searchParams.get('is_active') === 'eq.true' && !url.searchParams.has('subject_code')) {
      url.searchParams.set('subject_code', 'eq.' + subject);
    }
    return url;
  }
  function ttlFor(url, method) {
    if (!isRest(url)) return 0;
    if (method !== 'GET' && method !== 'HEAD') return 0;

    if (url.pathname.includes('/rest/v1/profiles')) return 10 * 60 * 1000;
    if (url.pathname.includes('/rest/v1/subjects')) return 2 * 60 * 1000;
    if (url.pathname.includes('/rest/v1/site_settings')) return 60 * 1000;

    if (url.pathname.includes('/rest/v1/questions')) {
      const select = url.searchParams.get('select') || '';
      if (select === 'id') return 2 * 60 * 1000;
      if (select === 'id,images,updated_at') return 2 * 60 * 1000;
      if (url.searchParams.get('is_active') === 'eq.true') return 2 * 60 * 1000;
    }
    return 0;
  }
  function cacheKey(method, url) {
    const params = Array.from(url.searchParams.entries()).sort((a,b) => (a[0]+'='+a[1]).localeCompare(b[0]+'='+b[1]));
    return method + ' ' + url.origin + url.pathname + '?' + params.map(x => x[0] + '=' + x[1]).join('&');
  }
  async function packResponse(res) {
    const body = await res.clone().arrayBuffer();
    return {
      body,
      status: res.status,
      statusText: res.statusText,
      headers: Array.from(res.headers.entries())
    };
  }
  function unpack(pack) {
    return new Response(pack.body.slice(0), {
      status: pack.status,
      statusText: pack.statusText,
      headers: new Headers(pack.headers)
    });
  }

  window.fetch = async function(input, init) {
    let url = urlOf(input);
    const method = methodOf(init);
    if (!url) return nativeFetch(input, init);

    url = normalizeUrlForSubject(url, method);
    let nextInput = input;
    if (typeof input === 'string') nextInput = url.toString();
    else if (input && input.url && input.url !== url.toString()) nextInput = new Request(url.toString(), input);

    const ttl = ttlFor(url, method);
    if (!ttl) return nativeFetch(nextInput, init);

    const key = cacheKey(method, url);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < ttl) return unpack(hit.pack);

    if (pending.has(key)) return unpack(await pending.get(key));

    const job = nativeFetch(nextInput, init)
      .then(res => packResponse(res))
      .then(pack => {
        cache.set(key, { t: Date.now(), pack });
        pending.delete(key);
        return pack;
      })
      .catch(err => {
        pending.delete(key);
        throw err;
      });
    pending.set(key, job);
    return unpack(await job);
  };

  window.clearLearningHubSupabaseRuntimeCache = function(){
    cache.clear();
    pending.clear();
  };

  // Cache mềm getProfile để các interval UI không gây kiểm tra quyền quá dày.
  setTimeout(function patchProfileGetter(){
    const api = window.HODSupabase;
    if (!api || !api.getProfile || api.__cleanProfileCached) return;
    const oldGetProfile = api.getProfile.bind(api);
    let last = null, at = 0;
    api.getProfile = function(){
      const now = Date.now();
      const p = oldGetProfile();
      if (p) { last = p; at = now; return p; }
      if (last && now - at < 10000) return last;
      return p;
    };
    api.__cleanProfileCached = true;
  }, 0);
})();
// ===== END COPILOT_CLEAN_RUNTIME_GUARD_20260628 =====

// ===== COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====
// Fix: thêm ảnh trong form sửa xong không thấy hiện do reload bị cache / cột tải nhẹ thiếu images.
// Lưu xong cập nhật local ngay, không chờ reload toàn bộ môn.
(function(){
  if(window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628) return;
  window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 = true;

  function $(id){ return document.getElementById(id); }
  function db(){ return window.HODSupabase?.__client || null; }
  function user(){ return window.HODSupabase?.getUser?.() || null; }
  function profile(){ return window.HODSupabase?.getProfile?.() || null; }
  function canDirect(){
    const r = String(profile()?.role || '').toLowerCase();
    return !!user() && (r === 'admin' || r === 'editor');
  }
  function subjectCode(){ return localStorage.getItem('learninghub_subject_code_merged_v1') || ''; }
  function currentDraft(){ try { return window.editDraft || editDraft || null; } catch(e){ return window.editDraft || null; } }
  function imgUrl(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    return im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '';
  }
  function cleanImgs(list){
    return (list || []).map(im => {
      const src = imgUrl(im);
      if(!src || !/^https?:\/\//i.test(src)) return null;
      return typeof im === 'string' ? {src, url:src} : Object.assign({}, im, {src, url:src});
    }).filter(Boolean);
  }
  function collectDraft(){
    const d = currentDraft();
    if(!d) return null;
    const qEl = $('editQuestion') || document.querySelector('[data-edit-question]');
    const aEl = $('editAnswer') || document.querySelector('[data-edit-answer]');
    d.question = (qEl?.value || d.question || '').trim();
    d.answer = (aEl?.value || d.answer || '').trim().toUpperCase().replace(/[^A-Z]/g,'');
    const opts = {};
    document.querySelectorAll('[data-opt],[data-edit-opt]').forEach(inp => {
      const k = String(inp.dataset.opt || inp.dataset.editOpt || '').toUpperCase();
      const v = String(inp.value || '').trim();
      if(k && v) opts[k] = v;
    });
    if(Object.keys(opts).length) d.options = opts;
    d.answer_text = typeof answerText === 'function' ? answerText(d) : (d.answer_text || '');
    d.subject_code = d.subject_code || subjectCode();
    d.images = cleanImgs(d.images);
    return d;
  }
  async function getQuestionId(d){
    if(d.id) return d.id;
    const c = db();
    if(!c || !d.num) return null;
    const r = await c.from('questions').select('id').eq('subject_code', d.subject_code || subjectCode()).eq('num', d.num).maybeSingle();
    return r.error || !r.data ? null : r.data.id;
  }
  function updateLocal(d, id){
    const patch = Object.assign({}, d, { id, images: cleanImgs(d.images), has_image: !!(d.images && d.images.length), __imagesChecked:true, __imagesLoaded:true });
    try {
      if(Array.isArray(RAW)) {
        const i = RAW.findIndex(q => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
        if(i >= 0) RAW[i] = Object.assign({}, RAW[i], patch);
      }
      if(Array.isArray(pool)) {
        const j = pool.findIndex(q => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
        if(j >= 0) pool[j] = Object.assign({}, pool[j], patch);
      }
      const active = (pool && pool[ci]) || null;
      if(active && (String(active.id) === String(id) || Number(active.num) === Number(patch.num))) {
        Object.assign(active, patch);
      }
      if(typeof renderCard === 'function') renderCard();
      if(typeof renderQuiz === 'function') renderQuiz();
      if(typeof renderStudy === 'function') renderStudy();
    } catch(e) { console.warn('[edit image local update]', e); }
  }
  async function saveDirectNoReload(){
    if(!canDirect()) return false;
    const c = db();
    const d = collectDraft();
    if(!c || !d) return false;
    const id = await getQuestionId(d);
    if(!id) { alert('Không tìm thấy ID câu hỏi trên Supabase.'); return true; }
    const payload = {
      question: d.question,
      options: d.options || {},
      answer: d.answer,
      answer_text: d.answer_text,
      images: cleanImgs(d.images),
      has_image: !!(d.images && d.images.length),
      updated_at: new Date().toISOString()
    };
    const r = await c.from('questions').update(payload).eq('id', id);
    if(r.error) { alert('Lưu trực tiếp thất bại: ' + r.error.message); return true; }
    if (typeof window.clearLearningHubQuestionCache === 'function') {
      window.clearLearningHubQuestionCache();
    }
    d.images = payload.images;
    $('editModal')?.classList.add('hidden');
    updateLocal(Object.assign({}, d, payload), id);
    if(typeof notify === 'function') notify('Đã lưu ảnh và cập nhật câu hiện tại');
    return true;
  }

  document.addEventListener('click', async function(e){
    const btn = e.target.closest?.('#saveEdit,[data-edit-preview-save]');
    if(!btn || !btn.closest?.('#editModal')) return;
    if(!canDirect()) return;
    e.preventDefault?.();
    e.stopPropagation?.();
    e.stopImmediatePropagation?.();
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    try { await saveDirectNoReload(); }
    finally { btn.disabled = false; btn.textContent = oldText || 'Lưu trực tiếp'; }
  }, true);
})();
// ===== END COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====



// ===== APP_REALTIME_CACHE_INVALIDATE_20260629 =====
// Khi Supabase questions/subjects đổi, tự xóa cache để F5 lần sau nhận dữ liệu mới.
(function(){
  if(window.__APP_REALTIME_CACHE_INVALIDATE_20260629) return;
  window.__APP_REALTIME_CACHE_INVALIDATE_20260629 = true;

  let channel = null;
  let tries = 0;

  function getClient(){
    try{
      if(window.HODSupabase && window.HODSupabase.__client) return window.HODSupabase.__client;
      if(window.supabase && window.APP_CONFIG?.SUPABASE_URL && window.APP_CONFIG?.SUPABASE_ANON_KEY){
        if(!window.__lhCacheRealtimeClient){
          window.__lhCacheRealtimeClient = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
        }
        return window.__lhCacheRealtimeClient;
      }
    }catch(e){}
    return null;
  }
  function clear(kind){
    try{
      if(typeof window.clearLearningHubSupabaseCache === 'function') window.clearLearningHubSupabaseCache(kind);
      else if(kind === 'questions' && typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
      if(kind === 'questions' && typeof window.loadCurrentSubjectOnly === 'function'){
        window.loadCurrentSubjectOnly(true);
      }
      console.info('[LearningHub cache] cleared:', kind);
    }catch(e){}
  }
  function stop(){
    if(channel){
      try{ channel.unsubscribe(); }catch(e){}
      channel = null;
    }
  }
  function start(){
    if(document.hidden) return;
    if(channel) return;
    const c = getClient();
    if(!c){
      if(tries++ < 30) setTimeout(start, 500);
      return;
    }
    try{
      channel = c.channel('learninghub-cache-invalidate-v1')
        .on('postgres_changes', {event:'*', schema:'public', table:'questions'}, function(){ clear('questions'); })
        .on('postgres_changes', {event:'*', schema:'public', table:'subjects'}, function(){ clear('subjects'); clear('questions'); })
        .subscribe(function(status){
          if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
            channel = null;
            if(!document.hidden) setTimeout(start, 1500);
          }
        });
    }catch(e){
      channel = null;
      if(tries++ < 30 && !document.hidden) setTimeout(start, 1000);
    }
  }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden){
      stop();
    } else {
      start();
    }
  });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(start, 1200); });
  setTimeout(start, 2000);
})();
// ===== END APP_REALTIME_CACHE_INVALIDATE_20260629 =====


// ===== FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====
// Fix warning: Blocked aria-hidden because focused button stayed inside #subjectGate.
(function(){
  if(window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629) return;
  window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 = true;
  function blurInsideGate(){
    const gate = document.getElementById('subjectGate');
    const active = document.activeElement;
    if(gate && active && gate.contains(active)){
      try{ active.blur(); }catch(e){}
    }
  }
  function patchGate(){
    const gate = document.getElementById('subjectGate');
    if(!gate || gate.__ariaFocusPatch) return;
    gate.__ariaFocusPatch = true;
    const obs = new MutationObserver(() => {
      if(gate.classList.contains('hidden') || gate.getAttribute('aria-hidden') === 'true') blurInsideGate();
    });
    obs.observe(gate, {attributes:true, attributeFilter:['class','aria-hidden']});
  }
  ['click','pointerdown','mousedown','touchstart'].forEach(ev => {
    document.addEventListener(ev, e => {
      if(e.target && e.target.closest && e.target.closest('#subjectEnter,#subjectLogout,#subjectGate .close,#subjectGate [data-close]')){
        setTimeout(blurInsideGate, 0);
      }
    }, true);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchGate); else patchGate();
  setTimeout(patchGate, 500);
})();
// ===== END FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====




// ===== SUBJECT_COUNTS_ONCE_CACHE_20260629 =====
// Hiện số câu từng môn theo kiểu tiết kiệm:
// - Lần đầu trong trình duyệt mới đếm các môn chưa có cache.
// - F5/load lại dùng localStorage, không query lại.
// - Khi realtime báo questions/subjects đổi thì đánh dấu dirty, lần sau mới cập nhật lại.
(function(){
  if(window.__SUBJECT_COUNTS_ONCE_CACHE_20260629) return;
  window.__SUBJECT_COUNTS_ONCE_CACHE_20260629 = true;

  const STORE = 'learninghub_subject_counts_cache_v3';
  const DIRTY = 'learninghub_subject_counts_dirty_v3';
  const pending = new Set();

  function client(){ return window.HODSupabase?.__client || null; }
  function user(){ return window.HODSupabase?.getUser?.() || null; }
  function activeSubject(){ return localStorage.getItem('learninghub_subject_code_merged_v1') || ''; }
  function cssEscape(s){ try { return CSS.escape(String(s)); } catch(e) { return String(s).replace(/"/g,'\\"'); } }
  function read(){
    try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch(e) { return {}; }
  }
  function write(data){
    try { localStorage.setItem(STORE, JSON.stringify(data || {})); } catch(e) {}
  }
  function dirty(){ return localStorage.getItem(DIRTY) === '1'; }
  function setDirty(on=true){ try { on ? localStorage.setItem(DIRTY,'1') : localStorage.removeItem(DIRTY); } catch(e) {} }
  function ensureStore(){
    const x = read();
    x.counts = x.counts || {};
    x.confirmed = x.confirmed || {};
    x.updated_at = x.updated_at || '';
    return x;
  }
  function localCount(code){
    try{
      const active = activeSubject();
      if(active === code && Array.isArray(RAW) && RAW.length) return RAW.length;
      if(Array.isArray(RAW)){
        const n = RAW.filter(q => (q.subject_code || active) === code).length;
        return n > 0 ? n : null;
      }
    }catch(e){}
    return null;
  }
  function setCardCount(code, n){
    const count = Number(n || 0);
    document.querySelectorAll('.subjectCard[data-code="'+cssEscape(code)+'"]').forEach(card => {
      const meta = card.querySelector('.subjectMeta span:first-child');
      if(meta) meta.textContent = count + ' câu';
      card.title = (card.title || code).replace(/(?:\d+|—) câu/g, count + ' câu');
    });
  }
  function paint(){
    const store = ensureStore();
    document.querySelectorAll('.subjectCard[data-code]').forEach(card => {
      const code = card.dataset.code;
      const n = localCount(code);
      if(Number.isFinite(Number(n)) && Number(n) > 0) {
        setCardCount(code, Number(n));
        return;
      }
      if(store.confirmed[code]) setCardCount(code, Number(store.counts[code] || 0));
    });
  }
  async function countOne(code){
    const c = client();
    if(!c || !code) return null;
    const { count, error } = await c.from('questions')
      .select('id', { count:'exact', head:true })
      .eq('subject_code', code)
      .eq('is_active', true);
    if(error) { console.warn('[subject count]', code, error); return null; }
    return Number(count || 0);
  }
  async function refresh(force=false){
    if(!user()) return;
    const cards = [...document.querySelectorAll('.subjectCard[data-code]')];
    if(!cards.length) return;
    const store = ensureStore();
    const must = force || dirty();

    paint();

    const codes = cards.map(card => card.dataset.code).filter(Boolean);
    const need = codes.filter(code => {
      const n = localCount(code);
      if(Number.isFinite(Number(n)) && Number(n) > 0) return false;
      return must || !store.confirmed[code];
    });
    if(!need.length) return;

    for(const code of need){
      if(pending.has(code)) continue;
      pending.add(code);
      const n = await countOne(code);
      if(n !== null){
        store.counts[code] = n;
        store.confirmed[code] = true;
        store.updated_at = new Date().toISOString();
        write(store);
        setCardCount(code, n);
      }
      pending.delete(code);
    }
    setDirty(false);
  }

  const oldClear = window.clearLearningHubSupabaseCache;
  window.clearLearningHubSupabaseCache = function(kind){
    if(!kind || kind === 'all' || kind === 'questions' || kind === 'subjects') setDirty(true);
    return typeof oldClear === 'function' ? oldClear.apply(this, arguments) : undefined;
  };

  window.refreshSubjectCountsOnce = function(){ return refresh(true); };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(paint, 300);
    setTimeout(() => refresh(false), 1200);
    setTimeout(() => refresh(false), 2600);
  });
  document.addEventListener('click', e => {
    if(e.target.closest('#subjectRefresh')) setTimeout(() => refresh(true), 600);
    if(e.target.closest('#hodChangeSubjectBtn,#subjectTopChip')){
      setTimeout(paint, 300);
      setTimeout(() => refresh(false), 1200);
      setTimeout(() => refresh(false), 2600);
    }
  }, true);
})();
// ===== END SUBJECT_COUNTS_ONCE_CACHE_20260629 =====


// ===== ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====
// Nếu môn đang chọn đã load câu hỏi, số câu trên thẻ môn phải lấy từ RAW/pool ngay, không để cache 0 đè lên.
(function(){
  if(window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629) return;
  window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629 = true;

  const STORE = 'learninghub_subject_counts_cache_v3';
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';

  function code(){ return localStorage.getItem(SUBJECT_STORE) || ''; }
  function read(){ try{return JSON.parse(localStorage.getItem(STORE) || '{}') || {};}catch(e){return {};} }
  function write(x){ try{localStorage.setItem(STORE, JSON.stringify(x || {}));}catch(e){} }
  function cssEscape(s){ try{return CSS.escape(String(s));}catch(e){return String(s).replace(/"/g,'\\"');} }
  function loadedCount(){
    try{
      if(Array.isArray(RAW) && RAW.length) return RAW.length;
      if(Array.isArray(pool) && pool.length) return pool.length;
    }catch(e){}
    return 0;
  }
  function setCardCount(subject, n){
    if(!subject || !Number.isFinite(Number(n)) || Number(n) <= 0) return;
    const count = Number(n);
    document.querySelectorAll('.subjectCard[data-code="'+cssEscape(subject)+'"]').forEach(card => {
      const meta = card.querySelector('.subjectMeta span:first-child');
      if(meta) meta.textContent = count + ' câu';
      card.title = (card.title || subject).replace(/(?:\d+|—|0) câu/g, count + ' câu');
    });
    const store = read();
    store.counts = store.counts || {};
    store.confirmed = store.confirmed || {};
    store.counts[subject] = count;
    store.confirmed[subject] = true;
    store.updated_at = new Date().toISOString();
    write(store);
  }
  function syncActiveSubjectCount(){
    const subject = code();
    const n = loadedCount();
    if(subject && n > 0) setCardCount(subject, n);
  }

  window.syncActiveSubjectCount = syncActiveSubjectCount;

  const oldLoadCurrent = window.loadCurrentSubjectOnly;
  if(typeof oldLoadCurrent === 'function' && !oldLoadCurrent.__activeCountPatched){
    window.loadCurrentSubjectOnly = async function(){
      const out = await oldLoadCurrent.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 50);
      setTimeout(syncActiveSubjectCount, 300);
      return out;
    };
    window.loadCurrentSubjectOnly.__activeCountPatched = true;
  }

  const oldLoadBySubject = window.loadBySubject;
  if(typeof oldLoadBySubject === 'function' && !oldLoadBySubject.__activeCountPatched){
    window.loadBySubject = async function(){
      const out = await oldLoadBySubject.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 50);
      setTimeout(syncActiveSubjectCount, 300);
      return out;
    };
    window.loadBySubject.__activeCountPatched = true;
  }

  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if(oldRenderCard && !window.__renderCardActiveCountPatched){
    window.__renderCardActiveCountPatched = true;
    renderCard = function(){
      const out = oldRenderCard.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 0);
      return out;
    };
    window.renderCard = renderCard;
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(syncActiveSubjectCount, 500);
    setTimeout(syncActiveSubjectCount, 1500);
  });
  setInterval(() => {
    const gate = document.getElementById('subjectGate');
    if(gate && !gate.classList.contains('hidden')) syncActiveSubjectCount();
  }, 800);
})();
// ===== END ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====


// ===== SUBJECTS_CACHE_BUST_AFTER_ADD_20260629 =====
// Sau khi thêm môn, ép request subjects đi network 1 lần để danh sách cập nhật ngay, không bị cache cũ giữ lại.
(function(){
  if(window.__SUBJECTS_CACHE_BUST_AFTER_ADD_20260629) return;
  window.__SUBJECTS_CACHE_BUST_AFTER_ADD_20260629 = true;
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if(!nativeFetch) return;
  function methodOf(init){ return String(init && init.method ? init.method : 'GET').toUpperCase(); }
  function urlOf(input){ try { return new URL(typeof input === 'string' ? input : input.url, location.href); } catch(e){ return null; } }
  function isDirty(){
    const n = Number(localStorage.getItem('learninghub_subjects_dirty_v3') || 0);
    return n && Date.now() - n < 2 * 60 * 1000;
  }
  window.fetch = function(input, init){
    let url = urlOf(input);
    if(url && methodOf(init) === 'GET' && /\/rest\/v1\/subjects\b/.test(url.pathname) && isDirty()){
      // offset=0 là tham số hợp lệ của PostgREST, dùng để đổi cache key nhưng không đổi dữ liệu.
      if(!url.searchParams.has('offset')) url.searchParams.set('offset','0');
      if(!url.searchParams.has('limit')) url.searchParams.set('limit','1000');
      const next = typeof input === 'string' ? url.toString() : new Request(url.toString(), input);
      return nativeFetch(next, init).then(res => {
        try { localStorage.removeItem('learninghub_subjects_dirty_v3'); } catch(e) {}
        return res;
      });
    }
    return nativeFetch(input, init);
  };
})();
// ===== END SUBJECTS_CACHE_BUST_AFTER_ADD_20260629 =====






// ===== REMOVE_EYE_HIDE_OPTIONS_20260629 =====
// Xóa nút con mắt và tắt hẳn chức năng ẩn/hiện lựa chọn.
(function(){
  function apply(){
    try { localStorage.removeItem('hod102_hide_options'); } catch(e) {}
    var opt = document.getElementById('options');
    if (opt) opt.classList.remove('hide');
    var eye = document.getElementById('toggleOpts');
    if (eye) eye.remove();
    var st = document.getElementById('stToggleOpts');
    if (st) st.style.display = 'none';
    var stText = document.getElementById('stOptState');
    if (stText) stText.textContent = 'Đang hiện lựa chọn';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  setTimeout(apply, 300);
})();
// ===== END REMOVE_EYE_HIDE_OPTIONS_20260629 =====


// ===== FIX_EXAM_BOTTOM_BLANK_20260629 =====
// Sửa giao diện Kiểm tra bị trống khoảng phía dưới: cho khung kiểm tra tự giãn gần hết màn hình.
(function(){
  function injectExamBlankFix(){
    if (document.getElementById('fixExamBottomBlankStyle')) return;
    var style = document.createElement('style');
    style.id = 'fixExamBottomBlankStyle';
    style.textContent = `
      #quiz.pane.active,
      #quiz.active {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      #quizBody {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      .examOnlyGridContainer {
        min-height: calc(100dvh - var(--headH,112px) - 8px) !important;
        height: calc(100dvh - var(--headH,112px) - 8px) !important;
        align-items: stretch !important;
        margin-bottom: 0 !important;
        width: min(1728px, calc(100vw - 96px)) !important;
        max-width: none !important;
      }

      .examOnlyCard,
      .examOnlySidebar {
        height: 100% !important;
        min-height: 0 !important;
        box-sizing: border-box !important;
      }

      .examOnlyCard {
        display: flex !important;
        flex-direction: column !important;
      }

      .examOnlyContentBody {
        flex: 1 1 auto !important;
        min-height: 0 !important;
      }

      .examOnlyFooter {
        flex: 0 0 auto !important;
        margin-top: 20px !important;
      }

      .examSidebarGrid,
      .examOnlyQuestionZone,
      .examOnlyRightZone {
        min-height: 0 !important;
      }

      @media (max-width: 900px) {
        .examOnlyGridContainer {
          height: auto !important;
          min-height: 0 !important;
        }
        .examOnlyCard,
        .examOnlySidebar {
          height: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectExamBlankFix); else injectExamBlankFix();
})();
// ===== END FIX_EXAM_BOTTOM_BLANK_20260629 =====


// ===== SOFTEN_EXAM_TEXT_RUNTIME_20260629 =====
(function(){
  function injectSoftExamText(){
    if (document.getElementById('softExamTextStyle')) return;
    var style = document.createElement('style');
    style.id = 'softExamTextStyle';
    style.textContent = `
      #quiz .examOnlyCard .qq,
      #quiz .examOnlyQuestionZone .qq,
      #quiz .qq{
        color:rgba(245,240,232,.72)!important;
        font-weight:560!important;
        text-shadow:none!important;
        -webkit-text-fill-color:rgba(245,240,232,.72)!important;
      }
      #quiz .examOnlyOption .qtxt,
      #quiz .examOnlyCard .qtxt{
        color:rgba(245,240,232,.60)!important;
        font-weight:480!important;
        text-shadow:none!important;
      }
      #quiz .examOnlyOption.sel{
        background:linear-gradient(135deg,rgba(200,169,110,.105),rgba(232,212,168,.045))!important;
        border-color:rgba(232,212,168,.48)!important;
        box-shadow:0 0 14px rgba(232,212,168,.055), inset 0 1px 1px rgba(255,255,255,.06)!important;
      }
      #quiz .examOnlyOption.sel .qtxt{
        color:rgba(245,240,232,.78)!important;
        font-weight:540!important;
      }
      #quiz .examOnlyOption.sel .qkey{
        color:#14100b!important;
        background:linear-gradient(135deg,rgba(232,212,168,.86),rgba(200,169,110,.82))!important;
        box-shadow:0 2px 8px rgba(232,212,168,.18)!important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectSoftExamText); else injectSoftExamText();
})();
// ===== END SOFTEN_EXAM_TEXT_RUNTIME_20260629 =====


// ===== FIX_EXAM_UX_BALANCE_RUNTIME_20260629 =====
(function(){
  function injectExamUxBalance(){
    if (document.getElementById('examUxBalanceStyle')) return;
    var style = document.createElement('style');
    style.id = 'examUxBalanceStyle';
    style.textContent = `
      @media (min-width:901px){
        #quiz .examOnlyContentBody{
          grid-template-columns:minmax(0,.98fr) minmax(430px,1.02fr)!important;
          gap:18px!important;
          align-items:start!important;
        }
        #quiz .examOnlyQuestionZone{padding-right:8px!important;}
        #quiz .examOnlyRightZone{padding-left:0!important;}
        #quiz .examOnlyOptions{padding:8px 10px 18px 8px!important;gap:11px!important;}
      }
      #quiz .examOnlyCard .qq,
      #quiz .examOnlyQuestionZone .qq,
      #quiz .qq{
        color:rgba(245,240,232,.78)!important;
        -webkit-text-fill-color:rgba(245,240,232,.78)!important;
        font-size:clamp(1.14rem,1.24vw,1.42rem)!important;
        font-weight:620!important;
        line-height:1.46!important;
      }
      #quiz .examOnlyOption.sel{
        background:linear-gradient(135deg,rgba(200,169,110,.075),rgba(232,212,168,.032))!important;
        border-color:rgba(232,212,168,.42)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
      }
      #quiz .examOnlyOption.sel .qtxt{
        color:rgba(245,240,232,.76)!important;
        font-weight:520!important;
      }
      #quiz .examOnlyOption.sel .qkey{
        background:linear-gradient(135deg,rgba(232,212,168,.80),rgba(200,169,110,.76))!important;
        box-shadow:0 1px 6px rgba(232,212,168,.12)!important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectExamUxBalance); else injectExamUxBalance();
})();
// ===== END FIX_EXAM_UX_BALANCE_RUNTIME_20260629 =====


// ===== FIX_EXAM_CENTER_LAYOUT_RUNTIME_20260629 =====
(function(){
  function injectExamCenterLayout(){
    if (document.getElementById('examCenterLayoutStyle')) return;
    var style = document.createElement('style');
    style.id = 'examCenterLayoutStyle';
    style.textContent = `
      @media (min-width:901px){
        #quiz.pane.scroll.active,
        #quiz.pane.active,
        #quiz.scroll{
          padding-left:0!important;
          padding-right:0!important;
          align-items:center!important;
        }
        #quizBody{
          width:min(1660px,calc(100vw - 160px))!important;
          max-width:1660px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          transform:none!important;
        }
        #quiz .examOnlyGridContainer{
          width:100%!important;
          max-width:1660px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          grid-template-columns:minmax(0,1fr) 370px!important;
          gap:28px!important;
        }
        #quiz .examOnlyCard{max-width:none!important;}
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectExamCenterLayout); else injectExamCenterLayout();
})();
// ===== END FIX_EXAM_CENTER_LAYOUT_RUNTIME_20260629 =====


// ===== FIX_EXAM_SHIFT_RIGHT_SMALLER_Q_RUNTIME_20260629 =====
(function(){
  function injectExamShiftRightSmallerQ(){
    if (document.getElementById('examShiftRightSmallerQStyle')) return;
    var style = document.createElement('style');
    style.id = 'examShiftRightSmallerQStyle';
    style.textContent = `
      @media (min-width:901px){
        #quizBody{
          width:min(1580px,calc(100vw - 220px))!important;
          max-width:1580px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          transform:translateX(34px)!important;
        }
        #quiz .examOnlyGridContainer{
          width:100%!important;
          max-width:1580px!important;
          grid-template-columns:minmax(0,1fr) 360px!important;
          gap:26px!important;
          margin-left:auto!important;
          margin-right:auto!important;
        }
      }
      #quiz .examOnlyCard .qq,
      #quiz .examOnlyQuestionZone .qq,
      #quiz .qq{
        font-size:clamp(1.00rem,1.04vw,1.18rem)!important;
        line-height:1.42!important;
        font-weight:580!important;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectExamShiftRightSmallerQ); else injectExamShiftRightSmallerQ();
})();
// ===== END FIX_EXAM_SHIFT_RIGHT_SMALLER_Q_RUNTIME_20260629 =====


// ===== CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====
// Phiên đăng nhập mới: xóa toàn bộ dữ liệu nháp ở phần Thêm môn để người dùng điền lại từ đầu.
(function(){
  const KEYS = [
    'learninghub_add_subject_code_v1',
    'learninghub_add_subject_name_v1',
    'learninghub_add_subject_desc_v1',
    'learninghub_add_subject_step_v1',
    'learninghub_add_subject_file_name_v1',
    'learninghub_add_subject_file_size_v1',
    'learninghub_add_subject_file_data_v1',
    'learninghub_add_subject_file_previewed_v1'
  ];
  const SESSION_KEY = 'learninghub_add_subject_draft_cleared_for_user_v1';

  function clearAddSubjectDraft(){
    try { KEYS.forEach(k => localStorage.removeItem(k)); } catch(e) {}
    try { localStorage.setItem('learninghub_subject_gate_tab_v1', 'list'); } catch(e) {}

    const ids = [
      'addSubjectCode','addSubjectName','addSubjectDesc','userImportData','userImportFile'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const card = document.getElementById('userImportFileCard');
    const dz = document.getElementById('importDropZone');
    const pv = document.getElementById('previewImportBtn');
    const preview = document.getElementById('userImportPreview');
    if (card) card.classList.add('hidden');
    if (dz) dz.classList.remove('hidden');
    if (pv) { pv.classList.add('hidden'); pv.disabled = true; }
    if (preview) preview.innerHTML = '';
  }

  function currentUserId(){
    try { return window.HODSupabase?.getUser?.()?.id || ''; } catch(e) { return ''; }
  }

  function clearOnceForCurrentLogin(){
    const uid = currentUserId();
    if (!uid) return;
    let cleared = '';
    try { cleared = sessionStorage.getItem(SESSION_KEY) || ''; } catch(e) {}
    if (cleared === uid) return;
    clearAddSubjectDraft();
    try { sessionStorage.setItem(SESSION_KEY, uid); } catch(e) {}
  }

  function patchAuthMethods(){
    const api = window.HODSupabase;
    if (!api || api.__clearAddSubjectDraftPatched) return;

    if (typeof api.signInGoogle === 'function') {
      const oldGoogle = api.signInGoogle.bind(api);
      api.signInGoogle = async function(){
        clearAddSubjectDraft();
        try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
        return oldGoogle.apply(this, arguments);
      };
    }

    if (typeof api.signOut === 'function') {
      const oldSignOut = api.signOut.bind(api);
      api.signOut = async function(){
        clearAddSubjectDraft();
        try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
        return oldSignOut.apply(this, arguments);
      };
    }

    api.__clearAddSubjectDraftPatched = true;
  }

  function tick(){
    patchAuthMethods();
    clearOnceForCurrentLogin();
  }

  window.__clearAddSubjectDraft = clearAddSubjectDraft;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setTimeout(tick, 500);
  setTimeout(tick, 1600);
  setInterval(tick, 2500);
})();
// ===== END CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====


// ===== COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 =====
// Giữ thuộc tính câu hỏi sau khi import môn rồi mở Thư viện/Kiểm tra câu hỏi.
(function () {
  if (window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629) return;
  window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 = true;
  function normalizeQuestionAttrs(q) {
    if (!q || typeof q !== 'object') return q;
    const imgs = Array.isArray(q.images) ? q.images : [];
    q.has_image = !!(q.has_image || imgs.length);
    q.error_risk = q.error_risk || 'low';
    q.error_risk_reason = q.error_risk_reason || '';
    return q;
  }
  window.__LHNormalizeQuestionAttrs = normalizeQuestionAttrs;
  function normalizeAll() {
    try { if (Array.isArray(RAW)) RAW.forEach(normalizeQuestionAttrs); } catch (e) { }
    try { if (Array.isArray(pool)) pool.forEach(normalizeQuestionAttrs); } catch (e) { }
    try { if (Array.isArray(qSet)) qSet.forEach(normalizeQuestionAttrs); } catch (e) { }
  }
  const oldRenderStudy = typeof renderStudy === 'function' ? renderStudy : null;
  if (oldRenderStudy && !oldRenderStudy.__keepAttrs) {
    renderStudy = function () { normalizeAll(); return oldRenderStudy.apply(this, arguments); };
    renderStudy.__keepAttrs = true;
  }
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__keepAttrs) {
    renderCard = function () { normalizeAll(); return oldRenderCard.apply(this, arguments); };
    renderCard.__keepAttrs = true;
  }
  normalizeAll();
})();
// ===== END COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 =====




// ===== EDIT_RENDER_NULL_GUARD_20260629 =====
(function () {
  function $(id) { return document.getElementById(id); }
  function safeSrc(im) { return im && typeof im === 'object' ? (im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '') : (im || ''); }
  function safeEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function ensureEditImgsBox() {
    let box = $('editImgs');
    if (box) return box;
    const input = $('imgUpload');
    if (!input) return null;
    box = document.createElement('div');
    box.id = 'editImgs';
    box.className = 'editImgs';
    input.insertAdjacentElement('afterend', box);
    return box;
  }
  window.renderEditImages = renderEditImages = function () {
    const box = ensureEditImgsBox();
    if (!box) return;
    const imgs = (typeof editDraft !== 'undefined' && editDraft && Array.isArray(editDraft.images)) ? editDraft.images : [];
    box.innerHTML = imgs.length ? imgs.map((im, i) => {
      const src = safeSrc(im);
      return `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${safeEsc(src)}"><input class="imgUrlBox" value="${safeEsc(src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`;
    }).join('') : '<p style="color:var(--mist)">Chưa có hình.</p>';
  };
})();
// ===== END EDIT_RENDER_NULL_GUARD_20260629 =====


// ===== EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
// Đúng UI trong form "Sửa câu hỏi": vùng "Ảnh của câu hỏi" / nút "+ Thêm ảnh" dùng input #editPreviewImgInput.
// Ctrl+V hoặc kéo thả ảnh sẽ đưa file vào input này, để handler upload Cloudinary có sẵn xử lý và redraw đúng khung ảnh.
(function () {
  function $(id) { return document.getElementById(id); }
  function msg(t) { if (typeof notify === 'function') notify(t); else console.log(t); }
  function imageFilesFromClipboard(e) {
    return [...(e.clipboardData?.items || [])]
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }
  function imageFilesFromDrop(e) {
    return [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
  }
  function setInputFilesAndUpload(files, source) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    if (!files.length) return false;
    const input = $('editPreviewImgInput') || $('imgUpload');
    if (!input) {
      alert('Chưa thấy ô thêm ảnh. Đóng/mở lại form sửa rồi thử lại.');
      return true;
    }
    try {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      msg(source === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh...');
    } catch (err) {
      alert('Trình duyệt không hỗ trợ dán ảnh kiểu này. Hãy bấm + Thêm ảnh để chọn file.');
    }
    return true;
  }
  function ensureEditPasteHint() {
    const modal = $('editModal');
    if (!modal || modal.classList.contains('hidden')) return;
    const imagesBox = modal.querySelector('.v7Images');
    if (!imagesBox || imagesBox.querySelector('.editPasteImageHint')) return;
    const head = imagesBox.querySelector('.v7ImagesHead') || imagesBox.firstElementChild;
    const hint = document.createElement('div');
    hint.className = 'pasteImageHint editPasteImageHint';
    hint.textContent = 'Có thể chụp/copy ảnh rồi bấm Ctrl + V tại khung này để tự upload URL.';
    if (head) head.insertAdjacentElement('afterend', hint);
    else imagesBox.prepend(hint);
  }
  function bindEditPreviewPasteUpload() {
    const modal = $('editModal');
    if (!modal) return;
    ensureEditPasteHint();
    if (modal.__editPreviewPasteUploadBound) return;
    modal.__editPreviewPasteUploadBound = true;
    modal.addEventListener('paste', e => {
      const files = imageFilesFromClipboard(e);
      if (!files.length) return;
      e.preventDefault();
      setInputFilesAndUpload(files, 'paste');
    }, true);
    modal.addEventListener('dragover', e => {
      const hasFile = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
      if (!hasFile) return;
      e.preventDefault();
      modal.classList.add('dragImageOver');
      ensureEditPasteHint();
    }, true);
    modal.addEventListener('dragleave', () => modal.classList.remove('dragImageOver'), true);
    modal.addEventListener('drop', e => {
      const files = imageFilesFromDrop(e);
      if (!files.length) return;
      e.preventDefault();
      modal.classList.remove('dragImageOver');
      setInputFilesAndUpload(files, 'drop');
    }, true);
  }
  function boot() { bindEditPreviewPasteUpload(); ensureEditPasteHint(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 300);
  setInterval(boot, 700);
})();
// ===== END EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====


// ===== IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
// Cho khung "Kiểm tra câu hỏi" Ctrl+V/kéo thả ảnh giống form sửa/thêm câu.
(function () {
  function msg(t) { if (typeof notify === 'function') notify(t); else console.log(t); }
  function modal() { return document.getElementById('importPreviewModal'); }
  function isOpen() { const m = modal(); return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none'; }
  function filesFromPaste(e) {
    return [...(e.clipboardData?.items || [])]
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }
  function filesFromDrop(e) { return [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/')); }
  function activeCard() {
    const m = modal(); if (!m) return null;
    return document.activeElement?.closest?.('[data-v7-card],[data-imgui-card]') ||
      m.querySelector('[data-v7-card]:has([data-v7-input]),[data-imgui-card]:has([data-imgui-input])');
  }
  function activeInput() {
    const c = activeCard();
    const inp = c?.querySelector?.('[data-v7-input],[data-imgui-input]');
    if (inp) return inp;
    return modal()?.querySelector?.('[data-v7-input],[data-imgui-input]') || null;
  }
  function ensureHints() {
    const m = modal(); if (!m || !isOpen()) return;
    m.querySelectorAll('.v7Images,.simpleEditImages').forEach(box => {
      if (box.querySelector('.importPasteImageHint')) return;
      const head = box.querySelector('.v7ImagesHead,.simpleEditImagesHead') || box.firstElementChild;
      const hint = document.createElement('div');
      hint.className = 'pasteImageHint importPasteImageHint';
      hint.textContent = 'Có thể chụp/copy ảnh rồi bấm Ctrl + V tại khung này để tự upload URL.';
      if (head) head.insertAdjacentElement('afterend', hint); else box.prepend(hint);
    });
  }
  function uploadByInput(files, source) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    if (!files.length || !isOpen()) return false;
    const input = activeInput();
    if (!input) { alert('Bấm Sửa ở câu cần thêm ảnh trước, rồi dán ảnh lại nha.'); return true; }
    try {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      msg(source === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh...');
    } catch (err) {
      alert('Trình duyệt không hỗ trợ dán ảnh kiểu này. Hãy bấm + Thêm ảnh để chọn file.');
    }
    return true;
  }
  function bind() {
    const m = modal(); if (!m) return;
    ensureHints();
    if (m.__importPreviewPasteBound) return;
    m.__importPreviewPasteBound = true;
    m.addEventListener('paste', e => { const files = filesFromPaste(e); if (!files.length) return; e.preventDefault(); uploadByInput(files, 'paste'); }, true);
    m.addEventListener('dragover', e => { const has = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file'); if (!has) return; e.preventDefault(); m.classList.add('dragImageOver'); ensureHints(); }, true);
    m.addEventListener('dragleave', () => m.classList.remove('dragImageOver'), true);
    m.addEventListener('drop', e => { const files = filesFromDrop(e); if (!files.length) return; e.preventDefault(); m.classList.remove('dragImageOver'); uploadByInput(files, 'drop'); }, true);
  }
  function boot() { bind(); ensureHints(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('click', () => setTimeout(boot, 0), true);
  setInterval(boot, 700);
})();
// ===== END IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
