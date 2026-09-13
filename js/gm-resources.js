import { backendConfigured } from './config.js';

const feed = document.querySelector('#liveFeed');
const buttons = document.querySelectorAll('button');

if (!backendConfigured()) {
  if (feed) feed.textContent = 'Canlı veritabanı henüz bağlanmadı. Sayfa hazır; Supabase bağlantısından sonra eşya, Glif ve Focus işlemleri burada çalışacak.';
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (feed) feed.textContent = 'Bu işlem canlı veritabanı bağlandıktan sonra aktif olacak.';
    });
  });
}
