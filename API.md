# API Reference

Base URL: `http://localhost:3000/api/v1`

## Authentication

All protected routes require a Bearer token:

```
Authorization: Bearer <your_token>
```

Get a token via `POST /auth/login` or `POST /auth/register`.

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

## Users (requires Bearer token)

### GET /users

**Response (200):**

```json
[
  {
    "id": 1,
    "email": "john@example.com",
    "name": "John",
    "createdAt": "2026-08-27T..."
  }
]
```

### GET /users/:id

**Response (200):**

```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John",
  "createdAt": "2026-08-27T...",
  "cats": [
    { "id": 1, "name": "Whiskers", "age": 3, "breed": "Persian" }
  ]
}
```

### PATCH /users/:id

**Request (all fields optional):**

```json
{ "name": "John Updated" }
```

### DELETE /users/:id

**Response:** `204 No Content`

---

## Cats (requires Bearer token, scoped to authenticated user)

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
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### POST /cats

**Request:**

```json
{
  "name": "Whiskers",
  "age": 3,
  "breed": "Persian"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Whiskers",
  "age": 3,
  "breed": "Persian",
  "userId": 1,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET /cats/:id

**Response (200):** Single cat object

### PATCH /cats/:id

**Request (all fields optional):**

```json
{ "age": 4 }
```

### DELETE /cats/:id

**Response:** `204 No Content`

---

## Error Responses

| Status | Meaning                                              |
| ------ | ---------------------------------------------------- |
| 400    | Validation error (bad request body)                  |
| 401    | Missing or invalid token                             |
| 403    | Access denied (e.g. accessing another user's cat)    |
| 404    | Resource not found                                   |
| 409    | Conflict (e.g. duplicate email)                      |

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
