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
  $('errorBox').innerHTML = t;
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
  });
  $('logoutBtn').onclick = logout;
  $('denyLogout').onclick = logout;
  $('openStudy').onclick = () => open('index.html', '_blank');
  $('refreshBtn').onclick = loadAll;
  $('exportBtn').onclick = exportAll;
  $('search').oninput = render;
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
    if (!silent) err(`Lỗi bảng <b>${name}</b>: ${esc(r.error.message)}`);
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
    toast('Đã tải');
  } finally {
    setBusy(false);
  }
}

async function logAction(a, t, id, d) {
  if (!isAdmin()) return;
  try {
    await client.from('admin_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action: a,
      target_type: t,
      target_id: String(id || ''),
      details: d || {}
    });
  } catch (e) {}
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

    await client.from('edit_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    }).eq('id', id);
    await client.from('question_history').insert({
      question_id: r.question_id,
      request_id: r.id,
      previous_data: r.old_data,
      new_data: r.new_data,
      changed_by: r.user_id,
      approved_by: user.id
    });
    await logAction('approve_request', 'edit_requests', id, {});
    await loadAll();
  } finally {
    setBusy(false);
  }
}

async function rejectReq(id) {
  const r = cache.requests.find(x => x.id === id);
  if (!r || r.status !== 'pending') return;
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
  if (id === user.id && b) return alert('Không nên tự khóa tài khoản đang dùng.');
  if (!confirm(`${b ? 'Block' : 'Unblock'} user này?`)) return;
  const r = await client.from('profiles').update({ blocked: b }).eq('id', id);
  if (r.error) return alert(r.error.message);
  await logAction(b ? 'block_user' : 'unblock_user', 'profiles', id, {});
  loadAll();
}

async function setRole(id, role) {
  if (!isAdmin()) return alert('Chỉ admin được cấp/gỡ quyền.');
  if (id === user.id && role !== 'admin') return alert('Không nên tự gỡ quyền admin của tài khoản đang dùng.');
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
