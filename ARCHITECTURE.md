# 🏗️ Arquitectura de MejoraCarniceria

## Visión General

MejoraCarniceria es una aplicación web progresiva (PWA) empaquetada como aplicación de escritorio y móvil. Usa una arquitectura cliente-servidor local donde tanto el backend como el frontend corren en el mismo dispositivo del usuario.

```
┌─────────────────────────────────────────────┐
│              Dispositivo del Usuario         │
│                                              │
│  ┌──────────┐     ┌──────────────────────┐  │
│  │ Frontend │◄───►│   Backend (Express)  │  │
│  │  (PWA)   │ API │   Puerto 3000/3847   │  │
│  └──────────┘     └──────────┬───────────┘  │
│                              │               │
│                    ┌─────────▼─────────┐    │
│                    │   SQLite (data/)   │    │
│                    │   carniceria.db    │    │
│                    └───────────────────┘    │
└─────────────────────────────────────────────┘
```

## Componentes

### 1. Backend (`src/backend/server.js`)

**Tecnología:** Node.js + Express.js

**Responsabilidades:**
- Servir la API REST
- Servir los archivos estáticos del frontend
- Gestionar la base de datos SQLite
- Implementar la lógica de negocio

**Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar productos (con filtros) |
| GET | `/api/productos/:id` | Obtener producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto (soft delete) |
| GET | `/api/ventas` | Listar ventas |
| POST | `/api/ventas` | Registrar venta |
| POST | `/api/ventas/:id/anular` | Anular venta |
| GET | `/api/dashboard` | Resumen del día |
| GET | `/api/gastos` | Listar gastos |
| POST | `/api/gastos` | Registrar gasto |
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/clientes` | Registrar cliente |

**Dependencias:**
- `express` - Framework web
- `better-sqlite3` - Base de datos SQLite
- `compression` - Compresión HTTP (gzip)
- `helmet` - Headers de seguridad
- `uuid` - Generación de IDs únicos

### 2. Frontend (`src/frontend/`)

**Tecnología:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks)

**Archivos:**
- `index.html` - Estructura SPA (Single Page Application)
- `css/style.css` - Estilos responsive
- `js/app.js` - Lógica de la aplicación
- `manifest.json` - Configuración PWA
- `sw.js` - Service Worker (offline)
- `icons/` - Iconos de la app

**Características:**
- SPA con navegación por JavaScript
- Responsive (mobile-first)
- Offline-first con Service Worker
- Instalable como PWA

### 3. Electron Wrapper (`electron/main.js`)

**Tecnología:** Electron

**Responsabilidades:**
- Iniciar el servidor Express internamente
- Mostrar la app en una ventana nativa
- Crear menús de aplicación
- Manejar el ciclo de vida de la app

**Puerto:** 3847 (diferente al desarrollo para evitar conflictos)

### 4. Database Schema

```sql
-- Productos del inventario
CREATE TABLE productos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  precio_venta REAL NOT NULL DEFAULT 0,
  precio_compra REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  unidad TEXT DEFAULT 'kg',
  codigo_barras TEXT,
  activo INTEGER DEFAULT 1,
  creado TEXT DEFAULT (datetime('now')),
  actualizado TEXT DEFAULT (datetime('now'))
);

-- Ventas realizadas
CREATE TABLE ventas (
  id TEXT PRIMARY KEY,
  fecha TEXT DEFAULT (datetime('now')),
  total REAL NOT NULL DEFAULT 0,
  metodo_pago TEXT DEFAULT 'efectivo',
  cliente TEXT,
  notas TEXT,
  anulada INTEGER DEFAULT 0
);

-- Items de cada venta
CREATE TABLE venta_items (
  id TEXT PRIMARY KEY,
  venta_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad REAL NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Gastos operativos
CREATE TABLE gastos (
  id TEXT PRIMARY KEY,
  fecha TEXT DEFAULT (datetime('now')),
  descripcion TEXT NOT NULL,
  monto REAL NOT NULL,
  categoria TEXT DEFAULT 'general'
);

-- Clientes
CREATE TABLE clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  deuda REAL DEFAULT 0,
  creado TEXT DEFAULT (datetime('now'))
);
```

### 5. Service Worker Strategy

```
Request → ¿Es /api/*?
  ├─ Sí → Network First → Cache fallback
  └─ No → Cache First → Network fallback
```

**Cache Name:** `carniceria-v1`

**Cached Assets:**
- `/` (index.html)
- `/css/style.css`
- `/js/app.js`
- `/manifest.json`
- `/icons/icon-192.png`
- `/icons/icon-512.png`

## Flujo de Datos

### Registrar una venta

```
Usuario → Frontend → POST /api/ventas → Backend
  1. Validar items
  2. Calcular total
  3. Iniciar transacción
  4. Insertar venta
  5. Insertar venta_items
  6. Actualizar stock de cada producto
  7. Commit transacción
  8. Respuesta al frontend
```

## Decisiones de Diseño

| Decisión | Razón |
|----------|-------|
| SQLite | Sin dependencia de servidor de BD, portable, file-based |
| Express | Minimal, bien documentado, ecosistema maduro |
| Vanilla JS | Sin build step, sin frameworks, carga rápida |
| PWA | Offline support, instalable, sin Play Store |
| Electron | App nativa en Windows sin reescribir |
| TWA (Bubblewrap) | APK rápido sin Android Studio |
| UUID como PK | Evitar conflictos en sync futuro |
| Soft delete | Preservar historial de ventas |

## Seguridad

- **helmet** para headers HTTP seguros
- **compression** para reducir tamaño de respuestas
- Rate limiting disponible (configurable)
- No hay autenticación (single-user, local only)
- Datos nunca salen del dispositivo

## Performance

- SQLite con WAL mode para lecturas concurrentes
- Compression gzip en respuestas HTTP
- Service Worker para cache de assets
- Lazy loading de páginas (solo la activa está en DOM)
- Transacciones SQLite para operaciones atómicas
