# 📋 TODO - Próxima Sesión

## ✅ Completado

- [x] Estructura base del proyecto
- [x] Backend con Express + SQLite
- [x] Frontend PWA responsive
- [x] Service Worker para offline
- [x] Dashboard con resumen del día
- [x] Módulo de ventas (Nueva Venta)
- [x] Historial de ventas con filtros
- [x] CRUD de productos
- [x] Registro de gastos
- [x] Gestión de clientes
- [x] Script de build para Windows (.exe)
- [x] Script de build para Android (.apk)
- [x] Documentación (README, ARCHITECTURE, INSTALL)

## 🔜 Pendiente para próxima sesión

### Funcionalidades
- [ ] Reportes avanzados (ventas por período, gráficas)
- [ ] Exportar datos a CSV/Excel
- [ ] Importar productos desde CSV
- [ ] Corte de cierre diario
- [ ] Códigos de barras (escáner)
- [ ] Impresión de tickets/recibos
- [ ] Gestión de proveedores
- [ ] Control de crédito (deudas de clientes)
- [ ] Backup automático
- [ ] Modo oscuro

### Instaladores
- [ ] Generar .exe probado en Windows limpio
- [ ] Generar .apk probado en Android real
- [ ] Firma del APK con keystore de producción
- [ ] Firmar el .exe con certificado de código
- [ ] Probar instalación/desinstalación completa

### Mejoras técnicas
- [ ] Autenticación (PIN o contraseña)
- [ ] Múltiples usuarios/cajeros
- [ ] Sincronización entre dispositivos
- [ ] API para integración con otros sistemas
- [ ] Tests unitarios y de integración
- [ ] CI/CD pipeline
- [ ] Logging y monitoreo

### UX
- [ ] Tutorial de primera vez (onboarding)
- [ ] Sonidos de confirmación
- [ ] Animaciones más pulidas
- [ ] Atajos de teclado
- [ ] Búsqueda por código de barras con cámara

---

## Notas para el desarrollador

### Generar el instalador Windows
```bash
cd MejoraCarniceria
npm install
npm run build:windows-installer
# El .exe queda en installer/windows/
```

### Generar el APK
```bash
cd MejoraCarniceria
npm install
# Instalar prerrequisitos de Android (ver INSTALL.md)
npm run build:android-apk
# El .apk queda en installer/android/
```

### Estructura de datos
- Cada venta descuenta stock automáticamente
- Los IDs son UUIDs (preparado para sync futuro)
- Soft delete en productos (no se borran del todo)
- SQLite con WAL mode para mejor performance
