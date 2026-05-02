/**
 * Build script for Windows Installer (.exe)
 * Uses electron-builder with NSIS to create:
 * - Instala-MejoraCarniceria.exe
 * - Creates desktop shortcut, start menu, program files installation
 * - Registers as Windows program (Add/Remove Programs)
 */

const builder = require('electron-builder');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'installer', 'windows');

async function buildWindows() {
  console.log('🔨 Iniciando build del instalador Windows...');
  console.log(`📂 Proyecto: ${PROJECT_ROOT}`);
  console.log(`📂 Salida: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Create a minimal package.json for electron-builder in a temp build dir
  const buildDir = path.join(PROJECT_ROOT, '.electron-build');
  fs.mkdirSync(buildDir, { recursive: true });

  // Copy electron main process
  const electronMain = path.join(PROJECT_ROOT, 'electron', 'main.js');
  const buildMain = path.join(buildDir, 'main.js');
  fs.copyFileSync(electronMain, buildMain);

  // Copy frontend and backend
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(path.join(PROJECT_ROOT, 'src'), path.join(buildDir, 'src'));
  fs.mkdirSync(path.join(buildDir, 'data'), { recursive: true });

  // Write build package.json
  const buildPackageJson = {
    name: 'mejora-carniceria',
    version: '1.0.0',
    description: 'Sistema de gestión para carnicerías',
    main: 'main.js',
    author: 'MejoraCarniceria',
    license: 'MIT',
    dependencies: {
      'better-sqlite3': '^11.0.0',
      'compression': '^1.7.4',
      'express': '^4.21.0',
      'helmet': '^8.0.0',
      'uuid': '^10.0.0'
    }
  };

  fs.writeFileSync(path.join(buildDir, 'package.json'), JSON.stringify(buildPackageJson, null, 2));

  try {
    const result = await builder.build({
      projectDir: buildDir,
      targets: builder.Platform.WINDOWS.createTarget(),
      config: {
        appId: 'com.mejoracarniceria.app',
        productName: 'MejoraCarniceria',
        directories: {
          output: OUTPUT_DIR
        },
        files: [
          '**/*',
          '!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,LICENSE,license,License}',
          '!**/node_modules/*/{test,tests,powered-test,example,examples}',
          '!**/node_modules/.cache/**'
        ],
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            }
          ],
          icon: path.join(PROJECT_ROOT, 'src', 'frontend', 'icons', 'icon-512.png'),
          artifactName: 'Instala-MejoraCarniceria.${ext}'
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: false,
          installerIcon: path.join(PROJECT_ROOT, 'src', 'frontend', 'icons', 'icon-512.png'),
          uninstallerIcon: path.join(PROJECT_ROOT, 'src', 'frontend', 'icons', 'icon-512.png'),
          installerHeaderIcon: path.join(PROJECT_ROOT, 'src', 'frontend', 'icons', 'icon-512.png'),
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'MejoraCarniceria',
          createQuickLaunchShortcut: false,
          uninstallDisplayName: 'MejoraCarniceria',
          license: null,
          allowElevation: true,
          installerLanguages: ['Spanish'],
          language: '1034',
          artifactName: 'Instala-MejoraCarniceria.${ext}'
        },
        extraResources: [],
        compression: 'maximum',
        asar: true
      }
    });

    console.log('✅ Build Windows completado!');
    console.log(`📦 Instalador en: ${OUTPUT_DIR}`);

    // List output files
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(f => {
      const stats = fs.statSync(path.join(OUTPUT_DIR, f));
      console.log(`  📄 ${f} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    });

  } catch (error) {
    console.error('❌ Error en build Windows:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup build dir
    try {
      fs.rmSync(buildDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

buildWindows();
