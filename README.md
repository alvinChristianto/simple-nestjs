# Simple NestJS API

RESTful API with JWT authentication, user management, and per-user cats CRUD.

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
npx prisma migrate dev --name init
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

| Method | Route                  | Auth | Description           |
|--------|------------------------|------|-----------------------|
| POST   | `/auth/register`       | No   | Create account        |
| POST   | `/auth/login`          | No   | Get JWT token         |
| GET    | `/users`               | Yes  | List all users        |
| GET    | `/users/:id`           | Yes  | Get user + their cats |
| PATCH  | `/users/:id`           | Yes  | Update user           |
| DELETE | `/users/:id`           | Yes  | Delete user           |
| GET    | `/cats`                | Yes  | List own cats         |
| POST   | `/cats`                | Yes  | Create a cat          |
| GET    | `/cats/:id`            | Yes  | Get own cat           |
| PATCH  | `/cats/:id`            | Yes  | Update own cat        |
| DELETE | `/cats/:id`            | Yes  | Delete own cat        |

## Testing the API

See [API.md](./API.md) for full testing guide with Postman/Hoppscotch.

## Project Structure

```
src/
├── main.ts                  # Bootstrap + global pipes
├── app.module.ts            # Root module
├── prisma/                  # Database layer (global)
├── auth/                    # JWT authentication
├── users/                   # User CRUD
└── cats/                    # Per-user cats CRUD
```

## License

MIT
