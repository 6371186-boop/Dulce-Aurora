const express = require('express'), session = require('express-session'), PgStore = require('connect-pg-simple')(session);
const crypto = require('crypto'), bcrypt = require('bcrypt'), path = require('path'), pool = require('./db');
const app = express(), prod = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) throw new Error('Faltan SESSION_SECRET o DATABASE_URL');
if (prod) app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(session({ store: new PgStore({ pool, createTableIfMissing: true }), secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { httpOnly: true, secure: prod, sameSite: 'lax', maxAge: 864e5 } }));
app.use(express.static(path.join(__dirname, '..', 'public')));
const db = (t, p) => pool.query(t, p);
const w = f => (req, res, next) => f(req, res).catch(next);
const auth = (req, res, next) => req.session.uid ? next() : res.status(401).json({ error: 'No autorizado' });
const bad = m => Object.assign(new Error(m), { status: 400 });
const s = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const ESTADOS = ['Pendiente', 'En preparación', 'Listo', 'Entregado', 'Cancelado'];
const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia'];

app.get('/api/health', w(async (q, r) => { await db('SELECT 1'); r.json({ ok: true }); }));

app.post('/api/login', w(async (q, r) => {
  const { rows } = await db('SELECT * FROM usuarios WHERE username=$1', [s(q.body.username, 50)]);
  if (!rows[0] || !(await bcrypt.compare(String(q.body.password || ''), rows[0].password_hash))) return r.status(401).json({ error: 'Credenciales incorrectas' });
  q.session.regenerate(e => { if (e) return r.status(500).json({ error: 'Error' }); q.session.uid = rows[0].id; r.json({ ok: true }); });
}));
app.post('/api/logout', (q, r) => q.session.destroy(() => r.json({ ok: true })));
app.get('/api/me', auth, (q, r) => r.json({ ok: true }));

app.get('/api/categorias', w(async (q, r) => r.json((await db('SELECT * FROM categorias ORDER BY nombre')).rows)));
app.post('/api/categorias', auth, w(async (q, r) => { if (!s(q.body.nombre)) throw bad('Nombre requerido'); r.json((await db('INSERT INTO categorias(nombre) VALUES($1) RETURNING *', [s(q.body.nombre, 80)])).rows[0]); }));
app.put('/api/categorias/:id', auth, w(async (q, r) => r.json((await db('UPDATE categorias SET nombre=$1,actualizado=now() WHERE id=$2 RETURNING *', [s(q.body.nombre, 80), q.params.id])).rows[0])));
app.delete('/api/categorias/:id', auth, w(async (q, r) => { await db('DELETE FROM categorias WHERE id=$1', [q.params.id]); r.json({ ok: true }); }));

app.get('/api/productos', w(async (q, r) => {
  const all = q.query.all && q.session.uid;
  r.json((await db(`SELECT p.*,c.nombre categoria FROM productos p LEFT JOIN categorias c ON c.id=p.categoria_id ${all ? '' : 'WHERE p.activo'} ORDER BY p.id DESC`)).rows);
}));
const prodData = b => {
  const precio = Number(b.precio);
  if (!s(b.nombre) || !(precio >= 0)) throw bad('Nombre y precio válidos requeridos');
  return [s(b.nombre, 120), s(b.descripcion, 1000), precio, s(b.imagen_url, 500) || null, b.categoria_id || null, b.activo !== false];
};
app.post('/api/productos', auth, w(async (q, r) => r.json((await db('INSERT INTO productos(nombre,descripcion,precio,imagen_url,categoria_id,activo) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', prodData(q.body))).rows[0])));
app.put('/api/productos/:id', auth, w(async (q, r) => r.json((await db('UPDATE productos SET nombre=$1,descripcion=$2,precio=$3,imagen_url=$4,categoria_id=$5,activo=$6,actualizado=now() WHERE id=$7 RETURNING *', [...prodData(q.body), q.params.id])).rows[0])));
app.delete('/api/productos/:id', auth, w(async (q, r) => {
  try { await db('DELETE FROM productos WHERE id=$1', [q.params.id]); } catch (e) { if (e.code === '23503') throw bad('Tiene pedidos asociados; desactívalo en su lugar'); throw e; }
  r.json({ ok: true });
}));

const upCliente = async (cl, c) => {
  if (!s(c?.nombre) || !s(c?.telefono, 30)) throw bad('Nombre y teléfono requeridos');
  return (await cl.query('INSERT INTO clientes(nombre,telefono,direccion) VALUES($1,$2,$3) ON CONFLICT(telefono) DO UPDATE SET nombre=EXCLUDED.nombre,direccion=EXCLUDED.direccion,actualizado=now() RETURNING id', [s(c.nombre, 120), s(c.telefono, 30), s(c.direccion, 300)])).rows[0].id;
};
app.get('/api/clientes', auth, w(async (q, r) => r.json((await db('SELECT c.*,COUNT(p.id)::int pedidos FROM clientes c LEFT JOIN pedidos p ON p.cliente_id=c.id GROUP BY c.id ORDER BY c.id DESC')).rows)));
app.get('/api/clientes/:id/pedidos', auth, w(async (q, r) => r.json((await db('SELECT * FROM pedidos WHERE cliente_id=$1 ORDER BY id DESC', [q.params.id])).rows)));

