// upload-to-snack.js - Deploys SoundWave to Expo Snack cloud & generates 24/7 QR Code
const fs = require('fs');
const path = require('path');
const { Snack } = require('snack-sdk');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

async function main() {
  console.log('🚀 SoundWave Müzik Uygulaması Expo Snack Bulutuna Güncelleniyor...');

  const baseDir = __dirname;
  const filePaths = [
    'App.js',
    'src/services/musicApi.js',
    'src/services/downloadManager.js',
    'src/services/playerContext.js',
    'src/components/TrackCard.js',
    'src/components/MiniPlayer.js',
    'src/components/PlayerModal.js',
    'src/components/OfflineLibrary.js'
  ];

  const files = {};
  for (const relPath of filePaths) {
    const fullPath = path.join(baseDir, relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Hata: ${relPath} dosyası bulunamadı!`);
      process.exit(1);
    }
    const contents = fs.readFileSync(fullPath, 'utf8');
    files[relPath] = {
      type: 'CODE',
      contents
    };
  }

  // Also include standard package.json for Snack package resolver
  files['package.json'] = {
    type: 'CODE',
    contents: JSON.stringify({
      dependencies: {
        'expo-av': '~15.0.2',
        'expo-file-system': '~18.0.12',
        '@react-native-async-storage/async-storage': '1.23.1',
        '@expo/vector-icons': '~14.0.4'
      }
    }, null, 2)
  };

  const snack = new Snack({
    name: 'SoundWave Müzik',
    description: 'Dünya çapında tüm müzikler, tamamen reklamsız ve çevrimdışı indirme desteğiyle',
    sdkVersion: '52.0.0',
    files,
    dependencies: {
      'expo-av': { version: '~15.0.2' },
      'expo-file-system': { version: '~18.0.12' },
      '@react-native-async-storage/async-storage': { version: '1.23.1' },
      '@expo/vector-icons': { version: '~14.0.4' }
    }
  });

  const stateDeps = snack.getState().dependencies;
  console.log('📦 Paket bağımlılıkları doğrulandı:', JSON.stringify(stateDeps, null, 2));

  try {
    console.log('📡 Expo Snack sunucusuna kaydediliyor...');
    const result = await snack.saveAsync();

    const snackUrl = `https://snack.expo.dev/${result.id}`;
    const snackId = result.id;
    const runtimeUrl = result.url;

    console.log('\n======================================================');
    console.log('✅ UYGULAMA BULUTA BAŞARIYLA GÜNCELLENDİ!');
    console.log('======================================================');
    console.log('🌐 Snack Web Linki:   ', snackUrl);
    console.log('📱 Expo Go Runtime:   ', runtimeUrl);
    console.log('🔑 Snack ID / Hash:   ', snackId);

    // Save QR Code pointing to runtimeUrl (Expo Go deep link)
    const qrFilePath = path.join(baseDir, 'snack-qr.png');
    await QRCode.toFile(qrFilePath, runtimeUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('\n🖼️  QR Kod Görseli kaydedildi: ', qrFilePath);
    console.log('\n📱 EXPO GO İLE TARATABİLECEĞİNİZ YENİ QR KOD (7/24 Kesintisiz):');
    console.log('------------------------------------------------------');
    qrcodeTerminal.generate(runtimeUrl, { small: true });
    console.log('------------------------------------------------------');
    console.log('Bu QR kod bilgisayarınız kapalıyken de Expo Go ile çalışır!\n');

    fs.writeFileSync(
      path.join(baseDir, 'snack-info.json'),
      JSON.stringify({ snackUrl, snackId, runtimeUrl, qrFilePath }, null, 2)
    );
  } catch (err) {
    console.error('❌ Snack yükleme hatası:', err);
    process.exit(1);
  }
}

main();
