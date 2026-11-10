# 🅿️ Parkora — "Airbnb for Parking"

Parkora is a full-stack parking marketplace MVP. Owners list their parking spots (address, price, timings, photos), and customers search, book, and pay for them — like Airbnb, but for parking spaces.

> **Stack:** Node.js · Express · Sequelize · MySQL  |  React 18 · Vite · Tailwind CSS

## ✨ Features

- **Authentication** — JWT-based signup/login with role-based access (`CUSTOMER`, `OWNER`, `ADMIN`)
- **Parking listings** — owners can create, update, pause and delete their parking spaces
- **Search & filters** — by location, category, price, date/time availability, distance ("near me") and sort order
- **Bookings** — create bookings (with slot-conflict protection), view your own, cancel; owners see all bookings on their listings
- **Payments** — Razorpay-ready flow (currently a "Pay Now" stub that simulates a successful payment and confirms the booking; cancelling refunds it)
- **Reviews & ratings** — customers who booked & paid can review a space
- **Favorites / wishlist** — save parking spots for later
- **Vehicles** — manage your vehicles and attach one to a booking
- **Notifications** — in-app notifications with unread badge
- **Dashboards** — separate dashboards for customers, owners and admins
- **Admin panel** — view all users, listings and bookings; enable/disable users and listings
- **Interactive maps** — Leaflet + OpenStreetMap for browsing and for picking a listing's location

## 🏗️ Tech Stack

**Backend** — Node.js 20+, Express 4, Sequelize 6 (MySQL 8), JWT (`jsonwebtoken`) + `bcryptjs`, Zod validation, Helmet, CORS, rate limiting, `node:test` + Supertest

**Frontend** — React 18 + Vite, Tailwind CSS, React Router, Axios, Leaflet / React-Leaflet, React Toastify

**Payments:** Razorpay (stubbed for now; see [docs/RAZORPAY.md](docs/RAZORPAY.md)) · **Images:** Cloudinary (planned; listings accept image URLs today)

## 📂 Project Structure

```
parkora_mvp/
├── backend/                  # Express REST API
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── config/           # env, DB connection, admin seeder
│   │   ├── controllers/      # request handlers + Zod schemas
│   │   ├── middleware/       # auth/roles, validation, error handling
│   │   ├── models/           # Sequelize models & associations
│   │   ├── routes/           # route table
│   │   ├── services/         # notifications, search/availability helpers
│   │   ├── seeds/            # demo data
│   │   ├── app.js            # Express app
│   │   └── server.js         # DB sync + listen
│   └── tests/                # API integration tests (SQLite in-memory)
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── api/              # Axios instance
│       ├── components/       # Navbar, ParkingCard, MapView, ...
│       ├── context/          # Auth context
│       └── pages/            # Home, Login, Signup, Dashboards, ...
├── docs/                     # API reference, deployment, Razorpay upgrade
└── .github/workflows/ci.yml  # CI: backend tests + frontend build
```

## 🔌 API Overview

All routes are prefixed with `/api`. Full details in [docs/API.md](docs/API.md).

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | `signup`, `login` |
| Users | `/api/users` | `me` (get/update profile) |
| Parking listings | `/api/parking` | CRUD + `my` (owner's own listings) |
| Search | `/api/parking/search` | Filtered search |
| Bookings | `/api/bookings` | Create, `my`, `owner`, `:id/cancel` |
| Payments | `/api/payments` | `pay-now/{bookingId}`, `my` |
| Reviews | `/api/reviews` | Create, `parking/{id}` |
| Favorites | `/api/favorites` | Add, remove, list own |
| Vehicles | `/api/vehicles` | Create, list own, delete |
| Notifications | `/api/notifications` | List own, mark read |
| Dashboards | `/api/customer/dashboard`, `/api/owner/dashboard`, `/api/admin/dashboard` | Role-specific stats |
| Admin | `/api/admin` | Users, listings, bookings overview + toggles |

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 LTS or newer |
| MySQL | 8.x |

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit DB_USER / DB_PASSWORD / JWT_SECRET
npm install
npm run dev                 # http://localhost:8080
```

Create the database first (or let the server do nothing and create it yourself):

```sql
CREATE DATABASE parkora_db CHARACTER SET utf8mb4;
```

Tables are created automatically on first start, and an admin account is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (default `admin@parkora.com` / `Admin@12345` — **change it**).

Optional demo data (owner, customer and 5 listings across Indian cities):

```bash
npm run seed
# owner@parkora.com / Password@123   customer@parkora.com / Password@123
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8080/api
npm install
npm run dev                 # http://localhost:5173
```

### One-command dev (from the repo root)

```bash
npm install                 # installs `concurrently`
npm run install:all
npm run dev                 # API + web together
```

### Tests

```bash
cd backend && npm test      # runs against an in-memory SQLite DB, no MySQL needed
```

## ⚠️ Before deploying

- Set `JWT_SECRET` to your own long random string (the server refuses to start in production with the default).
- Change the seeded admin password.
- Keep `DB_SYNC=none` and move to proper migrations (e.g. `sequelize-cli` or Umzug) when your schema starts changing.
- Set `CLIENT_URL` to your deployed frontend origin (comma-separated for several) so CORS allows it.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🗺️ Roadmap

- [ ] Full Razorpay payment integration (currently stubbed — see [docs/RAZORPAY.md](docs/RAZORPAY.md))
- [ ] Cloudinary image uploads for parking listings
- [ ] Enforce daily availability window (`availableFrom`/`availableTo`) on bookings
- [ ] Deployment pipeline

## 👤 Author

**Prakhar Chaudhary**

- GitHub: [@Prakhar3518](https://github.com/Prakhar3518)
- Email: prakharchaudhary0302@gmail.com

## 📄 License

MIT — open for educational and portfolio use. See [LICENSE](LICENSE).
