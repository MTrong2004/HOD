const CONFIG = {
  SUPABASE_URL: 'https://bdbkpqnhavyoalgkvqtw.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB'
};

let client, user, profile, activeStatus = 'all';
let cache = { profiles: [], questions: [], requests: [], history: [], logs: [] };

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function safe(o) {
  try { return JSON.stringify(o, null, 2); } catch (e) { return String(o); }
}

function isBlocked(p) {
  return !!(p?.blocked || p?.is_blocked || p?.status === 'blocked');
}

function isAdmin() {
  return profile?.role === 'admin' && !isBlocked(profile);
}

function isEditor() {
  return ['admin', 'editor'].includes(profile?.role) && !isBlocked(profile);
}

function date(d) {
  if (!d) return 'Chưa có';
  try { return new Date(d).toLocaleString('vi-VN'); } catch (e) { return d; }
}

function lastLogin(p) {
  return p?.last_login || p?.updated_at || p?.created_at || '';
}

function toast(t) {
  $('toast').textContent = t;
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 1800);
}

function err(t) {
  $('errorBox').textContent = typeof t === 'string' ? t.replace(/<[^>]*>/g, '') : String(t);
  $('errorBox').classList.remove('hidden');
}

function clearErr() {
  $('errorBox').classList.add('hidden');
}

function setBusy(on, label = 'Đang tải...') {
  document.body.classList.toggle('is-busy', !!on);
  $('refreshBtn').disabled = !!on;
  $('refreshBtn').textContent = on ? label : 'Tải lại';
}

async function init() {
  if (!window.supabase) return alert('Không tải được Supabase');
  client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  bind();

  const s = await client.auth.getSession();
  user = s.data.session?.user;
  if (!user) return show('login');

  await loadProfile();
  if (!isEditor()) return show('deny');

  show('app');
  await loadAll();
}

function bind() {
  $('googleBtn').onclick = () => client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href.split('#')[0] }
  }).catch(e => { console.warn('OAuth error:', e); alert('Đăng nhập thất bại: ' + (e.message || e)); });
  $('logoutBtn').onclick = logout;
  $('denyLogout').onclick = logout;
  $('openStudy').onclick = () => open('index.html', '_blank');
  $('refreshBtn').onclick = loadAll;
  $('exportBtn').onclick = exportAll;
  $('search').oninput = function(){ render(); if(typeof renderApprovals === 'function' && document.getElementById('approvals')?.classList.contains('active')) renderApprovals(); };
  $('closeModal').onclick = closeModal;
  $('modal').addEventListener('mousedown', e => { if (e.target === $('modal')) closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.nav').forEach(b => {
    b.onclick = () => setPage(b.dataset.page, b.textContent.trim());
  });
  document.querySelectorAll('.filter').forEach(b => {
    b.onclick = () => {
      activeStatus = b.dataset.status;
      document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x === b));
      render();
    };
  });
}

async function logout() {
  await client.auth.signOut();
  show('login');
}

function show(x) {
  $('loginBox').classList.toggle('hidden', x !== 'login');
  $('denyBox').classList.toggle('hidden', x !== 'deny');
  $('appBox').classList.toggle('hidden', x !== 'app');
}

function setPage(id, n) {
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x.dataset.page === id));
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === id));
  $('crumb').textContent = n;
  $('title').textContent = n;
  render();
}

async function loadProfile() {
  const r = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
  profile = r.data || { id: user.id, email: user.email, role: 'user' };
  $('adminChip').textContent = `${profile.email || user.email} · ${profile.role}`;
  document.body.classList.toggle('role-admin', isAdmin());
}

async function safeLoad(name, promise, silent = false) {
  const r = await promise;
  if (r.error) {
    if (!silent) err('Lỗi bảng ' + name + ': ' + (r.error.message || 'Unknown error'));
    return [];
  }
  return r.data || [];
}

async function loadAll() {
  clearErr();
  setBusy(true);
  try {
    cache.profiles = await safeLoad('profiles', client.from('profiles').select('*').order('created_at', { ascending: false }));
    cache.questions = await safeLoad('questions', client.from('questions').select('*').order('num', { ascending: true }));
    cache.requests = await safeLoad('edit_requests', client.from('edit_requests').select('*').order('created_at', { ascending: false }));
    cache.history = await safeLoad('question_history', client.from('question_history').select('*').order('created_at', { ascending: false }).limit(500));
    cache.logs = isAdmin()
      ? await safeLoad('admin_logs', client.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(500))
      : [];
    render();
    if(typeof loadSubjectRequests === 'function') loadSubjectRequests();
    toast('Đã tải');
  } finally {
    setBusy(false);
  }
}

async function logAction(a, t, id, d) {
  if (!isAdmin() || !user) return;
  try {
    await client.from('admin_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action: a,
      target_type: t,
      target_id: String(id || ''),
      details: d || {}
    });
  } catch (e) { console.warn('logAction failed:', e); }
}

function key() {
  return ($('search').value || '').trim().toLowerCase();
}

function match(t) {
  return !key() || String(t || '').toLowerCase().includes(key());
}

function badge(s) {
  return `<span class="badge ${esc(s)}">${esc(s || 'unknown')}</span>`;
}

function questionLabel(r) {
  return r.question_num || r.question_id || r.num || r.id || '?';
}

function getQuestionByReq(r) {
  return cache.questions.find(q => q.id === r.question_id || q.num === r.question_num);
}

function changedFields(r) {
  const oldData = r.old_data || getQuestionByReq(r) || {};
  const newData = r.new_data || {};
  return ['question', 'answer', 'answer_text', 'options', 'images'].filter(k => safe(oldData[k]) !== safe(newData[k]));
}

function render() {
  renderStats();
  renderRequests();
  renderUsers();
  renderHistory();
  renderLogs();
  renderQuestions();
}

function renderStats() {
  const pending = cache.requests.filter(x => x.status === 'pending');
  $('statUsers').textContent = cache.profiles.length;
  $('statEditors').textContent = cache.profiles.filter(x => x.role === 'editor').length;
  $('statPending').textContent = pending.length;
  $('statBlocked').textContent = cache.profiles.filter(isBlocked).length;
  const pendingApproval = cache.profiles.filter(p => p.approved === false).length;
  const elPA = $('statPendingApproval');
  if(elPA) elPA.textContent = pendingApproval;
  $('recentRequests').innerHTML = pending.slice(0, 5).map(reqHTML).join('') || '<p class=muted>Không có.</p>';
  $('recentLogs').innerHTML = isAdmin()
    ? (cache.logs.slice(0, 7).map(logHTML).join('') || '<p class=muted>Chưa có.</p>')
    : '<p class=muted>Chỉ admin xem được logs.</p>';
}

function reqHTML(r) {
  const fields = changedFields(r);
  const userText = r.user_email || r.email || r.user_id || 'Không rõ user';
  return `<div class="item reqItem ${esc(r.status || '')}">
    <div class="head">
      <div>
        <b>Câu ${esc(questionLabel(r))}</b>
        <p class="muted">${esc(date(r.created_at))} · ${esc(userText)}</p>
      </div>
      ${badge(r.status)}
    </div>
    <div class="changeChips">${fields.map(f => `<span>${esc(labelField(f))}</span>`).join('') || '<span>Chưa rõ thay đổi</span>'}</div>
    <div class="actions">
      <button class="act" onclick="viewReq(${r.id})">So sánh</button>
      ${r.status === 'pending' ? `<button class="act ok" onclick="approve(${r.id})">Duyệt</button><button class="act bad" onclick="rejectReq(${r.id})">Từ chối</button>` : ''}
    </div>
  </div>`;
}

function labelField(f) {
  return { question: 'Câu hỏi', answer: 'Đáp án', answer_text: 'Giải thích', options: 'Lựa chọn', images: 'Ảnh' }[f] || f;
}

function renderRequests() {
  const arr = cache.requests.filter(r => (activeStatus === 'all' || r.status === activeStatus) && match(safe(r)));
  $('requestList').innerHTML = arr.map(reqHTML).join('') || '<p class=muted>Không có.</p>';
}

function renderUsers() {
  const arr = cache.profiles.filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id}`));
  $('userList').innerHTML = '<div class="userRow muted tableHead"><b>Email</b><b>Role</b><b>TT</b><b>Login</b><b>Hành động</b></div>' + arr.map(p => {
    const acts = isAdmin()
      ? `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>
        <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)})">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
        <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}')">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
        <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}')">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>`
      : `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>`;
    return `<div class=userRow>
      <div><div class=mail>${esc(p.email || p.id)}</div><div class=uid>${esc(p.id)}</div></div>
      <div>${badge(p.role || 'user')}</div>
      <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
      <div>${esc(date(lastLogin(p)))}</div>
      <div class=actions>${acts}</div>
    </div>`;
  }).join('');
}

function renderHistory() {
  $('historyList').innerHTML = cache.history.filter(h => match(safe(h))).map(h => `<div class=item>
    <div class=head><b>Câu ${esc(h.question_id)}</b><span class=muted>${esc(date(h.created_at))}</span></div>
    <div class=actions><button class=act onclick="viewHistory(${h.id || 0})">Trước/sau</button></div>
  </div>`).join('') || '<p class=muted>Chưa có.</p>';
}

function logHTML(l) {
  return `<div class=item><div class=head><b>${esc(l.action)}</b><span class=muted>${esc(date(l.created_at))}</span></div><p class=muted>${esc(l.admin_email || '')} · ${esc(l.target_type || '')} ${esc(l.target_id || '')}</p></div>`;
}

function renderLogs() {
  $('logList').innerHTML = isAdmin()
    ? (cache.logs.filter(l => match(safe(l))).map(logHTML).join('') || '<p class=muted>Chưa có.</p>')
    : '<p class=muted>Editor không có quyền xem admin logs.</p>';
}

function renderQuestions() {
  $('questionList').innerHTML = cache.questions.filter(q => match(`${q.num || ''} ${q.question || ''} ${q.answer || ''}`)).slice(0, 100).map(q => `<div class=item>
    <div class=head><b>Câu ${esc(q.num || q.id)}</b>${q.is_active === false ? badge('hidden') : badge('active')}</div>
    <p>${esc(q.question)}</p>
    <p class=muted>Đáp án: ${esc(q.answer)}</p>
    <div class=actions><button class=act onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active === false})">${q.is_active === false ? 'Hiện' : 'Ẩn'}</button></div>
  </div>`).join('') || '<p class=muted>Không có.</p>';
}

function openModal(t, b) {
  $('modalTitle').textContent = t;
  $('modalBody').innerHTML = b;
  $('modal').classList.remove('hidden');
}

function closeModal() {
  $('modal').classList.add('hidden');
}

function formatValue(v) {
  if (Array.isArray(v)) return v.length ? `${v.length} ảnh` : 'Không có';
  if (typeof v === 'object' && v) return Object.entries(v).map(([k, val]) => `${k}. ${val}`).join('\n');
  return String(v ?? '');
}

function compareHTML(oldData, newData) {
  const fields = ['question', 'options', 'answer', 'answer_text', 'images'];
  return `<div class="diffList">${fields.map(f => {
    const before = formatValue(oldData?.[f]);
    const after = formatValue(newData?.[f]);
    const changed = before !== after;
    return `<section class="diffBlock ${changed ? 'changed' : ''}">
      <h3>${esc(labelField(f))}${changed ? '<span>Đã đổi</span>' : '<span>Không đổi</span>'}</h3>
      <div class=compare>
        <pre><b>Trước</b>\n${esc(before)}</pre>
        <pre><b>Sau</b>\n${esc(after)}</pre>
      </div>
    </section>`;
  }).join('')}</div>`;
}

function viewReq(id) {
  const r = cache.requests.find(x => x.id === id);
  if (!r) return;
  const oldData = r.old_data || getQuestionByReq(r) || {};
  openModal(`Yêu cầu sửa câu ${questionLabel(r)}`, compareHTML(oldData, r.new_data || {}));
}

function viewHistory(id) {
  const h = cache.history.find(x => (x.id || 0) === id) || cache.history[0];
  if (h) openModal('Lịch sử', compareHTML(h.previous_data || {}, h.new_data || {}));
}

function viewQuestion(id) {
  const q = cache.questions.find(x => x.id === id);
  if (q) openModal(`Câu ${q.num || q.id}`, `<pre class=raw>${esc(safe(q))}</pre>`);
}

function viewUserEdits(uid) {
  const req = cache.requests.filter(r => r.user_id === uid);
  const his = cache.history.filter(h => h.changed_by === uid);
  openModal('Lịch sử sửa user', (req.map(reqHTML).join('') || '<p class=muted>Chưa có yêu cầu.</p>') + '<h3>Đã duyệt</h3>' + (his.map(h => `<div class=item>Câu ${esc(h.question_id)} - ${esc(date(h.created_at))}</div>`).join('') || '<p class=muted>Chưa có.</p>'));
}

