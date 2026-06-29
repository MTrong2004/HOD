import { db, json } from './_db.js';

export const config = { runtime: 'edge' };

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function cleanRow(row) {
  return {
    ...row,
    options: parseJson(row.options, {}),
    images: parseJson(row.images, []),
    is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
    has_image: row.has_image === 1 || row.has_image === true || row.has_image === '1'
  };
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const url = new URL(req.url);
    const subject = (url.searchParams.get('subject_code') || '').trim().toUpperCase();

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
    return json({ data: (r.rows || []).map(cleanRow) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
