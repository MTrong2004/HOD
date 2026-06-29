import { createClient } from '@libsql/client/web';

export const config = { runtime: 'edge' };

// Utility functions
const clean = (val) => {
  if (!val) return '';
  return val.trim().replace(/(^['"]|['"]$)/g, '');
};

const rawUrl = clean(process.env.TURSO_DATABASE_URL);
const url = rawUrl.startsWith('libsql://')
  ? rawUrl.replace('libsql://', 'https://')
  : rawUrl;

let realDb = null;
function getRealDb() {
  if (!realDb) {
    realDb = createClient({
      url: url,
      authToken: clean(process.env.TURSO_AUTH_TOKEN)
    });
  }
  return realDb;
}

const db = {
  execute(...args) {
    return getRealDb().execute(...args);
  }
};

function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function getAdminEmail() {
  return clean(process.env.ADMIN_EMAIL).toLowerCase().trim();
}

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function toJsonText(v, fallback) {
  if (v === null || v === undefined) return JSON.stringify(fallback);
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return JSON.stringify(fallback); }
}

function safeParse(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch(e) { return fallback; }
}

function subjectCoverWithNewBadge(cover, enabled) {
  let meta = {};
  if (cover) {
    try {
      meta = typeof cover === 'string' ? JSON.parse(cover) : cover;
    } catch (e) {
      meta = { url: String(cover) };
    }
  }
  meta.new_badge = !!enabled;
  return JSON.stringify(meta);
}

// Router handler
export default async function handler(req) {
  const parsedUrl = new URL(req.url);
  const path = parsedUrl.pathname.replace('/api/', '').split('/')[0];

  try {
    if (path === 'subjects') {
      if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      
      const r = await db.execute({
        sql: `select id, code, name, description, cover, sort_order, is_active, created_at
              from subjects
              where coalesce(is_active, 1) = 1
              order by sort_order asc, code asc`
      });
      return json({
        data: (r.rows || []).map(row => ({
          ...row,
          sort_order: Number(row.sort_order || 0),
          is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1'
        }))
      });
    }

    if (path === 'questions') {
      if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      
      const subject = (parsedUrl.searchParams.get('subject_code') || '').trim().toUpperCase();
      let sql = `select id, subject_code, num, question, options, answer, answer_text,
                        images, is_active, created_at, updated_at, has_image,
                        error_risk, error_risk_reason
                 from questions
                 where coalesce(is_active, 1) = 1`;
      const args = [];

      if (subject) {
        sql += ' and subject_code = ?';
        args.push(subject);
      }
      sql += ' order by subject_code asc, num asc';

      const r = await db.execute({ sql, args });
      return json({
        data: (r.rows || []).map(row => ({
          ...row,
          options: parseJson(row.options, {}),
          images: parseJson(row.images, []),
          is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
          has_image: row.has_image === 1 || row.has_image === true || row.has_image === '1'
        }))
      });
    }

    if (path === 'profile') {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      
      const body = await req.json();
      const { id, email, full_name, avatar_url } = body;
      if (!id || !email) {
        return json({ error: 'Missing id or email' }, 400);
      }

      const trimmedEmail = email.toLowerCase().trim();
      const adminEmail = String(getAdminEmail() || '').toLowerCase().trim();
      const isAdminUser = !!adminEmail && trimmedEmail === adminEmail;

      const existing = await db.execute({
        sql: 'select * from profiles where id = ?',
        args: [id]
      });

      const now = new Date().toISOString();

      if (existing.rows && existing.rows.length > 0) {
        let role = existing.rows[0].role || 'user';
        let approved = existing.rows[0].approved;
        if (approved === null || approved === undefined) approved = 0;

        if (isAdminUser) {
          role = 'admin';
          approved = 1;
        }

        await db.execute({
          sql: `update profiles 
                set email = ?,
                    full_name = coalesce(?, full_name),
                    avatar_url = coalesce(?, avatar_url),
                    role = ?, approved = ?, last_login = ?, last_activity = ?
                where id = ?`,
          args: [trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, id]
        });

        const updated = await db.execute({
          sql: 'select * from profiles where id = ?',
          args: [id]
        });
        return json({ data: updated.rows[0] });
      } else {
        let regMode = 'approval';
        try {
          const setting = await db.execute({
            sql: "select value from site_settings where key = 'registration_mode'",
            args: []
          });
          if (setting.rows && setting.rows[0]) {
            const val = setting.rows[0].value;
            regMode = typeof val === 'string' ? val.replace(/"/g, '') : String(val);
          }
        } catch (e) {
          console.warn('Cannot read registration_mode setting, default to approval:', e);
        }

        if (regMode === 'closed' && !isAdminUser) {
          return json({ error: 'Registration is currently closed' }, 403);
        }

        const role = isAdminUser ? 'admin' : 'user';
        const approved = (isAdminUser || regMode === 'open') ? 1 : 0;

        await db.execute({
          sql: `insert into profiles (id, email, full_name, avatar_url, role, approved, blocked, last_login, last_activity, created_at)
                values (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          args: [id, trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, now]
        });

        const created = await db.execute({
          sql: 'select * from profiles where id = ?',
          args: [id]
        });
        return json({ data: created.rows[0] });
      }
    }

    if (path === 'edit-requests') {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      
      const body = await req.json();
      await db.execute({
        sql: `insert into edit_requests
              (question_id, question_num, subject_code, user_id, user_email, old_data, new_data, reason, status, created_at)
              values (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
        args: [
          body.question_id || null,
          body.question_num || null,
          body.subject_code || body.old_data?.subject_code || body.new_data?.subject_code || '',
          body.user_id || null,
          body.user_email || '',
          JSON.stringify(body.old_data || {}),
          JSON.stringify(body.new_data || {}),
          body.reason || ''
        ]
      });
      return json({ ok: true });
    }

    if (path === 'admin-dashboard') {
      if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      
      const [profiles, questions, requests, history, logs, subjects, subject_requests, deleted_questions, deleted_subjects] = await Promise.all([
        db.execute('select * from profiles order by created_at desc'),
        db.execute('select * from questions order by subject_code asc, num asc'),
        db.execute('select * from edit_requests order by created_at desc'),
        db.execute('select * from question_history order by created_at desc limit 500'),
        db.execute('select * from admin_logs order by created_at desc limit 500'),
        db.execute('select * from subjects order by sort_order asc, code asc'),
        db.execute('select * from subject_requests order by created_at desc'),
        db.execute('select * from deleted_questions order by deleted_at desc'),
        db.execute('select * from deleted_subjects order by deleted_at desc')
      ]);

      return json({
        profiles: profiles.rows || [],
        questions: questions.rows || [],
        requests: requests.rows || [],
        history: history.rows || [],
        logs: logs.rows || [],
        subjects: subjects.rows || [],
        subject_requests: subject_requests.rows || [],
        deleted_questions: deleted_questions.rows || [],
        deleted_subjects: deleted_subjects.rows || []
      });
    }

    if (path === 'admin-action') {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      
      const body = await req.json();
      const { user_id, action, payload } = body;

      if (!user_id || !action) {
        return json({ error: 'Missing user_id or action' }, 400);
      }

      const userRes = await db.execute({
        sql: 'select * from profiles where id = ?',
        args: [user_id]
      });

      const userProfile = userRes.rows?.[0];
      const adminEmail = String(getAdminEmail() || '').toLowerCase().trim();
      const isConfiguredAdmin = adminEmail && userProfile && userProfile.email && String(userProfile.email).toLowerCase().trim() === adminEmail;
      
      const isBlocked = userProfile?.blocked === 1 || userProfile?.blocked === true;
      const isApproved = userProfile?.approved === 1 || userProfile?.approved === true;
      const isEditorOrAdmin = ['admin', 'editor'].includes(userProfile?.role);

      const isAllowedAction = action === 'add_subject_request'
        ? (!isBlocked && isApproved)
        : (isConfiguredAdmin || (!isBlocked && isApproved && isEditorOrAdmin));

      if (!isAllowedAction) {
        return json({ error: 'Unauthorized.' }, 403);
      }

      const adminEmailStr = userProfile?.email || 'N/A';
      const now = new Date().toISOString();

      const logAdminAction = async (actionName, targetType, targetId, details = {}) => {
        try {
          await db.execute({
            sql: `insert into admin_logs (admin_id, admin_email, action, target_type, target_id, details, created_at)
                  values (?, ?, ?, ?, ?, ?, ?)`,
            args: [user_id, adminEmailStr, actionName, targetType, String(targetId), JSON.stringify(details), now]
          });
        } catch (logErr) {
          console.warn('Logging failed:', logErr);
        }
      };

      switch (action) {
        case 'approve_request': {
          const { request_id } = payload;
          const reqRes = await db.execute({
            sql: 'select * from edit_requests where id = ?',
            args: [request_id]
          });
          const request = reqRes.rows?.[0];
          if (!request) return json({ error: 'Request not found' }, 404);

          const new_data = safeParse(request.new_data, {});

          await db.execute({
            sql: `update questions
                  set question = ?, options = ?, answer = ?, answer_text = ?, images = ?,
                      has_image = ?, error_risk = ?, error_risk_reason = ?, updated_at = ?
                  where id = ?`,
            args: [
              new_data.question,
              JSON.stringify(new_data.options || {}),
              new_data.answer,
              new_data.answer_text || '',
              JSON.stringify(new_data.images || []),
              new_data.has_image ? 1 : 0,
              new_data.error_risk || 'low',
              new_data.error_risk_reason || null,
              now,
              request.question_id
            ]
          });

          await db.execute({
            sql: 'update edit_requests set status = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
            args: ['approved', now, user_id, request_id]
          });

          await db.execute({
            sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
                  values (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              request.question_id,
              request_id,
              request.old_data,
              request.new_data,
              request.user_id,
              user_id,
              now
            ]
          });

          await logAdminAction('approve_request', 'edit_requests', request_id, { question_id: request.question_id });
          return json({ ok: true });
        }

        case 'reject_request': {
          const { request_id, admin_note } = payload;
          await db.execute({
            sql: 'update edit_requests set status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
            args: ['rejected', admin_note || '', now, user_id, request_id]
          });

          await logAdminAction('reject_request', 'edit_requests', request_id, { admin_note });
          return json({ ok: true });
        }

        case 'save_question_direct': {
          const { question_id, new_data, old_data } = payload;
          await db.execute({
            sql: `update questions
                  set question = ?, options = ?, answer = ?, answer_text = ?, images = ?,
                      has_image = ?, error_risk = ?, error_risk_reason = ?, updated_at = ?
                  where id = ?`,
            args: [
              new_data.question,
              JSON.stringify(new_data.options || {}),
              new_data.answer,
              new_data.answer_text || '',
              JSON.stringify(new_data.images || []),
              new_data.has_image ? 1 : 0,
              new_data.error_risk || 'low',
              new_data.error_risk_reason || null,
              now,
              question_id
            ]
          });

          await db.execute({
            sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
                  values (?, null, ?, ?, ?, ?, ?)`,
            args: [
              question_id,
              JSON.stringify(old_data || {}),
              JSON.stringify(new_data || {}),
              user_id,
              user_id,
              now
            ]
          });

          await logAdminAction('save_question_direct', 'questions', question_id);
          return json({ ok: true });
        }

        case 'add_question': {
          const { question_data } = payload;
          const subjectCode = question_data.subject_code || 'HOD102';
          
          let finalNum = Number(question_data.num);
          const existRes = await db.execute({
            sql: 'select num from questions where subject_code = ?',
            args: [subjectCode]
          });
          const existSet = new Set((existRes.rows || []).map(x => Number(x.num)));
          
          if (!finalNum || existSet.has(finalNum)) {
            let n = 1;
            while (existSet.has(n)) n++;
            finalNum = n;
          }

          const res = await db.execute({
            sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                  values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            args: [
              subjectCode,
              finalNum,
              question_data.question,
              JSON.stringify(question_data.options || {}),
              question_data.answer,
              question_data.answer_text || '',
              JSON.stringify(question_data.images || []),
              question_data.has_image ? 1 : 0,
              question_data.error_risk || 'low',
              question_data.error_risk_reason || null,
              now,
              now
            ]
          });

          const newId = Number(res.lastInsertRowid);

          await db.execute({
            sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
                  values (?, null, null, ?, ?, ?, ?)`,
            args: [
              newId,
              JSON.stringify(question_data),
              user_id,
              user_id,
              now
            ]
          });

          await logAdminAction('add_question', 'questions', newId);
          return json({ ok: true, id: newId });
        }

        case 'delete_question': {
          const { question_id } = payload;
          const qRes = await db.execute({
            sql: 'select * from questions where id = ?',
            args: [question_id]
          });
          const q = qRes.rows?.[0];
          if (!q) return json({ error: 'Question not found' }, 404);

          await db.execute({
            sql: 'update questions set is_active = 0, updated_at = ? where id = ?',
            args: [now, question_id]
          });

          await db.execute({
            sql: `insert or replace into deleted_questions (id, original_data, deleted_at, deleted_by, deleted_by_email)
                  values (?, ?, ?, ?, ?)`,
            args: [question_id, JSON.stringify(q), now, user_id, adminEmailStr]
          });

          await logAdminAction('delete_question', 'questions', question_id);
          return json({ ok: true });
        }

        case 'restore_question': {
          const { question_id } = payload;
          await db.execute({
            sql: 'update questions set is_active = 1, updated_at = ? where id = ?',
            args: [now, question_id]
          });
          await db.execute({
            sql: 'delete from deleted_questions where id = ?',
            args: [question_id]
          });

          await logAdminAction('restore_question', 'questions', question_id);
          return json({ ok: true });
        }

        case 'add_subject': {
          const { code, name, description, cover, sort_order, questions } = payload;
          
          let finalCode = code.toUpperCase().trim();
          const existed = await db.execute({
            sql: "select code from subjects where code = ? or code like ?",
            args: [finalCode, `${finalCode}_%`]
          });
          const usedCodes = new Set((existed.rows || []).map(x => String(x.code || '').toUpperCase()));
          if (usedCodes.has(finalCode)) {
            let n = 2;
            while (usedCodes.has(`${finalCode}_${n}`)) n++;
            finalCode = `${finalCode}_${n}`;
          }

          let finalSortOrder = sort_order;
          if (!finalSortOrder) {
            const maxRes = await db.execute('select max(sort_order) as m from subjects');
            finalSortOrder = (Number(maxRes.rows?.[0]?.m) || 0) + 1;
          }
          const res = await db.execute({
            sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
                  values (?, ?, ?, ?, ?, 1, ?)`,
            args: [finalCode, name, description || '', subjectCoverWithNewBadge(cover, true), finalSortOrder, now]
          });

          const newId = Number(res.lastInsertRowid);

          if (questions && questions.length > 0) {
            let currentNum = 1;
            for (const q of questions) {
              const list = q.images || [];
              const localHasImg = !!(list.length || q.has_image);
              const finalNum = currentNum++;
              await db.execute({
                sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                      values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
                args: [
                  finalCode,
                  finalNum,
                  q.question || '',
                  JSON.stringify(q.options || {}),
                  (q.answer || '').toUpperCase(),
                  q.answer_text || '',
                  JSON.stringify(q.images || []),
                  localHasImg ? 1 : 0,
                  q.error_risk || 'low',
                  q.error_risk_reason || null,
                  now,
                  now
                ]
              });
            }
          }

          await logAdminAction('add_subject', 'subjects', newId, { code: finalCode });
          return json({ ok: true, id: newId, code: finalCode });
        }

        case 'edit_subject': {
          const { id, name, description, cover, sort_order } = payload;
          await db.execute({
            sql: `update subjects
                  set name = ?, description = ?, cover = ?, sort_order = ?
                  where id = ?`,
            args: [name, description || '', cover || '', sort_order || 0, id]
          });

          await logAdminAction('edit_subject', 'subjects', id);
          return json({ ok: true });
        }

        case 'delete_subject': {
          const { subject_id } = payload;
          const subRes = await db.execute({
            sql: 'select * from subjects where id = ?',
            args: [subject_id]
          });
          const sub = subRes.rows?.[0];
          if (!sub) return json({ error: 'Subject not found' }, 404);

          const qRes = await db.execute({
            sql: 'select * from questions where subject_code = ? order by num asc',
            args: [sub.code]
          });
          const backup = { subject: sub, questions: qRes.rows || [] };

          await db.execute({
            sql: 'update subjects set is_active = 0 where id = ?',
            args: [subject_id]
          });
          await db.execute({
            sql: 'update questions set is_active = 0, updated_at = ? where subject_code = ?',
            args: [now, sub.code]
          });

          await db.execute({
            sql: `insert into deleted_subjects (original_data, deleted_by, deleted_by_email, deleted_at)
                  values (?, ?, ?, ?)`,
            args: [JSON.stringify(backup), user_id, adminEmailStr, now]
          });

          await logAdminAction('delete_subject', 'subjects', subject_id, { code: sub.code, questions: backup.questions.length });
          return json({ ok: true });
        }

        case 'permanent_delete_subject': {
          const { subject_id } = payload;
          const sid = String(subject_id || '').trim();
          if (!sid) return json({ error: 'Missing subject_id' }, 400);

          const delRes = await db.execute({
            sql: 'select * from deleted_subjects where id = ?',
            args: [sid]
          });
          let trash = delRes.rows?.[0];
          if (!trash && /^\d+$/.test(sid)) {
            const delRes2 = await db.execute({
              sql: 'select * from deleted_subjects where id = ?',
              args: [Number(sid)]
            });
            trash = delRes2.rows?.[0];
          }
          if (!trash) return json({ error: 'Deleted subject not found' }, 404);

          const backup = safeParse(trash.original_data, {});
          const sub = backup.subject || backup || {};
          const code = String(sub.code || '').trim();

          if (code) {
            await db.execute({ sql: 'delete from questions where subject_code = ?', args: [code] });
            await db.execute({ sql: 'delete from subjects where code = ?', args: [code] });
          }

          await db.execute({ sql: 'delete from deleted_subjects where id = ?', args: [trash.id] });
          await logAdminAction('permanent_delete_subject', 'deleted_subjects', trash.id, { code });
          return json({ ok: true, id: trash.id, code });
        }

        case 'permanent_delete_question': {
          const { question_id } = payload;
          const qid = String(question_id || '').trim();
          if (!qid) return json({ error: 'Missing question_id' }, 400);

          const delRes = await db.execute({ sql: 'select * from deleted_questions where id = ?', args: [qid] });
          let trash = delRes.rows?.[0];
          if (!trash && /^\d+$/.test(qid)) {
            const delRes2 = await db.execute({ sql: 'select * from deleted_questions where id = ?', args: [Number(qid)] });
            trash = delRes2.rows?.[0];
          }
          if (!trash) return json({ error: 'Deleted question not found' }, 404);

          const oldQ = safeParse(trash.original_data, {});
          const realQuestionId = oldQ.id || trash.id;
          if (realQuestionId) await db.execute({ sql: 'delete from questions where id = ?', args: [realQuestionId] });
          await db.execute({ sql: 'delete from deleted_questions where id = ?', args: [trash.id] });
          await logAdminAction('permanent_delete_question', 'deleted_questions', trash.id, { question_id: realQuestionId, subject_code: oldQ.subject_code, num: oldQ.num });
          return json({ ok: true, id: trash.id });
        }

        case 'restore_subject': {
          const { subject_id, code } = payload;
          const delRes = await db.execute({
            sql: 'select * from deleted_subjects where id = ?',
            args: [subject_id]
          });
          const trash = delRes.rows?.[0];
          const backup = trash ? safeParse(trash.original_data, {}) : {};
          const sub = backup.subject || backup || null;

          if (sub?.code) {
            await db.execute({
              sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
                    values (?, ?, ?, ?, ?, 1, ?)
                    on conflict(code) do update set
                      name = excluded.name,
                      description = excluded.description,
                      cover = excluded.cover,
                      sort_order = excluded.sort_order,
                      is_active = 1`,
              args: [sub.code, sub.name || sub.code, sub.description || '', sub.cover || '', sub.sort_order || 0, sub.created_at || now]
            });

            const questions = Array.isArray(backup.questions) ? backup.questions : [];
            for (const q of questions) {
              await db.execute({
                sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                      values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
                      on conflict(subject_code, num) do update set
                        question = excluded.question,
                        options = excluded.options,
                        answer = excluded.answer,
                        answer_text = excluded.answer_text,
                        images = excluded.images,
                        is_active = 1,
                        has_image = excluded.has_image,
                        error_risk = excluded.error_risk,
                        error_risk_reason = excluded.error_risk_reason,
                        updated_at = excluded.updated_at`,
                args: [
                  q.subject_code || sub.code,
                  q.num,
                  q.question || '',
                  toJsonText(q.options, {}),
                  q.answer || '',
                  q.answer_text || '',
                  toJsonText(q.images, []),
                  q.has_image ? 1 : 0,
                  q.error_risk || 'low',
                  q.error_risk_reason || null,
                  q.created_at || now,
                  now
                ]
              });
            }
          } else {
            await db.execute({
              sql: 'update subjects set is_active = 1 where id = ?',
              args: [subject_id]
            });
          }

          await db.execute({
            sql: 'delete from deleted_subjects where id = ?',
            args: [subject_id]
          });
          await logAdminAction('restore_subject', 'subjects', subject_id, { code: code || sub?.code });
          return json({ ok: true });
        }

        case 'approve_subject_request': {
          const { request_id } = payload;
          const reqRes = await db.execute({
            sql: 'select * from subject_requests where id = ?',
            args: [request_id]
          });
          const request = reqRes.rows?.[0];
          if (!request) return json({ error: 'Request not found' }, 404);

          const subRes = await db.execute({
            sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
                  values (?, ?, ?, ?, 99, 1, ?)`,
            args: [request.code.toUpperCase().trim(), request.name, request.description || '', subjectCoverWithNewBadge('', true), now]
          });

          const qList = safeParse(request.questions_data, []);
          if (qList && qList.length > 0) {
            let currentNum = 1;
            for (const q of qList) {
              const finalNum = currentNum++;
              await db.execute({
                sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, created_at, updated_at)
                      values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
                args: [
                  request.code.toUpperCase().trim(),
                  finalNum,
                  q.question,
                  JSON.stringify(q.options || {}),
                  q.answer,
                  q.answer_text || '',
                  JSON.stringify(q.images || []),
                  q.images && q.images.length > 0 ? 1 : 0,
                  now,
                  now
                ]
              });
            }
          }

          await db.execute({
            sql: 'update subject_requests set status = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
            args: ['approved', now, user_id, request_id]
          });

          await logAdminAction('approve_subject_request', 'subject_requests', request_id, { code: request.code });
          return json({ ok: true });
        }

        case 'reject_subject_request': {
          const { request_id, admin_note } = payload;
          await db.execute({
            sql: 'update subject_requests set status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
            args: ['rejected', admin_note || '', now, user_id, request_id]
          });

          await logAdminAction('reject_subject_request', 'subject_requests', request_id);
          return json({ ok: true });
        }

        case 'toggle_user_block': {
          const { target_user_id, blocked } = payload;
          await db.execute({
            sql: 'update profiles set blocked = ? where id = ?',
            args: [blocked ? 1 : 0, target_user_id]
          });

          await logAdminAction(blocked ? 'block_user' : 'unblock_user', 'profiles', target_user_id);
          return json({ ok: true });
        }

        case 'set_user_role': {
          const { target_user_id, role } = payload;
          if (!['user', 'editor', 'admin'].includes(role)) return json({ error: 'Invalid role' }, 400);
          await db.execute({
            sql: 'update profiles set role = ? where id = ?',
            args: [role, target_user_id]
          });

          await logAdminAction('set_user_role', 'profiles', target_user_id, { role });
          return json({ ok: true });
        }

        case 'approve_user_registration': {
          const { target_user_id } = payload;
          await db.execute({
            sql: 'update profiles set approved = 1 where id = ?',
            args: [target_user_id]
          });

          await logAdminAction('approve_user_registration', 'profiles', target_user_id);
          return json({ ok: true });
        }

        case 'reject_user_registration': {
          const { target_user_id } = payload;
          await db.execute({
            sql: 'delete from profiles where id = ?',
            args: [target_user_id]
          });

          await logAdminAction('reject_user_registration', 'profiles', target_user_id);
          return json({ ok: true });
        }

        case 'set_registration_mode': {  
          let { mode } = payload;  
          if (typeof mode !== 'string') mode = String(mode || 'approval');  
          try { mode = JSON.parse(mode); } catch {}  
          if (typeof mode !== 'string') mode = String(mode || 'approval');  
          mode = mode.replace(/^\"+|\"+$/g, '').trim();  
          if (!['open', 'approval', 'closed'].includes(mode)) mode = 'approval';  
          await db.execute({  
            sql: "insert into site_settings (key, value, updated_at, updated_by) values ('registration_mode', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",  
            args: [mode, now, user_id]  
          });  
          await logAdminAction('set_registration_mode', 'site_settings', 'registration_mode', { mode });  
          return json({ ok: true, mode });  
        }

        case 'add_subject_request': {
          const { code, name, description, questions_data } = payload;
          await db.execute({
            sql: `insert into subject_requests (code, name, description, questions_data, user_id, user_email, status, created_at)
                  values (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            args: [
              code.toUpperCase().trim(),
              name,
              description || '',
              toJsonText(questions_data, []),
              user_id,
              adminEmailStr,
              now
            ]
          });
          return json({ ok: true });
        }

        default:
          return json({ error: `Action '${action}' not supported` }, 400);
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
