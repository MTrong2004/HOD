const CONFIG = {
  SUPABASE_URL: 'https://kxyukiwhhorvxgxxxmfq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f'
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

function showProgress(title, current, total, detail = '') {
  let el = $('adminProgressOverlay');
  if(!el){
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
  $('adminProgressTitle').textContent = title;
  $('adminProgressBar').style.width = pct + '%';
  $('adminProgressPercent').textContent = pct + '% (' + current + '/' + total + ')';
  $('adminProgressDetail').textContent = detail;
  el.classList.remove('hidden');
}

function hideProgress() {
  const el = $('adminProgressOverlay');
  if(el) el.classList.add('hidden');
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

  try{
    var savedPage = sessionStorage.getItem('admin_current_page');
    var savedName = sessionStorage.getItem('admin_current_page_name');
    if(savedPage && savedPage !== 'overview'){
      var navBtn = document.querySelector('.nav[data-page="'+savedPage+'"]');
      if(navBtn){
        setPage(savedPage, savedName || navBtn.textContent.trim());
        if(savedPage === 'subjectsAdmin' && typeof window.loadSubjectsAdmin === 'function') window.loadSubjectsAdmin();
        if(savedPage === 'approvals' && typeof loadRegistrationMode === 'function') loadRegistrationMode();
        if(savedPage === 'trash' && typeof window.loadTrash === 'function') window.loadTrash();
        if(savedPage === 'subjectRequests' && typeof window.loadSubjectRequests === 'function') window.loadSubjectRequests();
      }
    }
  }catch(e){}
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
  // Xóa nhãn đăng nhập trong bộ nhớ tạm để lần sau đăng nhập lại Bot sẽ thông báo tiếp
  sessionStorage.removeItem('is_logged_in');

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
  try{ sessionStorage.setItem('admin_current_page', id); sessionStorage.setItem('admin_current_page_name', n); }catch(e){}
  render();
}

async function loadProfile() {
  const r = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
  profile = r.data || { id: user.id, email: user.email, role: 'user' };
  $('adminChip').textContent = `${profile.email || user.email} · ${profile.role}`;
  document.body.classList.toggle('role-admin', isAdmin());

  // ===== CHỈ THÔNG BÁO LOGIN KHI KHÔNG PHẢI LÀ F5 =====
  if (profile) {
    // Kiểm tra xem trong bộ nhớ tạm của lần duyệt này đã có nhãn "is_logged_in" chưa
    const isAlreadyNotified = sessionStorage.getItem('is_logged_in');

    if (!isAlreadyNotified) {
      // Nếu chưa có nhãn (tức là vừa đăng nhập mới hoặc đổi tài khoản), tiến hành gửi Discord
      await sendLoginToDiscord(profile.email || user.email, profile.role || 'user');
      
      // Gửi xong thì dán nhãn lại để nếu có F5 trang, Bot sẽ không gửi trùng nữa
      sessionStorage.setItem('is_logged_in', 'true');
    }
  }
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
    if(typeof loadRegistrationMode === 'function') loadRegistrationMode();
    toast('Đã tải');
  } finally {
    setBusy(false);
  }
}

async function logAction(a, t, id, d) {
  if (!isAdmin() || !user) return;
  try {
    // 1. Ghi vào Database Supabase để lưu trữ lịch sử hệ thống
    await client.from('admin_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action: a,
      target_type: t,
      target_id: String(id || ''),
      details: d || {}
    });

    // 2. Kích hoạt lệnh gửi thông báo màu sắc sang Discord ngay lập tức từ mạng của Web
    await sendActionToDiscord(a, t, id, d);
    
  } catch (e) { 
    console.warn('logAction failed:', e); 
  }
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

function hasAdminImageValue(v) {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') {
    const s = v.trim();
    return !!s && s !== '[]' && s !== '{}' && s.toLowerCase() !== 'không có';
  }
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return false;
}

function shouldShowAdminDiffField(field, oldData, newData) {
  if (field === 'answer_text') return false;
  if (field === 'images') {
    const changed = safe(oldData?.[field]) !== safe(newData?.[field]);
    return changed && (hasAdminImageValue(oldData?.[field]) || hasAdminImageValue(newData?.[field]));
  }
  return true;
}

function changedFieldKeys(oldData, newData) {
  return ['question', 'answer', 'options', 'images'].filter(k => {
    if (!shouldShowAdminDiffField(k, oldData, newData)) return false;
    return safe(oldData?.[k]) !== safe(newData?.[k]);
  });
}

function changedFields(r) {
  const oldData = r.old_data || getQuestionByReq(r) || {};
  const newData = r.new_data || {};
  return changedFieldKeys(oldData, newData);
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
  const fields = ['question', 'options', 'answer', 'images'].filter(f => shouldShowAdminDiffField(f, oldData || {}, newData || {}));
  if (!fields.length) {
    return `<div class="diffList compactDiffList"><p class="muted compactNoDiff">Không có nội dung cần hiển thị.</p></div>`;
  }
  return `<div class="diffList compactDiffList">${fields.map(f => {
    const before = formatValue(oldData?.[f]);
    const after = formatValue(newData?.[f]);
    const changed = before !== after;
    return `<section class="diffBlock ${changed ? 'changed' : ''} compactDiffBlock">
      <h3>${esc(labelField(f))}<span>${changed ? 'Đã đổi' : 'Không đổi'}</span></h3>
      <div class="compare compactCompare">
        <pre class="oldValue"><b>Trước</b>
${esc(before)}</pre>
        <pre class="newValue ${changed ? 'changedValue' : ''}"><b>Sau</b>
${esc(after)}</pre>
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
  openModal('Xuất dữ liệu', `
    <div style="padding:10px 0;">
      <p style="color:rgba(245,240,232,.72);margin-bottom:20px;font-size:0.9rem;line-height:1.4;">Chọn định dạng dữ liệu bạn muốn tải xuống từ Supabase:</p>
      <div style="display:grid;grid-template-columns:1fr;gap:12px;">
        <button class="act ok" id="exportBtnQuestions" style="width:100%;text-align:center;padding:12px;font-size:0.9rem;border-radius:8px;background:rgba(200,169,110,.16);color:var(--gold2);border:1px solid rgba(200,169,110,.35);font-weight:bold;cursor:pointer;">
          📦 Chỉ danh sách câu hỏi (${(cache.questions || []).length} câu)
        </button>
        <button class="act" id="exportBtnFull" style="width:100%;text-align:center;padding:12px;font-size:0.9rem;border-radius:8px;background:rgba(245,240,232,.04);color:var(--mist);border:1px solid var(--bd);font-weight:bold;cursor:pointer;">
          💾 Toàn bộ cơ sở dữ liệu (Sao lưu cấu hình, user, lịch sử...)
        </button>
      </div>
    </div>
  `);

  document.getElementById('exportBtnQuestions').onclick = () => {
    downloadExportFile('questions');
  };
  document.getElementById('exportBtnFull').onclick = () => {
    downloadExportFile('full');
  };
}

