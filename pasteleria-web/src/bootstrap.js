const fs = require('fs'), path = require('path'), bcrypt = require('bcrypt'), pool = require('./db');
// Crea tablas y sincroniza el admin con ADMIN_USER / ADMIN_PASSWORD (variables de entorno)
module.exports = async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));

  if (!(await pool.query('SELECT 1 FROM productos LIMIT 1')).rowCount) {
    const ej = [['Pastel Tres Leches','Bizcocho esponjoso bañado en tres leches con crema chantilly.',12.5,'p1','Pasteles'],['Chocolate Intenso','Capas de bizcocho de cacao con ganache de chocolate semiamargo.',14.95,'p2','Pasteles'],['Red Velvet','Clásico terciopelo rojo con frosting de queso crema.',15.5,'p3','Pasteles'],['Cupcakes de Vainilla x6','Seis cupcakes con crema de vainilla y cereza.',8.95,'p4','Cupcakes'],['Cupcakes de Fresa x6','Seis cupcakes con buttercream de fresa natural.',9.5,'p5','Cupcakes'],['Galletas con Chips x12','Docena de galletas crujientes con chips de chocolate.',6.5,'p6','Galletas'],['Tarta de Frutas','Base de mantequilla, crema pastelera y frutas frescas.',11.95,'p7','Tartas'],['Brazo Gitano de Caramelo','Rollo suave relleno de crema y caramelo artesanal.',9.95,'p8','Postres']];
    for (const [n, d, pr, img, c] of ej) await pool.query('INSERT INTO productos(nombre,descripcion,precio,imagen_url,categoria_id) VALUES($1,$2,$3,$4,(SELECT id FROM categorias WHERE nombre=$5))', [n, d, pr, '/images/' + img + '.svg', c]);
    console.log('Productos de ejemplo creados.');
  }
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USER && ADMIN_PASSWORD) {
    await pool.query('INSERT INTO usuarios(username,password_hash) VALUES($1,$2) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,actualizado=now()', [ADMIN_USER.trim(), await bcrypt.hash(ADMIN_PASSWORD, 12)]);
    console.log('Admin sincronizado:', ADMIN_USER);
  } else console.warn('Define ADMIN_USER y ADMIN_PASSWORD para poder entrar al panel.');
};
