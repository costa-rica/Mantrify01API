# Admin Router

This router handles administrative operations that require elevated privileges.

All endpoints require authentication AND admin status (isAdmin=true) to access.

## GET /admin/users

Retrieves a list of all users in the database.

- Authentication: Required
- Admin Status: Required (isAdmin=true)
- Returns all user records excluding the password field
- Includes system timestamps (createdAt, updatedAt)

### Parameters

None

### Sample Request

```bash
curl --location 'http://localhost:3000/admin/users' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Sample Response

Success (200):

```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "isEmailVerified": true,
      "emailVerifiedAt": "2026-02-01T10:30:00.000Z",
      "isAdmin": true,
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-01T10:30:00.000Z"
    },
    {
      "id": 2,
      "email": "user@example.com",
      "isEmailVerified": true,
      "emailVerifiedAt": "2026-02-02T14:20:00.000Z",
      "isAdmin": false,
      "createdAt": "2026-02-02T14:15:00.000Z",
      "updatedAt": "2026-02-02T14:20:00.000Z"
    },
    {
      "id": 3,
      "email": "newuser@example.com",
      "isEmailVerified": false,
      "emailVerifiedAt": null,
      "isAdmin": false,
      "createdAt": "2026-02-03T09:00:00.000Z",
      "updatedAt": "2026-02-03T09:00:00.000Z"
    }
  ]
}
```

### Error Responses

#### Missing or invalid token (401)

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token",
    "status": 401
  }
}
```

#### Authentication required (401)

```json
{
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication required",
    "status": 401
  }
}
```

#### User not found (401)

If the authenticated user no longer exists in the database:

```json
{
  "error": {
    "code": "AUTH_FAILED",
    "message": "User not found",
    "status": 401
  }
}
```

#### Admin access required (403)

When the authenticated user is not an admin (isAdmin=false):

```json
{
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "Admin access required",
    "status": 403
  }
}
```

#### Internal server error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve users",
    "status": 500
  }
}
```

### Notes

- The password field is always excluded from the response for security
- All users in the database are returned, including those with unverified emails
- Both authenticated and non-admin users receive a 403 error, not 401
- The admin middleware checks are performed after authentication middleware
- Timestamps (createdAt, updatedAt) are automatically managed by Sequelize
- The emailVerifiedAt field will be null for users who haven't verified their email
