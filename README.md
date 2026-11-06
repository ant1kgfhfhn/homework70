# MongoDB CRUD and Data Processing

This project is a simple Express.js application connected to MongoDB Atlas.

It includes user authentication, CRUD operations, MongoDB cursors and an aggregation query.

## Technologies

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Passport.js
- bcryptjs

## Installation

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=3000
```

Start the server:

```bash
npm start
```

The server runs at:

```text
http://localhost:3000
```

## Authentication

All `/api/users` routes require an authenticated user.

First, log in through the application:

```text
POST /login
```

When using Thunder Client, keep the session cookie from the login request. The cookie is needed for the API requests.

## API Routes

The API base URL is:

```text
http://localhost:3000/api/users
```

### 1. Read users

**GET `/api/users`**

Returns users without their passwords.

Example:

```http
GET /api/users
```

### 2. Read users with projection

**GET `/api/users?fields=email`**

Returns only the user ID, email and creation date.

Example response:

```json
[
  {
    "_id": "USER_ID",
    "email": "user@example.com",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
]
```

### 3. Create one user — insertOne

**POST `/api/users`**

Example request:

```json
{
  "email": "newuser@example.com",
  "password": "secret123"
}
```

Expected status: `201 Created`.

The password is hashed before it is saved.

### 4. Create multiple users — insertMany

**POST `/api/users/bulk`**

Example request:

```json
{
  "users": [
    {
      "email": "first@example.com",
      "password": "secret123"
    },
    {
      "email": "second@example.com",
      "password": "secret456"
    }
  ]
}
```

Expected response:

```json
{
  "message": "Users created",
  "insertedCount": 2,
  "insertedIds": ["ID_1", "ID_2"]
}
```

### 5. Update one user — updateOne

**PATCH `/api/users/:id`**

Example request:

```json
{
  "email": "updated@example.com"
}
```

Replace `:id` with an existing user ID.

Expected response:

```json
{
  "message": "Update completed",
  "matchedCount": 1,
  "modifiedCount": 1
}
```

### 6. Update multiple users — updateMany

**PATCH `/api/users/bulk/update`**

Example request:

```json
{
  "filter": {
    "email": "first@example.com"
  },
  "email": "updated@example.com"
}
```

Expected response:

```json
{
  "message": "Bulk update completed",
  "matchedCount": 1,
  "modifiedCount": 1
}
```

### 7. Replace one user — replaceOne

**PUT `/api/users/:id/replace`**

Example request:

```json
{
  "email": "replacement@example.com",
  "password": "secret789"
}
```

Expected response:

```json
{
  "message": "Replacement completed",
  "matchedCount": 1,
  "modifiedCount": 1
}
```

The document is replaced with the new email and hashed password.

### 8. Delete one user — deleteOne

**DELETE `/api/users/:id`**

Replace `:id` with an existing user ID.

Expected response:

```json
{
  "message": "User deleted",
  "deletedCount": 1
}
```

### 9. Delete multiple users — deleteMany

**DELETE `/api/users/bulk`**

Example request:

```json
{
  "filter": {
    "email": "first@example.com"
  }
}
```

Expected response:

```json
{
  "message": "Bulk delete completed",
  "deletedCount": 1
}
```

## New Features

### 10. MongoDB Cursor

**GET `/api/users/cursor`**

This route reads users using a MongoDB cursor.

The cursor processes documents one by one with `for await...of` instead of loading the complete collection into an array with `toArray()`.

The cursor uses:

- `find()` to select documents;
- `projection` to exclude passwords;
- `sort()` to sort users;
- `batchSize(100)` to control the number of documents fetched in each batch;
- asynchronous iteration to process documents;
- `res.write()` to send the response gradually.

Example request:

```http
GET /api/users/cursor
```

Expected response:

```json
[
  {
    "_id": "USER_ID",
    "email": "user@example.com",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
]
```

The response is sent as a JSON array, but the server does not first store all documents in a JavaScript array.

This approach is useful when a collection contains many documents.

### 11. Aggregation statistics

**GET `/api/users/stats`**

This route uses MongoDB's aggregation pipeline to calculate user statistics.

The pipeline performs these operations:

1. `$match` selects documents with an email string.
2. `$project` extracts the email domain.
3. `$group` counts users for each domain.
4. `$sort` sorts domains by user count.
5. `$group` calculates the total number of users and unique domains.
6. `$project` formats the final result.

Example request:

```http
GET /api/users/stats
```

Example response:

```json
{
  "totalUsers": 4,
  "uniqueDomains": 2,
  "domains": [
    {
      "domain": "gmail.com",
      "userCount": 3
    },
    {
      "domain": "example.com",
      "userCount": 1
    }
  ]
}
```

The numbers depend on the actual data in MongoDB Atlas.

If the collection is empty, the route returns:

```json
{
  "totalUsers": 0,
  "uniqueDomains": 0,
  "domains": []
}
```

## Testing

The routes can be tested with Thunder Client or another API client.

1. Start the server with `npm start`.
2. Log in to the application.
3. Keep the session cookie in Thunder Client.
4. Send requests to the routes listed above.
5. Check the HTTP status and JSON response.

For the cursor route, check that users are returned without passwords.

For the aggregation route, compare the total user count and domain counts with the data stored in MongoDB Atlas.

## Security

- Passwords are hashed with bcryptjs.
- Password fields are excluded from read responses.
- API routes require authentication.
- Email addresses are validated before creating or updating users.
- The `.env` file must not be uploaded to GitHub.

## Project Structure

```text
src/
  config/
    database.js
    passport.js
  controllers/
    authController.js
    userApiController.js
  middlewares/
    authMiddleware.js
  models/
    User.js
  routes/
    authRoutes.js
    userApiRoutes.js
  server.js

views/
  auth/
  styles.css

.env
.gitignore
package.json
README.md
```
