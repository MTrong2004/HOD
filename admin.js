/* AI_ADMIN_JS_MAP_START
Mục đích: Bản đồ nhanh cho AI đọc admin.js đỡ tốn token. Không ảnh hưởng chức năng web.
Quy tắc sửa: giữ nguyên 1 file admin.js, chỉ sửa nhóm liên quan, tránh vá chồng. KHÔNG ĐỤNG Discord webhook.

NHÓM CHÍNH TRONG admin.js
1) Config / biến chung
- Tìm: CONFIG, client, user, profile, cache, $, esc, safe, isAdmin, isEditor, toast, err, setBusy
- Dùng cho: cấu hình Supabase, quyền, cache dữ liệu, helper chung.

2) Khởi tạo / đăng nhập / điều hướng
- Tìm: init, bind, logout, show, setPage, loadProfile
- Dùng cho: đăng nhập Google, khởi động admin, đổi tab, nhớ tab đang mở.

3) Load dữ liệu
- Tìm: loadAll, safeLoad, loadLightTables, loadQuestionPage, loadSubjects
- Dùng cho: tải profiles, questions, edit_requests, history, logs, phân trang câu hỏi.

4) Render tổng quan
- Tìm: render, renderStats, recentRequests, recentLogs, statUsers, statPending
- Dùng cho: dashboard, thống kê, danh sách mới nhất.

5) Quản lý câu hỏi
- Tìm: renderQuestions, setQuestionSubjectFilter, adminQuestionPage, viewQuestion, toggleQuestion, deleteQuestionAdmin
- Dùng cho: danh sách câu hỏi, lọc theo môn, tìm kiếm, phân trang, ẩn/hiện/xóa.

6) Sửa trực tiếp câu hỏi
- Tìm: editQuestionDirect, saveQuestionDirect, renderDirectEditImages, removeDirectEditImage, uploadCloudinary
- Dùng cho: form sửa câu, upload ảnh Cloudinary, lưu lịch sử chỉnh sửa.

7) Duyệt báo cáo sửa câu
- Tìm: renderRequests, reqHTML, viewReq, approve, rejectReq, compareHTML, changedFields
- Dùng cho: xem yêu cầu sửa, so sánh trước/sau, duyệt/từ chối.

8) Lịch sử chỉnh sửa
- Tìm: renderHistory, viewHistory, question_history, changedFieldKeys
- Dùng cho: xem lịch sử sửa câu, người sửa, nội dung thay đổi.

9) Người dùng / phân quyền
- Tìm: renderUsers, toggleBlock, setRole, revokeApproval, approveUser, rejectUser
- Dùng cho: danh sách user, block/unblock, cấp editor/admin, duyệt tài khoản.

10) Duyệt tài khoản / cổng đăng ký
- Tìm: ACCESS_APPROVAL_ADMIN, renderApprovals, filterApprovals, registrationMode, loadRegistrationMode, setRegistrationMode
- Dùng cho: user chờ duyệt, mở/đóng đăng ký.

11) Import câu hỏi bằng AI
- Tìm: AI_IMPORT_QUESTIONS, AI_PROMPT, openAddSubjectAI, previewAIImport, executeAIImport
- Dùng cho: copy prompt, đọc file md/txt/json, preview, import câu hỏi.

12) Quản lý môn học
- Tìm: SUBJECT_MANAGEMENT, loadSubjectsAdmin, deleteSubjectAdmin, editSubjectAdmin, subject_requests, approveSubjectRequest, rejectSubjectRequest
- Dùng cho: danh sách môn, sửa/xóa môn, duyệt yêu cầu thêm môn.

13) Thùng rác
- Tìm: loadTrash, restoreQuestion, restoreSubject, permanentDelete, deleted_questions, deleted_subjects
- Dùng cho: khôi phục/xóa vĩnh viễn câu hỏi hoặc môn học.

14) Realtime / cập nhật tự động
- Tìm: startAdminRealtime, realtime, channel, FORCE_ADMIN_REALTIME_RESTORE, loadAll
- Dùng cho: tự cập nhật khi Supabase thay đổi.

15) Discord Notifications
- Tìm: sendLoginToDiscord, sendActionToDiscord, discord.com/api/webhooks
- Dùng cho: thông báo login/hành động admin lên Discord. LƯU Ý: KHÔNG ĐỤNG webhook.

16) UI runtime / hotfix cuối file
- Tìm: HOTFIX, FINAL_, COPILOT_, injectAdminStyles, avatar, dots menu, request images force
- Dùng cho: vá giao diện, avatar, menu 3 chấm, ảnh trong request, tối ưu cache.

GỢI Ý AI
- Lỗi câu hỏi/admin question list: xem nhóm 3 + 5 + 6.
- Lỗi sửa câu/upload ảnh: xem nhóm 6 + 15 nếu liên quan thông báo.
- Lỗi duyệt báo cáo: xem nhóm 7 + 8.
- Lỗi user/quyền/duyệt tài khoản: xem nhóm 9 + 10.
- Lỗi import/thêm môn: xem nhóm 11 + 12.
- Lỗi thùng rác: xem nhóm 13.
- Lỗi realtime: xem nhóm 14.
- NOTE_20260630: Chống mất ảnh khi admin sửa/duyệt: tải cột images, lưu qua /api/admin-action, không lưu base64.
- NOTE_20260630: Triệt để lỗi mất ảnh admin: QUESTION_COLS có images, realtime không xóa images, reload xóa session cache ảnh.
- NOTE_CLEANUP_20260630: Đã rà soát dọn dẹp — admin.js không còn dead code/console.log debug. Các comment "(... removed — superseded by ...)" được giữ lại có chủ đích để đánh dấu hàm cũ đã bị thay thế, tránh AI sau thêm lại.
- QUY_ƯỚC_CẤU_TRÚC: File là chuỗi bản vá theo ngày, bọc bởi marker "// ===== TÊN_NGÀY =====". KHÔNG xóa marker (là điểm neo tìm kiếm theo nhóm ở trên). Khi sửa, tìm marker liên quan và sửa trong block đó, ưu tiên hợp nhất thay vì vá chồng.
- KIẾN_TRÚC_20260701 (QUAN TRỌNG): Supabase CHỈ dùng Auth. Mọi dữ liệu admin đọc qua GET /api/admin-dashboard (trả profiles/questions/requests/history/logs/subjects/subject_requests/trash — nhớ parse JSON các cột text), ghi qua helper adminAction(action,payload) → POST /api/admin-action. KHÔNG dùng client.from(...) để đọc/ghi nữa.
- NHIỀU HÀM BỊ OVERRIDE (định nghĩa sau thắng): khi tìm hàm active, lấy bản window.X = ... CUỐI CÙNG trong file (vd loadAll, approve, saveSubjectAdmin, loadSubjectsAdmin, viewReq, revokeApproval...). CODE CHẾT còn sót dùng client.from(...) nằm trong các bản CŨ đã bị đè (loadAll #1 ~636, approve ~907, setRegistrationMode cũ, saveSubjectAdmin ~4737) + helper deleteRowById/fetchAllRows chỉ phục vụ code cũ — KHÔNG dựa vào, KHÔNG hồi sinh.
- compareHTML/viewReq render ẢNH THẬT từ cache Turso. logAction chỉ còn gửi Discord (admin_logs do API tự ghi). Xem thêm [[lxpacademy-data-source-split]] trong memory.
AI_ADMIN_JS_MAP_END */

const CONFIG = {
  SUPABASE_URL: window.APP_CONFIG?.SUPABASE_URL || 'https://kxyukiwhhorvxgxxxmfq.supabase.co',
  SUPABASE_ANON_KEY: window.APP_CONFIG?.SUPABASE_ANON_KEY || 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f'
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

function createTursoClientMock(supaClient) {
  let localCache = null;
  let cachePromise = null;

  async function fetchDashboardData() {
    if (cachePromise) return cachePromise;
    cachePromise = (async () => {
      try {
        const res = await fetch('/api/admin-dashboard?t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        normalizeDashboardData(data);
        localCache = data;
        return data;
      } catch (err) {
        console.error('[fetchDashboardData Error]', err);
        throw err;
      } finally {
        cachePromise = null;
      }
    })();
    return cachePromise;
  }

  function getUserId() {
    return user?.id || supaClient.auth.getUser()?.id || '';
  }

  function parseMaybeJson(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch (e) { return fallback; }
  }

  function normalizeDashboardData(data) {
    if (!data) return data;
    const normalizeQuestion = q => {
      if (!q) return q;
      q.options = parseMaybeJson(q.options, {});
      q.images = parseMaybeJson(q.images, []);
      q.is_active = !(q.is_active === 0 || q.is_active === false || q.is_active === '0');
      q.has_image = q.has_image === 1 || q.has_image === true || q.has_image === '1';
      return q;
    };
    const normalizeJsonCols = row => {
      if (!row) return row;
      ['old_data','new_data','previous_data','questions_data','original_data','details'].forEach(k => {
        if (k in row) row[k] = parseMaybeJson(row[k], k === 'questions_data' ? [] : {});
      });
      return row;
    };
    data.questions = (data.questions || []).map(normalizeQuestion);
    data.requests = (data.requests || []).map(normalizeJsonCols);
    data.history = (data.history || []).map(normalizeJsonCols);
    data.logs = (data.logs || []).map(normalizeJsonCols);
    data.subject_requests = (data.subject_requests || []).map(normalizeJsonCols);
    data.deleted_questions = (data.deleted_questions || []).map(normalizeJsonCols);
    data.deleted_subjects = (data.deleted_subjects || []).map(normalizeJsonCols);
    data.profiles = (data.profiles || []).map(p => {
      p.approved = p.approved === 1 || p.approved === true || p.approved === '1';
      p.blocked = p.blocked === 1 || p.blocked === true || p.blocked === '1';
      return p;
    });
    return data;
  }

  const builder = (tableName) => {
    let queryType = '';
    let selectCols = '';
    let filters = [];
    let payload = null;
    let orderCol = '';
    let orderOpts = {};
    let limitVal = null;
    let singleMode = false;
    let maybeSingleMode = false;

    const chain = {
      select: (cols) => {
        if (!queryType || queryType === 'select') {
          queryType = 'select';
        }
        selectCols = cols || '*';
        return chain;
      },
      eq: (col, val) => {
        filters.push({ col, val });
        return chain;
      },
      neq: (col, val) => {
        filters.push({ col, val, op: 'neq' });
        return chain;
      },
      in: (col, vals) => {
        filters.push({ col, val: vals, op: 'in' });
        return chain;
      },
      or: (expr) => {
        filters.push({ col: 'or', val: expr, op: 'or' });
        return chain;
      },
      order: (col, opts) => {
        orderCol = col;
        orderOpts = opts || {};
        return chain;
      },
      limit: (val) => {
        limitVal = val;
        return chain;
      },
      insert: (data) => {
        queryType = 'insert';
        payload = data;
        return chain;
      },
      update: (data) => {
        queryType = 'update';
        payload = data;
        return chain;
      },
      upsert: (data) => {
        queryType = 'upsert';
        payload = data;
        return chain;
      },
      delete: () => {
        queryType = 'delete';
        return chain;
      },
      single: () => {
        singleMode = true;
        return chain;
      },
      maybeSingle: () => {
        maybeSingleMode = true;
        return chain;
      },
      then: async (onfulfilled, onrejected) => {
        try {
          const resData = await executeQuery();
          return onfulfilled({ data: resData, error: null });
        } catch (err) {
          console.error('[Mock Execution Error]', err);
          if (onrejected) return onrejected({ data: null, error: err });
          return { data: null, error: err };
        }
      }
    };

    async function executeQuery() {
      if (queryType === 'select') {
        if (!localCache) {
          await fetchDashboardData();
        }
        
        let list = [];
        if (tableName === 'profiles') list = localCache.profiles || [];
        else if (tableName === 'questions') list = localCache.questions || [];
        else if (tableName === 'edit_requests') list = localCache.requests || [];
        else if (tableName === 'question_history') list = localCache.history || [];
        else if (tableName === 'admin_logs') list = localCache.logs || [];
        else if (tableName === 'subjects') list = localCache.subjects || [];
        else if (tableName === 'subject_requests') list = localCache.subject_requests || [];
        else if (tableName === 'deleted_questions') list = localCache.deleted_questions || [];
        else if (tableName === 'deleted_subjects') list = localCache.deleted_subjects || [];

        let filtered = [...list];
        for (const f of filters) {
          if (f.op === 'neq') {
            filtered = filtered.filter(x => x[f.col] !== f.val);
          } else if (f.op === 'in') {
            filtered = filtered.filter(x => Array.isArray(f.val) ? f.val.includes(x[f.col]) : false);
          } else if (f.op === 'or') {
            const exprs = String(f.val).split(',');
            filtered = filtered.filter(x => {
              return exprs.some(exp => {
                const parts = exp.split('.');
                const colName = parts[0];
                const op = parts[1];
                const target = parts[2];
                if (op === 'eq') return String(x[colName] || '').toUpperCase() === String(target || '').toUpperCase();
                if (op === 'like') {
                  const pattern = String(target || '').replace(/%/g, '').toUpperCase();
                  return String(x[colName] || '').toUpperCase().startsWith(pattern);
                }
                return false;
              });
            });
          } else {
            filtered = filtered.filter(x => x[f.col] === f.val);
          }
        }

        if (orderCol) {
          const asc = orderOpts.ascending !== false;
          filtered.sort((a, b) => {
            const va = a[orderCol], vb = b[orderCol];
            if (va < vb) return asc ? -1 : 1;
            if (va > vb) return asc ? 1 : -1;
            return 0;
          });
        }

        if (limitVal) {
          filtered = filtered.slice(0, limitVal);
        }

        if (tableName === 'site_settings') {
          const keyFilter = filters.find(f => f.col === 'key');
          if (keyFilter) {
            const val = keyFilter.val;
            const match = list.find(x => x.key === val);
            filtered = match ? [match] : [];
          }
        }

        if (singleMode || maybeSingleMode) {
          return filtered[0] || null;
        }
        return filtered;
      }

      const idFilter = filters.find(f => f.col === 'id');
      const idVal = idFilter ? idFilter.val : null;
      const codeFilter = filters.find(f => f.col === 'code');
      const codeVal = codeFilter ? codeFilter.val : null;

      let apiAction = '';
      let apiPayload = {};

      if (queryType === 'update') {
        if (tableName === 'edit_requests') {
          if (payload.status === 'approved') {
            apiAction = 'approve_request';
            apiPayload = { request_id: idVal };
          } else if (payload.status === 'rejected') {
            apiAction = 'reject_request';
            apiPayload = { request_id: idVal, admin_note: payload.admin_note };
          }
        } else if (tableName === 'questions') {
          if (payload.is_active === false || payload.is_active === 0) {
            apiAction = 'delete_question';
            apiPayload = { question_id: idVal };
          } else if (payload.is_active === true || payload.is_active === 1) {
            apiAction = 'restore_question';
            apiPayload = { question_id: idVal };
          } else {
            apiAction = 'save_question_direct';
            apiPayload = { question_id: idVal, new_data: payload, old_data: {} };
          }
        } else if (tableName === 'profiles') {
          if (payload.blocked !== undefined) {
            apiAction = 'toggle_user_block';
            apiPayload = { target_user_id: idVal, blocked: payload.blocked };
          } else if (payload.role !== undefined) {
            apiAction = 'set_user_role';
            apiPayload = { target_user_id: idVal, role: payload.role };
          } else if (payload.approved === true || payload.approved === 1) {
            apiAction = 'approve_user_registration';
            apiPayload = { target_user_id: idVal };
          } else if (payload.approved === false || payload.approved === 0) {
            apiAction = 'reject_user_registration';
            apiPayload = { target_user_id: idVal };
          }
        } else if (tableName === 'subjects') {
          if (payload.is_active === false || payload.is_active === 0) {
            apiAction = 'delete_subject';
            apiPayload = { subject_id: idVal };
          } else if (payload.is_active === true || payload.is_active === 1) {
            apiAction = 'restore_subject';
            apiPayload = { subject_id: idVal, code: payload.code };
          } else {
            apiAction = 'edit_subject';
            const subjectId = idVal || (codeVal && (localCache?.subjects || []).find(s => String(s.code) === String(codeVal))?.id);
            apiPayload = { id: subjectId, name: payload.name, description: payload.description, cover: payload.cover, sort_order: payload.sort_order };
          }
        } else if (tableName === 'subject_requests') {
          if (payload.status === 'approved') {
            apiAction = 'approve_subject_request';
            apiPayload = { request_id: idVal };
          } else if (payload.status === 'rejected') {
            apiAction = 'reject_subject_request';
            apiPayload = { request_id: idVal, admin_note: payload.admin_note };
          }
        }
      } else if (queryType === 'insert') {
        if (tableName === 'subjects') {
          apiAction = 'add_subject';
          apiPayload = payload;
        } else if (tableName === 'questions') {
          apiAction = 'add_question';
          apiPayload = { question_data: payload };
        } else if (tableName === 'subject_requests') {
          apiAction = 'add_subject_request';
          apiPayload = payload;
        } else if (tableName === 'deleted_questions') {
          return payload;
        } else if (tableName === 'admin_logs') {
          return payload;
        }
      } else if (queryType === 'delete') {
        if (tableName === 'profiles') {
          apiAction = 'reject_user_registration';
          apiPayload = { target_user_id: idVal };
        } else if (tableName === 'questions') {
          apiAction = 'permanent_delete_question';
          apiPayload = { question_id: idVal };
        }
      } else if (queryType === 'upsert' && tableName === 'site_settings') {
        apiAction = 'set_registration_mode';
        apiPayload = { mode: payload.value };
      }

      if (!apiAction) {
        return { ok: true };
      }

      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: getUserId(),
          action: apiAction,
          payload: apiPayload
        })
      });
      
      const r = await res.json();
      if (r.error) throw new Error(r.error);
      localCache = null;
      return r;
    }

    return chain;
  };

  return {
    from: builder,
    auth: supaClient.auth,
    clearCache: () => { localCache = null; cachePromise = null; }
  };
}

