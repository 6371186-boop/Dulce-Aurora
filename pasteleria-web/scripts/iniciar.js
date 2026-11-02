// Un solo comando: npm run iniciar  (instala dependencias si faltan, crea .env si falta y arranca)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.join(__dirname, '..');
process.chdir(root);
if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.example', '.env');
  console.log('\nSe creó el archivo .env. Ábrelo, completa DATABASE_URL, SESSION_SECRET, ADMIN_USER y ADMIN_PASSWORD, y vuelve a ejecutar: npm run iniciar\n');
  process.exit(0);
}
if (!fs.existsSync('node_modules')) execSync('npm install', { stdio: 'inherit' });
require('../server');
