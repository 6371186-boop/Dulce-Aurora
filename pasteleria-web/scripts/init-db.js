require('dotenv').config();
require('../src/bootstrap')().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
