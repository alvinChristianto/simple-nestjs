# AGENTS.md

Guidance for AI agents and human contributors working in this repository.

## Project Overview

RESTful NestJS 11 API with:
- JWT authentication (Passport + bcrypt)
- User management
- Per-user cats CRUD
- PostgreSQL via Prisma ORM

## Environment & Commands

- Node >= 18, npm, PostgreSQL (local).
- Copy `.env.example` → `.env` and fill in `DATABASE_URL`, `JWT_SECRET`.

| Command | Purpose |
|---------|---------|
| `npm install` | Install deps + runs `prepare` (husky) |
| `npm run start:dev` | Watch mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint + fix |
| `npm test` | Unit tests (jest) |
| `npm run test:e2e` | E2E tests (requires a test DB; guarded) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:deploy` | Apply migrations (non-destructive) |
| `npm run db:migrate:dev` | Dev migration (**destructive-capable**, guarded) |
| `npm run db:reset` / `db:push` | **Destructive**, guarded |

Base URL: `http://localhost:3000/api/v1`.

## Architecture & Conventions

Feature folders under `src/` follow NestJS module conventions:

```
src/
├── main.ts          # bootstrap: global prefix, versioning, pipes, filter, helmet, CORS
├── app.module.ts    # root module; also configures global middleware (NestModule)
├── prisma/          # global PrismaModule + PrismaService (lifecycle hooks)
├── auth/            # JWT auth module (controller, service, strategy, guard, DTOs)
├── users/           # user CRUD
├── cats/            # per-user cats CRUD
└── common/          # cross-cutting: decorators, filters, middleware
```

### How to add a feature

1. Scaffold with Nest CLI conventions (module/controller/service/DTOs).
2. Register the module in `src/app.module.ts` imports.
3. Prefer a feature-scoped module; only the DB layer (`PrismaModule`) is global.
4. Keep controllers thin: parse/validate input, call the service, return the result.
5. Put business logic + access-control checks in the service (`file:line` references in README/API docs).
6. Add DTOs with `class-validator` decorators; never trust raw request bodies.

### Best-practice checklist (current state)

- **Controllers**: thin, HTTP-only, use `@Version('1')` + `@Controller({path, version})`. Use the `@CurrentUser()` decorator (from `src/common/decorators`) instead of reading `req.user` by hand.
- **Services (providers)**: hold business logic, throw typed HTTP exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`). Issue Prisma writes through `PrismaService`.
- **Modules**: feature-scoped; DI via constructor injection.
- **DTOs + validation**: global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) in `main.ts`; params use `ParseIntPipe`. Add DTOs for every request body.
- **Guards**: Passport `JwtAuthGuard` applied per-controller with `@UseGuards`.
- **Exception filter**: global `AllExceptionsFilter` (`src/common/filters`) normalizes error bodies and logs 5xx. Register global concerns in `main.ts`, not in `AppModule()` providers.
- **Middleware**: global `LoggerMiddleware` (`src/common/middleware`) logs HTTP requests; wired in `AppModule.configure`.
- **Security**: `helmet()` + `enableCors()` in `main.ts`. **Secrets come from `@nestjs/config` (`ConfigService`)** — never read `process.env` directly in modules (see `auth.module.ts` / `jwt.strategy.ts` using `ConfigService.getOrThrow`).
- **Config**: add new env vars to `.env.example` and read them via `ConfigService`.

### Guarding `/users` and `/cats`

- Both the `UsersController` and `CatsController` are protected by `JwtAuthGuard` (Bearer token).
- `CatsService` scopes every query to the authenticated user; do not bypass the ownership check.

## Git Workflow Rules (MANDATORY)

- **Never commit or push directly to `main` (or `master`).** Always create a feature branch:
  ```bash
  git checkout -b feat/your-change
  ```
- Husky hooks enforce this:
  - `.husky/pre-commit` blocks commits on `main`/`master`, then runs `build`.
  - `.husky/pre-push` blocks pushing `main`/`master`.
- Always keep the build green. `npm run lint` has pre-existing violations (e.g. `no-unsafe-member-access` on bcrypt/Passport calls, unused `CreateUserDto` in `users.controller.ts`); run it and fix what you add, but it is not a hard commit gate yet.
- Prefer the PR-based workflow (e.g. `gh pr create`) to merge changes into `main`.

## Database Safety Rules (MANDATORY)

- **Never run destructive Prisma commands against a production database.**
- Destructive commands (`migrate reset`, `db push`, `migrate dev` when drift exists) can erase data. They are wired to `scripts/guard-destructive-db.sh`.
- The guard **always blocks** those commands when `APP_ENV`/`NODE_ENV=production`, and **requires an explicit opt-in flag** otherwise:
  ```bash
  PRISMA_ALLOW_DESTRUCTIVE=1 npm run db:reset   # only against a throwaway/dev DB
  ```
- The safe, non-guarded paths are `npm run db:deploy` (apply migrations) and `npm run db:generate`.
- `db:migrate:dev` is guarded because Prisma may reset when it detects schema drift.

## Test Safety Rules (MANDATORY)

- **E2E and integration tests can erase data.** Never run them against a production or shared database.
- `test/global-setup.js` refuses to run e2e tests unless `DATABASE_URL` looks like a test DB (contains `test` / `_e2e` / `_test`). Jest sets `NODE_ENV=test` on its own, so that is not treated as a safety signal.
- Use a dedicated test database (e.g. `nestjs_test`) for `npm run test:e2e`.
- Unit tests use mocked providers / `PrismaService` and never touch the database.

## Doc Conventions

- Keep `README.md` (setup + endpoints) and `API.md` (detailed reference) in sync when routes or contracts change.
- Update `docs/hoppscotch-collection.json` if API endpoints change.
- Add meaningful commits; make your changes on a branch, not `main`.