async function downloadExportFile(type) {
  let data, filename;
  if (type === 'questions') {
    data = cache.questions || [];
    filename = 'learninghub_questions_export.json';
    try { await logAction('export_data', 'questions', 'json', {}); } catch(e){}
  } else {
    data = cache;
    filename = 'learninghub_full_backup.json';
    try { await logAction('export_data', 'backup', 'json', {}); } catch(e){}
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  closeModal();
  toast('Đã xuất dữ liệu thành công!');
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
    return changedFieldKeys(oldData || {}, newData || {});
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
    return changedFieldKeys(oldData || {}, newData || {});
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

// (TRASH_BIN_20260614 removed — superseded by FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625)


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

  window.loadRegistrationMode = loadRegistrationMode;
  async function loadRegistrationMode(){
    try{
      const {data} = await client.from('site_settings').select('value').eq('key','registration_mode').maybeSingle();
      if(data && data.value){
        var v = typeof data.value === 'string' ? data.value : String(data.value);
        registrationMode = v.replace(/"/g,'').trim() || 'approval';
      }
    }catch(e){
      console.warn('Load reg mode error:', e);
      var status = document.getElementById('registrationGateStatus');
      if(status) status.innerHTML = '<span style="color:#ef5350">Lỗi tải trạng thái cổng đăng ký</span>';
      return;
    }
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
        value: mode,
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

      const total = parsedQuestions.length;
      for(let i = 0; i < total; i++){
        const q = parsedQuestions[i];
        showProgress('Đang import câu hỏi...', i + 1, total, `Đang nhập câu ${q.num || i+1}: ${q.question ? q.question.substring(0, 50) + '...' : ''}`);
        
        let num = Number(q.num) || nextNum;
        if(existingNums.has(num)){
          num = nextNum;
        }
        existingNums.add(num);
        nextNum = Math.max(nextNum, num) + 1;

        const list = q.images || [];
        const localHasImg = !!(list.length || q.has_image);
        const text = (q.question || '') + ' ' + Object.values(q.options || {}).join(' ');
        const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
        const hasPlaceholder = list.some(im => {
          const src = typeof im === 'string' ? im : (im.src || im.url || '');
          return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
        });
        
        let risk = q.error_risk || '';
        let reason = q.error_risk_reason || '';
        if(!risk){
          if((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)){
            risk = 'high';
            reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
          } else if((q.answer || '').length > 1){
            risk = 'medium';
            reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
          } else {
            risk = 'low';
          }
        }

        const payload = {
          subject_code: subject,
          num,
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
      hideProgress();
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
    
    setBusy(true, 'Đang kiểm tra thông tin môn...');
    let subjectData = null;
    let questionsCount = 0;
    try {
      const resSub = await client.from('subjects').select('*').eq('code', code).maybeSingle();
      if(resSub.error) throw new Error(resSub.error.message);
      subjectData = resSub.data;
      if(!subjectData) throw new Error('Không tìm thấy môn ' + code);
      
      const { count, error } = await client.from('questions').select('*', { count: 'exact', head: true }).eq('subject_code', code);
      if(!error) questionsCount = count || 0;
    } catch(err) {
      setBusy(false);
      return alert('Lỗi tải thông tin môn học: ' + err.message);
    }
    setBusy(false);

    const name = subjectData.name || '';
    
    openModal('Xác nhận xóa môn học', `
      <div style="padding:10px 0;">
        <div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:10px;padding:16px;margin-bottom:20px;color:#e74c3c;">
          <h3 style="margin-top:0;margin-bottom:8px;font-size:0.96rem;font-weight:bold;">⚠️ Cảnh báo hành động nguy hiểm!</h3>
          <p style="margin:0;font-size:0.86rem;line-height:1.45;color:rgba(245,240,232,.85);">
            Bạn đang yêu cầu xóa môn học <b>${esc(name)} (${esc(code)})</b>.
          </p>
        </div>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.88rem;color:rgba(245,240,232,.85);">
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">Mã môn:</td><td style="padding:8px 0;text-align:right;">${esc(code)}</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">Tên môn:</td><td style="padding:8px 0;text-align:right;">${esc(name)}</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">Số lượng câu hỏi:</td><td style="padding:8px 0;text-align:right;color:#e74c3c;font-weight:bold;">${questionsCount} câu hỏi sẽ bị xóa</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">Nơi lưu trữ sau xóa:</td><td style="padding:8px 0;text-align:right;color:#2ecc71;">Thùng rác (có thể khôi phục)</td></tr>
        </table>
        
        <div class="field" style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-size:0.84rem;color:rgba(245,240,232,.72);">Để xác nhận, vui lòng nhập mã môn học <b>${esc(code)}</b> vào ô bên dưới:</label>
          <input type="text" id="confirmDeleteSubjectCode" placeholder="Nhập ${esc(code)}" style="width:100%;padding:10px 14px;background:rgba(0,0,0,.22);border:1px solid rgba(200,169,110,.25);border-radius:8px;color:#fff;font-weight:bold;text-align:center;">
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="act" onclick="closeModal()" style="width:100%;text-align:center;padding:10px;font-size:0.88rem;font-weight:bold;border-radius:8px;">Hủy bỏ</button>
          <button class="act bad" id="btnConfirmDeleteSubject" disabled style="width:100%;text-align:center;padding:10px;font-size:0.88rem;font-weight:bold;border-radius:8px;opacity:0.5;cursor:not-allowed;">Xác nhận xóa</button>
        </div>
      </div>
    `);
    
    const input = document.getElementById('confirmDeleteSubjectCode');
    const btn = document.getElementById('btnConfirmDeleteSubject');
    if(input && btn) {
      input.oninput = function() {
        const match = input.value.trim().toUpperCase() === code.toUpperCase();
        btn.disabled = !match;
        btn.style.opacity = match ? '1' : '0.5';
        btn.style.cursor = match ? 'pointer' : 'not-allowed';
      };
      
      btn.onclick = async function() {
        closeModal();
        setBusy(true, 'Đang tiến hành xóa môn học...');
        try {
          const resQ = await client.from('questions').select('*').eq('subject_code', code);
          if(resQ.error) throw new Error('Không đọc được câu hỏi: '+resQ.error.message);
          const questionsData = resQ.data || [];

          const backup = {
            subject: subjectData,
            questions: questionsData,
            deleted_at: new Date().toISOString()
          };

          const insBackup = await client.from('deleted_subjects').insert({
            original_data: backup,
            deleted_by: user?.id,
            deleted_by_email: user?.email || profile?.email
          });
          if(insBackup.error) throw new Error('Không lưu backup vào thùng rác: '+insBackup.error.message);

          if(questionsData.length){
            const delQ = await client.from('questions').delete().eq('subject_code', code);
            if(delQ.error) throw new Error('Lỗi xóa câu hỏi: '+delQ.error.message);
          }

          const delS = await client.from('subjects').delete().eq('code', code);
          if(delS.error) throw new Error('Đã xóa câu hỏi nhưng lỗi xóa môn: '+delS.error.message);

          await logAction('delete_subject', 'subjects', code, {
            subject_code: code,
            questions_count: questionsData.length
          });

          await loadAll();
          if(typeof window.loadSubjectsAdmin === 'function') await window.loadSubjectsAdmin();
          toast('Đã chuyển môn '+code+' vào Thùng rác');
        } catch(e) {
          console.warn('Delete subject error:', e);
          alert('Lỗi khi xóa môn: '+(e.message||e));
        } finally {
          setBusy(false);
        }
      };
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
        const total = r.questions_data.length;
        for(let i=0; i<total; i++){
          const q = r.questions_data[i];
          showProgress('Đang nhập câu hỏi cho môn mới...', i + 1, total, `Đang xử lý câu ${q.num || i+1}: ${q.question ? q.question.substring(0, 50) + '...' : ''}`);
          const list = q.images || [];
          const localHasImg = !!(list.length || q.has_image);
          const text = (q.question || '') + ' ' + Object.values(q.options || {}).join(' ');
          const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
          const hasPlaceholder = list.some(im => {
            const src = typeof im === 'string' ? im : (im.src || im.url || '');
            return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
          });
          
          let risk = q.error_risk || '';
          let reason = q.error_risk_reason || '';
          if(!risk){
            if((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)){
              risk = 'high';
              reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
            } else if((q.answer || '').length > 1){
              risk = 'medium';
              reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
            } else {
              risk = 'low';
            }
          }

          const payload = {
            subject_code: r.code,
            num: q.num || (i+1),
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
      hideProgress();
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

  // (restoreSubject removed — superseded by FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625)

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


// (TRASH_SUBJECTS_PATCH_20260625 removed — superseded by FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625)

// ===== HOTFIX UX/UI ADMIN: NOTIFICATIONS & TRASH OVERLAPPING REPAIR =====
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  function date(d) {
    if (!d) return 'Chưa có';
    try { return new Date(d).toLocaleString('vi-VN'); } catch (e) { return d; }
  }

  // 1. Tiêm CSS tinh chỉnh giao diện nhỏ gọn và sửa lỗi đè layout
  function injectAdminStyles() {
    if ($('adminFixUiStyle')) return;
    const style = document.createElement('style');
    style.id = 'adminFixUiStyle';
    style.textContent = `
      /* Ô thông báo kết quả tìm kiếm nhỏ gọn, tinh tế hơn */
      .questionResultNote.smartSearchNote, 
      .questionResultNote.compactSearchNote,
      .questionResultNote {
        font-size: 0.85rem !important;
        padding: 8px 14px !important;
        margin: 10px 0 15px 0 !important;
        border-radius: 8px !important;
        background: rgba(232, 212, 168, 0.06) !important;
        border: 1px solid rgba(232, 212, 168, 0.2) !important;
        color: #e8d4a8 !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Thông báo Toast góc màn hình gọn gàng */
      .toast {
        font-size: 0.85rem !important;
        padding: 8px 16px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(232, 212, 168, 0.2) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important;
      }

      /* Tách biệt rõ ràng cấu trúc Thùng rác chống đè chồng */
      .trashBlockContainer {
        display: flex !important;
        flex-direction: column !important;
        gap: 25px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .trashGroup {
        background: rgba(255, 255, 255, 0.01) !important;
        border: 1px solid rgba(255, 255, 255, 0.04) !important;
        border-radius: 12px !important;
        padding: 16px !important;
      }
      .trashSectionHeading {
        margin: 0 0 14px 0 !important;
        color: #e8d4a8 !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        padding-bottom: 8px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .trashSectionHeading span {
        font-size: 0.8rem !important;
        opacity: 0.6 !important;
        font-weight: 400 !important;
        text-transform: none !important;
      }
      .trashGridWrapper {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }
      .item.trashItem {
        position: relative !important;
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        padding: 14px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. (loadTrash removed — superseded by FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625)

  // 3. Khắc phục lỗi dấu nháy thông minh ở chuỗi thông báo kết quả tìm kiếm câu hỏi
  const originalRenderQuestions = window.renderQuestions;
  if (typeof originalRenderQuestions === 'function') {
    window.renderQuestions = function() {
      originalRenderQuestions.apply(this, arguments);
      // Sửa lỗi chuỗi HTML chứa nháy thông minh nếu có sinh ra từ render gốc
      const noteEl = document.querySelector('.questionResultNote');
      if (noteEl) {
        injectAdminStyles();
      }
    };
  }

  // Khởi chạy ngay lập tức
  injectAdminStyles();
})();


// ===== FINAL_ADMIN_SUBJECT_EDIT_20260625 =====
// Quản lý môn học: sửa mã môn, tên môn và mô tả/nội dung môn.
(function(){
  let subjectEditCache = [];
  const $id = id => document.getElementById(id);

  function cleanPayload(obj){
    const out = {};
    Object.entries(obj || {}).forEach(([k,v]) => {
      if(v !== undefined) out[k] = v;
    });
    return out;
  }

  function currentSearchText(){
    return String($id('search')?.value || '').trim().toLowerCase();
  }

  function subjectMatches(s){
    const q = currentSearchText();
    if(!q) return true;
    return `${s.code||''} ${s.name||''} ${s.description||''}`.toLowerCase().includes(q);
  }

  function ensureSubjectAdminPage(){
    if(!$id('subjectAdminNav')){
      const side = document.querySelector('.side');
      const foot = document.querySelector('.foot');
      if(side){
        const btn = document.createElement('button');
        btn.id = 'subjectAdminNav';
        btn.className = 'nav';
        btn.type = 'button';
        btn.dataset.page = 'subjectsAdmin';
        btn.textContent = 'Môn học';
        btn.onclick = () => {
          setPage('subjectsAdmin', 'Quản lý môn học');
          loadSubjectsAdmin();
        };
        side.insertBefore(btn, foot || null);
      }
    }

    if(!$id('subjectsAdmin')){
      const ws = document.querySelector('.workspace');
      if(!ws) return;
      const page = document.createElement('section');
      page.id = 'subjectsAdmin';
      page.className = 'page';
      page.innerHTML = `
        <div class="panel panelFill subjectAdminPanel">
          <div class="subjectAdminHead">
            <div>
              <h3>Quản lý môn học</h3>
              <p class="muted">Sửa mã môn, tên môn và mô tả hiển thị ở màn hình chọn môn.</p>
            </div>
            <button class="act ok" type="button" onclick="loadSubjectsAdmin()">Tải lại môn</button>
          </div>
          <div id="subjectAdminList" class="subjectAdminList pageScroll"></div>
        </div>`;
      ws.appendChild(page);
    }
  }

  window.loadSubjectsAdmin = async function(){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    ensureSubjectAdminPage();
    const list = $id('subjectAdminList');
    if(list) list.innerHTML = '<p class="muted">Đang tải môn học...</p>';
    setBusy(true, 'Đang tải môn...');
    try{
      const {data, error} = await client.from('subjects').select('*').order('sort_order',{ascending:true}).order('code',{ascending:true});
      if(error){
        if(list) list.innerHTML = '<p class="muted">Không tải được danh sách môn.</p>';
        return alert('Không tải được danh sách môn: ' + error.message);
      }
      subjectEditCache = data || [];
      renderSubjectAdminList();
    } finally {
      setBusy(false);
    }
  };

  window.renderSubjectAdminList = function(){
    ensureSubjectAdminPage();
    const list = $id('subjectAdminList');
    if(!list) return;
    const arr = subjectEditCache.filter(subjectMatches);
    if(!arr.length){
      list.innerHTML = '<p class="muted">Không có môn học phù hợp.</p>';
      return;
    }
    list.innerHTML = arr.map(s => `
      <div class="subjectAdminItem">
        <div class="subjectAdminCode">${esc(s.code || '')}</div>
        <div class="subjectAdminInfo">
          <b>${esc(s.name || s.code || 'Chưa có tên môn')}</b>
          <p>${esc(s.description || 'Môn học chưa có mô tả.')}</p>
        </div>
        <div class="subjectAdminActions">
          <button class="act warn" type="button" onclick="openEditSubjectAdmin('${esc(String(s.code||'')).replace(/'/g,'&#39;')}')">Sửa</button>
          ${isAdmin() ? `<button class="act bad" type="button" onclick="deleteSubjectAdmin('${esc(String(s.code||'')).replace(/'/g,'&#39;')}')">Xóa</button>` : ''}
        </div>
      </div>`).join('');
  };

  window.openEditSubjectAdmin = async function(code){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    let s = subjectEditCache.find(x => String(x.code) === String(code));
    if(!s){
      const res = await client.from('subjects').select('*').eq('code', code).maybeSingle();
      if(res.error || !res.data) return alert('Không tìm thấy môn học.');
      s = res.data;
    }
    openModal('Sửa môn học', `
      <div class="editSubjectForm">
        <div class="editSubjectNotice">
          Nếu đổi <b>mã môn</b>, hệ thống cũng sẽ chuyển toàn bộ câu hỏi của môn cũ sang mã môn mới.
        </div>
        <div class="formGrid2">
          <div class="field">
            <label>Mã môn</label>
            <input id="editSubjectOldCode" type="hidden" value="${esc(s.code || '')}">
            <input id="editSubjectCode" value="${esc(s.code || '')}" maxlength="20" placeholder="VD: MLN111">
          </div>
          <div class="field">
            <label>Tên môn học</label>
            <input id="editSubjectName" value="${esc(s.name || '')}" maxlength="120" placeholder="VD: Triết học Mác - Lênin">
          </div>
        </div>
        <div class="field">
          <label>Nội dung / mô tả môn</label>
          <textarea id="editSubjectDesc" rows="5" maxlength="600" placeholder="Mô tả ngắn hiển thị ở thẻ môn...">${esc(s.description || '')}</textarea>
        </div>
        <div class="editSubjectMeta">
          <span>Trạng thái: ${s.is_active === false ? 'Đang ẩn' : 'Đang hiện'}</span>
          <span>Thứ tự: ${esc(s.sort_order ?? '')}</span>
        </div>
        <div class="actions editSubjectActions">
          <button class="act ok" type="button" onclick="saveSubjectAdmin()">Lưu thay đổi</button>
          <button class="act" type="button" onclick="closeModal()">Đóng</button>
        </div>
      </div>`);
    setTimeout(() => {
      const input = $id('editSubjectCode');
      if(input){
        input.oninput = function(){ this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g,''); };
        input.focus();
      }
    }, 0);
  };

  window.saveSubjectAdmin = async function(){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    const oldCode = ($id('editSubjectOldCode')?.value || '').trim().toUpperCase();
    const newCode = ($id('editSubjectCode')?.value || '').trim().toUpperCase();
    const name = ($id('editSubjectName')?.value || '').trim();
    const description = ($id('editSubjectDesc')?.value || '').trim();
    if(!oldCode) return alert('Thiếu mã môn cũ.');
    if(!newCode) return alert('Mã môn không được để trống.');
    if(!/^[A-Z0-9_]{2,20}$/.test(newCode)) return alert('Mã môn chỉ gồm chữ, số, gạch dưới và dài 2-20 ký tự.');
    if(!name) return alert('Tên môn học không được để trống.');

    const subject = subjectEditCache.find(x => String(x.code) === String(oldCode)) || {};
    setBusy(true, 'Đang lưu môn...');
    try{
      if(newCode === oldCode){
        const {error} = await client.from('subjects').update({
          name,
          description: description || null
        }).eq('code', oldCode);
        if(error) return alert('Không lưu được môn: ' + error.message);
      } else {
        const check = await client.from('subjects').select('code').eq('code', newCode).maybeSingle();
        if(check.error) return alert('Không kiểm tra được mã môn mới: ' + check.error.message);
        if(check.data) return alert('Mã môn '+newCode+' đã tồn tại.');

        const insertPayload = cleanPayload({
          code: newCode,
          name,
          description: description || null,
          is_active: subject.is_active !== false,
          sort_order: subject.sort_order
        });
        const ins = await client.from('subjects').insert(insertPayload);
        if(ins.error) return alert('Không tạo được mã môn mới: ' + ins.error.message);

        const qUp = await client.from('questions').update({subject_code:newCode}).eq('subject_code', oldCode);
        if(qUp.error) return alert('Đã tạo môn mới nhưng chưa chuyển được câu hỏi: ' + qUp.error.message);

        const del = await client.from('subjects').delete().eq('code', oldCode);
        if(del.error) alert('Đã đổi mã và chuyển câu hỏi, nhưng chưa xóa được mã cũ: ' + del.error.message);
      }

      await logAction('edit_subject', 'subjects', oldCode, {
        old_code: oldCode,
        new_code: newCode,
        name,
        description
      });
      closeModal();
      await loadSubjectsAdmin();
      await loadAll();
      toast('Đã lưu môn học '+newCode);
    } catch(e){
      console.warn('saveSubjectAdmin error:', e);
      alert('Lỗi khi lưu môn: '+(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  function patchSearchRender(){
    const input = $id('search');
    if(input && !input.__subjectAdminSearchPatched){
      input.__subjectAdminSearchPatched = true;
      input.addEventListener('input', () => {
        if($id('subjectsAdmin')?.classList.contains('active')) renderSubjectAdminList();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { ensureSubjectAdminPage(); patchSearchRender(); }, 600);
    setInterval(() => { ensureSubjectAdminPage(); patchSearchRender(); }, 2000);
  });
})();

// SIDEBAR_TREE_LAYOUT_20260625
// Sidebar dạng cây thư mục gọn: giữ màu cũ, icon đơn giản, thẻ con thụt nhẹ.
(function(){
  const STORE_KEY = 'admin_sidebar_tree_collapsed_v4';
  const GROUPS = [
    { title:'Duyệt', icon:'✓', keys:['approvals','requests','subjectRequests'] },
    { title:'Nội dung', icon:'□', keys:['subjectsAdmin','questions','trash'] },
    { title:'Hệ thống', icon:'⚙', keys:['users','history','logs'] }
  ];
  const SHORT = {
    overview:'TQ', approvals:'PD', requests:'YS', subjectRequests:'YM',
    subjectsAdmin:'MH', questions:'CH', trash:'TR', users:'ND', history:'LS', logs:'LG'
  };
  const LABEL = {
    overview:'Tổng quan', approvals:'Phê duyệt', requests:'Yêu cầu sửa', subjectRequests:'Yêu cầu thêm môn',
    subjectsAdmin:'Môn học', questions:'Câu hỏi', trash:'Thùng rác', users:'Người dùng', history:'Lịch sử', logs:'Admin logs'
  };
  const ICON = {
    overview:'⌂', approvals:'✓', requests:'✎', subjectRequests:'＋',
    subjectsAdmin:'□', questions:'?', trash:'×', users:'○', history:'◷', logs:'▤', default:'•'
  };

  function collapsedMap(){
    try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}')||{};}catch(e){return {};}
  }
  function saveCollapsed(map){
    try{localStorage.setItem(STORE_KEY, JSON.stringify(map||{}));}catch(e){}
  }
  function cleanNavText(btn){
    return String(btn?.textContent||'').replace(/\d+/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  }
  function navKey(btn){
    const page=String(btn?.dataset?.page||'').toLowerCase();
    const text=cleanNavText(btn);
    if(page==='overview'||text.includes('tổng quan'))return'overview';
    if(page==='approvals'||text.includes('phê duyệt'))return'approvals';
    if(page==='requests'||text.includes('yêu cầu sửa'))return'requests';
    if(page.includes('subjectrequest')||text.includes('yc thêm môn')||text.includes('yêu cầu thêm môn'))return'subjectRequests';
    if(page==='subjectsadmin'||text==='môn học'||text.includes('quản lý môn'))return'subjectsAdmin';
    if(page==='questions'||text.includes('câu hỏi'))return'questions';
    if(page.includes('trash')||page.includes('deleted')||text.includes('thùng rác'))return'trash';
    if(page==='users'||text.includes('người dùng'))return'users';
    if(page==='history'||text.includes('lịch sử'))return'history';
    if(page==='logs'||text.includes('admin logs'))return'logs';
    return page||text;
  }
  function applyNav(btn,key,standalone=false){
    if(!btn) return;
    const badge = btn.querySelector('.navBadge')?.outerHTML || '';
    const label = LABEL[key] || cleanNavText(btn) || key;
    btn.dataset.short = SHORT[key] || label.slice(0,2).toUpperCase();
    btn.dataset.navKey = key;
    btn.classList.toggle('overviewStandalone', !!standalone);
    btn.innerHTML = '<span class="navGlyph" aria-hidden="true">'+(ICON[key]||ICON.default)+'</span><span class="navText">'+label+'</span>'+badge;
  }
  function titleButton(group){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='adminSideGroupTitle';
    btn.innerHTML='<span class="treeTitleLeft"><span class="navGlyph" aria-hidden="true">'+group.icon+'</span><span class="groupName">'+group.title+'</span></span><span class="treeArrow" aria-hidden="true">▾</span>';
    return btn;
  }
  function setGroupCollapsed(group, collapsed){
    group.classList.toggle('is-collapsed', !!collapsed);
    const title=group.querySelector(':scope > .adminSideGroupTitle');
    if(title) title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  function restoreNavs(side, foot){
    Array.from(side.querySelectorAll('.adminSideOverview, .adminSideGroup')).forEach(box=>{
      Array.from(box.querySelectorAll('.nav')).forEach(nav=>side.insertBefore(nav, foot||null));
      box.remove();
    });
  }
  function organizeAdminSidebarTree(){
    const side=document.querySelector('.side');
    if(!side)return;
    const foot=side.querySelector('.foot');
    restoreNavs(side, foot);
    const navs=Array.from(side.querySelectorAll('.nav'));
    if(!navs.length)return;
    const used=new Set();
    const state=collapsedMap();
    side.classList.add('adminTreeReady');

    const overview=navs.find(n=>navKey(n)==='overview');
    if(overview){
      used.add(overview);
      applyNav(overview,'overview',true);
      const box=document.createElement('div');
      box.className='adminSideOverview';
      box.appendChild(overview);
      side.insertBefore(box, foot||null);
    }

    GROUPS.forEach(group=>{
      const wrap=document.createElement('div');
      wrap.className='adminSideGroup';
      wrap.dataset.group=group.title;
      const title=titleButton(group);
      const body=document.createElement('div');
      body.className='adminSideGroupBody';
      wrap.appendChild(title);
      wrap.appendChild(body);
      group.keys.forEach(key=>{
        const btn=navs.find(n=>!used.has(n)&&navKey(n)===key);
        if(btn){
          used.add(btn);
          applyNav(btn,key,false);
          body.appendChild(btn);
        }
      });
      if(body.querySelector('.nav')){
        side.insertBefore(wrap, foot||null);
        const hasActive=!!body.querySelector('.nav.active');
        setGroupCollapsed(wrap, hasActive ? false : !!state[group.title]);
        title.onclick=()=>{
          const next=!wrap.classList.contains('is-collapsed');
          state[group.title]=next;
          saveCollapsed(state);
          setGroupCollapsed(wrap,next);
        };
      }
    });

    const extra=navs.filter(n=>!used.has(n));
    if(extra.length){
      const group={title:'Khác',icon:'•'};
      const wrap=document.createElement('div');
      wrap.className='adminSideGroup';
      wrap.dataset.group=group.title;
      const title=titleButton(group);
      const body=document.createElement('div');
      body.className='adminSideGroupBody';
      wrap.appendChild(title);
      wrap.appendChild(body);
      extra.forEach(btn=>{
        const key=navKey(btn);
        applyNav(btn,key,false);
        body.appendChild(btn);
      });
      side.insertBefore(wrap, foot||null);
      setGroupCollapsed(wrap, !!state[group.title]);
      title.onclick=()=>{
        const next=!wrap.classList.contains('is-collapsed');
        state[group.title]=next;
        saveCollapsed(state);
        setGroupCollapsed(wrap,next);
      };
    }
  }
  window.organizeAdminSidebar = organizeAdminSidebarTree;
  window.organizeAdminSidebarTree = organizeAdminSidebarTree;
  document.addEventListener('DOMContentLoaded',()=>{
    organizeAdminSidebarTree();
    setTimeout(organizeAdminSidebarTree,250);
    setTimeout(organizeAdminSidebarTree,1200);
  });
})();

// ===== FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625 =====
// Thùng rác: layout gọn + xóa/khôi phục hỗ trợ id dạng số hoặc chuỗi.
(function(){
  let deletedQuestionsCache = [];
  let deletedSubjectsCache = [];

  function idText(id){ return String(id ?? ''); }
  function arg(id){ return "'" + idText(id).replace(/'/g, "\\'") + "'"; }
  function shortText(s, n=110){
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n) + '...' : s;
  }
  function trashSearch(){
    return String(document.getElementById('search')?.value || '').trim().toLowerCase();
  }
  function matchTrashText(text){
    const k = trashSearch();
    return !k || String(text || '').toLowerCase().includes(k);
  }
  async function deleteRowById(table, id){
    const sid = idText(id);
    let res = await client.from(table).delete().eq('id', sid).select('id');
    if(res.error) return res;
    if((res.data || []).length) return res;
    if(/^\d+$/.test(sid)){
      res = await client.from(table).delete().eq('id', Number(sid)).select('id');
      if(res.error) return res;
    }
    return res;
  }

  function renderTrashHTML(questions, subjects){
    const subjectCards = subjects.map(t => {
      const backup = t.original_data || {};
      const sub = backup.subject || {};
      const qCount = (backup.questions || []).length;
      return `<div class="item trashItem compactTrashItem trashSubjectItem" data-trash-kind="subject" data-trash-id="${esc(idText(t.id))}">
        <div class="trashMain">
          <div class="trashTitleLine">
            <b>MÔN: ${esc(sub.code || '?')} - ${esc(sub.name || '')}</b>
            <span class="badge deleted">Đã xóa môn</span>
          </div>
          <div class="trashMeta">${qCount} câu hỏi · ${esc(t.deleted_by_email || '?')} · ${esc(date(t.deleted_at))}</div>
        </div>
        <div class="actions trashActions">
          <button class="act ok" onclick="restoreSubject(${arg(t.id)})">Khôi phục</button>
          <button class="act bad" onclick="permanentDeleteSubject(${arg(t.id)})">Xóa vĩnh viễn</button>
        </div>
      </div>`;
    }).join('');

    const questionCards = questions.map(t => {
      const q = t.original_data || {};
      return `<div class="item trashItem compactTrashItem trashQuestionItem" data-trash-kind="question" data-trash-id="${esc(idText(t.id))}">
        <div class="trashMain">
          <div class="trashTitleLine">
            <b>${esc(q.subject_code || '')} - Câu ${esc(String(q.num || q.id || '?'))}</b>
            <span class="badge deleted">Đã xóa câu</span>
          </div>
          <div class="trashQuestionText">${esc(shortText(q.question, 125))}</div>
          <div class="trashMeta">Đáp án: ${esc(q.answer || '')} · ${esc(t.deleted_by_email || '')} · ${esc(date(t.deleted_at))}</div>
        </div>
        <div class="actions trashActions">
          <button class="act ok" onclick="restoreQuestion(${arg(t.id)})">Khôi phục</button>
          <button class="act bad" onclick="permanentDelete(${arg(t.id)})">Xóa vĩnh viễn</button>
          <button class="act" onclick="viewTrashDetail(${arg(t.id)})">Xem</button>
        </div>
      </div>`;
    }).join('');

    return `<div class="trashCompactWrap">
      ${subjects.length ? `<section class="trashGroup compactTrashGroup"><h4 class="trashSectionHeading">Môn học đã xóa <span>(${subjects.length})</span></h4>${subjectCards}</section>` : ''}
      ${questions.length ? `<section class="trashGroup compactTrashGroup"><h4 class="trashSectionHeading">Câu hỏi đã xóa <span>(${questions.length})</span></h4>${questionCards}</section>` : ''}
    </div>`;
  }

  window.loadTrash = async function(){
    if(!isAdmin()) return;
    const el = document.getElementById('trashList');
    const cnt = document.getElementById('trashCount');
    if(el) el.innerHTML = '<p class="muted">Đang tải thùng rác...</p>';
    try{
      const [resQuestions, resSubjects] = await Promise.all([
        client.from('deleted_questions').select('*').order('deleted_at',{ascending:false}),
        client.from('deleted_subjects').select('*').order('deleted_at',{ascending:false})
      ]);
      if(resQuestions.error) throw resQuestions.error;
      if(resSubjects.error) throw resSubjects.error;
      deletedQuestionsCache = resQuestions.data || [];
      deletedSubjectsCache = resSubjects.data || [];

      let questions = deletedQuestionsCache;
      let subjects = deletedSubjectsCache;
      const k = trashSearch();
      if(k){
        questions = questions.filter(t => {
          const q = t.original_data || {};
          return matchTrashText(`${q.subject_code || ''} ${q.question || ''} ${q.answer || ''} ${q.answer_text || ''} ${q.num || ''} ${t.deleted_by_email || ''}`);
        });
        subjects = subjects.filter(t => {
          const s = (t.original_data || {}).subject || {};
          return matchTrashText(`${s.code || ''} ${s.name || ''} ${s.description || ''} ${t.deleted_by_email || ''}`);
        });
      }

      if(cnt) cnt.textContent = (questions.length + subjects.length) + ' mục';
      if(!el) return;
      if(!questions.length && !subjects.length){
        el.innerHTML = '<p class="muted">Thùng rác hiện đang trống.</p>';
        return;
      }
      el.innerHTML = renderTrashHTML(questions, subjects);
    }catch(e){
      if(el) el.innerHTML = '<p class="muted">Lỗi tải thùng rác: '+esc(e.message || e)+'</p>';
    }
  };

  window.restoreQuestion = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới khôi phục được.');
    const t = deletedQuestionsCache.find(x => idText(x.id) === idText(id));
    if(!t) return alert('Không tìm thấy mục cần khôi phục. Bấm Tải lại rồi thử lại.');
    if(!confirm('Khôi phục câu hỏi này?')) return;
    setBusy(true,'Đang khôi phục...');
    try{
      const q = t.original_data;
      const ins = await client.from('questions').upsert(q, {onConflict: 'subject_code,num'});
      if(ins.error) return alert('Không khôi phục được: '+ins.error.message);
      const del = await deleteRowById('deleted_questions', id);
      if(del.error) return alert('Đã khôi phục câu hỏi nhưng chưa xóa được bản trong thùng rác: '+del.error.message);
      await logAction('restore_question','questions',q.id,{subject_code:q.subject_code,num:q.num});
      await loadAll();
      await loadTrash();
      toast('Đã khôi phục');
    }finally{ setBusy(false); }
  };

  window.permanentDelete = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    const t = deletedQuestionsCache.find(x => idText(x.id) === idText(id));
    const q = t?.original_data || {};
    if(!confirm('Xóa VĨNH VIỄN câu '+String(q.num || q.id || '?')+'?\n\nKhông thể khôi phục sau thao tác này!')) return;
    setBusy(true,'Đang xóa vĩnh viễn...');
    try{
      const r = await deleteRowById('deleted_questions', id);
      if(r.error) return alert('Lỗi xóa vĩnh viễn: '+r.error.message);
      if(!(r.data || []).length) return alert('Không tìm thấy dòng để xóa. Bấm Tải lại, nếu vẫn còn thì kiểm tra quyền xóa bảng deleted_questions.');
      await logAction('permanent_delete','deleted_questions',id,{subject_code:q.subject_code,num:q.num});
      await loadTrash();
      toast('Đã xóa vĩnh viễn');
    }finally{ setBusy(false); }
  };

  window.restoreSubject = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới khôi phục được.');
    const t = deletedSubjectsCache.find(x => idText(x.id) === idText(id));
    if(!t) return alert('Không tìm thấy mục cần khôi phục. Bấm Tải lại rồi thử lại.');
    if(!confirm('Khôi phục môn học này?')) return;
    setBusy(true,'Đang khôi phục...');
    try{
      const backup = t.original_data || {};
      if(backup.subject){
        const sub = backup.subject;
        const insSub = await client.from('subjects').upsert({
          code: sub.code,
          name: sub.name,
          description: sub.description || '',
          is_active: sub.is_active !== false,
          sort_order: sub.sort_order || 0,
          cover: sub.cover || '',
          created_at: sub.created_at || new Date().toISOString()
        }, {onConflict: 'code'});
        if(insSub.error) return alert('Không khôi phục được môn: '+insSub.error.message);
      }
      let qFail = 0;
      if(Array.isArray(backup.questions)){
        const total = backup.questions.length;
        for(let idx=0; idx<total; idx++){
          const q = backup.questions[idx];
          showProgress('Đang khôi phục các câu hỏi...', idx + 1, total, `Đang xử lý câu ${q.num || idx+1}: ${q.question ? q.question.substring(0, 50) + '...' : ''}`);
          const r = await client.from('questions').upsert(q, {onConflict: 'subject_code,num'});
          if(r.error) qFail++;
        }
      }
      const del = await deleteRowById('deleted_subjects', id);
      if(del.error) return alert('Đã khôi phục nhưng chưa xóa được bản trong thùng rác: '+del.error.message);
      await logAction('restore_subject','subjects',backup.subject?.code,{questions: backup.questions?.length, failed: qFail});
      await loadAll();
      await loadTrash();
      const qMsg = qFail ? ` (${qFail} câu hỏi không khôi phục được)` : '';
      toast('Đã khôi phục môn '+(backup.subject?.code || '')+qMsg);
    }finally{
      setBusy(false);
      hideProgress();
    }
  };

  window.permanentDeleteSubject = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    const t = deletedSubjectsCache.find(x => idText(x.id) === idText(id));
    const backup = t?.original_data || {};
    const sub = backup.subject || {};
    if(!confirm('Xóa VĨNH VIỄN môn '+(sub.code || '?')+'?\n\nKhông thể khôi phục sau thao tác này!')) return;
    setBusy(true,'Đang xóa vĩnh viễn...');
    try{
      const r = await deleteRowById('deleted_subjects', id);
      if(r.error) return alert('Lỗi xóa vĩnh viễn: '+r.error.message);
      if(!(r.data || []).length) return alert('Không tìm thấy dòng để xóa. Bấm Tải lại, nếu vẫn còn thì kiểm tra quyền xóa bảng deleted_subjects.');
      await logAction('permanent_delete_subject','deleted_subjects',id,{code: sub.code});
      await loadTrash();
      toast('Đã xóa vĩnh viễn');
    }finally{ setBusy(false); }
  };

  window.viewTrashDetail = function(id){
    const t = deletedQuestionsCache.find(x => idText(x.id) === idText(id));
    if(!t) return alert('Không tìm thấy.');
    const q = t.original_data || {};
    openModal('Chi tiết câu đã xóa', `
      <p><b>Môn:</b> ${esc(q.subject_code||'')}</p>
      <p><b>Câu ${esc(String(q.num||''))}:</b> ${esc(q.question||'')}</p>
      <p><b>Đáp án:</b> ${esc(q.answer||'')}</p>
      <p><b>Xóa lúc:</b> ${esc(date(t.deleted_at))}</p>
      <p><b>Xóa bởi:</b> ${esc(t.deleted_by_email||'')}</p>
      <div class="actions" style="margin-top:12px">
        <button class="act ok" onclick="restoreQuestion(${arg(t.id)});closeModal();">Khôi phục</button>
        <button class="act bad" onclick="permanentDelete(${arg(t.id)});closeModal();">Xóa vĩnh viễn</button>
      </div>
    `);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav').forEach(b => {
      if(b.dataset.page === 'trash') b.addEventListener('click', () => setTimeout(loadTrash, 50));
    });
    const input = document.getElementById('search');
    if(input && !input.__trashSearchPatched){
      input.__trashSearchPatched = true;
      input.addEventListener('input', () => {
        if(document.getElementById('trash')?.classList.contains('active')) loadTrash();
      });
    }
  });
})();

// ===== DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625 =====
async function sendActionToDiscord(actionName, targetType, targetId, details) {
  const discordUrl = 'https://discord.com/api/webhooks/1519452717947420732/j-EVKdyuRYHRXU6MJbW9z_2lAy-wV2XnEOVULJEtDSgtignSVh2fWTTJKFgHj2MgoTJQ';
  
  // Xác định màu sắc (Color) dựa trên vai trò hiện tại của tài khoản Admin đang thao tác
  // Admin: Đỏ (10038562), Editor: Xanh lá (3066993), Khác: Xanh dương (3447003)
  let embedColor = 3447003; 
  if (profile && profile.role === 'admin') embedColor = 10038562;
  else if (profile && profile.role === 'editor') embedColor = 3066993;

  const payload = {
    embeds: [{
      title: `⚙️ HÀNH ĐỘNG HỆ THỐNG: ${String(actionName || '').toUpperCase()}`,
      color: embedColor,
      fields: [
        { name: '👤 Tài khoản', value: user?.email || profile?.email || 'N/A', inline: true },
        { name: '🎭 Vai trò', value: profile?.role || 'user', inline: true },
        { name: '🔢 Đối tượng', value: `${targetType || 'N/A'} (ID: ${targetId || 'N/A'})`, inline: false },
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
    console.warn('Lỗi gửi Discord Client:', error);
  }
}


// Hàm chuyên biệt để thông báo khi có người đăng nhập thành công vào hệ thống
async function sendLoginToDiscord(email, role) {
  const discordUrl = 'https://discord.com/api/webhooks/1519452717947420732/j-EVKdyuRYHRXU6MJbW9z_2lAy-wV2XnEOVULJEtDSgtignSVh2fWTTJKFgHj2MgoTJQ';
  
  let embedColor = 3447003; 
  if (role === 'admin') embedColor = 10038562; // Admin màu đỏ
  else if (role === 'editor') embedColor = 3066993; // Editor màu xanh lá

  const payload = {
    embeds: [{
      title: `🔑 ĐĂNG NHẬP HỆ THỐNG THÀNH CÔNG`,
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
    console.warn('Lỗi gửi thông báo login:', error);
  }
}



// ===== PATCH_AVATAR_ROLE_ACTIONS_APPROVAL_20260625 =====
(function(){
  function avUrl(p){return p?.avatar_url||p?.picture||p?.photo_url||p?.image_url||'';}
  function avChar(p){return String(p?.email||p?.id||'?').trim().slice(0,1).toUpperCase()||'?';}
  function avHtml(p,cls='userAvatar'){
    const u=avUrl(p);
    if(u) return `<button class="${cls}" onclick="openUserAvatar('${esc(p.id)}')" title="Xem avatar"><img src="${esc(u)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('button').classList.add('avatarBroken');this.remove();"></button>`;
    return `<button class="${cls} avatarFallback" onclick="openUserAvatar('${esc(p.id)}')" title="Xem avatar"><span>${esc(avChar(p))}</span></button>`;
  }
  function rBadge(p){const r=p?.role||'user';return `<span class="badge roleBadge role-${esc(r)}">${esc(r)}</span>`;}
  function menu(html){return `<details class="userActionMenu"><summary>Thao tác</summary><div class="userActionMenuBox">${html}</div></details>`;}
  function at(p){return p?.last_activity||p?.last_login||p?.updated_at||p?.created_at||'';}
  function ams(p){const n=new Date(at(p)).getTime();return Number.isFinite(n)?n:0;}
  function atext(p){const t=at(p); if(!t)return 'Chưa có'; const d=Date.now()-new Date(t).getTime(); if(!Number.isFinite(d))return date(t); if(d<120000)return 'Đang hoạt động'; if(d<3600000)return Math.max(1,Math.floor(d/60000))+' phút trước'; return date(t);}

  window.openUserAvatar=function(uid){
    const p=(cache.profiles||[]).find(x=>String(x.id)===String(uid)); if(!p)return alert('Không tìm thấy người dùng.');
    const u=avUrl(p), name=p.email||p.id||'Người dùng';
    openModal('Avatar - '+name, u ? `<div class="avatarPreview"><img src="${esc(u)}" alt="Avatar" referrerpolicy="no-referrer"><p class="muted">${esc(name)}</p></div>` : `<div class="avatarPreview avatarPreviewFallback"><div>${esc(avChar(p))}</div><p class="muted">Chưa có ảnh avatar.</p><p class="muted">${esc(name)}</p></div>`);
  };

  const oldLP=typeof loadProfile==='function'?loadProfile:null;
  if(oldLP&&!window.__avatarProfilePatch){window.__avatarProfilePatch=true;loadProfile=async function(){const out=await oldLP.apply(this,arguments);try{const a=user?.user_metadata?.avatar_url||user?.user_metadata?.picture||'';if(a&&profile&&profile.avatar_url!==a){await client.from('profiles').update({avatar_url:a,email:user.email||profile.email}).eq('id',user.id);profile.avatar_url=a;}}catch(e){console.warn('[avatar]',e)}return out};window.loadProfile=loadProfile;}

  window.renderUsers=renderUsers=function(){
    const arr=(cache.profiles||[]).filter(p=>match(`${p.email||''} ${p.role||''} ${p.id} ${p.last_activity||''}`)).sort((a,b)=>ams(b)-ams(a));
    $('userList').innerHTML='<div class="userRow muted tableHead"><b></b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b></div>'+arr.map(p=>{
      const acts=isAdmin()?`<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button><button class="act ${isBlocked(p)?'ok':'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)})">${isBlocked(p)?'Unblock':'Block'}</button><button class="act warn" onclick="setRole('${p.id}','${p.role==='editor'?'user':'editor'}')">${p.role==='editor'?'Gỡ editor':'Cho editor'}</button><button class="act warn" onclick="setRole('${p.id}','${p.role==='admin'?'user':'admin'}')">${p.role==='admin'?'Gỡ admin':'Cho admin'}</button>`:`<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>`;
      const tx=atext(p), cls=tx==='Đang hoạt động'?'activityNow':'';
      return `<div class="userRow activitySortedRow ${cls}"><div class="avatarCell">${avHtml(p)}</div><div><div class="mail">${esc(p.email||p.id)}</div><div class="uid">${esc(p.id)}</div></div><div>${rBadge(p)}</div><div>${isBlocked(p)?badge('blocked'):badge('active')}</div><div><b class="lastActivity ${cls}">${esc(tx)}</b><div class="uid">${esc(date(at(p)))}</div></div><div class="actions compactUserActions">${menu(acts)}</div></div>`;
    }).join('');
  };

  const oldReject=typeof rejectUser==='function'?rejectUser:null;
  if(oldReject&&!window.__rejectReloadPatch){window.__rejectReloadPatch=true;rejectUser=async function(uid){await oldReject.apply(this,arguments);try{await loadAll()}catch(e){renderApprovals?.();renderUsers?.();}};window.rejectUser=rejectUser;}

  if(typeof renderApprovals==='function'){
    window.renderApprovals=renderApprovals=function(){
      const pending=(cache.profiles||[]).filter(p=>p.approved===false), approved=(cache.profiles||[]).filter(p=>p.approved!==false);
      const ab=document.getElementById('approvalBadge'); if(ab){ab.textContent=pending.length;ab.classList.toggle('hidden',pending.length===0)}
      const ep=document.getElementById('afPending'),ea=document.getElementById('afApproved'),eall=document.getElementById('afAll'); if(ep)ep.textContent=pending.length;if(ea)ea.textContent=approved.length;if(eall)eall.textContent=(cache.profiles||[]).length;
      const el=document.getElementById('approvalList'); if(!el)return; let arr=cache.profiles||[]; const f=document.querySelector('.approvalFilter.active')?.dataset?.af||'pending'; if(f==='pending')arr=arr.filter(p=>p.approved===false); else if(f==='approved')arr=arr.filter(p=>p.approved!==false);
      const k=(document.getElementById('search')?.value||'').trim().toLowerCase(); if(k)arr=arr.filter(p=>`${p.email||''} ${p.id||''}`.toLowerCase().includes(k));
      if(!arr.length){el.innerHTML='<p class="muted">'+(f==='pending'?'Không có tài khoản nào đang chờ duyệt.':'Không có.')+'</p>';return;}
      el.innerHTML=arr.map(p=>{const pend=p.approved===false; const status=pend?'<span class="badge rejected">Chờ duyệt</span>':'<span class="badge approved">Đã duyệt</span>'; const acts=pend?`<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>`:`<button class="act warn" onclick="revokeApproval('${esc(p.id)}')">Thu hồi quyền</button>`; return `<div class="approvalCard ${pend?'isPending':''}">${avHtml(p,'userAvatar approvalAvatar')}<div class="approvalCardInfo"><div class="mail">${esc(p.email||p.id)}</div><div class="meta">${rBadge(p)} ${status} · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login||p.created_at))}</div></div><div class="approvalCardActions">${isAdmin()?menu(acts):'<span class="muted">Chỉ admin</span>'}</div></div>`}).join('');
    };
  }
})();


// ===== FINAL_USER_AVATAR_DOTS_ROLE_UI_20260625 =====
(function(){
  function avatarUrl(p){
    return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || '';
  }
  function avatarLetter(p){
    return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?';
  }
  function avatarButton(p){
    const src = avatarUrl(p);
    const title = esc(p?.email || 'Avatar');
    if(src){
      return `<button class="lhUserAvatar" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="lhUserAvatar avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avatarLetter(p))}</span></button>`;
  }
  function roleBadgeFinal(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function actionMenu(html){
    return `<details class="lhDotsMenu"><summary title="Thao tác">...</summary><div class="lhDotsMenuBox">${html}</div></details>`;
  }
  function actTime(p){
    return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || '';
  }
  function actMs(p){
    const n = new Date(actTime(p)).getTime();
    return Number.isFinite(n) ? n : 0;
  }
  function actText(p){
    const t = actTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  window.openUserAvatarFinal = function(uid){
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');
    const src = avatarUrl(p);
    const name = p.email || p.id || 'Người dùng';
    if(src){
      openModal('Avatar - ' + name, `<div class="lhAvatarPreview"><img src="${esc(src)}" alt="Avatar" referrerpolicy="no-referrer"><p class="muted">${esc(name)}</p></div>`);
    }else{
      openModal('Avatar - ' + name, `<div class="lhAvatarPreview lhAvatarPreviewEmpty"><div>${esc(avatarLetter(p))}</div><p class="muted">Tài khoản này chưa có avatar trong database.</p><p class="muted">${esc(name)}</p></div>`);
    }
  };

  // Đồng bộ avatar Google của tài khoản admin/editor đang đăng nhập vào profiles.
  const oldLoadProfile = typeof loadProfile === 'function' ? loadProfile : null;
  if(oldLoadProfile && !window.__lhAvatarLoadProfileFinal){
    window.__lhAvatarLoadProfileFinal = true;
    loadProfile = async function(){
      const out = await oldLoadProfile.apply(this, arguments);
      try{
        const a = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
        if(a && profile){
          await client.from('profiles').update({ avatar_url:a, email:user.email || profile.email }).eq('id', user.id);
          profile.avatar_url = a;
        }
      }catch(e){ console.warn('[avatar sync]', e); }
      return out;
    };
    window.loadProfile = loadProfile;
  }

  window.renderUsers = renderUsers = function(){
    const arr = (cache.profiles || [])
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.last_activity || ''}`))
      .sort((a,b) => actMs(b) - actMs(a));

    $('userList').innerHTML = `<div class="userRow muted tableHead lhUserRowFinal">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>` + arr.map(p => {
      const acts = isAdmin()
        ? `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>
           <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)})">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
           <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}')">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
           <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}')">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>`
        : `<button class="act" onclick="viewUserEdits('${p.id}')">Lịch sử</button>`;
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow lhUserRowFinal ${activeClass}">
        <div class="lhAvatarCell">${avatarButton(p)}</div>
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${roleBadgeFinal(p.role)}</div>
        <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(actTime(p)))}</div></div>
        <div class="actions lhActionsCell">${actionMenu(acts)}</div>
      </div>`;
    }).join('');
  };

  // Nếu đang ở tab Người dùng sau khi file load xong thì render lại ngay.
  setTimeout(() => { try{ renderUsers(); }catch(e){} }, 300);
})();


// ===== FINAL_DOTS_MENU_FIXED_NO_JITTER_20260625 =====
(function(){
  function avatarUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function avatarLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function avatarButton(p){
    const src = avatarUrl(p);
    const title = esc(p?.email || 'Avatar');
    if(src){
      return `<button class="lhUserAvatar" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="lhUserAvatar avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avatarLetter(p))}</span></button>`;
  }
  function roleBadgeFinal(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function actTime(p){ return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || ''; }
  function actMs(p){ const n = new Date(actTime(p)).getTime(); return Number.isFinite(n) ? n : 0; }
  function actText(p){
    const t = actTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  window.closeUserActionMenuFinal = function(){
    document.getElementById('lhActionBackdrop')?.remove();
    document.getElementById('lhActionMenuFloat')?.remove();
    document.querySelectorAll('.lhDotsBtn.isOpen').forEach(b => b.classList.remove('isOpen'));
  };

  window.openUserActionMenuFinal = function(ev, uid){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    const btn = ev?.currentTarget || ev?.target;
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');

    const wasOpen = btn?.classList?.contains('isOpen');
    closeUserActionMenuFinal();
    if(wasOpen) return;
    btn?.classList?.add('isOpen');

    const backdrop = document.createElement('div');
    backdrop.id = 'lhActionBackdrop';
    backdrop.onclick = closeUserActionMenuFinal;
    document.body.appendChild(backdrop);

    const menu = document.createElement('div');
    menu.id = 'lhActionMenuFloat';
    menu.innerHTML = isAdmin()
      ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>
         <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}');closeUserActionMenuFinal();">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}');closeUserActionMenuFinal();">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>`
      : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>`;
    document.body.appendChild(menu);

    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth || 190;
    const mh = menu.offsetHeight || 190;
    let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
    let top = r.bottom + 8;
    if(top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  };

  window.openUserAvatarFinal = window.openUserAvatarFinal || function(uid){
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');
    const src = avatarUrl(p), name = p.email || p.id || 'Người dùng';
    if(src) openModal('Avatar - ' + name, `<div class="lhAvatarPreview"><img src="${esc(src)}" alt="Avatar" referrerpolicy="no-referrer"><p class="muted">${esc(name)}</p></div>`);
    else openModal('Avatar - ' + name, `<div class="lhAvatarPreview lhAvatarPreviewEmpty"><div>${esc(avatarLetter(p))}</div><p class="muted">Tài khoản này chưa có avatar trong database.</p><p class="muted">${esc(name)}</p></div>`);
  };

  window.renderUsers = renderUsers = function(){
    closeUserActionMenuFinal();
    const arr = (cache.profiles || [])
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.last_activity || ''}`))
      .sort((a,b) => actMs(b) - actMs(a));
    $('userList').innerHTML = `<div class="userRow muted tableHead lhUserRowFinal">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>` + arr.map(p => {
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow lhUserRowFinal ${activeClass}">
        <div class="lhAvatarCell">${avatarButton(p)}</div>
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${roleBadgeFinal(p.role)}</div>
        <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(actTime(p)))}</div></div>
        <div class="actions lhActionsCell"><button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">...</button></div>
      </div>`;
    }).join('');
  };

  document.addEventListener('click', e => {
    if(e.target.closest('#lhActionMenuFloat') || e.target.closest('.lhDotsBtn')) return;
    closeUserActionMenuFinal();
  }, true);
  window.addEventListener('resize', closeUserActionMenuFinal);
  window.addEventListener('scroll', closeUserActionMenuFinal, true);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeUserActionMenuFinal(); });
})();


// ===== REALTIME_ADMIN_UPDATES_NO_10S_20260625 =====
(function(){
  let rtChannel = null;
  let rtTimer = null;
  let rtBusy = false;
  let rtPendingNotifyIds = new Set();
  let rtRefreshTimer = null;

  function rtSetChip(text, mode){
    let chip = document.getElementById('adminAutoCheckChip');
    if(!chip){
      chip = document.createElement('div');
      chip.id = 'adminAutoCheckChip';
      chip.innerHTML = '<span class="autoDot" aria-hidden="true"></span><span class="autoText"></span>';
      document.body.appendChild(chip);
    }
    chip.classList.remove('hidden','is-checking','is-idle','is-live','is-error');
    chip.classList.add(mode || 'is-live');
    const t = chip.querySelector('.autoText');
    if(t) t.textContent = text || 'Realtime';
  }

  function rtPendingSet(){
    return new Set((cache.requests || []).filter(x => x.status === 'pending').map(x => String(x.id)));
  }

  async function rtReloadLight(reason, payload){
    if(rtBusy || !client || !user || !profile || !isEditor()) return;
    rtBusy = true;
    rtSetChip('Realtime...', 'is-checking');
    try{
      const oldPending = rtPendingSet();
      const [profiles, requests, history] = await Promise.all([
        client.from('profiles').select('*').order('last_activity', { ascending:false, nullsFirst:false }),
        client.from('edit_requests').select('*').order('created_at', { ascending:false }),
        client.from('question_history').select('*').order('created_at', { ascending:false }).limit(500)
      ]);
      if(!profiles.error) cache.profiles = profiles.data || [];
      if(!requests.error) cache.requests = requests.data || [];
      if(!history.error) cache.history = history.data || [];
      if(isAdmin()){
        const logs = await client.from('admin_logs').select('*').order('created_at', { ascending:false }).limit(500);
        if(!logs.error) cache.logs = logs.data || [];
      }

      // Nếu câu hỏi đổi thì tải lại toàn bộ để tab Câu hỏi luôn đúng.
      if(reason === 'questions'){
        try{ await loadAll(); return; }catch(e){ console.warn('[realtime full reload]', e); }
      }else{
        render();
        if(typeof renderApprovals === 'function') renderApprovals();
      }

      const newPending = rtPendingSet();
      let added = 0;
      newPending.forEach(id => { if(!oldPending.has(id) && !rtPendingNotifyIds.has(id)){ added++; rtPendingNotifyIds.add(id); } });
      if(added > 0) toast(added === 1 ? 'Có 1 yêu cầu mới' : `Có ${added} yêu cầu mới`);
    }catch(e){
      console.warn('[Admin realtime]', e);
      rtSetChip('Realtime lỗi', 'is-error');
    }finally{
      rtBusy = false;
      if(!document.hidden) rtSetChip('Realtime', 'is-live');
    }
  }

  function rtDebounce(reason, payload){
    clearTimeout(rtRefreshTimer);
    rtRefreshTimer = setTimeout(() => rtReloadLight(reason, payload), 220);
  }

  window.startAdminRealtime = function(){
    if(!client || !user || !profile || !isEditor()) return;
    if(rtChannel) return;
    rtPendingNotifyIds = rtPendingSet();
    rtSetChip('Realtime', 'is-live');
    try{
      rtChannel = client.channel('learning-hub-admin-realtime')
        .on('postgres_changes', { event:'*', schema:'public', table:'edit_requests' }, p => rtDebounce('edit_requests', p))
        .on('postgres_changes', { event:'*', schema:'public', table:'profiles' }, p => rtDebounce('profiles', p))
        .on('postgres_changes', { event:'*', schema:'public', table:'question_history' }, p => rtDebounce('question_history', p))
        .on('postgres_changes', { event:'*', schema:'public', table:'subject_requests' }, p => {
          rtDebounce('subject_requests', p);
          if(typeof loadSubjectRequests === 'function') setTimeout(loadSubjectRequests, 250);
        })
        .on('postgres_changes', { event:'*', schema:'public', table:'questions' }, p => rtDebounce('questions', p))
        .subscribe(status => {
          if(status === 'SUBSCRIBED') rtSetChip('Realtime', 'is-live');
          if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') rtSetChip('Realtime lỗi', 'is-error');
        });
    }catch(e){
      console.warn('[startAdminRealtime]', e);
      rtSetChip('Realtime lỗi', 'is-error');
    }
  };

  window.stopAdminRealtime = function(){
    try{ if(rtChannel) client.removeChannel(rtChannel); }catch(e){}
    rtChannel = null;
  };

  const oldLoadAll = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAll && !window.__adminRealtimeLoadAllPatched){
    window.__adminRealtimeLoadAllPatched = true;
    loadAll = async function(){
      const out = await oldLoadAll.apply(this, arguments);
      try{ startAdminRealtime(); }catch(e){}
      return out;
    };
    window.loadAll = loadAll;
  }

  // Tắt chip/vòng tự check 10s cũ nếu còn tồn tại; realtime thay thế nó.
  const style = document.createElement('style');
  style.textContent = `
    #adminAutoCheckChip{min-width:auto!important;width:auto!important;height:34px!important;padding:0 12px!important;pointer-events:none!important;}
    #adminAutoCheckChip .autoText{display:inline!important;font-size:12px!important;}
    #adminAutoCheckChip .autoDot{width:9px!important;height:9px!important;border-radius:50%!important;border:0!important;animation:none!important;background:var(--ok)!important;box-shadow:0 0 0 0 rgba(114,197,140,.45)!important;}
    #adminAutoCheckChip.is-checking .autoDot{background:var(--gold2)!important;animation:autoCheckSpin .65s linear infinite!important;}
    #adminAutoCheckChip.is-error .autoDot{background:var(--bad)!important;}
  `;
  document.head.appendChild(style);
})();


// ===== KILL_OLD_10S_AUTO_CHECK_20260625 =====
(function(){
  // Xóa text/vòng "Realtime" cũ. Realtime sẽ tự bật sau loadAll.
  function killOldAutoCheckText(){
    const chip = document.getElementById('adminAutoCheckChip');
    if(chip){
      const text = chip.querySelector('.autoText');
      if(text && /Realtime|Tự check|10s/i.test(text.textContent || '')) text.textContent = 'Realtime';
      chip.classList.remove('is-idle');
      chip.classList.add('is-live');
    }
  }
  document.addEventListener('DOMContentLoaded', killOldAutoCheckText);
  setTimeout(killOldAutoCheckText, 300);
  setTimeout(killOldAutoCheckText, 1500);
})();


// ===== MOVE_REALTIME_CHIP_NEXT_TO_SEARCH_20260625 =====
(function(){
  function moveRealtimeChipNextToSearch(){
    const chip = document.getElementById('adminAutoCheckChip');
    const topTools = document.querySelector('.topTools');
    if(!chip || !topTools) return;

    chip.classList.add('realtimeTopChip');

    const searchWrap = document.querySelector('.searchWrap');
    const searchInput = document.getElementById('search');

    if(searchWrap && searchWrap.parentElement === topTools){
      searchWrap.insertAdjacentElement('afterend', chip);
    }else if(searchInput && searchInput.parentElement === topTools){
      searchInput.insertAdjacentElement('afterend', chip);
    }else{
      topTools.insertBefore(chip, topTools.firstChild);
    }
  }

  const oldStartRealtimeMoveChip = window.startAdminRealtime;
  if(typeof oldStartRealtimeMoveChip === 'function' && !window.__moveRealtimeChipPatched){
    window.__moveRealtimeChipPatched = true;
    window.startAdminRealtime = function(){
      const out = oldStartRealtimeMoveChip.apply(this, arguments);
      setTimeout(moveRealtimeChipNextToSearch, 50);
      setTimeout(moveRealtimeChipNextToSearch, 500);
      return out;
    };
  }

  const oldLoadAllMoveChip = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAllMoveChip && !window.__moveRealtimeChipLoadAllPatched){
    window.__moveRealtimeChipLoadAllPatched = true;
    loadAll = async function(){
      const out = await oldLoadAllMoveChip.apply(this, arguments);
      setTimeout(moveRealtimeChipNextToSearch, 80);
      setTimeout(moveRealtimeChipNextToSearch, 600);
      return out;
    };
    window.loadAll = loadAll;
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(moveRealtimeChipNextToSearch, 300);
    setTimeout(moveRealtimeChipNextToSearch, 1500);
  });
})();


// ===== USER_DOTS_REVOKE_APPROVAL_AVATAR_APPROVALS_20260625 =====
(function(){
  function uAvatarUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function uAvatarLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function uAvatarButton(p, extraClass=''){
    const src = uAvatarUrl(p);
    const cls = `lhUserAvatar ${extraClass}`.trim();
    if(src){
      return `<button class="${cls}" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="${cls} avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(uAvatarLetter(p))}</span></button>`;
  }
  function roleBadgeFinal(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function actTime(p){ return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || ''; }
  function actMs(p){ const n = new Date(actTime(p)).getTime(); return Number.isFinite(n) ? n : 0; }
  function actText(p){
    const t = actTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  window.openUserAvatarFinal = window.openUserAvatarFinal || function(uid){
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');
    const src = uAvatarUrl(p), name = p.email || p.id || 'Người dùng';
    if(src){
      openModal('Avatar - ' + name, `<div class="lhAvatarPreview"><img src="${esc(src)}" alt="Avatar" referrerpolicy="no-referrer"><p class="muted">${esc(name)}</p></div>`);
    }else{
      openModal('Avatar - ' + name, `<div class="lhAvatarPreview lhAvatarPreviewEmpty"><div>${esc(uAvatarLetter(p))}</div><p class="muted">Tài khoản này chưa có avatar.</p><p class="muted">${esc(name)}</p></div>`);
    }
  };

  // Ghi đè menu 3 chấm ở tab Người dùng: thêm Thu hồi quyền vào trong menu.
  window.openUserActionMenuFinal = function(ev, uid){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    const btn = ev?.currentTarget || ev?.target;
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');

    const wasOpen = btn?.classList?.contains('isOpen');
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    if(wasOpen) return;
    btn?.classList?.add('isOpen');

    const backdrop = document.createElement('div');
    backdrop.id = 'lhActionBackdrop';
    backdrop.onclick = () => typeof closeUserActionMenuFinal === 'function' && closeUserActionMenuFinal();
    document.body.appendChild(backdrop);

    const canRevoke = p.approved !== false && p.role !== 'admin';
    const revokeBtn = canRevoke
      ? `<button class="act bad" onclick="revokeApproval('${p.id}');closeUserActionMenuFinal();">Thu hồi quyền</button>`
      : '';

    const menu = document.createElement('div');
    menu.id = 'lhActionMenuFloat';
    menu.innerHTML = isAdmin()
      ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>
         <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}');closeUserActionMenuFinal();">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}');closeUserActionMenuFinal();">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>
         ${revokeBtn}`
      : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>`;
    document.body.appendChild(menu);

    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth || 200;
    const mh = menu.offsetHeight || 220;
    let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
    let top = r.bottom + 8;
    if(top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  };

  // Ghi đè renderUsers để chắc chắn nút 3 chấm dùng menu mới.
  window.renderUsers = renderUsers = function(){
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    const arr = (cache.profiles || [])
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.last_activity || ''}`))
      .sort((a,b) => actMs(b) - actMs(a));
    $('userList').innerHTML = `<div class="userRow muted tableHead lhUserRowFinal">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>` + arr.map(p => {
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow lhUserRowFinal ${activeClass}">
        <div class="lhAvatarCell">${uAvatarButton(p)}</div>
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${roleBadgeFinal(p.role)}</div>
        <div>${isBlocked(p) ? badge('blocked') : badge('active')}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(actTime(p)))}</div></div>
        <div class="actions lhActionsCell"><button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">...</button></div>
      </div>`;
    }).join('');
  };

  // Ghi đè renderApprovals: thêm avatar vào thẻ phê duyệt.
  window.renderApprovals = renderApprovals = function(){
    if(typeof renderApprovalCounts === 'function') renderApprovalCounts();
    if(typeof updateApprovalBadge === 'function') updateApprovalBadge();

    const el = document.getElementById('approvalList');
    if(!el) return;

    let arr = cache.profiles || [];
    if(typeof approvalFilter !== 'undefined'){
      if(approvalFilter === 'pending') arr = arr.filter(p => p.approved === false);
      else if(approvalFilter === 'approved') arr = arr.filter(p => p.approved !== false);
    }

    const k = (document.getElementById('search')?.value || '').trim().toLowerCase();
    if(k) arr = arr.filter(p => `${p.email || ''} ${p.id || ''} ${p.role || ''}`.toLowerCase().includes(k));

    if(!arr.length){
      el.innerHTML = '<p class="muted">Không có tài khoản.</p>';
      return;
    }

    el.innerHTML = arr.map(p => {
      const isPending = p.approved === false;
      const statusBadge = isPending
        ? '<span class="badge rejected">Chờ duyệt</span>'
        : '<span class="badge approved">Đã duyệt</span>';
      const actions = isPending
        ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>`
        : `<button class="act warn" onclick="revokeApproval('${esc(p.id)}')">Thu hồi quyền</button>`;
      return `<div class="approvalCard ${isPending ? 'isPending' : ''}">
        <div class="approvalAvatarCell">${uAvatarButton(p, 'approvalAvatar')}</div>
        <div class="approvalCardInfo">
          <div class="mail">${esc(p.email || p.id)}</div>
          <div class="meta">${roleBadgeFinal(p.role)} ${statusBadge} · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login || p.created_at))}</div>
          <div class="uid">${esc(p.id)}</div>
        </div>
        <div class="approvalCardActions">${isAdmin() ? actions : '<span class="muted">Chỉ admin</span>'}</div>
      </div>`;
    }).join('');
  };

  setTimeout(() => {
    try{ renderUsers(); }catch(e){}
    try{ renderApprovals(); }catch(e){}
  }, 300);
})();


// ===== FINAL_APPROVALS_FILTER_AVATAR_FIX_20260625 =====
(function(){
  window.__approvalFilter = window.__approvalFilter || 'pending';

  function avUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function avLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function avBtn(p){
    const src = avUrl(p);
    if(src){
      return `<button class="lhUserAvatar approvalAvatar" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="lhUserAvatar approvalAvatar avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avLetter(p))}</span></button>`;
  }
  function roleBadge(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function pendingUsers(){ return (cache.profiles || []).filter(p => p.approved === false); }
  function approvedUsers(){ return (cache.profiles || []).filter(p => p.approved !== false); }
  function updateCounts(){
    const pend = pendingUsers().length;
    const appr = approvedUsers().length;
    const all = (cache.profiles || []).length;
    const ep = document.getElementById('afPending');
    const ea = document.getElementById('afApproved');
    const eall = document.getElementById('afAll');
    if(ep) ep.textContent = pend;
    if(ea) ea.textContent = appr;
    if(eall) eall.textContent = all;
    const badgeEl = document.getElementById('approvalBadge');
    if(badgeEl){
      badgeEl.textContent = pend;
      badgeEl.classList.toggle('hidden', pend === 0);
    }
    const statPendingApproval = document.getElementById('statPendingApproval');
    if(statPendingApproval) statPendingApproval.textContent = pend;
  }

  window.filterApprovals = function(f){
    window.__approvalFilter = f || 'pending';
    document.querySelectorAll('.approvalFilter').forEach(b => {
      b.classList.toggle('active', b.dataset.af === window.__approvalFilter);
    });
    renderApprovals();
  };

  window.renderApprovals = renderApprovals = function(){
    updateCounts();
    const el = document.getElementById('approvalList');
    if(!el) return;

    let filter = window.__approvalFilter || 'pending';
    const activeBtn = document.querySelector('.approvalFilter.active');
    if(activeBtn?.dataset?.af) filter = activeBtn.dataset.af;
    window.__approvalFilter = filter;

    let arr = cache.profiles || [];
    if(filter === 'pending') arr = arr.filter(p => p.approved === false);
    else if(filter === 'approved') arr = arr.filter(p => p.approved !== false);

    const k = (document.getElementById('search')?.value || '').trim().toLowerCase();
    if(k) arr = arr.filter(p => `${p.email || ''} ${p.id || ''} ${p.role || ''}`.toLowerCase().includes(k));

    if(!arr.length){
      const msg = filter === 'pending' ? 'Không có tài khoản nào đang chờ duyệt.' : 'Không có tài khoản phù hợp.';
      el.innerHTML = `<p class="muted">${msg}</p>`;
      return;
    }

    el.innerHTML = arr.map(p => {
      const isPending = p.approved === false;
      const statusBadge = isPending
        ? '<span class="badge rejected">Chờ duyệt</span>'
        : '<span class="badge approved">Đã duyệt</span>';
      const actions = isPending
        ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>`
        : (p.role === 'admin' ? '<span class="muted">Admin</span>' : `<button class="act warn" onclick="revokeApproval('${esc(p.id)}')">Thu hồi quyền</button>`);
      return `<div class="approvalCard ${isPending ? 'isPending' : ''}">
        <div class="approvalAvatarCell">${avBtn(p)}</div>
        <div class="approvalCardInfo">
          <div class="mail">${esc(p.email || p.id)}</div>
          <div class="meta">${roleBadge(p.role)} ${statusBadge} · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login || p.created_at))}</div>
          <div class="uid">${esc(p.id)}</div>
        </div>
        <div class="approvalCardActions">${isAdmin() ? actions : '<span class="muted">Chỉ admin</span>'}</div>
      </div>`;
    }).join('');
  };

  const oldApproveUser = window.approveUser;
  if(typeof oldApproveUser === 'function' && !window.__approvalApprovePatched){
    window.__approvalApprovePatched = true;
    window.approveUser = async function(uid){
      const out = await oldApproveUser.apply(this, arguments);
      setTimeout(() => { try{ renderApprovals(); }catch(e){} }, 150);
      return out;
    };
  }

  const oldRejectUser = window.rejectUser;
  if(typeof oldRejectUser === 'function' && !window.__approvalRejectPatched){
    window.__approvalRejectPatched = true;
    window.rejectUser = async function(uid){
      const out = await oldRejectUser.apply(this, arguments);
      setTimeout(() => { try{ renderApprovals(); }catch(e){} }, 150);
      return out;
    };
  }

  const oldRevokeApproval = window.revokeApproval;
  if(typeof oldRevokeApproval === 'function' && !window.__approvalRevokePatched){
    window.__approvalRevokePatched = true;
    window.revokeApproval = async function(uid){
      const out = await oldRevokeApproval.apply(this, arguments);
      setTimeout(() => { try{ renderApprovals(); renderUsers(); }catch(e){} }, 150);
      return out;
    };
  }

  setTimeout(() => { try{ renderApprovals(); }catch(e){} }, 300);
})();


// ===== APPROVAL_PENDING_ONLY_REVOKE_IN_USERS_DOTS_20260625 =====
(function(){
  function avUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function avLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function avBtn(p){
    const src = avUrl(p);
    if(src){
      return `<button class="lhUserAvatar approvalAvatar" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="lhUserAvatar approvalAvatar avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avLetter(p))}</span></button>`;
  }
  function roleBadge(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function pendingUsers(){ return (cache.profiles || []).filter(p => p.approved === false); }
  function updatePendingCount(){
    const pend = pendingUsers().length;
    const ep = document.getElementById('afPending');
    if(ep) ep.textContent = pend;
    const badgeEl = document.getElementById('approvalBadge');
    if(badgeEl){
      badgeEl.textContent = pend;
      badgeEl.classList.toggle('hidden', pend === 0);
    }
    const statPendingApproval = document.getElementById('statPendingApproval');
    if(statPendingApproval) statPendingApproval.textContent = pend;
  }
  function hideApprovalExtraFilters(){
    document.querySelectorAll('.approvalFilter').forEach(btn => {
      const af = btn.dataset.af;
      if(af === 'approved' || af === 'all') btn.classList.add('hidden');
      if(af === 'pending') btn.classList.add('active');
    });
  }

  // Tab Phê duyệt chỉ còn Chờ duyệt. Không còn Đã duyệt/Tất cả.
  window.filterApprovals = function(){
    window.__approvalFilter = 'pending';
    hideApprovalExtraFilters();
    renderApprovals();
  };

  window.renderApprovals = renderApprovals = function(){
    window.__approvalFilter = 'pending';
    hideApprovalExtraFilters();
    updatePendingCount();

    const el = document.getElementById('approvalList');
    if(!el) return;

    let arr = pendingUsers();
    const k = (document.getElementById('search')?.value || '').trim().toLowerCase();
    if(k) arr = arr.filter(p => `${p.email || ''} ${p.id || ''} ${p.role || ''}`.toLowerCase().includes(k));

    if(!arr.length){
      el.innerHTML = '<p class="muted">Không có tài khoản nào đang chờ duyệt.</p>';
      return;
    }

    el.innerHTML = arr.map(p => {
      return `<div class="approvalCard isPending">
        <div class="approvalAvatarCell">${avBtn(p)}</div>
        <div class="approvalCardInfo">
          <div class="mail">${esc(p.email || p.id)}</div>
          <div class="meta">${roleBadge(p.role)} <span class="badge rejected">Chờ duyệt</span> · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login || p.created_at))}</div>
          <div class="uid">${esc(p.id)}</div>
        </div>
        <div class="approvalCardActions">${isAdmin() ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>` : '<span class="muted">Chỉ admin</span>'}</div>
      </div>`;
    }).join('');
  };

  // Đảm bảo Thu hồi quyền nằm trong dấu 3 chấm ở tab Người dùng.
  const oldOpenUserActionMenuFinal = window.openUserActionMenuFinal;
  window.openUserActionMenuFinal = function(ev, uid){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    const btn = ev?.currentTarget || ev?.target;
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');

    const wasOpen = btn?.classList?.contains('isOpen');
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    if(wasOpen) return;
    btn?.classList?.add('isOpen');

    const backdrop = document.createElement('div');
    backdrop.id = 'lhActionBackdrop';
    backdrop.onclick = () => typeof closeUserActionMenuFinal === 'function' && closeUserActionMenuFinal();
    document.body.appendChild(backdrop);

    const revokeBtn = (p.approved !== false && p.role !== 'admin')
      ? `<button class="act bad" onclick="revokeApproval('${p.id}');closeUserActionMenuFinal();">Thu hồi quyền</button>`
      : '';

    const menu = document.createElement('div');
    menu.id = 'lhActionMenuFloat';
    menu.innerHTML = isAdmin()
      ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>
         <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}');closeUserActionMenuFinal();">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}');closeUserActionMenuFinal();">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>
         ${revokeBtn}`
      : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>`;
    document.body.appendChild(menu);

    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth || 205;
    const mh = menu.offsetHeight || 230;
    let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
    let top = r.bottom + 8;
    if(top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  };

  setTimeout(() => {
    try{ hideApprovalExtraFilters(); renderApprovals(); }catch(e){}
  }, 300);
})();


// ===== FORCE_REVOKE_IN_USER_DOTS_20260625 =====
(function(){
  // Luôn hiện "Thu hồi quyền" trong dấu ... ở tab Người dùng cho mọi tài khoản không phải admin.
  window.openUserActionMenuFinal = function(ev, uid){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const btn = ev?.currentTarget || ev?.target;
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy người dùng.');

    const wasOpen = btn?.classList?.contains('isOpen');
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    if(wasOpen) return;
    btn?.classList?.add('isOpen');

    const backdrop = document.createElement('div');
    backdrop.id = 'lhActionBackdrop';
    backdrop.onclick = () => typeof closeUserActionMenuFinal === 'function' && closeUserActionMenuFinal();
    document.body.appendChild(backdrop);

    const role = String(p.role || 'user').toLowerCase();
    const revokeBtn = role !== 'admin'
      ? `<button class="act bad revokeAccessBtn" onclick="revokeApproval('${p.id}');closeUserActionMenuFinal();">Thu hồi quyền</button>`
      : '';

    const menu = document.createElement('div');
    menu.id = 'lhActionMenuFloat';
    menu.innerHTML = isAdmin()
      ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>
         <button class="act ${isBlocked(p) ? 'ok' : 'bad'}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? 'Unblock' : 'Block'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'editor' ? 'user' : 'editor'}');closeUserActionMenuFinal();">${p.role === 'editor' ? 'Gỡ editor' : 'Cho editor'}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === 'admin' ? 'user' : 'admin'}');closeUserActionMenuFinal();">${p.role === 'admin' ? 'Gỡ admin' : 'Cho admin'}</button>
         ${revokeBtn}`
      : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">Lịch sử</button>`;
    document.body.appendChild(menu);

    const r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth || 210;
    const mh = menu.offsetHeight || 240;
    let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
    let top = r.bottom + 8;
    if(top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  };
})();


// ===== REVOKE_MOVES_USER_TO_APPROVAL_AND_APPROVED_USERS_UI_20260625 =====
(function(){
  function avUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function avLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function avatarButton(p){
    const src = avUrl(p);
    if(src){
      return `<button class="lhUserAvatar" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="lhUserAvatar avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avLetter(p))}</span></button>`;
  }
  function roleBadgeFinal(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function actTime(p){ return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || ''; }
  function actMs(p){ const n = new Date(actTime(p)).getTime(); return Number.isFinite(n) ? n : 0; }
  function actText(p){
    const t = actTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }

  // Thu hồi quyền = đưa user ra khỏi tab Người dùng và chuyển về tab Phê duyệt.
  window.revokeApproval = async function(uid){
    if(!isAdmin()) return alert('Chỉ admin.');
    const p = (cache.profiles || []).find(x => String(x.id) === String(uid));
    if(!p) return alert('Không tìm thấy user.');
    if(String(p.role || '').toLowerCase() === 'admin') return alert('Không thể thu hồi quyền truy cập của admin.');
    if(!confirm('Thu hồi quyền truy cập của: ' + (p.email || uid) + '?\n\nUser sẽ chuyển về tab Phê duyệt để admin duyệt lại.')) return;

    setBusy(true, 'Đang thu hồi...');
    try{
      const r = await client.from('profiles').update({ approved:false }).eq('id', uid);
      if(r.error) return alert('Lỗi: ' + r.error.message);
      await logAction('revoke_approval', 'profiles', uid, { email:p.email });

      p.approved = false;
      renderUsers();
      if(typeof renderApprovals === 'function') renderApprovals();
      toast('Đã chuyển user sang tab Phê duyệt');
    }finally{
      setBusy(false);
    }
  };

  // Tab Người dùng chỉ hiện user đã duyệt. User bị thu hồi sẽ biến mất khỏi đây.
  window.renderUsers = renderUsers = function(){
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    const arr = (cache.profiles || [])
      .filter(p => p.approved !== false)
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.last_activity || ''}`))
      .sort((a,b) => actMs(b) - actMs(a));

    $('userList').innerHTML = `<div class="approvedUsersNote">Đang hiển thị người dùng đã duyệt. Muốn đưa user về phê duyệt lại thì bấm dấu <b>...</b> → <b>Thu hồi quyền</b>.</div>
    <div class="userRow muted tableHead lhUserRowFinal approvedUsersHead">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>` + (arr.map(p => {
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow lhUserRowFinal approvedUserRow ${activeClass}">
        <div class="lhAvatarCell">${avatarButton(p)}</div>
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${roleBadgeFinal(p.role)}</div>
        <div>${isBlocked(p) ? badge('blocked') : '<span class="badge approved userApprovedBadge">Đã duyệt</span>'}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(actTime(p)))}</div></div>
        <div class="actions lhActionsCell"><button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">...</button></div>
      </div>`;
    }).join('') || '<p class="muted">Không có người dùng đã duyệt.</p>');
  };

  setTimeout(() => { try{ renderUsers(); if(typeof renderApprovals === 'function') renderApprovals(); }catch(e){} }, 300);
})();


