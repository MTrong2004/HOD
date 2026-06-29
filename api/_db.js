import { createClient } from '@libsql/client';

const rawUrl = process.env.TURSO_DATABASE_URL || '';
const url = rawUrl.startsWith('libsql://')
  ? rawUrl.replace('libsql://', 'https://')
  : rawUrl;

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
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
