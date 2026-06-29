import { db, json, getAdminEmail } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { id, email, full_name, avatar_url } = body;

    if (!id || !email) {
      return json({ error: 'Missing id or email' }, 400);
    }

    const trimmedEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();
    const isAdmin = adminEmail && trimmedEmail === adminEmail;

    console.log('[profile] Admin matching debug:', {
      trimmedEmail,
      adminEmail,
      isAdmin: !!isAdmin
    });

    // 1. Kiểm tra xem profile đã tồn tại chưa
    const existing = await db.execute({
      sql: 'select * from profiles where id = ?',
      args: [id]
    });

    const now = new Date().toISOString();

    if (existing.rows && existing.rows.length > 0) {
      // Đã tồn tại -> Cập nhật login/activity
      let role = existing.rows[0].role || 'user';
      let approved = existing.rows[0].approved;

      // Nếu email khớp với admin email cấu hình trên Vercel, tự nâng cấp lên Admin
      if (isAdmin) {
        role = 'admin';
        approved = 1;
      }

      await db.execute({
        sql: `update profiles 
              set email = ?, full_name = ?, avatar_url = ?, role = ?, approved = ?, last_login = ?, last_activity = ?
              where id = ?`,
        args: [trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, id]
      });

      const updated = await db.execute({
        sql: 'select * from profiles where id = ?',
        args: [id]
      });

      return json({ data: updated.rows[0] });
    } else {
      // Chưa tồn tại -> Đăng ký mới
      // Đọc registration_mode từ site_settings
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

      if (regMode === 'closed' && !isAdmin) {
        return json({ error: 'Registration is currently closed' }, 403);
      }

      const role = isAdmin ? 'admin' : 'user';
      const approved = (isAdmin || regMode === 'open') ? 1 : 0;

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
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