async function init() {
  if (!window.supabase) return alert('Không tải được Supabase');
  const baseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  if (window.APP_CONFIG?.USE_TURSO_API) {
    client = createTursoClientMock(baseClient);
  } else {
    client = baseClient;
  }
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

function cleanPageName(n) {
  // Bỏ icon/ký tự đầu và số badge cuối khi tên lấy từ textContent của nav (vd "✓ Phê duyệt 0" -> "Phê duyệt").
  return String(n || '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\d+\s*$/, '').replace(/\s+/g, ' ').trim();
}
function setPage(id, n) {
  n = cleanPageName(n);
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x.dataset.page === id));
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === id));
  $('crumb').textContent = n;
  $('title').textContent = n;
  try{ sessionStorage.setItem('admin_current_page', id); sessionStorage.setItem('admin_current_page_name', n); }catch(e){}
  render();
}

async function loadProfile() {
  // Lấy/đồng bộ profile (role/approved/blocked) từ Turso. Supabase chỉ dùng cho Auth.
  try {
    const md = user.user_metadata || {};
    const res = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ id: user.id, email: user.email, full_name: md.full_name || md.name || '', avatar_url: md.avatar_url || md.picture || '' })
    });
    const out = await res.json().catch(() => ({}));
    profile = out.data || { id: user.id, email: user.email, role: 'user' };
  } catch (e) {
    profile = { id: user.id, email: user.email, role: 'user' };
  }
  $('adminChip').textContent = `${profile.email || user.email} · ${profile.role}`;
  document.body.classList.toggle('role-admin', isAdmin());

  // ===== CHỈ THÔNG BÁO LOGIN KHI KHÔNG PHẢI LÀ F5 =====
  if (profile) {
    // Kiểm tra xem trong bộ nhớ tạm của lần duyệt này đã có nhãn "is_logged_in" chưa
    const isAlreadyNotified = sessionStorage.getItem('is_logged_in');

    if (!isAlreadyNotified) {
      // Đánh dấu ngay trước khi gửi để F5 không gửi trùng, và không await để
      // không làm treo quá trình tải trang nếu webhook Discord chậm/bị chặn.
      sessionStorage.setItem('is_logged_in', 'true');
      sendLoginToDiscord(profile.email || user.email, profile.role || 'user')
        .catch(e => console.warn('sendLoginToDiscord failed:', e));
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
  if (client.clearCache) client.clearCache();
  try {
    cache.profiles = await safeLoad('profiles', client.from('profiles').select('*').order('created_at', { ascending: false }));
    cache.questions = await safeLoad('questions', client.from('questions').select('id,num,subject_code,question,options,answer,images,is_active,updated_at,created_at,has_image,error_risk,error_risk_reason').order('num', { ascending: true }));
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
  // admin_logs đã được /api/admin-action tự ghi vào Turso, đây chỉ là thông báo
  // phụ qua Discord. KHÔNG await để tránh làm treo UI (nút cứ xoay mãi) nếu
  // webhook Discord chậm, bị rate-limit, hoặc bị trình duyệt/ad-blocker chặn -
  // trường hợp đó không được phép làm mất kết quả hành động chính đã thành công.
  sendActionToDiscord(a, t, id, d).catch(e => console.warn('logAction (Discord) failed:', e));
}

// Helper gọi action ghi dữ liệu vào Turso (Supabase chỉ còn dùng cho Auth).
async function adminAction(action, payload) {
  if (!user) { alert('Chưa đăng nhập.'); return false; }
  try {
    const res = await fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ user_id: user.id, action, payload: payload || {} }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) { alert('Thao tác thất bại: ' + (out.error || res.status)); return false; }
    return out;
  } catch (e) { alert('Lỗi mạng: ' + (e.message || e)); return false; }
}
window.adminAction = adminAction;

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
  const imgSrc = im => typeof im === 'string' ? im : (im && (im.secure_url || im.src || im.url || im.public_url || im.image_url)) || '';
  const imgsHTML = v => {
    let arr = v;
    if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch (e) { arr = arr ? [arr] : []; } }
    if (!Array.isArray(arr)) arr = arr ? [arr] : [];
    const srcs = arr.map(imgSrc).filter(s => /^https?:\/\//i.test(s));
    if (!srcs.length) return '<span class="muted">Không có ảnh</span>';
    return `<div style="display:flex;flex-wrap:wrap;gap:8px">${srcs.map(s => `<a href="${esc(s)}" target="_blank" rel="noopener"><img src="${esc(s)}" style="max-width:120px;max-height:120px;border-radius:8px;border:1px solid rgba(200,169,110,.3)"></a>`).join('')}</div>`;
  };
  return `<div class="diffList compactDiffList">${fields.map(f => {
    const isImg = f === 'images';
    const before = isImg ? imgsHTML(oldData?.[f]) : formatValue(oldData?.[f]);
    const after = isImg ? imgsHTML(newData?.[f]) : formatValue(newData?.[f]);
    const changed = isImg ? (formatValue(oldData?.[f]) !== formatValue(newData?.[f])) : (before !== after);
    if (isImg) {
      return `<section class="diffBlock ${changed ? 'changed' : ''} compactDiffBlock">
        <h3>${esc(labelField(f))}<span>${changed ? 'Đã đổi' : 'Không đổi'}</span></h3>
        <div class="compare compactCompare">
          <div class="oldValue"><b>Trước</b><br>${before}</div>
          <div class="newValue ${changed ? 'changedValue' : ''}"><b>Sau</b><br>${after}</div>
        </div>
      </section>`;
    }
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
    const res = await fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ user_id: user.id, action: 'reject_request', payload: { request_id: id, admin_note: note || '' } }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) return alert(out.error || 'Không từ chối được');
    await loadAll();
  } finally {
    setBusy(false);
  }
}

async function toggleBlock(id, b) {
  if (!isAdmin()) return alert('Chỉ admin được block.');
  if (user && id === user.id && b) return alert('Không nên tự khóa tài khoản đang dùng.');
  if (!confirm(`${b ? 'Block' : 'Unblock'} user này?`)) return;
  if (!await adminAction('toggle_user_block', { target_user_id: id, blocked: b })) return;
  await logAction(b ? 'block_user' : 'unblock_user', 'profiles', id, {});
  cache.profiles = (cache.profiles || []).map(p => String(p.id) === String(id) ? { ...p, blocked: b } : p);
  render();
  await loadAll();
}

async function setRole(id, role) {
  if (!isAdmin()) return alert('Chỉ admin được cấp/gỡ quyền.');
  if (user && id === user.id && role !== 'admin') return alert('Không nên tự gỡ quyền admin của tài khoản đang dùng.');
  if (!confirm(`Đổi vai trò thành ${role}?`)) return;
  if (!await adminAction('set_user_role', { target_user_id: id, role })) return;
  await logAction('change_role', 'profiles', id, { role });
  cache.profiles = (cache.profiles || []).map(p => String(p.id) === String(id) ? { ...p, role } : p);
  render();
  await loadAll();
}

async function toggleQuestion(id, a) {
  if (!confirm(`${a ? 'Hiện' : 'Ẩn'} câu hỏi này?`)) return;
  if (!await adminAction('toggle_question', { question_id: id, is_active: a })) return;
  await logAction(a ? 'show_question' : 'hide_question', 'questions', id, {});
  cache.questions = (cache.questions || []).map(q => String(q.id) === String(id) ? { ...q, is_active: a } : q);
  render();
  await loadAll();
}

function exportAll() {
  const subjects = Array.from(new Set((cache.questions || []).map(q => q.subject_code || 'HOD102').filter(Boolean))).sort();
  const subjectOptions = ['all', ...subjects].map(code => `<option value="${esc(code)}">${code === 'all' ? 'Tất cả môn' : esc(code)}</option>`).join('');
  openModal('Xuất dữ liệu (Turso)', `
    <div style="padding:10px 0;display:grid;gap:14px;">
      <p style="color:rgba(245,240,232,.72);margin:0 0 4px;font-size:0.9rem;line-height:1.4;">
        Dữ liệu xuất lấy trực tiếp từ Turso (database hiện tại). Phần câu hỏi có thể tải hết 1 lần hoặc chọn đúng môn.
      </p>

      <div style="border:1px solid rgba(200,169,110,.22);border-radius:16px;padding:14px;background:rgba(255,255,255,.025);display:grid;gap:10px;">
        <b style="color:var(--gold2);">Câu hỏi</b>
        <select id="exportQuestionSubject" style="width:100%;background:rgba(255,255,255,.045);border:1px solid var(--bd);border-radius:12px;color:var(--fog);padding:10px 12px;">
          ${subjectOptions}
        </select>
        <button class="act ok" id="exportQuestionsJsonBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          📄 Tải câu hỏi JSON (import lại được)
        </button>
        <button class="act" id="exportQuestionsCsvBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          📊 Tải câu hỏi CSV (mở Excel)
        </button>
      </div>

      <div style="border:1px solid rgba(200,169,110,.22);border-radius:16px;padding:14px;background:rgba(255,255,255,.025);display:grid;gap:10px;">
        <b style="color:var(--gold2);">Hồ sơ người dùng</b>
        <button class="act" id="exportProfilesJsonBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          👤 Tải profiles JSON
        </button>
        <button class="act" id="exportProfilesCsvBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          📊 Tải profiles CSV
        </button>
      </div>

      <div style="border:1px solid rgba(200,169,110,.14);border-radius:16px;padding:14px;background:rgba(255,255,255,.015);display:grid;gap:10px;">
        <b style="color:var(--mist);">Sao lưu đầy đủ</b>
        <button class="act" id="exportBtnFull" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          💾 Tải full_backup JSON (câu hỏi + môn + user + lịch sử)
        </button>
      </div>
    </div>
  `);

  $('exportQuestionsJsonBtn').onclick = () => downloadExportFile('questions_json', $('exportQuestionSubject')?.value || 'all');
  $('exportQuestionsCsvBtn').onclick = () => downloadExportFile('questions_csv', $('exportQuestionSubject')?.value || 'all');
  $('exportProfilesJsonBtn').onclick = () => downloadExportFile('profiles_json');
  $('exportProfilesCsvBtn').onclick = () => downloadExportFile('profiles_csv');
  $('exportBtnFull').onclick = () => downloadExportFile('full');
}

function downloadBlobFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function safeFilePart(s) {
  return String(s || 'all').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'all';
}

async function fetchAllRows(table, select = '*', applyQuery) {
  const pageSize = 1000;
  let from = 0;
  let rows = [];
  while (true) {
    let q = client.from(table).select(select);
    if (typeof applyQuery === 'function') q = applyQuery(q);
    q = q.range(from, from + pageSize - 1);
    const { data, error } = await q;
    if (error) throw error;
    const batch = data || [];
    rows = rows.concat(batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function fetchQuestionsForExport(subjectCode) {
  // Nguồn Turso: GET /api/questions (options/images đã parse, đúng schema import lại được).
  const p = new URLSearchParams({ ts: String(Date.now()) });
  if (subjectCode && subjectCode !== 'all') p.set('subject_code', subjectCode);
  const res = await fetch('/api/questions?' + p.toString(), { cache: 'no-store' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error || ('HTTP ' + res.status));
  const rows = Array.isArray(j.data) ? j.data : [];
  rows.sort((a, b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')) || (Number(a.num) || 0) - (Number(b.num) || 0));
  return rows;
}

async function fetchProfilesForExport() {
  // Nguồn Turso: dùng cache (đã nạp từ /api/admin-dashboard), nếu trống thì gọi lại.
  if (Array.isArray(cache.profiles) && cache.profiles.length) return cache.profiles;
  const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error || ('HTTP ' + res.status));
  return j.profiles || [];
}

// CSV cho câu hỏi: tách options A..E ra cột riêng cho dễ đọc trong Excel/Sheets.
function questionsToCsv(rows) {
  const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
  const header = ['subject_code', 'num', 'question', 'A', 'B', 'C', 'D', 'E', 'answer', 'answer_text', 'has_image', 'error_risk'];
  const lines = [header.join(',')];
  (rows || []).forEach(q => {
    const o = q.options || {};
    lines.push([q.subject_code, q.num, q.question, o.A, o.B, o.C, o.D, o.E, q.answer, q.answer_text, q.has_image ? 1 : 0, q.error_risk || 'low'].map(esc).join(','));
  });
  return '﻿' + lines.join('\r\n'); // BOM để Excel đọc đúng UTF-8 (tiếng Việt)
}

function toCsv(rows) {
  const cols = ['id','email','full_name','role','approved','blocked','avatar_url','last_login','last_activity','created_at'];
  const escCsv = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  return cols.join(',') + '\n' + rows.map(r => cols.map(c => escCsv(r[c])).join(',')).join('\n');
}

async function downloadExportFile(type, subjectCode = 'all') {
  try {
    setBusy(true, 'Đang xuất...');
    if (type === 'questions_json') {
      const rows = await fetchQuestionsForExport(subjectCode);
      downloadBlobFile(JSON.stringify(rows, null, 2), `questions_${safeFilePart(subjectCode)}.json`, 'application/json;charset=utf-8');
      try { await logAction('export_questions_json', 'questions', subjectCode, { count: rows.length }); } catch(e){}
      toast('Đã tải câu hỏi JSON');
    } else if (type === 'questions_csv') {
      const rows = await fetchQuestionsForExport(subjectCode);
      downloadBlobFile(questionsToCsv(rows), `questions_${safeFilePart(subjectCode)}.csv`, 'text/csv;charset=utf-8');
      try { await logAction('export_questions_csv', 'questions', subjectCode, { count: rows.length }); } catch(e){}
      toast('Đã tải câu hỏi CSV');
    } else if (type === 'profiles_json') {
      const rows = await fetchProfilesForExport();
      downloadBlobFile(JSON.stringify(rows, null, 2), 'profiles_export.json', 'application/json;charset=utf-8');
      try { await logAction('export_profiles_json', 'profiles', 'all', { count: rows.length }); } catch(e){}
      toast('Đã tải profiles JSON');
    } else if (type === 'profiles_csv') {
      const rows = await fetchProfilesForExport();
      downloadBlobFile(toCsv(rows), 'profiles_export.csv', 'text/csv;charset=utf-8');
      try { await logAction('export_profiles_csv', 'profiles', 'all', { count: rows.length }); } catch(e){}
      toast('Đã tải profiles CSV');
    } else {
      const full = {
        exported_at: new Date().toISOString(),
        source: 'turso',
        subjects: cache.subjects || [],
        profiles: await fetchProfilesForExport(),
        questions: await fetchQuestionsForExport('all'),
        requests: cache.requests || [],
        history: cache.history || [],
        logs: cache.logs || []
      };
      downloadBlobFile(JSON.stringify(full, null, 2), 'learninghub_full_backup.json', 'application/json;charset=utf-8');
      try { await logAction('export_full_backup', 'backup', 'json', { questions: full.questions.length, profiles: full.profiles.length }); } catch(e){}
      toast('Đã tải full backup');
    }
    closeModal();
  } catch (e) {
    alert('Xuất dữ liệu thất bại: ' + (e?.message || e));
  } finally {
    setBusy(false);
  }
}


Object.assign(window, { approve, rejectReq, toggleBlock, setRole, toggleQuestion, viewReq, viewHistory, viewQuestion, viewUserEdits });


// ===== F5_SUPABASE_MICRO_CACHE_20260629 =====
// Giảm gọi Supabase khi F5: cache/dedupe các GET nhẹ từ Supabase trong thời gian ngắn.
// Lưu ý: F5 vẫn phải tải khung web; phần này chỉ giảm các request Supabase lặp và request không đổi.
(function(){
  if(window.__F5_SUPABASE_MICRO_CACHE_20260629) return;
  window.__F5_SUPABASE_MICRO_CACHE_20260629 = true;

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if(!nativeFetch) return;

  const MEM = new Map();
  const PENDING = new Map();
  const SS_PREFIX = 'admin_f5_micro_cache:';
  const MAX_BODY = 160 * 1024;

  function isGet(init){ return String(init && init.method ? init.method : 'GET').toUpperCase() === 'GET'; }
  function isSupabaseRest(url){ return /\/rest\/v1\//.test(url.pathname); }
  function isSafePath(path){
    return /\/(profiles|site_settings|subjects|subject_requests|edit_requests|question_history|admin_logs|questions)\b/.test(path);
  }
  function ttlFor(url){
    const p = url.pathname;
    const q = url.search || '';
    if(/\/profiles\b/.test(p) && /id=eq\./.test(q)) return 10 * 60 * 1000;
    if(/\/site_settings\b/.test(p)) return 10 * 60 * 1000;
    if(/\/subjects\b/.test(p)) return 0; // FIX: không cache môn học để xóa/sửa hiện ngay
    if(/\/subject_requests\b/.test(p)) return 45 * 1000;
    if(/\/edit_requests\b/.test(p)) return 30 * 1000;
    if(/\/question_history\b/.test(p)) return 60 * 1000;
    if(/\/admin_logs\b/.test(p)) return 30 * 1000;
    if(/\/questions\b/.test(p) && !/images/i.test(q)) return 0; // FIX: không cache câu hỏi để xóa môn cập nhật ngay
    return 0;
  }
  function keyOf(url, init){
    const auth = (init && init.headers && (init.headers.Authorization || init.headers.authorization)) || '';
    return url.origin + url.pathname + url.search + '|' + String(auth).slice(-18);
  }
  function headersObj(headers){
    const out = {};
    try{ headers.forEach((v,k)=>out[k]=v); }catch(e){}
    return out;
  }
  function makeResponse(entry){
    return new Response(entry.body, {status:entry.status || 200, statusText:entry.statusText || 'OK', headers:entry.headers || {}});
  }
  function readSession(key){
    try{
      const raw = sessionStorage.getItem(SS_PREFIX + key);
      if(!raw) return null;
      const entry = JSON.parse(raw);
      if(!entry || !entry.exp || Date.now() > entry.exp) return null;
      return entry;
    }catch(e){ return null; }
  }
  function writeSession(key, entry){
    try{ sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(entry)); }catch(e){}
  }
  async function storeResponse(key, ttl, res){
    try{
      const clone = res.clone();
      const text = await clone.text();
      if(text.length > MAX_BODY) return;
      const entry = {body:text, status:res.status, statusText:res.statusText, headers:headersObj(res.headers), exp:Date.now()+ttl};
      MEM.set(key, entry);
      writeSession(key, entry);
    }catch(e){}
  }

  window.fetch = async function(input, init){
    let url;
    try{ url = new URL(typeof input === 'string' ? input : input.url, location.href); }catch(e){ return nativeFetch(input, init); }
    if(!isGet(init) || !isSupabaseRest(url) || !isSafePath(url.pathname)) return nativeFetch(input, init);

    const ttl = ttlFor(url);
    if(!ttl) return nativeFetch(input, init);
    const key = keyOf(url, init);

    const mem = MEM.get(key);
    if(mem && Date.now() <= mem.exp) return makeResponse(mem);
    const ss = readSession(key);
    if(ss){ MEM.set(key, ss); return makeResponse(ss); }

    if(PENDING.has(key)){
      try{
        const entry = await PENDING.get(key);
        if(entry) return makeResponse(entry);
      }catch(e){}
    }

    const p = nativeFetch(input, init).then(async res => {
      if(res && res.ok) await storeResponse(key, ttl, res);
      return MEM.get(key) || null;
    }).finally(()=>PENDING.delete(key));
    PENDING.set(key, p);

    const res = await nativeFetch(input, init);
    if(res && res.ok) await storeResponse(key, ttl, res);
    return res;
  };
})();
// ===== END F5_SUPABASE_MICRO_CACHE_20260629 =====

document.addEventListener('DOMContentLoaded', init);


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


// ===== FINAL_ADMIN_SUBJECT_TABS_ADD_DELETE_QUESTIONS_20260613 =====
// Tab Câu hỏi: chia theo môn + thêm câu + xóa vĩnh viễn + ẩn/hiện.
(function(){
  let activeQuestionSubject = localStorage.getItem('admin_question_subject_filter_v1') || 'all';

  function isQuestionActiveForDeletedSubjectFix(q){
    return !(q?.is_active === false || q?.is_active === 0 || q?.is_active === '0');
  }

  function subjectsFromQuestions(){
    const rows = (cache.questions || []).filter(isQuestionActiveForDeletedSubjectFix);
    const set = new Set(rows.map(q => q.subject_code || 'HOD102').filter(Boolean));
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    return Array.from(set).sort((a,b) => String(a).localeCompare(String(b)));
  }

  function subjectCount(code){
    const rows = (cache.questions || []).filter(isQuestionActiveForDeletedSubjectFix);
    if(code === 'all') return rows.length;
    return rows.filter(q => (q.subject_code || 'HOD102') === code).length;
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
      if(!await adminAction('add_question', { question_data: payload })) return;
      await logAction('add_question', 'questions', num, { subject_code: subject, num });
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
      // Server (Turso) soft-delete + tự backup vào deleted_questions.
      if(!await adminAction('delete_question', { question_id: id })) return;
      await logAction('delete_question', 'questions', id, { subject_code: q.subject_code, num: q.num });
      await loadAll();
      toast('Đã chuyển vào Thùng rác');
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
    const visibleSubjectSet = new Set(subjectsFromQuestions());
    const arr = (cache.questions || [])
      .filter(q => visibleSubjectSet.has(q.subject_code || 'HOD102'))
      .filter(q => activeQuestionSubject === 'all' || (q.subject_code || 'HOD102') === activeQuestionSubject)
      .filter(q => match(`${q.subject_code || ''} ${q.num || ''} ${q.question || ''} ${q.answer || ''}`))
      .sort((a,b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')) || (Number(a.num)||0) - (Number(b.num)||0))
      .slice(0, 300);

    $('questionList').innerHTML = toolbar + `<div class="questionResultNote">Đang hiển thị ${arr.length} câu${activeQuestionSubject !== 'all' ? ' của môn ' + esc(activeQuestionSubject) : ''}.</div>` + html;
  };
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
      if(!await adminAction('approve_user_registration', { target_user_id: uid })) return;
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
      if(!await adminAction('reject_user_registration', { target_user_id: uid })) return;
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
      if(!await adminAction('revoke_user_approval', { target_user_id: uid })) return;
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
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));
      if(!res.ok || out.error) throw new Error(out.error || ('HTTP ' + res.status));
      registrationMode = String(out.registration_mode || 'approval').replace(/"/g,'').trim() || 'approval';
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
      const res = await fetch('/api/admin-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ user_id: user?.id, action: 'set_registration_mode', payload: { mode } }) });
      const out = await res.json().catch(() => ({}));
      if(!res.ok || out.error) return alert('Lỗi: ' + (out.error || res.status));
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

        try{
          const res = await fetch('/api/admin-action', { method:'POST', headers:{'Content-Type':'application/json'}, cache:'no-store', body: JSON.stringify({ user_id: user?.id, action:'add_question', payload:{ question_data: payload } }) });
          const out = await res.json().catch(()=>({}));
          if(!res.ok || out.error){ console.warn('Import lỗi câu ' + num + ':', out.error || res.status); errors++; }
          else success++;
        }catch(e){ console.warn('Import lỗi câu ' + num + ':', e.message || e); errors++; }
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
      // Lấy từ cache Turso (đã nạp ở loadAll), không gọi Supabase.
      subjectData = (cache.subjects || []).find(s => String(s.code || '').toUpperCase() === String(code).toUpperCase());
      if(!subjectData) throw new Error('Không tìm thấy môn ' + code);
      questionsCount = (cache.questions || []).filter(q => String(q.subject_code || '').toUpperCase() === String(code).toUpperCase()).length;
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
          const actionRes = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id,
              action: 'delete_subject',
              payload: { subject_id: subjectData.id }
            })
          });
          const actionJson = await actionRes.json().catch(() => ({}));
          if(!actionRes.ok || actionJson.error){
            throw new Error(actionJson.error || 'Không xóa được môn học.');
          }

          const questionsData = Array.from(cache.questions || []).filter(q => String(q.subject_code || '').toUpperCase() === String(code || '').toUpperCase());

          // FIX: cập nhật giao diện ngay, tránh thấy môn vừa xóa do cache/trang hiện tại.
          cache.questions = (cache.questions || []).filter(q => String(q.subject_code || '').toUpperCase() !== String(code || '').toUpperCase());
          if(window.__ADMIN_PAGE_STATE__){
            window.__ADMIN_PAGE_STATE__.subjects = (window.__ADMIN_PAGE_STATE__.subjects || []).filter(s => String(s).toUpperCase() !== String(code || '').toUpperCase());
            if(window.__ADMIN_PAGE_STATE__.subject !== 'all' && String(window.__ADMIN_PAGE_STATE__.subject).toUpperCase() === String(code || '').toUpperCase()){
              window.__ADMIN_PAGE_STATE__.subject = 'all';
              localStorage.setItem('admin_question_subject_filter_v1', 'all');
            }
          }

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
      // Server (Turso) tạo môn + nhập toàn bộ câu hỏi (kèm ảnh) + cập nhật trạng thái request.
      if(!await adminAction('approve_subject_request', { request_id: id })) return;
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
      if(!await adminAction('reject_subject_request', { request_id: id, admin_note: note || '' })) return;
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
        if(!subject.id) return alert('Không tìm thấy ID môn học. Bấm Tải lại rồi thử lại.');
        if(!await adminAction('edit_subject', { id: subject.id, name, description: description || '', cover: subject.cover || '', sort_order: subject.sort_order || 0 })) return;
        subject.name = name;
        subject.description = description || '';
      } else {
        // Đổi mã môn + chuyển toàn bộ câu hỏi sang mã mới (xử lý trên Turso).
        if(!await adminAction('rename_subject_code', { old_code: oldCode, new_code: newCode, name, description: description || '' })) return;
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
      // Lấy từ cache Turso (loadAll đã nạp + parse original_data). Nếu trống thì tải lại dashboard.
      if(!cache.deleted_questions || !cache.deleted_subjects){ await loadAll(); }
      deletedQuestionsCache = cache.deleted_questions || [];
      deletedSubjectsCache = cache.deleted_subjects || [];

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
      const q = t.original_data || {};
      if(!await adminAction('restore_question', { question_id: q.id || id })) return;
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
      if(!await adminAction('permanent_delete_question', { question_id: id })) return;
      await logAction('permanent_delete','deleted_questions',id,{subject_code:q.subject_code,num:q.num});
      await loadAll();
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
      // Server (Turso) khôi phục môn + toàn bộ câu hỏi từ bản backup.
      if(!await adminAction('restore_subject', { subject_id: id, code: backup.subject?.code })) return;
      await logAction('restore_subject','subjects',backup.subject?.code,{questions: backup.questions?.length});
      await loadAll();
      await loadTrash();
      toast('Đã khôi phục môn '+(backup.subject?.code || ''));
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
// Gửi qua /api/notify — server xác thực user_id+email khớp profile rồi mới gọi webhook (đọc từ env, không lộ ra client).
async function sendActionToDiscord(actionName, targetType, targetId, details) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'action',
        user_id: user?.id,
        email: user?.email || profile?.email,
        action_name: actionName,
        target_type: targetType,
        target_id: targetId
      }),
      signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(8000) : undefined
    });
  } catch (error) {
    console.warn('Lỗi gửi Discord Client:', error);
  }
}


// Hàm chuyên biệt để thông báo khi có người đăng nhập thành công vào hệ thống
async function sendLoginToDiscord(email, role) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'login', user_id: user?.id, email, role, source: 'admin' }),
      signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(8000) : undefined
    });
  } catch (error) {
    console.warn('Lỗi gửi thông báo login:', error);
  }
}


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
      if(!await adminAction('revoke_user_approval', { target_user_id: uid })) return;
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
    if(!user) return alert('Chưa đăng nhập.');
    const oldQ=await getFullQuestion(id); if(!oldQ) return;
    const ops={}; document.querySelectorAll('[data-dq-opt]').forEach(t=>{const v=(t.value||'').trim(); if(v) ops[t.dataset.dqOpt]=v;});
    const question=($('dqQuestion')?.value||'').trim(); const answer=($('dqAnswer')?.value||'').trim().toUpperCase();
    if(!question) return alert('Câu hỏi không được để trống.'); if(!answer) return alert('Đáp án đúng không được để trống.');
    let list = Array.isArray(directEditDraftImages) ? directEditDraftImages : [];
    list = list.map(im=>{
      if(typeof im==='string') return {src:im,url:im,secure_url:im,source:im.includes('cloudinary.com')?'cloudinary':'url'};
      const src=im.src||im.url||im.secure_url||im.publicUrl||im.public_url||'';
      return {...im,src,url:im.url||src,secure_url:im.secure_url||src};
    }).filter(im=>im && im.src && !String(im.src).startsWith('data:image/'));
    const localHasImg = list.length > 0;
    const contentText = question + ' ' + Object.values(ops).join(' ');
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(contentText);
    const payload={
      id,
      subject_code: oldQ.subject_code || null,
      num: oldQ.num || null,
      question,
      options:ops,
      answer,
      answer_text:Object.entries(ops).filter(([k])=>answer.includes(k)).map(([k,v])=>`${k}. ${v}`).join('; '),
      images:list,
      updated_at:new Date().toISOString(),
      has_image: localHasImg || needsImg,
      error_risk: answer.length > 1 ? 'medium' : 'low',
      error_risk_reason: answer.length > 1 ? 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ' : null
    };
    setBusy(true,'Đang lưu...');
    try{
      const res = await fetch('/api/admin-action', {method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({user_id:user.id,action:'save_question_direct',payload:{question_id:id,new_data:payload,old_data:oldQ}})});
      const out = await res.json().catch(()=>({}));
      if(!res.ok || out.error) return alert(out.error || 'Không lưu được vào Turso');
      if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
      const idx=(cache.questions||[]).findIndex(x=>String(x.id)===String(id)); if(idx>=0) cache.questions[idx]={...cache.questions[idx],...payload};
      closeModal(); renderQuestions(); toast('Đã sửa trực tiếp'); await loadAll();
    }finally{ setBusy(false); }
  };
})();


// ===== COPILOT_ADMIN_QUESTION_PAGE_FINAL_OVERRIDE_20260627 =====
// Chỉ tải 50 câu/trang, CÓ tải cột images để tránh lưu đè làm mất ảnh.
(function(){
  const QUESTION_COLS='id,num,subject_code,question,options,answer,images,is_active,updated_at,created_at,has_image,error_risk,error_risk_reason';
  const STATE=window.__ADMIN_PAGE_STATE__=window.__ADMIN_PAGE_STATE__||{page:1,size:50,total:0,subject:localStorage.getItem('admin_question_subject_filter_v1')||'all',subjects:[]};
  function search(){return String($('search')?.value||'').trim();}
  async function safeQ(p){try{const r=await p;return r.error?[]:(r.data||[])}catch(e){return[]}}
  async function loadSubjects(){
    // FIX: tab môn phải lấy từ bảng subjects, không lấy từ questions.
    // Nếu lấy từ questions thì môn đã xóa vẫn hiện khi còn câu hỏi cũ/cache.
    const subjects = await safeQ(client.from('subjects').select('code,is_active').order('sort_order',{ascending:true}).order('code',{ascending:true}));
    let set = new Set(subjects.filter(s => s && s.code && s.is_active !== false).map(s => s.code));
    if(!set.size){
      const rows = await safeQ(client.from('questions').select('subject_code').limit(10000));
      set = new Set(rows.map(x=>x.subject_code||'HOD102').filter(Boolean));
    }
    if(!set.size){set.add('HOD102');set.add('MLN111')}
    STATE.subjects=[...set].sort();
    if(STATE.subject !== 'all' && !STATE.subjects.includes(STATE.subject)){
      STATE.subject = 'all';
      localStorage.setItem('admin_question_subject_filter_v1','all');
    }
  }
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
  let rt=null;window.startAdminRealtime=function(){if(rt||!client||!user||!profile||!isEditor())return;rt=client.channel('admin-lite-final').on('postgres_changes',{event:'*',schema:'public',table:'questions'},p=>{const row=p.new||p.old||{};const i=(cache.questions||[]).findIndex(x=>String(x.id)===String(row.id));if(p.eventType==='DELETE'&&i>=0)cache.questions.splice(i,1);else if(p.eventType==='UPDATE'&&i>=0)cache.questions[i]={...cache.questions[i],...row};else if(p.eventType==='INSERT')STATE.total++;renderQuestions();}).subscribe();};
  const inp=$('search');if(inp&&!inp.__adminFinalSearch){inp.__adminFinalSearch=true;let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{STATE.page=1;loadQuestionPage().then(render)},350)},{passive:true});}
  const btn=$('refreshBtn');if(btn)btn.onclick=loadAll;
})();


// ===== FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627 =====
// Fix: tab Yêu cầu sửa và Yêu cầu thêm môn không hiện data do bản tối ưu trước đó load thiếu cột/không gọi load subject_requests.
(function(){
  const QUESTION_COLS='id,num,subject_code,question,options,answer,images,is_active,updated_at,created_at,has_image,error_risk,error_risk_reason';
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
    // FIX: danh sách tab môn lấy từ bảng subjects.
    // Không lấy từ questions, vì môn đã xóa vẫn có thể còn trong câu hỏi/cache nên bị hiện lại.
    const sres = await safeQuery('subjects', client.from('subjects').select('code,is_active').order('sort_order', {ascending:true}).order('code', {ascending:true}));
    let set = new Set((sres.data || []).filter(s => s && s.code && s.is_active !== false).map(s => s.code));
    if(!set.size){
      const r = await safeQuery('subjects fallback from questions', client.from('questions').select('subject_code').limit(10000));
      set = new Set((r.data||[]).map(x => x.subject_code || 'HOD102').filter(Boolean));
    }
    if(!set.size){ set.add('HOD102'); set.add('MLN111'); }
    STATE.subjects = Array.from(set).sort((a,b)=>String(a).localeCompare(String(b)));
    if(STATE.subject !== 'all' && !STATE.subjects.includes(STATE.subject)){
      STATE.subject = 'all';
      localStorage.setItem('admin_question_subject_filter_v1', 'all');
    }
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
    try{
      const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
      const dash = await res.json().catch(() => ({}));
      if(!res.ok || dash.error) throw new Error(dash.error || ('HTTP ' + res.status));
      subjectReqCache = (dash.subject_requests || []).map(s => ({ ...s, questions_data: (typeof s.questions_data === 'string' ? (() => { try { return JSON.parse(s.questions_data); } catch(e){ return []; } })() : s.questions_data) || [] }));
      cache.subject_requests = subjectReqCache;
    }catch(e){
      if(el) el.innerHTML = `<p class="muted">Không tải được subject_requests: ${esc(e.message || e)}</p>`;
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
    const r = (cache.requests || []).find(x => String(x.id) === String(id));
    if(!r) return alert('Không tìm thấy yêu cầu sửa.');
    // Lấy câu hỏi gốc từ cache Turso (đã nạp ở loadAll), không gọi Supabase nữa.
    let q = (cache.questions || []).find(x => String(x.id) === String(r.question_id))
      || (cache.questions || []).find(x => String(x.num) === String(r.question_num));
    const oldData = Object.assign({}, q || {}, r.old_data || {});
    if(q && !Object.prototype.hasOwnProperty.call(oldData,'images')) oldData.images = q.images || [];
    const newData = Object.assign({}, r.new_data || {});
    if(!Object.prototype.hasOwnProperty.call(newData,'images') && r.new_data && Object.keys(r.new_data).length) newData.images = [];
    openModal(`Yêu cầu sửa câu ${typeof questionLabel==='function'?questionLabel(r):(r.question_num||r.id)}`, compareHTML(oldData, newData));
  };
})();
// ===== END FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628 =====


// ===== COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628 =====
// Giảm dữ liệu tải khi reload admin: không tải full question_history 500 dòng mỗi lần.
// Dòng nặng nhất trước đây là question_history?select=*... ~1.4MB.
(function () {
  if (window.__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628) return;
  window.__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628 = true;

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) return;

  const HISTORY_LIGHT_COLS = 'id,question_id,question_num,subject_code,created_at,changed_by,changed_by_email,user_email,admin_email,approved_by,request_id';
  const cache = new Map();
  const pending = new Map();

  function isSupabaseRest(url) {
    return /\/rest\/v1\//.test(url.pathname);
  }

  function methodOf(init) {
    return String(init && init.method ? init.method : 'GET').toUpperCase();
  }

  function ttlFor(url, method) {
    if (!isSupabaseRest(url)) return 0;
    if (method !== 'GET' && method !== 'HEAD') return 0;
    if (url.pathname.includes('/rest/v1/site_settings')) return 30000;
    if (url.pathname.includes('/rest/v1/subject_requests')) return 5000;
    if (url.pathname.includes('/rest/v1/profiles') && url.searchParams.has('id')) return 10000;
    return 0;
  }

  function slimAdminUrl(url, method) {
    if (!isSupabaseRest(url)) return url;
    if (method !== 'GET' && method !== 'HEAD') return url;

    // Chỉ ở danh sách lịch sử: lấy metadata nhẹ. Khi bấm Trước/sau sẽ fetch full 1 dòng riêng.
    if (url.pathname.includes('/rest/v1/question_history') && url.searchParams.get('select') === '*') {
      url.searchParams.set('select', HISTORY_LIGHT_COLS);
      if (!url.searchParams.has('limit')) url.searchParams.set('limit', '300');
    }

    return url;
  }

  function key(method, url) {
    return method + ' ' + url.toString();
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

  window.fetch = async function (input, init) {
    let url;
    try {
      const raw = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      url = new URL(raw, location.href);
    } catch (e) {
      return nativeFetch(input, init);
    }

    const method = methodOf(init);
    url = slimAdminUrl(url, method);

    let nextInput = input;
    if (typeof input === 'string') nextInput = url.toString();
    else if (input && input.url && input.url !== url.toString()) nextInput = new Request(url.toString(), input);

    const ttl = ttlFor(url, method);
    if (!ttl) return nativeFetch(nextInput, init);

    const k = key(method, url);
    const now = Date.now();
    const hit = cache.get(k);
    if (hit && now - hit.t < ttl) return unpack(hit.pack);

    if (pending.has(k)) return unpack(await pending.get(k));

    const job = nativeFetch(nextInput, init)
      .then(packResponse)
      .then(pack => {
        cache.set(k, { t: Date.now(), pack });
        pending.delete(k);
        return pack;
      })
      .catch(err => {
        pending.delete(k);
        throw err;
      });

    pending.set(k, job);
    return unpack(await job);
  };

  // Vì list lịch sử đã tải bản nhẹ, khi bấm Trước/sau thì lấy full đúng 1 dòng.
  window.viewHistory = async function (id) {
    const h = (window.cache?.history || cache?.history || []).find(x => String(x.id || '') === String(id || ''));
    if (!h) return alert('Không tìm thấy lịch sử.');
    if (typeof openModal === 'function' && typeof compareHTML === 'function') {
      openModal('Lịch sử', compareHTML(h.previous_data || {}, h.new_data || {}));
    }
  };
})();
// ===== END COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628 =====

// ===== COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629 =====
// Thêm nút "Xóa yêu cầu lỗi" trong tab Yêu cầu thêm môn để xóa dòng subject_requests bị lỗi.
(function(){
  function reqIdArg(v){ return JSON.stringify(String(v ?? '')); }
  async function findSubjectRequestForDelete(id){
    // Tìm trong cache Turso (đã nạp từ /api/admin-dashboard).
    return (cache.subject_requests || []).find(x => String(x.id) === String(id)) || null;
  }

  const oldLoadSubjectRequestsDeleteBad = window.loadSubjectRequests;
  if(typeof oldLoadSubjectRequestsDeleteBad === 'function'){
    window.loadSubjectRequests = async function(){
      const out = await oldLoadSubjectRequestsDeleteBad.apply(this, arguments);
      setTimeout(() => {
        document.querySelectorAll('#subjectRequestList .subjectRequestItem').forEach(card => {
          const actions = card.querySelector('.actions');
          if(!actions || actions.querySelector('.deleteBadSubjectReqBtn')) return;
          const approveBtn = actions.querySelector('button[onclick*="approveSubjectRequest"]');
          const onclick = approveBtn?.getAttribute('onclick') || '';
          const m = onclick.match(/approveSubjectRequest\(([^)]+)\)/);
          if(!m) return;
          const raw = String(m[1] || '').replace(/^['"]|['"]$/g, '');
          const btn = document.createElement('button');
          btn.className = 'act bad deleteBadSubjectReqBtn';
          btn.type = 'button';
          btn.textContent = 'Xóa yêu cầu lỗi';
          btn.onclick = () => window.deleteBadSubjectRequest(raw);
          actions.appendChild(btn);
        });
      }, 50);
      return out;
    };
  }

  window.deleteBadSubjectRequest = async function(id){
    if(!isAdmin()) return alert('Chỉ admin mới được xóa yêu cầu lỗi.');
    const r = await findSubjectRequestForDelete(id);
    if(!r) return alert('Không tìm thấy yêu cầu trong database. Bấm Tải lại rồi thử lại.');
    const label = (r.code || '?') + ' - ' + (r.name || '');
    if(!confirm('Xóa yêu cầu thêm môn bị lỗi này?\n\n' + label + '\n\nNếu database không cho xóa hẳn, hệ thống sẽ ẩn yêu cầu này khỏi danh sách chờ duyệt.')) return;
    setBusy(true, 'Đang xóa yêu cầu lỗi...');
    try{
      // Ẩn yêu cầu lỗi bằng cách chuyển trạng thái rejected trong Turso.
      if(!await adminAction('reject_subject_request', { request_id: id, admin_note: 'Đã ẩn yêu cầu lỗi' })) return;
      await logAction('delete_bad_subject_request', 'subject_requests', id, {code:r.code, name:r.name});
      await window.loadSubjectRequests?.();
      toast('Đã xóa/ẩn yêu cầu lỗi');
    }finally{ setBusy(false); }
  };

  // Nếu render hiện tại dùng HTML trong patch cuối, sửa trực tiếp để luôn có nút xóa.
  const oldFilterSubjectRequestsDeleteBad = window.filterSubjectRequests;
  if(typeof oldFilterSubjectRequestsDeleteBad === 'function'){
    window.filterSubjectRequests = function(){
      const out = oldFilterSubjectRequestsDeleteBad.apply(this, arguments);
      setTimeout(() => window.loadSubjectRequests?.(), 30);
      return out;
    };
  }
})();
// ===== END_COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629 =====


// ===== MANUAL_ADMIN_RELOAD_ONLY_20260629 =====
// Tắt realtime tự cập nhật để giảm gọi Supabase.
// Admin cần bấm nút "Tải lại" để cập nhật danh sách user/trạng thái hoạt động.
(function(){
  if(window.__MANUAL_ADMIN_RELOAD_ONLY_20260629) return;
  window.__MANUAL_ADMIN_RELOAD_ONLY_20260629 = true;

  function setManualChip(){
    try{
      const chip = document.getElementById('adminAutoCheckChip');
      if(!chip) return;
      chip.classList.remove('is-live','is-checking','is-error','is-idle');
      chip.classList.add('is-manual');
      const text = chip.querySelector('.autoText');
      if(text) text.textContent = 'Thủ công';
      const dot = chip.querySelector('.autoDot');
      if(dot) dot.style.background = 'var(--gold2)';
    }catch(e){}
  }

  window.startAdminRealtime = function(){
    setManualChip();
    return null;
  };
  window.stopAdminRealtime = function(){
    setManualChip();
    return null;
  };

  document.addEventListener('DOMContentLoaded', function(){
    setManualChip();
    setTimeout(setManualChip, 500);
    setTimeout(setManualChip, 1500);
  });
  setInterval(setManualChip, 3000);
})();
// ===== END MANUAL_ADMIN_RELOAD_ONLY_20260629 =====

// ===== COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629 =====
// Tắt sạch realtime admin để giảm gọi Supabase ngầm.
// Từ giờ admin chỉ tải dữ liệu khi bấm nút "Tải lại" hoặc thao tác chủ động.
(function(){
  if(window.__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629) return;
  window.__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629 = true;

  function setManualChip(){
    try{
      const chip = document.getElementById('adminAutoCheckChip');
      if(!chip) return;
      chip.classList.remove('is-live','is-checking','is-error','is-idle');
      chip.classList.add('is-manual');
      const text = chip.querySelector('.autoText');
      if(text) text.textContent = 'Thủ công';
      const dot = chip.querySelector('.autoDot');
      if(dot) dot.style.background = 'var(--gold2)';
    }catch(e){}
  }

  function removeAdminRealtimeChannels(){
    try{
      if(!client || typeof client.getChannels !== 'function') return;
      client.getChannels().forEach(function(ch){
        const topic = String(ch?.topic || ch?.subTopic || '');
        if(topic.includes('learning-hub-admin-realtime') || topic.includes('admin-lite-final')){
          try{ client.removeChannel(ch); }catch(e){}
        }
      });
    }catch(e){}
  }

  window.startAdminRealtime = function(){
    removeAdminRealtimeChannels();
    setManualChip();
    return null;
  };
  window.startAdminRealtimeFinal = function(){
    removeAdminRealtimeChannels();
    setManualChip();
    return null;
  };
  window.stopAdminRealtime = function(){
    removeAdminRealtimeChannels();
    setManualChip();
    return null;
  };
  window.stopAdminRealtimeFinal = function(){
    removeAdminRealtimeChannels();
    setManualChip();
    return null;
  };

  document.addEventListener('DOMContentLoaded', function(){
    setManualChip();
    setTimeout(function(){ removeAdminRealtimeChannels(); setManualChip(); }, 500);
    setTimeout(function(){ removeAdminRealtimeChannels(); setManualChip(); }, 1500);
  });

  setTimeout(function(){ removeAdminRealtimeChannels(); setManualChip(); }, 300);
  setInterval(function(){ removeAdminRealtimeChannels(); setManualChip(); }, 10000);
})();
// ===== END COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629 =====

// ===== MOBILE_APPROVAL_LITE_ADMIN_20260629 =====
// Mobile admin nhẹ: ưu tiên màn Phê duyệt user, giảm khu vực không cần thiết trên điện thoại.
(function(){
  if(window.__MOBILE_APPROVAL_LITE_ADMIN_20260629) return;
  window.__MOBILE_APPROVAL_LITE_ADMIN_20260629 = true;

  var mq = window.matchMedia ? window.matchMedia('(max-width: 680px)') : null;
  function isMobile(){ return mq ? mq.matches : window.innerWidth <= 680; }

  function applyMobileClass(){
    document.body.classList.toggle('adminMobileLite', isMobile());
  }

  function openApprovalsOnMobile(force){
    if(!isMobile()) return;
    var appBox = document.getElementById('appBox');
    if(appBox && appBox.classList.contains('hidden')) return;
    var target = document.querySelector('.nav[data-page="approvals"]');
    if(!target) return;
    if(!force && sessionStorage.getItem('admin_mobile_lite_opened') === '1') return;
    try{ sessionStorage.setItem('admin_mobile_lite_opened','1'); }catch(e){}
    if(typeof setPage === 'function') setPage('approvals','Phê duyệt');
    else target.click();
    setTimeout(function(){
      if(typeof renderApprovals === 'function') renderApprovals();
      if(typeof loadRegistrationMode === 'function') loadRegistrationMode();
    }, 80);
  }

  // Giảm tải Supabase trên điện thoại: chỉ tải profiles để duyệt user.
  // Desktop vẫn dùng loadAll gốc đầy đủ.
  var originalLoadAll = typeof loadAll === 'function' ? loadAll : null;
  if(originalLoadAll){
    loadAll = async function(){
      if(!isMobile()) return originalLoadAll.apply(this, arguments);
      clearErr();
      setBusy(true, 'Đang tải duyệt user...');
      try{
        cache.profiles = await safeLoad('profiles', client.from('profiles').select('*').order('created_at', { ascending:false }));
        cache.questions = [];
        cache.requests = [];
        cache.history = [];
        cache.logs = [];
        if(typeof renderApprovals === 'function') renderApprovals();
        if(typeof renderStats === 'function') renderStats();
        if(typeof loadRegistrationMode === 'function') loadRegistrationMode();
        openApprovalsOnMobile(true);
        toast('Đã tải duyệt user');
      } finally {
        setBusy(false);
      }
    };
  }

  function install(){
    applyMobileClass();
    openApprovalsOnMobile(false);
    setTimeout(function(){ openApprovalsOnMobile(false); }, 500);
    setTimeout(function(){ openApprovalsOnMobile(false); }, 1500);
  }

  if(mq && mq.addEventListener){
    mq.addEventListener('change', function(){
      applyMobileClass();
      openApprovalsOnMobile(true);
    });
  } else {
    window.addEventListener('resize', function(){
      applyMobileClass();
      openApprovalsOnMobile(false);
    });
  }

  document.addEventListener('DOMContentLoaded', install);
  setTimeout(install, 300);
  setTimeout(install, 1200);
})();
// ===== MOBILE_APPROVAL_LITE_ADMIN_20260629_END =====



// ===== ADMIN_PROFILE_PATCH_DEDUPE_20260629 =====
// Chặn ghi profiles lặp trong tab Admin để giảm băng thông Supabase.
(function(){
  if(window.__ADMIN_PROFILE_PATCH_DEDUPE_20260629) return;
  window.__ADMIN_PROFILE_PATCH_DEDUPE_20260629 = true;
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if(!nativeFetch) return;
  const lastMap = new Map();
  const GAP = 5 * 60 * 1000;
  function methodOf(init){ return String(init && init.method ? init.method : 'GET').toUpperCase(); }
  function shouldSkip(url, init){
    const method = methodOf(init);
    if(method !== 'PATCH' && method !== 'PUT') return false;
    if(!/\/rest\/v1\/profiles/.test(url.pathname)) return false;
    const body = String(init && init.body ? init.body : '');
    if(!/last_activity|avatar_url|email/.test(body)) return false;
    if(/last_login|role|approved|blocked|is_blocked|status/.test(body)) return false;
    const key = url.origin + url.pathname + url.search + '|' + body.replace(/"last_activity"\s*:\s*"[^"]+"/g, '"last_activity":"TIME"');
    const now = Date.now();
    const last = lastMap.get(key) || 0;
    if(now - last < GAP) return true;
    lastMap.set(key, now);
    return false;
  }
  window.fetch = function(input, init){
    let url;
    try{ url = new URL(typeof input === 'string' ? input : input.url, location.href); }
    catch(e){ return nativeFetch(input, init); }
    if(shouldSkip(url, init)){
      return Promise.resolve(new Response(null, {status:204, statusText:'No Content', headers:{'x-learninghub-skip':'admin-profile-patch-duplicate'}}));
    }
    return nativeFetch(input, init);
  };
})();
// ===== END ADMIN_PROFILE_PATCH_DEDUPE_20260629 =====

// ===== COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630 =====
// Quản lý môn học: card nhỏ gọn + kéo thả đổi thứ tự, kéo lên đầu = vị trí 1.
(function(){
  if(window.__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630) return;
  window.__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630 = true;

  let dragSubjectCache = [];
  let dragFromIndex = -1;

  function injectCompactSubjectStyle(){
    if(document.getElementById('compactDragSubjectStyle')) return;
    const style = document.createElement('style');
    style.id = 'compactDragSubjectStyle';
    style.textContent = `
      #subjectsAdmin .subjectAdminPanel{padding:16px!important;}
      #subjectsAdmin .subjectAdminHead{padding-bottom:10px!important;margin-bottom:10px!important;}
      #subjectsAdmin .subjectAdminHead h3{font-size:1.02rem!important;margin-bottom:4px!important;}
      #subjectsAdmin .subjectAdminHead p{font-size:.86rem!important;}
      #subjectsAdmin .subjectAdminList{gap:7px!important;padding-right:6px!important;}
      #subjectsAdmin .subjectAdminItem{
        min-height:58px!important;
        padding:9px 12px!important;
        border-radius:14px!important;
        display:grid!important;
        grid-template-columns:34px 88px minmax(0,1fr) auto!important;
        gap:10px!important;
        align-items:center!important;
        cursor:grab!important;
        transition:transform .14s ease,border-color .14s ease,background .14s ease,opacity .14s ease!important;
      }
      #subjectsAdmin .subjectAdminItem:active{cursor:grabbing!important;}
      #subjectsAdmin .subjectAdminItem.dragging{opacity:.45!important;transform:scale(.985)!important;border-color:rgba(232,212,168,.55)!important;}
      #subjectsAdmin .subjectDragHandle{
        width:30px!important;height:30px!important;border-radius:10px!important;
        display:grid!important;place-items:center!important;
        border:1px solid rgba(200,169,110,.22)!important;
        background:rgba(255,255,255,.035)!important;color:rgba(232,212,168,.82)!important;
        font-weight:950!important;font-size:1rem!important;user-select:none!important;
      }
      #subjectsAdmin .subjectAdminCode{
        min-width:78px!important;max-width:88px!important;height:30px!important;
        padding:0 9px!important;font-size:.78rem!important;
      }
      #subjectsAdmin .subjectAdminInfo b{font-size:.92rem!important;line-height:1.15!important;}
      #subjectsAdmin .subjectAdminInfo p{
        margin-top:3px!important;font-size:.80rem!important;line-height:1.25!important;
        -webkit-line-clamp:1!important;
      }
      #subjectsAdmin .subjectQuestionCount{
        margin-top:5px!important;
        display:inline-flex!important;
        width:max-content!important;
        align-items:center!important;
        gap:4px!important;
        border:1px solid rgba(114,197,140,.25)!important;
        border-radius:999px!important;
        padding:4px 9px!important;
        background:rgba(114,197,140,.08)!important;
        color:rgba(245,240,232,.78)!important;
        font-size:.78rem!important;
        font-weight:800!important;
      }
      #subjectsAdmin .subjectQuestionCount b{color:var(--ok)!important;font-size:.82rem!important;}
      #subjectsAdmin .subjectAdminActions{gap:6px!important;flex-wrap:nowrap!important;}
      #subjectsAdmin .subjectAdminActions .act{min-height:31px!important;padding:6px 10px!important;font-size:.82rem!important;}
      #subjectsAdmin .subjectOrderHint{font-size:.82rem!important;color:rgba(245,240,232,.62)!important;margin:0 0 8px!important;}
      @media (max-width:760px){
        #subjectsAdmin .subjectAdminItem{grid-template-columns:32px minmax(0,1fr) auto!important;gap:8px!important;}
        #subjectsAdmin .subjectAdminCode{display:none!important;}
        #subjectsAdmin .subjectAdminActions{grid-column:2 / -1!important;justify-content:flex-start!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function escJs(s){ return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
  function subjectKey(s){ return String(s.id ?? s.code ?? ''); }

  function isActiveSubjectRow(s){
    return !(s?.is_active === false || s?.is_active === 0 || s?.is_active === '0');
  }

  function isActiveQuestionRow(q){
    return !(q?.is_active === false || q?.is_active === 0 || q?.is_active === '0');
  }

  function getSubjectQuestionCount(s){
    const code = String(s?.code || '');
    return Number(s?.__question_count || s?.question_count || s?.questions_count || (code ? 0 : 0)) || 0;
  }

  function filteredSubjects(){
    const q = String(document.getElementById('search')?.value || '').trim().toLowerCase();
    const arr = dragSubjectCache.filter(isActiveSubjectRow).slice().sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0) || String(a.code||'').localeCompare(String(b.code||'')));
    if(!q) return arr;
    return arr.filter(s => `${s.code||''} ${s.name||''} ${s.description||''} ${getSubjectQuestionCount(s)} câu`.toLowerCase().includes(q));
  }

  async function saveSubjectOrder(){
    if(!isAdmin()) return toast('Chỉ admin được đổi thứ tự môn.');
    try{
      // Giữ thứ tự mới ngay trên màn hình, KHÔNG tải lại danh sách môn sau khi kéo.
      dragSubjectCache.forEach((s,i) => { s.sort_order = i + 1; });
      const payloadSubjects = dragSubjectCache
        .filter(s => s && s.id)
        .map((s,i) => ({ id: s.id, sort_order: i + 1 }));

      if(payloadSubjects.length){
        const res = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            user_id: user?.id,
            action: 'reorder_subjects',
            payload: { subjects: payloadSubjects }
          })
        });
        const data = await res.json().catch(() => ({}));
        if(!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status));
      }
      toast('Đã lưu thứ tự môn');
    }catch(e){
      alert('Không lưu được thứ tự môn: ' + (e.message || e));
    }
  }

  window.renderSubjectAdminList = function(){
    injectCompactSubjectStyle();
    const list = document.getElementById('subjectAdminList');
    if(!list) return;
    const arr = filteredSubjects();
    if(!arr.length){
      list.innerHTML = '<p class="muted">Không có môn học phù hợp.</p>';
      return;
    }
    const totalQuestions = arr.reduce((sum, s) => sum + getSubjectQuestionCount(s), 0);
    list.innerHTML = `<p class="subjectOrderHint">Tổng: <b>${arr.length}</b> môn · <b>${totalQuestions}</b> câu. Kéo dấu ☰ để đổi vị trí.</p>` + arr.map((s, idx) => `
      <div class="subjectAdminItem" draggable="true" data-subject-key="${esc(subjectKey(s))}" data-visible-index="${idx}">
        <div class="subjectDragHandle" title="Kéo để đổi vị trí">☰</div>
        <div class="subjectAdminCode">${esc(s.code || '')}</div>
        <div class="subjectAdminInfo">
          <b>${idx + 1}. ${esc(s.name || s.code || 'Chưa có tên môn')}</b>
          <p>${esc(s.description || 'Môn học chưa có mô tả.')}</p>
          <div class="subjectQuestionCount">Tổng số câu: <b>${getSubjectQuestionCount(s)}</b> câu</div>
        </div>
        <div class="subjectAdminActions">
          <button class="act warn" type="button" onclick="openEditSubjectAdmin('${escJs(s.code)}')">Sửa</button>
          ${isAdmin() ? `<button class="act bad" type="button" onclick="deleteSubjectAdmin('${escJs(s.code)}')">Xóa</button>` : ''}
        </div>
      </div>`).join('');
    bindSubjectDragEvents();
  };

  function bindSubjectDragEvents(){
    const list = document.getElementById('subjectAdminList');
    if(!list) return;
    list.querySelectorAll('.subjectAdminItem').forEach(item => {
      item.addEventListener('dragstart', e => {
        const key = item.dataset.subjectKey;
        dragFromIndex = dragSubjectCache.findIndex(s => subjectKey(s) === key);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        dragFromIndex = -1;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      item.addEventListener('drop', async e => {
        e.preventDefault();
        const targetKey = item.dataset.subjectKey;
        const toIndex = dragSubjectCache.findIndex(s => subjectKey(s) === targetKey);
        if(dragFromIndex < 0 || toIndex < 0 || dragFromIndex === toIndex) return;
        const [moved] = dragSubjectCache.splice(dragFromIndex, 1);
        dragSubjectCache.splice(toIndex, 0, moved);
        dragSubjectCache.forEach((s,i) => s.sort_order = i + 1);
        renderSubjectAdminList();
        saveSubjectOrder();
      });
    });
  }

  const oldLoadSubjectsAdmin = window.loadSubjectsAdmin;
  window.loadSubjectsAdmin = async function(){
    injectCompactSubjectStyle();
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    const list = document.getElementById('subjectAdminList');
    if(list) list.innerHTML = '<p class="muted">Đang tải môn học...</p>';
    setBusy(true, 'Đang tải môn...');
    try{
      // Nguồn Turso: nếu cache trống thì nạp dashboard. Đếm câu hỏi từ cache.questions.
      if(!cache.subjects || !cache.subjects.length || !cache.questions) await loadAll();
      const counts = {};
      (cache.questions || []).forEach(q => { const c = String(q.subject_code || '').toUpperCase(); counts[c] = (counts[c] || 0) + 1; });
      dragSubjectCache = (cache.subjects || [])
        .slice()
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.code).localeCompare(String(b.code)))
        .filter(isActiveSubjectRow)
        .map(s => ({...s, __question_count: counts[String(s.code || '').toUpperCase()] || 0}));
      renderSubjectAdminList();
    }finally{
      setBusy(false);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    injectCompactSubjectStyle();
    setTimeout(() => {
      if(document.getElementById('subjectsAdmin')?.classList.contains('active')) window.loadSubjectsAdmin?.();
    }, 600);
  });
})();
// ===== END_COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630 =====


