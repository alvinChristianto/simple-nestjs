# API Reference

Base URL: `http://localhost:3000/api/v1`

## Authentication

All protected routes require a Bearer token:

```
Authorization: Bearer <your_token>
```

Get a token via `POST /auth/login` or `POST /auth/register`.

## Roles & Authorization

Authorization is enforced with CASL. Roles are read from the database on every
request (`JwtStrategy.validate`), never from the JWT, and `register` always
creates a `USER`.

| Role        | Access                                                                                                    |
|-------------|-----------------------------------------------------------------------------------------------------------|
| USER        | Read/Create/Update/Delete **own** cats, owners, illnesses; read **own** profile (`id`/`email`/`name` only) |
| ADMIN       | Read/Create/Update all users, cats, owners, illnesses (users: limited fields); **cannot delete any record** |
| SUPER_ADMIN | Full `manage` over everything, including deletes and role assignment                                       |

Routing rules:

- `/users` is guarded by `@CheckPolicies` — only ADMIN/SUPER_ADMIN can create,
  update (including `role`), or delete users. `DELETE` returns `403` for ADMIN
  (delete is SUPER_ADMIN only). A USER calling `GET /users` sees only their own
  row and gets `403` on write/delete endpoints.
- Cats, owners, and illnesses are checked in the services against the actual
  row (`subject(...)`). USERs are scoped to their own records; ADMINs see all
  records but `DELETE` returns `403`; SUPER_ADMINs can do everything.

---

## Auth

### POST /auth/register

**Request:**

```json
{
  "email": "john@example.com",
  "name": "John",
  "password": "secret123"
}
```

**Response (201):**