async function approve(id) {
  const r = cache.requests.find(x => x.id === id);
  if (!r || r.status !== 'pending') return;
  if (!user) return alert('Chưa đăng nhập.');
  if (!confirm(`Duyệt thay đổi cho câu ${questionLabel(r)}?`)) return;

  const q = r.new_data || {};
  setBusy(true, 'Đang duyệt...');
  try {
    const u = await client.from('questions').update({
      question: q.question,
      options: q.options || {},
      answer: q.answer,
      answer_text: q.answer_text,
      images: q.images || []
    }).eq('id', r.question_id);
    if (u.error) return alert(u.error.message);

    const reqUpdate = await client.from('edit_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    }).eq('id', id);
    if (reqUpdate.error) console.warn('Không cập nhật được request:', reqUpdate.error);

    const histInsert = await client.from('question_history').insert({
      question_id: r.question_id,
      request_id: r.id,
      previous_data: r.old_data,
      new_data: r.new_data,
      changed_by: r.user_id,
      approved_by: user.id
    });
    if (histInsert.error) console.warn('Không lưu được lịch sử:', histInsert.error);

    await logAction('approve_request', 'edit_requests', id, {});
    await loadAll();
  } finally {
    setBusy(false);
  }
}

async function rejectReq(id) {
  const r = cache.requests.find(x => x.id === id);
  if (!r || r.status !== 'pending') return;
  if (!user) return alert('Chưa đăng nhập.');
  const note = prompt('Lý do từ chối:');
  if (note === null) return;

  setBusy(true, 'Đang từ chối...');
  try {
    const res = await client.from('edit_requests').update({
      status: 'rejected',
      admin_note: note || '',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    }).eq('id', id);
    if (res.error) return alert(res.error.message);
    await logAction('reject_request', 'edit_requests', id, { note });
    await loadAll();
  } finally {
    setBusy(false);
  }
}

async function toggleBlock(id, b) {
  if (!isAdmin()) return alert('Chỉ admin được block.');
  if (user && id === user.id && b) return alert('Không nên tự khóa tài khoản đang dùng.');
  if (!confirm(`${b ? 'Block' : 'Unblock'} user này?`)) return;
  const r = await client.from('profiles').update({ blocked: b }).eq('id', id);
  if (r.error) return alert(r.error.message);
  await logAction(b ? 'block_user' : 'unblock_user', 'profiles', id, {});
  loadAll();
}

async function setRole(id, role) {
  if (!isAdmin()) return alert('Chỉ admin được cấp/gỡ quyền.');
  if (user && id === user.id && role !== 'admin') return alert('Không nên tự gỡ quyền admin của tài khoản đang dùng.');
  if (!confirm(`Đổi vai trò thành ${role}?`)) return;
  const r = await client.from('profiles').update({ role }).eq('id', id);
  if (r.error) return alert(r.error.message);
  await logAction('change_role', 'profiles', id, { role });
  loadAll();
}

async function toggleQuestion(id, a) {
  if (!confirm(`${a ? 'Hiện' : 'Ẩn'} câu hỏi này?`)) return;
  const r = await client.from('questions').update({ is_active: a }).eq('id', id);
  if (r.error) return alert(r.error.message);
  await logAction(a ? 'show_question' : 'hide_question', 'questions', id, {});
  loadAll();
}

function exportAll() {
  const blob = new Blob([JSON.stringify(cache, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hod102_admin_backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
  logAction('export_data', 'backup', 'json', {});
}

Object.assign(window, { approve, rejectReq, toggleBlock, setRole, toggleQuestion, viewReq, viewHistory, viewQuestion, viewUserEdits });
document.addEventListener('DOMContentLoaded', init);


// ===== FINAL_ADMIN_DIRECT_EDIT_PATCH_20260613 =====
(function(){const $=id=>document.getElementById(id);const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function optVal(q,k){return(q.options&&q.options[k])?q.options[k]:''}window.editQuestionDirect=function(id){if(!isEditor())return alert('Admin hoặc Editor mới được sửa.');const q=cache.questions.find(x=>x.id===id);if(!q)return alert('Không tìm thấy câu hỏi.');openModal('Sửa trực tiếp câu '+(q.num||q.id),`<div class="field"><label>Câu hỏi</label><textarea id="dqQuestion" style="width:100%;min-height:110px">${esc2(q.question)}</textarea></div><div class="compare" style="grid-template-columns:1fr 1fr">${['A','B','C','D','E'].map(k=>`<div class="field"><label>Đáp án ${k}</label><textarea data-dq-opt="${k}" style="width:100%;min-height:70px">${esc2(optVal(q,k))}</textarea></div>`).join('')}</div><div class="field"><label>Đáp án đúng</label><input id="dqAnswer" value="${esc2(q.answer)}" style="width:100%"></div><div class="field"><label>Giải thích</label><textarea id="dqAnswerText" style="width:100%;min-height:90px">${esc2(q.answer_text||'')}</textarea></div><div class="actions"><button class="act ok" onclick="saveQuestionDirect(${q.id})">Lưu trực tiếp</button></div>`)};window.saveQuestionDirect=async function(id){if(!isEditor())return alert('Admin hoặc Editor mới được sửa.');const q=cache.questions.find(x=>x.id===id);if(!q)return alert('Không tìm thấy câu hỏi.');const ops={};document.querySelectorAll('[data-dq-opt]').forEach(t=>{if((t.value||'').trim())ops[t.dataset.dqOpt]=t.value.trim()});const payload={question:$('dqQuestion').value.trim(),options:ops,answer:$('dqAnswer').value.trim().toUpperCase(),answer_text:$('dqAnswerText').value.trim(),updated_at:new Date().toISOString()};setBusy(true,'Đang lưu...');try{const res=await client.from('questions').update(payload).eq('id',id);if(res.error)return alert(res.error.message);try{await client.from('question_history').insert({question_id:id,request_id:null,previous_data:{question:q.question,options:q.options||{},answer:q.answer,answer_text:q.answer_text,images:q.images||[]},new_data:{...payload,images:q.images||[]},changed_by:user.id,approved_by:user.id})}catch(e){}await logAction('direct_edit_question','questions',id,{});closeModal();await loadAll();toast('Đã sửa trực tiếp')}finally{setBusy(false)}};const oldRQ=renderQuestions;renderQuestions=function(){const arr=cache.questions.filter(q=>match(`${q.num||''} ${q.question||''} ${q.answer||''}`)).slice(0,100);$('questionList').innerHTML=arr.map(q=>`<div class=item><div class=head><b>Câu ${esc(q.num||q.id)}</b>${q.is_active===false?badge('hidden'):badge('active')}</div><p>${esc(q.question)}</p><p class=muted>Đáp án: ${esc(q.answer)}</p><div class=actions><button class=act onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button></div></div>`).join('')||'<p class=muted>Không có.</p>'};window.renderQuestions=renderQuestions})();


// ===== FINAL_ADMIN_REPORT_HISTORY_DISPLAY_FIX_20260613 =====
// Fix tab Lịch sử/Yêu cầu: hiện đúng số câu, thông tin người gửi và nội dung thay đổi rõ hơn.
(function(){
  function findQuestionById(id){
    return (cache.questions || []).find(q => String(q.id) === String(id)) || null;
  }
  function displayQuestionNo(row){
    const q = findQuestionById(row.question_id);
    return row.question_num || row.num || q?.num || row.question_id || '?';
  }
  function userOf(row){
    return row.user_email || row.email || row.admin_email || row.changed_by || row.user_id || 'Không rõ người gửi';
  }
  function changedListFromData(oldData, newData){
    const fields = ['question','options','answer','answer_text','images'];
    return fields.filter(k => safe(oldData?.[k]) !== safe(newData?.[k]));
  }
  function historyFields(h){
    return changedListFromData(h.previous_data || {}, h.new_data || {});
  }
  function miniChips(fields){
    return `<div class="changeChips adminChangeChips">${fields.map(f=>`<span>${esc(labelField(f))}</span>`).join('') || '<span>Chưa rõ thay đổi</span>'}</div>`;
  }
  function historyHTML(h){
    const no = displayQuestionNo(h);
    const q = findQuestionById(h.question_id);
    const title = q?.question || h.new_data?.question || h.previous_data?.question || '';
    const fields = historyFields(h);
    return `<div class="item historyItem">
      <div class="head historyHead">
        <div>
          <b>Câu ${esc(no)}</b>
          ${title ? `<p class="muted historyQuestionText">${esc(title)}</p>` : ''}
        </div>
        <span class="muted historyTime">${esc(date(h.created_at))}</span>
      </div>
      ${miniChips(fields)}
      <p class="muted historyUser">Người sửa: ${esc(userOf(h))}</p>
      <div class="actions">
        <button class="act" onclick="viewHistoryFixed('${esc(h.id || h.question_id || '')}')">Trước/sau</button>
      </div>
    </div>`;
  }

  window.renderHistory = function(){
    const arr = (cache.history || []).filter(h => match(`${safe(h)} ${displayQuestionNo(h)} ${findQuestionById(h.question_id)?.question || ''}`));
    $('historyList').innerHTML = arr.map(historyHTML).join('') || '<p class=muted>Chưa có lịch sử chỉnh sửa.</p>';
  };

  window.viewHistoryFixed = function(id){
    const h = (cache.history || []).find(x => String(x.id || x.question_id || '') === String(id)) || cache.history[0];
    if(!h) return;
    const no = displayQuestionNo(h);
    openModal(`Lịch sử câu ${no}`, compareHTML(h.previous_data || {}, h.new_data || {}));
  };
  window.viewHistory = function(id){
    const h = (cache.history || []).find(x => String(x.id || 0) === String(id)) || cache.history[0];
    if(!h) return;
    const no = displayQuestionNo(h);
    openModal(`Lịch sử câu ${no}`, compareHTML(h.previous_data || {}, h.new_data || {}));
  };

  const oldReqHTML = window.reqHTML || (typeof reqHTML === 'function' ? reqHTML : null);
  window.reqHTML = reqHTML = function(r){
    const fields = changedFields(r);
    const userText = r.user_email || r.email || r.user_id || 'Không rõ user';
    const oldData = r.old_data || getQuestionByReq(r) || {};
    const newData = r.new_data || {};
    const preview = newData.question || oldData.question || '';
    return `<div class="item reqItem ${esc(r.status || '')}">
      <div class="head">
        <div>
          <b>Câu ${esc(questionLabel(r))}</b>
          ${preview ? `<p class="muted historyQuestionText">${esc(preview)}</p>` : ''}
          <p class="muted">${esc(date(r.created_at))} · ${esc(userText)}</p>
        </div>
        ${badge(r.status)}
      </div>
      <div class="changeChips">${fields.map(f => `<span>${esc(labelField(f))}</span>`).join('') || '<span>Chưa rõ thay đổi</span>'}</div>
      <div class="actions">
        <button class="act" onclick="viewReq(${r.id})">So sánh</button>
        ${r.status === 'pending' ? `<button class="act ok" onclick="approve(${r.id})">Duyệt</button><button class="act bad" onclick="rejectReq(${r.id})">Từ chối</button>` : ''}
      </div>
    </div>`;
  };

  const oldRender = window.render || (typeof render === 'function' ? render : null);
  window.render = render = function(){
    renderStats();
    renderRequests();
    renderUsers();
    renderHistory();
    renderLogs();
    renderQuestions();
  };
})();


// ===== FINAL_ADMIN_HISTORY_SHOW_EDITOR_EMAIL_20260613 =====
// Hiển thị Gmail người sửa thay vì UUID trong tab Lịch sử.
(function(){
  function emailByUserId(id){
    if(!id) return '';
    const p = (cache.profiles || []).find(x => String(x.id) === String(id));
    return p?.email || '';
  }
  function findQuestionById(id){
    return (cache.questions || []).find(q => String(q.id) === String(id)) || null;
  }
  function realQuestionNum(row){
    const q = findQuestionById(row?.question_id);
    return row?.question_num || row?.new_data?.num || row?.previous_data?.num || row?.old_data?.num || row?.num || q?.num || row?.question_id || '?';
  }
  function realSubjectCode(row){
    const q = findQuestionById(row?.question_id);
    return row?.subject_code || row?.new_data?.subject_code || row?.previous_data?.subject_code || row?.old_data?.subject_code || q?.subject_code || '';
  }
  function historyTitle(row){
    const q = findQuestionById(row?.question_id);
    return row?.new_data?.question || row?.previous_data?.question || row?.old_data?.question || q?.question || '';
  }
  function changedKeys(oldData, newData){
    return ['question','options','answer','answer_text','images'].filter(k => safe(oldData?.[k]) !== safe(newData?.[k]));
  }
  function chips(keys){
    return `<div class="changeChips adminChangeChips">${keys.map(k=>`<span>${esc(labelField(k))}</span>`).join('') || '<span>Chưa rõ thay đổi</span>'}</div>`;
  }
  function editorEmail(row){
    return row?.changed_by_email || row?.user_email || row?.admin_email || emailByUserId(row?.changed_by) || emailByUserId(row?.user_id) || emailByUserId(row?.approved_by) || 'Không rõ email';
  }

  window.renderHistory = renderHistory = function(){
    const arr = (cache.history || []).filter(h => match(`${safe(h)} ${realQuestionNum(h)} ${historyTitle(h)} ${realSubjectCode(h)} ${editorEmail(h)}`));
    $('historyList').innerHTML = arr.map(h => {
      const no = realQuestionNum(h);
      const subject = realSubjectCode(h);
      const title = historyTitle(h);
      const keys = changedKeys(h.previous_data || {}, h.new_data || {});
      return `<div class="item historyItem">
        <div class="head historyHead">
          <div>
            <b>${subject ? esc(subject) + ' · ' : ''}Câu ${esc(no)}</b>
            ${title ? `<p class="muted historyQuestionText">${esc(title)}</p>` : ''}
          </div>
          <span class="muted historyTime">${esc(date(h.created_at))}</span>
        </div>
        ${chips(keys)}
        <p class="muted historyUser">Người sửa: ${esc(editorEmail(h))}</p>
        <div class="actions"><button class="act" onclick="viewHistoryFixed('${esc(h.id || h.question_id || '')}')">Trước/sau</button></div>
      </div>`;
    }).join('') || '<p class=muted>Chưa có lịch sử chỉnh sửa.</p>';
  };
})();


// ===== FINAL_ADMIN_AUTO_CHECK_LOADING_EFFECT_20260613 =====
// Admin tự check mỗi 10 giây + có hiệu ứng loading khi đang check.
(function(){
  const AUTO_MS = 10000;
  let timer = null;
  let checking = false;
  let knownPendingIds = null;

  function pendingIdsFrom(list){
    return new Set((list || []).filter(x => x.status === 'pending').map(x => String(x.id)));
  }

  function ensureStyle(){
    if(document.getElementById('adminAutoCheckStyle')) return;
    const style = document.createElement('style');
    style.id = 'adminAutoCheckStyle';
    style.textContent = `
      #adminAutoCheckChip{
        position:fixed;right:18px;bottom:18px;z-index:99999;
        min-width:168px;height:40px;padding:0 14px;border-radius:999px;
        display:flex;align-items:center;justify-content:center;gap:9px;
        border:1px solid rgba(232,212,168,.28);
        background:linear-gradient(145deg,rgba(24,16,11,.94),rgba(8,6,5,.94));
        color:#e8d4a8;font-weight:900;font-size:13px;
        box-shadow:0 18px 46px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.05);
        backdrop-filter:blur(12px);opacity:.78;transform:translateY(0);
        transition:opacity .18s ease, transform .18s ease, border-color .18s ease, box-shadow .18s ease;
        pointer-events:none;
      }
      #adminAutoCheckChip.hidden{display:none!important}
      #adminAutoCheckChip.is-checking{opacity:1;transform:translateY(-2px);border-color:rgba(232,212,168,.48);box-shadow:0 22px 58px rgba(0,0,0,.44),0 0 24px rgba(232,212,168,.14)}
      #adminAutoCheckChip .autoDot{
        width:18px;height:18px;border-radius:50%;border:2px solid rgba(232,212,168,.24);border-top-color:#e8d4a8;
      }
      #adminAutoCheckChip.is-checking .autoDot{animation:autoCheckSpin .72s linear infinite}
      #adminAutoCheckChip.is-idle .autoDot{border-color:rgba(114,197,140,.38);background:rgba(114,197,140,.18)}
      @keyframes autoCheckSpin{to{transform:rotate(360deg)}}
      #refreshBtn.auto-checking{position:relative;color:transparent!important;pointer-events:none}
      #refreshBtn.auto-checking:after{
        content:'';position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;
        border-radius:50%;border:2px solid rgba(232,212,168,.28);border-top-color:#e8d4a8;animation:autoCheckSpin .72s linear infinite;
      }
      @media(max-width:760px){#adminAutoCheckChip{right:12px;bottom:12px;min-width:140px;height:36px;font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function ensureChip(){
    ensureStyle();
    let chip = document.getElementById('adminAutoCheckChip');
    if(!chip){
      chip = document.createElement('div');
      chip.id = 'adminAutoCheckChip';
      chip.className = 'is-idle';
      chip.innerHTML = '<span class="autoDot"></span><span class="autoText">Tự check 10s</span>';
      document.body.appendChild(chip);
    }
    return chip;
  }

  function setChecking(on){
    const chip = ensureChip();
    const text = chip.querySelector('.autoText');
    chip.classList.toggle('is-checking', !!on);
    chip.classList.toggle('is-idle', !on);
    chip.classList.remove('hidden');
    if(text) text.textContent = on ? 'Đang kiểm tra...' : 'Tự check 10s';
    const btn = $('refreshBtn');
    if(btn){
      btn.classList.toggle('auto-checking', !!on);
      btn.title = on ? 'Đang tự kiểm tra yêu cầu mới...' : 'Admin tự kiểm tra yêu cầu mới mỗi 10 giây';
    }
  }

  function notifyNew(count){
    if(count <= 0) return;
    toast(count === 1 ? 'Có 1 yêu cầu sửa mới' : `Có ${count} yêu cầu sửa mới`);
    const oldTitle = document.title;
    document.title = `(${count}) Yêu cầu sửa mới`;
    setTimeout(() => { document.title = oldTitle || 'Learning Hub Admin'; }, 3500);
  }

  async function autoCheck(){
    if(checking) return;
    if(!client || !user || !profile || !isEditor()) return;
    if(document.body.classList.contains('is-busy')) return;
    checking = true;
    setChecking(true);
    try{
      const oldPending = knownPendingIds || pendingIdsFrom(cache.requests);
      const req = await client.from('edit_requests').select('*').order('created_at', { ascending:false });
      if(req.error) return;

      const newRequests = req.data || [];
      const newPending = pendingIdsFrom(newRequests);
      let newCount = 0;
      if(knownPendingIds){
        newPending.forEach(id => { if(!oldPending.has(id)) newCount++; });
      }
      knownPendingIds = newPending;
      cache.requests = newRequests;

      if(isAdmin()){
        const logs = await client.from('admin_logs').select('*').order('created_at', { ascending:false }).limit(500);
        if(!logs.error) cache.logs = logs.data || [];
      }

      render();
      notifyNew(newCount);
    }catch(e){
      console.warn('[Admin auto check]', e);
    }finally{
      checking = false;
      setChecking(false);
    }
  }

  function startAutoCheck(){
    ensureChip();
    setChecking(false);
    if(timer) return;
    timer = setInterval(autoCheck, AUTO_MS);
    setTimeout(autoCheck, 2500);
  }

  const oldLoadAll = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAll && !window.__adminAutoCheckLoadingPatched){
    window.__adminAutoCheckLoadingPatched = true;
    loadAll = async function(){
      const res = await oldLoadAll.apply(this, arguments);
      knownPendingIds = pendingIdsFrom(cache.requests);
      startAutoCheck();
      return res;
    };
    window.loadAll = loadAll;
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureChip();
    setChecking(false);
    setTimeout(startAutoCheck, 1500);
  });
})();


// ===== FINAL_ADMIN_SHOW_LAST_ACTIVITY_20260613 =====
// Tab Người dùng: hiển thị hoạt động gần nhất thay vì chỉ login.
(function(){
  function activityTime(p){
    return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || '';
  }
  function activityBadge(p){
    const t = activityTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  window.renderUsers = renderUsers = function(){
    const arr = cache.profiles.filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id} ${p.last_activity || ''}`));
    $('userList').innerHTML = '<div class="userRow muted tableHead"><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b></div>' + arr.map(p => {
      const acts = isAdmin()
        ? `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>
          <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)})">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
          <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}')">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
          <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}')">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>`
        : `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>`;
      const activeText = activityBadge(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class=userRow>
        <div><div class=mail>${esc(p.email || p.id)}</div><div class=uid>${esc(p.id)}</div></div>
        <div>${badge(p.role || 'user')}</div>
        <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(activityTime(p)))}</div></div>
        <div class=actions>${acts}</div>
      </div>`;
    }).join('');
  };

  async function refreshProfilesOnly(){
    if(!client || !user || !profile || !isEditor()) return;
    try{
      const r = await client.from('profiles').select('*').order('last_activity', { ascending:false, nullsFirst:false });
      if(!r.error){
        cache.profiles = r.data || [];
        renderStats();
        renderUsers();
      }
    }catch(e){
      console.warn('[profiles activity refresh]', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setInterval(refreshProfilesOnly, 30000);
    setTimeout(refreshProfilesOnly, 5000);
  });
})();


// ===== FINAL_ADMIN_SORT_USERS_BY_LAST_ACTIVITY_20260613 =====
// Đưa người hoạt động gần nhất lên đầu tab Người dùng.
(function(){
  function activityTime(p){
    return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || '';
  }
  function activityMs(p){
    const t = activityTime(p);
    const n = t ? new Date(t).getTime() : 0;
    return Number.isFinite(n) ? n : 0;
  }
  function activityBadge(p){
    const t = activityTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  window.renderUsers = renderUsers = function(){
    const arr = cache.profiles
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id} ${p.last_activity || ''}`))
      .sort((a,b) => activityMs(b) - activityMs(a));

    $('userList').innerHTML = '<div class="userRow muted tableHead"><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b></div>' + arr.map(p => {
      const acts = isAdmin()
        ? `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>
          <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)})">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
          <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}')">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
          <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}')">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>`
        : `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>`;

      const activeText = activityBadge(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow ${activeClass}">
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${badge(p.role || 'user')}</div>
        <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(activityTime(p)))}</div></div>
        <div class="actions">${acts}</div>
      </div>`;
    }).join('');
  };

  async function refreshProfilesOnly(){
    if(!client || !user || !profile || !isEditor()) return;
    try{
      const r = await client.from('profiles').select('*').order('last_activity', { ascending:false, nullsFirst:false });
      if(!r.error){
        cache.profiles = r.data || [];
        renderStats();
        renderUsers();
      }
    }catch(e){
      console.warn('[profiles activity refresh]', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshProfilesOnly, 1500);
    setInterval(refreshProfilesOnly, 30000);
  });
})();


// ===== FINAL_ADMIN_SUBJECT_TABS_ADD_DELETE_QUESTIONS_20260613 =====
// Tab Câu hỏi: chia theo môn + thêm câu + xóa vĩnh viễn + ẩn/hiện.
(function(){
  let activeQuestionSubject = localStorage.getItem('admin_question_subject_filter_v1') || 'all';

  function subjectsFromQuestions(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b) => String(a).localeCompare(String(b)));
  }

  function subjectCount(code){
    if(code === 'all') return (cache.questions || []).length;
    return (cache.questions || []).filter(q => (q.subject_code || 'HOD102') === code).length;
  }

  function currentSubjectForAdd(){
    if(activeQuestionSubject !== 'all') return activeQuestionSubject;
    return subjectsFromQuestions()[0] || 'HOD102';
  }

  function nextNumForSubject(code){
    const nums = (cache.questions || [])
      .filter(q => (q.subject_code || 'HOD102') === code)
      .map(q => Number(q.num) || 0);
    return (nums.length ? Math.max(...nums) : 0) + 1;
  }

  function optionText(q,k){
    return q?.options?.[k] || '';
  }

  function getAddFormHTML(){
    const subjects = subjectsFromQuestions();
    const selected = currentSubjectForAdd();
    const nextNum = nextNumForSubject(selected);
    return `<div class="adminQuestionForm">
      <div class="formGrid2">
        <div class="field"><label>Môn học</label><select id="newQuestionSubject">${subjects.map(s => `<option value="${esc(s)}" ${s===selected?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
        <div class="field"><label>Số câu</label><input id="newQuestionNum" type="number" value="${esc(nextNum)}" min="1"></div>
      </div>
      <div class="field"><label>Câu hỏi</label><textarea id="newQuestionText" placeholder="Nhập nội dung câu hỏi..."></textarea></div>
      <div class="formGrid2">
        ${['A','B','C','D','E'].map(k => `<div class="field"><label>Đáp án ${k}</label><textarea id="newOpt${k}" placeholder="Nội dung lựa chọn ${k}"></textarea></div>`).join('')}
      </div>
      <div class="formGrid2">
        <div class="field"><label>Đáp án đúng</label><input id="newAnswer" placeholder="VD: A hoặc AC"></div>
        <div class="field"><label>Giải thích</label><textarea id="newAnswerText" placeholder="Có thể bỏ trống"></textarea></div>
      </div>
      <div class="actions formActions">
        <button class="act ok" onclick="saveNewQuestionAdmin()">Thêm câu hỏi</button>
        <button class="act" onclick="closeModal()">Hủy</button>
      </div>
    </div>`;
  }

  window.openAddQuestionAdmin = function(){
    openModal('Thêm câu hỏi mới', getAddFormHTML());
    setTimeout(() => {
      const sub = $('newQuestionSubject');
      const num = $('newQuestionNum');
      if(sub && num){
        sub.onchange = () => { num.value = nextNumForSubject(sub.value); };
      }
    }, 0);
  };

  window.saveNewQuestionAdmin = async function(){
    if(!isEditor()) return alert('Admin hoặc Editor mới được thêm câu hỏi.');
    const subject = $('newQuestionSubject')?.value || currentSubjectForAdd();
    const num = Number($('newQuestionNum')?.value || 0);
    const question = ($('newQuestionText')?.value || '').trim();
    const answer = ($('newAnswer')?.value || '').trim().toUpperCase();
    const answer_text = ($('newAnswerText')?.value || '').trim();
    const options = {};
    ['A','B','C','D','E'].forEach(k => {
      const v = ($('newOpt'+k)?.value || '').trim();
      if(v) options[k] = v;
    });
    if(!subject) return alert('Chọn môn học trước.');
    if(!num) return alert('Nhập số câu.');
    if(!question) return alert('Nhập câu hỏi.');
    if(!answer) return alert('Nhập đáp án đúng.');
    if(!Object.keys(options).length) return alert('Nhập ít nhất 1 lựa chọn.');

    setBusy(true, 'Đang thêm...');
    try{
      const payload = {
        subject_code: subject,
        num,
        question,
        options,
        answer,
        answer_text,
        images: [],
        is_active: true,
        updated_at: new Date().toISOString()
      };
      const r = await client.from('questions').insert(payload).select('*').single();
      if(r.error) return alert('Không thêm được câu hỏi: ' + r.error.message);
      await logAction('add_question', 'questions', r.data?.id || num, { subject_code: subject, num });
      activeQuestionSubject = subject;
      localStorage.setItem('admin_question_subject_filter_v1', subject);
      closeModal();
      await loadAll();
      toast('Đã thêm câu hỏi');
    }finally{
      setBusy(false);
    }
  };

  window.deleteQuestionAdmin = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới được xóa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');
    const ok = confirm(`Xóa ${q.subject_code || ''} - Câu ${q.num || q.id}?\n\nCâu hỏi sẽ được chuyển vào Thùng rác.`);
    if(!ok) return;
    setBusy(true, 'Đang xóa...');
    try{
      let backedUp = false;
      try{
        const backup = await client.from('deleted_questions').insert({
          id: q.id,
          original_data: q,
          deleted_by: user?.id,
          deleted_by_email: user?.email || profile?.email
        });
        backedUp = !backup.error;
      }catch(e){}
      const r = await client.from('questions').delete().eq('id', id);
      if(r.error) return alert('Không xóa được: ' + r.error.message + '\nBạn có thể dùng nút Ẩn thay thế.');
      await logAction('delete_question', 'questions', id, { subject_code: q.subject_code, num: q.num });
      await loadAll();
      toast(backedUp ? 'Đã chuyển vào Thùng rác' : 'Đã xóa (chưa có bảng backup)');
    }finally{
      setBusy(false);
    }
  };

  window.setQuestionSubjectFilter = function(code){
    activeQuestionSubject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', activeQuestionSubject);
    renderQuestions();
  };

  window.renderQuestions = renderQuestions = function(){
    const subjects = subjectsFromQuestions();
    if(activeQuestionSubject !== 'all' && !subjects.includes(activeQuestionSubject)) activeQuestionSubject = 'all';
    const tabs = `<div class="questionSubjectTabs">
      <button class="subjectTab ${activeQuestionSubject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subjects.map(s => `<button class="subjectTab ${activeQuestionSubject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar">
      <div>${tabs}</div>
      <button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button>
    </div>`;
    const arr = (cache.questions || [])
      .filter(q => activeQuestionSubject === 'all' || (q.subject_code || 'HOD102') === activeQuestionSubject)
      .filter(q => match(`${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${q.answer || ''}`))
      .sort((a,b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')) || (Number(a.num)||0) - (Number(b.num)||0))
      .slice(0, 300);

    const html = arr.map(q => `<div class="item questionAdminItem">
      <div class="head questionAdminHead">
        <div>
          <div class="questionSubjectCode">${esc(q.subject_code || 'HOD102')}</div>
          <b>Câu ${esc(q.num || q.id)}</b>
        </div>
        ${q.is_active === false ? badge('hidden') : badge('active')}
      </div>
      <p class="questionPreview">${esc(q.question || '')}</p>
      <p class="muted">Đáp án: ${esc(q.answer || '')}</p>
      <div class="adminOptionPreview">
        ${['A','B','C','D','E'].filter(k => optionText(q,k)).map(k => `<span><b>${k}</b> ${esc(optionText(q,k))}</span>`).join('')}
      </div>
      <div class="actions">
        <button class="act" onclick="viewQuestion(${q.id})">Xem</button>
        <button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button>
        <button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active === false})">${q.is_active === false ? 'Hiện' : 'Ẩn'}</button>
        ${isAdmin() ? `<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>` : ''}
      </div>
    </div>`).join('') || '<p class=muted>Không có câu hỏi.</p>';

    $('questionList').innerHTML = toolbar + `<div class="questionResultNote">Đang hiển thị ${arr.length} câu${activeQuestionSubject !== 'all' ? ' của môn ' + esc(activeQuestionSubject) : ''}.</div>` + html;
  };
})();


// ===== FINAL_ADMIN_DIRECT_EDIT_APP_STYLE_MODAL_20260613 =====
// Đổi giao diện "Sửa trực tiếp" trong Admin theo kiểu form sửa ở trang học.
(function(){
  let directEditDraftImages = [];

  function escAttr(s){ return esc(s).replace(/`/g,'&#96;'); }
  function optVal(q,k){ return q?.options?.[k] || ''; }

  function renderDirectEditImages(){
    const box = $('dqEditImgs');
    if(!box) return;
    if(!directEditDraftImages.length){
      box.innerHTML = '<div class="dqNoImage">Chưa có hình.</div>';
      return;
    }
    box.innerHTML = directEditDraftImages.map((im,i)=>`
      <div class="dqEditImg">
        <button type="button" onclick="removeDirectEditImage(${i})">×</button>
        <img src="${escAttr(im.src || im.url || im)}" alt="Ảnh câu hỏi">
      </div>`).join('');
  }

  window.removeDirectEditImage = function(i){
    directEditDraftImages.splice(i,1);
    renderDirectEditImages();
  };

  window.editQuestionDirect = function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');
    directEditDraftImages = Array.isArray(q.images) ? JSON.parse(JSON.stringify(q.images)) : [];

    openModal(`Sửa trực tiếp câu ${q.num || q.id}`, `
      <div class="directEditAppStyle">
        <div class="directEditGrid">
          <div class="directLeft">
            <div class="field directQuestionField">
              <label>Câu hỏi</label>
              <textarea id="dqQuestion">${esc(q.question || '')}</textarea>
            </div>
            <div class="field directAnswerField">
              <label>Đáp án đúng</label>
              <input id="dqAnswer" value="${escAttr(q.answer || '')}" placeholder="VD: A hoặc AC">
            </div>
            <div class="field directImageField">
              <label>Hình ảnh</label>
              <input type="file" id="dqImgUpload" accept="image/*" multiple>
              <div id="dqEditImgs" class="dqEditImgs"></div>
            </div>
          </div>
          <div class="directRight">
            ${['A','B','C','D','E'].map(k=>`
              <div class="field directOptionField">
                <label>Đáp án ${k}</label>
                <textarea data-dq-opt="${k}">${esc(optVal(q,k))}</textarea>
              </div>`).join('')}
          </div>
        </div>
        <div class="directEditFooter actions">
          <button class="act ok directSaveBtn" onclick="saveQuestionDirect(${q.id})">Lưu trực tiếp</button>
          <button class="act" onclick="closeModal()">Đóng</button>
        </div>
      </div>`);

    setTimeout(()=>{
      renderDirectEditImages();
      const inp = $('dqImgUpload');
      if(inp){
        inp.onchange = e => {
          Array.from(e.target.files || []).forEach(file => {
            const fr = new FileReader();
            fr.onload = () => {
              directEditDraftImages.push({
                id:'admin_upload_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                src:fr.result,
                source:'admin-upload',
                name:file.name
              });
              renderDirectEditImages();
            };
            fr.readAsDataURL(file);
          });
          e.target.value = '';
        };
      }
    },0);
  };

  window.saveQuestionDirect = async function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');

    const ops = {};
    document.querySelectorAll('[data-dq-opt]').forEach(t => {
      const v = (t.value || '').trim();
      if(v) ops[t.dataset.dqOpt] = v;
    });

    const question = ($('dqQuestion')?.value || '').trim();
    const answer = ($('dqAnswer')?.value || '').trim().toUpperCase();
    if(!question) return alert('Câu hỏi không được để trống.');
    if(!answer) return alert('Đáp án đúng không được để trống.');
    if(!Object.keys(ops).length) return alert('Cần có ít nhất một lựa chọn.');

    const payload = {
      question,
      options: ops,
      answer,
      answer_text: Object.entries(ops).filter(([k]) => answer.includes(k)).map(([k,v]) => `${k}. ${v}`).join('; '),
      images: directEditDraftImages || [],
      updated_at: new Date().toISOString()
    };

    setBusy(true,'Đang lưu...');
    try{
      const res = await client.from('questions').update(payload).eq('id',id);
      if(res.error) return alert(res.error.message);
      try{
        await client.from('question_history').insert({
          question_id:id,
          question_num:q.num || null,
          subject_code:q.subject_code || null,
          request_id:null,
          previous_data:{question:q.question,options:q.options||{},answer:q.answer,answer_text:q.answer_text,images:q.images||[]},
          new_data:payload,
          changed_by:user.id,
          approved_by:user.id
        });
      }catch(e){}
      await logAction('direct_edit_question','questions',id,{subject_code:q.subject_code,num:q.num});
      closeModal();
      await loadAll();
      toast('Đã sửa trực tiếp');
    }finally{
      setBusy(false);
    }
  };
})();


