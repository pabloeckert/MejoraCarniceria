const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const compression = require('compression');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Database setup
const dbPath = path.join(process.cwd(), 'data', 'carniceria.db');
const fs = require('fs');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
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

  CREATE TABLE IF NOT EXISTS ventas (
    id TEXT PRIMARY KEY,
    fecha TEXT DEFAULT (datetime('now')),
    total REAL NOT NULL DEFAULT 0,
    metodo_pago TEXT DEFAULT 'efectivo',
    cliente TEXT,
    notas TEXT,
    anulada INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS venta_items (
    id TEXT PRIMARY KEY,
    venta_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY,
    fecha TEXT DEFAULT (datetime('now')),
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT DEFAULT 'general'
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    deuda REAL DEFAULT 0,
    creado TEXT DEFAULT (datetime('now'))
  );
`);

// Seed data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM productos').get();
if (count.c === 0) {
  const insert = db.prepare(`INSERT INTO productos (id, nombre, categoria, precio_venta, precio_compra, stock, unidad) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const seedData = [
    [uuidv4(), 'Carne Molida', 'res', 120, 80, 50, 'kg'],
    [uuidv4(), 'Bistec de Res', 'res', 180, 120, 30, 'kg'],
    [uuidv4(), 'Costilla de Res', 'res', 150, 95, 25, 'kg'],
    [uuidv4(), 'Chuleta de Puerco', 'cerdo', 130, 85, 40, 'kg'],
    [uuidv4(), 'Pierna de Puerco', 'cerdo', 110, 70, 35, 'kg'],
    [uuidv4(), 'Pollo Entero', 'pollo', 65, 40, 60, 'pieza'],
    [uuidv4(), 'Pechuga de Pollo', 'pollo', 95, 60, 45, 'kg'],
    [uuidv4(), 'Chorizo', 'embutidos', 140, 90, 20, 'kg'],
    [uuidv4(), 'Salchicha', 'embutidos', 80, 50, 30, 'kg'],
    [uuidv4(), 'Tocino', 'embutidos', 160, 100, 15, 'kg'],
  ];
  const insertMany = db.transaction((items) => { for (const item of items) insert.run(...item); });
  insertMany(seedData);
}

// API Routes

// Productos
app.get('/api/productos', (req, res) => {
  const { search, categoria } = req.query;
  let query = 'SELECT * FROM productos WHERE activo = 1';
  const params = [];
  if (search) { query += ' AND nombre LIKE ?'; params.push(`%${search}%`); }
  if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }
  query += ' ORDER BY nombre';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/productos/:id', (req, res) => {
  const prod = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  prod ? res.json(prod) : res.status(404).json({ error: 'Producto no encontrado' });
});

app.post('/api/productos', (req, res) => {
  const { nombre, categoria, precio_venta, precio_compra, stock, unidad, codigo_barras } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO productos (id, nombre, categoria, precio_venta, precio_compra, stock, unidad, codigo_barras) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, nombre, categoria || 'general', precio_venta, precio_compra || 0, stock || 0, unidad || 'kg', codigo_barras || null);
  res.status(201).json(db.prepare('SELECT * FROM productos WHERE id = ?').get(id));
});

app.put('/api/productos/:id', (req, res) => {
  const { nombre, categoria, precio_venta, precio_compra, stock, unidad, codigo_barras, activo } = req.body;
  db.prepare(`UPDATE productos SET nombre=?, categoria=?, precio_venta=?, precio_compra=?, stock=?, unidad=?, codigo_barras=?, activo=?, actualizado=datetime('now') WHERE id=?`)
    .run(nombre, categoria, precio_venta, precio_compra, stock, unidad, codigo_barras, activo !== undefined ? activo : 1, req.params.id);
  res.json(db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id));
});

app.delete('/api/productos/:id', (req, res) => {
  db.prepare("UPDATE productos SET activo = 0, actualizado = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Ventas
app.get('/api/ventas', (req, res) => {
  const { desde, hasta, limit } = req.query;
  let query = 'SELECT * FROM ventas WHERE anulada = 0';
  const params = [];
  if (desde) { query += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { query += ' AND fecha <= ?'; params.push(hasta); }
  query += ' ORDER BY fecha DESC';
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
  res.json(db.prepare(query).all(...params));
});

app.post('/api/ventas', (req, res) => {
  const { items, metodo_pago, cliente, notas } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Sin items' });

  const ventaId = uuidv4();
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  const crearVenta = db.transaction(() => {
    db.prepare('INSERT INTO ventas (id, total, metodo_pago, cliente, notas) VALUES (?,?,?,?,?)')
      .run(ventaId, total, metodo_pago || 'efectivo', cliente || null, notas || null);

    const insertItem = db.prepare('INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?,?)');
    const updateStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');

    for (const item of items) {
      insertItem.run(uuidv4(), ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.cantidad * item.precio_unitario);
      updateStock.run(item.cantidad, item.producto_id);
    }
  });

  crearVenta();
  res.status(201).json({ id: ventaId, total, fecha: new Date().toISOString() });
});

app.post('/api/ventas/:id/anular', (req, res) => {
  db.prepare('UPDATE ventas SET anulada = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Dashboard / resumen
app.get('/api/dashboard', (req, res) => {
  const hoy = new Date().toISOString().split('T')[0];
  const ventasHoy = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM ventas WHERE date(fecha) = ? AND anulada = 0").get(hoy);
  const ventasSemana = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total FROM ventas WHERE fecha >= date('now', '-7 days') AND anulada = 0").get();
  const productosBajos = db.prepare("SELECT COUNT(*) as count FROM productos WHERE stock < 5 AND activo = 1").get();
  const topProductos = db.prepare(`SELECT p.nombre, SUM(vi.cantidad) as total_vendido FROM venta_items vi JOIN productos p ON vi.producto_id = p.id JOIN ventas v ON vi.venta_id = v.id WHERE v.anulada = 0 GROUP BY p.id ORDER BY total_vendido DESC LIMIT 5`).all();

  res.json({ ventasHoy, ventasSemana, productosBajos, topProductos });
});

// Gastos
app.get('/api/gastos', (req, res) => {
  res.json(db.prepare('SELECT * FROM gastos ORDER BY fecha DESC LIMIT 100').all());
});

app.post('/api/gastos', (req, res) => {
  const { descripcion, monto, categoria } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO gastos (id, descripcion, monto, categoria) VALUES (?,?,?,?)').run(id, descripcion, monto, categoria || 'general');
  res.status(201).json(db.prepare('SELECT * FROM gastos WHERE id = ?').get(id));
});

// Clientes
app.get('/api/clientes', (req, res) => {
  res.json(db.prepare('SELECT * FROM clientes ORDER BY nombre').all());
});

app.post('/api/clientes', (req, res) => {
  const { nombre, telefono, direccion } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO clientes (id, nombre, telefono, direccion) VALUES (?,?,?,?)').run(id, nombre, telefono || null, direccion || null);
  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(id));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🥩 MejoraCarniceria corriendo en http://localhost:${PORT}`);
});

module.exports = app;
