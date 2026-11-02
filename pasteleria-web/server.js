require('dotenv').config();
const app = require('./src/app');
require('./src/bootstrap')().then(() => app.listen(process.env.PORT || 3000, () => console.log('Servidor activo')))
  .catch(e => { console.error('Error al iniciar (revisa DATABASE_URL):', e.message); process.exit(1); });
