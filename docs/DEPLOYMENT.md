# Deployment notes

## Backend (Render / Railway / any Node host)
1. Provision a managed MySQL 8 database (PlanetScale-compatible MySQL, Railway MySQL, AWS RDS, ...).
2. Set environment variables from `backend/.env.example`:
   `NODE_ENV=production`, `DB_*`, `JWT_SECRET` (long random), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL=https://your-frontend.example`.
3. Build command: `npm install` — Start command: `npm start` (root dir `backend`).
4. Health check: `GET /api/health`.

## Frontend (Vercel / Netlify / Cloudflare Pages)
1. Root directory `frontend`, build command `npm run build`, output `dist`.
2. Set `VITE_API_URL=https://your-api.example/api` at build time.
3. Add an SPA fallback so deep links work: rewrite all paths to `/index.html`
   (Netlify: `/* /index.html 200` in `public/_redirects`; Vercel: rewrite in `vercel.json`).

## Production checklist
- [ ] Strong `JWT_SECRET`, changed admin password
- [ ] HTTPS everywhere, CORS limited to your frontend origin
- [ ] Switch from `sequelize.sync` to migrations
- [ ] Real payment gateway (see RAZORPAY.md) and image storage (Cloudinary)
