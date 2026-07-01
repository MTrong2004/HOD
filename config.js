// ===== SUPABASE CONFIG =====
// Sau này đổi Supabase thì chỉ sửa file này.
window.APP_CONFIG = {
  USE_TURSO_API: true,
  SUPABASE_URL: 'https://kxyukiwhhorvxgxxxmfq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f',
  get LOGIN_NOTIFY_ENDPOINT() {
    return (this.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/login-notify';
  },

  // Discord webhook: KHÔNG đặt ở đây nữa (client-side thì ai cũng xem được).
  // Đã chuyển sang biến môi trường DISCORD_WEBHOOK_URL, xử lý trong api/index.js (path /api/notify).

  // ===== CLOUDINARY CONFIG =====
  // Đổi Cloudinary thì chỉ sửa các dòng dưới đây.
  CLOUDINARY_CLOUD_NAME: 'ddc4uvm7m',
  CLOUDINARY_UPLOAD_PRESET: 'learninghub_unsigned',
  CLOUDINARY_UPLOAD_FOLDER: 'learninghub/questions',
  CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload'
};
// ===== END SUPABASE CONFIG =====
