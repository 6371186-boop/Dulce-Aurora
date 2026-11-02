CREATE TABLE IF NOT EXISTS usuarios(id SERIAL PRIMARY KEY,username VARCHAR(50) UNIQUE NOT NULL,password_hash TEXT NOT NULL,rol VARCHAR(20) NOT NULL DEFAULT 'admin',creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS clientes(id SERIAL PRIMARY KEY,nombre VARCHAR(120) NOT NULL,telefono VARCHAR(30) UNIQUE NOT NULL,direccion TEXT,creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS categorias(id SERIAL PRIMARY KEY,nombre VARCHAR(80) UNIQUE NOT NULL,creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS productos(id SERIAL PRIMARY KEY,nombre VARCHAR(120) NOT NULL,descripcion TEXT,precio NUMERIC(10,2) NOT NULL CHECK(precio>=0),imagen_url TEXT,categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,activo BOOLEAN NOT NULL DEFAULT true,creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS pedidos(id SERIAL PRIMARY KEY,cliente_id INT NOT NULL REFERENCES clientes(id),total NUMERIC(10,2) NOT NULL,estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK(estado IN('Pendiente','En preparación','Listo','Entregado','Cancelado')),creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS detalles_pedido(id SERIAL PRIMARY KEY,pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,cantidad INT NOT NULL CHECK(cantidad>0),precio_unitario NUMERIC(10,2) NOT NULL);
CREATE TABLE IF NOT EXISTS encargos_personalizados(id SERIAL PRIMARY KEY,cliente_id INT NOT NULL REFERENCES clientes(id),tamano VARCHAR(50) NOT NULL,porciones INT NOT NULL,sabor VARCHAR(80) NOT NULL,relleno VARCHAR(80),cobertura VARCHAR(80),diseno TEXT,dedicatoria TEXT,fecha_entrega DATE NOT NULL,observaciones TEXT,imagen_url TEXT,estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK(estado IN('Pendiente','En preparación','Listo','Entregado','Cancelado')),creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS pagos(id SERIAL PRIMARY KEY,pedido_id INT NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,metodo VARCHAR(20) NOT NULL CHECK(metodo IN('Efectivo','Tarjeta','Transferencia')),monto NUMERIC(10,2) NOT NULL,estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK(estado IN('Pendiente','Pagado','Rechazado')),creado TIMESTAMPTZ NOT NULL DEFAULT now(),actualizado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS facturas(id SERIAL PRIMARY KEY,numero VARCHAR(20) UNIQUE NOT NULL,pedido_id INT NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE CASCADE,creado TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_cat ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido ON detalles_pedido(pedido_id);
INSERT INTO categorias(nombre) VALUES('Pasteles'),('Cupcakes'),('Galletas'),('Postres'),('Tartas'),('Productos especiales') ON CONFLICT DO NOTHING;

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS codigo_generacion UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS tipo_dte VARCHAR(2) NOT NULL DEFAULT '01';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS referencia VARCHAR(30);