// ===== FINAL_ADMIN_QUESTIONS_FULL_LOAD_IMAGES_FUZZY_HIGHLIGHT_20260613 =====
// Fix: tải đủ câu hỏi, bỏ giới hạn 300, hiện ảnh, tìm kiếm bỏ qua dấu câu/khoảng trắng và tô sáng chữ tìm được.
(function(){
  let activeQuestionSubject = localStorage.getItem('admin_question_subject_filter_v1') || 'all';
  const PAGE_SIZE = 1000;

  function normText(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function normCompact(s){
    return normText(s).replace(/\s+/g,'');
  }
  function queryTokens(){
    return normText(key()).split(' ').filter(x => x.length >= 2);
  }
  function rawHighlightTokens(){
    return Array.from(new Set(String($('search')?.value || '').split(/[^\p{L}\p{N}]+/u).filter(x => x.length >= 2))).slice(0, 12);
  }
  function escapeRegExp(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function highlightText(s){
    let out = esc(s || '');
    const terms = rawHighlightTokens().sort((a,b)=>b.length-a.length);
    if(!terms.length) return out;
    terms.forEach(term => {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(esc(term))})(?=$|[^\\p{L}\\p{N}])`, 'giu');
      out = out.replace(re, `$1<mark class="searchMark">$2</mark>`);
    });
    return out;
  }
  function questionSearchText(q){
    return `${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${q.answer || ''} ${q.answer_text || ''} ${safe(q.options || {})}`;
  }
  function questionMatches(q){
    const k = key();
    if(!k) return true;
    const hay = questionSearchText(q);
    const nHay = normText(hay);
    const nNeedle = normText(k);
    if(!nNeedle) return true;
    if(nHay.includes(nNeedle)) return true;
    if(normCompact(hay).includes(normCompact(k))) return true;
    const tokens = queryTokens();
    return tokens.length ? tokens.every(t => nHay.includes(t)) : true;
  }
  function subjectsFromQuestions(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function subjectCount(code){
    if(code === 'all') return (cache.questions || []).length;
    return (cache.questions || []).filter(q => (q.subject_code || 'HOD102') === code).length;
  }
  function optionText(q,k){ return q?.options?.[k] || ''; }
  function imageSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    return im.src || im.url || im.publicUrl || im.path || '';
  }
  function imagesHTML(q){
    const imgs = Array.isArray(q.images) ? q.images.map(imageSrc).filter(Boolean) : [];
    if(!imgs.length) return '';
    return `<div class="adminQuestionImages">${imgs.map(src => `<img src="${esc(src)}" loading="lazy" onclick="openImagePreviewAdmin(decodeURIComponent('${encodeURIComponent(src)}'))">`).join('')}</div>`;
  }
  window.openImagePreviewAdmin = function(src){
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(src)}"></div>`);
  };

  async function loadAllRows(table, orderCol){
    let from = 0;
    let rows = [];
    const MAX_PAGES = 200;
    let page = 0;
    while(page < MAX_PAGES){
      page++;
      let q = client.from(table).select('*');
      if(orderCol) q = q.order(orderCol, { ascending:true });
      const r = await q.range(from, from + PAGE_SIZE - 1);
      if(r.error){ err('Lỗi bảng ' + table + ': ' + esc(r.error.message)); return rows; }
      const data = r.data || [];
      rows = rows.concat(data);
      if(data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    if(page >= MAX_PAGES) console.warn('loadAllRows: đã đạt giới hạn ' + MAX_PAGES + ' trang cho bảng ' + table);
    return rows;
  }

  const oldSafeLoad = typeof safeLoad === 'function' ? safeLoad : null;
  window.loadAll = loadAll = async function(){
    clearErr();
    setBusy(true);
    try{
      cache.profiles = oldSafeLoad ? await oldSafeLoad('profiles', client.from('profiles').select('*').order('created_at', { ascending:false })) : [];
      cache.questions = await loadAllRows('questions', 'num');
      cache.requests = oldSafeLoad ? await oldSafeLoad('edit_requests', client.from('edit_requests').select('*').order('created_at', { ascending:false })) : [];
      cache.history = oldSafeLoad ? await oldSafeLoad('question_history', client.from('question_history').select('*').order('created_at', { ascending:false }).limit(500)) : [];
      cache.logs = isAdmin() && oldSafeLoad ? await oldSafeLoad('admin_logs', client.from('admin_logs').select('*').order('created_at', { ascending:false }).limit(500)) : [];
      render();
      toast(`Đã tải ${cache.questions.length} câu hỏi`);
    }finally{
      setBusy(false);
    }
  };

  window.setQuestionSubjectFilter = function(code){
    activeQuestionSubject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', activeQuestionSubject);
    renderQuestions();
  };

  const oldOpenAdd = window.openAddQuestionAdmin;
  window.openAddQuestionAdmin = function(){
    if(typeof oldOpenAdd === 'function') return oldOpenAdd();
    alert('Chức năng thêm câu hỏi chưa sẵn sàng, hãy tải lại trang.');
  };

  window.renderQuestions = renderQuestions = function(){
    const subjects = subjectsFromQuestions();
    if(activeQuestionSubject !== 'all' && !subjects.includes(activeQuestionSubject)) activeQuestionSubject = 'all';
    const tabs = `<div class="questionSubjectTabs">
      <button class="subjectTab ${activeQuestionSubject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subjects.map(s => `<button class="subjectTab ${activeQuestionSubject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;
    const arr = (cache.questions || [])
      .filter(q => activeQuestionSubject === 'all' || (q.subject_code || 'HOD102') === activeQuestionSubject)
      .filter(questionMatches)
      .sort((a,b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')) || (Number(a.num)||0) - (Number(b.num)||0));

    const html = arr.map(q => `<div class="item questionAdminItem">
      <div class="head questionAdminHead">
        <div>
          <div class="questionSubjectCode">${esc(q.subject_code || 'HOD102')}</div>
          <b>Câu ${esc(q.num || q.id)}</b>
        </div>
        ${q.is_active === false ? badge('hidden') : badge('active')}
      </div>
      <p class="questionPreview">${highlightText(q.question || '')}</p>
      ${imagesHTML(q)}
      <p class="muted">Đáp án: ${highlightText(q.answer || '')}</p>
      <div class="adminOptionPreview">
        ${['A','B','C','D','E'].filter(k => optionText(q,k)).map(k => `<span><b>${k}</b> ${highlightText(optionText(q,k))}</span>`).join('')}
      </div>
      <div class="actions">
        <button class="act" onclick="viewQuestion(${q.id})">Xem</button>
        <button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button>
        <button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active === false})">${q.is_active === false ? 'Hiện' : 'Ẩn'}</button>
        ${isAdmin() ? `<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>` : ''}
      </div>
    </div>`).join('') || '<p class=muted>Không có câu hỏi.</p>';

    $('questionList').innerHTML = toolbar + `<div class="questionResultNote">Đang hiển thị ${arr.length} / ${cache.questions.length} câu${activeQuestionSubject !== 'all' ? ' của môn ' + esc(activeQuestionSubject) : ''}.</div>` + html;
  };
})();


// ===== FINAL_ADMIN_IMAGE_SHOW_ROBUST_FIX_20260613 =====
// Fix hiện ảnh câu hỏi: hỗ trợ nhiều dạng images khác nhau: string, JSON string, src, url, path, base64, dataUrl.
(function(){
  let activeQuestionSubject = localStorage.getItem('admin_question_subject_filter_v1') || 'all';

  function tryParse(v){
    if(typeof v !== 'string') return v;
    const s = v.trim();
    if(!s) return [];
    if((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))){
      try{return JSON.parse(s)}catch(e){return v}
    }
    return v;
  }
  function maybeBase64(s){
    s = String(s || '').trim();
    if(/^data:image\//i.test(s)) return s;
    if(/^https?:\/\//i.test(s) || /^blob:/i.test(s) || /^\//.test(s) || /^\.\.?\//.test(s)) return s;
    if(/^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s)){
      const mime = s.startsWith('iVBOR') ? 'image/png' : (s.startsWith('R0lGOD') ? 'image/gif' : (s.startsWith('UklGR') ? 'image/webp' : 'image/jpeg'));
      return `data:${mime};base64,${s}`;
    }
    return s;
  }
  function publicUrlFromPath(path){
    const p = String(path || '').trim();
    if(!p) return '';
    if(/^https?:\/\//i.test(p) || /^data:image\//i.test(p) || /^blob:/i.test(p) || /^\//.test(p) || /^\.\.?\//.test(p)) return p;
    const buckets = ['question-images','question_images','questions','images','public'];
    for(const b of buckets){
      try{
        const r = client?.storage?.from(b)?.getPublicUrl(p);
        if(r?.data?.publicUrl) return r.data.publicUrl;
      }catch(e){}
    }
    return p;
  }
  function imageSrcFromAny(im){
    im = tryParse(im);
    if(!im) return '';
    if(typeof im === 'string') return publicUrlFromPath(maybeBase64(im));
    if(Array.isArray(im)) return imageSrcFromAny(im[0]);
    if(typeof im === 'object'){
      const keys = ['src','url','publicUrl','public_url','href','downloadURL','download_url','file_url','fileUrl','image_url','imageUrl','preview','dataUrl','data_url','data','base64','uri','path','storage_path','storagePath'];
      for(const k of keys){
        if(im[k]) return publicUrlFromPath(maybeBase64(im[k]));
      }
      for(const v of Object.values(im)){
        const got = imageSrcFromAny(v);
        if(got) return got;
      }
    }
    return '';
  }
  function imageList(q){
    let raw = tryParse(q?.images);
    if(!raw) return [];
    if(!Array.isArray(raw)) raw = [raw];
    return raw.map(imageSrcFromAny).filter(Boolean);
  }
  function safeUrlParam(src){ return encodeURIComponent(src); }
  function imagesHTML(q){
    const imgs = imageList(q);
    if(!imgs.length) return '<div class="adminQuestionNoImages">Không có hình ảnh.</div>';
    return `<div class="adminQuestionImages">${imgs.map((src,i)=>`
      <div class="adminQuestionImageWrap">
        <img src="${esc(src)}" loading="lazy" alt="Ảnh câu hỏi ${i+1}" onclick="openImagePreviewAdmin(decodeURIComponent('${safeUrlParam(src)}'))" onerror="this.closest('.adminQuestionImageWrap')?.classList.add('imgBroken')">
        <a href="${esc(src)}" target="_blank" rel="noopener">Mở ảnh</a>
      </div>`).join('')}</div>`;
  }
  window.openImagePreviewAdmin = function(src){
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(src)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh. Hãy kiểm tra link ảnh hoặc quyền storage.</p>'"></div>`);
  };
  window.viewQuestion = function(id){
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return;
    const ops = q.options || {};
    openModal(`Câu ${q.num || q.id}`, `
      <div class="adminQuestionDetail">
        <div class="questionSubjectCode">${esc(q.subject_code || 'HOD102')}</div>
        <h3>${esc(q.question || '')}</h3>
        ${imagesHTML(q)}
        <p class="muted">Đáp án đúng: <b>${esc(q.answer || '')}</b></p>
        <div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>ops[k]).map(k=>`<span><b>${k}</b> ${esc(ops[k])}</span>`).join('')}</div>
      </div>`);
  };

  function normText(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g,' ').replace(/\s+/g,' ').trim()}
  function normCompact(s){return normText(s).replace(/\s+/g,'')}
  function questionSearchText(q){return `${q.subject_code||''} ${q.num||''} ${q.question||''} ${q.answer||''} ${q.answer_text||''} ${safe(q.options||{})}`}
  function questionMatches(q){const k=key(); if(!k)return true; const hay=questionSearchText(q); const nHay=normText(hay), nNeedle=normText(k); if(nHay.includes(nNeedle))return true; if(normCompact(hay).includes(normCompact(k)))return true; const toks=nNeedle.split(' ').filter(x=>x.length>=2); return toks.every(t=>nHay.includes(t));}
  function subjectsFromQuestions(){const set=new Set((cache.questions||[]).map(q=>q.subject_code||'HOD102').filter(Boolean)); if(!set.size){set.add('HOD102');set.add('MLN111')} return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)))}
  function subjectCount(code){return code==='all'?(cache.questions||[]).length:(cache.questions||[]).filter(q=>(q.subject_code||'HOD102')===code).length}
  function optionText(q,k){return q?.options?.[k]||''}
  function highlightText(s){
    let out=esc(s||'');
    const terms=Array.from(new Set(String($('search')?.value||'').split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=2))).slice(0,12).sort((a,b)=>b.length-a.length);
    for(const term of terms){
      const re=new RegExp(`(${String(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'giu');
      out=out.replace(re,'<mark class="searchMark">$1</mark>');
    }
    return out;
  }

  window.setQuestionSubjectFilter = function(code){activeQuestionSubject=code||'all';localStorage.setItem('admin_question_subject_filter_v1',activeQuestionSubject);renderQuestions();};
  const oldOpenAdd = window.openAddQuestionAdmin;
  window.openAddQuestionAdmin = function(){ if(typeof oldOpenAdd==='function') return oldOpenAdd(); alert('Chức năng thêm câu hỏi chưa sẵn sàng, hãy tải lại trang.'); };

  window.renderQuestions = renderQuestions = function(){
    const subjects=subjectsFromQuestions();
    if(activeQuestionSubject!=='all'&&!subjects.includes(activeQuestionSubject)) activeQuestionSubject='all';
    const tabs=`<div class="questionSubjectTabs"><button class="subjectTab ${activeQuestionSubject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>${subjects.map(s=>`<button class="subjectTab ${activeQuestionSubject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}</div>`;
    const toolbar=`<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;
    const arr=(cache.questions||[]).filter(q=>activeQuestionSubject==='all'||(q.subject_code||'HOD102')===activeQuestionSubject).filter(questionMatches).sort((a,b)=>String(a.subject_code||'').localeCompare(String(b.subject_code||''))||(Number(a.num)||0)-(Number(b.num)||0));
    const html=arr.map(q=>`<div class="item questionAdminItem">
      <div class="head questionAdminHead"><div><div class="questionSubjectCode">${esc(q.subject_code||'HOD102')}</div><b>Câu ${esc(q.num||q.id)}</b></div>${q.is_active===false?badge('hidden'):badge('active')}</div>
      <p class="questionPreview">${highlightText(q.question||'')}</p>
      ${imagesHTML(q)}
      <p class="muted">Đáp án: ${highlightText(q.answer||'')}</p>
      <div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span><b>${k}</b> ${highlightText(optionText(q,k))}</span>`).join('')}</div>
      <div class="actions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
    </div>`).join('')||'<p class=muted>Không có câu hỏi.</p>';
    $('questionList').innerHTML=toolbar+`<div class="questionResultNote">Đang hiển thị ${arr.length} / ${cache.questions.length} câu${activeQuestionSubject!=='all'?' của môn '+esc(activeQuestionSubject):''}.</div>`+html;
  };
})();


// ===== FINAL_ADMIN_IMAGE_RIGHT_LAYOUT_20260613 =====
// Đưa hình ảnh sang góc/phần bên phải của thẻ câu hỏi giống giao diện flashcard.
(function(){
  let activeQuestionSubject = localStorage.getItem('admin_question_subject_filter_v1') || 'all';

  function tryParse(v){
    if(typeof v !== 'string') return v;
    const s = v.trim();
    if(!s) return [];
    if((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))){
      try{return JSON.parse(s)}catch(e){return v;}
    }
    return v;
  }
  function maybeBase64(s){
    s = String(s || '').trim();
    if(/^data:image\//i.test(s)) return s;
    if(/^https?:\/\//i.test(s) || /^blob:/i.test(s) || /^\//.test(s) || /^\.\.?\//.test(s)) return s;
    if(/^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s)){
      const mime = s.startsWith('iVBOR') ? 'image/png' : (s.startsWith('R0lGOD') ? 'image/gif' : (s.startsWith('UklGR') ? 'image/webp' : 'image/jpeg'));
      return `data:${mime};base64,${s}`;
    }
    return s;
  }
  function publicUrlFromPath(path){
    const p = String(path || '').trim();
    if(!p) return '';
    if(/^https?:\/\//i.test(p) || /^data:image\//i.test(p) || /^blob:/i.test(p) || /^\//.test(p) || /^\.\.?\//.test(p)) return p;
    const buckets = ['question-images','question_images','questions','images','public'];
    for(const b of buckets){
      try{
        const r = client?.storage?.from(b)?.getPublicUrl(p);
        if(r?.data?.publicUrl) return r.data.publicUrl;
      }catch(e){}
    }
    return p;
  }
  function imageSrcFromAny(im){
    im = tryParse(im);
    if(!im) return '';
    if(typeof im === 'string') return publicUrlFromPath(maybeBase64(im));
    if(Array.isArray(im)) return imageSrcFromAny(im[0]);
    if(typeof im === 'object'){
      const keys = ['src','url','publicUrl','public_url','href','downloadURL','download_url','file_url','fileUrl','image_url','imageUrl','preview','dataUrl','data_url','data','base64','uri','path','storage_path','storagePath'];
      for(const k of keys){ if(im[k]) return publicUrlFromPath(maybeBase64(im[k])); }
      for(const v of Object.values(im)){ const got=imageSrcFromAny(v); if(got) return got; }
    }
    return '';
  }
  function imageList(q){
    let raw = tryParse(q?.images);
    if(!raw) return [];
    if(!Array.isArray(raw)) raw=[raw];
    return raw.map(imageSrcFromAny).filter(Boolean);
  }
  function safeUrlParam(src){return encodeURIComponent(src);}
  function imagesRightHTML(q){
    const imgs=imageList(q);
    if(!imgs.length) return '';
    return `<aside class="adminQuestionImageSide">${imgs.map((src,i)=>`
      <div class="adminQuestionImageFrame">
        <img src="${esc(src)}" loading="lazy" alt="Ảnh câu hỏi ${i+1}" onclick="openImagePreviewAdmin(decodeURIComponent('${safeUrlParam(src)}'))" onerror="this.closest('.adminQuestionImageFrame')?.classList.add('imgBroken')">
        <a href="${esc(src)}" target="_blank" rel="noopener">Mở ảnh</a>
      </div>`).join('')}</aside>`;
  }
  window.openImagePreviewAdmin=function(src){
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(src)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh. Hãy kiểm tra link ảnh hoặc quyền storage.</p>'"></div>`);
  };

  function normText(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g,' ').replace(/\s+/g,' ').trim();}
  function normCompact(s){return normText(s).replace(/\s+/g,'');}
  function questionSearchText(q){return `${q.subject_code||''} ${q.num||''} ${q.question||''} ${q.answer||''} ${q.answer_text||''} ${safe(q.options||{})}`;}
  function questionMatches(q){const k=key(); if(!k)return true; const hay=questionSearchText(q), nHay=normText(hay), nNeedle=normText(k); if(nHay.includes(nNeedle))return true; if(normCompact(hay).includes(normCompact(k)))return true; const toks=nNeedle.split(' ').filter(x=>x.length>=2); return toks.every(t=>nHay.includes(t));}
  function subjectsFromQuestions(){const set=new Set((cache.questions||[]).map(q=>q.subject_code||'HOD102').filter(Boolean)); if(!set.size){set.add('HOD102');set.add('MLN111');} return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));}
  function subjectCount(code){return code==='all'?(cache.questions||[]).length:(cache.questions||[]).filter(q=>(q.subject_code||'HOD102')===code).length;}
  function optionText(q,k){return q?.options?.[k]||'';}
  function highlightText(s){
    let out=esc(s||'');
    const terms=Array.from(new Set(String($('search')?.value||'').split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=2))).slice(0,12).sort((a,b)=>b.length-a.length);
    for(const term of terms){
      const re=new RegExp(`(${String(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'giu');
      out=out.replace(re,'<mark class="searchMark">$1</mark>');
    }
    return out;
  }

  window.setQuestionSubjectFilter=function(code){activeQuestionSubject=code||'all';localStorage.setItem('admin_question_subject_filter_v1',activeQuestionSubject);renderQuestions();};

  window.renderQuestions = renderQuestions = function(){
    const subjects=subjectsFromQuestions();
    if(activeQuestionSubject!=='all'&&!subjects.includes(activeQuestionSubject)) activeQuestionSubject='all';
    const tabs=`<div class="questionSubjectTabs"><button class="subjectTab ${activeQuestionSubject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>${subjects.map(s=>`<button class="subjectTab ${activeQuestionSubject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}</div>`;
    const toolbar=`<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;
    const arr=(cache.questions||[])
      .filter(q=>activeQuestionSubject==='all'||(q.subject_code||'HOD102')===activeQuestionSubject)
      .filter(questionMatches)
      .sort((a,b)=>String(a.subject_code||'').localeCompare(String(b.subject_code||''))||(Number(a.num)||0)-(Number(b.num)||0));

    const html=arr.map(q=>{
      const hasImg=imageList(q).length>0;
      return `<div class="item questionAdminItem ${hasImg?'hasRightImage':''}">
        <div class="questionAdminTop">
          <div class="questionAdminMeta">
            <div class="questionSubjectCode">${esc(q.subject_code||'HOD102')}</div>
            <b>Câu ${esc(q.num||q.id)}</b>
          </div>
          ${q.is_active===false?badge('hidden'):badge('active')}
        </div>
        <div class="questionAdminBody">
          <main class="questionAdminTextSide">
            <p class="questionPreview">${highlightText(q.question||'')}</p>
            <div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${highlightText(optionText(q,k))}</span>`).join('')}</div>
            <p class="muted answerLine">Đáp án: ${highlightText(q.answer||'')}</p>
          </main>
          ${imagesRightHTML(q)}
        </div>
        <div class="actions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
      </div>`;
    }).join('')||'<p class=muted>Không có câu hỏi.</p>';

    $('questionList').innerHTML=toolbar+`<div class="questionResultNote">Đang hiển thị ${arr.length} / ${cache.questions.length} câu${activeQuestionSubject!=='all'?' của môn '+esc(activeQuestionSubject):''}.</div>`+html;
  };

  window.viewQuestion=function(id){
    const q=(cache.questions||[]).find(x=>String(x.id)===String(id));
    if(!q) return;
    openModal(`Câu ${q.num||q.id}`, `<div class="adminQuestionDetailCard ${imageList(q).length?'hasRightImage':''}">
      <div class="questionAdminTop"><div><div class="questionSubjectCode">${esc(q.subject_code||'HOD102')}</div><b>Câu ${esc(q.num||q.id)}</b></div>${q.is_active===false?badge('hidden'):badge('active')}</div>
      <div class="questionAdminBody"><main class="questionAdminTextSide"><h3>${esc(q.question||'')}</h3><div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${esc(optionText(q,k))}</span>`).join('')}</div><p class="muted answerLine">Đáp án: <b>${esc(q.answer||'')}</b></p></main>${imagesRightHTML(q)}</div>
    </div>`);
  };
})();


