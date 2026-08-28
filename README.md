# Simple NestJS API

RESTful API with JWT authentication, admin user management, and per-admin CRUD for
cat patients, their owners, and cat illnesses.

- **User** = admin (everything is scoped to the authenticated admin).
- **Cat** = the patient (belongs to an admin and optionally an owner).
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
| POST   | `/auth/register`             | No   | Create account                |
| POST   | `/auth/login`                | No   | Get JWT token                 |
| GET    | `/users`                     | Yes  | List all users                |
| GET    | `/users/:id`                 | Yes  | Get user + their cats         |
| PATCH  | `/users/:id`                 | Yes  | Update user                   |
| DELETE | `/users/:id`                 | Yes  | Delete user                   |
| GET    | `/owners`                    | Yes  | List own owners               |
| POST   | `/owners`                    | Yes  | Create an owner               |
| GET    | `/owners/:id`                | Yes  | Get own owner + their cats    |
| GET    | `/owners/:id/cats`           | Yes  | List an owner's cats          |
| PATCH  | `/owners/:id`                | Yes  | Update own owner              |
| DELETE | `/owners/:id`                | Yes  | Delete own owner              |
| GET    | `/cats`                      | Yes  | List own cats                 |
| POST   | `/cats`                      | Yes  | Create a cat                  |
| GET    | `/cats/:id`                  | Yes  | Get own cat                   |
| PATCH  | `/cats/:id`                  | Yes  | Update own cat                |
| DELETE | `/cats/:id`                  | Yes  | Delete own cat                |
| GET    | `/cats/:catId/illnesses`     | Yes  | List a cat's illnesses        |
| POST   | `/cats/:catId/illnesses`     | Yes  | Add an illness to a cat       |
| GET    | `/cats/:catId/illnesses/:id` | Yes  | Get one illness               |
| PATCH  | `/cats/:catId/illnesses/:id` | Yes  | Update an illness             |
| DELETE | `/cats/:catId/illnesses/:id` | Yes  | Delete an illness             |

## Testing the API

See [API.md](./API.md) for full testing guide with Postman/Hoppscotch.

## Project Structure

```
src/
├── main.ts                  # Bootstrap + global pipes, filter, helmet, CORS
├── app.module.ts            # Root module + global middleware
├── prisma/                  # Database layer (global)
├── auth/                    # JWT authentication
├── users/                   # Admin user CRUD
├── owners/                  # Cat owners CRUD (scoped per admin)
├── cats/                    # Cat patients CRUD (scoped per admin)
└── illnesses/               # Cat illnesses CRUD (nested under /cats)
```

## Safety Guards

- **Husky hooks** block commits/pushes on `main`/`master` and run `lint` + `build` on commit.
- **Prisma destructive commands** (`db:migrate:dev`, `db:reset`, `db:push`) are guarded by `scripts/guard-destructive-db.sh` and refused unless `PRISMA_ALLOW_DESTRUCTIVE=1` is set (and never when `APP_ENV`/`NODE_ENV=production`).
- **E2E tests** refuse to run unless `DATABASE_URL` points at a test database (see `test/global-setup.js`).

See [AGENTS.md](./AGENTS.md) for the full contribution and safety guide.

## License

MIT