```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John",
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login

**Request:**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Users (requires Bearer token; role-aware)

Access rules: `GET` routes are reachable by any authenticated user (a USER only
ever sees their own row). `POST /users`, `PATCH /users/:id`, and `DELETE /users/:id`
are ADMIN/SUPER_ADMIN only. `role` may be assigned via `POST`/`PATCH`; it is
never accepted by `register`/`login`.

### GET /users

**Response (200):**

```json
[
  {
    "id": 1,
    "email": "john@example.com",
    "name": "John",
    "role": "USER",
    "createdAt": "2026-08-27T..."
  }
]
```

### POST /users

**Request (`role` optional, must be one of `USER`/`ADMIN`/`SUPER_ADMIN`):**

```json
{
  "email": "jane@example.com",
  "name": "Jane",
  "password": "secret123",
  "role": "ADMIN"
}
```

**Response (201):** The new user object (`id`, `email`, `name`, `role`, `createdAt`).

### GET /users/:id

**Response (200):**

```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John",
  "role": "USER",
  "createdAt": "2026-08-27T...",
  "cats": [
    { "id": 1, "name": "Whiskers", "age": 3, "breed": "Persian" }
  ]
}
```

### PATCH /users/:id

**Request (all fields optional; `role` optional):**

```json
{ "name": "John Updated", "role": "USER" }
```

### DELETE /users/:id

ADMIN gets `403`; only SUPER_ADMIN can delete users.

**Response:** `204 No Content`

---

## Cats (requires Bearer token, scoped to authenticated user)

Cats are the patients. Each cat belongs to the authenticated user and may be
assigned to one of that user's owners.

### GET /cats

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Whiskers",
    "age": 3,
    "breed": "Persian",
    "userId": 1,
    "ownerId": 2,
    "owner": { "id": 2, "name": "Alice", "phone": null, "address": null, "userId": 1, "createdAt": "...", "updatedAt": "..." },
    "illnesses": [
      { "id": 1, "name": "Flu", "description": "Mild", "diagnosedAt": "2026-08-01T00:00:00.000Z", "catId": 1, "userId": 1, "createdAt": "...", "updatedAt": "..." }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### POST /cats

**Request (`ownerId` optional, must belong to the authenticated user):**

```json
{
  "name": "Whiskers",
  "age": 3,
  "breed": "Persian",
  "ownerId": 2
}
```

**Response (201):** The cat object (id, name, age, breed, userId, ownerId,
`owner`, `illnesses`, createdAt, updatedAt).

### GET /cats/:id

**Response (200):** Single cat object, including `owner` and `illnesses`.

### PATCH /cats/:id

**Request (all fields optional; `ownerId` reassigns or `null` unassigns):**

```json
{ "age": 4, "ownerId": null }
```

### DELETE /cats/:id

**Response:** `204 No Content`

---

## Owners (requires Bearer token, scoped to authenticated user)

Owners are the people who own the cats, managed per user.

### GET /owners

**Response (200):**

```json
[
  {
    "id": 2,
    "name": "Alice",
    "phone": "555-0100",
    "address": "1 Cat St",
    "userId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### POST /owners

**Request (`phone`/`address` optional):**

```json
{
  "name": "Alice",
  "phone": "555-0100",
  "address": "1 Cat St"
}
```

**Response (201):** The owner object, including its `cats`.

### GET /owners/:id

**Response (200):** The owner object with its `cats`.

### GET /owners/:id/cats

**Response (200):** Array of the owner's cats, each with `owner` and
`illnesses`.

### PATCH /owners/:id

**Request (all fields optional):**

```json
{ "phone": "555-0101" }
```

### DELETE /owners/:id

Deletes the owner; their cats are kept but `ownerId` is set to `null`.

**Response:** `204 No Content`

---

## Illnesses (requires Bearer token, nested under cats)

Illnesses are a cat's medical conditions. All routes are scoped to the
authenticated user via the cat.

### POST /cats/:catId/illnesses

**Request (`description`/`diagnosedAt` optional; `diagnosedAt` is an ISO date):**

```json
{
  "name": "Flu",
  "description": "Mild",
  "diagnosedAt": "2026-08-01T00:00:00.000Z"
}
```

**Response (201):** The illness object, including its `cat`.

### GET /cats/:catId/illnesses

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Flu",
    "description": "Mild",
    "diagnosedAt": "2026-08-01T00:00:00.000Z",
    "catId": 1,
    "userId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### GET /cats/:catId/illnesses/:id

**Response (200):** Single illness object, including its `cat`.

### PATCH /cats/:catId/illnesses/:id

**Request (all fields optional):**

```json
{ "description": "Recovering" }
```

### DELETE /cats/:catId/illnesses/:id

**Response:** `204 No Content`

---

## Error Responses

| Status | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| 400    | Validation error (bad request body)                       |
| 401    | Missing or invalid token                                  |
| 403    | Access denied (another user's row, ADMIN delete, etc.)    |
| 404    | Resource not found                                        |
| 409    | Conflict (e.g. duplicate email)                           |

---

## Testing with Postman

1. **Register:** `POST /api/v1/auth/register` with JSON body → copy `access_token`
2. **Set token:** Click "Authorization" tab → Type: Bearer Token → paste token
3. **Call protected routes:** They'll auto-include the token header

### Postman Environment Variables

| Variable | Value                          |
| -------- | ------------------------------ |
| baseUrl  | `http://localhost:3000/api/v1` |
| token    | *(set after login)*            |

Use `{{baseUrl}}/auth/login` in request URLs.

### Auto-save token (Tests tab)

```javascript
const json = pm.response.json();
if (json.access_token) {
  pm.environment.set("token", json.access_token);
}
```

---

## Testing with Hoppscotch

1. Import `docs/hoppscotch-collection.json`
2. Set variable `baseUrl` = `http://localhost:3000/api/v1`
3. Register → Login → token auto-saves
4. All other requests use saved token

### Pre-request script (for auth requests)

```javascript
pw.env.set("token", pw.env.get("token") || "");
```

In Headers tab: `Authorization: Bearer {{token}}`
