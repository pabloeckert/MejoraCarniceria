# CTO Session State — MejoraCarniceria

> **Para retomar:** di "continuemos" y esta sesión sirve de contexto completo.
> Branch de trabajo: `claude/cto-analysis-framework-8nBX0`

---

## Estado del Proyecto (análisis CTO)

### Situación actual
MVP funcional de gestión para carnicería. Stack: Node.js + Express + SQLite + PWA Vanilla JS + Electron (Windows) + TWA (Android). ~2,600 líneas de código. Sin deuda técnica crítica, pero con brechas importantes de negocio.

### Brechas críticas identificadas
| Prioridad | Brecha | Impacto |
|-----------|--------|---------|
| P0 | Sin cierre de caja | El dueño no puede cuadrar el dinero al final del día |
| P0 | Sin reportes de negocio | No sabe si está ganando o perdiendo |
| P1 | Sin exportación de datos | Datos atrapados, riesgo de pérdida total |
| P1 | Sin alertas de stock bajo visibles | Puede quedarse sin mercancía sin darse cuenta |
| P2 | Sin autenticación | Cualquiera puede modificar/borrar datos |
| P2 | Sin backup automático | Un fallo de disco = pérdida total de historial |
| P3 | Sin gestión de proveedores | No puede rastrear a quién compra |
| P3 | Sin crédito de clientes | No puede manejar cuentas pendientes |
| P4 | Sin modo oscuro / onboarding | UX mejorable |
| P4 | Sin escáner de código de barras | Operación más lenta |

---

## Roadmap por Fases

### FASE 0 — Fundación CTO ✅ (esta sesión)
- [x] Análisis completo del codebase
- [x] Documento de estado de sesión (este archivo)
- [x] Branch de trabajo configurado

### FASE 1 — Reportes, Cierre de Caja y Exportación ✅ (esta sesión)
**Objetivo:** El dueño puede saber cuánto ganó, cuadrar la caja y exportar datos.
- [x] Backend: tabla `cierres_caja` en SQLite
- [x] Backend: endpoint `GET /api/reportes/balance` — ventas vs gastos, utilidad, margen
- [x] Backend: endpoint `GET /api/reportes/ventas-diarias` — ventas agrupadas por día (para gráfica)
- [x] Backend: endpoint `GET /api/reportes/productos` — análisis de productos con margen
- [x] Backend: endpoint `GET /api/cierre-caja` — estado del cierre del día
- [x] Backend: endpoint `POST /api/cierre-caja` — registrar cierre
- [x] Backend: endpoint `GET /api/cierres-caja` — historial de cierres
- [x] Backend: endpoint `GET /api/exportar/ventas` — CSV de ventas
- [x] Backend: endpoint `GET /api/exportar/productos` — CSV de inventario
- [x] Backend: Dashboard mejorado con gastos hoy, utilidad y lista de stock bajo
- [x] Frontend: Página "Reportes" con selector de período, balance, gráfica de barras CSS, análisis de productos
- [x] Frontend: Página "Cierre de Caja" con formulario de cuadre y historial
- [x] Frontend: Dashboard mejorado con tarjeta de utilidad y alertas de stock
- [x] CSS: Estilos para gráficas, tabs de período, alertas, cierre

### FASE 2 — Inventario y Operaciones (próxima sesión)
**Objetivo:** Control real del inventario y compras.
- [ ] Ajuste manual de stock (con motivo y fecha)
- [ ] Historial de movimientos de inventario
- [ ] Gestión de proveedores (CRUD)
- [ ] Registro de compras de mercadería ligado a proveedores
- [ ] Alertas configurables de stock mínimo (umbral personalizable por producto)
- [ ] Vista de productos agotados
- [ ] Import de productos desde CSV

