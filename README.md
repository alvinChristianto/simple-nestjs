# Simple NestJS API

RESTful API with JWT authentication and role-based access control (RBAC) for
cat patients, their owners, and cat illnesses. Authorization is enforced with
[CASL](https://casl.js.org) using route-level guards plus object-level checks in
the services.

- **USER** = regular user; full CRUD over their *own* cats/owners/illnesses and
  read access to their own profile.
- **ADMIN** = can read/create/update all users, cats, owners, and illnesses, but
  **cannot delete** any record.
- **SUPER_ADMIN** = full `manage` access over everything.
- **Cat** = the patient (belongs to a user and optionally an owner).
- **Owner** = the person who owns the cat; one owner can have many cats.
- **Illness** = a cat's medical condition; one cat can have many illnesses.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS 11
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing
- **Validation:** class-validator + class-transformer

## Prerequisites

- Node.js >= 18
- PostgreSQL running locally
- npm

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment

```bash
cp .env.example .env   # update DATABASE_URL, JWT_SECRET
```

### 3. Run migrations

```bash
npm run db:deploy        # safe: applies committed migrations
# or, during active development against a dev DB:
PRISMA_ALLOW_DESTRUCTIVE=1 npm run db:migrate:dev
```

### 4. Start dev server

```bash
npm run start:dev
```

Server runs at `http://localhost:3000`

## API Base URL

```
http://localhost:3000/api/v1
```

## Endpoints

| Method | Route                        | Auth | Description                   |
|--------|------------------------------|------|-------------------------------|
| POST   | `/auth/register`             | No   | Create account (always `USER`)|
| POST   | `/auth/login`                | No   | Get JWT token                 |
| GET    | `/users`                     | Yes  | List users (ADMIN+); USER sees self |
| GET    | `/users/:id`                 | Yes  | Get user + their cats (ADMIN+); USER sees self |
| POST   | `/users`                     | Yes  | Create user with optional role (ADMIN+) |
| PATCH  | `/users/:id`                 | Yes  | Update user / assign role (ADMIN+) |
| DELETE | `/users/:id`                 | Yes  | Delete user (SUPER_ADMIN only) |
| GET    | `/owners`                    | Yes  | List owners (scoped to USER; all for ADMIN+) |
| POST   | `/owners`                    | Yes  | Create an owner                |
| GET    | `/owners/:id`                | Yes  | Get owner + their cats         |
| GET    | `/owners/:id/cats`           | Yes  | List an owner's cats           |
| PATCH  | `/owners/:id`                | Yes  | Update own owner               |
| DELETE | `/owners/:id`                | Yes  | Delete own owner (ADMIN blocked) |
| GET    | `/cats`                      | Yes  | List cats (scoped to USER; all for ADMIN+) |
| POST   | `/cats`                      | Yes  | Create a cat                   |
| GET    | `/cats/:id`                  | Yes  | Get cat                        |
| PATCH  | `/cats/:id`                  | Yes  | Update cat                     |
| DELETE | `/cats/:id`                  | Yes  | Delete cat (ADMIN blocked)     |
| GET    | `/cats/:catId/illnesses`     | Yes  | List a cat's illnesses         |
| POST   | `/cats/:catId/illnesses`     | Yes  | Add an illness to a cat        |
| GET    | `/cats/:catId/illnesses/:id` | Yes  | Get one illness                |
| PATCH  | `/cats/:catId/illnesses/:id` | Yes  | Update an illness              |
| DELETE | `/cats/:catId/illnesses/:id` | Yes  | Delete an illness (ADMIN blocked) |

## Testing the API

See [API.md](./API.md) for full testing guide with Postman/Hoppscotch.

## Roles & Access Control

Roles are stored on the `User` record and read from the database on every
request by the JWT strategy — the token is never trusted for authorization.
New accounts are always created as `USER`.

| Role        | Access                                                                                                    |
|-------------|-----------------------------------------------------------------------------------------------------------|
| USER        | Read/Create/Update/Delete own cats, owners, illnesses; read own profile (id/email/name only)              |
| ADMIN       | Read/Create/Update all users/pets; **cannot delete** anything                                            |
| SUPER_ADMIN | Can do everything, including deletes and role assignment                                                 |

To promote your first admin, update the record directly against a dev DB (see
your README bootstrap step in the plan) or create users with a role via
`POST /users` once a SUPER_ADMIN exists:

```sql
UPDATE "User" SET role='SUPER_ADMIN' WHERE email='you@example.com';
```

Role assignment never happens through `register`/`login`; it is only possible
via the policy-guarded `/users` endpoints.

## Project Structure

```
src/
├── main.ts                  # Bootstrap + global pipes, filter, helmet, CORS
├── app.module.ts            # Root module + global middleware
├── prisma/                  # Database layer (global)
├── ability/                 # CASL: ability factory, policies guard, types (global)
├── auth/                    # JWT authentication
├── users/                   # User CRUD (policy-guarded, role-aware DTOs)
├── owners/                  # Cat owners CRUD (protected by ability checks)
├── cats/                    # Cat patients CRUD (protected by ability checks)
└── illnesses/               # Cat illnesses CRUD (nested under /cats)
```

## Safety Guards

- **Husky hooks** block commits/pushes on `main`/`master` and run `lint` + `build` on commit.
- **Prisma destructive commands** (`db:migrate:dev`, `db:reset`, `db:push`) are guarded by `scripts/guard-destructive-db.sh` and refused unless `PRISMA_ALLOW_DESTRUCTIVE=1` is set (and never when `APP_ENV`/`NODE_ENV=production`).
- **E2E tests** refuse to run unless `DATABASE_URL` points at a test database (see `test/global-setup.js`).

See [AGENTS.md](./AGENTS.md) for the full contribution and safety guide.

## License

MIT
