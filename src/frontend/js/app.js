// MejoraCarniceria - Frontend App
(() => {
  'use strict';

  // State
  let carrito = [];
  let productos = [];

  // Helpers
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  class ApiError extends Error {
    constructor(message, { network = false, status = null } = {}) {
      super(message);
      this.name = 'ApiError';
      this.network = network;
      this.status = status;
    }
  }

  const api = async (path, opts) => {
    let res;
    try {
      res = await fetch(`/api${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
        body: opts?.body ? JSON.stringify(opts.body) : undefined
      });
    } catch (networkErr) {
      throw new ApiError('Sin conexión', { network: true });
    }
    if (!res.ok) {
      let message = res.statusText;
      try { const data = await res.json(); if (data?.error) message = data.error; } catch (_) {}
      throw new ApiError(message, { status: res.status });
    }
    return res.json();
  };

  function apiErrorToast(e, fallback = 'Error') {
    console.error(e);
    if (e instanceof ApiError && e.network) toast('Sin conexión: no se pudo guardar, probá de nuevo con señal', 'error');
    else toast((e instanceof ApiError && e.message) || fallback, 'error');
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatMoney(n) { return `$${Number(n || 0).toFixed(2)}`; }
  function formatDate(s) {
    if (!s) return '';
    const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatTime(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  let toastTimer = null;
  let toastClickHandler = null;
  function toast(msg, type = '', duration = 3000, onClick = null) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    if (toastClickHandler) { el.removeEventListener('click', toastClickHandler); toastClickHandler = null; }
    if (onClick) {
      toastClickHandler = onClick;
      el.addEventListener('click', toastClickHandler, { once: true });
    }
    toastTimer = setTimeout(() => { el.className = 'toast'; }, duration);
  }

  // Navigation
  function navigateTo(page) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${page}`)?.classList.add('active');
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    $(`.nav-link[data-page="${page}"]`)?.classList.add('active');
    closeSidebar();
    // Load page data
    if (page === 'dashboard') loadDashboard();
    if (page === 'ventas') loadProductosVenta();
    if (page === 'historial') loadHistorial();
    if (page === 'productos') loadProductos();
    if (page === 'gastos') loadGastos();
    if (page === 'clientes') loadClientes();
  }

  // Sidebar
  function openSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebar-overlay').classList.add('visible');
  }
  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebar-overlay').classList.remove('visible');
  }

  // Dashboard
  async function loadDashboard() {
    try {
      const data = await api('/dashboard');
      $('#stat-ventas-hoy').textContent = formatMoney(data.ventasHoy.total);
      $('#stat-ventas-count').textContent = `${data.ventasHoy.count} ventas`;
      $('#stat-ventas-semana').textContent = formatMoney(data.ventasSemana.total);
      $('#stat-semana-count').textContent = `${data.ventasSemana.count} ventas`;
      $('#stat-stock-bajo').textContent = data.productosBajos.count;

      const topEl = $('#top-productos');
      if (data.topProductos.length === 0) {
        topEl.innerHTML = '<div class="empty-state"><div class="icon">📊</div><p>Sin ventas aún</p></div>';
      } else {
        topEl.innerHTML = data.topProductos.map((p, i) => `
          <div class="list-item">
            <div class="list-item-info">
              <div class="title">${i + 1}. ${escapeHtml(p.nombre)}</div>
              <div class="subtitle">${p.total_vendido} vendidos</div>
            </div>
          </div>
        `).join('');
      }
    } catch (e) { apiErrorToast(e, 'Error al cargar el dashboard'); }
  }

  // Ventas - Productos
  async function loadProductosVenta() {
    try {
      productos = await api('/productos');
      renderProductosVenta();
    } catch (e) { apiErrorToast(e, 'Error al cargar productos'); }
  }

  function renderProductosVenta(filter = '') {
    const grid = $('#productos-venta');
    const filtered = filter
      ? productos.filter(p => p.nombre.toLowerCase().includes(filter.toLowerCase()))
      : productos;

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Sin resultados</p></div>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="product-card" data-id="${p.id}" onclick="app.addToCart('${p.id}')">
        <div class="name">${escapeHtml(p.nombre)}</div>
        <div class="price">${formatMoney(p.precio_venta)}/${escapeHtml(p.unidad)}</div>
        <div class="stock">Stock: ${p.stock} ${escapeHtml(p.unidad)}</div>
      </div>
    `).join('');
  }

  // Carrito
  function addToCart(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;
    const existing = carrito.find(c => c.producto_id === id);
    const currentQty = existing ? existing.cantidad : 0;
    if (currentQty >= prod.stock) { toast('Stock insuficiente', 'error'); return; }
    const nextQty = Math.min(currentQty + 0.5, prod.stock);
    if (existing) {
      existing.cantidad = nextQty;
    } else {
      carrito.push({
        producto_id: id,
        nombre: prod.nombre,
        cantidad: nextQty,
        precio_unitario: prod.precio_venta,
        unidad: prod.unidad,
        stock: prod.stock
      });
    }
    renderCarrito();
    toast(`${prod.nombre} agregado`, 'success');
  }

  function renderCarrito() {
    const card = $('#carrito-card');
    const items = $('#carrito-items');
    const totalEl = $('#carrito-total');

    if (carrito.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    items.innerHTML = carrito.map((item, i) => `
      <div class="carrito-item">
        <div class="info">
          <div class="name">${escapeHtml(item.nombre)}</div>
          <div class="detail">${formatMoney(item.precio_unitario)} × ${item.cantidad} ${escapeHtml(item.unidad)}</div>
        </div>
        <input type="number" value="${item.cantidad}" min="0.1" step="0.1"
          onchange="app.updateQty(${i}, this.value)">
        <span style="font-weight:600;min-width:70px;text-align:right">${formatMoney(item.cantidad * item.precio_unitario)}</span>
        <button class="icon-btn" onclick="app.removeFromCart(${i})" style="color:var(--danger)" aria-label="Quitar del carrito">✕</button>
      </div>
    `).join('');

    const total = carrito.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
    totalEl.textContent = formatMoney(total);
  }

  function updateQty(index, val) {
    const qty = parseFloat(val);
    const item = carrito[index];
    if (!item) return;
    if (isNaN(qty) || qty <= 0) { carrito.splice(index, 1); renderCarrito(); return; }
    if (qty > item.stock) { toast('Stock insuficiente', 'error'); item.cantidad = item.stock; }
    else { item.cantidad = qty; }
    renderCarrito();
  }

  function removeFromCart(index) {
    carrito.splice(index, 1);
    renderCarrito();
  }

  async function cobrar() {
    if (carrito.length === 0) return;
    try {
      const items = carrito.map(c => ({
        producto_id: c.producto_id,
        cantidad: c.cantidad,
        precio_unitario: c.precio_unitario
      }));
      await api('/ventas', {
        method: 'POST',
        body: {
          items,
          metodo_pago: $('#metodo-pago').value,
          cliente: $('#cliente-venta').value || null
        }
      });
      carrito = [];
      renderCarrito();
      toast('✅ Venta registrada', 'success');
      loadProductosVenta();
    } catch (e) {
      apiErrorToast(e, 'Error al cobrar');
    }
  }

  // Historial
  const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

  async function loadHistorial() {
    try {
      const desde = $('#filtro-desde').value;
      const hasta = $('#filtro-hasta').value;
      let url = '/ventas?limit=50';
      if (desde) url += `&desde=${desde}`;
      if (hasta) url += `&hasta=${hasta}`;
      const ventas = await api(url);
      const el = $('#lista-ventas');
      if (ventas.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>Sin ventas registradas</p></div>';
        return;
      }
      el.innerHTML = ventas.map(v => {
        const metodoClass = METODOS_PAGO.includes(v.metodo_pago) ? v.metodo_pago : 'efectivo';
        return `
        <div class="list-item">
          <div class="list-item-info">
            <div class="title">${formatMoney(v.total)}</div>
            <div class="subtitle">${formatDate(v.fecha)} ${formatTime(v.fecha)} · ${escapeHtml(v.cliente || 'Sin cliente')}</div>
          </div>
          <span class="badge badge-${metodoClass}">${escapeHtml(v.metodo_pago)}</span>
          <button class="btn btn-sm btn-secondary" onclick="app.anularVenta('${v.id}')" aria-label="Anular venta">Anular</button>
        </div>
      `;
      }).join('');
    } catch (e) { apiErrorToast(e, 'Error al cargar el historial'); }
  }

  // Productos CRUD
  async function loadProductos() {
    try {
      const search = $('#buscar-inventario').value;
      const cat = $('#filtro-categoria').value;
      let url = '/productos?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (cat) url += `categoria=${cat}`;
      productos = await api(url);
      const el = $('#lista-productos');
      if (productos.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>Sin productos</p></div>';
        return;
      }
      el.innerHTML = productos.map(p => `
        <div class="list-item">
          <div class="list-item-info">
            <div class="title">${escapeHtml(p.nombre)}</div>
            <div class="subtitle">Venta: ${formatMoney(p.precio_venta)} · Compra: ${formatMoney(p.precio_compra)} · Stock: ${p.stock} ${escapeHtml(p.unidad)}</div>
          </div>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-secondary" onclick="app.editProducto('${p.id}')" aria-label="Editar producto">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="app.deleteProducto('${p.id}')" aria-label="Eliminar producto">🗑️</button>
          </div>
        </div>
      `).join('');
    } catch (e) { apiErrorToast(e, 'Error al cargar productos'); }
  }

  function showProductoForm(prod = null) {
    const isEdit = !!prod;
    $('#modal-title').textContent = isEdit ? 'Editar Producto' : 'Nuevo Producto';
    $('#modal-body').innerHTML = `
      <form id="form-producto">
        <div class="form-row" style="flex-direction:column">
          <input type="text" id="prod-nombre" placeholder="Nombre" value="${escapeHtml(prod?.nombre || '')}" required>
          <select id="prod-categoria">
            ${['res','cerdo','pollo','embutidos','general'].map(c =>
              `<option value="${c}" ${prod?.categoria === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
            ).join('')}
          </select>
          <div class="form-row">
            <input type="number" id="prod-precio-v" placeholder="Precio venta" step="0.01" min="0" value="${prod?.precio_venta || ''}" required>
            <input type="number" id="prod-precio-c" placeholder="Precio compra" step="0.01" min="0" value="${prod?.precio_compra || ''}">
          </div>
          <div class="form-row">
            <input type="number" id="prod-stock" placeholder="Stock" step="0.1" min="0" value="${prod?.stock || 0}">
            <select id="prod-unidad">
              <option value="kg" ${prod?.unidad === 'kg' ? 'selected' : ''}>Kg</option>
              <option value="pieza" ${prod?.unidad === 'pieza' ? 'selected' : ''}>Pieza</option>
              <option value="lb" ${prod?.unidad === 'lb' ? 'selected' : ''}>Libra</option>
            </select>
          </div>
          <input type="text" id="prod-codigo" placeholder="Código de barras (opcional)" value="${escapeHtml(prod?.codigo_barras || '')}">
        </div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Guardar' : 'Crear'}</button>
      </form>
    `;
    openModal();

    $('#form-producto').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombre: $('#prod-nombre').value,
        categoria: $('#prod-categoria').value,
        precio_venta: parseFloat($('#prod-precio-v').value),
        precio_compra: parseFloat($('#prod-precio-c').value) || 0,
        stock: parseFloat($('#prod-stock').value) || 0,
        unidad: $('#prod-unidad').value,
        codigo_barras: $('#prod-codigo').value || null
      };
      try {
        if (isEdit) {
          await api(`/productos/${prod.id}`, { method: 'PUT', body: data });
          toast('Producto actualizado', 'success');
        } else {
          await api('/productos', { method: 'POST', body: data });
          toast('Producto creado', 'success');
        }
        closeModal();
        loadProductos();
      } catch (e) { apiErrorToast(e); }
    };
  }

  async function editProducto(id) {
    try {
      const prod = await api(`/productos/${id}`);
      showProductoForm(prod);
    } catch (e) { apiErrorToast(e); }
  }

  function deleteProducto(id) {
    const prod = productos.find(p => p.id === id);
    showConfirm(`¿Eliminar "${prod ? prod.nombre : 'este producto'}"?`, async () => {
      try {
        await api(`/productos/${id}`, { method: 'DELETE' });
        toast('Producto eliminado', 'success');
        loadProductos();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) { toast('El producto ya no existe', 'error'); loadProductos(); }
        else apiErrorToast(e);
      }
    }, { title: 'Eliminar producto', confirmLabel: 'Eliminar' });
  }

  function anularVenta(id) {
    showConfirm('¿Anular esta venta? Se restaurará el stock de los productos.', async () => {
      try {
        await api(`/ventas/${id}/anular`, { method: 'POST' });
        toast('Venta anulada', 'success');
        loadHistorial();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) { toast('La venta no existe o ya fue anulada', 'error'); loadHistorial(); }
        else apiErrorToast(e);
      }
    }, { title: 'Anular venta', confirmLabel: 'Anular' });
  }

  // Gastos
  async function loadGastos() {
    try {
      const gastos = await api('/gastos');
      const el = $('#lista-gastos');
      if (gastos.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="icon">💸</div><p>Sin gastos</p></div>';
        return;
      }
      el.innerHTML = gastos.map(g => `
        <div class="list-item">
          <div class="list-item-info">
            <div class="title">${escapeHtml(g.descripcion)}</div>
            <div class="subtitle">${formatDate(g.fecha)} · ${escapeHtml(g.categoria)}</div>
          </div>
          <span style="font-weight:700;color:var(--danger)">${formatMoney(g.monto)}</span>
        </div>
      `).join('');
    } catch (e) { apiErrorToast(e, 'Error al cargar gastos'); }
  }

  // Clientes
  async function loadClientes() {
    try {
      const clientes = await api('/clientes');
      const el = $('#lista-clientes');
      if (clientes.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="icon">👥</div><p>Sin clientes</p></div>';
        return;
      }
      el.innerHTML = clientes.map(c => `
        <div class="list-item">
          <div class="list-item-info">
            <div class="title">${escapeHtml(c.nombre)}</div>
            <div class="subtitle">${escapeHtml(c.telefono || 'Sin teléfono')} · ${escapeHtml(c.direccion || 'Sin dirección')}</div>
          </div>
        </div>
      `).join('');
    } catch (e) { apiErrorToast(e, 'Error al cargar clientes'); }
  }

  // Modal
  let lastFocusedEl = null;
  function openModal() {
    lastFocusedEl = document.activeElement;
    $('#modal').style.display = 'flex';
    const focusable = $('#modal-body').querySelector('input, select, textarea, button');
    (focusable || $('.modal-close')).focus();
  }
  function closeModal() {
    $('#modal').style.display = 'none';
    lastFocusedEl?.focus();
  }
  function showConfirm(message, onConfirm, { title = 'Confirmar', confirmLabel = 'Confirmar', danger = true } = {}) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = `
      <p style="margin-bottom:16px">${escapeHtml(message)}</p>
      <div class="form-row">
        <button type="button" class="btn btn-secondary btn-block" id="confirm-cancel">Cancelar</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block" id="confirm-ok">${escapeHtml(confirmLabel)}</button>
      </div>`;
    openModal();
    $('#confirm-cancel').onclick = closeModal;
    $('#confirm-ok').onclick = async () => { closeModal(); await onConfirm(); };
  }

  // Connection status
  function updateConnectionStatus() {
    const el = $('#connection-status');
    if (navigator.onLine) {
      el.textContent = '● Online';
      el.className = 'status-badge online';
    } else {
      el.textContent = '● Offline';
      el.className = 'status-badge offline';
    }
  }

  // Event listeners
  function init() {
    // Navigation
    $$('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });

    // Sidebar
    $('#menu-btn').addEventListener('click', openSidebar);
    $('#close-sidebar').addEventListener('click', closeSidebar);
    $('#sidebar-overlay').addEventListener('click', closeSidebar);

    // Search products (venta)
    $('#buscar-producto').addEventListener('input', (e) => renderProductosVenta(e.target.value));

    // Cobrar
    $('#btn-cobrar').addEventListener('click', cobrar);

    // Historial filter
    $('#btn-filtrar').addEventListener('click', loadHistorial);

    // Productos
    $('#btn-nuevo-producto').addEventListener('click', () => showProductoForm());
    $('#buscar-inventario').addEventListener('input', loadProductos);
    $('#filtro-categoria').addEventListener('change', loadProductos);

    // Gastos
    $('#form-gasto').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/gastos', {
          method: 'POST',
          body: {
            descripcion: $('#gasto-desc').value,
            monto: parseFloat($('#gasto-monto').value),
            categoria: $('#gasto-categoria').value
          }
        });
        $('#gasto-desc').value = '';
        $('#gasto-monto').value = '';
        toast('Gasto registrado', 'success');
        loadGastos();
      } catch (e) { toast('Error', 'error'); }
    });

    // Clientes
    $('#form-cliente').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/clientes', {
          method: 'POST',
          body: {
            nombre: $('#cliente-nombre').value,
            telefono: $('#cliente-tel').value,
            direccion: $('#cliente-dir').value
          }
        });
        $('#cliente-nombre').value = '';
        $('#cliente-tel').value = '';
        $('#cliente-dir').value = '';
        toast('Cliente agregado', 'success');
        loadClientes();
      } catch (e) { toast('Error', 'error'); }
    });

    // Modal close
    $$('.modal-close').forEach(b => b.addEventListener('click', closeModal));
    $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });

    // Connection
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Set default dates for historial
    const today = new Date().toISOString().split('T')[0];
    $('#filtro-hasta').value = today;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    $('#filtro-desde').value = weekAgo;

    // Load dashboard
    navigateTo('dashboard');
  }

  // Expose to global for onclick handlers
  window.app = { addToCart, updateQty, removeFromCart, editProducto, deleteProducto };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
