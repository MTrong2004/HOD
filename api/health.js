import { db, json } from './_db.js';

export default async function handler() {
  console.log('[health check] Starting database query test...');
  console.log('[health check] Environment check:', {
    has_url: !!process.env.TURSO_DATABASE_URL,
    url_len: (process.env.TURSO_DATABASE_URL || '').length,
    has_token: !!process.env.TURSO_AUTH_TOKEN,
    token_len: (process.env.TURSO_AUTH_TOKEN || '').length
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Database query timed out (4s) - possible connection hang')), 4000)
  );

  try {
    const queryPromise = db.execute('select 1 as ok');
    const r = await Promise.race([queryPromise, timeoutPromise]);
    console.log('[health check] Database query succeeded:', r.rows);
    return json({ ok: true, db: r.rows?.[0]?.ok === 1 });
  } catch (e) {
    console.error('[health check] Error occurred:', e.message);
    return json({ ok: false, error: e.message }, 500);
  }
}
