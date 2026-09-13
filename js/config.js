// İmparatorun Hükmü — tek merkezli istemci ayarları.
// Supabase projesi bağlandığında yalnızca bu dosyadaki iki PUBLIC değer güncellenecek.
// service_role / secret key ASLA buraya konmaz.
export const APP_CONFIG = Object.freeze({
  appName: 'İmparatorun Hükmü',
  schemaVersion: 1,
  supabaseUrl: '',
  supabasePublishableKey: '',
  supabaseJsVersion: '2.116.0'
});

export function backendConfigured() {
  return Boolean(APP_CONFIG.supabaseUrl && APP_CONFIG.supabasePublishableKey);
}
