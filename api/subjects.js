import { db, json } from './_db.js';

export const config = { runtime: 'edge' };

function cleanRow(row) {
  return {
    ...row,
    sort_order: Number(row.sort_order || 0),
    is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1'
  };
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const r = await db.execute({
      sql: `select id, code, name, description, cover, sort_order, is_active, created_at
            from subjects
            where coalesce(is_active, 1) = 1
            order by sort_order asc, code asc`
    });
    return json({ data: (r.rows || []).map(cleanRow) });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
