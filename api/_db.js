import { createClient } from '@libsql/client/web';

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
    const rawUrl = url;
    realDb = createClient({
      url: rawUrl,
      authToken: clean(process.env.TURSO_AUTH_TOKEN)
    });
  }
  return realDb;
}

export const db = {
  execute(...args) {
    return getRealDb().execute(...args);
  }
};

export function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function getAdminEmail() {
  return clean(process.env.ADMIN_EMAIL).toLowerCase().trim();
}