// ===== FINAL_ADMIN_DIRECT_EDIT_NO_SCROLL_SAVE_20260613 =====
// Form sửa trực tiếp: luôn thấy nút Lưu/Đóng, không cần kéo xuống cuối.
(function(){
  let directEditDraftImages = [];

  function escAttr(s){ return esc(s).replace(/`/g,'&#96;'); }
  function optVal(q,k){ return q?.options?.[k] || ''; }
  function imgSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    return im.src || im.url || im.publicUrl || im.public_url || im.dataUrl || im.data_url || im.path || '';
  }
  function renderDirectEditImages(){
    const box = $('dqEditImgs');
    if(!box) return;
    if(!directEditDraftImages.length){
      box.innerHTML = '<div class="dqNoImage">Chưa có hình.</div>';
      return;
    }
    box.innerHTML = directEditDraftImages.map((im,i)=>{
      const src = imgSrc(im);
      return `<div class="dqEditImg"><button type="button" onclick="removeDirectEditImage(${i})">×</button><img src="${escAttr(src)}" alt="Ảnh câu hỏi"></div>`;
    }).join('');
  }
  window.removeDirectEditImage = function(i){
    directEditDraftImages.splice(i,1);
    renderDirectEditImages();
  };

  window.editQuestionDirect = function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');
    directEditDraftImages = Array.isArray(q.images) ? JSON.parse(JSON.stringify(q.images)) : [];

    const saveBtn = `<button class="act ok directSaveBtn" onclick="saveQuestionDirect(${q.id})">Lưu trực tiếp</button><button class="act" onclick="closeModal()">Đóng</button>`;
    openModal(`Sửa trực tiếp câu ${q.num || q.id}`, `
      <div class="directEditAppStyle directNoScrollSave">
        <div class="directStickyActions actions">${saveBtn}</div>
        <div class="directEditGrid compactDirectGrid">
          <div class="directLeft">
            <div class="field directQuestionField">
              <label>Câu hỏi</label>
              <textarea id="dqQuestion">${esc(q.question || '')}</textarea>
            </div>
            <div class="field directAnswerField">
              <label>Đáp án đúng</label>
              <input id="dqAnswer" value="${escAttr(q.answer || '')}" placeholder="VD: A hoặc AC">
            </div>
            <div class="field directImageField">
              <label>Hình ảnh</label>
              <input type="file" id="dqImgUpload" accept="image/*" multiple>
              <div id="dqEditImgs" class="dqEditImgs"></div>
            </div>
          </div>
          <div class="directRight">
            ${['A','B','C','D','E'].map(k=>`
              <div class="field directOptionField">
                <label>Đáp án ${k}</label>
                <textarea data-dq-opt="${k}">${esc(optVal(q,k))}</textarea>
              </div>`).join('')}
          </div>
        </div>
        <div class="directEditFooter actions">${saveBtn}</div>
      </div>`);

    setTimeout(()=>{
      renderDirectEditImages();
      const inp = $('dqImgUpload');
      if(inp){
        inp.onchange = e => {
          Array.from(e.target.files || []).forEach(file => {
            const fr = new FileReader();
            fr.onload = () => {
              directEditDraftImages.push({
                id:'admin_upload_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                src:fr.result,
                source:'admin-upload',
                name:file.name
              });
              renderDirectEditImages();
            };
            fr.readAsDataURL(file);
          });
          e.target.value = '';
        };
      }
      setTimeout(()=>document.querySelector('.directStickyActions .directSaveBtn')?.focus?.(), 80);
    },0);
  };

  window.saveQuestionDirect = async function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');

    const ops = {};
    document.querySelectorAll('[data-dq-opt]').forEach(t => {
      const v = (t.value || '').trim();
      if(v) ops[t.dataset.dqOpt] = v;
    });
    const question = ($('dqQuestion')?.value || '').trim();
    const answer = ($('dqAnswer')?.value || '').trim().toUpperCase();
    if(!question) return alert('Câu hỏi không được để trống.');
    if(!answer) return alert('Đáp án đúng không được để trống.');
    if(!Object.keys(ops).length) return alert('Cần có ít nhất một lựa chọn.');

    const payload = {
      question,
      options: ops,
      answer,
      answer_text: Object.entries(ops).filter(([k]) => answer.includes(k)).map(([k,v]) => `${k}. ${v}`).join('; '),
      images: directEditDraftImages || [],
      updated_at: new Date().toISOString()
    };

    setBusy(true,'Đang lưu...');
    try{
      const res = await client.from('questions').update(payload).eq('id',id);
      if(res.error) return alert(res.error.message);
      try{
        await client.from('question_history').insert({
          question_id:id,
          question_num:q.num || null,
          subject_code:q.subject_code || null,
          request_id:null,
          previous_data:{question:q.question,options:q.options||{},answer:q.answer,answer_text:q.answer_text,images:q.images||[]},
          new_data:payload,
          changed_by:user.id,
          approved_by:user.id
        });
      }catch(e){}
      await logAction('direct_edit_question','questions',id,{subject_code:q.subject_code,num:q.num});
      closeModal();
      await loadAll();
      toast('Đã sửa trực tiếp');
    }finally{
      setBusy(false);
    }
  };
})();


// ===== FINAL_ADMIN_DIRECT_EDIT_UX_UI_POLISH_20260613 =====
// UX/UI sửa trực tiếp: header gọn, chỉ giữ 1 thanh hành động trên, form cân đối, không bị rối.
(function(){
  let directEditDraftImages = [];
  function escAttr(s){ return esc(s).replace(/`/g,'&#96;'); }
  function optVal(q,k){ return q?.options?.[k] || ''; }
  function imgSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    return im.src || im.url || im.publicUrl || im.public_url || im.dataUrl || im.data_url || im.path || '';
  }
  function renderDirectEditImages(){
    const box = $('dqEditImgs');
    if(!box) return;
    if(!directEditDraftImages.length){
      box.innerHTML = '<div class="dqNoImage">Chưa có hình.</div>';
      return;
    }
    box.innerHTML = directEditDraftImages.map((im,i)=>{
      const src = imgSrc(im);
      return `<div class="dqEditImg"><button type="button" onclick="removeDirectEditImage(${i})">×</button><img src="${escAttr(src)}" alt="Ảnh câu hỏi"></div>`;
    }).join('');
  }
  window.removeDirectEditImage = function(i){
    directEditDraftImages.splice(i,1);
    renderDirectEditImages();
  };

  window.editQuestionDirect = function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q = (cache.questions || []).find(x => String(x.id) === String(id));
    if(!q) return alert('Không tìm thấy câu hỏi.');
    directEditDraftImages = Array.isArray(q.images) ? JSON.parse(JSON.stringify(q.images)) : [];

    openModal(`Sửa trực tiếp câu ${q.num || q.id}`, `
      <div class="directEditAppStyle directEditPolished">
        <div class="directTopBar">
          <div class="directHint">Chỉnh nội dung câu hỏi, đáp án và hình ảnh. Bấm lưu ở góc phải.</div>
          <div class="directTopActions actions">
            <button class="act ok directSaveBtn" onclick="saveQuestionDirect(${q.id})">Lưu trực tiếp</button>
            <button class="act directCloseBtn" onclick="closeModal()">Đóng</button>
          </div>
        </div>
        <div class="directEditGrid compactDirectGrid">
          <section class="directLeft directPanel">
            <div class="field directQuestionField">
              <label>Câu hỏi</label>
              <textarea id="dqQuestion">${esc(q.question || '')}</textarea>
            </div>
            <div class="directSmallGrid">
              <div class="field directAnswerField">
                <label>Đáp án đúng</label>
                <input id="dqAnswer" value="${escAttr(q.answer || '')}" placeholder="VD: A hoặc AC">
              </div>
              <div class="field directImageField">
                <label>Hình ảnh</label>
                <input type="file" id="dqImgUpload" accept="image/*" multiple>
              </div>
            </div>
            <div id="dqEditImgs" class="dqEditImgs"></div>
          </section>
          <section class="directRight directPanel">
            ${['A','B','C','D','E'].map(k=>`
              <div class="field directOptionField opt${k}">
                <label>Đáp án ${k}</label>
                <textarea data-dq-opt="${k}">${esc(optVal(q,k))}</textarea>
              </div>`).join('')}
          </section>
        </div>
      </div>`);

    setTimeout(()=>{
      renderDirectEditImages();
      const inp = $('dqImgUpload');
      if(inp){
        inp.onchange = e => {
          Array.from(e.target.files || []).forEach(file => {
            const fr = new FileReader();
            fr.onload = () => {
              directEditDraftImages.push({id:'admin_upload_' + Date.now() + '_' + Math.random().toString(16).slice(2), src:fr.result, source:'admin-upload', name:file.name});
              renderDirectEditImages();
            };
            fr.readAsDataURL(file);
          });
          e.target.value = '';
        };
      }
    },0);
  };
})();


