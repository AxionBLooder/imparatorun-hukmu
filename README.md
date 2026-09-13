# İmparatorun Hükmü

Canlı GM ↔ oyuncu senkronizasyonu için hazırlanmış FRP yardımcı uygulaması.

## Bölümler

- `index.html` — ana portal
- `gm/karakterler.html` — yalnızca karakter oluşturma ve karakter temel bilgileri
- `gm/esya-glif.html` — yalnızca eşya, Glif, Focus ve kapasite yönetimi
- `oyuncu/index.html` — oyuncunun kendi canlı karakter kağıdı
- `assets/style.css` — bütün sayfaların ortak görünümü
- `js/config.js` — merkezi PUBLIC bağlantı ayarları
- `js/gm-resources.js` — GM kaynak sayfası davranışları
- `js/player-sheet.js` — oyuncu kağıdı davranışları

## Güvenli geliştirme kuralları

1. Çalışan sayfaya yeni özelliği doğrudan gömmek yerine ilgili JS/CSS modülüne ekle.
2. Aynı veriyi birden fazla sayfada ayrı ayrı hesaplama; ortak veri servisinden geçir.
3. Supabase `service_role` veya secret key hiçbir zaman GitHub'a ya da tarayıcı koduna konmaz.
4. Oyuncu erişimi RLS ile yalnızca kendi karakteriyle sınırlandırılır.
5. Veritabanı şema değişiklikleri numaralı migration dosyalarıyla yapılır; eski migration değiştirilmez.
6. Büyük değişikliklerden önce çalışan sürüm commit olarak korunur. Gerekirse önceki commit'e dönülür.
7. GM karakter oluşturucu ile eşya/Glif yönetimi ayrı sayfalar olarak kalır.
8. Oyuncu sayfasında GM'ye özel bilgi gösterilmez.

## Canlı sistem planı

Supabase bağlantısı tamamlandığında:

- GM karakter oluşturur ve oyuncuya bağlar.
- GM eşya verdiğinde oyuncu ekranına canlı düşer.
- GM yeni Glif öğrettiğinde `Bilinen Glifler` listesi canlı güncellenir.
- `Hazır Glif / Maksimum Glif Kapasitesi` ayrı takip edilir.
- Oyuncu Focus veya tüketilebilir kullandığında GM tarafında da güncellenir.
- Oyuncular birbirlerinin karakterlerine erişemez.

Şu an ön yüz iskeleti güvenli `backend bekleniyor` modundadır. Supabase projesi bağlandığında canlı veri katmanı aktive edilecektir.
