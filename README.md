# 🎵 SoundWave Müzik (YouTube Music & Spotify Alternatifi)

Dünya çapındaki tüm müzikleri **tamamen reklamsız** arayabileceğiniz, yüksek kalitede dinleyebileceğiniz ve **çevrimdışı dinlemek için indirebileceğiniz** modern React Native (Expo) müzik uygulaması.

---

## ✨ Özellikler

1. **🌍 Sınırsız & Dünya Çapında Katalog:**
   - YouTube Music / Invidious API motoru sayesinde dünyadaki tüm şarkıcılar, parçalar, albümler ve remiksler anında aranabilir.
2. **🚫 %100 Reklamsız:**
   - Şarkı başı veya ortası reklamları tamamen engellenmiştir; doğrudan saf ses akışı (`m4a` / `aac`) oynatılır.
3. **📥 İndirme & Çevrimdışı (Offline) Dinleme:**
   - Şarkıları tek tıkla telefonun yerel hafızasına (`FileSystem`) indirir.
   - İnternetiniz olmadığında veya uçak modundayken **"İndirilenler"** sekmesinden internetsiz dinleyebilirsiniz.
4. **🎨 Modern Koyu Arayüz (Dark Mode):**
   - Spotify & Apple Music esintili arayüz.
   - Kategori filtreleri (Trendler, Türkçe Pop, Türkçe Rap, Rock, Lo-Fi...).
   - Mini Player ve tam ekran oynatıcı (albüm kapağı, seekbar, süre, sonraki/önceki parça).
5. **⚡ Arka Planda Çalma:**
   - Uygulamayı alta alsanız bile müzik çalmaya devam eder.

---

## 🚀 Nasıl Çalıştırılır?

### 1. Seçenek: Bilgisayar Açıkken Farklı İnternet Ağlarından Bağlanma (Tunnel Modu)
Klasör içindeki `start-tunnel.bat` dosyasına çift tıklayın veya terminalde şu komutu çalıştırın:
```bash
npx expo start --tunnel
```
- Ekrana gelen QR kodu **Expo Go** uygulaması ile taratın.
- Telefonunuz ve bilgisayarınız **farklı ağlarda olsa bile (mobil veri / 4.5G)** uygulama açılacaktır.

---

### 2. Seçenek: Bilgisayar Kapalıyken 7/24 Expo Go ile Çalıştırma (Expo Snack)
Expo Go, normalde bilgisayarınızdaki yerel geliştirme sunucusuna (`Metro`) bağlanır. Bilgisayarınızı kapattığınızda sunucu kapanacağı için Expo Go hata verir.

**Bilgisayarınız kapalıyken de Expo Go'da 7/24 çalışması için:**
1. [snack.expo.dev](https://snack.expo.dev) adresini açın.
2. `App.js`, `src/services/` ve `src/components/` klasörlerindeki dosyaları Snack editörüne yapıştırın.
3. Sağ üstteki **"Run"** butonuna basıp **"My Device"** sekmesini seçin.
4. Expo'nun bulut sunucusunun ürettiği kalıcı QR kodu telefonunuza taratın.
5. Bu QR kod bilgisayarınız kapalı olsa dahi 7/24 çalışmaya devam eder!

---

### 3. Seçenek: Bağımsız Android APK Oluşturma (Kalıcı ve En İyi Çözüm)
Uygulamayı Expo Go'ya veya bilgisayara hiç ihtiyaç duymadan, normal bir uygulama (Spotify gibi) olarak telefonunuza yüklemek için:
```bash
npx eas-cli build -p android --profile preview
```
İşlem bittiğinde verilen indirme bağlantısından `.apk` dosyasını telefonunuza yükleyip sonsuza kadar kullanabilirsiniz.