// ===== FINAL_ADMIN_SEARCH_FUZZY_HIGHLIGHT_20260613 =====
// Tìm kiếm thông minh: bỏ qua dấu câu/khoảng trắng, ví dụ "In ancient China ,the" vẫn ra "In ancient China, the".
// Đồng thời highlight các chữ tìm được trong kết quả.
(function(){
  const SEARCH_STATE = { activeSubject: localStorage.getItem('admin_question_subject_filter_v1') || 'all' };

  function stripVN(str){
    return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function normalizeSearch(str){
    return stripVN(str)
      .toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function compactSearch(str){
    return normalizeSearch(str).replace(/\s+/g, '');
  }
  function getSearchValue(){
    return String($('search')?.value || '').trim();
  }
  function getSearchTokens(){
    return normalizeSearch(getSearchValue()).split(' ').filter(t => t.length >= 2);
  }
  function fullQuestionText(q){
    return `${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${q.answer || ''} ${q.answer_text || ''} ${safe(q.options || {})} ${safe(q.images || {})}`;
  }
  function fuzzyMatchText(text){
    const raw = getSearchValue();
    if(!raw) return true;
    const hay = normalizeSearch(text);
    const needle = normalizeSearch(raw);
    if(!needle) return true;
    if(hay.includes(needle)) return true;
    if(compactSearch(text).includes(compactSearch(raw))) return true;
    const tokens = getSearchTokens();
    return tokens.length ? tokens.every(t => hay.includes(t)) : true;
  }
  function questionMatchesSmart(q){
    return fuzzyMatchText(fullQuestionText(q));
  }
  function escapeHtml(s){ return esc(s); }
  function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function rawHighlightTokens(){
    const raw = getSearchValue();
    if(!raw) return [];
    const normalTokens = normalizeSearch(raw).split(' ').filter(t => t.length >= 2);
    const rawTokens = raw.split(/[^\p{L}\p{N}]+/u).filter(t => t.length >= 2);
    return Array.from(new Set([...rawTokens, ...normalTokens])).slice(0, 16).sort((a,b)=>b.length-a.length);
  }
  window.adminHighlightSearch = function(text){
    let out = escapeHtml(text || '');
    const tokens = rawHighlightTokens();
    if(!tokens.length) return out;
    for(const token of tokens){
      const re = new RegExp(`(${escapeRegExp(escapeHtml(token))})`, 'giu');
      out = out.replace(re, '<mark class="searchMark">$1</mark>');
    }
    return out;
  };
  function optionText(q,k){ return q?.options?.[k] || ''; }
  function subjectsFromQuestions(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function subjectCount(code){
    if(code === 'all') return (cache.questions || []).length;
    return (cache.questions || []).filter(q => (q.subject_code || 'HOD102') === code).length;
  }

  function imageSrcFromAny(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    if(Array.isArray(im)) return imageSrcFromAny(im[0]);
    return im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || '';
  }
  function imageList(q){
    let raw = q?.images;
    if(typeof raw === 'string'){
      const s = raw.trim();
      if((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))){
        try{ raw = JSON.parse(s); }catch(e){}
      }
    }
    if(!raw) return [];
    if(!Array.isArray(raw)) raw = [raw];
    return raw.map(imageSrcFromAny).filter(Boolean);
  }
  function imageSideHTML(q){
    const imgs = imageList(q);
    if(!imgs.length) return '';
    return `<aside class="adminSearchImageSide">${imgs.map(src => `<img src="${esc(src)}" loading="lazy" onclick="openImagePreviewAdmin('${encodeURIComponent(src)}')" onerror="this.classList.add('brokenImg')">`).join('')}</aside>`;
  }
  window.openImagePreviewAdmin = function(src){
    const realSrc = decodeURIComponent(src || '');
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(realSrc)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh.</p>'"></div>`);
  };

  window.setQuestionSubjectFilter = function(code){
    SEARCH_STATE.activeSubject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', SEARCH_STATE.activeSubject);
    renderQuestions();
  };

  window.renderQuestions = renderQuestions = function(){
    const subjects = subjectsFromQuestions();
    if(SEARCH_STATE.activeSubject !== 'all' && !subjects.includes(SEARCH_STATE.activeSubject)) SEARCH_STATE.activeSubject = 'all';
    const tabs = `<div class="questionSubjectTabs">
      <button class="subjectTab ${SEARCH_STATE.activeSubject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subjects.map(s=>`<button class="subjectTab ${SEARCH_STATE.activeSubject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;
    const arr = (cache.questions || [])
      .filter(q => SEARCH_STATE.activeSubject === 'all' || (q.subject_code || 'HOD102') === SEARCH_STATE.activeSubject)
      .filter(questionMatchesSmart)
      .sort((a,b)=>String(a.subject_code||'').localeCompare(String(b.subject_code||'')) || (Number(a.num)||0) - (Number(b.num)||0));

    const html = arr.map(q => {
      const hasImg = imageList(q).length > 0;
      return `<div class="item questionAdminItem ${hasImg ? 'hasRightImage' : ''}">
        <div class="questionAdminTop">
          <div class="questionAdminMeta"><div class="questionSubjectCode">${esc(q.subject_code || 'HOD102')}</div><b>Câu ${esc(q.num || q.id)}</b></div>
          ${q.is_active === false ? badge('hidden') : badge('active')}
        </div>
        <div class="questionAdminBody">
          <main class="questionAdminTextSide">
            <p class="questionPreview">${adminHighlightSearch(q.question || '')}</p>
            <div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${adminHighlightSearch(optionText(q,k))}</span>`).join('')}</div>
            <p class="muted answerLine">Đáp án: ${adminHighlightSearch(q.answer || '')}</p>
          </main>
          ${imageSideHTML(q)}
        </div>
        <div class="actions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
      </div>`;
    }).join('') || '<p class=muted>Không có câu hỏi.</p>';

    const note = getSearchValue()
      ? `Tìm thấy ${arr.length} / ${cache.questions.length} câu với từ khóa: “${esc(getSearchValue())}”.`
      : `Đang hiển thị ${arr.length} / ${cache.questions.length} câu${SEARCH_STATE.activeSubject !== 'all' ? ' của môn ' + esc(SEARCH_STATE.activeSubject) : ''}.`;
    $('questionList').innerHTML = toolbar + `<div class="questionResultNote smartSearchNote">${note}</div>` + html;
  };

  const searchInput = $('search');
  if(searchInput && !searchInput.__smartSearchPatched){
    searchInput.__smartSearchPatched = true;
    searchInput.addEventListener('input', () => render(), {passive:true});
  }
})();


// ===== FINAL_ADMIN_HIGHLIGHT_FULL_SEARCH_PHRASE_20260613 =====
// Highlight nguyên cụm từ tìm kiếm, vẫn bỏ qua dấu câu/khoảng trắng.
(function(){
  function stripVN(str){
    return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function isWordChar(ch){
    return /[\p{L}\p{N}]/u.test(ch || '');
  }
  function normalizeSearch(str){
    return stripVN(str)
      .toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function buildNormMap(text){
    const source = String(text || '');
    let norm = '';
    let map = [];
    let lastSpace = true;
    for(let i=0;i<source.length;i++){
      const raw = source[i];
      const stripped = stripVN(raw).toLowerCase();
      if(isWordChar(stripped)){
        for(const c of stripped){
          if(isWordChar(c)){
            norm += c;
            map.push(i);
            lastSpace = false;
          }
        }
      }else{
        if(!lastSpace){
          norm += ' ';
          map.push(i);
          lastSpace = true;
        }
      }
    }
    while(norm.endsWith(' ')){
      norm = norm.slice(0,-1);
      map.pop();
    }
    return {norm, map, source};
  }
  function rangesForPhrase(text, phrase){
    const needle = normalizeSearch(phrase);
    if(!needle) return [];
    const built = buildNormMap(text);
    const ranges = [];
    let pos = 0;
    while(true){
      const idx = built.norm.indexOf(needle, pos);
      if(idx < 0) break;
      const start = built.map[idx];
      let end = built.map[idx + needle.length - 1] + 1;
      while(end < built.source.length && !isWordChar(stripVN(built.source[end])) && !/[\s]/.test(built.source[end])) end++;
      ranges.push([start, end]);
      pos = idx + Math.max(needle.length, 1);
    }
    return ranges;
  }
  function escapeRegExp(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function fallbackTokenHighlight(text){
    let out = esc(text || '');
    const raw = String(document.getElementById('search')?.value || '').trim();
    if(!raw) return out;
    const tokens = Array.from(new Set(normalizeSearch(raw).split(' ').filter(t => t.length >= 2)))
      .slice(0, 16)
      .sort((a,b)=>b.length-a.length);
    for(const token of tokens){
      const re = new RegExp(`(${escapeRegExp(esc(token))})`, 'giu');
      out = out.replace(re, '<mark class="searchMark tokenMark">$1</mark>');
    }
    return out;
  }
  window.adminHighlightSearch = function(text){
    const raw = String(document.getElementById('search')?.value || '').trim();
    const source = String(text || '');
    if(!raw) return esc(source);
    const ranges = rangesForPhrase(source, raw);
    if(!ranges.length) return fallbackTokenHighlight(source);

    let html = '';
    let cursor = 0;
    for(const [s,e] of ranges){
      if(s < cursor) continue;
      html += esc(source.slice(cursor, s));
      html += `<mark class="searchMark phraseMark">${esc(source.slice(s, e))}</mark>`;
      cursor = e;
    }
    html += esc(source.slice(cursor));
    return html;
  };
})();


// ===== FINAL_ADMIN_SEARCH_EXACT_FILTER_AND_NUM_FIX_20260613 =====
// Fix tìm kiếm: chỉ hiện kết quả khớp, nhập số 3 thì ưu tiên hiện Câu 3, highlight nguyên cụm.
(function(){
  const STATE = { subject: localStorage.getItem('admin_question_subject_filter_v1') || 'all' };

  function searchRaw(){ return String($('search')?.value || '').trim(); }
  function stripVN(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(s){
    return stripVN(s).toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function compact(s){ return norm(s).replace(/\s+/g, ''); }
  function tokens(){ return norm(searchRaw()).split(' ').filter(x => x.length >= 2); }
  function onlyNumber(){
    const r = searchRaw();
    return /^\d+$/.test(r) ? Number(r) : null;
  }
  function qText(q){
    return `${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${q.answer || ''} ${q.answer_text || ''} ${safe(q.options || {})}`;
  }
  function matchesQuestion(q){
    const raw = searchRaw();
    if(!raw) return true;

    // Nếu chỉ nhập số, hiểu là tìm số câu. VD nhập 3 => chỉ hiện Câu 3.
    const n = onlyNumber();
    if(n !== null) return Number(q.num) === n || Number(q.id) === n;

    const hay = qText(q);
    const h = norm(hay);
    const needle = norm(raw);
    if(!needle) return true;
    if(h.includes(needle)) return true;
    if(compact(hay).includes(compact(raw))) return true;

    const ts = tokens();
    return ts.length ? ts.every(t => h.includes(t)) : false;
  }

  function isWordChar(ch){ return /[\p{L}\p{N}]/u.test(ch || ''); }
  function buildMap(text){
    const source = String(text || '');
    let n = '', map = [], lastSpace = true;
    for(let i=0;i<source.length;i++){
      const raw = source[i];
      const st = stripVN(raw).toLowerCase();
      if(isWordChar(st)){
        for(const c of st){
          if(isWordChar(c)){ n += c; map.push(i); lastSpace = false; }
        }
      }else if(!lastSpace){
        n += ' '; map.push(i); lastSpace = true;
      }
    }
    while(n.endsWith(' ')){ n = n.slice(0,-1); map.pop(); }
    return {n, map, source};
  }
  function phraseRanges(text, phrase){
    const needle = norm(phrase);
    if(!needle) return [];
    const built = buildMap(text);
    const out = [];
    let pos = 0;
    while(true){
      const idx = built.n.indexOf(needle, pos);
      if(idx < 0) break;
      const start = built.map[idx];
      const end = built.map[idx + needle.length - 1] + 1;
      out.push([start, end]);
      pos = idx + needle.length;
    }
    return out;
  }
  function escReg(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  window.adminHighlightSearch = function(text){
    const raw = searchRaw();
    const source = String(text || '');
    if(!raw) return esc(source);

    // số thì highlight số câu/ID khi text có đúng số đó
    const n = onlyNumber();
    if(n !== null){
      const re = new RegExp(`(^|\\D)(${escReg(String(n))})(?=\\D|$)`, 'g');
      return esc(source).replace(re, '$1<mark class="searchMark phraseMark">$2</mark>');
    }

    const ranges = phraseRanges(source, raw);
    if(ranges.length){
      let html = '', cur = 0;
      for(const [s,e] of ranges){
        if(s < cur) continue;
        html += esc(source.slice(cur, s));
        html += `<mark class="searchMark phraseMark">${esc(source.slice(s, e))}</mark>`;
        cur = e;
      }
      html += esc(source.slice(cur));
      return html;
    }

    // fallback: highlight từng token nếu cụm không nằm liền nhau
    let html = esc(source);
    const ts = Array.from(new Set(tokens())).slice(0, 16).sort((a,b)=>b.length-a.length);
    for(const t of ts){
      const re = new RegExp(`(${escReg(esc(t))})`, 'giu');
      html = html.replace(re, '<mark class="searchMark tokenMark">$1</mark>');
    }
    return html;
  };

  function optionText(q,k){ return q?.options?.[k] || ''; }
  function subjects(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function subjectCount(code){
    if(code === 'all') return (cache.questions || []).length;
    return (cache.questions || []).filter(q => (q.subject_code || 'HOD102') === code).length;
  }
  function imgSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    if(Array.isArray(im)) return imgSrc(im[0]);
    return im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || '';
  }
  function imgList(q){
    let raw = q.images;
    if(typeof raw === 'string'){
      const s = raw.trim();
      if((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))){ try{ raw = JSON.parse(s); }catch(e){} }
    }
    if(!raw) return [];
    if(!Array.isArray(raw)) raw = [raw];
    return raw.map(imgSrc).filter(Boolean);
  }
  function imgHTML(q){
    const imgs = imgList(q);
    if(!imgs.length) return '';
    return `<aside class="adminSearchImageSide">${imgs.map(src => `<img src="${esc(src)}" loading="lazy" onclick="openImagePreviewAdmin('${encodeURIComponent(src)}')" onerror="this.classList.add('brokenImg')">`).join('')}</aside>`;
  }
  window.openImagePreviewAdmin = function(src){
    const real = decodeURIComponent(src || '');
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(real)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh.</p>'"></div>`);
  };

  window.setQuestionSubjectFilter = function(code){
    STATE.subject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', STATE.subject);
    renderQuestions();
  };

  window.renderQuestions = renderQuestions = function(){
    const subs = subjects();
    if(STATE.subject !== 'all' && !subs.includes(STATE.subject)) STATE.subject = 'all';

    const tabs = `<div class="questionSubjectTabs">
      <button class="subjectTab ${STATE.subject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subs.map(s => `<button class="subjectTab ${STATE.subject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;

    const arr = (cache.questions || [])
      .filter(q => STATE.subject === 'all' || (q.subject_code || 'HOD102') === STATE.subject)
      .filter(matchesQuestion)
      .sort((a,b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')) || (Number(a.num)||0) - (Number(b.num)||0));

    const html = arr.map(q => {
      const hasImg = imgList(q).length > 0;
      return `<div class="item questionAdminItem ${hasImg ? 'hasRightImage' : ''}">
        <div class="questionAdminTop">
          <div class="questionAdminMeta"><div class="questionSubjectCode">${esc(q.subject_code || 'HOD102')}</div><b>Câu ${adminHighlightSearch(q.num || q.id)}</b></div>
          ${q.is_active === false ? badge('hidden') : badge('active')}
        </div>
        <div class="questionAdminBody">
          <main class="questionAdminTextSide">
            <p class="questionPreview">${adminHighlightSearch(q.question || '')}</p>
            <div class="adminOptionPreview">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${adminHighlightSearch(optionText(q,k))}</span>`).join('')}</div>
            <p class="muted answerLine">Đáp án: ${adminHighlightSearch(q.answer || '')}</p>
          </main>
          ${imgHTML(q)}
        </div>
        <div class="actions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
      </div>`;
    }).join('') || '<p class=muted>Không có câu hỏi.</p>';

    const raw = searchRaw();
    const note = raw
      ? `Tìm thấy ${arr.length} / ${cache.questions.length} câu với từ khóa: “${esc(raw)}”.`
      : `Đang hiển thị ${arr.length} / ${cache.questions.length} câu${STATE.subject !== 'all' ? ' của môn ' + esc(STATE.subject) : ''}.`;
    $('questionList').innerHTML = toolbar + `<div class="questionResultNote smartSearchNote">${note}</div>` + html;
  };

  const inp = $('search');
  if(inp && !inp.__exactSearchFix){
    inp.__exactSearchFix = true;
    inp.addEventListener('input', () => render(), {passive:true});
  }
})();


// ===== FINAL_ADMIN_COMPACT_COLLAPSE_SEARCH_UI_20260613 =====
// Thu gọn thẻ câu hỏi: mặc định chỉ hiện câu hỏi, bấm vào mới mở chi tiết.
// Giảm lag tìm kiếm: highlight nhẹ nguyên cụm, không quét quá nhiều token.
(function(){
  const STATE = {
    subject: localStorage.getItem('admin_question_subject_filter_v1') || 'all',
    open: new Set()
  };

  function rawSearch(){ return String($('search')?.value || '').trim(); }
  function stripVN(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function norm(s){
    return stripVN(s).toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function compact(s){ return norm(s).replace(/\s+/g,''); }
  function isNumSearch(){ return /^\d+$/.test(rawSearch()); }
  function numSearch(){ return isNumSearch() ? Number(rawSearch()) : null; }
  function textOf(q){ return `${q.subject_code||''} ${q.num||''} ${q.question||''} ${q.answer||''} ${q.answer_text||''} ${safe(q.options||{})}`; }
  function matches(q){
    const raw = rawSearch();
    if(!raw) return true;
    const n = numSearch();
    if(n !== null) return Number(q.num) === n || Number(q.id) === n;
    const hay = textOf(q);
    const h = norm(hay), needle = norm(raw);
    if(!needle) return true;
    if(h.includes(needle)) return true;
    if(compact(hay).includes(compact(raw))) return true;
    const ts = needle.split(' ').filter(x=>x.length>=2);
    return ts.length ? ts.every(t=>h.includes(t)) : false;
  }
  function isWord(ch){ return /[\p{L}\p{N}]/u.test(ch || ''); }
  function buildMap(text){
    const source = String(text || '');
    let n='', map=[], lastSpace=true;
    for(let i=0;i<source.length;i++){
      const st = stripVN(source[i]).toLowerCase();
      if(isWord(st)){
        for(const c of st){ if(isWord(c)){ n+=c; map.push(i); lastSpace=false; } }
      }else if(!lastSpace){ n+=' '; map.push(i); lastSpace=true; }
    }
    while(n.endsWith(' ')){ n=n.slice(0,-1); map.pop(); }
    return {n,map,source};
  }
  function phraseRange(text, phrase){
    const needle = norm(phrase);
    if(!needle || needle.length < 2) return null;
    const built = buildMap(text);
    const idx = built.n.indexOf(needle);
    if(idx < 0) return null;
    return [built.map[idx], built.map[idx + needle.length - 1] + 1];
  }
  window.adminHighlightSearch = function(text){
    const raw = rawSearch();
    const source = String(text || '');
    if(!raw) return esc(source);
    const n = numSearch();
    if(n !== null){
      const escaped = esc(source);
      return escaped.replace(new RegExp(`(^|\\D)(${String(n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})(?=\\D|$)`, 'g'), '$1<mark class="searchMark phraseMark lightMark">$2</mark>');
    }
    const r = phraseRange(source, raw);
    if(r){
      return esc(source.slice(0,r[0])) + `<mark class="searchMark phraseMark lightMark">${esc(source.slice(r[0],r[1]))}</mark>` + esc(source.slice(r[1]));
    }
    return esc(source);
  };

  function optionText(q,k){ return q?.options?.[k] || ''; }
  function subjects(){
    const set = new Set((cache.questions||[]).map(q=>q.subject_code||'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function subjectCount(code){
    if(code === 'all') return (cache.questions||[]).length;
    return (cache.questions||[]).filter(q=>(q.subject_code||'HOD102')===code).length;
  }
  function imgSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    if(Array.isArray(im)) return imgSrc(im[0]);
    return im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || '';
  }
  function imgList(q){
    let raw = q.images;
    if(typeof raw === 'string'){
      const s = raw.trim();
      if((s.startsWith('[')&&s.endsWith(']')) || (s.startsWith('{')&&s.endsWith('}'))){ try{ raw = JSON.parse(s); }catch(e){} }
    }
    if(!raw) return [];
    if(!Array.isArray(raw)) raw=[raw];
    return raw.map(imgSrc).filter(Boolean);
  }
  function imgHTML(q){
    const imgs = imgList(q);
    if(!imgs.length) return '';
    return `<aside class="adminSearchImageSide compactExpandedImage">${imgs.map(src=>`<img src="${esc(src)}" loading="lazy" onclick="event.stopPropagation();openImagePreviewAdmin('${encodeURIComponent(src)}')" onerror="this.classList.add('brokenImg')">`).join('')}</aside>`;
  }
  window.openImagePreviewAdmin = function(src){
    const real = decodeURIComponent(src || '');
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(real)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh.</p>'"></div>`);
  };
  window.toggleQuestionCardAdmin = function(id){
    id = String(id);
    if(STATE.open.has(id)) STATE.open.delete(id);
    else STATE.open.add(id);
    renderQuestions();
  };
  window.setQuestionSubjectFilter = function(code){
    STATE.subject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', STATE.subject);
    STATE.open.clear();
    renderQuestions();
  };

  window.renderQuestions = renderQuestions = function(){
    const subs = subjects();
    if(STATE.subject !== 'all' && !subs.includes(STATE.subject)) STATE.subject = 'all';
    const tabs = `<div class="questionSubjectTabs compactTabs">
      <button class="subjectTab ${STATE.subject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subs.map(s=>`<button class="subjectTab ${STATE.subject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar compactQuestionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div>`;
    const arr = (cache.questions||[])
      .filter(q=>STATE.subject==='all'||(q.subject_code||'HOD102')===STATE.subject)
      .filter(matches)
      .sort((a,b)=>String(a.subject_code||'').localeCompare(String(b.subject_code||'')) || (Number(a.num)||0)-(Number(b.num)||0));

    const html = arr.map(q=>{
      const id = String(q.id);
      const open = STATE.open.has(id);
      const hasImg = imgList(q).length > 0;
      return `<div class="item questionAdminItem compactQuestionCard ${open?'isOpen':'isClosed'} ${hasImg&&open?'hasRightImage':''}" onclick="toggleQuestionCardAdmin('${esc(id)}')">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="questionSubjectCode compactSubject">${esc(q.subject_code||'HOD102')}</span><b>Câu ${adminHighlightSearch(q.num||q.id)}</b></div>
          <p class="compactQuestionText">${adminHighlightSearch(q.question||'')}</p>
          <div class="compactCardRight">${q.is_active===false?badge('hidden'):badge('active')}<span class="expandHint">${open?'Thu gọn':'Mở'}</span></div>
        </div>
        ${open ? `<div class="compactCardDetails" onclick="event.stopPropagation()">
          <div class="questionAdminBody">
            <main class="questionAdminTextSide">
              <div class="adminOptionPreview compactOptions">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${adminHighlightSearch(optionText(q,k))}</span>`).join('')}</div>
              <p class="muted answerLine">Đáp án: ${adminHighlightSearch(q.answer||'')}</p>
            </main>
            ${imgHTML(q)}
          </div>
          <div class="actions compactActions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
        </div>` : ''}
      </div>`;
    }).join('') || '<p class=muted>Không có câu hỏi.</p>';

    const raw = rawSearch();
    const note = raw ? `Tìm thấy ${arr.length} / ${cache.questions.length} câu với từ khóa: “${esc(raw)}”.` : `Đang hiển thị ${arr.length} / ${cache.questions.length} câu${STATE.subject!=='all'?' của môn '+esc(STATE.subject):''}.`;
    $('questionList').innerHTML = toolbar + `<div class="questionResultNote smartSearchNote compactSearchNote">${note}</div>` + html;
  };
})();


// ===== FINAL_ADMIN_SEARCH_AUTO_EXPAND_ANSWER_MATCH_20260613 =====
// Khi tìm thấy từ khóa trong đáp án/câu trả lời thì tự xổ thẻ đó, đồng thời ẩn câu không khớp.
(function(){
  const STATE = {
    subject: localStorage.getItem('admin_question_subject_filter_v1') || 'all',
    open: new Set()
  };

  function rawSearch(){ return String($('search')?.value || '').trim(); }
  function stripVN(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function norm(s){
    return stripVN(s).toLowerCase()
      .replace(/['’`"“”.,;:!?()[\]{}<>/\\|_+\-=~@#$%^&*]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  function compact(s){ return norm(s).replace(/\s+/g,''); }
  function isNumSearch(){ return /^\d+$/.test(rawSearch()); }
  function numSearch(){ return isNumSearch() ? Number(rawSearch()) : null; }
  function optionText(q,k){ return q?.options?.[k] || ''; }
  function answerText(q){ return `${q.answer || ''} ${q.answer_text || ''} ${safe(q.options || {})}`; }
  function allText(q){ return `${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${answerText(q)}`; }
  function textMatches(text){
    const raw = rawSearch();
    if(!raw) return true;
    const needle = norm(raw);
    if(!needle) return true;
    const hay = norm(text);
    if(hay.includes(needle)) return true;
    if(compact(text).includes(compact(raw))) return true;
    const tokens = needle.split(' ').filter(x => x.length >= 2);
    return tokens.length ? tokens.every(t => hay.includes(t)) : false;
  }
  function matchesQuestion(q){
    const raw = rawSearch();
    if(!raw) return true;
    const n = numSearch();
    if(n !== null) return Number(q.num) === n || Number(q.id) === n;
    return textMatches(allText(q));
  }
  function answerMatches(q){
    const raw = rawSearch();
    if(!raw || isNumSearch()) return false;
    return textMatches(answerText(q));
  }

  function isWord(ch){ return /[\p{L}\p{N}]/u.test(ch || ''); }
  function buildMap(text){
    const source = String(text || '');
    let n='', map=[], lastSpace=true;
    for(let i=0;i<source.length;i++){
      const st = stripVN(source[i]).toLowerCase();
      if(isWord(st)){
        for(const c of st){ if(isWord(c)){ n+=c; map.push(i); lastSpace=false; } }
      }else if(!lastSpace){ n+=' '; map.push(i); lastSpace=true; }
    }
    while(n.endsWith(' ')){ n=n.slice(0,-1); map.pop(); }
    return {n,map,source};
  }
  function phraseRange(text, phrase){
    const needle = norm(phrase);
    if(!needle || needle.length < 2) return null;
    const built = buildMap(text);
    const idx = built.n.indexOf(needle);
    if(idx < 0) return null;
    return [built.map[idx], built.map[idx + needle.length - 1] + 1];
  }
  window.adminHighlightSearch = function(text){
    const raw = rawSearch();
    const source = String(text || '');
    if(!raw) return esc(source);
    const n = numSearch();
    if(n !== null){
      const escaped = esc(source);
      return escaped.replace(new RegExp(`(^|\\D)(${String(n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})(?=\\D|$)`, 'g'), '$1<mark class="searchMark phraseMark lightMark">$2</mark>');
    }
    const r = phraseRange(source, raw);
    if(r){
      return esc(source.slice(0,r[0])) + `<mark class="searchMark phraseMark lightMark">${esc(source.slice(r[0],r[1]))}</mark>` + esc(source.slice(r[1]));
    }
    return esc(source);
  };

  function subjects(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function subjectCount(code){
    if(code === 'all') return (cache.questions || []).length;
    return (cache.questions || []).filter(q => (q.subject_code || 'HOD102') === code).length;
  }
  function imgSrc(im){
    if(!im) return '';
    if(typeof im === 'string') return im;
    if(Array.isArray(im)) return imgSrc(im[0]);
    return im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || '';
  }
  function imgList(q){
    let raw = q.images;
    if(typeof raw === 'string'){
      const s = raw.trim();
      if((s.startsWith('[')&&s.endsWith(']')) || (s.startsWith('{')&&s.endsWith('}'))){ try{ raw = JSON.parse(s); }catch(e){} }
    }
    if(!raw) return [];
    if(!Array.isArray(raw)) raw=[raw];
    return raw.map(imgSrc).filter(Boolean);
  }
  function imgHTML(q){
    const imgs = imgList(q);
    if(!imgs.length) return '';
    return `<aside class="adminSearchImageSide compactExpandedImage">${imgs.map(src=>`<img src="${esc(src)}" loading="lazy" onclick="event.stopPropagation();openImagePreviewAdmin('${encodeURIComponent(src)}')" onerror="this.classList.add('brokenImg')">`).join('')}</aside>`;
  }
  window.openImagePreviewAdmin = function(src){
    const real = decodeURIComponent(src || '');
    openModal('Xem ảnh', `<div class="adminImagePreview"><img src="${esc(real)}" onerror="this.outerHTML='<p class=muted>Không mở được ảnh.</p>'"></div>`);
  };
  window.toggleQuestionCardAdmin = function(id){
    id = String(id);
    if(STATE.open.has(id)) STATE.open.delete(id);
    else STATE.open.add(id);
    renderQuestions();
  };
  window.setQuestionSubjectFilter = function(code){
    STATE.subject = code || 'all';
    localStorage.setItem('admin_question_subject_filter_v1', STATE.subject);
    STATE.open.clear();
    renderQuestions();
  };

  window.renderQuestions = renderQuestions = function(){
    const subs = subjects();
    if(STATE.subject !== 'all' && !subs.includes(STATE.subject)) STATE.subject = 'all';
    const tabs = `<div class="questionSubjectTabs compactTabs">
      <button class="subjectTab ${STATE.subject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả <b>${subjectCount('all')}</b></button>
      ${subs.map(s=>`<button class="subjectTab ${STATE.subject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)} <b>${subjectCount(s)}</b></button>`).join('')}
    </div>`;
    const toolbar = `<div class="questionToolbar compactQuestionToolbar"><div>${tabs}</div><div class="toolbarBtns"><button class="act addSubjectBtn" onclick="openAddSubjectAI()">+ Thêm môn</button></div></div>`;
    const arr = (cache.questions || [])
      .filter(q => STATE.subject === 'all' || (q.subject_code || 'HOD102') === STATE.subject)
      .filter(matchesQuestion)
      .sort((a,b)=>String(a.subject_code||'').localeCompare(String(b.subject_code||'')) || (Number(a.num)||0)-(Number(b.num)||0));

    const searching = !!rawSearch();
    const html = arr.map(q=>{
      const id = String(q.id);
      const autoOpen = searching && answerMatches(q);
      const open = STATE.open.has(id) || autoOpen;
      const hasImg = imgList(q).length > 0;
      return `<div class="item questionAdminItem compactQuestionCard ${open?'isOpen':'isClosed'} ${autoOpen?'autoOpenedAnswer':''} ${hasImg&&open?'hasRightImage':''}" onclick="toggleQuestionCardAdmin('${esc(id)}')">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="questionSubjectCode compactSubject">${esc(q.subject_code||'HOD102')}</span><b>Câu ${adminHighlightSearch(q.num||q.id)}</b></div>
          <p class="compactQuestionText">${adminHighlightSearch(q.question||'')}</p>
          <div class="compactCardRight">${autoOpen?'<span class="answerMatchChip">Khớp đáp án</span>':''}${q.is_active===false?badge('hidden'):badge('active')}<span class="expandHint">${open?'Thu gọn':'Mở'}</span></div>
        </div>
        ${open ? `<div class="compactCardDetails" onclick="event.stopPropagation()">
          <div class="questionAdminBody">
            <main class="questionAdminTextSide">
              <div class="adminOptionPreview compactOptions">${['A','B','C','D','E'].filter(k=>optionText(q,k)).map(k=>`<span class="${String(q.answer||'').includes(k)?'correctOpt':''}"><b>${k}</b> ${adminHighlightSearch(optionText(q,k))}</span>`).join('')}</div>
              <p class="muted answerLine">Đáp án: ${adminHighlightSearch(q.answer||'')}</p>
            </main>
            ${imgHTML(q)}
          </div>
          <div class="actions compactActions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div>
        </div>` : ''}
      </div>`;
    }).join('') || '<p class=muted>Không có câu hỏi.</p>';

    const raw = rawSearch();
    const note = raw ? `Tìm thấy ${arr.length} / ${cache.questions.length} câu với từ khóa: “${esc(raw)}”. Câu khớp trong đáp án sẽ tự mở.` : `Đang hiển thị ${arr.length} / ${cache.questions.length} câu${STATE.subject!=='all'?' của môn '+esc(STATE.subject):''}.`;
    $('questionList').innerHTML = toolbar + `<div class=”questionResultNote smartSearchNote compactSearchNote”>${note}</div>` + html;
  };
})();

// ===== TRASH_BIN_20260614 =====
(function(){
  let trashItems = [];

  window.loadTrash = async function(){
    if(!isAdmin()) return;
    const el = $('trashList');
    const cnt = $('trashCount');
    if(el) el.innerHTML = '<p class=”muted”>Đang tải...</p>';
    const {data, error} = await client.from('deleted_questions').select('*').order('deleted_at',{ascending:false});
    if(error){ if(el) el.innerHTML = '<p class=”muted”>Lỗi: '+esc(error.message)+'</p>'; return; }
    trashItems = data || [];
    if(cnt) cnt.textContent = trashItems.length + ' câu';
    if(!el) return;
    if(!trashItems.length){ el.innerHTML = '<p class=”muted”>Thùng rác trống.</p>'; return; }
    el.innerHTML = trashItems.map(t => {
      const q = t.original_data || {};
      return `<div class=”item trashItem”>
        <div class=”head”>
          <div><b>${esc(q.subject_code||'')} - Câu ${esc(String(q.num||q.id||'?'))}</b>
          <span class=”badge deleted”>Đã xóa</span></div>
          <span class=”muted”>${esc(date(t.deleted_at))} · ${esc(t.deleted_by_email||'')}</span>
        </div>
        <p>${esc(String(q.question||'').substring(0,120))}${(q.question||'').length>120?'...':''}</p>
        <p class=”muted”>Đáp án: ${esc(q.answer||'')}</p>
        <div class=”actions”>
          <button class=”act ok” onclick=”restoreQuestion(${t.id})”>Khôi phục</button>
          <button class=”act bad” onclick=”permanentDelete(${t.id})”>Xóa vĩnh viễn</button>
          <button class=”act” onclick=”viewTrashDetail(${t.id})”>Xem</button>
        </div>
      </div>`;
    }).join('');
  };

  window.restoreQuestion = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới khôi phục được.');
    const t = trashItems.find(x => x.id === id);
    if(!t) return alert('Không tìm thấy.');
    if(!confirm('Khôi phục câu hỏi này?')) return;
    setBusy(true,'Đang khôi phục...');
    try{
      const q = t.original_data;
      const ins = await client.from('questions').insert(q);
      if(ins.error) return alert('Không khôi phục được: '+ins.error.message);
      await client.from('deleted_questions').delete().eq('id',id);
      await logAction('restore_question','questions',q.id,{subject_code:q.subject_code,num:q.num});
      await loadAll();
      await loadTrash();
      toast('Đã khôi phục');
    }finally{ setBusy(false); }
  };

  window.permanentDelete = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    const t = trashItems.find(x => x.id === id);
    if(!t) return alert('Không tìm thấy.');
    const q = t.original_data || {};
    if(!confirm('Xóa VĨNH VIỄN câu '+esc(String(q.num||q.id||'?'))+'?\n\nKhông thể khôi phục sau thao tác này!')) return;
    setBusy(true,'Đang xóa vĩnh viễn...');
    try{
      const r = await client.from('deleted_questions').delete().eq('id',id);
      if(r.error) return alert('Lỗi: '+r.error.message);
      await logAction('permanent_delete','deleted_questions',id,{subject_code:q.subject_code,num:q.num});
      await loadTrash();
      toast('Đã xóa vĩnh viễn');
    }finally{ setBusy(false); }
  };

  window.viewTrashDetail = function(id){
    const t = trashItems.find(x => x.id === id);
    if(!t) return;
    const q = t.original_data || {};
    openModal('Chi tiết câu đã xóa',`
      <p><b>Môn:</b> ${esc(q.subject_code||'')}</p>
      <p><b>Câu ${esc(String(q.num||''))}:</b> ${esc(q.question||'')}</p>
      <p><b>Đáp án:</b> ${esc(q.answer||'')} ${q.answer_text?'- '+esc(q.answer_text):''}</p>
      <p><b>Xóa lúc:</b> ${esc(date(t.deleted_at))}</p>
      <p><b>Xóa bởi:</b> ${esc(t.deleted_by_email||'')}</p>
      <div class=”actions” style=”margin-top:12px”>
        <button class=”act ok” onclick=”restoreQuestion(${t.id});closeModal();”>Khôi phục</button>
        <button class=”act bad” onclick=”permanentDelete(${t.id});closeModal();”>Xóa vĩnh viễn</button>
      </div>
    `);
  };

  document.querySelectorAll('.nav').forEach(b => {
    if(b.dataset.page === 'trash'){
      b.addEventListener('click', () => setTimeout(loadTrash, 50));
    }
  });
})();


// ===== ACCESS_APPROVAL_ADMIN_20260624 =====
(function(){
  let approvalFilter = 'pending';

  function pendingUsers(){
    return (cache.profiles || []).filter(p => p.approved === false);
  }
  function approvedUsers(){
    return (cache.profiles || []).filter(p => p.approved !== false);
  }

  function updateApprovalBadge(){
    const count = pendingUsers().length;
    const badge = document.getElementById('approvalBadge');
    if(badge){
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
    const statPending = document.getElementById('statPending');
    if(statPending){
      const reqPending = (cache.requests || []).filter(x => x.status === 'pending').length;
      statPending.textContent = reqPending;
    }
  }

  function renderApprovalCounts(){
    const pend = pendingUsers().length;
    const appr = approvedUsers().length;
    const all = (cache.profiles || []).length;
    const ep = document.getElementById('afPending');
    const ea = document.getElementById('afApproved');
    const eall = document.getElementById('afAll');
    if(ep) ep.textContent = pend;
    if(ea) ea.textContent = appr;
    if(eall) eall.textContent = all;
  }

  window.filterApprovals = function(f){
    approvalFilter = f;
    document.querySelectorAll('.approvalFilter').forEach(b => {
      b.classList.toggle('active', b.dataset.af === f);
    });
    renderApprovals();
  };

  window.renderApprovals = renderApprovals;
  function renderApprovals(){
    renderApprovalCounts();
    updateApprovalBadge();

    const el = document.getElementById('approvalList');
    if(!el) return;

    let arr = cache.profiles || [];
    if(approvalFilter === 'pending') arr = arr.filter(p => p.approved === false);
    else if(approvalFilter === 'approved') arr = arr.filter(p => p.approved !== false);

    const k = (document.getElementById('search')?.value || '').trim().toLowerCase();
    if(k) arr = arr.filter(p => `${p.email || ''} ${p.id || ''}`.toLowerCase().includes(k));

    if(!arr.length){
      el.innerHTML = '<p class="muted">' + (approvalFilter === 'pending' ? 'Không có tài khoản nào đang chờ duyệt.' : 'Không có.') + '</p>';
      return;
    }

    el.innerHTML = arr.map(p => {
      const isPending = p.approved === false;
      const roleBadge = `<span class="badge ${esc(p.role || 'user')}">${esc(p.role || 'user')}</span>`;
      const statusBadge = isPending
        ? '<span class="badge rejected">Chờ duyệt</span>'
        : '<span class="badge approved">Đã duyệt</span>';
      const actions = isPending
        ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>`
        : `<button class="act warn" onclick="revokeApproval('${esc(p.id)}')">Thu hồi quyền</button>`;
      return `<div class="approvalCard ${isPending ? 'isPending' : ''}">
        <div class="approvalCardInfo">
          <div class="mail">${esc(p.email || p.id)}</div>
          <div class="meta">${roleBadge} ${statusBadge} · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login || p.created_at))}</div>
        </div>
        <div class="approvalCardActions">${isAdmin() ? actions : '<span class="muted">Chỉ admin</span>'}</div>
      </div>`;
    }).join('');
  }

  window.approveUser = async function(uid){
    if(!isAdmin()) return alert('Chỉ admin.');
    const p = (cache.profiles || []).find(x => x.id === uid);
    if(!p) return alert('Không tìm thấy user.');
    if(!confirm('Phê duyệt tài khoản: ' + (p.email || uid) + '?')) return;
    setBusy(true, 'Đang phê duyệt...');
    try{
      const r = await client.from('profiles').update({ approved: true }).eq('id', uid);
      if(r.error) return alert('Lỗi: ' + r.error.message);
      await logAction('approve_user', 'profiles', uid, { email: p.email });
      p.approved = true;
      renderApprovals();
      toast('Đã phê duyệt ' + (p.email || uid));
    }finally{ setBusy(false); }
  };

  window.rejectUser = async function(uid){
    if(!isAdmin()) return alert('Chỉ admin.');
    const p = (cache.profiles || []).find(x => x.id === uid);
    if(!p) return alert('Không tìm thấy user.');
    if(!confirm('Từ chối và XÓA tài khoản: ' + (p.email || uid) + '?\n\nUser sẽ phải đăng ký lại.')) return;
    setBusy(true, 'Đang xử lý...');
    try{
      const r = await client.from('profiles').delete().eq('id', uid);
      if(r.error) return alert('Lỗi: ' + r.error.message);
      await logAction('reject_user', 'profiles', uid, { email: p.email });
      cache.profiles = cache.profiles.filter(x => x.id !== uid);
      renderApprovals();
      toast('Đã từ chối ' + (p.email || uid));
    }finally{ setBusy(false); }
  };

  window.revokeApproval = async function(uid){
    if(!isAdmin()) return alert('Chỉ admin.');
    const p = (cache.profiles || []).find(x => x.id === uid);
    if(!p) return alert('Không tìm thấy user.');
    if(p.role === 'admin') return alert('Không thể thu hồi quyền truy cập của admin.');
    if(!confirm('Thu hồi quyền truy cập của: ' + (p.email || uid) + '?\n\nUser sẽ cần được phê duyệt lại.')) return;
    setBusy(true, 'Đang thu hồi...');
    try{
      const r = await client.from('profiles').update({ approved: false }).eq('id', uid);
      if(r.error) return alert('Lỗi: ' + r.error.message);
      await logAction('revoke_approval', 'profiles', uid, { email: p.email });
      p.approved = false;
      renderApprovals();
      toast('Đã thu hồi quyền ' + (p.email || uid));
    }finally{ setBusy(false); }
  };

  // === Registration Gate Toggle ===
  let registrationMode = 'approval';

  async function loadRegistrationMode(){
    try{
      const {data} = await client.from('site_settings').select('value').eq('key','registration_mode').maybeSingle();
      if(data && data.value) registrationMode = typeof data.value === 'string' ? data.value : JSON.stringify(data.value).replace(/"/g,'');
    }catch(e){ console.warn('Load reg mode error:', e); }
    updateRegistrationGateUI();
  }

  function updateRegistrationGateUI(){
    const status = document.getElementById('registrationGateStatus');
    const openBtn = document.getElementById('regGateOpen');
    const approvalBtn = document.getElementById('regGateApproval');
    const closedBtn = document.getElementById('regGateClosed');
    if(status){
      if(registrationMode === 'open') status.innerHTML = '<span style="color:#66bb6a;font-weight:900">MỞ</span> — Ai đăng ký cũng vào được ngay, không cần duyệt';
      else if(registrationMode === 'closed') status.innerHTML = '<span style="color:#ef5350;font-weight:900">ĐÓNG</span> — Không ai đăng ký mới được';
      else status.innerHTML = '<span style="color:#ffc107;font-weight:900">CẦN DUYỆT</span> — User mới phải chờ admin phê duyệt';
    }
    if(openBtn) openBtn.classList.toggle('active', registrationMode === 'open');
    if(approvalBtn) approvalBtn.classList.toggle('active', registrationMode === 'approval');
    if(closedBtn) closedBtn.classList.toggle('active', registrationMode === 'closed');
  }

  window.setRegistrationMode = async function(mode){
    if(!isAdmin()) return alert('Chỉ admin.');
    if(!confirm('Chuyển cổng đăng ký sang: ' + ({open:'MỞ — ai cũng vào được', approval:'CẦN DUYỆT — user mới phải chờ', closed:'ĐÓNG — chặn đăng ký mới'}[mode] || mode) + '?')) return;
    setBusy(true, 'Đang cập nhật...');
    try{
      const {error} = await client.from('site_settings').upsert({
        key: 'registration_mode',
        value: JSON.stringify(mode),
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      });
      if(error) return alert('Lỗi: ' + error.message);
      registrationMode = mode;
      updateRegistrationGateUI();
      await logAction('set_registration_mode', 'site_settings', 'registration_mode', { mode });
      toast('Đã chuyển cổng đăng ký: ' + mode);
    }finally{ setBusy(false); }
  };

  const _origRenderStats = renderStats;
  renderStats = function(){
    _origRenderStats();
    updateApprovalBadge();
    renderApprovalCounts();
    const statPA = document.getElementById('statPendingApproval');
    if(statPA) statPA.textContent = pendingUsers().length;
  };

  document.querySelectorAll('.nav').forEach(b => {
    if(b.dataset.page === 'approvals'){
      b.addEventListener('click', () => { setTimeout(renderApprovals, 50); loadRegistrationMode(); });
    }
  });

  const _origSetPage = setPage;
  setPage = function(id, n){
    _origSetPage(id, n);
    if(id === 'approvals'){ renderApprovals(); loadRegistrationMode(); }
  };

  setTimeout(loadRegistrationMode, 500);
})();


// ===== AI_IMPORT_QUESTIONS_20260624 =====
(function(){

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

  function getSubjects(){
    const set = new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort();
  }

  function getImportHTML(){
    const subjects = getSubjects();
    return `<div class="aiImportWrap">

      <div class="aiImportTabs">
        <button class="aiTab active" onclick="switchImportTab('prompt')">1. Lấy Prompt</button>
        <button class="aiTab" onclick="switchImportTab('import')">2. Import dữ liệu</button>
      </div>

      <div id="aiTabPrompt" class="aiTabContent active">
        <div class="aiStepCard">
          <div class="aiStepNum">1</div>
          <div class="aiStepBody">
            <h4>Copy prompt bên dưới</h4>
            <p>Bấm nút copy để sao chép prompt tạo câu hỏi.</p>
          </div>
        </div>
        <div class="aiPromptBox">
          <pre id="aiPromptText">${esc(AI_PROMPT)}</pre>
          <button class="act ok aiCopyBtn" onclick="copyAIPrompt()">📋 Copy Prompt</button>
        </div>

        <div class="aiStepCard">
          <div class="aiStepNum">2</div>
          <div class="aiStepBody">
            <h4>Mở AI và gửi tài liệu</h4>
            <p>Dán prompt vào một trong các AI bên dưới, sau đó upload/gửi tài liệu môn học kèm theo.</p>
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
            <p>Tải file AI trả về rồi import, hoặc copy JSON và dán vào tab <b>"Import dữ liệu"</b>.</p>
          </div>
        </div>
        <div class="actions formActions">
          <button class="act ok" onclick="switchImportTab('import')">Tiếp → Import dữ liệu</button>
        </div>
      </div>

      <div id="aiTabImport" class="aiTabContent">
        <div class="aiImportForm">
          <div class="field">
            <label>Môn học</label>
            <div class="aiSubjectRow">
              <select id="aiImportSubject">${subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
              <span>hoặc</span>
              <input id="aiImportNewSubject" placeholder="Mã môn mới (VD: ENG101)" style="width:160px">
            </div>
          </div>
          <div class="field">
            <label>Import từ file .md / .txt</label>
            <input type="file" id="aiImportFile" accept=".md,.txt,.json" style="width:100%;padding:8px;background:rgba(255,255,255,.035);border:1px solid var(--bd);border-radius:12px;color:var(--fog);">
            <p style="margin:4px 0 0;font-size:12px;color:var(--mist);">Chọn file .md hoặc .txt mà AI đã trả về. Hệ thống sẽ tự trích xuất JSON từ file.</p>
          </div>
          <div class="field">
            <label>Hoặc dán JSON trực tiếp</label>
            <textarea id="aiImportData" rows="14" placeholder='Dán mảng JSON câu hỏi vào đây...&#10;&#10;[&#10;  {&#10;    "num": 1,&#10;    "question": "...",&#10;    "options": {"A":"...","B":"...","C":"...","D":"..."},&#10;    "answer": "A",&#10;    "answer_text": "...",&#10;    "images": []&#10;  }&#10;]'></textarea>
          </div>
          <div id="aiImportPreview" class="aiImportPreview hidden"></div>
          <div class="actions formActions">
            <button class="act" onclick="previewAIImport()">Xem trước</button>
            <button class="act ok" id="aiImportBtn" onclick="executeAIImport()" disabled>Import câu hỏi</button>
            <button class="act" onclick="closeModal()">Hủy</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  let parsedQuestions = [];

  window.switchImportTab = function(tab){
    document.querySelectorAll('.aiTab').forEach(b => b.classList.toggle('active', b.textContent.includes(tab === 'prompt' ? 'Prompt' : 'Import')));
    document.getElementById('aiTabPrompt')?.classList.toggle('active', tab === 'prompt');
    document.getElementById('aiTabImport')?.classList.toggle('active', tab === 'import');
  };

  window.copyAIPrompt = function(){
    const text = AI_PROMPT;
    navigator.clipboard.writeText(text).then(() => {
      toast('Đã copy prompt!');
    }).catch(() => {
      const el = document.getElementById('aiPromptText');
      if(el){
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast('Hãy bấm Ctrl+C để copy');
      }
    });
  };

  window.previewAIImport = function(){
    const raw = (document.getElementById('aiImportData')?.value || '').trim();
    const preview = document.getElementById('aiImportPreview');
    const btn = document.getElementById('aiImportBtn');
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
      if(!q.question) errors.push(`Câu ${i+1}: thiếu "question"`);
      if(!q.options || typeof q.options !== 'object') errors.push(`Câu ${i+1}: thiếu "options"`);
      if(!q.answer) errors.push(`Câu ${i+1}: thiếu "answer"`);
    });
    if(errors.length){
      alert('Dữ liệu có lỗi:\n\n' + errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n...và ${errors.length-10} lỗi khác` : ''));
      return;
    }

    parsedQuestions = data;
    if(preview){
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div class="aiPreviewHeader">
          <b>Xem trước: ${data.length} câu hỏi</b>
        </div>
        <div class="aiPreviewList">${data.slice(0, 8).map((q, i) => `
          <div class="aiPreviewItem">
            <span class="aiPreviewNum">Câu ${q.num || (i+1)}</span>
            <span class="aiPreviewQ">${esc((q.question || '').substring(0, 100))}${(q.question||'').length>100?'...':''}</span>
            <span class="aiPreviewA">Đáp án: ${esc(q.answer || '?')}</span>
          </div>
        `).join('')}${data.length > 8 ? `<div class="aiPreviewMore">...và ${data.length - 8} câu khác</div>` : ''}</div>
      `;
    }
    if(btn) btn.disabled = false;
    toast('OK! ' + data.length + ' câu hỏi sẵn sàng import');
  };

  window.executeAIImport = async function(){
    if(!parsedQuestions.length) return alert('Chưa có dữ liệu. Hãy dán JSON và bấm Xem trước.');
    if(!isEditor()) return alert('Chỉ Admin/Editor mới import được.');

    const subjectSelect = document.getElementById('aiImportSubject')?.value || '';
    const newSubject = (document.getElementById('aiImportNewSubject')?.value || '').trim().toUpperCase();
    const subject = newSubject || subjectSelect || 'HOD102';

    if(!confirm(`Import ${parsedQuestions.length} câu hỏi vào môn "${subject}"?\n\nCâu trùng số sẽ bị lỗi và bỏ qua.`)) return;

    setBusy(true, 'Đang import...');
    let success = 0, errors = 0;
    try{
      const existingNums = new Set(
        (cache.questions || [])
          .filter(q => (q.subject_code || 'HOD102') === subject)
          .map(q => Number(q.num))
      );

      let nextNum = existingNums.size ? Math.max(...existingNums) + 1 : 1;

      for(const q of parsedQuestions){
        let num = Number(q.num) || nextNum;
        if(existingNums.has(num)){
          num = nextNum;
        }
        existingNums.add(num);
        nextNum = Math.max(nextNum, num) + 1;

        const payload = {
          subject_code: subject,
          num,
          question: q.question || '',
          options: q.options || {},
          answer: (q.answer || '').toUpperCase(),
          answer_text: q.answer_text || '',
          images: q.images || [],
          is_active: true,
          updated_at: new Date().toISOString()
        };

        const r = await client.from('questions').insert(payload);
        if(r.error){
          console.warn('Import lỗi câu ' + num + ':', r.error.message);
          errors++;
        } else {
          success++;
        }
      }

      await logAction('ai_import_questions', 'questions', subject, {
        count: parsedQuestions.length,
        success,
        errors,
        subject_code: subject
      });

      closeModal();
      await loadAll();
      toast(`Import xong: ${success} thành công${errors ? ', ' + errors + ' lỗi' : ''}`);
      parsedQuestions = [];

    }finally{
      setBusy(false);
    }
  };

  window.openAddSubjectAI = function(){
    parsedQuestions = [];
    openModal('Thêm môn học bằng AI', getImportHTML());
    setTimeout(() => {
      const fileInput = document.getElementById('aiImportFile');
      if(fileInput){
        fileInput.addEventListener('change', function(e){
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
            const ta = document.getElementById('aiImportData');
            if(ta) ta.value = jsonStr.trim();
            toast('Đã đọc file ' + file.name);
            previewAIImport();
          };
          reader.readAsText(file);
        });
      }
    }, 100);
  };
})();


// ===== SUBJECT_MANAGEMENT_20260625 =====
(function(){
  const $ = id => document.getElementById(id);

  // --- Admin xóa môn học (chuyển vào thùng rác) ---
  window.deleteSubjectAdmin = async function(code){
    if(!isAdmin()) return alert('Chỉ admin mới được xóa môn.');
    if(!confirm('Xóa môn "'+code+'"?\n\nMôn học và tất cả câu hỏi sẽ được chuyển vào Thùng rác.')) return;

    setBusy(true, 'Đang xóa môn...');
    try{
      const {data:subjectData} = await client.from('subjects').select('*').eq('code', code).maybeSingle();
      const {data:questionsData} = await client.from('questions').select('*').eq('subject_code', code);

      const backup = {
        subject: subjectData,
        questions: questionsData || [],
        deleted_at: new Date().toISOString()
      };

      await client.from('deleted_subjects').insert({
        original_data: backup,
        deleted_by: user?.id,
        deleted_by_email: user?.email || profile?.email
      });

      if(questionsData && questionsData.length){
        for(const q of questionsData){
          await client.from('questions').delete().eq('id', q.id);
        }
      }

      await client.from('subjects').delete().eq('code', code);

      await logAction('delete_subject', 'subjects', code, {
        subject_code: code,
        questions_count: (questionsData||[]).length
      });

      await loadAll();
      toast('Đã chuyển môn '+code+' vào Thùng rác');
    } catch(e){
      console.warn('Delete subject error:', e);
      alert('Lỗi khi xóa môn: '+(e.message||e));
    } finally {
      setBusy(false);
    }
  };

  // --- Subject request approval (phê duyệt yêu cầu thêm môn từ user) ---
  let subjectRequests = [];

  window.loadSubjectRequests = async function(){
    if(!isEditor()) return;
    const {data, error} = await client.from('subject_requests').select('*').order('created_at',{ascending:false});
    if(error){ console.warn('Load subject requests error:', error); return; }
    subjectRequests = data || [];
    renderSubjectRequests();
    updateSubjectRequestBadge();
  };

  function updateSubjectRequestBadge(){
    const badge = $('subjectRequestBadge');
    const pending = subjectRequests.filter(r => r.status === 'pending').length;
    if(badge){
      badge.textContent = pending;
      badge.classList.toggle('hidden', !pending);
    }
  }

  window.filterSubjectRequests = function(status){
    document.querySelectorAll('.subjectReqFilter').forEach(b => b.classList.toggle('active', b.dataset.srf === status));
    renderSubjectRequests(status);
  };

  function renderSubjectRequests(filter){
    filter = filter || 'pending';
    const el = $('subjectRequestList');
    if(!el) return;

    const filtered = filter === 'all' ? subjectRequests : subjectRequests.filter(r => r.status === filter);
    const pendingCount = subjectRequests.filter(r => r.status === 'pending').length;
    const approvedCount = subjectRequests.filter(r => r.status === 'approved').length;
    const rejectedCount = subjectRequests.filter(r => r.status === 'rejected').length;

    if($('srfPending')) $('srfPending').textContent = pendingCount;
    if($('srfApproved')) $('srfApproved').textContent = approvedCount;
    if($('srfRejected')) $('srfRejected').textContent = rejectedCount;
    if($('srfAll')) $('srfAll').textContent = subjectRequests.length;

    if(!filtered.length){
      el.innerHTML = '<p class="muted">Không có yêu cầu nào.</p>';
      return;
    }

    el.innerHTML = filtered.map(r => {
      const questionsCount = Array.isArray(r.questions_data) ? r.questions_data.length : 0;
      const statusBadge = r.status === 'pending' ? '<span class="badge pending">Chờ duyệt</span>' :
                          r.status === 'approved' ? '<span class="badge approved">Đã duyệt</span>' :
                          '<span class="badge rejected">Từ chối</span>';
      return `<div class="item subjectRequestItem">
        <div class="head">
          <div>
            <b>${esc(r.code)}</b> - ${esc(r.name)} ${statusBadge}
            <br><span class="muted">${esc(r.user_email || '?')} · ${new Date(r.created_at).toLocaleString('vi-VN')}</span>
            ${r.description ? '<br><span class="muted">Mô tả: '+esc(r.description)+'</span>' : ''}
            <br><span class="muted">${questionsCount} câu hỏi đính kèm</span>
            ${r.admin_note ? '<br><span class="muted">Ghi chú: '+esc(r.admin_note)+'</span>' : ''}
          </div>
        </div>
        <div class="actions">
          ${questionsCount ? `<button class="act" onclick="previewSubjectRequestQuestions(${r.id})">Xem câu hỏi</button>` : ''}
          ${r.status === 'pending' ? `
            <button class="act ok" onclick="approveSubjectRequest(${r.id})">Duyệt</button>
            <button class="act bad" onclick="rejectSubjectRequest(${r.id})">Từ chối</button>
          ` : ''}
        </div>
      </div>`;
    }).join('');
  }

  window.previewSubjectRequestQuestions = function(id){
    const r = subjectRequests.find(x => x.id === id);
    if(!r || !r.questions_data) return;
    const qs = r.questions_data;
    const html = qs.slice(0, 20).map((q, i) => {
      const hasImg = q.images && q.images.length;
      return `<div class="item">
        <b>Câu ${q.num||(i+1)}</b>: ${esc((q.question||'').substring(0,150))}
        <br><span class="muted">Đáp án: ${esc(q.answer||'?')} ${hasImg ? '🖼 có hình ảnh' : ''}</span>
      </div>`;
    }).join('');
    const more = qs.length > 20 ? '<p class="muted">...và '+(qs.length-20)+' câu khác</p>' : '';
    openModal('Xem trước câu hỏi - '+esc(r.code), '<div>'+html+more+'</div>');
  };

  window.approveSubjectRequest = async function(id){
    if(!isEditor()) return alert('Chỉ Admin/Editor mới duyệt được.');
    const r = subjectRequests.find(x => x.id === id);
    if(!r) return alert('Không tìm thấy yêu cầu.');
    if(!confirm('Duyệt yêu cầu thêm môn "'+r.code+'" từ '+r.user_email+'?')) return;

    setBusy(true, 'Đang duyệt...');
    try{
      const {data:existing} = await client.from('subjects').select('code').eq('code', r.code).maybeSingle();
      if(existing){
        alert('Mã môn '+r.code+' đã tồn tại. Hãy từ chối yêu cầu hoặc xóa môn cũ trước.');
        return;
      }

      const maxOrder = await client.from('subjects').select('sort_order').order('sort_order',{ascending:false}).limit(1);
      const nextOrder = ((maxOrder.data?.[0]?.sort_order)||0)+1;

      const {error:subError} = await client.from('subjects').insert({
        code: r.code, name: r.name, description: r.description || null,
        is_active: true, sort_order: nextOrder
      });
      if(subError){ alert('Lỗi tạo môn: '+subError.message); return; }

      if(Array.isArray(r.questions_data) && r.questions_data.length){
        let success=0, errors=0;
        for(let i=0; i<r.questions_data.length; i++){
          const q = r.questions_data[i];
          const payload = {
            subject_code: r.code,
            num: q.num || (i+1),
            question: q.question || '',
            options: q.options || {},
            answer: (q.answer || '').toUpperCase(),
            answer_text: q.answer_text || '',
            images: q.images || [],
            is_active: true,
            updated_at: new Date().toISOString()
          };
          const res = await client.from('questions').insert(payload);
          if(res.error) errors++; else success++;
        }
        toast('Đã thêm '+success+' câu hỏi'+(errors?' ('+errors+' lỗi)':''));
      }

      await client.from('subject_requests').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id
      }).eq('id', id);

      await logAction('approve_subject_request', 'subject_requests', id, {
        code: r.code, name: r.name, questions: (r.questions_data||[]).length
      });

      await loadAll();
      await loadSubjectRequests();
      toast('Đã duyệt môn '+r.code);
    } catch(e){
      console.warn('Approve subject request error:', e);
      alert('Lỗi: '+(e.message||e));
    } finally {
      setBusy(false);
    }
  };

  window.rejectSubjectRequest = async function(id){
    if(!isEditor()) return alert('Chỉ Admin/Editor mới từ chối được.');
    const r = subjectRequests.find(x => x.id === id);
    if(!r) return alert('Không tìm thấy yêu cầu.');
    const note = prompt('Lý do từ chối (có thể bỏ trống):');
    if(note === null) return;

    setBusy(true, 'Đang từ chối...');
    try{
      await client.from('subject_requests').update({
        status: 'rejected',
        admin_note: note || '',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id
      }).eq('id', id);

      await logAction('reject_subject_request', 'subject_requests', id, {
        code: r.code, reason: note
      });

      await loadSubjectRequests();
      toast('Đã từ chối yêu cầu '+r.code);
    } finally {
      setBusy(false);
    }
  };

  // --- Restore deleted subject ---
  window.restoreSubject = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới khôi phục được.');
    const {data:item} = await client.from('deleted_subjects').select('*').eq('id', id).maybeSingle();
    if(!item) return alert('Không tìm thấy.');
    if(!confirm('Khôi phục môn học này?')) return;

    setBusy(true, 'Đang khôi phục...');
    try{
      const backup = item.original_data;
      if(backup.subject){
        const {error} = await client.from('subjects').insert(backup.subject);
        if(error && !error.message?.includes('duplicate')){ alert('Lỗi khôi phục môn: '+error.message); return; }
      }
      if(backup.questions && backup.questions.length){
        for(const q of backup.questions){
          await client.from('questions').insert(q).catch(()=>{});
        }
      }
      await client.from('deleted_subjects').delete().eq('id', id);
      await logAction('restore_subject', 'subjects', backup.subject?.code, {questions: backup.questions?.length});
      await loadAll();
      await loadTrash();
      toast('Đã khôi phục môn '+(backup.subject?.code||''));
    } finally {
      setBusy(false);
    }
  };

  // Load subject requests when navigating to the page
  const origSetPage = setPage;
  setPage = function(id, n){
    origSetPage(id, n);
    if(id === 'subjectRequests') loadSubjectRequests();
  };

  function injectDeleteIcons(){
    if(!isAdmin()) return;
    document.querySelectorAll('.subjectTab[onclick*="setQuestionSubjectFilter"]').forEach(btn => {
      const match = (btn.getAttribute('onclick')||'').match(/setQuestionSubjectFilter\('([^']+)'\)/);
      const code = match ? match[1] : '';
      if(code && code !== 'all' && !btn.querySelector('.deleteSubjectIcon')){
        const del = document.createElement('span');
        del.className = 'deleteSubjectIcon';
        del.textContent = '×';
        del.title = 'Xóa môn '+code;
        del.onclick = function(e){
          e.stopPropagation();
          deleteSubjectAdmin(code);
        };
        btn.appendChild(del);
      }
    });
  }
  setInterval(injectDeleteIcons, 800);
})();


// ===== TRASH_SUBJECTS_PATCH_20260625 =====
(function(){
  const origLoadTrash = window.loadTrash;
  window.loadTrash = async function(){
    if(typeof origLoadTrash === 'function') await origLoadTrash();
    if(!isAdmin()) return;

    const el = document.getElementById('trashList');
    if(!el) return;

    const {data, error} = await client.from('deleted_subjects').select('*').order('deleted_at',{ascending:false});
    if(error || !data || !data.length) return;

    const subjectTrashHTML = data.map(t => {
      const backup = t.original_data || {};
      const sub = backup.subject || {};
      const qCount = (backup.questions || []).length;
      return `<div class="item trashItem">
        <div class="head">
          <div><b>MÔN: ${esc(sub.code||'?')} - ${esc(sub.name||'')}</b>
          <span class="badge deleted">Đã xóa</span></div>
          <span class="muted">${qCount} câu hỏi · Xóa bởi ${esc(t.deleted_by_email||'?')} · ${new Date(t.deleted_at).toLocaleString('vi-VN')}</span>
        </div>
        <div class="actions">
          <button class="act ok" onclick="restoreSubject(${t.id})">Khôi phục môn</button>
          <button class="act bad" onclick="permanentDeleteSubject(${t.id})">Xóa vĩnh viễn</button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = '<h4 style="margin:16px 0 8px;color:var(--gold2);">Môn học đã xóa</h4>' + subjectTrashHTML + '<hr style="border-color:rgba(255,255,255,.06);margin:16px 0;">' + '<h4 style="margin:0 0 8px;color:var(--gold2);">Câu hỏi đã xóa</h4>' + el.innerHTML;
  };

  window.permanentDeleteSubject = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    if(!confirm('Xóa VĨNH VIỄN môn học này?\n\nKhông thể khôi phục sau thao tác này!')) return;
    setBusy(true,'Đang xóa vĩnh viễn...');
    try{
      await client.from('deleted_subjects').delete().eq('id',id);
      await logAction('permanent_delete_subject','deleted_subjects',id,{});
      await loadTrash();
      toast('Đã xóa vĩnh viễn');
    }finally{ setBusy(false); }
  };
})();
