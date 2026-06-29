import { db, json, getAdminEmail } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { user_id, action, payload } = body;

    if (!user_id || !action) {
      return json({ error: 'Missing user_id or action' }, 400);
    }

    // 1. Xác minh quyền của user
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

    // add_subject_request chỉ yêu cầu người dùng được duyệt và không bị khóa.
    // Các hành động khác yêu cầu quyền editor hoặc admin.
    const isAllowedAction = action === 'add_subject_request'
      ? (!isBlocked && isApproved)
      : (isConfiguredAdmin || (!isBlocked && isApproved && isEditorOrAdmin));

    if (!isAllowedAction) {
      return json({ error: 'Unauthorized.' }, 403);
    }

    const adminEmailStr = userProfile?.email || 'N/A';
    const now = new Date().toISOString();

    const safeParse = (value, fallback) => {
      if (value === null || value === undefined || value === '') return fallback;
      if (typeof value !== 'string') return value;
      try { return JSON.parse(value); } catch { return fallback; }
    };
    const toJsonText = (value, fallback) => {
      const v = value === undefined ? fallback : value;
      return typeof v === 'string' ? v : JSON.stringify(v ?? fallback);
    };
    const subjectCoverWithNewBadge = (coverValue, enabled = true) => {
      let meta = {};
      if (coverValue) {
        if (typeof coverValue === 'string') {
          try { meta = JSON.parse(coverValue) || {}; } catch { meta = { url: coverValue }; }
        } else if (typeof coverValue === 'object') meta = { ...coverValue };
      }
      meta.new_badge = !!enabled;
      return JSON.stringify(meta);
    };

    // Hàm tiện ích để ghi log admin
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

    // 2. Định tuyến các hành động admin
    switch (action) {
      case 'approve_request': {
        const { request_id } = payload;
        // Lấy thông tin request
        const reqRes = await db.execute({
          sql: 'select * from edit_requests where id = ?',
          args: [request_id]
        });
        const request = reqRes.rows?.[0];
        if (!request) return json({ error: 'Request not found' }, 404);

        const new_data = safeParse(request.new_data, {});
        const old_data = safeParse(request.old_data, {});

        // Cập nhật câu hỏi
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

        // Cập nhật trạng thái request
        await db.execute({
          sql: 'update edit_requests set status = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
          args: ['approved', now, user_id, request_id]
        });

        // Ghi vào lịch sử câu hỏi
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
        // Cập nhật câu hỏi trực tiếp
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

        // Ghi vào lịch sử câu hỏi
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
        const res = await db.execute({
          sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
          args: [
            question_data.subject_code || 'HOD102',
            question_data.num,
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

        // Ghi lịch sử
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
        
        // Lấy dữ liệu cũ để lưu vào thùng rác
        const qRes = await db.execute({
          sql: 'select * from questions where id = ?',
          args: [question_id]
        });
        const q = qRes.rows?.[0];
        if (!q) return json({ error: 'Question not found' }, 404);

        // Tạm ẩn câu hỏi
        await db.execute({
          sql: 'update questions set is_active = 0, updated_at = ? where id = ?',
          args: [now, question_id]
        });

        // Thêm vào deleted_questions
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

      case 'permanent_delete_question': {
        const { question_id } = payload;
        await db.execute({
          sql: 'delete from questions where id = ?',
          args: [question_id]
        });
        await db.execute({
          sql: 'delete from deleted_questions where id = ?',
          args: [question_id]
        });

        await logAdminAction('permanent_delete_question', 'questions', question_id);
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
          for (const q of questions) {
            const list = q.images || [];
            const localHasImg = !!(list.length || q.has_image);
            await db.execute({
              sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
              args: [
                finalCode,
                q.num,
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
        // Lấy thông tin request
        const reqRes = await db.execute({
          sql: 'select * from subject_requests where id = ?',
          args: [request_id]
        });
        const request = reqRes.rows?.[0];
        if (!request) return json({ error: 'Request not found' }, 404);

        // 1. Thêm môn học
        const subRes = await db.execute({
          sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
                values (?, ?, ?, ?, 99, 1, ?)`,
          args: [request.code.toUpperCase().trim(), request.name, request.description || '', subjectCoverWithNewBadge('', true), now]
        });

        // 2. Thêm các câu hỏi đính kèm (nếu có)
        const qList = safeParse(request.questions_data, []);
        if (qList && qList.length > 0) {
          for (const q of qList) {
            await db.execute({
              sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, created_at, updated_at)
                    values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
              args: [
                request.code.toUpperCase().trim(),
                q.num,
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

        // 3. Cập nhật status request
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
        const { mode } = payload;
        await db.execute({
          sql: "insert into site_settings (key, value, updated_at, updated_by) values ('registration_mode', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",
          args: [JSON.stringify(mode), now, user_id]
        });

        await logAdminAction('set_registration_mode', 'site_settings', 'registration_mode', { mode });
        return json({ ok: true });
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
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