// ===== COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630 =====
// Admin có thể bật/tắt chữ NEW lấp lánh cho từng môn. Lưu trong subjects.cover dạng JSON.
(function(){
  if(window.__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630) return;
  window.__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630 = true;

  const oldOpenEditSubjectAdmin = window.openEditSubjectAdmin;
  const oldSaveSubjectAdmin = window.saveSubjectAdmin;
  let currentSubjectForNewBadge = null;

  function parseCoverMeta(cover){
    if(!cover) return {};
    if(typeof cover === 'object') return {...cover};
    try { return JSON.parse(String(cover)) || {}; } catch(e) { return { url:String(cover) }; }
  }
  function makeCoverWithNewBadge(cover, enabled){
    const meta = parseCoverMeta(cover);
    meta.new_badge = !!enabled;
    return JSON.stringify(meta);
  }
  function hasNewBadge(subject){
    const m = parseCoverMeta(subject?.cover || '');
    return m.new_badge === true || m.is_new === true || m.new === true;
  }

  window.openEditSubjectAdmin = async function(code){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    if(!cache.subjects || !cache.subjects.length) await loadAll();
    const s = (cache.subjects || []).find(x => String(x.code || '').toUpperCase() === String(code).toUpperCase());
    if(!s) {
      if(typeof oldOpenEditSubjectAdmin === 'function') return oldOpenEditSubjectAdmin.apply(this, arguments);
      return alert('Không tìm thấy môn học.');
    }
    currentSubjectForNewBadge = s;
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
        <label class="newBadgeToggleBox" style="display:flex;align-items:center;gap:10px;border:1px solid rgba(200,169,110,.22);border-radius:14px;padding:11px 13px;background:rgba(255,255,255,.035);cursor:pointer;">
          <input id="editSubjectNewBadge" type="checkbox" ${hasNewBadge(s) ? 'checked' : ''} style="width:18px;height:18px;">
          <span><b style="color:var(--gold2);">Hiện chữ NEW lấp lánh</b><br><span class="muted">Bật/tắt nhãn NEW ở góc phải thẻ môn trong màn hình chọn môn.</span></span>
        </label>
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
      const input = document.getElementById('editSubjectCode');
      if(input){
        input.oninput = function(){ this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g,''); };
        input.focus();
      }
    },0);
  };

  window.saveSubjectAdmin = async function(){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    const oldCode = (document.getElementById('editSubjectOldCode')?.value || '').trim().toUpperCase();
    const newCode = (document.getElementById('editSubjectCode')?.value || '').trim().toUpperCase();
    if(newCode !== oldCode && typeof oldSaveSubjectAdmin === 'function') return oldSaveSubjectAdmin.apply(this, arguments);

    const subject = currentSubjectForNewBadge || {};
    const name = (document.getElementById('editSubjectName')?.value || '').trim();
    const description = (document.getElementById('editSubjectDesc')?.value || '').trim();
    const newBadge = !!document.getElementById('editSubjectNewBadge')?.checked;
    if(!subject.id) return alert('Không tìm thấy ID môn học. Bấm Tải lại rồi thử lại.');
    if(!name) return alert('Tên môn học không được để trống.');

    setBusy(true, 'Đang lưu môn...');
    try{
      const r = await client.from('subjects').update({
        name,
        description: description || '',
        cover: makeCoverWithNewBadge(subject.cover || '', newBadge),
        sort_order: subject.sort_order || 0
      }).eq('id', subject.id);
      if(r.error) return alert('Không lưu được môn: ' + r.error.message);
      if(client.clearCache) client.clearCache();
      closeModal();
      await window.loadSubjectsAdmin?.();
      toast('Đã lưu môn học');
    }finally{
      setBusy(false);
    }
  };
})();
// ===== END_COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630 =====