const tx = async fn => {
  const cl = await pool.connect();
  try { await cl.query('BEGIN'); const v = await fn(cl); await cl.query('COMMIT'); return v; }
  catch (e) { await cl.query('ROLLBACK'); throw e; } finally { cl.release(); }
};

app.post('/api/pedidos', w(async (q, r) => {
  const { cliente, items, metodo } = q.body;
  if (!Array.isArray(items) || !items.length || !METODOS.includes(metodo)) throw bad('Pedido inválido');
  r.json(await tx(async cl => {
    const cid = await upCliente(cl, cliente);
    const { rows: ps } = await cl.query('SELECT id,precio FROM productos WHERE activo AND id=ANY($1)', [items.map(i => +i.id)]);
    let total = 0; const det = [];
    for (const i of items) {
      const p = ps.find(x => x.id === +i.id), n = parseInt(i.cantidad);
      if (!p || !(n > 0 && n <= 100)) throw bad('Producto no disponible');
      total += Number(p.precio) * n; det.push([p.id, n, p.precio]);
    }
    const ped = (await cl.query('INSERT INTO pedidos(cliente_id,total) VALUES($1,$2) RETURNING id', [cid, total])).rows[0].id;
    for (const d of det) await cl.query('INSERT INTO detalles_pedido(pedido_id,producto_id,cantidad,precio_unitario) VALUES($1,$2,$3,$4)', [ped, ...d]);
    await cl.query('INSERT INTO pagos(pedido_id,metodo,monto,estado) VALUES($1,$2,$3,$4)', [ped, metodo, total, 'Pendiente']); // el pago se realiza en el paso de pago simulado
    await cl.query('INSERT INTO facturas(numero,pedido_id) VALUES($1,$2)', ['F-' + String(ped).padStart(6, '0'), ped]);
    return { id: ped, total, pago: 'Pendiente' };
  }));
}));

// Pasarela de pago SIMULADA: no se piden ni guardan datos de tarjeta; solo se registra método, estado y referencia ficticia
app.post('/api/pedidos/:id/pagar', w(async (q, r) => {
  const { metodo, tel, resultado } = q.body;
  if (!METODOS.includes(metodo)) throw bad('Método inválido');
  const { rows } = await db('SELECT p.id,p.total,c.telefono,pg.estado FROM pedidos p JOIN clientes c ON c.id=p.cliente_id JOIN pagos pg ON pg.pedido_id=p.id WHERE p.id=$1', [q.params.id]);
  const o = rows[0];
  if (!o || !(q.session.uid || s(tel, 30) === o.telefono)) return r.status(404).json({ error: 'Pedido no encontrado' });
  if (o.estado === 'Pagado') throw bad('El pedido ya está pagado');
  const ref = (metodo === 'Efectivo' ? 'EFE-' : 'SIM-') + crypto.randomBytes(4).toString('hex').toUpperCase();
  const estado = metodo === 'Efectivo' ? 'Pendiente' : resultado === 'rechazado' ? 'Rechazado' : resultado === 'aprobado' ? 'Pagado' : (Math.random() < 0.8 ? 'Pagado' : 'Rechazado');
  await tx(async cl => {
    await cl.query('UPDATE pagos SET metodo=$1,estado=$2,referencia=$3,actualizado=now() WHERE pedido_id=$4', [metodo, estado, ref, o.id]);
    if (estado === 'Pagado') await cl.query("UPDATE pedidos SET estado='En preparación',actualizado=now() WHERE id=$1 AND estado='Pendiente'", [o.id]);
  });
  r.json({ estado, referencia: ref, metodo, monto: Number(o.total) });
}));
app.get('/api/pedidos', auth, w(async (q, r) => r.json((await db('SELECT p.id,p.estado,p.total,p.creado,c.nombre,c.telefono,pg.id pago_id,pg.metodo,pg.estado pago_estado,pg.referencia FROM pedidos p JOIN clientes c ON c.id=p.cliente_id LEFT JOIN pagos pg ON pg.pedido_id=p.id ORDER BY p.id DESC LIMIT 100')).rows)));
app.patch('/api/pedidos/:id', auth, w(async (q, r) => {
  if (!ESTADOS.includes(q.body.estado)) throw bad('Estado inválido');
  r.json((await db('UPDATE pedidos SET estado=$1,actualizado=now() WHERE id=$2 RETURNING *', [q.body.estado, q.params.id])).rows[0]);
}));
app.patch('/api/pagos/:id', auth, w(async (q, r) => {
  if (!['Pagado', 'Rechazado', 'Pendiente'].includes(q.body.estado)) throw bad('Estado inválido');
  await tx(async cl => {
    const p = (await cl.query('UPDATE pagos SET estado=$1,actualizado=now() WHERE id=$2 RETURNING pedido_id', [q.body.estado, q.params.id])).rows[0];
    if (p && q.body.estado === 'Pagado') await cl.query("UPDATE pedidos SET estado='En preparación',actualizado=now() WHERE id=$1 AND estado='Pendiente'", [p.pedido_id]);
  });
  r.json({ ok: true });
}));