// ===== FINAL_APPROVAL_UI_AND_REMOVE_USER_NOTE_20260625 =====
(function(){
  function avUrl(p){ return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || ''; }
  function avLetter(p){ return String(p?.email || p?.id || '?').trim().slice(0,1).toUpperCase() || '?'; }
  function avatarButton(p, cls=''){
    const src = avUrl(p);
    const klass = (`lhUserAvatar ${cls}`).trim();
    if(src){
      return `<button class="${klass}" type="button" title="Phóng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
    }
    return `<button class="${klass} avatarNoImage" type="button" title="Chưa có avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avLetter(p))}</span></button>`;
  }
  function roleBadgeFinal(role){
    const r = role || 'user';
    return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
  }
  function actTime(p){ return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || ''; }
  function actMs(p){ const n = new Date(actTime(p)).getTime(); return Number.isFinite(n) ? n : 0; }
  function actText(p){
    const t = actTime(p);
    if(!t) return 'Chưa có';
    const diff = Date.now() - new Date(t).getTime();
    if(!Number.isFinite(diff)) return date(t);
    if(diff < 2 * 60 * 1000) return 'Đang hoạt động';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' phút trước';
    return date(t);
  }
  function pendingUsers(){ return (cache.profiles || []).filter(p => p.approved === false); }

  // Người dùng: bỏ dòng ghi chú, chỉ hiện user đã duyệt.
  window.renderUsers = renderUsers = function(){
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    const arr = (cache.profiles || [])
      .filter(p => p.approved !== false)
      .filter(p => match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.last_activity || ''}`))
      .sort((a,b) => actMs(b) - actMs(a));

    $('userList').innerHTML = `<div class="userRow muted tableHead lhUserRowFinal approvedUsersHead">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>` + (arr.map(p => {
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      return `<div class="userRow activitySortedRow lhUserRowFinal approvedUserRow ${activeClass}">
        <div class="lhAvatarCell">${avatarButton(p)}</div>
        <div><div class="mail">${esc(p.email || p.id)}</div><div class="uid">${esc(p.id)}</div></div>
        <div>${roleBadgeFinal(p.role)}</div>
        <div>${isBlocked(p) ? badge('blocked') : '<span class="badge approved userApprovedBadge">Đã duyệt</span>'}</div>
        <div><b class="lastActivity ${activeClass}">${esc(activeText)}</b><div class="uid">${esc(date(actTime(p)))}</div></div>
        <div class="actions lhActionsCell"><button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">...</button></div>
      </div>`;
    }).join('') || '<p class="muted">Không có người dùng đã duyệt.</p>');
  };

  // Phê duyệt: chỉ hiện tài khoản chờ duyệt, giao diện không bị bó hẹp.
  window.renderApprovals = renderApprovals = function(){
    document.querySelectorAll('.approvalFilter').forEach(btn => {
      if(btn.dataset.af === 'approved' || btn.dataset.af === 'all') btn.classList.add('hidden');
      if(btn.dataset.af === 'pending') btn.classList.add('active');
    });

    const pend = pendingUsers().length;
    const ep = document.getElementById('afPending');
    if(ep) ep.textContent = pend;
    const badgeEl = document.getElementById('approvalBadge');
    if(badgeEl){ badgeEl.textContent = pend; badgeEl.classList.toggle('hidden', pend === 0); }
    const statPendingApproval = document.getElementById('statPendingApproval');
    if(statPendingApproval) statPendingApproval.textContent = pend;

    const el = document.getElementById('approvalList');
    if(!el) return;

    let arr = pendingUsers();
    const k = (document.getElementById('search')?.value || '').trim().toLowerCase();
    if(k) arr = arr.filter(p => `${p.email || ''} ${p.id || ''} ${p.role || ''}`.toLowerCase().includes(k));

    if(!arr.length){
      el.innerHTML = '<p class="muted">Không có tài khoản nào đang chờ duyệt.</p>';
      return;
    }

    el.innerHTML = arr.map(p => `<div class="approvalCard isPending approvalCardFixed">
      <div class="approvalAvatarCell">${avatarButton(p, 'approvalAvatar')}</div>
      <div class="approvalCardInfo">
        <div class="mail">${esc(p.email || p.id)}</div>
        <div class="meta">${roleBadgeFinal(p.role)} <span class="badge rejected">Chờ duyệt</span> · Đăng ký: ${esc(date(p.created_at))} · Login: ${esc(date(p.last_login || p.created_at))}</div>
        <div class="uid">${esc(p.id)}</div>
      </div>
      <div class="approvalCardActions">${isAdmin() ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Phê duyệt</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">Từ chối & xóa</button>` : '<span class="muted">Chỉ admin</span>'}</div>
    </div>`).join('');
  };

  setTimeout(() => { try{ renderUsers(); renderApprovals(); }catch(e){} }, 250);
})();

;/* FINAL ADMIN CLEANUP: remove/disable legacy UI after all patches loaded */
(function(){
  window.__ADMIN_UI_CLEAN_FINAL__ = '20260627';
  function closeLegacyUi(){
    // Đóng menu/details cũ để không đè lên menu 3 chấm bản mới.
    document.querySelectorAll('.userActionMenu').forEach(function(el){ el.remove(); });
    document.querySelectorAll('.avatarCell,.compactUserActions').forEach(function(el){ el.remove(); });
    // Nếu có nhiều menu nổi do patch cũ tạo, giữ lại menu final mới nhất.
    var menus = Array.from(document.querySelectorAll('#userActionMenuFinal,.lhUserActionMenuFinal'));
    menus.slice(0, Math.max(0, menus.length - 1)).forEach(function(el){ el.remove(); });
    // Chặn modal cũ bị kẹt trạng thái hiển thị.
    document.querySelectorAll('.modal').forEach(function(m){
      if(m.id !== 'modal' && !m.classList.contains('keepModal')) m.classList.add('hidden');
    });
  }
  function ensureFinalRender(){
    try{
      if(document.getElementById('users')?.classList.contains('active') && typeof renderUsers === 'function') renderUsers();
      if(document.getElementById('approvals')?.classList.contains('active') && typeof renderApprovals === 'function') renderApprovals();
    }catch(e){ console.warn('[admin cleanup render]', e); }
  }
  function run(){ closeLegacyUi(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  setTimeout(function(){ run(); ensureFinalRender(); }, 300);
  setTimeout(run, 1200);
})();


// ===== COPILOT_ADMIN_CLOUDINARY_IMAGE_FIX_20260627 =====
// Ảnh admin upload sẽ lên Cloudinary, KHÔNG lưu Base64 vào bảng questions.
(function(){
  const CLOUDINARY_CLOUD_NAME = 'ddc4uvm7m';
  const CLOUDINARY_UPLOAD_PRESET = 'learninghub_unsigned';
  function escAttr(s){ return esc(s).replace(/`/g,'&#96;'); }
  function optVal(q,k){ return q?.options?.[k] || ''; }
  function imgSrc(im){ if(!im) return ''; if(typeof im==='string') return im; return im.src||im.url||im.secure_url||im.publicUrl||im.public_url||im.path||''; }
  async function uploadCloudinary(file){
    if(!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UNSIGNED_UPLOAD_PRESET') throw new Error('Chưa có unsigned upload preset Cloudinary.');
    const fd=new FormData();
    fd.append('file',file);
    fd.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder','learninghub/questions');
    const res=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,{method:'POST',body:fd});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
    return {id:data.public_id,public_id:data.public_id,src:data.secure_url,url:data.secure_url,width:data.width,height:data.height,source:'cloudinary'};
  }
  let directEditDraftImages=[];
  function renderDirectEditImages(){
    const box=$('dqEditImgs'); if(!box) return;
    if(!directEditDraftImages.length){ box.innerHTML='<div class="dqNoImage">Chưa có hình.</div>'; return; }
    box.innerHTML=directEditDraftImages.map((im,i)=>`<div class="dqEditImg"><button type="button" onclick="removeDirectEditImage(${i})">×</button><img src="${escAttr(imgSrc(im))}" alt="Ảnh câu hỏi"></div>`).join('');
  }
  window.removeDirectEditImage=function(i){ directEditDraftImages.splice(i,1); renderDirectEditImages(); };
  async function getFullQuestion(id){
    const r=await client.from('questions').select('*').eq('id',id).maybeSingle();
    if(r.error){ alert('Không tải được câu hỏi: '+r.error.message); return null; }
    return r.data || (cache.questions||[]).find(x=>String(x.id)===String(id));
  }
  window.editQuestionDirect = async function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const q=await getFullQuestion(id); if(!q) return;
    directEditDraftImages=Array.isArray(q.images)?JSON.parse(JSON.stringify(q.images)):(q.images?[q.images]:[]);
    openModal(`Sửa trực tiếp câu ${q.num||q.id}`, `
      <div class="directEditAppStyle directEditPolished">
        <div class="directTopBar"><div class="directHint">Ảnh mới sẽ upload lên Cloudinary.</div><div class="directTopActions actions"><button class="act ok directSaveBtn" onclick="saveQuestionDirect(${q.id})">Lưu trực tiếp</button><button class="act directCloseBtn" onclick="closeModal()">Đóng</button></div></div>
        <div class="directEditGrid compactDirectGrid">
          <section class="directLeft directPanel">
            <div class="field directQuestionField"><label>Câu hỏi</label><textarea id="dqQuestion">${esc(q.question||'')}</textarea></div>
            <div class="directSmallGrid"><div class="field directAnswerField"><label>Đáp án đúng</label><input id="dqAnswer" value="${escAttr(q.answer||'')}" placeholder="VD: A hoặc AC"></div><div class="field directImageField"><label>Hình ảnh</label><input type="file" id="dqImgUpload" accept="image/*" multiple></div></div>
            <div id="dqEditImgs" class="dqEditImgs"></div>
          </section>
          <section class="directRight directPanel">${['A','B','C','D','E'].map(k=>`<div class="field directOptionField"><label>Đáp án ${k}</label><textarea data-dq-opt="${k}">${esc(optVal(q,k))}</textarea></div>`).join('')}</section>
        </div>
      </div>`);
    setTimeout(()=>{
      renderDirectEditImages();
      const inp=$('dqImgUpload');
      if(inp) inp.onchange=async e=>{
        const files=Array.from(e.target.files||[]); if(!files.length) return;
        inp.disabled=true; toast('Đang upload ảnh lên Cloudinary...');
        try{ for(const file of files) directEditDraftImages.push(await uploadCloudinary(file)); renderDirectEditImages(); toast('Đã upload ảnh'); }
        catch(err){ alert(err.message||err); } finally{ inp.disabled=false; e.target.value=''; }
      };
    },0);
  };
  window.saveQuestionDirect = async function(id){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa.');
    const oldQ=await getFullQuestion(id); if(!oldQ) return;
    const ops={}; document.querySelectorAll('[data-dq-opt]').forEach(t=>{const v=(t.value||'').trim(); if(v) ops[t.dataset.dqOpt]=v;});
    const question=($('dqQuestion')?.value||'').trim(); const answer=($('dqAnswer')?.value||'').trim().toUpperCase();
    if(!question) return alert('Câu hỏi không được để trống.'); if(!answer) return alert('Đáp án đúng không được để trống.');
    const list = directEditDraftImages || [];
    const localHasImg = !!(list.length || oldQ.has_image);
    const text = question + ' ' + Object.values(ops).join(' ');
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    const hasPlaceholder = list.some(im => {
      const src = typeof im === 'string' ? im : (im.src || im.url || im.secure_url || '');
      return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
    });
    
    let risk = '';
    let reason = '';
    if((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)){
      risk = 'high';
      reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
    } else if(answer.length > 1){
      risk = 'medium';
      reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
    } else {
      risk = 'low';
    }

    const payload={
      question,
      options:ops,
      answer,
      answer_text:Object.entries(ops).filter(([k])=>answer.includes(k)).map(([k,v])=>`${k}. ${v}`).join('; '),
      images:directEditDraftImages||[],
      updated_at:new Date().toISOString(),
      has_image: localHasImg || needsImg,
      error_risk: risk,
      error_risk_reason: reason || null
    };
    setBusy(true,'Đang lưu...');
    try{
      const res=await client.from('questions').update(payload).eq('id',id).select('id,num,subject_code,question,options,answer,is_active,updated_at,has_image,error_risk,error_risk_reason').maybeSingle();
      if(res.error) return alert(res.error.message);
      const idx=(cache.questions||[]).findIndex(x=>String(x.id)===String(id)); if(idx>=0) cache.questions[idx]={...cache.questions[idx],...(res.data||payload),images:payload.images};
      try{ await client.from('question_history').insert({question_id:id,question_num:oldQ.num||null,subject_code:oldQ.subject_code||null,request_id:null,previous_data:{question:oldQ.question,options:oldQ.options||{},answer:oldQ.answer,answer_text:oldQ.answer_text,images:oldQ.images||[]},new_data:payload,changed_by:user.id,approved_by:user.id}); }catch(e){}
      await logAction('direct_edit_question','questions',id,{subject_code:oldQ.subject_code,num:oldQ.num});
      closeModal(); renderQuestions(); toast('Đã sửa trực tiếp');
    }finally{ setBusy(false); }
  };
})();


