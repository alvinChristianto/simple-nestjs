# Plan: CASL RBAC — USER / ADMIN / SUPER_ADMIN

## Goal

Add CASL-based access control to the NestJS API with three roles:

- **USER** — full CRUD over their *own* cats/owners/illnesses; read access to their own
  profile only; no `/users` management.
- **ADMIN** — can read/create/update **all** users, cats, owners, illnesses (field-limited),
  but **cannot delete any record**.
- **SUPER_ADMIN** — full `manage` over everything.

Enforcement uses the hybrid model: route-level `@CheckPolicies` guard for coarse access
(/users management) plus service-level `ability.can()` checks for object-level rules.

## Role / Rule Matrix

| Role         | Can                                                                    | Cannot                                  |
|--------------|------------------------------------------------------------------------|-----------------------------------------|
| USER         | `Read/Create/Update/Delete` on `Cat/Owner/Illness` **where** `userId = self`; `Read User` **where** `id = self` (limited fields) | Manage any other user / any other user's data |
| ADMIN        | `Read/Create/Update` on `User/Cat/Owner/Illness` (all records, limited fields) | `Delete` on `User/Cat/Owner/Illness`    |
| SUPER_ADMIN  | `Manage` everything                                                    | —                                       |

## CASL Best Practices Applied

1. **DB is the source of truth for roles.** Abilities are built per-request from the user
   freshly loaded in `JwtStrategy.validate`. Never trust a raw `role` claim in the JWT for
   authorization decisions; if a token includes `role`, treat it as a denormalized cache only.
2. **Official NestJS recipe.** Use `CaslAbilityFactory` + `PolicyHandler` +
   `@CheckPolicies` decorator + `PoliciesGuard`, exactly as documented in CASL's NestJS
   integration.
3. **Type-safe abilities.** `type AppAbility = MongoAbility<[Action, Subjects]>`, with
   `Subjects` as a union of the Prisma model names and `'all'`. Never use loosely typed
   `Ability`.
4. **Rule ordering matters (last match wins).** For ADMIN, the blanket
   `can([Read,Create,Update], [...])` must come *before* `cannot(Delete, [...])` so the final
   explicit deny is authoritative.
5. **Immutable, single-purpose ability.** Build one immutable `AppAbility` per request and
   reuse it; no global/cached ability instances across users.
6. **`subject()` for condition matching in services.** Check object-level rules against real
   rows via `subject('Cat', catRow)` so conditions like `{ userId: user.id }` evaluate against
   DB values — never string-mash permissions.
7. **Defense in depth.** Guards authorize at the route boundary; services re-assert the same
   ability over the actual row before write/read. A route handler is never the only gate.
8. **Field-level rules.** Constrain which fields an actor may read (e.g. ADMIN/SUPER_ADMIN
   never read `password`; USER reads only `id/email/name/role` of self) using CASL's field
   lists as a second layer under Prisma `select`.
9. **Explicit deny + small `assert` helper.** Map `ability.can(...) === false` to a typed
   `ForbiddenException` through one helper instead of scattering `throw` statements.
10. **Never accept roles from untrusted input.** `login/register` never take `role`;
    role assignment happens only via policy-guarded `/users` endpoints managed by
    ADMIN/SUPER_ADMIN.

## 1. Data model (`prisma/schema.prisma`)

- Add enum `Role { USER, ADMIN, SUPER_ADMIN }`.
- Add `role Role @default(USER)` to the `User` model.
- Create migration: `npm run db:migrate:dev -- --name add_user_roles` (dev DB only).
- Bootstrap first admin/superadmin:
  ```sql
  UPDATE "User" SET role='SUPER_ADMIN' WHERE email='...';
  ```
  Document this in README.
- Update `CreateUserDto` / `UpdateUserDto` with **optional** `role @IsEnum(Role)` so admins
  can assign roles; `RegisterDto` **does not** accept `role` (always `USER`).

## 2. Auth plumbing (`src/auth/`)