// ===== COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630 =====
// Đưa nút NEW ra ngoài thẻ môn, không để trong popup sửa môn.
(function(){
  if(window.__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630) return;
  window.__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630 = true;

  let cardSubjectCache = [];
  const oldRenderSubjectAdminList = window.renderSubjectAdminList;
  const oldOpenEditSubjectAdmin = window.openEditSubjectAdmin;

  function parseCoverMeta(cover){
    if(!cover) return {};
    if(typeof cover === 'object') return {...cover};
    try { return JSON.parse(String(cover)) || {}; }
    catch(e){ return { url:String(cover) }; }
  }
  function hasNewBadge(subject){
    const m = parseCoverMeta(subject?.cover || '');
    return m.new_badge === true || m.is_new === true || m.new === true;
  }
  function makeCover(cover, enabled){
    const meta = parseCoverMeta(cover);
    meta.new_badge = !!enabled;
    return JSON.stringify(meta);
  }
  function escAttr(s){
    return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escJs(s){
    return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  }

  async function fetchSubjectsForCards(){
    try{
      if(!cache.subjects || !cache.subjects.length) await loadAll();
      cardSubjectCache = (cache.subjects || []).slice().sort((a,b) => (a.sort_order||0)-(b.sort_order||0) || String(a.code).localeCompare(String(b.code)));
    }catch(e){ console.warn('Không tải được trạng thái NEW:', e); }
  }

  function codeFromCard(card){
    const codeText = card.querySelector('.subjectAdminCode')?.textContent?.trim();
    if(codeText) return codeText;
    const editBtn = card.querySelector('[onclick*="openEditSubjectAdmin"]');
    const m = (editBtn?.getAttribute('onclick') || '').match(/openEditSubjectAdmin\('([^']+)'\)/);
    return m ? m[1] : '';
  }

  function enhanceSubjectCards(){
    const list = document.getElementById('subjectAdminList');
    if(!list) return;
    list.querySelectorAll('.subjectAdminItem').forEach(card => {
      const code = codeFromCard(card);
      if(!code || card.querySelector('.subjectNewToggle')) return;
      const subject = cardSubjectCache.find(s => String(s.code) === String(code)) || {};
      const on = hasNewBadge(subject);
      const actions = card.querySelector('.subjectAdminActions');
      if(!actions) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'act subjectNewToggle' + (on ? ' isOn' : '');
      btn.textContent = 'NEW';
      btn.title = on ? 'Đang bật NEW - bấm để tắt' : 'Đang tắt NEW - bấm để bật';
      btn.setAttribute('onclick', "toggleSubjectNewBadgeFromCard('" + escJs(code) + "')");
      actions.insertBefore(btn, actions.firstChild);
    });
  }

  let lastCardSubjectFetchAt = 0;
  let cardSubjectFetchPromise = null;

  async function refreshCardNewButtons(force){
    const now = Date.now();
    if(force || !cardSubjectCache.length || now - lastCardSubjectFetchAt > 60000){
      if(!cardSubjectFetchPromise){
        cardSubjectFetchPromise = fetchSubjectsForCards().finally(() => { cardSubjectFetchPromise = null; });
      }
      await cardSubjectFetchPromise;
      lastCardSubjectFetchAt = Date.now();
    }
    enhanceSubjectCards();
  }

  if(typeof oldRenderSubjectAdminList === 'function'){
    window.renderSubjectAdminList = function(){
      const r = oldRenderSubjectAdminList.apply(this, arguments);
      setTimeout(refreshCardNewButtons, 0);
      return r;
    };
  }

  window.openEditSubjectAdmin = async function(){
    const r = oldOpenEditSubjectAdmin.apply(this, arguments);
    setTimeout(() => {
      const box = document.querySelector('.newBadgeToggleBox');
      if(box) box.remove();
    }, 30);
    return r;
  };

  window.toggleSubjectNewBadgeFromCard = async function(code){
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    const btn = Array.from(document.querySelectorAll('.subjectNewToggle')).find(b => (b.getAttribute('onclick') || '').includes("'" + code + "'"));
    if(btn) btn.classList.add('isBusy');
    try{
      let subject = cardSubjectCache.find(s => String(s.code) === String(code)) || (cache.subjects || []).find(s => String(s.code) === String(code));
      if(!subject) return alert('Không tìm thấy môn học.');
      const next = !hasNewBadge(subject);
      if(!await adminAction('set_subject_new_badge', { id: subject.id, enabled: next })) return;
      subject.cover = makeCover(subject.cover || '', next);
      cardSubjectCache = cardSubjectCache.map(s => String(s.code) === String(code) ? {...s, cover: subject.cover} : s);
      toast(next ? 'Đã bật NEW' : 'Đã tắt NEW');
      await window.loadSubjectsAdmin?.();
    }finally{
      if(btn) btn.classList.remove('isBusy');
    }
  };

  // Không cho nút Lưu trong popup sửa môn tự tắt NEW khi checkbox đã bị bỏ khỏi popup.
  const previousSaveSubjectAdmin = window.saveSubjectAdmin;
  window.saveSubjectAdmin = async function(){
    const oldCode = (document.getElementById('editSubjectOldCode')?.value || '').trim().toUpperCase();
    const newCode = (document.getElementById('editSubjectCode')?.value || '').trim().toUpperCase();
    if(newCode && oldCode && newCode !== oldCode && typeof previousSaveSubjectAdmin === 'function'){
      return previousSaveSubjectAdmin.apply(this, arguments);
    }
    if(!isEditor()) return alert('Admin hoặc Editor mới được sửa môn học.');
    const code = oldCode || newCode;
    const name = (document.getElementById('editSubjectName')?.value || '').trim();
    const description = (document.getElementById('editSubjectDesc')?.value || '').trim();
    if(!code) return alert('Thiếu mã môn.');
    if(!name) return alert('Tên môn học không được để trống.');
    setBusy(true, 'Đang lưu môn...');
    try{
      let subject = cardSubjectCache.find(s => String(s.code) === String(code)) || (cache.subjects || []).find(s => String(s.code) === String(code));
      if(!subject) return alert('Không tìm thấy môn học.');
      if(!await adminAction('edit_subject', { id: subject.id, name, description: description || '', cover: subject.cover || '', sort_order: subject.sort_order || 0 })) return;
      closeModal();
      await window.loadSubjectsAdmin?.();
      toast('Đã lưu môn học');
    }finally{
      setBusy(false);
    }
  };

  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { if(document.getElementById('subjectsAdmin')?.classList.contains('active')) refreshCardNewButtons(); }, 900));
})();
// ===== END_COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630 =====