// ===== COPILOT_ADMIN_BANDWIDTH_FINAL_OVERRIDE_20260627 =====
// Chỉ tải 50 câu/trang, không tải cột images trong danh sách admin.
(function(){
  const QUESTION_COLS='id,num,subject_code,question,options,answer,is_active,updated_at,created_at,has_image,error_risk,error_risk_reason';
  const STATE=window.__ADMIN_PAGE_STATE__=window.__ADMIN_PAGE_STATE__||{page:1,size:50,total:0,subject:localStorage.getItem('admin_question_subject_filter_v1')||'all',subjects:[]};
  function search(){return String($('search')?.value||'').trim();}
  async function safeQ(p){try{const r=await p;return r.error?[]:(r.data||[])}catch(e){return[]}}
  async function loadSubjects(){const rows=await safeQ(client.from('questions').select('subject_code').limit(10000));const set=new Set(rows.map(x=>x.subject_code||'HOD102').filter(Boolean));if(!set.size){set.add('HOD102');set.add('MLN111')}STATE.subjects=[...set].sort();}
  async function loadQuestionPage(){
    const from=(STATE.page-1)*STATE.size,to=from+STATE.size-1;
    let q=client.from('questions').select(QUESTION_COLS,{count:'exact'}).order('subject_code',{ascending:true}).order('num',{ascending:true}).range(from,to);
    if(STATE.subject!=='all')q=q.eq('subject_code',STATE.subject);
    const s=search(); if(s){ if(/^\d+$/.test(s))q=q.or(`num.eq.${Number(s)},id.eq.${Number(s)}`); else q=q.or(`question.ilike.%${s.replaceAll('%','')}%,answer.ilike.%${s.replaceAll('%','')}%`); }
    const r=await q; if(r.error){err('Lỗi tải câu hỏi: '+r.error.message);cache.questions=[];STATE.total=0;return}
    cache.questions=r.data||[]; STATE.total=r.count||0;
  }
  async function loadLightTables(){
    const a=await Promise.all([
      safeQ(client.from('profiles').select('*').order('last_activity',{ascending:false,nullsFirst:false})),
      safeQ(client.from('edit_requests').select('id,status,created_at,user_email,email,user_id,question_id,question_num,admin_note,reviewed_at,reviewed_by').order('created_at',{ascending:false}).limit(300)),
      safeQ(client.from('question_history').select('id,question_id,question_num,subject_code,created_at,changed_by,changed_by_email,user_email,admin_email,approved_by,request_id').order('created_at',{ascending:false}).limit(300)),
      isAdmin()?safeQ(client.from('admin_logs').select('*').order('created_at',{ascending:false}).limit(200)):Promise.resolve([])
    ]);
    cache.profiles=a[0];cache.requests=a[1];cache.history=a[2];cache.logs=a[3];
  }
  window.loadAll=loadAll=async function(){clearErr();setBusy(true,'Đang tải trang hiện tại...');try{await Promise.all([loadLightTables(),loadSubjects()]);await loadQuestionPage();render();toast(`Đã tải ${cache.questions.length}/${STATE.total} câu`);if(typeof startAdminRealtime==='function')startAdminRealtime();}finally{setBusy(false)}};
  window.setQuestionSubjectFilter=function(code){STATE.subject=code||'all';STATE.page=1;localStorage.setItem('admin_question_subject_filter_v1',STATE.subject);loadQuestionPage().then(renderQuestions)};
  window.adminQuestionPage=function(d){const max=Math.max(1,Math.ceil((STATE.total||0)/STATE.size));STATE.page=Math.min(max,Math.max(1,STATE.page+d));loadQuestionPage().then(renderQuestions)};
  window.renderQuestions=renderQuestions=function(){
    const max=Math.max(1,Math.ceil((STATE.total||0)/STATE.size));
    const tabs=`<div class="questionSubjectTabs"><button class="subjectTab ${STATE.subject==='all'?'active':''}" onclick="setQuestionSubjectFilter('all')">Tất cả</button>${STATE.subjects.map(s=>`<button class="subjectTab ${STATE.subject===s?'active':''}" onclick="setQuestionSubjectFilter('${esc(s)}')">${esc(s)}</button>`).join('')}</div>`;
    const pager=`<div class="questionPager actions"><button class="act" onclick="adminQuestionPage(-1)" ${STATE.page<=1?'disabled':''}>‹ Trang trước</button><b>Trang ${STATE.page}/${max}</b><button class="act" onclick="adminQuestionPage(1)" ${STATE.page>=max?'disabled':''}>Trang sau ›</button></div>`;
    const html=(cache.questions||[]).map(q=>`<div class="item questionAdminItem"><div class="head"><div><div class="questionSubjectCode">${esc(q.subject_code||'HOD102')}</div><b>Câu ${esc(q.num||q.id)}</b></div>${q.is_active===false?badge('hidden'):badge('active')}</div><p>${esc(q.question||'')}</p><p class="muted">Đáp án: ${esc(q.answer||'')}</p><div class="actions"><button class="act" onclick="viewQuestion(${q.id})">Xem</button><button class="act warn" onclick="editQuestionDirect(${q.id})">Sửa trực tiếp</button><button class="act warn" onclick="toggleQuestion(${q.id},${q.is_active===false})">${q.is_active===false?'Hiện':'Ẩn'}</button>${isAdmin()?`<button class="act bad" onclick="deleteQuestionAdmin(${q.id})">Xóa</button>`:''}</div></div>`).join('')||'<p class=muted>Không có câu hỏi.</p>';
    $('questionList').innerHTML=`<div class="questionToolbar"><div>${tabs}</div><button class="act ok addQuestionBtn" onclick="openAddQuestionAdmin()">+ Thêm câu hỏi</button></div><div class="questionResultNote">Đang hiển thị ${cache.questions.length}/${STATE.total} câu. Không tải ảnh ở danh sách.</div>`+pager+html+pager;
  };
  window.viewQuestion=async function(id){const r=await client.from('questions').select('*').eq('id',id).maybeSingle();if(r.error)return alert(r.error.message);const q=r.data;if(!q)return;openModal(`Câu ${q.num||q.id}`,`<pre class=raw>${esc(safe(q))}</pre>`)};
  let rt=null;window.startAdminRealtime=function(){if(rt||!client||!user||!profile||!isEditor())return;rt=client.channel('admin-lite-final').on('postgres_changes',{event:'*',schema:'public',table:'questions'},p=>{const row=p.new||p.old||{};const i=(cache.questions||[]).findIndex(x=>String(x.id)===String(row.id));if(p.eventType==='DELETE'&&i>=0)cache.questions.splice(i,1);else if(p.eventType==='UPDATE'&&i>=0)cache.questions[i]={...cache.questions[i],...row,images:undefined};else if(p.eventType==='INSERT')STATE.total++;renderQuestions();}).subscribe();};
  const inp=$('search');if(inp&&!inp.__adminFinalSearch){inp.__adminFinalSearch=true;let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{STATE.page=1;loadQuestionPage().then(render)},350)},{passive:true});}
  const btn=$('refreshBtn');if(btn)btn.onclick=loadAll;
})();


