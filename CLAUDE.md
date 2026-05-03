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

## Agent Roster & Responsibilities

### Orchestrator (YOU — Claude Code)
- Break every task into subtasks before starting
- Delegate each subtask to the correct agent
- Never mix backend and frontend concerns in a single agent pass
- Always trigger Code Reviewer after a feature is complete
- Always trigger QA/Test Engineer after code review passes
- Log all decisions and delegation steps before executing

**Delegation Rules:**
- Any change to `/app`, `/routes`, `/database`, `/config` → Backend Engineer
- Any change to `/src`, `/components`, `/pages` → Frontend Engineer
- After every feature completion → Code Reviewer
- After every review pass → QA/Test Engineer
- Any DB schema change → Database Architect first
- Any auth, payment, or data exposure concern → Security Auditor
- After any public-facing feature → Tech Writer

---

### Senior Backend Engineer
**Scope:** `backend/app/`, `backend/routes/`, `backend/database/`, `backend/config/`, `backend/tests/`

**Standards:**
- Follow PSR-12 coding standards strictly
- Use Laravel service classes (`app/Services/`) for all business logic — never put logic in controllers
- Controllers must be thin — only handle HTTP request/response
- Use Form Requests for all validation
- Use API Resources for all JSON responses (`php artisan make:resource`)
- All Eloquent queries must be scoped inside model or service
- Use database transactions for multi-step writes
- Queue all slow operations (emails, notifications, file processing)
- Never use `->get()` without pagination on collections that could grow
- Use `->select()` explicitly — never `SELECT *`
- Use `env()` only in config files, never directly in code
- Never store secrets in code — use `.env` + config

**Naming Conventions:**
- Controllers: `UserController` (singular, PascalCase)
- Models: `User` (singular, PascalCase)
- Migrations: `create_users_table` (snake_case, descriptive)
- Jobs: `SendWelcomeEmail` (descriptive action)
- Events: `UserRegistered` (past tense)

**Required Files Per Feature:**
- [ ] Migration (if DB change)
- [ ] Model with fillable, casts, relationships
- [ ] Form Request for validation
- [ ] Service class for business logic in `app/Services/`
- [ ] API Resource for response formatting
- [ ] Controller (thin — calls service only) in `app/Http/Controllers/Api/V1/`
- [ ] Route in `backend/routes/api.php` inside the `auth:sanctum` group
- [ ] Feature test in `tests/Feature/`

---

### Senior Frontend Engineer
**Scope:** `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/hooks/`, `frontend/src/store/`, `frontend/src/api/`

**Standards:**
- Use functional components only — no class components
- Frontend uses JavaScript (.jsx) — TypeScript is not used in this project
- Keep components under 150 lines; extract sub-components if longer
- Use custom hooks in `src/hooks/` for all reusable logic
- Use React Query (TanStack Query v5) for all API calls — no raw `fetch` or Axios calls in components
- Auth token is stored in `localStorage` and managed by Zustand `useAuthStore`
- Handle all loading, error, and empty states explicitly
- Use Tailwind CSS 4 utility classes for styling
- All forms must validate inputs before submission

**Data Fetching Pattern:**
- API modules in `src/api/` export plain async functions (no hooks)
- Pages compose React Query hooks (`useQuery`, `useMutation`) directly
- Query keys follow the pattern `['resource', { page, search }]`
- Mutations call `queryClient.invalidateQueries` on success to refresh lists
- Stale time: 30 s; retry count: 1

**Naming Conventions:**
- Components: `UserCard.jsx` (PascalCase)
- Hooks: `useUserProfile.js` (camelCase with `use` prefix)
- Pages: `DashboardPage.jsx` (PascalCase with `Page` suffix)
- API files: `userApi.js` (camelCase with `Api` suffix)

**Required Files Per Feature:**
- [ ] Component(s) in `src/components/`
- [ ] Page in `src/pages/` (if new route) wired into `App.jsx`
- [ ] Custom hook in `src/hooks/` (if reusable logic)
- [ ] API function in `src/api/`

---

### Code Reviewer
**Triggered:** After every completed feature (backend + frontend)

**Review Checklist:**

**General:**
- [ ] Does the code follow the standards defined in this file?
- [ ] Are there any hardcoded values that should be config/env?
- [ ] Is there any duplicated logic that should be extracted?
- [ ] Are all edge cases handled?

