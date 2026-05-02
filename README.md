# 🥩 MejoraCarniceria

**Sistema de gestión para carnicerías que funciona sin internet, sin navegador y sin complicaciones.**

Instalalo en tu PC o celular y empezá a usar. Sin configuraciones técnicas, sin suscripciones, sin vueltas.

---

## 📱 Instalación

### En Windows (PC)

1. Descargá `Instala-MejoraCarniceria.exe` de la carpeta `/installer/windows/`
2. Hacé doble click en el archivo
3. Seguí los pasos del instalador (aceptá los defaults)
4. ¡Listo! Se crea un acceso directo en el Escritorio y en el Menú Inicio

**Requisitos:**
- Windows 10 o superior
- 200 MB de espacio en disco

### En Android (Celular)

1. Descargá `MejoraCarniceria.apk` de la carpeta `/installer/android/`
2. Abrí el archivo desde tu gestor de archivos
3. Si pide permisos, activá "Instalar de fuentes desconocidas"
4. Aceptá la instalación
5. ¡Listo! Tenés el ícono en tu pantalla de inicio

**Requisitos:**
- Android 7.0 o superior
- 50 MB de espacio

### Desde el código fuente (desarrollo)

```bash
# Clonar el repo
git clone <url-del-repo>
cd MejoraCarniceria

# Instalar dependencias
npm install

# Iniciar el servidor
npm start

# Abrir en el navegador
# http://localhost:3000
```

---

## 🖥️ Uso

### Dashboard
Al abrir la app, ves el resumen del día:
- 💰 Total de ventas de hoy
- 📊 Ventas de la semana
- ⚠️ Productos con stock bajo
- 🏆 Los productos más vendidos

### Nueva Venta
1. Tocá "💰 Nueva Venta" en el menú
2. Buscá el producto (escribí el nombre)
3. Tocá el producto para agregarlo al carrito
4. Ajustá la cantidad si necesitás
5. Seleccioná el método de pago
6. Tocá "✅ Cobrar"

### Productos
- Agregá productos nuevos con "+ Nuevo"
- Editá precios y stock tocando el ícono ✏️
- Filtrá por categoría (Res, Cerdo, Pollo, Embutidos)
- Buscá por nombre

### Historial
- Ver todas las ventas del día/semana/mes
- Filtrá por rango de fechas
- Cada venta muestra: monto, fecha, cliente, método de pago

### Gastos
- Registrá gastos del día (compra de mercadería, servicios, etc.)
- Llevá el control de cuánto gastás

### Clientes
- Registrá tus clientes frecuentes
- Guardá teléfono y dirección

---

## 📴 Modo Offline

La app funciona sin internet. Todos los datos se guardan en tu dispositivo:
- **PC:** Base de datos SQLite en la carpeta de instalación
- **Android:** Base de datos local en la app

Podés vender, agregar productos, ver historial... todo sin conexión.

---

## 🔧 Desarrollo

### Estructura del proyecto

```
MejoraCarniceria/
├── src/
│   ├── backend/          # Servidor Express + SQLite
│   │   └── server.js
│   └── frontend/         # PWA (HTML + CSS + JS)
│       ├── index.html
│       ├── manifest.json
│       ├── sw.js
│       ├── css/
│       ├── js/
│       └── icons/
├── electron/             # Wrapper para Windows
│   └── main.js
├── scripts/              # Scripts de build
│   ├── build-windows.js
│   └── build-android.js
├── installer/            # Instaladores generados
│   ├── windows/
│   └── android/
├── package.json
├── ARCHITECTURE.md
├── INSTALL.md
└── README.md
```

### Generar instaladores

```bash
# Instalar dependencias
npm install

# Instalador Windows (.exe)
npm run build:windows-installer

# APK Android (.apk)
npm run build:android-apk

# Ambos
npm run build:all
```

### Tecnologías

| Componente | Tecnología |
|------------|-----------|
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| PWA | Service Worker + Manifest |
| Windows | Electron + electron-builder (NSIS) |
| Android | Bubblewrap (TWA) |
| Offline | Cache-first strategy |

---

## 📸 Capturas de Pantalla

### Dashboard
```
┌──────────────────────────────────────┐
│  🥩 MejoraCarniceria                 │
├──────────────────────────────────────┤
│  📊 Resumen del Día                  │
│                                      │
│  ┌──────────┐ ┌──────────┐          │
│  │ Ventas   │ │ Semana   │          │
│  │ $2,450   │ │ $12,300  │          │
│  │ 8 ventas │ │ 42 ventas│          │
│  └──────────┘ └──────────┘          │
│                                      │
│  🏆 Más Vendidos                     │
│  1. Carne Molida    - 15 kg          │
│  2. Pollo Entero    - 12 piezas      │
│  3. Chuleta de Puerco - 8 kg         │
└──────────────────────────────────────┘
```

### Nueva Venta
```
┌──────────────────────────────────────┐
│  💰 Nueva Venta                      │
│  ┌────────────────────────────┐      │
│  │ 🔍 Buscar producto...      │      │
│  └────────────────────────────┘      │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Carne │ │Bistec│ │Chule-│        │
│  │Molida│ │      │ │ta    │        │
│  │$120  │ │$180  │ │$130  │        │
│  └──────┘ └──────┘ └──────┘        │
│                                      │
│  🛒 Carrito                          │
│  Carne Molida  1.5 kg  $180.00      │
│  Pollo Entero  2 pza  $130.00       │
│  ─────────────────────────────       │
│  Total: $310.00                      │
│  [💵 Efectivo] [✅ Cobrar]          │
└──────────────────────────────────────┘
```

---

## ❓ Preguntas Frecuentes

**¿Necesito internet para usar la app?**
No. Funciona 100% offline. Los datos se guardan en tu dispositivo.

**¿Pierdo mis datos si cierro la app?**
No. Los datos se guardan en una base de datos local. Se mantienen entre sesiones.

**¿Puedo usar la misma app en varios dispositivos?**
Cada dispositivo tiene su propia base de datos. No se sincronizan automáticamente.

**¿Cómo hago backup de mis datos?**
- **PC:** Copiá el archivo `data/carniceria.db` de la carpeta de instalación
- **Android:** Usá la función de exportar (próximamente)

**¿Funciona en Mac o Linux?**
El código fuente sí. Los instaladores pre-compilados son solo para Windows y Android.

---

## 📝 Licencia

MIT - Usalo como quieras.

---

## 🤝 Contribuir

1. Hacé fork del repo
2. Creá una branch (`git checkout -b mi-feature`)
3. Hacé commit (`git commit -m 'agregué X'`)
4. Push a la branch (`git push origin mi-feature`)
5. Abrí un Pull Request

---

**Hecho con 🥩 para carniceros, por carniceros.**