// ===== FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627 =====
// Fix: tab Yêu cầu sửa và Yêu cầu thêm môn không hiện data do bản tối ưu trước đó load thiếu cột/không gọi load subject_requests.
(function(){
  const QUESTION_COLS = 'id,num,subject_code,question,options,answer,is_active,updated_at,created_at,has_image,error_risk,error_risk_reason';
  const STATE = window.__ADMIN_PAGE_STATE__ || (window.__ADMIN_PAGE_STATE__ = {
    page:1, size:50, total:0,
    subject: localStorage.getItem('admin_question_subject_filter_v1') || 'all',
    subjects:[]
  });
  let subjectReqCache = [];
  let subjectReqFilter = 'pending';

  function searchVal(){ return String($('search')?.value || '').trim(); }
  async function safeQuery(name, query){
    try{
      const r = await query;
      if(r.error){ console.warn('[ADMIN FIX]', name, r.error); return {data:[], error:r.error}; }
      return {data:r.data || [], count:r.count || 0, error:null};
    }catch(e){ console.warn('[ADMIN FIX]', name, e); return {data:[], error:e}; }
  }
  async function loadSubjectsLite(){
    const r = await safeQuery('subjects from questions', client.from('questions').select('subject_code').limit(10000));
    const set = new Set((r.data||[]).map(x => x.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    STATE.subjects = Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
  }
  async function loadQuestionPageLite(){
    const from = (STATE.page - 1) * STATE.size;
    const to = from + STATE.size - 1;
    let q = client.from('questions')
      .select(QUESTION_COLS, {count:'exact'})
      .order('subject_code', {ascending:true})
      .order('num', {ascending:true})
      .range(from, to);
    if(STATE.subject !== 'all') q = q.eq('subject_code', STATE.subject);
    const s = searchVal();
    if(s){
      if(/^\d+$/.test(s)) q = q.or(`num.eq.${Number(s)},id.eq.${Number(s)}`);
      else q = q.or(`question.ilike.%${s.replaceAll('%','')}%,answer.ilike.%${s.replaceAll('%','')}%`);
    }
    const r = await q;
    if(r.error){ err('Lỗi tải câu hỏi: ' + r.error.message); cache.questions=[]; STATE.total=0; return; }
    cache.questions = r.data || [];
    STATE.total = r.count || 0;
  }

  async function loadCoreTablesFixed(){
    const [profiles, edits, history, logs] = await Promise.all([
      safeQuery('profiles', client.from('profiles').select('*').order('last_activity', {ascending:false, nullsFirst:false})),
      // QUAN TRỌNG: phải select('*') để có old_data/new_data. Bản trước load thiếu nên tab Yêu cầu sửa nhìn như mất data.
      safeQuery('edit_requests', client.from('edit_requests').select('*').order('created_at', {ascending:false}).limit(500)),
      safeQuery('question_history', client.from('question_history').select('*').order('created_at', {ascending:false}).limit(500)),
      isAdmin() ? safeQuery('admin_logs', client.from('admin_logs').select('*').order('created_at', {ascending:false}).limit(300)) : Promise.resolve({data:[]})
    ]);
    cache.profiles = profiles.data || [];
    cache.requests = edits.data || [];
    cache.history = history.data || [];
    cache.logs = logs.data || [];
  }

  window.loadAll = loadAll = async function(){
    clearErr();
    setBusy(true, 'Đang tải dữ liệu...');
    try{
      await Promise.all([loadCoreTablesFixed(), loadSubjectsLite()]);
      await loadQuestionPageLite();
      render();
      await window.loadSubjectRequests?.();
      if(typeof loadRegistrationMode === 'function') loadRegistrationMode();
      if(typeof startAdminRealtime === 'function') startAdminRealtime();
      toast(`Đã tải: ${cache.requests.length} yêu cầu sửa, ${subjectReqCache.length} yêu cầu thêm môn`);
    }finally{ setBusy(false); }
  };

  // Fix click So sánh: luôn fetch full row để chắc chắn có old_data/new_data.
  window.viewReq = async function(id){
    let r = (cache.requests || []).find(x => String(x.id) === String(id));
    try{
      const full = await client.from('edit_requests').select('*').eq('id', id).maybeSingle();
      if(!full.error && full.data) r = full.data;
    }catch(e){}
    if(!r) return alert('Không tìm thấy yêu cầu sửa.');
    const oldData = r.old_data || getQuestionByReq(r) || {};
    openModal(`Yêu cầu sửa câu ${questionLabel(r)}`, compareHTML(oldData, r.new_data || {}));
  };

  // Load + render Yêu cầu thêm môn độc lập, không phụ thuộc render() cũ.
  window.loadSubjectRequests = async function(){
    if(!isEditor()) return;
    const el = $('subjectRequestList');
    if(el) el.innerHTML = '<p class="muted">Đang tải yêu cầu thêm môn...</p>';
    const r = await safeQuery('subject_requests', client.from('subject_requests').select('*').order('created_at', {ascending:false}).limit(500));
    subjectReqCache = r.data || [];
    if(r.error){
      if(el) el.innerHTML = `<p class="muted">Không tải được subject_requests: ${esc(r.error.message || r.error)}</p>`;
      return;
    }
    renderSubjectRequestsFixed(subjectReqFilter);
    const badge = $('subjectRequestBadge');
    const pending = subjectReqCache.filter(x => x.status === 'pending').length;
    if(badge){ badge.textContent = pending; badge.classList.toggle('hidden', !pending); }
  };

  window.filterSubjectRequests = function(status){
    subjectReqFilter = status || 'pending';
    document.querySelectorAll('.subjectReqFilter').forEach(b => b.classList.toggle('active', b.dataset.srf === subjectReqFilter));
    renderSubjectRequestsFixed(subjectReqFilter);
  };

  function renderSubjectRequestsFixed(filter='pending'){
    const el = $('subjectRequestList');
    if(!el) return;
    const list = filter === 'all' ? subjectReqCache : subjectReqCache.filter(r => (r.status || 'pending') === filter);
    const pending = subjectReqCache.filter(r => (r.status || 'pending') === 'pending').length;
    const approved = subjectReqCache.filter(r => r.status === 'approved').length;
    const rejected = subjectReqCache.filter(r => r.status === 'rejected').length;
    if($('srfPending')) $('srfPending').textContent = pending;
    if($('srfApproved')) $('srfApproved').textContent = approved;
    if($('srfRejected')) $('srfRejected').textContent = rejected;
    if($('srfAll')) $('srfAll').textContent = subjectReqCache.length;
    if(!list.length){ el.innerHTML = '<p class="muted">Không có yêu cầu thêm môn.</p>'; return; }
    el.innerHTML = list.map(r => {
      const qs = Array.isArray(r.questions_data) ? r.questions_data : [];
      const status = r.status || 'pending';
      const statusText = status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Chờ duyệt';
      return `<div class="item subjectRequestItem">
        <div class="head">
          <div>
            <b>${esc(r.code || '?')}</b> - ${esc(r.name || '')} <span class="badge ${esc(status)}">${statusText}</span>
            <br><span class="muted">${esc(r.user_email || r.user_id || '?')} · ${r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''}</span>
            ${r.description ? `<br><span class="muted">Mô tả: ${esc(r.description)}</span>` : ''}
            <br><span class="muted">${qs.length} câu hỏi đính kèm</span>
            ${r.admin_note ? `<br><span class="muted">Ghi chú: ${esc(r.admin_note)}</span>` : ''}
          </div>
        </div>
        <div class="actions">
          ${qs.length ? `<button class="act" onclick="previewSubjectRequestQuestionsFixed(${r.id})">Xem câu hỏi</button>` : ''}
          ${status === 'pending' ? `<button class="act ok" onclick="approveSubjectRequest(${r.id})">Duyệt</button><button class="act bad" onclick="rejectSubjectRequest(${r.id})">Từ chối</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  window.previewSubjectRequestQuestionsFixed = function(id){
    const r = subjectReqCache.find(x => String(x.id) === String(id));
    if(!r) return;
    const qs = Array.isArray(r.questions_data) ? r.questions_data : [];
    const html = qs.slice(0, 50).map((q,i)=>`<div class="item"><b>Câu ${esc(q.num || i+1)}</b>: ${esc(String(q.question || '').slice(0,220))}<br><span class="muted">Đáp án: ${esc(q.answer || '?')}</span></div>`).join('') || '<p class="muted">Không có câu hỏi đính kèm.</p>';
    openModal(`Câu hỏi của yêu cầu ${esc(r.code || '')}`, html + (qs.length > 50 ? `<p class="muted">Còn ${qs.length-50} câu nữa...</p>` : ''));
  };

  const oldSetPageFixed = setPage;
  setPage = function(id,n){
    oldSetPageFixed(id,n);
    if(id === 'subjectRequests') setTimeout(()=>window.loadSubjectRequests?.(), 50);
    if(id === 'requests') renderRequests();
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(()=>window.loadSubjectRequests?.(), 1200);
  });
})();


// ===== FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628 =====
// Bắt buộc hiện ảnh trong modal So sánh yêu cầu sửa, kể cả cache câu hỏi đang load thiếu cột images.
(function(){
  const E = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getImgUrl(im){
    if(!im) return '';
    if(typeof im === 'string') return im.trim();
    if(typeof im !== 'object') return '';
    return String(im.src || im.url || im.secure_url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || '').trim();
  }
  function imgs(v){
    if(!v) return [];
    let raw = v;
    if(typeof raw === 'string'){
      const t = raw.trim();
      if(!t || t === '[]' || t === '{}' || t.toLowerCase() === 'không có') return [];
      if((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))){ try{ raw = JSON.parse(t); }catch(e){ raw = t; } }
    }
    if(!Array.isArray(raw)) raw = [raw];
    return raw.map(getImgUrl).filter(Boolean);
  }
  function imageBox(v){
    const a = imgs(v);
    if(!a.length) return '<div class="adminReqNoImage">Không có ảnh</div>';
    return '<div class="adminReqImageGrid">' + a.map((src,i)=>
      `<figure class="adminReqImageFig"><img src="${E(src)}" loading="lazy" onclick="openAdminReqImageForce('${encodeURIComponent(src)}')" onerror="this.closest('.adminReqImageFig')?.classList.add('imgBroken')"><figcaption>Ảnh ${i+1}</figcaption></figure>`
    ).join('') + '</div>';
  }
  window.openAdminReqImageForce = function(x){
    const src = decodeURIComponent(x || '');
    openModal('Xem ảnh', `<div class="adminReqImageZoom"><img src="${E(src)}"></div>`);
  };
  function textBox(v, title){
    const val = typeof formatValue === 'function' ? formatValue(v) : String(v ?? '');
    return `<pre><b>${title}</b>
${E(val)}</pre>`;
  }
  window.compareHTML = compareHTML = function(oldData, newData){
    oldData = oldData || {}; newData = newData || {};
    const fields = ['question','options','answer'];
    const hasImage = imgs(oldData.images).length || imgs(newData.images).length || Object.prototype.hasOwnProperty.call(oldData,'images') || Object.prototype.hasOwnProperty.call(newData,'images');
    if(hasImage) fields.push('images');
    return '<div class="diffList compactDiffList adminReqDiffList">' + fields.map(f=>{
      const label = typeof labelField === 'function' ? labelField(f) : f;
      const before = oldData[f], after = newData[f];
      const changed = JSON.stringify(f==='images'?imgs(before):before) !== JSON.stringify(f==='images'?imgs(after):after);
      return `<section class="diffBlock ${changed?'changed':''} compactDiffBlock ${f==='images'?'imageDiffBlock':''}"><h3>${E(label)}<span>${changed?'Đã đổi':'Không đổi'}</span></h3><div class="compare compactCompare ${f==='images'?'imageCompare':''}"><div class="adminReqCompareCol"><b class="adminReqColTitle">Trước</b>${f==='images'?imageBox(before):textBox(before,'Trước')}</div><div class="adminReqCompareCol"><b class="adminReqColTitle">Sau</b>${f==='images'?imageBox(after):textBox(after,'Sau')}</div></div></section>`;
    }).join('') + '</div>';
  };
  window.viewReq = viewReq = async function(id){
    let r = (cache.requests || []).find(x => String(x.id) === String(id));
    try{ const full = await client.from('edit_requests').select('*').eq('id', id).maybeSingle(); if(!full.error && full.data) r = full.data; }catch(e){}
    if(!r) return alert('Không tìm thấy yêu cầu sửa.');
    let q = null;
    try{
      if(r.question_id){ const got = await client.from('questions').select('id,num,subject_code,question,options,answer,answer_text,images').eq('id', r.question_id).maybeSingle(); if(!got.error) q = got.data; }
      if(!q && r.question_num){ const got = await client.from('questions').select('id,num,subject_code,question,options,answer,answer_text,images').eq('num', r.question_num).maybeSingle(); if(!got.error) q = got.data; }
    }catch(e){}
    const oldData = Object.assign({}, q || {}, r.old_data || {});
    if(q && !Object.prototype.hasOwnProperty.call(oldData,'images')) oldData.images = q.images || [];
    const newData = Object.assign({}, r.new_data || {});
    if(!Object.prototype.hasOwnProperty.call(newData,'images') && r.new_data && Object.keys(r.new_data).length) newData.images = [];
    openModal(`Yêu cầu sửa câu ${typeof questionLabel==='function'?questionLabel(r):(r.question_num||r.id)}`, compareHTML(oldData, newData));
  };
})();
// ===== END FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628 =====


// ===== FINAL_FORCE_ADMIN_REALTIME_RESTORE_20260628 =====
// Khôi phục realtime sau các bản patch loadAll phía dưới ghi đè mất startAdminRealtime.
(function(){
  let ch = null;
  let timer = null;
  let loading = false;
  let lastReason = '';

  function chip(text, cls){
    let el = document.getElementById('adminAutoCheckChip');
    if(!el){
      el = document.createElement('div');
      el.id = 'adminAutoCheckChip';
      el.innerHTML = '<span class="autoDot" aria-hidden="true"></span><span class="autoText"></span>';
      document.body.appendChild(el);
    }
    el.classList.remove('hidden','is-checking','is-idle','is-live','is-error');
    el.classList.add(cls || 'is-live');
    const t = el.querySelector('.autoText');
    if(t) t.textContent = text || 'Realtime';
    moveChip();
  }

  function moveChip(){
    const el = document.getElementById('adminAutoCheckChip');
    const wrap = document.querySelector('.topTools') || document.querySelector('.top');
    if(el && wrap && el.parentElement !== wrap){
      const search = document.querySelector('.searchWrap');
      search && search.parentElement === wrap ? search.insertAdjacentElement('afterend', el) : wrap.appendChild(el);
    }
  }

  function canRun(){
    try{ return !!client && !!user && !!profile && typeof isEditor === 'function' && isEditor(); }
    catch(e){ return false; }
  }

  async function reloadByRealtime(reason){
    if(!canRun() || loading) return;
    loading = true;
    lastReason = reason || lastReason || 'change';
    chip('Realtime...', 'is-checking');
    try{
      if(typeof loadAll === 'function') await loadAll();
      if(typeof renderApprovals === 'function') renderApprovals();
      if(typeof window.loadSubjectRequests === 'function') window.loadSubjectRequests();
      chip('Realtime', 'is-live');
      if(reason === 'edit_requests') toast('Có cập nhật yêu cầu sửa');
    }catch(e){
      console.warn('[FINAL realtime reload]', e);
      chip('Realtime lỗi', 'is-error');
    }finally{
      loading = false;
    }
  }

  function debounced(reason){
    clearTimeout(timer);
    timer = setTimeout(() => reloadByRealtime(reason), 350);
  }

  window.startAdminRealtimeFinal = function(){
    if(!canRun()) return;
    if(ch) return;
    chip('Realtime...', 'is-checking');
    try{
      ch = client.channel('learning-hub-admin-realtime-final')
        .on('postgres_changes', {event:'*', schema:'public', table:'edit_requests'}, () => debounced('edit_requests'))
        .on('postgres_changes', {event:'*', schema:'public', table:'profiles'}, () => debounced('profiles'))
        .on('postgres_changes', {event:'*', schema:'public', table:'question_history'}, () => debounced('question_history'))
        .on('postgres_changes', {event:'*', schema:'public', table:'subject_requests'}, () => debounced('subject_requests'))
        .on('postgres_changes', {event:'*', schema:'public', table:'questions'}, () => debounced('questions'))
        .subscribe(status => {
          if(status === 'SUBSCRIBED') chip('Realtime', 'is-live');
          if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
            chip('Realtime lỗi', 'is-error');
            try{ if(ch) client.removeChannel(ch); }catch(e){}
            ch = null;
            setTimeout(window.startAdminRealtimeFinal, 2500);
          }
        });
    }catch(e){
      console.warn('[startAdminRealtimeFinal]', e);
      chip('Realtime lỗi', 'is-error');
      ch = null;
    }
  };

  window.stopAdminRealtimeFinal = function(){
    try{ if(ch) client.removeChannel(ch); }catch(e){}
    ch = null;
  };

  const oldLoadAllFinalRT = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAllFinalRT && !window.__finalRealtimeLoadAllPatched){
    window.__finalRealtimeLoadAllPatched = true;
    loadAll = window.loadAll = async function(){
      const out = await oldLoadAllFinalRT.apply(this, arguments);
      setTimeout(() => { moveChip(); window.startAdminRealtimeFinal(); }, 80);
      setTimeout(() => { moveChip(); window.startAdminRealtimeFinal(); }, 800);
      return out;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { moveChip(); window.startAdminRealtimeFinal(); }, 600);
    setTimeout(() => { moveChip(); window.startAdminRealtimeFinal(); }, 1800);
  });
  setInterval(() => { if(canRun() && !ch) window.startAdminRealtimeFinal(); moveChip(); }, 5000);
})();
// ===== END FINAL_FORCE_ADMIN_REALTIME_RESTORE_20260628 =====
