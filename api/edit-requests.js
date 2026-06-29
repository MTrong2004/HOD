import { db, json } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
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
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
