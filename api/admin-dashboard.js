import { db, json } from './_db.js';

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
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
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