// ===== COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630 =====
// Tối ưu: không tải lại bảng subjects liên tục chỉ để hiện nút NEW trong thẻ môn.
// ===== END_COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630 =====


// ===== COPILOT_ADMIN_RELOAD_FIX_20260630 =====
// Sửa nút Tải lại, tránh dữ liệu admin bị đứng cache và cập nhật role/block ngay.
(function(){
  if(window.__COPILOT_ADMIN_RELOAD_FIX_20260630) return;
  window.__COPILOT_ADMIN_RELOAD_FIX_20260630 = true;

  function clearAdminClientCache(){
    try{ if(client && typeof client.clearCache === 'function') client.clearCache(); }catch(e){}
    try{
      Object.keys(sessionStorage).forEach(k => {
        if(k.startsWith('admin_f5_micro_cache:') || k.startsWith('lh_f5_cache:')) sessionStorage.removeItem(k);
      });
    }catch(e){}
  }

  function showLoadingNumbers(){
    ['statUsers','statEditors','statPending','statPendingApproval','statBlocked'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = '...';
    });
    const rr = document.getElementById('recentRequests');
    if(rr) rr.innerHTML = '<p class="muted">Đang tải dữ liệu...</p>';
    const rl = document.getElementById('recentLogs');
    if(rl) rl.innerHTML = '<p class="muted">Đang tải dữ liệu...</p>';
  }

  const oldLoadAll = window.loadAll || loadAll;
  window.loadAll = loadAll = async function(force){
    clearErr();
    clearAdminClientCache();
    showLoadingNumbers();
    setBusy(true, 'Đang tải...');
    try{
      // Nguồn dữ liệu duy nhất: Turso qua /api/admin-dashboard. Supabase chỉ còn dùng cho Auth.
      const pj = (v, d) => { if (v == null) return d; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return d; } };
      const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
      const dash = await res.json().catch(() => ({}));
      if (!res.ok || dash.error) throw new Error(dash.error || ('HTTP ' + res.status));
      cache.profiles = (dash.profiles || []).map(p => ({
        ...p,
        approved: p.approved === 1 || p.approved === true || p.approved === '1',
        blocked: p.blocked === 1 || p.blocked === true || p.blocked === '1'
      }));
      cache.questions = (dash.questions || []).map(q => ({ ...q, options: pj(q.options, {}), images: pj(q.images, []) }));
      cache.requests = (dash.requests || []).map(r => ({ ...r, old_data: pj(r.old_data, {}), new_data: pj(r.new_data, {}) }));
      cache.history = (dash.history || []).map(h => ({ ...h, previous_data: pj(h.previous_data, {}), new_data: pj(h.new_data, {}) }));
      cache.logs = isAdmin() ? (dash.logs || []).map(l => ({ ...l, details: pj(l.details, {}) })) : [];
      cache.subjects = dash.subjects || [];
      cache.subject_requests = (dash.subject_requests || []).map(s => ({ ...s, questions_data: pj(s.questions_data, []) }));
      cache.deleted_questions = (dash.deleted_questions || []).map(d => ({ ...d, original_data: pj(d.original_data, {}) }));
      cache.deleted_subjects = (dash.deleted_subjects || []).map(d => ({ ...d, original_data: pj(d.original_data, {}) }));
      render();
      if(typeof loadSubjectRequests === 'function') await loadSubjectRequests();
      if(typeof loadRegistrationMode === 'function') await loadRegistrationMode();
      toast('Đã tải mới');
    }catch(e){
      console.error('[loadAll fixed]', e);
      err('Không tải được dữ liệu: ' + (e.message || e));
    }finally{
      setBusy(false);
    }
  };

  function bindReloadButton(){
    const btn = document.getElementById('refreshBtn');
    if(!btn || btn.__reloadFixBound) return;
    btn.__reloadFixBound = true;
    btn.onclick = async function(){
      clearAdminClientCache();
      await window.loadAll(true);
      const page = sessionStorage.getItem('admin_current_page') || 'overview';
      if(page === 'subjectsAdmin' && typeof window.loadSubjectsAdmin === 'function') await window.loadSubjectsAdmin();
      if(page === 'trash' && typeof window.loadTrash === 'function') await window.loadTrash();
      if(page === 'subjectRequests' && typeof window.loadSubjectRequests === 'function') await window.loadSubjectRequests();
      if(page === 'approvals' && typeof window.renderApprovals === 'function') window.renderApprovals();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindReloadButton();
    setTimeout(() => {
      bindReloadButton();
      const isApp = !document.getElementById('appBox') || !document.getElementById('appBox').classList.contains('hidden');
      const looksEmpty = Number(document.getElementById('statUsers')?.textContent || 0) === 0 && (!cache.profiles || !cache.profiles.length);
      if(isApp && looksEmpty) window.loadAll(true);
    }, 900);
  });
})();
// ===== END_COPILOT_ADMIN_RELOAD_FIX_20260630 =====


