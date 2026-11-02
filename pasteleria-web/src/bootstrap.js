const fs = require('fs'), path = require('path'), bcrypt = require('bcrypt'), pool = require('./db');
// Crea tablas y sincroniza el admin con ADMIN_USER / ADMIN_PASSWORD (variables de entorno)
module.exports = async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USER && ADMIN_PASSWORD) {
    await pool.query('INSERT INTO usuarios(username,password_hash) VALUES($1,$2) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,actualizado=now()', [ADMIN_USER.trim(), await bcrypt.hash(ADMIN_PASSWORD, 12)]);
    console.log('Admin sincronizado:', ADMIN_USER);
  } else console.warn('Define ADMIN_USER y ADMIN_PASSWORD para poder entrar al panel.');
};
