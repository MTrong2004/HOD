import { createClient } from '@libsql/client';

const url = 'https://lxpacademy-mtrong2004.aws-ap-northeast-1.turso.io';
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI3NTUwODMsImlkIjoiMDE5ZjE0NGUtMTgwMS03YzRjLTgwNDUtNjVlZjBmZTQzZTFkIiwia2lkIjoiMTVLdm81QXE0QV92Rk5YbEZTM3ZfSXE2TmZ3SkxlWHAwT19SbWJXRGlDYyIsInJpZCI6IjJhMzI4ZWZmLTdkMjktNGNkMC1hYWJkLThlMzQzYzdlYjZhNiJ9.j_BR9FfbD3GPhM_quWMp-cnRrbq6XA2-Dh4cSKdYoBk4SqKrjPmFBjqC-UvSW4BlC1wwI0KY0vm08vmCRtkIAg';

try {
  const db = createClient({ url, authToken: token });
  const r = await db.execute('select id, email, role, approved, blocked from profiles');
  console.log('PROFILES:');
  console.log(JSON.stringify(r.rows, null, 2));
} catch (e) {
  console.error(e);
}
