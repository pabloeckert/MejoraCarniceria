// MejoraCarniceria — Frontend App
(() => {
  'use strict';

  // State
  let carrito = [];
  let productos = [];
  let reporteDesde = '';
  let reporteHasta = '';

  // Helpers
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const api = async (path, opts) => {
    const res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts?.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

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
  function dateStr(offsetDays = 0) {
    return new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];
  }

  function toast(msg, type = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    setTimeout(() => el.className = 'toast', 3000);
  }

  // Navigation
  function navigateTo(page) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${page}`)?.classList.add('active');
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    $(`.nav-link[data-page="${page}"]`)?.classList.add('active');
    closeSidebar();
    if (page === 'dashboard') loadDashboard();
    if (page === 'ventas') loadProductosVenta();
    if (page === 'historial') loadHistorial();
    if (page === 'productos') loadProductos();
    if (page === 'gastos') loadGastos();
    if (page === 'clientes') loadClientes();
    if (page === 'reportes') loadReportes();
    if (page === 'cierre') loadCierreCaja();
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

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  async function loadDashboard() {
    try {
      const data = await api('/dashboard');

      $('#stat-ventas-hoy').textContent = formatMoney(data.ventasHoy.total);
      $('#stat-ventas-count').textContent = `${data.ventasHoy.count} ventas`;
      $('#stat-ventas-semana').textContent = formatMoney(data.ventasSemana.total);
      $('#stat-semana-count').textContent = `${data.ventasSemana.count} ventas`;
      $('#stat-gastos-hoy').textContent = formatMoney(data.gastosHoy.total);
      $('#stat-gastos-count').textContent = `${data.gastosHoy.count} gastos`;

      const utilidad = data.utilidadHoy;
      const utilEl = $('#stat-utilidad-hoy');
      const utilCard = $('#stat-utilidad-card');
      utilEl.textContent = formatMoney(utilidad);
      utilCard.className = `stat-card ${utilidad >= 0 ? 'green' : 'red'}`;
      $('#stat-stock-bajo-count').textContent = `${data.productosBajos.count} productos bajos`;

      // Top productos
      const topEl = $('#top-productos');
      if (data.topProductos.length === 0) {
        topEl.innerHTML = '<div class="empty-state"><div class="icon">📊</div><p>Sin ventas aún</p></div>';
      } else {
        topEl.innerHTML = data.topProductos.map((p, i) => `
          <div class="list-item">
            <div class="list-item-info">
              <div class="title">${i + 1}. ${p.nombre}</div>
              <div class="subtitle">${p.total_vendido} unidades vendidas</div>
            </div>
          </div>
        `).join('');
      }

      // Alertas de stock bajo
      const alertCard = $('#card-alertas-stock');
      const alertList = $('#lista-alertas-stock');
      if (data.productosAlerta && data.productosAlerta.length > 0) {
        alertCard.style.display = 'block';
        alertList.innerHTML = data.productosAlerta.map(p => `
          <div class="list-item">
            <div class="list-item-info">
              <div class="title">${p.nombre}</div>
              <div class="subtitle">Stock actual: ${p.stock} ${p.unidad}</div>
            </div>
            <span class="badge badge-alerta">Stock bajo</span>
          </div>
        `).join('');
      } else {
        alertCard.style.display = 'none';
      }
    } catch (e) { console.error('Dashboard error:', e); }
  }

  // ─── Ventas ──────────────────────────────────────────────────────────────────

  async function loadProductosVenta() {
    try {
      productos = await api('/productos');
      renderProductosVenta();
    } catch (e) { console.error(e); }
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
      <div class="product-card ${p.stock <= 0 ? 'sin-stock' : ''}" data-id="${p.id}" onclick="app.addToCart('${p.id}')">
        <div class="name">${p.nombre}</div>
        <div class="price">${formatMoney(p.precio_venta)}/${p.unidad}</div>
        <div class="stock ${p.stock < 5 ? 'stock-bajo' : ''}">Stock: ${p.stock} ${p.unidad}</div>
      </div>
    `).join('');
  }

  // Carrito
  function addToCart(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;
    const existing = carrito.find(c => c.producto_id === id);
    if (existing) {
      existing.cantidad += 0.5;
    } else {
      carrito.push({
        producto_id: id,
        nombre: prod.nombre,
        cantidad: 1,
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
          <div class="name">${item.nombre}</div>
          <div class="detail">${formatMoney(item.precio_unitario)} × ${item.cantidad} ${item.unidad}</div>
        </div>
        <input type="number" value="${item.cantidad}" min="0.1" step="0.1"
          onchange="app.updateQty(${i}, this.value)">
        <span style="font-weight:600;min-width:70px;text-align:right">${formatMoney(item.cantidad * item.precio_unitario)}</span>
        <button class="icon-btn" onclick="app.removeFromCart(${i})" style="color:var(--danger)">✕</button>
      </div>
    `).join('');

    const total = carrito.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
    totalEl.textContent = formatMoney(total);
  }

  function updateQty(index, val) {
    const qty = parseFloat(val);
    if (qty <= 0) { carrito.splice(index, 1); }
    else { carrito[index].cantidad = qty; }
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
      toast('Venta registrada', 'success');
      loadProductosVenta();
    } catch (e) {
      toast('Error al cobrar', 'error');
      console.error(e);
    }
  }

  // ─── Historial ───────────────────────────────────────────────────────────────

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
      el.innerHTML = ventas.map(v => `
        <div class="list-item">
          <div class="list-item-info">
            <div class="title">${formatMoney(v.total)}</div>
            <div class="subtitle">${formatDate(v.fecha)} ${formatTime(v.fecha)} · ${v.cliente || 'Sin cliente'}</div>
          </div>
          <span class="badge badge-${v.metodo_pago}">${v.metodo_pago}</span>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }

  // ─── Productos CRUD ──────────────────────────────────────────────────────────

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
            <div class="title">${p.nombre} ${p.stock < 5 ? '<span class="badge badge-alerta">Bajo</span>' : ''}</div>
            <div class="subtitle">Venta: ${formatMoney(p.precio_venta)} · Compra: ${formatMoney(p.precio_compra)} · Stock: ${p.stock} ${p.unidad}</div>
          </div>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-secondary" onclick="app.editProducto('${p.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="app.deleteProducto('${p.id}')">🗑️</button>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }

  function showProductoForm(prod = null) {
    const isEdit = !!prod;
    $('#modal-title').textContent = isEdit ? 'Editar Producto' : 'Nuevo Producto';
    $('#modal-body').innerHTML = `
      <form id="form-producto">
        <div class="form-row" style="flex-direction:column">
          <input type="text" id="prod-nombre" placeholder="Nombre" value="${prod?.nombre || ''}" required>
          <select id="prod-categoria">
            ${['res','cerdo','pollo','embutidos','general'].map(c =>
              `<option value="${c}" ${prod?.categoria === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
            ).join('')}
          </select>
          <div class="form-row">
            <input type="number" id="prod-precio-v" placeholder="Precio venta" step="0.01" value="${prod?.precio_venta || ''}" required>
            <input type="number" id="prod-precio-c" placeholder="Precio compra" step="0.01" value="${prod?.precio_compra || ''}">
          </div>
          <div class="form-row">
            <input type="number" id="prod-stock" placeholder="Stock" step="0.1" value="${prod?.stock || 0}">
            <select id="prod-unidad">
              <option value="kg" ${prod?.unidad === 'kg' ? 'selected' : ''}>Kg</option>
              <option value="pieza" ${prod?.unidad === 'pieza' ? 'selected' : ''}>Pieza</option>
              <option value="lb" ${prod?.unidad === 'lb' ? 'selected' : ''}>Libra</option>
            </select>
          </div>
          <input type="text" id="prod-codigo" placeholder="Código de barras (opcional)" value="${prod?.codigo_barras || ''}">
        </div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Guardar' : 'Crear'}</button>
      </form>
    `;
    $('#modal').style.display = 'flex';

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
      } catch (e) { toast('Error', 'error'); }
    };
  }

  async function editProducto(id) {
    try {
      const prod = await api(`/productos/${id}`);
      showProductoForm(prod);
    } catch (e) { toast('Error', 'error'); }
  }

  async function deleteProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api(`/productos/${id}`, { method: 'DELETE' });
      toast('Producto eliminado', 'success');
      loadProductos();
    } catch (e) { toast('Error', 'error'); }
  }

  // ─── Gastos ──────────────────────────────────────────────────────────────────

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
            <div class="title">${g.descripcion}</div>
            <div class="subtitle">${formatDate(g.fecha)} · ${g.categoria}</div>
          </div>
          <span style="font-weight:700;color:var(--danger)">${formatMoney(g.monto)}</span>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }

  // ─── Clientes ────────────────────────────────────────────────────────────────

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
            <div class="title">${c.nombre}</div>
            <div class="subtitle">${c.telefono || 'Sin teléfono'} · ${c.direccion || 'Sin dirección'}</div>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }

  // ─── FASE 1: Reportes ─────────────────────────────────────────────────────────

  function getPeriodDates(period) {
    const hoy = dateStr(0);
    if (period === 'hoy') return { desde: hoy, hasta: hoy };
    if (period === 'semana') return { desde: dateStr(-6), hasta: hoy };
    if (period === 'mes') return { desde: dateStr(-29), hasta: hoy };
    return { desde: reporteDesde || hoy, hasta: reporteHasta || hoy };
  }

  async function loadReportes(period) {
    const activePeriod = period || $('.period-tab.active')?.dataset.period || 'hoy';
    const { desde, hasta } = getPeriodDates(activePeriod);
    reporteDesde = desde;
    reporteHasta = hasta;

    try {
      const [balance, diarias, productoData] = await Promise.all([
        api(`/reportes/balance?desde=${desde}&hasta=${hasta}`),
        api(`/reportes/ventas-diarias?desde=${desde}&hasta=${hasta}`),
        api(`/reportes/productos?desde=${desde}&hasta=${hasta}`)
      ]);

      // Balance stats
      $('#rep-ventas').textContent = formatMoney(balance.ventas.total);
      $('#rep-ventas-count').textContent = `${balance.ventas.count} ventas`;
      $('#rep-gastos').textContent = formatMoney(balance.gastos.total);
      $('#rep-gastos-count').textContent = `${balance.gastos.count} gastos`;
      $('#rep-utilidad').textContent = formatMoney(balance.utilidad);
      $('#rep-margen').textContent = `${balance.margen}% margen`;
      const utilCard = $('#rep-utilidad-card');
      utilCard.className = `stat-card ${balance.utilidad >= 0 ? 'green' : 'red'}`;

      // Gráfica de barras
      renderBarChart(diarias, '#chart-ventas-diarias');

      // Análisis de productos
      const prodEl = $('#rep-productos');
      if (productoData.length === 0) {
        prodEl.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>Sin datos</p></div>';
      } else {
        const vendidos = productoData.filter(p => p.ingresos > 0);
        const noVendidos = productoData.filter(p => p.ingresos === 0);
        const margenProd = (p) => p.ingresos > 0 ? ((p.utilidad / p.ingresos) * 100).toFixed(0) : 0;
        prodEl.innerHTML = vendidos.map(p => `
          <div class="list-item">
            <div class="list-item-info">
              <div class="title">${p.nombre}</div>
              <div class="subtitle">${p.cantidad_vendida} ${p.unidad} · Ingresos: ${formatMoney(p.ingresos)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--success)">${formatMoney(p.utilidad)}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary)">${margenProd(p)}% margen</div>
            </div>
          </div>
        `).join('') + (noVendidos.length > 0 ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);color:var(--text-secondary);font-size:0.82rem">
            Sin ventas en el período: ${noVendidos.map(p => p.nombre).join(', ')}
          </div>
        ` : '');
      }
    } catch (e) {
      console.error('Reportes error:', e);
      toast('Error cargando reportes', 'error');
    }
  }

  function renderBarChart(data, selector) {
    const container = $(selector);
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state" style="height:160px"><p>Sin ventas en el período</p></div>';
      return;
    }
    const max = Math.max(...data.map(d => d.total), 1);
    container.innerHTML = data.map(d => {
      const pct = Math.max((d.total / max) * 100, 2).toFixed(1);
      const label = d.dia ? d.dia.slice(5).replace('-', '/') : '';
      return `
        <div class="chart-col">
          <div class="chart-bar" style="height:${pct}%">
            <span class="chart-val">${formatMoney(d.total)}</span>
          </div>
          <div class="chart-label">${label}</div>
        </div>
      `;
    }).join('');
  }

  // Exportar CSV — descarga directa via navegador
  function exportarVentas() {
    const desde = reporteDesde || dateStr(-29);
    const hasta = reporteHasta || dateStr(0);
    window.location.href = `/api/exportar/ventas?desde=${desde}&hasta=${hasta}`;
  }

  function exportarProductos() {
    window.location.href = '/api/exportar/productos';
  }

  // ─── FASE 1: Cierre de Caja ───────────────────────────────────────────────────

  async function loadCierreCaja() {
    try {
      const data = await api('/cierre-caja');

      $('#cierre-total-ventas').textContent = formatMoney(data.total_ventas);
      $('#cierre-efectivo-ventas-sub').textContent = `${formatMoney(data.efectivo_ventas)} en efectivo`;
      $('#cierre-total-gastos').textContent = formatMoney(data.total_gastos);
      $('#cierre-efectivo-esperado').textContent = formatMoney(data.efectivo_esperado);

      const yaRegistrado = $('#cierre-ya-registrado');
      if (data.cierre_registrado) {
        yaRegistrado.style.display = 'block';
        // Pre-llenar con el cierre anterior si existe
        $('#cierre-efectivo-input').value = data.cierre.efectivo_contado ?? '';
        $('#cierre-notas-input').value = data.cierre.notas || '';
        mostrarResultadoCierre(data.cierre);
      } else {
        yaRegistrado.style.display = 'none';
        $('#cierre-resultado').style.display = 'none';
      }

      // Historial
      const cierres = await api('/cierres-caja');
      const listaEl = $('#lista-cierres');
      if (cierres.length === 0) {
        listaEl.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>Sin cierres registrados</p></div>';
      } else {
        listaEl.innerHTML = cierres.map(c => {
          const diffClass = c.diferencia > 0 ? 'diff-pos' : c.diferencia < 0 ? 'diff-neg' : '';
          const diffSign = c.diferencia > 0 ? '+' : '';
          return `
            <div class="list-item">
              <div class="list-item-info">
                <div class="title">${formatDate(c.fecha)}</div>
                <div class="subtitle">Ventas: ${formatMoney(c.total_ventas)} · Gastos: ${formatMoney(c.total_gastos)}</div>
              </div>
              <div style="text-align:right">
                <div class="diff-badge ${diffClass}">${diffSign}${formatMoney(c.diferencia)}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary)">diferencia</div>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Cierre error:', e);
      toast('Error cargando cierre', 'error');
    }
  }

  function mostrarResultadoCierre(cierre) {
    const resEl = $('#cierre-resultado');
    resEl.style.display = 'block';
    $('#res-efectivo-esperado').textContent = formatMoney(cierre.efectivo_esperado);
    $('#res-efectivo-contado').textContent = formatMoney(cierre.efectivo_contado);
    const diff = cierre.diferencia;
    const diffEl = $('#res-diferencia');
    diffEl.textContent = `${diff >= 0 ? '+' : ''}${formatMoney(diff)}`;
    diffEl.className = `diff-val ${diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : ''}`;
  }

  async function registrarCierre(e) {
    e.preventDefault();
    const efectivo = parseFloat($('#cierre-efectivo-input').value);
    const notas = $('#cierre-notas-input').value;
    if (isNaN(efectivo)) { toast('Ingresa el efectivo contado', 'error'); return; }
    try {
      const result = await api('/cierre-caja', {
        method: 'POST',
        body: { efectivo_contado: efectivo, notas }
      });
      toast('Caja cerrada correctamente', 'success');
      mostrarResultadoCierre({
        efectivo_esperado: result.efectivo_esperado,
        efectivo_contado: efectivo,
        diferencia: result.diferencia
      });
      $('#cierre-ya-registrado').style.display = 'block';
      // Recargar historial
      loadCierreCaja();
    } catch (e) {
      toast('Error al cerrar caja', 'error');
      console.error(e);
    }
  }

  // ─── Modal y utilidades ───────────────────────────────────────────────────────

  function closeModal() { $('#modal').style.display = 'none'; }

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

  // ─── Init ─────────────────────────────────────────────────────────────────────

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

    // Búsqueda en venta
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

    // Reportes — tabs de período
    $$('.period-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.period-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const isCustom = btn.dataset.period === 'custom';
        $('#custom-period').style.display = isCustom ? 'flex' : 'none';
        if (!isCustom) loadReportes(btn.dataset.period);
      });
    });

    $('#btn-rep-filtrar').addEventListener('click', () => {
      reporteDesde = $('#rep-desde').value;
      reporteHasta = $('#rep-hasta').value;
      if (reporteDesde && reporteHasta) loadReportes('custom');
      else toast('Selecciona el rango de fechas', 'error');
    });

    // Cierre de caja
    $('#form-cierre').addEventListener('submit', registrarCierre);

    // Modal
    $$('.modal-close').forEach(b => b.addEventListener('click', closeModal));
    $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });

    // Conexión
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Fechas default en historial
    const today = dateStr(0);
    $('#filtro-hasta').value = today;
    $('#filtro-desde').value = dateStr(-6);

    // Fechas default en reportes personalizados
    $('#rep-hasta').value = today;
    $('#rep-desde').value = dateStr(-6);

    navigateTo('dashboard');
  }

  // Exponer al global para handlers onclick en HTML
  window.app = {
    addToCart, updateQty, removeFromCart,
    editProducto, deleteProducto,
    exportarVentas, exportarProductos
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