app.get('/api/factura/:pedido', w(async (q, r) => {
  const { rows } = await db('SELECT f.numero,f.creado,f.codigo_generacion,f.tipo_dte,pg.referencia,p.id pedido,p.total,c.nombre,c.telefono,c.direccion,pg.metodo,pg.estado pago FROM facturas f JOIN pedidos p ON p.id=f.pedido_id JOIN clientes c ON c.id=p.cliente_id JOIN pagos pg ON pg.pedido_id=p.id WHERE p.id=$1', [q.params.pedido]);
  const f = rows[0];
  if (!f || !(q.session.uid || s(q.query.tel, 30) === f.telefono)) return r.status(404).json({ error: 'Factura no encontrada' });
  f.numero_control = `DTE-${f.tipo_dte}-M001P001-${String(f.pedido).padStart(15, '0')}`;
  const E = process.env;
  f.emisor = { nombre: E.EMISOR_NOMBRE || 'Dulce Aurora, S.A. de C.V. (ficticio)', nit: E.EMISOR_NIT || '0000-000000-000-0', nrc: E.EMISOR_NRC || '000000-0', actividad: E.EMISOR_ACTIVIDAD || 'Elaboración de productos de panadería y pastelería', direccion: E.EMISOR_DIRECCION || 'Centro de Apopa, San Salvador', telefono: E.EMISOR_TELEFONO || '+503 0000-0000', correo: E.EMISOR_CORREO || 'hola@dulceaurora.example' };
  f.items = (await db('SELECT pr.nombre,d.cantidad,d.precio_unitario FROM detalles_pedido d JOIN productos pr ON pr.id=d.producto_id WHERE d.pedido_id=$1', [f.pedido])).rows;
  r.json(f);
}));

app.post('/api/encargos', w(async (q, r) => {
  const b = q.body;
  if (!s(b.tamano) || !(parseInt(b.porciones) > 0) || !s(b.sabor) || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha_entrega || '')) throw bad('Completa los campos obligatorios');
  r.json({ id: await tx(async cl => {
    const cid = await upCliente(cl, b.cliente);
    return (await cl.query('INSERT INTO encargos_personalizados(cliente_id,tamano,porciones,sabor,relleno,cobertura,diseno,dedicatoria,fecha_entrega,observaciones,imagen_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id', [cid, s(b.tamano, 50), parseInt(b.porciones), s(b.sabor, 80), s(b.relleno, 80), s(b.cobertura, 80), s(b.diseno, 1000), s(b.dedicatoria, 300), b.fecha_entrega, s(b.observaciones, 1000), s(b.imagen_url, 500) || null])).rows[0].id;
  }) });
}));
app.get('/api/encargos', auth, w(async (q, r) => r.json((await db('SELECT e.*,c.nombre,c.telefono FROM encargos_personalizados e JOIN clientes c ON c.id=e.cliente_id ORDER BY e.id DESC LIMIT 100')).rows)));
app.patch('/api/encargos/:id', auth, w(async (q, r) => {
  if (!ESTADOS.includes(q.body.estado)) throw bad('Estado inválido');
  r.json((await db('UPDATE encargos_personalizados SET estado=$1,actualizado=now() WHERE id=$2 RETURNING *', [q.body.estado, q.params.id])).rows[0]);
}));

app.get('/api/stats', auth, w(async (q, r) => {
  const one = async t => (await db(t)).rows[0];
  r.json({
    ...await one("SELECT COUNT(*)::int pedidos,COUNT(*) FILTER(WHERE estado='Pendiente')::int pendientes FROM pedidos"),
    productos: (await one('SELECT COUNT(*)::int n FROM productos')).n,
    clientes: (await one('SELECT COUNT(*)::int n FROM clientes')).n,
    ingresos: Number((await one("SELECT COALESCE(SUM(monto),0) n FROM pagos WHERE estado='Pagado'")).n),
    top: (await db('SELECT pr.nombre,SUM(d.cantidad)::int vendidos FROM detalles_pedido d JOIN productos pr ON pr.id=d.producto_id GROUP BY pr.nombre ORDER BY vendidos DESC LIMIT 5')).rows,
    dias: (await db("SELECT to_char(creado::date,'DD/MM') dia,SUM(monto)::float total FROM pagos WHERE estado='Pagado' AND creado>now()-interval '7 days' GROUP BY creado::date ORDER BY creado::date")).rows,
  });
}));

app.use((q, r) => r.status(404).json({ error: 'No encontrado' }));
app.use((e, q, r, n) => {
  if (e.code === '23505') { e.status = 400; e.message = 'Registro duplicado'; }
  if (!e.status) console.error(e);
  r.status(e.status || 500).json({ error: e.status ? e.message : 'Error interno' });
});
module.exports = app;
