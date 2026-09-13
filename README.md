# İmparatorun Hükmü

Canlı GM ↔ oyuncu senkronizasyonlu FRP yardımcı uygulaması.

## Aktif bölümler

- `index.html` — ana portal
- `gm/giris.html` — yalnızca GM için e-posta bağlantılı giriş
- `gm/karakterler.html` — karakter oluşturma, yeterlilikler, ırk seçimi, oyuncu daveti
- `gm/esya-glif.html` — eşya, Glif, Focus ve Glif kapasitesi verme
- `gm/envanter.html` — tüm oyuncuları 1, 2, 3… şeklinde görüp envanter/Glif yönetme
- `oyuncu/index.html` — oyuncunun yalnızca kendi karakterini gördüğü canlı karakter kağıdı
- `js/player-sheet.js` — oyuncu canlı kaynak işlemleri
- `js/gm-inventory.js` — GM oyuncu envanteri işlemleri
- `assets/style.css` — ortak tasarım

## Canlı sistem

Supabase projesi: **İmparatorun Hükmü**. Karakter, Focus, Yara, Hazır Glif kapasitesi, envanter ve bilinen Glif verileri Supabase'de tutulur. Realtime açıktır; GM veya oyuncu bir değer değiştirdiğinde diğer açık ekranlar otomatik güncellenir.

Oyuncu tüketilebilir eşyalarında yalnızca mevcut adedi `- / +` ile değiştirebilir. Eşya adı, açıklaması veya maksimum adedi oyuncu tarafından değiştirilemez. Focus, Yara ve Hazır Glif canlı değerleri de kendi sınırları içinde takip edilir.

## Davet güvenliği

Oyuncu kaydı açık bir kayıt formuyla yapılmaz. GM, Karakter Oluşturucu içindeki **Oyuncuya Davet Gönder** düğmesini kullanır. Davet Supabase Edge Function üzerinden gönderilir ve fonksiyon çağıranın GM olduğunu doğrular. Davetsiz hesaplar karakter verisine erişemez. RLS tüm oyuncu verisini karakter sahibine göre sınırlar.

## Kod güvenliği

- Secret/service-role anahtarları GitHub'a veya tarayıcı koduna yazılmaz.
- Public Supabase istemcisi `client-bootstrap` Edge Function üzerinden yüklenir.
- Karakter, Eşya & Glif ve Oyuncu Envanteri birbirinden ayrı modüllerdir.
- Veritabanı değişiklikleri migration olarak tutulur; çalışan şema geriye dönük izlenebilir.
- Supabase Security Advisor şu anda uyarısızdır.

## İlk yayın için iki ayar

1. GitHub repository `Settings → Pages` bölümünde `Deploy from a branch`, `main`, `/ (root)` seçilip kaydedilir.
2. Supabase `Authentication → URL Configuration` içinde Site URL `https://axionblooder.github.io/imparatorun-hukmu/` yapılır. Redirect URLs listesine şu iki adres eklenir:
   - `https://axionblooder.github.io/imparatorun-hukmu/gm/karakterler.html`
   - `https://axionblooder.github.io/imparatorun-hukmu/oyuncu/index.html`

Bu iki ayardan sonra GM girişi, oyuncu daveti ve canlı senkronizasyon production URL üzerinde çalışır.
