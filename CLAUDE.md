# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Car Workshop Management System — Laravel 12 REST API backend + React 19 frontend for managing customers, vehicles, appointments, work orders, and invoices.

- **Backend:** PHP 8.2+ / Laravel 12
- **Frontend:** React 19 (Vite), JavaScript (.jsx)
- **Database:** SQLite by default (MySQL/PostgreSQL supported)
- **API Style:** RESTful JSON API authenticated via Laravel Sanctum Bearer tokens
- **Test Runners:** PHPUnit (backend)
- **Code Style:** PSR-12 (PHP), Prettier + ESLint (JS/JSX)

---

## Development Commands

### Backend (from `backend/`)

```bash
composer run setup      # First-time setup: install deps, generate .env, migrate, build
composer run dev        # Start all dev processes concurrently (server, queue, logs, vite)
composer run test       # Clear config cache + run PHPUnit
php artisan test --filter TestClassName  # Run a single test class
php artisan migrate     # Run pending migrations
php artisan migrate:fresh --seed  # Reset and reseed DB
```

### Frontend (from `frontend/`)

```bash
npm run dev     # Vite dev server on port 5173 (proxies /api → localhost:8000)
npm run build   # Production build
npm run lint    # ESLint check
```

---

## Architecture

### API Structure

All routes live under `/api/v1`. Public: `POST /login`. Protected (Bearer token): `POST /logout`, `GET /me`, and full REST resources.

Backend controllers follow the pattern: `app/Http/Controllers/Api/V1/`. Form validation uses dedicated Request classes (`app/Http/Requests/`). Responses use Resource classes (`app/Http/Resources/`).

### Authentication Flow

1. `POST /login` returns `{ token, user }` — token stored in `localStorage`
2. `frontend/src/api/client.js` Axios instance auto-attaches `Authorization: Bearer <token>` and redirects to `/login` on 401
3. Zustand `useAuthStore` (`src/store/authStore.js`) holds `{ user, token, isAuthenticated }` and is the single source of truth for auth state
4. `<PrivateRoute>` in `App.jsx` guards all routes under `/`

### Domain Models & Relationships

```
Customer → hasMany Vehicle, WorkOrder, Appointment, Invoice
Vehicle  → belongsTo Customer; hasMany WorkOrder, Appointment
WorkOrder → belongsTo Customer, Vehicle, User (assigned_to); hasMany WorkOrderLine; hasOne Invoice
WorkOrderLine → belongsTo WorkOrder; belongsTo Service | Part; computed lineTotal attribute
Invoice  → belongsTo WorkOrder, Customer
```

`Customer`, `Vehicle`, and `WorkOrder` use `SoftDeletes`.

### Adding New Resources

Follow the existing customer pattern:
1. Migration + Model in `backend/app/Models/`
2. Form Request classes in `backend/app/Http/Requests/<Resource>/`
3. Service class in `backend/app/Services/`
4. API Resource in `backend/app/Http/Resources/`
5. Controller in `backend/app/Http/Controllers/Api/V1/`
6. Route registration in `backend/routes/api.php` inside the `auth:sanctum` group
7. API module in `frontend/src/api/`
8. Page(s) in `frontend/src/pages/` wired into `App.jsx`

---

## Project Structure Reference

```
project-root/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/  # Thin controllers only
│   │   │   ├── Requests/            # Form Request validation
│   │   │   └── Resources/           # API Resource transformers
│   │   ├── Services/                # All business logic
│   │   ├── Models/                  # Eloquent models
│   │   └── Jobs/                    # Queued jobs
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── tests/
│       ├── Feature/                 # API endpoint tests
│       └── Unit/                    # Service/helper tests
├── frontend/
│   └── src/
│       ├── api/                     # API call functions
│       ├── components/              # Reusable UI components
│       │   ├── layout/
│       │   └── ui/
│       ├── hooks/                   # Custom React hooks
│       ├── pages/                   # Route-level pages
│       └── store/                   # Global state (Zustand)
└── docs/
    └── api.md                       # API documentation
```

---

## Environment

Copy `backend/.env.example` to `backend/.env` and run `php artisan key:generate`. The only required frontend env var is `VITE_API_URL` (defaults to `http://localhost:8000/api/v1` in `frontend/.env`).

---

## Global Rules (All Agents)

- Never commit `.env` files
- Never use `dd()` or `console.log()` in production code
- Never skip validation — all input must be validated
- Never expose stack traces to API consumers
- Always use environment-specific config values
- Git commits must follow Conventional Commits format:
  - `feat: add user registration endpoint`
  - `fix: resolve N+1 query in orders list`
  - `test: add feature tests for auth flow`
  - `docs: update API reference for payments`
