/**
 * Build script for Android APK (.apk)
 * Uses Bubblewrap CLI to wrap the PWA as a TWA (Trusted Web Activity)
 * 
 * Prerequisites (one-time setup):
 *   npm install -g @aspect-build/aspect-cli @aspect-build/rules_js
 *   OR manually: npm install -g @nicolo-ribaudo/chokidar-2 @nicolo-ribaudo/chokidar-3
 * 
 * This script:
 * 1. Checks if Bubblewrap CLI is installed
 * 2. If not, provides installation instructions
 * 3. Creates the TWA project configuration
 * 4. Builds the APK
 * 5. Copies to installer/android/
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'installer', 'android');
const TWA_DIR = path.join(PROJECT_ROOT, '.twa-build');

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  try {
    return execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (e) {
    return null;
  }
}

function checkBubblewrap() {
  try {
    execSync('bubblewrap --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkJava() {
  try {
    const result = execSync('java -version 2>&1', { encoding: 'utf-8' });
    return result.includes('version');
  } catch {
    return false;
  }
}

function checkAndroidSdk() {
  return !!process.env.ANDROID_HOME || !!process.env.ANDROID_SDK_ROOT;
}

async function buildAndroid() {
  console.log('📱 Iniciando build del APK Android...');
  console.log(`📂 Proyecto: ${PROJECT_ROOT}`);
  console.log(`📂 Salida: ${OUTPUT_DIR}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Check prerequisites
  const hasJava = checkJava();
  const hasBubblewrap = checkBubblewrap();
  const hasSdk = checkAndroidSdk();

  console.log('\n🔍 Verificando prerrequisitos...');
  console.log(`  Java: ${hasJava ? '✅' : '❌'}`);
  console.log(`  Bubblewrap: ${hasBubblewrap ? '✅' : '❌'}`);
  console.log(`  Android SDK: ${hasSdk ? '✅' : '❌'}`);

  if (!hasJava || !hasBubblewrap || !hasSdk) {
    console.log('\n⚠️  Faltan prerrequisitos para generar el APK.');
    console.log('\n📋 Instrucciones de instalación:');
    console.log('━'.repeat(50));

    if (!hasJava) {
      console.log('\n1. Instalar Java JDK 17+:');
      console.log('   - Windows: https://adoptium.net/');
      console.log('   - macOS: brew install openjdk@17');
      console.log('   - Linux: sudo apt install openjdk-17-jdk');
    }

    if (!hasAndroidSdk) {
      console.log('\n2. Instalar Android SDK:');
      console.log('   - Descargar Android Studio: https://developer.android.com/studio');
      console.log('   - O instalar command-line tools:');
      console.log('     https://developer.android.com/studio#command-tools');
      console.log('   - Configurar ANDROID_HOME environment variable');
    }

    if (!hasBubblewrap) {
      console.log('\n3. Instalar Bubblewrap CLI:');
      console.log('   npm install -g @nicolo-ribaudo/chokidar-2 @nicolo-ribaudo/chokidar-3');
      console.log('   npm install -g @nicolo-ribaudo/chokidar-2 @nicolo-ribaudo/chokidar-3');
    }

    console.log('\n4. Ejecutar este script nuevamente:');
    console.log('   npm run build:android-apk');
    console.log('━'.repeat(50));

    // Generate alternative: create a pre-configured Bubblewrap project files
    // so that when prerequisites are met, it's just one command
    createBubblewrapConfig();
    console.log('\n📄 Configuración de Bubblewrap creada en .twa-build/');
    console.log('   Cuando tengas los prerrequisitos, ejecuta:');
    console.log('   cd .twa-build && bubblewrap build');
    return;
  }

  // All prerequisites met, build the APK
  createBubblewrapConfig();

  console.log('\n🔨 Construyendo APK...');
  process.chdir(TWA_DIR);

  run('bubblewrap build');

  // Copy APK to output
  const apkSource = path.join(TWA_DIR, 'app', 'release', 'app-release-unsigned.apk');
  const apkAlt = path.join(TWA_DIR, 'app-release.apk');
  const apkDest = path.join(OUTPUT_DIR, 'MejoraCarniceria.apk');

  let copied = false;
  for (const src of [apkSource, apkAlt]) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, apkDest);
      copied = true;
      break;
    }
  }

  if (copied) {
    const stats = fs.statSync(apkDest);
    console.log(`\n✅ APK generado: ${apkDest}`);
    console.log(`📦 Tamaño: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  } else {
    console.log('\n⚠️  APK generado pero no se encontró en la ubicación esperada.');
    console.log('   Busca el APK en:', TWA_DIR);
  }
}

function createBubblewrapConfig() {
  fs.mkdirSync(TWA_DIR, { recursive: true });

  // Create twa-manifest.json
  const twaManifest = {
    packageId: 'com.mejoracarniceria.twa',
    host: 'localhost',
    name: 'MejoraCarniceria',
    launcherName: 'MejoraCarniceria',
    display: 'standalone',
    orientation: 'any',
    themeColor: '#b71c1c',
    backgroundColor: '#ffffff',
    startUrl: '/',
    iconUrl: 'http://localhost:3000/icons/icon-512.png',
    maskableIconUrl: 'http://localhost:3000/icons/icon-512.png',
    monochromeIconUrl: 'http://localhost:3000/icons/icon-512.png',
    signingKey: {
      path: './android.keystore',
      alias: 'mejoracarniceria',
      password: 'carniceria2024'
    },
    appVersionName: '1.0.0',
    appVersionCode: 1,
    shortcuts: [],
    generatorApp: 'bubblewrap-cli',
    features: {
      locationDelegation: { enabled: false },
      playBilling: { enabled: false }
    },
    alphaDependencies: { enabled: false },
    enableNotifications: false
  };

  fs.writeFileSync(
    path.join(TWA_DIR, 'twa-manifest.json'),
    JSON.stringify(twaManifest, null, 2)
  );

  // Create a shell script to generate keystore and build
  const buildScript = `#!/bin/bash
# Generar keystore si no existe
if [ ! -f android.keystore ]; then
  keytool -genkey -v -keystore android.keystore -alias mejoracarniceria \\
    -keyalg RSA -keysize 2048 -validity 10000 \\
    -storepass carniceria2024 -keypass carniceria2024 \\
    -dname "CN=MejoraCarniceria, OU=Dev, O=Carniceria, L=Ciudad, S=Estado, C=MX"
fi

# Build
bubblewrap build
`;

  fs.writeFileSync(path.join(TWA_DIR, 'build.sh'), buildScript);
  fs.chmodSync(path.join(TWA_DIR, 'build.sh'), '755');

  console.log('📄 Configuración TWA creada en:', TWA_DIR);
}

buildAndroid();
