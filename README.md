# myexpencess — Personal Expense Tracker

A full-stack expense tracker built with **Next.js App Router, TypeScript, Tailwind CSS 4, MongoDB, Mongoose, Zod and bcryptjs**. This repository follows the supplied Product Requirements Package v1.1. It is deliberately organized so a new developer can trace a request from the UI to validation, route handler, database model and response.

## 1. Features

- Signup, login and logout with a signed, HTTP-only, seven-day session cookie.
- User-owned custom categories with case-insensitive unique names. Categories containing expenses cannot be deleted.
- Expense create, edit and delete; title search, category filter and 10-item pagination.
- Monthly dashboard with total, transaction count, category breakdown and latest five expenses.
- Responsive desktop sidebar and mobile bottom navigation.
- Server and client validation, empty/loading/error states, metadata and a 404 page.

> INR only. Charts, CSV/PDF export, password reset, email verification, budgets and reminders are outside v1 scope.

## 2. Requirements

- Node.js 20.9+ (use a current LTS release).
- MongoDB local instance or MongoDB Atlas database.
- npm.

## 3. Run locally

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env.local

# 3. Set MONGODB_URI and SESSION_SECRET in .env.local
# SESSION_SECRET must be at least 32 characters. Generate one with:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Start the development server
npm run dev
```

Open http://localhost:3000. New accounts start with **no categories**. Create a category before adding an expense.

Before deployment run `npm run typecheck`, `npm run lint` and `npm run build`. Configure the same environment variables in the hosting provider. Use an HTTPS origin in production.

## 4. Architecture overview

```text
src/
├── app/
│   ├── (auth)/                 # Public login and signup route group
│   ├── (app)/                  # Authenticated application route group
│   ├── api/                    # HTTP API route handlers
│   ├── globals.css             # Tailwind import + global design tokens
│   ├── layout.tsx              # Root HTML, global CSS and SEO defaults
│   └── not-found.tsx            # App-wide 404 screen
├── components/                 # Reusable UI and client-side feature components
├── lib/                        # Infrastructure and shared server/client helpers
│   ├── api.ts                  # Standard API error responses
│   ├── db.ts                   # Cached Mongoose connection
│   ├── format.ts               # INR/date formatting helpers
│   ├── session.ts              # Cookie signing, verification and user lookup
│   └── validation.ts            # Shared Zod request schemas
└── models/                     # Mongoose schemas and indexes
```

### Why these boundaries?

- **Route handlers** own HTTP concerns: parse input, authenticate, call persistence operations, choose status codes and return JSON.
- **Zod schemas** are the validation contract. Client checks improve feedback, but the API always validates again because browser input is untrusted.
- **Mongoose models** define persistent data shape and database-level constraints. The compound unique category index prevents race-condition duplicates for the same user, regardless of letter case.
- **Session helpers** centralize cookie policy and token verification rather than repeating security-sensitive code.
- **Components** own presentation and interaction. They call API endpoints and do not connect to MongoDB.

## 5. Authentication flow

1. Signup validates name/email/password on the server. Email is trimmed and lowercased.
2. bcrypt hashes the password with cost factor 12. Only `passwordHash` is persisted.
3. A signed token containing the user ID and expiry is placed in an `httpOnly`, `sameSite=lax` cookie. `secure` is enabled in production.
4. Protected route-group layout calls `requireUser()`. API handlers independently call `getCurrentUser()`; hiding a page is not API security.
5. Logout clears the cookie. A token with a bad signature or expired timestamp is rejected.

The token is HMAC-SHA256 signed using `SESSION_SECRET`. This is a small first-party session implementation using Node's built-in crypto module, avoiding an additional authentication dependency. Rotating the secret invalidates all active sessions.

## 6. Data model and ownership

- **User**: `name`, normalized unique `email`, `passwordHash`.
- **Category**: `userId`, `name`, `isDefault` (always false for v1). Compound unique index `{ userId, name }` with English collation strength 2.
- **Expense**: `userId`, `title`, `amount`, `categoryId`, `date`. Expense stores a category reference, not a copied category name, so renaming a category updates its displayed name automatically.

Every read, update and delete for a user-owned record must include the authenticated `userId` in its database filter. For another user's or a missing resource, the API returns **404**, not 403, so it does not reveal whether the ID exists.

## 7. API reference

All errors use `{ "error": "message" }`.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| POST | `/api/auth/signup` | Create account and session | 201 |
| POST | `/api/auth/login` | Verify credentials and create session | 200 |
| POST | `/api/auth/logout` | Clear session | 200 |
| GET, POST | `/api/categories` | List categories / create category | 200, 201 |
| PUT, DELETE | `/api/categories/:id` | Rename / delete empty category | 200 |
| GET, POST | `/api/expenses` | Paginated list / create expense | 200, 201 |
| PUT, DELETE | `/api/expenses/:id` | Update / delete expense | 200 |
| GET | `/api/dashboard?month=YYYY-MM` | Monthly totals and recent expenses | 200 |

Expense list query parameters: `page`, `limit` (capped at 10), `categoryId`, `search`. Default sorting is date descending.

### Status code reasoning

- **400**: malformed or invalid input.
- **401**: no valid session or invalid login credentials. Login deliberately uses the same message for unknown email and wrong password.
- **404**: record missing or owned by someone else.
- **409**: duplicate email/category name or category deletion blocked by existing expenses.
- **500**: unexpected server/database failure.

## 8. Validation rules

| Field | Rule |
|---|---|
| User name | 2–50 characters |
| Email | Valid email; stored lowercase and unique |
| Password | At least 6 characters; bcrypt hash only |
| Category name | 1–30 characters; unique per user, case-insensitive |
| Expense title | 1–80 characters after trimming |
| Amount | 0.01–1,000,000; rounded to 2 decimals |
| Category ID | Must belong to the signed-in user |
| Expense date | Required; future dates rejected by server |

## 9. Important implementation notes / production hardening

This is a learning-quality, runnable v1 implementation, not a claim of a completed security audit. Before a public production launch, add and test:

1. Rate limiting for login/signup (the PRD marks five-failure login throttling as Should).
2. Automated unit/integration/e2e tests, especially cross-user access and category deletion races.
3. A transaction or equivalent concurrency protection around category deletion and expense creation. The current API checks for existing expenses before deleting; high-concurrency systems should make this operation atomic.
4. Stronger operational logging/monitoring and database backup policy. Never log passwords, cookies or session tokens.
5. Consider a server-side session store with revocation if immediate per-session logout/revocation across devices is required. This signed stateless cookie expires in seven days; clearing it logs out the current browser.
6. Add CSRF defenses if the deployment's cookie/origin model changes; keep same-site cookie settings and validate trusted origins for state-changing requests.
7. Review pagination query bounds and add a maximum page size policy if API consumers expand.

## 10. Common learning path through the code

1. Start at `src/app/(auth)/signup/page.tsx` and `src/components/AuthForm.tsx`.
2. Follow the request to `src/app/api/auth/signup/route.ts`.
3. Inspect `src/lib/validation.ts`, `src/lib/db.ts`, `src/models/User.ts` and `src/lib/session.ts`.
4. For a feature, trace `src/components/Categories.tsx` → `/api/categories` → `Category.ts`.
5. Trace expense listing from `Expenses.tsx` to `/api/expenses` and observe how `userId` is applied to the query.
6. Trace dashboard aggregation from `Dashboard.tsx` to `/api/dashboard`.

## 11. Scripts

- `npm run dev` — local development.
- `npm run typecheck` — TypeScript validation.
- `npm run lint` — ESLint.
- `npm run build` — production build.
- `npm start` — run the production server after building.

## 12. Source of truth

Product behavior follows **myexpencess Product Requirements Package v1.1**. Where the package defines behavior, prefer it over assumptions made from the UI. If a feature is not listed in v1 scope, do not silently add it as a requirement.

For a deeper request-flow and design explanation, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