- `jwt.strategy.ts`: extend the `select` to include `role` →
  `req.user = { id, email, name, role }`. `validate()` re-reads role from DB on every request
  (best practice #1). Use this `user` type as `AuthUser` in controllers.
- `register` / `login`: never read `role` from the body; `register` stores `USER`.
- `signToken` payload (`{ sub, email }`) stays unchanged, or optionally add `role` as a
  non-authoritative claim.

## 3. New `src/ability/` module (registered globally in `AppModule`)

Files:

- `ability.types.ts`
  - `enum Action { Manage = 'manage', Read = 'read', Create = 'create', Update = 'update', Delete = 'delete' }`
  - `type Subjects = 'User' | User | 'Owner' | Owner | 'Cat' | Cat | 'Illness' | Illness | 'all'`
  - `type AppAbility = MongoAbility<[Action, Subjects]>`
  - `interface AuthUser { id: number; email: string; name: string; role: Role }`
- `casl-ability.factory.ts` — `createForUser(user: AuthUser): AppAbility`:
  - **SUPER_ADMIN**: `can(Action.Manage, 'all')`
  - **ADMIN**:
    - `can([Read, Create, Update], 'User', ['id','email','name','role'])` then
      `cannot(Delete, 'User')`
    - `can([Read, Create, Update], ['Cat','Owner','Illness'])` then
      `cannot(Delete, ['Cat','Owner','Illness'])`
  - **USER**:
    - `can([Read, Create, Update, Delete], ['Cat','Owner','Illness'], { userId: user.id })`
    - `can(Action.Read, 'User', ['id','email','name'], { id: user.id })`
- `policy-handler.ts` — `export type PolicyHandler = (ability: AppAbility) => boolean`
- `check-policies.decorator.ts` — `@CheckPolicies(...handlers: PolicyHandler[])` stored via
  `Reflector`.
- `policies.guard.ts` — `PoliciesGuard implements CanActivate`:
  - builds ability from `request.user` via the factory,
  - attaches it to the request (`request.user.ability` or `request.ability`),
  - if `@CheckPolicies` metadata exists, evaluates every handler; on failure or missing user
    throws `ForbiddenException`.
  - Always run **after** `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, PoliciesGuard)` (guard
    order in NestJS = declaration order).
- `ability.module.ts` — `@Global()` module providing `CaslAbilityFactory` (+ guard) and
  exporting it; imported once in `AppModule`.

## 4. Enforcement (hybrid)

### 4a. Users module (`customize users`)

- `UsersController`: `@UseGuards(JwtAuthGuard, PoliciesGuard)` + `@CheckPolicies` on every
  handler:
  - `GET /` → `Read User`, `GET /:id` → `Read User`, `POST /` → `Create User`,
    `PATCH /:id` → `Update User`, `DELETE /:id` → `Delete User`.
  - Pass the whole `user` (with role) into the service, not just the id.
- `UsersService`: inject `CaslAbilityFactory`; re-assert `ability.can(...)` against the
  target row via `subject('User', record)` before returning/updating/deleting
  (defense in depth, best practice #7).
- `CreateUserDto` / `UpdateUserDto`: optional `role @IsEnum(Role)`; invalid enum values are
  rejected by the global `ValidationPipe`.
- Result: only ADMIN/SUPER_ADMIN reach `/users`; ADMIN gets `403` on `DELETE`; regular USERS
  get `403` on the whole route and manage only their own pets.

### 4b. Cats / Owners / Illnesses

- Controllers: change `@UseGuards(JwtAuthGuard)` → `@UseGuards(JwtAuthGuard, PoliciesGuard)`;
  pass `user` instead of `user.id`.
- Services: inject `CaslAbilityFactory`, build `ability` from `user`, replace every manual
  `userId ===` check / `verifyOwnerAccess` / `verifyCatAccess` with
  `ability.can(Action.X, subject('Cat'|'Owner', row))` via the `assert` helper.
  - USER: rule conditions scope to own rows automatically.
  - ADMIN/SUPER_ADMIN: unconditional rules pass through, except ADMIN `Delete` is blocked.

## 5. Docs & tests

- `src/ability/casl-ability.factory.spec.ts` — pure unit (no DB): assert the full rule matrix
  for all three roles (allowed and denied action × subject × condition).
- Optionally a unit test for `PoliciesGuard` with mocked ability.
- Update `README.md`, `API.md`, `docs/hoppscotch-collection.json` with role semantics,
  `/users` access, and ADMIN delete restrictions. Keep `docs/plans/` out of the API docs.

## 6. Verification

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e` (against a dedicated test DB)

## Notes / Decisions

- Three roles: **USER / ADMIN / SUPER_ADMIN** (revised from the original two).
- ADMIN may not delete cats, users, illnesses, or owners; SUPER_ADMIN may.
- Hybrid enforcement chosen: guard + service, with field-level rules and defense in depth.
- Users module IS customized: role-aware DTOs, policy-guarded controller, ability-checked
  service.
- **Route guard is a coarse gate.** CASL does not evaluate `conditions` when the subject is
  passed as a bare type string (e.g. `ability.can('read', 'Cat')`), so condition-scoped rules
  for USER return `true` at the route boundary. Object-level ownership is enforced in the
  services via `ability.can(action, subject('Cat', cat))`. Consequence: a USER calling
  `GET /users` is allowed through the route gate but only ever sees their own row (service
  filters), and write/delete `/users` routes still 403 for USER at the gate because they have
  no matching rules.
- `Subjects` is a union of subject type strings and structural interfaces
  (`UserSubject`, `PetSubject`, `IllnessSubject`) instead of Prisma model classes, so
  `ability.can` accepts both bare type strings and subject instances without pulling in
  `@casl/prisma`.
- Migration was created as a committed SQL file and applied via non-destructive
  `npm run db:deploy` (avoids the guarded `db:migrate:dev` path); `db:generate` regenerated
  the client, and the `Role` enum is exposed to DTOs via `@prisma/client`.
- Work on a feature branch, e.g. `feat/casl-rbac`; never commit to `main`.