// ===== COPILOT_HIDE_USERS_FROM_EDITOR_20260630 =====
// Editor không được xem tab Người dùng. Chỉ admin mới thấy và mở được.
(function(){
  if(window.__COPILOT_HIDE_USERS_FROM_EDITOR_20260630) return;
  window.__COPILOT_HIDE_USERS_FROM_EDITOR_20260630 = true;

  function hideUsersForEditor(){
    try{
      const allow = typeof isAdmin === 'function' && isAdmin();
      document.querySelectorAll('.nav[data-page="users"], .nav[data-page="approvals"]').forEach(el => {
        el.classList.toggle('hidden', !allow);
        el.style.display = allow ? '' : 'none';
      });
      if(!allow && document.getElementById('users')?.classList.contains('active')){
        setPage('overview', 'Tổng quan');
      }
      if(!allow && document.getElementById('approvals')?.classList.contains('active')){
        setPage('overview', 'Tổng quan');
      }
    }catch(e){}
  }

  const oldSetPageHideUsers = window.setPage || setPage;
  setPage = window.setPage = function(id, n){
    if((id === 'users' || id === 'approvals') && !(typeof isAdmin === 'function' && isAdmin())){
      alert('Editor không được xem Người dùng.');
      id = 'overview';
      n = 'Tổng quan';
    }
    const res = oldSetPageHideUsers.apply(this, arguments.length ? [id, n] : arguments);
    setTimeout(hideUsersForEditor, 0);
    return res;
  };

  const oldRenderUsersHideEditor = window.renderUsers || renderUsers;
  renderUsers = window.renderUsers = function(){
    if(!(typeof isAdmin === 'function' && isAdmin())){
      const el = document.getElementById('userList');
      if(el) el.innerHTML = 'Editor không được xem danh sách người dùng.';
      return;
    }
    return oldRenderUsersHideEditor.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', () => setTimeout(hideUsersForEditor, 300));
  setTimeout(hideUsersForEditor, 800);
})();
// ===== END_COPILOT_HIDE_USERS_FROM_EDITOR_20260630 =====


// ===== COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630 =====
// Làm lại layout Quản lý môn học: thẻ rộng hơn, số câu không bị đè, bố cục gọn và đẹp hơn.
(function(){
  if(window.__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630) return;
  window.__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630 = true;

  function injectPolishedSubjectAdminLayout(){
    if(document.getElementById('copilotPolishSubjectAdminLayout20260630')) return;
    const style = document.createElement('style');
    style.id = 'copilotPolishSubjectAdminLayout20260630';
    style.textContent = `
      #subjectsAdmin.page.active{
        display:flex!important;
        flex-direction:column!important;
        height:100%!important;
        min-height:0!important;
      }
      #subjectsAdmin .subjectAdminPanel{
        height:100%!important;
        min-height:0!important;
        display:flex!important;
        flex-direction:column!important;
        padding:20px!important;
        border-radius:24px!important;
        background:
          radial-gradient(circle at 78% 12%, rgba(200,169,110,.09), transparent 30%),
          linear-gradient(145deg,rgba(245,240,232,.065),rgba(255,255,255,.018))!important;
      }
      #subjectsAdmin .subjectAdminHead{
        flex:0 0 auto!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:18px!important;
        margin:0 0 14px!important;
        padding:0 0 16px!important;
        border-bottom:1px solid rgba(200,169,110,.16)!important;
      }
      #subjectsAdmin .subjectAdminHead h3{
        margin:0 0 6px!important;
        font-size:1.18rem!important;
        color:var(--gold2)!important;
      }
      #subjectsAdmin .subjectAdminHead .muted{
        margin:0!important;
        color:rgba(245,240,232,.68)!important;
        line-height:1.45!important;
      }
      #subjectsAdmin .subjectAdminHead .act.ok{
        min-width:124px!important;
        height:44px!important;
        padding:0 18px!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,rgba(114,197,140,.22),rgba(114,197,140,.12))!important;
        color:var(--ok)!important;
        border-color:rgba(114,197,140,.30)!important;
      }
      #subjectsAdmin .subjectAdminList{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        display:grid!important;
        gap:12px!important;
        padding:2px 10px 4px 0!important;
        align-content:start!important;
      }
      #subjectsAdmin .subjectOrderHint{
        position:sticky!important;
        top:0!important;
        z-index:5!important;
        margin:0 0 4px!important;
        padding:11px 14px!important;
        border:1px solid rgba(200,169,110,.16)!important;
        border-radius:16px!important;
        background:linear-gradient(180deg,rgba(24,17,13,.98),rgba(17,12,10,.92))!important;
        color:rgba(245,240,232,.72)!important;
        font-size:.88rem!important;
        font-weight:750!important;
        box-shadow:0 10px 24px rgba(0,0,0,.20)!important;
      }
      #subjectsAdmin .subjectOrderHint b{
        color:var(--gold2)!important;
      }
      #subjectsAdmin .subjectAdminItem{
        min-height:98px!important;
        padding:16px 18px!important;
        border-radius:22px!important;
        display:grid!important;
        grid-template-columns:42px 112px minmax(0,1fr) auto!important;
        gap:16px!important;
        align-items:center!important;
        background:
          radial-gradient(circle at 92% 50%,rgba(232,212,168,.08),transparent 30%),
          linear-gradient(145deg,rgba(245,240,232,.072),rgba(255,255,255,.022))!important;
        border:1px solid rgba(200,169,110,.22)!important;
        box-shadow:0 14px 36px rgba(0,0,0,.24)!important;
        transform:none!important;
      }
      #subjectsAdmin .subjectAdminItem:hover{
        border-color:rgba(232,212,168,.38)!important;
        background:
          radial-gradient(circle at 92% 50%,rgba(232,212,168,.12),transparent 32%),
          linear-gradient(145deg,rgba(245,240,232,.092),rgba(255,255,255,.03))!important;
        box-shadow:0 18px 42px rgba(0,0,0,.28),0 0 26px rgba(232,212,168,.08)!important;
      }
      #subjectsAdmin .subjectDragHandle{
        width:38px!important;
        height:38px!important;
        border-radius:13px!important;
        font-size:1.15rem!important;
        background:rgba(255,255,255,.045)!important;
        border-color:rgba(232,212,168,.20)!important;
      }
      #subjectsAdmin .subjectAdminCode{
        min-width:104px!important;
        max-width:112px!important;
        height:36px!important;
        padding:0 12px!important;
        border-radius:999px!important;
        font-size:.86rem!important;
        letter-spacing:.03em!important;
        background:rgba(200,169,110,.115)!important;
        border-color:rgba(232,212,168,.25)!important;
        color:var(--gold2)!important;
      }
      #subjectsAdmin .subjectAdminInfo{
        min-width:0!important;
        display:flex!important;
        flex-direction:column!important;
        gap:5px!important;
        align-self:center!important;
      }
      #subjectsAdmin .subjectAdminInfo b{
        display:block!important;
        font-size:1.03rem!important;
        line-height:1.22!important;
        color:#fff!important;
        font-weight:900!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      #subjectsAdmin .subjectAdminInfo p{
        display:block!important;
        margin:0!important;
        color:rgba(245,240,232,.62)!important;
        font-size:.88rem!important;
        line-height:1.35!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        -webkit-line-clamp:unset!important;
        -webkit-box-orient:unset!important;
      }
      #subjectsAdmin .subjectQuestionCount{
        margin:4px 0 0!important;
        position:static!important;
        display:inline-flex!important;
        align-self:flex-start!important;
        width:max-content!important;
        max-width:100%!important;
        align-items:center!important;
        gap:6px!important;
        min-height:30px!important;
        padding:5px 12px!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,rgba(114,197,140,.16),rgba(114,197,140,.07))!important;
        border:1px solid rgba(114,197,140,.30)!important;
        color:rgba(245,240,232,.82)!important;
        font-size:.84rem!important;
        font-weight:900!important;
        box-shadow:none!important;
      }
      #subjectsAdmin .subjectQuestionCount b{
        color:var(--ok)!important;
        font-size:.92rem!important;
        font-weight:950!important;
      }
      #subjectsAdmin .subjectAdminActions{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:9px!important;
        flex-wrap:nowrap!important;
        min-width:250px!important;
      }
      #subjectsAdmin .subjectAdminActions .act{
        min-height:38px!important;
        padding:0 16px!important;
        border-radius:999px!important;
        font-size:.88rem!important;
        font-weight:950!important;
      }
      #subjectsAdmin .subjectNewToggle{
        min-width:86px!important;
        border-color:rgba(232,212,168,.26)!important;
      }
      #subjectsAdmin .subjectNewToggle.isOn{
        background:linear-gradient(135deg,#ffe7a8,#e8c46e)!important;
        color:#111!important;
        border-color:transparent!important;
        box-shadow:0 12px 26px rgba(232,212,168,.16)!important;
      }
      @media (max-width:980px){
        #subjectsAdmin .subjectAdminItem{
          grid-template-columns:40px 100px minmax(0,1fr)!important;
          gap:12px!important;
        }
        #subjectsAdmin .subjectAdminActions{
          grid-column:3!important;
          justify-content:flex-start!important;
          min-width:0!important;
          margin-top:8px!important;
        }
      }
      @media (max-width:680px){
        #subjectsAdmin .subjectAdminPanel{padding:14px!important;}
        #subjectsAdmin .subjectAdminHead{align-items:flex-start!important;flex-direction:column!important;}
        #subjectsAdmin .subjectAdminHead .act.ok{width:100%!important;}
        #subjectsAdmin .subjectAdminItem{
          grid-template-columns:38px minmax(0,1fr)!important;
          min-height:0!important;
          padding:14px!important;
        }
        #subjectsAdmin .subjectAdminCode{
          grid-column:2!important;
          grid-row:1!important;
          justify-self:start!important;
          min-width:92px!important;
        }
        #subjectsAdmin .subjectAdminInfo{grid-column:1 / -1!important;margin-top:4px!important;}
        #subjectsAdmin .subjectAdminActions{
          grid-column:1 / -1!important;
          width:100%!important;
          min-width:0!important;
          display:grid!important;
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
        #subjectsAdmin .subjectAdminActions .act{padding:0 10px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(injectPolishedSubjectAdminLayout, 0));
  setTimeout(injectPolishedSubjectAdminLayout, 0);
  setTimeout(injectPolishedSubjectAdminLayout, 800);
})();
// ===== END_COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630 =====


// ===== COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630 =====
// Giao diện Quản lý môn học: chặn CSS cũ làm chồng chữ/số câu.
(function(){
  if(window.__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630) return;
  window.__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630 = true;

  function injectFinalSubjectAdminPolish(){
    let style = document.getElementById('subjectAdminNoOverlapFinalStyle');
    if(!style){
      style = document.createElement('style');
      style.id = 'subjectAdminNoOverlapFinalStyle';
      document.head.appendChild(style);
    }
    style.textContent = `
      body #subjectsAdmin .subjectAdminPanel{padding:18px!important;border-radius:24px!important;}
      body #subjectsAdmin .subjectAdminList{gap:10px!important;padding-right:12px!important;overflow:auto!important;}
      body #subjectsAdmin .subjectAdminItem{
        display:grid!important;grid-template-columns:40px 112px minmax(0,1fr) auto!important;gap:12px!important;
        align-items:center!important;min-height:88px!important;height:auto!important;padding:12px 15px!important;
        border-radius:18px!important;overflow:visible!important;transform:none!important;
      }
      body #subjectsAdmin .subjectDragHandle,
      body #subjectsAdmin .subjectAdminItem > :first-child:not(.subjectAdminCode):not(.subjectAdminInfo):not(.subjectAdminActions){
        width:34px!important;height:34px!important;min-width:34px!important;border-radius:12px!important;display:grid!important;place-items:center!important;align-self:center!important;
      }
      body #subjectsAdmin .subjectAdminCode{min-width:104px!important;max-width:112px!important;height:38px!important;padding:0 12px!important;font-size:.84rem!important;align-self:center!important;}
      body #subjectsAdmin .subjectAdminInfo{display:grid!important;grid-template-columns:1fr!important;gap:4px!important;min-width:0!important;overflow:visible!important;align-content:center!important;}
      body #subjectsAdmin .subjectAdminInfo b{display:block!important;margin:0!important;font-size:1.02rem!important;line-height:1.22!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body #subjectsAdmin .subjectAdminInfo p{display:block!important;margin:0!important;font-size:.88rem!important;line-height:1.32!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;-webkit-box-orient:unset!important;}
      body #subjectsAdmin .subjectQuestionCount,
      body #subjectsAdmin .subjectAdminInfo .subjectQuestionCount{
        position:static!important;display:inline-flex!important;width:max-content!important;max-width:100%!important;height:auto!important;min-height:28px!important;
        margin:2px 0 0!important;padding:5px 11px!important;align-items:center!important;gap:6px!important;border-radius:999px!important;
        background:rgba(114,197,140,.10)!important;border:1px solid rgba(114,197,140,.30)!important;color:rgba(245,240,232,.78)!important;
        font-size:.80rem!important;font-weight:850!important;line-height:1!important;transform:none!important;inset:auto!important;box-shadow:none!important;
      }
      body #subjectsAdmin .subjectQuestionCount b{color:#82e6a3!important;font-size:.86rem!important;line-height:1!important;}
      body #subjectsAdmin .subjectAdminActions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:nowrap!important;min-width:254px!important;max-width:none!important;overflow:visible!important;}
      body #subjectsAdmin .subjectAdminActions .act,
      body #subjectsAdmin .subjectAdminActions button{min-height:38px!important;height:38px!important;padding:0 14px!important;border-radius:999px!important;font-size:.86rem!important;line-height:1!important;white-space:nowrap!important;}
      body #subjectsAdmin .subjectNewToggle{min-width:96px!important;height:38px!important;}
      body #subjectsAdmin .subjectOrderHint{margin:0 0 10px!important;padding:10px 14px!important;border-radius:16px!important;background:rgba(0,0,0,.18)!important;border:1px solid rgba(200,169,110,.12)!important;}
      @media (max-width:1100px){
        body #subjectsAdmin .subjectAdminItem{grid-template-columns:38px 104px minmax(0,1fr)!important;min-height:112px!important;}
        body #subjectsAdmin .subjectAdminActions{grid-column:2 / -1!important;justify-content:flex-start!important;min-width:0!important;flex-wrap:wrap!important;}
      }
      @media (max-width:760px){
        body #subjectsAdmin .subjectAdminItem{grid-template-columns:38px minmax(0,1fr)!important;min-height:0!important;padding:13px!important;}
        body #subjectsAdmin .subjectAdminCode{grid-column:2!important;min-width:0!important;max-width:max-content!important;height:34px!important;}
        body #subjectsAdmin .subjectAdminInfo,body #subjectsAdmin .subjectAdminActions{grid-column:1 / -1!important;}
        body #subjectsAdmin .subjectAdminActions{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;width:100%!important;}
        body #subjectsAdmin .subjectAdminActions .act,body #subjectsAdmin .subjectAdminActions button{width:100%!important;min-width:0!important;}
      }
    `;
  }

  function keepStyleLast(){
    injectFinalSubjectAdminPolish();
    const style = document.getElementById('subjectAdminNoOverlapFinalStyle');
    if(style && style.parentNode) document.head.appendChild(style);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', keepStyleLast);
  else keepStyleLast();
  setTimeout(keepStyleLast, 300);
  setTimeout(keepStyleLast, 1200);
})();
// ===== END_COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630 =====


// ===== COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630 =====
// Sửa lỗi không xóa vĩnh viễn môn trong Thùng rác khi dùng Turso API.
(function(){
  if(window.__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630) return;
  window.__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630 = true;

  async function adminApi(action, payload){
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id || '',
        action,
        payload: payload || {}
      })
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok || data.error) throw new Error(data.error || ('Máy chủ lỗi ' + res.status));
    return data;
  }

  const oldPermanentDeleteSubject = window.permanentDeleteSubject;
  window.permanentDeleteSubject = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    if(!confirm('Xóa VĨNH VIỄN môn này?\n\nKhông thể khôi phục sau thao tác này!')) return;
    setBusy(true, 'Đang xóa vĩnh viễn...');
    try{
      if(window.APP_CONFIG?.USE_TURSO_API){
        await adminApi('permanent_delete_subject', { subject_id: id });
        if(typeof loadAll === 'function') await loadAll();
        if(typeof loadTrash === 'function') await loadTrash();
        toast('Đã xóa vĩnh viễn môn');
        return;
      }
      if(typeof oldPermanentDeleteSubject === 'function') return await oldPermanentDeleteSubject.apply(this, arguments);
    }catch(e){
      alert('Lỗi xóa môn: ' + (e?.message || e));
    }finally{
      setBusy(false);
    }
  };

  const oldPermanentDeleteQuestion = window.permanentDelete;
  window.permanentDelete = async function(id){
    if(!isAdmin()) return alert('Chỉ admin.');
    if(window.APP_CONFIG?.USE_TURSO_API){
      if(!confirm('Xóa VĨNH VIỄN câu hỏi này?\n\nKhông thể khôi phục sau thao tác này!')) return;
      setBusy(true, 'Đang xóa vĩnh viễn...');
      try{
        await adminApi('permanent_delete_question', { question_id: id });
        if(typeof loadTrash === 'function') await loadTrash();
        toast('Đã xóa vĩnh viễn câu hỏi');
      }catch(e){
        alert('Lỗi xóa câu hỏi: ' + (e?.message || e));
      }finally{
        setBusy(false);
      }
      return;
    }
    if(typeof oldPermanentDeleteQuestion === 'function') return oldPermanentDeleteQuestion.apply(this, arguments);
  };
})();
// ===== END_COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630 =====


// ===== COPILOT_EDITOR_ACCESS_HIDE_20260630 =====
// Editor: ẩn các mục không có quyền truy cập và chặn mở trang bị cấm.
(function(){
  if(window.__COPILOT_EDITOR_ACCESS_HIDE_20260630) return;
  window.__COPILOT_EDITOR_ACCESS_HIDE_20260630 = true;

  const ADMIN_ONLY_PAGES = new Set([
    'approvals',      // Phê duyệt tài khoản
    'users',          // Người dùng / phân quyền
    'logs',           // Admin logs
    'trash',          // Thùng rác
    'trashBin',
    'deletedQuestions'
  ]);

  const EDITOR_ALLOWED_PAGES = new Set([
    'overview',
    'requests',       // Yêu cầu sửa
    'subjectRequests',// Yêu cầu thêm môn
    'subjectsAdmin',  // Môn học
    'questions',      // Câu hỏi
    'history'         // Lịch sử sửa câu
  ]);

  function roleName(){
    return String(profile?.role || '').toLowerCase();
  }

  function canOpenPage(pageId){
    pageId = String(pageId || 'overview');
    if(isAdmin()) return true;
    if(roleName() === 'editor' && !isBlocked(profile)){
      return EDITOR_ALLOWED_PAGES.has(pageId) && !ADMIN_ONLY_PAGES.has(pageId);
    }
    return pageId === 'overview';
  }

  function isDeniedNav(el){
    const page = el?.dataset?.page || '';
    if(!page) return false;
    return !canOpenPage(page);
  }

  function hideDeniedMenus(){
    // Đợi load xong profile rồi mới kiểm tra quyền. Nếu chạy quá sớm sẽ hiểu nhầm là không có quyền và ép về Tổng quan.
    if(!profile || !profile.role) return;
    const isEditorOnly = roleName() === 'editor' && !isAdmin();
    document.body.classList.toggle('role-editor-limited', isEditorOnly);

    document.querySelectorAll('.nav[data-page]').forEach(btn => {
      const deny = isDeniedNav(btn);
      btn.classList.toggle('accessHidden', deny);
      btn.setAttribute('aria-hidden', deny ? 'true' : 'false');
      if(deny) btn.tabIndex = -1;
      else btn.removeAttribute('tabindex');
    });

    // Các nút/hộp chỉ admin mới nên thấy.
    document.querySelectorAll('[data-page="approvals"], [data-page="users"], [data-page="logs"], [data-page="trash"], #exportBtn').forEach(el => {
      const deny = !isAdmin();
      el.classList.toggle('accessHidden', deny);
      el.setAttribute('aria-hidden', deny ? 'true' : 'false');
    });

    // Ẩn cả trang nếu không được quyền, để không hiện do nhớ tab cũ trong sessionStorage.
    document.querySelectorAll('.page').forEach(p => {
      if(!p.id) return;
      const deny = !canOpenPage(p.id);
      p.classList.toggle('accessHiddenPage', deny);
      if(deny) p.classList.remove('active');
    });

    const current = sessionStorage.getItem('admin_current_page') || document.querySelector('.page.active')?.id || 'overview';
    if(!canOpenPage(current)){
      try{
        sessionStorage.setItem('admin_current_page', 'overview');
        sessionStorage.setItem('admin_current_page_name', 'Tổng quan');
      }catch(e){}
      if(typeof setPage === 'function') setPage('overview', 'Tổng quan');
    }
  }

  // Chặn click trước khi vào handler cũ.
  document.addEventListener('click', function(e){
    const nav = e.target.closest?.('.nav[data-page]');
    if(!nav) return;
    const page = nav.dataset.page || '';
    if(!canOpenPage(page)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toast('Tài khoản editor không có quyền vào mục này');
      hideDeniedMenus();
      return false;
    }
  }, true);

  // Bọc setPage để chặn mở bằng sessionStorage hoặc gọi hàm trực tiếp.
  const oldSetPage = typeof setPage === 'function' ? setPage : null;
  if(oldSetPage && !oldSetPage.__editorAccessGuarded){
    const guardedSetPage = function(id, name){
      if(!canOpenPage(id)){
        id = 'overview';
        name = 'Tổng quan';
      }
      const r = oldSetPage.call(this, id, name);
      setTimeout(hideDeniedMenus, 0);
      return r;
    };
    guardedSetPage.__editorAccessGuarded = true;
    setPage = guardedSetPage;
    window.setPage = guardedSetPage;
  }

  // Sau khi load profile/load all thì áp lại quyền hiển thị.
  const oldLoadProfile = typeof loadProfile === 'function' ? loadProfile : null;
  if(oldLoadProfile && !oldLoadProfile.__editorAccessPatched){
    const patchedLoadProfile = async function(){
      const r = await oldLoadProfile.apply(this, arguments);
      hideDeniedMenus();
      setTimeout(hideDeniedMenus, 200);
      return r;
    };
    patchedLoadProfile.__editorAccessPatched = true;
    loadProfile = patchedLoadProfile;
    window.loadProfile = patchedLoadProfile;
  }

  const oldLoadAll = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAll && !oldLoadAll.__editorAccessPatched){
    const patchedLoadAll = async function(){
      const r = await oldLoadAll.apply(this, arguments);
      hideDeniedMenus();
      setTimeout(hideDeniedMenus, 200);
      return r;
    };
    patchedLoadAll.__editorAccessPatched = true;
    loadAll = patchedLoadAll;
    window.loadAll = patchedLoadAll;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideDeniedMenus);
  else hideDeniedMenus();
  setTimeout(hideDeniedMenus, 300);
  setTimeout(hideDeniedMenus, 1200);
  setInterval(hideDeniedMenus, 2500);
})();
// ===== END_COPILOT_EDITOR_ACCESS_HIDE_20260630 =====


// ===== COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 =====
// Giữ đúng tab đang mở sau khi reset/F5 trang.
(function(){
  if(window.__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630) return;
  window.__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 = true;

  const PAGE_KEY = 'admin_current_page';
  const PAGE_NAME_KEY = 'admin_current_page_name';

  function saveAdminPage(id, name){
    if(!id) return;
    try{
      sessionStorage.setItem(PAGE_KEY, id);
      localStorage.setItem(PAGE_KEY, id);
      if(name){
        sessionStorage.setItem(PAGE_NAME_KEY, name);
        localStorage.setItem(PAGE_NAME_KEY, name);
      }
    }catch(e){}
  }

  function getSavedAdminPage(){
    try{
      return {
        id: sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || 'overview',
        name: sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || ''
      };
    }catch(e){ return { id:'overview', name:'' }; }
  }

  const oldSetPageKeepTab = typeof setPage === 'function' ? setPage : null;
  if(oldSetPageKeepTab && !oldSetPageKeepTab.__keepTabAfterReset){
    const patchedSetPage = function(id, name){
      const nav = document.querySelector('.nav[data-page="' + id + '"]');
      const title = name || nav?.textContent?.trim() || id || 'Tổng quan';
      const out = oldSetPageKeepTab.call(this, id, title);
      saveAdminPage(id, title);
      return out;
    };
    patchedSetPage.__keepTabAfterReset = true;
    setPage = window.setPage = patchedSetPage;
  }

  document.addEventListener('click', function(e){
    const nav = e.target.closest?.('.nav[data-page]');
    if(nav) saveAdminPage(nav.dataset.page, nav.textContent.trim());
  }, true);

  function restoreSavedAdminPage(){
    if(!user || !profile || !profile.role) return;
    const saved = getSavedAdminPage();
    if(!saved.id || saved.id === 'overview') return;
    const nav = document.querySelector('.nav[data-page="' + saved.id + '"]');
    const page = document.getElementById(saved.id);
    if(!nav || !page || typeof setPage !== 'function') return;
    setPage(saved.id, saved.name || nav.textContent.trim());
    if(saved.id === 'approvals' && typeof window.loadRegistrationMode === 'function') setTimeout(window.loadRegistrationMode, 50);
    if(saved.id === 'subjectsAdmin' && typeof window.loadSubjectsAdmin === 'function') setTimeout(window.loadSubjectsAdmin, 50);
    if(saved.id === 'trash' && typeof window.loadTrash === 'function') setTimeout(window.loadTrash, 50);
    if(saved.id === 'subjectRequests' && typeof window.loadSubjectRequests === 'function') setTimeout(window.loadSubjectRequests, 50);
  }

  // Chạy nhiều lần vì init/loadProfile/loadAll là async.
  [600, 1200, 2200, 3500].forEach(ms => setTimeout(restoreSavedAdminPage, ms));
})();
// ===== END_COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 =====


// ===== COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 =====
// Fix: đổi cổng đăng ký sang MỞ không bị F5 đọc lại cache cũ; F5 giữ đúng tab đang mở.
(function(){
  if(window.__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630) return;
  window.__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 = true;

  const PAGE_KEY = 'admin_current_page';
  const PAGE_NAME_KEY = 'admin_current_page_name';
  const MODE_KEY = 'admin_registration_mode_last_v1';

  function normalizeMode(v){
    if(v && typeof v === 'object' && 'value' in v) v = v.value;
    if(typeof v !== 'string') v = String(v || 'approval');
    try{
      const parsed = JSON.parse(v);
      if(typeof parsed === 'string') v = parsed;
    }catch(e){}
    v = String(v || 'approval').replace(/^"+|"+$/g, '').trim();
    return ['open','approval','closed'].includes(v) ? v : 'approval';
  }

  function clearSoftCache(kind){
    try{
      if(typeof client?.clearCache === 'function') client.clearCache();
      if(typeof window.clearLearningHubSupabaseCache === 'function') window.clearLearningHubSupabaseCache(kind || 'site_settings');
      Object.keys(sessionStorage).forEach(function(k){
        const s = String(k);
        if(s.includes('site_settings') || s.includes('registration_mode') || s.startsWith('admin_f5_micro_cache:') || s.startsWith('lh_f5_cache:')){
          sessionStorage.removeItem(k);
        }
      });
    }catch(e){}
  }

  function paintRegistrationMode(mode){
    mode = normalizeMode(mode);
    const status = document.getElementById('registrationGateStatus');
    const openBtn = document.getElementById('regGateOpen');
    const approvalBtn = document.getElementById('regGateApproval');
    const closedBtn = document.getElementById('regGateClosed');
    if(status){
      if(mode === 'open') status.innerHTML = '<span style="color:#66bb6a;font-weight:900">MỞ</span> — Ai đăng ký cũng vào được ngay, không cần duyệt';
      else if(mode === 'closed') status.innerHTML = '<span style="color:#ef5350;font-weight:900">ĐÓNG</span> — Không ai đăng ký mới được';
      else status.innerHTML = '<span style="color:#ffc107;font-weight:900">CẦN DUYỆT</span> — User mới phải chờ admin phê duyệt';
    }
    if(openBtn) openBtn.classList.toggle('active', mode === 'open');
    if(approvalBtn) approvalBtn.classList.toggle('active', mode === 'approval');
    if(closedBtn) closedBtn.classList.toggle('active', mode === 'closed');
  }

  window.loadRegistrationMode = async function(){
    try{
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));
      if(!res.ok || out.error) throw new Error(out.error || 'HTTP ' + res.status);
      const mode = normalizeMode(out.registration_mode || localStorage.getItem(MODE_KEY) || 'approval');
      localStorage.setItem(MODE_KEY, mode);
      paintRegistrationMode(mode);
      return mode;
    }catch(e){
      console.warn('[registration_mode reload fix]', e);
      const mode = normalizeMode(localStorage.getItem(MODE_KEY) || 'approval');
      paintRegistrationMode(mode);
      return mode;
    }
  };

  window.setRegistrationMode = async function(mode){
    if(!isAdmin()) return alert('Chỉ admin.');
    mode = normalizeMode(mode);
    const label = {open:'MỞ — ai cũng vào được', approval:'CẦN DUYỆT — user mới phải chờ', closed:'ĐÓNG — chặn đăng ký mới'}[mode] || mode;
    if(!confirm('Chuyển cổng đăng ký sang: ' + label + '?')) return;
    setBusy(true, 'Đang cập nhật...');
    try{
      clearSoftCache('site_settings');
      if(!await adminAction('set_registration_mode', { mode })) return;
      localStorage.setItem(MODE_KEY, mode);
      clearSoftCache('site_settings');
      paintRegistrationMode(mode);
      try{ await logAction('set_registration_mode', 'site_settings', 'registration_mode', { mode }); }catch(e){}
      toast('Đã chuyển cổng đăng ký: ' + mode);
    }finally{
      setBusy(false);
    }
  };

  const oldSetPage = typeof setPage === 'function' ? setPage : null;
  if(oldSetPage && !oldSetPage.__copilotPageRestoreFix){
    const fixedSetPage = function(id, name){
      oldSetPage.apply(this, arguments);
      try{
        if(id){
          sessionStorage.setItem(PAGE_KEY, id);
          sessionStorage.setItem(PAGE_NAME_KEY, name || document.querySelector('.nav[data-page="'+id+'"]')?.textContent?.trim() || id);
          localStorage.setItem(PAGE_KEY, id);
          localStorage.setItem(PAGE_NAME_KEY, name || document.querySelector('.nav[data-page="'+id+'"]')?.textContent?.trim() || id);
        }
      }catch(e){}
    };
    fixedSetPage.__copilotPageRestoreFix = true;
    window.setPage = setPage = fixedSetPage;
  }

  function restoreSavedPage(beforeId, beforeName){
    const id = beforeId || sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || '';
    if(!id || id === 'overview') return;
    const btn = document.querySelector('.nav[data-page="'+id+'"]');
    const page = document.getElementById(id);
    if(!btn || !page) return;
    const name = beforeName || sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || btn.textContent.trim();
    if(typeof setPage === 'function') setPage(id, name);
    if(id === 'subjectsAdmin' && typeof window.loadSubjectsAdmin === 'function') window.loadSubjectsAdmin();
    if(id === 'approvals' && typeof window.loadRegistrationMode === 'function') window.loadRegistrationMode();
    if(id === 'trash' && typeof window.loadTrash === 'function') window.loadTrash();
    if(id === 'subjectRequests' && typeof window.loadSubjectRequests === 'function') window.loadSubjectRequests();
  }

  const oldLoadAll = typeof loadAll === 'function' ? loadAll : null;
  if(oldLoadAll && !oldLoadAll.__copilotPageRestoreFix){
    const fixedLoadAll = async function(){
      const keepId = sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || '';
      const keepName = sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || '';
      const out = await oldLoadAll.apply(this, arguments);
      setTimeout(function(){ restoreSavedPage(keepId, keepName); }, 80);
      return out;
    };
    fixedLoadAll.__copilotPageRestoreFix = true;
    window.loadAll = loadAll = fixedLoadAll;
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ restoreSavedPage(); }, 700);
    setTimeout(function(){ restoreSavedPage(); }, 1600);
    setTimeout(function(){ if(typeof window.loadRegistrationMode === 'function') window.loadRegistrationMode(); }, 900);
  });
})();
// ===== END COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 =====


// ===== COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630 =====
// Chống mất ảnh khi admin duyệt/sửa: luôn đi qua /api/admin-action và danh sách câu hỏi có cột images.
(function(){
if(window.__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630) return;
window.__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630 = true;
window.approve = async function(id){
  const r = (cache.requests || []).find(x => Number(x.id) === Number(id));
  if(!r || r.status !== 'pending') return;
  if(!user) return alert('Chưa đăng nhập.');
  if(!confirm('Duyệt thay đổi cho câu ' + questionLabel(r) + '?')) return;
  setBusy(true, 'Đang duyệt...');
  try{
    const res = await fetch('/api/admin-action', {method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({user_id:user.id,action:'approve_request',payload:{request_id:id}})});
    const out = await res.json().catch(()=>({}));
    if(!res.ok || out.error) return alert(out.error || 'Không duyệt được');
    toast('Đã duyệt');
    await loadAll();
  } finally { setBusy(false); }
};
})();
// ===== END COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630 =====


// ===== COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630 =====
// Chống mất ảnh sau reset trang: tải cột images, xóa cache cũ, realtime không xóa mảng images.
(function(){
if(window.__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630) return;
window.__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630 = true;

function clearAdminImageCaches(){
  try{
    Object.keys(sessionStorage).forEach(function(k){
      if(k.startsWith('admin_f5_micro_cache:') || k.startsWith('lh_f5_cache:')) sessionStorage.removeItem(k);
    });
  }catch(e){}
}
window.clearAdminImageCaches = clearAdminImageCaches;

function mergeQuestionKeepImages(oldRow, newRow){
  const merged = Object.assign({}, oldRow || {}, newRow || {});
  if((!newRow || !Object.prototype.hasOwnProperty.call(newRow, 'images')) && oldRow && Object.prototype.hasOwnProperty.call(oldRow, 'images')){
    merged.images = oldRow.images;
  }
  return merged;
}
window.__mergeQuestionKeepImages = mergeQuestionKeepImages;

function patchLoadAll(){
  if(typeof window.loadAll !== 'function' || window.loadAll.__imageCacheFinalPatched) return;
  const oldLoadAll = window.loadAll;
  window.loadAll = async function(){
    clearAdminImageCaches();
    return oldLoadAll.apply(this, arguments);
  };
  window.loadAll.__imageCacheFinalPatched = true;
  try { loadAll = window.loadAll; } catch(e) {}
}

function patchRealtime(){
  if(typeof window.startAdminRealtime !== 'function' || window.startAdminRealtime.__imageRealtimeFinalPatched) return;
  const oldStart = window.startAdminRealtime;
  window.startAdminRealtime = function(){
    clearAdminImageCaches();
    const out = oldStart.apply(this, arguments);
    try{
      if(!client || typeof client.getChannels !== 'function') return out;
      client.getChannels().forEach(function(ch){
        if(ch.__imageKeepPatched) return;
        ch.__imageKeepPatched = true;
      });
    }catch(e){}
    return out;
  };
  window.startAdminRealtime.__imageRealtimeFinalPatched = true;
  try { startAdminRealtime = window.startAdminRealtime; } catch(e) {}
}

function patchRefreshButton(){
  const btn = document.getElementById('refreshBtn');
  if(!btn || btn.__imageCacheClearBound) return;
  btn.__imageCacheClearBound = true;
  btn.addEventListener('click', clearAdminImageCaches, true);
}

clearAdminImageCaches();
patchLoadAll();
patchRealtime();
patchRefreshButton();
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ clearAdminImageCaches(); patchLoadAll(); patchRealtime(); patchRefreshButton(); });
else setTimeout(function(){ clearAdminImageCaches(); patchLoadAll(); patchRealtime(); patchRefreshButton(); }, 0);
setTimeout(function(){ patchLoadAll(); patchRealtime(); patchRefreshButton(); }, 500);
})();
// ===== END COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630 =====


// ===== FIX_ADMIN_AUTO_REFRESH_20260701 =====
// Tự động làm mới dữ liệu định kỳ (polling) để admin thấy trạng thái mới nhất
// (chờ duyệt, block, requests...) mà không cần bấm F5. Vì dữ liệu ở Turso qua
// Edge API, không có kênh realtime nên dùng polling nhẹ, chỉ chạy khi tab đang
// active và không đang có thao tác/modal nào khác để tránh làm gián đoạn admin.
(function(){
  if (window.__FIX_ADMIN_AUTO_REFRESH_20260701) return;
  window.__FIX_ADMIN_AUTO_REFRESH_20260701 = true;

  const INTERVAL_MS = 20000; // 20 giây/lần, đủ nhanh mà không tốn quá nhiều request

  async function silentRefresh(){
    try{
      if (document.hidden) return;
      if (document.body.classList.contains('is-busy')) return;
      const modal = document.getElementById('modal');
      if (modal && !modal.classList.contains('hidden')) return;
      if (typeof user === 'undefined' || !user) return;
      if (typeof profile === 'undefined' || !profile) return;
      const appBox = document.getElementById('appBox');
      if (!appBox || appBox.classList.contains('hidden')) return;

      const pj = (v, d) => { if (v == null) return d; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return d; } };
      const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
      const dash = await res.json().catch(() => ({}));
      if (!res.ok || dash.error) return;

      cache.profiles = (dash.profiles || []).map(p => ({
        ...p,
        approved: p.approved === 1 || p.approved === true || p.approved === '1',
        blocked: p.blocked === 1 || p.blocked === true || p.blocked === '1'
      }));
      cache.questions = (dash.questions || []).map(q => ({ ...q, options: pj(q.options, {}), images: pj(q.images, []) }));
      cache.requests = (dash.requests || []).map(r => ({ ...r, old_data: pj(r.old_data, {}), new_data: pj(r.new_data, {}) }));
      cache.history = (dash.history || []).map(h => ({ ...h, previous_data: pj(h.previous_data, {}), new_data: pj(h.new_data, {}) }));
      cache.logs = (typeof isAdmin === 'function' && isAdmin()) ? (dash.logs || []).map(l => ({ ...l, details: pj(l.details, {}) })) : [];
      cache.subjects = dash.subjects || [];
      cache.subject_requests = (dash.subject_requests || []).map(s => ({ ...s, questions_data: pj(s.questions_data, []) }));
      cache.deleted_questions = (dash.deleted_questions || []).map(d => ({ ...d, original_data: pj(d.original_data, {}) }));
      cache.deleted_subjects = (dash.deleted_subjects || []).map(d => ({ ...d, original_data: pj(d.original_data, {}) }));

      if (typeof render === 'function') render();
      if (typeof renderApprovals === 'function') renderApprovals();
    } catch(e){
      console.warn('[silentRefresh]', e);
    }
  }

  setInterval(silentRefresh, INTERVAL_MS);
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) silentRefresh();
  });
})();
// ===== END FIX_ADMIN_AUTO_REFRESH_20260701 =====