### FASE 3 — Clientes y Finanzas (sesión futura)
**Objetivo:** Manejar crédito y relaciones con clientes.
- [ ] Control de crédito / deuda de clientes
- [ ] Historial de compras por cliente
- [ ] Abonos a deuda
- [ ] Impresión de tickets (PDF / impresora térmica)
- [ ] Descuentos y promociones
- [ ] Backup automático (exportar DB comprimida)

### FASE 4 — Seguridad y Multi-usuario (sesión futura)
**Objetivo:** Proteger los datos y permitir múltiples cajeros.
- [ ] Autenticación con PIN (sin servidor externo)
- [ ] Múltiples usuarios/cajeros con roles
- [ ] Log de auditoría (quién hizo qué)
- [ ] Sesiones con timeout
- [ ] Backup automático en carpeta configurable

### FASE 5 — UX Avanzada (sesión futura)
**Objetivo:** Mejorar la experiencia de uso diario.
- [ ] Modo oscuro
- [ ] Onboarding / tutorial primera vez
- [ ] Escáner de código de barras (cámara del teléfono)
- [ ] Atajos de teclado
- [ ] Sonidos de confirmación
- [ ] Animaciones pulidas

### FASE 6 — Infraestructura (sesión futura)
**Objetivo:** Calidad de software y distribución.
- [ ] Tests unitarios e integración (Jest + Supertest)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Logging estructurado (pino)
- [ ] Firma del .exe (certificado de código)
- [ ] Firma del .apk (keystore de producción)
- [ ] Auto-update de la app

---

## Arquitectura actual (resumen)

```
src/
  backend/server.js     Express + SQLite — API REST
  frontend/
    index.html          SPA — una sola página, navegación JS
    css/style.css       CSS variables, responsive, mobile-first
    js/app.js           Vanilla JS, IIFE, fetch API
    sw.js               Service Worker (cache-first)
    manifest.json       PWA config
electron/main.js        Wrapper Electron para Windows
scripts/                Build para .exe y .apk
```

### DB Schema (SQLite)
- `productos` — catálogo con soft-delete
- `ventas` + `venta_items` — transacciones (FASE 1: inmutables, solo anular)
- `gastos` — egresos del negocio
- `clientes` — directorio de clientes
- `cierres_caja` — **nuevo en FASE 1** — cuadre diario de caja

---

## Decisiones técnicas importantes

| Decisión | Motivo |
|----------|--------|
| Vanilla JS (sin React/Vue) | Sin build step, carga inmediata, sin dependencias que se rompen |
| SQLite con better-sqlite3 | Síncrono, portable, sin servidor externo, excelente performance |
| PWA + Electron en lugar de nativa | Código compartido, sin reescribir para cada plataforma |
| CSS puro (sin Tailwind/Bootstrap) | Control total, sin bloat, carga más rápida |
| UUIDs como primary key | Preparado para sincronización futura entre dispositivos |
| Gráficas con CSS puro (sin Chart.js) | Sin dependencias externas, funciona offline garantizado |

---

## Notas para la próxima sesión

### Para continuar en FASE 2:
1. Revisar este archivo para contexto
2. Iniciar con `ajuste de stock` — es lo más solicitado tras los reportes
3. La tabla de `movimientos_inventario` necesita: id, producto_id, tipo (entrada/salida/ajuste), cantidad, motivo, fecha
4. Para `proveedores`: tabla simple con nombre, teléfono, categoría

### Comandos útiles:
```bash
cd /home/user/MejoraCarniceria
git log --oneline -5        # ver últimos commits
npm start                   # iniciar servidor en :3000
git status                  # ver estado del repo
```

### Contexto de negocio:
- El cliente final es el dueño de la carnicería, **no técnico**
- Prioridad UX: **rápido de usar, no de entender**
- La app debe funcionar sin internet (100% offline)
- Dispositivos objetivo: PC Windows + Android barato (4GB RAM, Android 8+)

---

*Última actualización: FASE 1 completada (2026-05-14) — Reportes, Cierre de Caja y Exportación CSV implementados y pusheados al branch.*
