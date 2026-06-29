import { createClient } from '@libsql/client/web';

const clean = (val) => {
  if (!val) return '';
  return val.trim().replace(/(^['"]|['"]$)/g, '');
};

const rawUrl = clean(process.env.TURSO_DATABASE_URL);
const url = rawUrl.startsWith('libsql://')
  ? rawUrl.replace('libsql://', 'https://')
  : rawUrl;

export const db = createClient({
  url,
  authToken: clean(process.env.TURSO_AUTH_TOKEN)
});

export function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
}
