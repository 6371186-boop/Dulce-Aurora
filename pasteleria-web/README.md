# Dulce Aurora – Pastelería web
## Local
1. `npm install`
2. Crea tu proyecto en https://neon.tech y copia la *connection string* (con `?sslmode=require`).
3. `cp .env.example .env` y completa DATABASE_URL, SESSION_SECRET, ADMIN_USER, ADMIN_PASSWORD.
4. `npm run db:init` (crea tablas y el admin con bcrypt) → `npm start` → http://localhost:3000 (admin: /admin.html)
## Render
1. Sube a GitHub (`.env` está en .gitignore).
2. Render → New Web Service → repo. Build: `npm install`. Start: `npm start`.
3. Variables: DATABASE_URL, SESSION_SECRET, NODE_ENV=production (PORT lo pone Render).
4. Ejecuta `npm run db:init` una vez (Shell de Render, o localmente apuntando a la misma DATABASE_URL, con ADMIN_USER/ADMIN_PASSWORD).
5. Verifica `/api/health`.
## Acceso admin
El servidor crea las tablas y sincroniza el admin al iniciar, con ADMIN_USER y ADMIN_PASSWORD (también en Render, sin shell). Si cambias ADMIN_PASSWORD y reinicias, la contraseña se actualiza. En local usa NODE_ENV=development (con production la cookie segura no funciona en http).
## Inicio con un solo comando
`npm run iniciar` (instala dependencias, crea .env la primera vez y arranca el servidor).
