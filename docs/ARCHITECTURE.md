# Architecture Guide

This document explains the reasoning behind the folder structure and the path data takes through myexpencess. Read it alongside the root README.

## 1. High-level request flow

```text
Browser UI (React client component)
        |
        | fetch('/api/...')
        v
Next.js Route Handler (HTTP boundary)
        |
        +--> getCurrentUser() --> signed HTTP-only cookie --> User lookup
        |
        +--> Zod schema --> reject invalid/untrusted payloads
        |
        +--> Mongoose model/query --> MongoDB
        |
        v
JSON response --> component updates local state --> UI re-renders
```

The browser never imports a Mongoose model and never talks directly to MongoDB. Database credentials and session-signing secrets remain on the server.

## 2. Route groups are not URL segments

`(auth)` and `(app)` are Next.js route groups. Parentheses organize layouts without becoming part of the URL:

- `src/app/(auth)/login/page.tsx` renders `/login`.
- `src/app/(app)/dashboard/page.tsx` renders `/dashboard`.
- `src/app/(app)/layout.tsx` loads the authenticated user and wraps pages in `AppShell`.

The protected layout is a user-experience and server-rendering gate. Every API handler still checks the session independently. Never assume a hidden navigation link or protected page is sufficient authorization.

## 3. Authentication lifecycle

### Signup

1. `AuthForm` sends name, email and password to `POST /api/auth/signup`.
2. The handler parses the body with `signupSchema`.
3. Email is normalized to lowercase; `bcrypt.hash(password, 12)` creates the only password representation stored.
4. MongoDB's unique email index is the final duplicate guard (including concurrent signup requests).
5. `setSession()` signs `{ sub, exp }` with HMAC-SHA256 and sets a seven-day HTTP-only cookie.
6. The client navigates to `/dashboard`.

### Subsequent authenticated request

1. Browser automatically includes the cookie for same-site requests.
2. `getCurrentUser()` verifies the HMAC using constant-time signature comparison and checks expiry.
3. It loads only the user's public fields from MongoDB.
4. The route handler uses that authenticated user ID in all ownership-sensitive queries.

The token is signed, not encrypted. Do not put passwords, email addresses, or private expense data inside it. Rotating `SESSION_SECRET` invalidates existing tokens.

## 4. Ownership and data isolation

Use this pattern for every private resource:

```ts
const record = await Expense.findOne({
  _id: expenseId,
  userId: user._id,
});
```

Do not fetch by `_id` alone and check ownership later. Scoping in the database query reduces accidental data exposure and supports the PRD's 404 behavior for both missing records and records owned by another user.

When an expense is created or updated, the category lookup includes both `_id` and `userId`. This prevents a user from attaching an expense to another account's category by submitting a guessed ID.

## 5. Category and expense relationship

```text
User 1 -------- many Category
User 1 -------- many Expense
Category 1 ---- many Expense (through Expense.categoryId)
```

Expense stores `categoryId`, not a category-name snapshot. The UI populates the current category name when listing expenses. Therefore a category rename appears consistently without rewriting every expense document.

The category compound unique index is scoped to `{ userId, name }` and uses collation strength 2, making `Food` and `food` duplicates for one user while allowing different users to each create a `Food` category.

A category with expenses is not deletable in v1. The API checks the expense count and returns 409 Conflict. In a high-concurrency production deployment, make this check-and-delete atomic with a transaction or a carefully designed constraint/locking strategy so an expense cannot be created between the count and deletion.

## 6. Validation boundaries

There are two validation layers for different reasons:

- UI constraints (`required`, `maxLength`, numeric `min`/`max`, date `max`) provide fast feedback.
- Zod validation in route handlers is authoritative because HTTP requests can be forged or sent without the UI.

Mongoose schema validation and MongoDB indexes are additional persistence safeguards. They do not replace authorization or Zod request validation.

## 7. Dashboard aggregation

`GET /api/dashboard?month=YYYY-MM` calculates a half-open date interval:

- `start`: first day of selected month, inclusive.
- `end`: first day of following month, exclusive.

The aggregation groups matching, user-scoped expenses by category and calculates totals. A separate query fetches the latest five expenses for that same user and month. Percentages are calculated from the month total; when total is zero, the API avoids division by zero.

## 8. Where to make common changes

| Change | File(s) to inspect |
|---|---|
| Add a field to signup | `AuthForm.tsx`, `validation.ts`, User model, signup route |
| Change password/session policy | `session.ts`, auth route handlers, README |
| Add a category field | Category model, category Zod schema, category route handlers, Categories component |
| Add an expense field | Expense model, expense Zod schema, expense routes, ExpenseModal, list/dashboard mapping |
| Change monthly dashboard math | `api/dashboard/route.ts`, Dashboard component |
| Change spacing/colors | `globals.css`, Tailwind utility classes in components |
| Add a protected page | `(app)` route group; add navigation link in `AppShell.tsx` if needed |

## 9. Production readiness checklist

- Configure `MONGODB_URI` and a unique 32+ character `SESSION_SECRET` in deployment secrets.
- Enforce HTTPS in production.
- Add rate limiting for authentication endpoints.
- Add automated tests for authorization, cross-user IDs, duplicate categories, invalid amounts/dates and pagination edges.
- Add transaction-safe category deletion.
- Add observability, backups, and a documented incident/recovery process.
- Run lint, typecheck and production build before each deployment.
