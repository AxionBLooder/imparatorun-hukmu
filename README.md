# İmparatorun Hükmü

GM ↔ oyuncu senkronizasyonu hedefleyen FRP yardımcı uygulaması. Canlı servis devre dışıyken aşağıdaki yerel çalışma alanı kullanılabilir.

## GM çalışma alanı (Supabase kapalıyken)

`gm/taslak.html` adresindeki **GM Çalışma Alanı**, mevcut canlı GM API'sinden tamamen bağımsız bir geliştirme/deneme ortamıdır. E-posta ve özel GM anahtarı istemez. Burada karakter oluşturabilir, Kök/Kombine/Özel Glifleri kütüphaneye ekleyebilir, oyuncuya Glif verebilir veya kaldırabilir, envanter ve Focus/Yara/Hazır Glif değerlerini değiştirebilirsin.

- Her işlem için kategori, zaman, hedef ve işlem açıklamasını içeren log oluşturulur. Arama, kategori filtresi ve tek kayıt silme vardır. Silinen kayıt normal listeden gizlenir; silme hareketi yeni bir sistem kaydı olarak tutulur.
- Taslak veriler sadece tarayıcının `localStorage` alanında tutulur. Aynı siteyi aynı cihazda açan sekmeler `storage`/`BroadcastChannel` ile güncellenir. **Farklı kullanıcılar veya cihazlar arasında henüz paylaşılmaz.**
- Bu ortam gerçek karakter, Glif, envanter veya oyuncu hesaplarını değiştirmez. Gerçek GM erişimi hâlâ sunucunun doğruladığı özel GM anahtarını gerektirir. Taslak, canlı GM yetkisini baypas etmez.
- Supabase yeniden etkinleştirildiğinde çok oyunculu log için sunucuda kalıcı bir olay tablosu, kimliği doğrulanmış yazarlar, yetkili silme, RLS ve Realtime yayını gerekecektir. Tarayıcı loglarını doğrudan güvenilir sunucu logu olarak kabul etme.

### Log olaylarının gelecekteki sunucu biçimi

Taslak işlemlerini canlı tarafa geçirirken her olayda benzersiz kayıt kimliği, `created_at`, doğrulanmış `actor_id`, karakter/Glif/eşya gibi hedef bilgisi, kategori, işlem türü ve açıklama tutulmalıdır. Kaydı silme işlemi fiziksel olarak yok etmek yerine `deleted_at` işaretlemeli ve ayrıca `log.delete` olayı üretmelidir. Sunucu yazımı başarılı olmadan arayüz işlemi başarıyla kaydedildi dememelidir. GM ve oyuncular yalnızca RLS ile izin verilen kayıtları görmelidir.

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