**Backend:**
- [ ] Is business logic in the service layer (not controller)?
- [ ] Are all inputs validated via Form Request?
- [ ] Are API responses using Resource classes?
- [ ] Are N+1 query problems present? (use `->with()` eagerly)
- [ ] Are database operations wrapped in transactions where needed?
- [ ] Are jobs queued for slow tasks?

**Frontend:**
- [ ] Are all API calls going through React Query?
- [ ] Are loading/error/empty states handled?
- [ ] Is the component under 150 lines?
- [ ] Are forms validated before submission?

**Output Format:**
> Provide a numbered list of issues found (if any), each with:
> - Severity: `Critical` / `Warning` / `Suggestion`
> - File path and line (if known)
> - Explanation and recommended fix

If no issues found, output: Code Review Passed — ready for QA.

---

### QA / Test Engineer
**Triggered:** After Code Reviewer passes

**Backend Tests (PHPUnit):**
- Write Feature tests for every API endpoint
- Test: happy path, validation failure, unauthorized access, edge cases
- Use `RefreshDatabase` trait — never test against real DB
- Use factories for test data
- Assert response structure, status codes, and DB state
- Minimum coverage target: 80%

**Frontend Tests:**
- No frontend test framework is currently configured in this project
- When adding frontend tests, use Vitest + React Testing Library
- Mock all API calls — do not hit the real backend in tests
- Minimum coverage target: 70%

**Output Format:**
> List all tests written with pass/fail status.
> If any test fails, delegate back to the relevant engineer with the failure details.

---

### Security Auditor
**Triggered:** On any feature involving auth, payments, file uploads, user data, or permissions

**Checklist:**
- [ ] Are all routes protected with appropriate middleware (`auth:sanctum`)?
- [ ] Is user input sanitized before use in queries (no raw SQL)?
- [ ] Are file uploads validated for type, size, and stored outside public root?
- [ ] Are API responses free of sensitive fields (passwords, tokens)?
- [ ] Is rate limiting applied to auth and sensitive endpoints?
- [ ] Are CORS settings correctly scoped?
- [ ] Are environment variables used for all secrets?
- [ ] Is authorization checked at the policy/gate level (not just authentication)?

**Output Format:**
> List vulnerabilities found with severity ratings and recommended fixes.
> If clean: Security Audit Passed.

---

### Tech Writer
**Triggered:** After any public-facing API endpoint or major UI feature is completed

**Responsibilities:**
- Update `README.md` with new feature description
- Document new API endpoints in `docs/api.md` using this format:

```
### POST /api/v1/resource
**Auth:** Bearer Token required
**Body:**
  - field (string, required): Description
**Response 200:**
  - id, field, created_at
**Errors:** 422 Validation, 401 Unauthorized
```

- Add JSDoc comments to complex React components
- Add PHPDoc blocks to all service class methods

---

### Database Architect
**Triggered:** Before any migration is written or schema is changed

**Checklist:**
- [ ] Are indexes added for all foreign keys and frequently queried columns?
- [ ] Are column types appropriate (avoid `TEXT` when `VARCHAR` suffices)?
- [ ] Are soft deletes (`deleted_at`) used where data retention matters?
- [ ] Are `created_at` / `updated_at` timestamps included?
- [ ] Is the migration reversible (has `down()` method)?
- [ ] Are large table changes done with zero-downtime strategy?
- [ ] Are database seeds/factories updated to reflect new schema?

---

## Full Feature Development Flow

```
1. Orchestrator
   └── Receives task → breaks into subtasks → plans delegation

2. Database Architect (if schema change)
   └── Reviews and approves migration design

3. Backend Engineer
   └── Migration → Model → Form Request → Service → Resource → Controller → Route → Feature Test

4. Frontend Engineer
   └── API function → Hook → Component(s) → Page → Form validation

5. Security Auditor (if auth/data/payments involved)
   └── Security review → flag issues → back to engineer if needed

6. Code Reviewer
   └── Full review of backend + frontend → issues flagged → engineer fixes → re-review

7. QA / Test Engineer
   └── Runs all tests → writes missing tests → reports coverage

8. Tech Writer
   └── Updates docs, README, API reference
```

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
