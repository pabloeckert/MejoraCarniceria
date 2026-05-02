# 📦 Guía de Instalación

## Instalación Rápida (Usuarios Finales)

### Windows

1. Descargá `installer/windows/Instala-MejoraCarniceria.exe`
2. Doble click → Seguir el asistente
3. ¡Listo! Acceso directo en Escritorio y Menú Inicio

**Qué hace el instalador:**
- Instala en `C:\Program Files\MejoraCarniceria\`
- Crea acceso directo en Escritorio
- Crea carpeta en Menú Inicio → Programas
- Registra en "Agregar o quitar programas" (desinstalable)
- Lanza la app con doble click

### Android

1. Descargá `installer/android/MejoraCarniceria.apk`
2. Abrí el archivo desde tu gestor de archivos
3. Si pide permiso → Activar "Fuentes desconocidas"
4. Instalar
5. ¡Listo! Ícono en pantalla de inicio

**Nota:** No necesitás Play Store. Es una app independiente.

---

## Instalación desde Código Fuente (Desarrollo)

### Prerrequisitos

- **Node.js** 18+ (https://nodejs.org)
- **npm** 9+ (viene con Node.js)
- **Git** (https://git-scm.com)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd MejoraCarniceria

# 2. Instalar dependencias
npm install

# 3. Iniciar la app
npm start

# 4. Abrir en el navegador
# http://localhost:3000
```

### Modo desarrollo (con auto-reload)

```bash
# Instalar nodemon globalmente (opcional)
npm install -g nodemon

# Iniciar con auto-reload
npx nodemon src/backend/server.js
```

---

## Generar Instaladores

### Prerrequisitos para build

```bash
# Dependencias del proyecto
npm install
```

### Instalador Windows (.exe)

```bash
npm run build:windows-installer
```

**Requisitos adicionales:**
- Windows o Linux con Wine
- El script usa electron-builder (se instala con npm install)

**Salida:** `installer/windows/Instala-MejoraCarniceria.exe`

### APK Android (.apk)

```bash
npm run build:android-apk
```

**Requisitos adicionales:**
- Java JDK 17+
- Android SDK (Android Studio o command-line tools)
- Bubblewrap CLI: `npm install -g @aspect-build/aspect-cli`
- Variable de entorno `ANDROID_HOME` configurada

**Salida:** `installer/android/MejoraCarniceria.apk`

### Ambos

```bash
npm run build:all
```

---

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 3000 | Puerto del servidor (desarrollo) |
| `NODE_ENV` | development | Modo de ejecución |

---

## Troubleshooting

### "Puerto ya en uso"
```bash
# Cambiar puerto
PORT=3001 npm start
```

### "Error al instalar better-sqlite3"
```bash
# En Linux, instalar build tools
sudo apt install build-essential python3

# En macOS
xcode-select --install

# Reinstalar
npm rebuild better-sqlite3
```

### "La app no carga en el navegador"
- Verificar que el servidor está corriendo
- Verificar que no hay otro servicio en el puerto 3000
- Probar http://127.0.0.1:3000

### "Se perdieron los datos"
- Los datos están en `data/carniceria.db`
- Hacer backup periódicamente de ese archivo
- Si se borra, la app crea una nueva base de datos con datos de ejemplo

---

## Desinstalación

### Windows
1. Panel de control → Agregar o quitar programas
2. Buscar "MejoraCarniceria"
3. Desinstalar

### Android
1. Mantener presionado el ícono
2. Desinstalar
3. O: Ajustes → Apps → MejoraCarniceria → Desinstalar

### Código fuente
```bash
rm -rf MejoraCarniceria/
```
