# MongoDB and Mongoose CRUD Application with Docker

This project is an Express.js application connected to MongoDB using **Mongoose**.

It includes user authentication, Mongoose models and schemas, CRUD operations, MongoDB cursors, aggregation pipelines and Docker support.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- bcryptjs
- Pug
- Docker
- Docker Compose

## Project Structure

```text
hw66/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userApiController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userApiRoutes.js
│   └── server.js
├── views/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env
├── package.json
└── README.md
```

## Installation without Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=3000
```

Replace the MongoDB connection string with your MongoDB Atlas connection URI.

Never commit your `.env` file to GitHub.

### 3. Start the application

```bash
npm start
```

The server runs at:

http://localhost:3000

## Mongoose Configuration

The application uses Mongoose instead of direct MongoDB Driver operations.

### Database connection

The database connection is configured in:

`src/config/database.js`

```javascript
const mongoose = require("mongoose");

async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully");
}

module.exports = connectDatabase;
```

The connection string is loaded from the environment variable `MONGODB_URI`.

### User model and schema

The User model is defined in:

`src/models/User.js`

The schema contains:

- `email` – required, unique, lowercase and trimmed.
- `password` – required and validated.
- `createdAt` – automatically generated timestamp.
- `updatedAt` – automatically updated timestamp.

Mongoose schema validation is used to validate user data.

The model is exported using:

```javascript
module.exports = mongoose.model("User", userSchema);
```

### Mongoose operations

All user database operations use the Mongoose User model.

Examples:

| Operation             | Mongoose method     |
| --------------------- | ------------------- |
| Find users            | `User.find()`       |
| Find one user         | `User.findOne()`    |
| Find by ID            | `User.findById()`   |
| Create user           | `User.create()`     |
| Insert multiple users | `User.insertMany()` |
| Update one user       | `User.updateOne()`  |
| Update multiple users | `User.updateMany()` |
| Replace user          | `User.replaceOne()` |
| Delete one user       | `User.deleteOne()`  |
| Delete multiple users | `User.deleteMany()` |
| Aggregation           | `User.aggregate()`  |

Passwords are hashed using bcryptjs before being stored in MongoDB.

## Docker Setup

Make sure Docker Desktop is installed and running.

The project includes:

- `Dockerfile` – builds the Express application image.
- `docker-compose.yml` – starts Express and MongoDB.
- `.dockerignore` – excludes unnecessary files from the Docker image.

### Start containers

Run this command in the project root:

```bash
docker compose up --build
```

Or run in detached mode:

```bash
docker compose up -d --build
```

Docker Compose starts two services:

- `app` – Express application on port 3000.
- `mongo` – MongoDB database on port 27017.

Inside Docker, the application connects to MongoDB using:

```env
MONGODB_URI=mongodb://mongo:27017/hw66
```

The `depends_on` option and MongoDB health check ensure that the database is ready before the application starts.

### Open the application

Open:

http://localhost:3000

### View container logs

```bash
docker compose logs -f app
```

Expected messages:

```text
MongoDB connected successfully
Server running at http://localhost:3000
```

### Volumes and automatic updates

Docker Compose uses bind mounts to synchronize local project files with the container.

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

The application runs with:

```bash
node --watch src/server.js
```

To test automatic updates:

1. Start Docker Compose.
2. Open `views/auth/home.pug`.
3. Change some text and save the file.
4. Refresh the browser.
5. The changes appear without manually restarting the container.

### MongoDB data storage

MongoDB uses a named volume:

```yaml
volumes:
  - mongo_data:/data/db
```

This preserves database data between container restarts.

### Stop containers

```bash
docker compose down
```

To stop containers and remove the database volume:

```bash
docker compose down -v
```

**Warning:** The second command deletes the MongoDB data stored in the Docker volume.

## Authentication

The application uses Passport.js with a local authentication strategy.

Features include:

- User registration.
- User login.
- Password hashing with bcryptjs.
- Session-based authentication.
- Protected pages and API routes.
- Password exclusion from user responses.

All `/api/users` routes require an authenticated user.

First, log in through the application.

When using Thunder Client, include the session cookie from the login request. Do not share this cookie publicly.

## API Routes

Base URL:

```text
http://localhost:3000/api/users
```

All routes require authentication.

### 1. Read users

**GET `/api/users`**

Returns all users without their passwords.

### 2. Read users with projection

**GET `/api/users?fields=email`**

Returns only the user ID, email and creation date.

### 3. Create one user

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

### 4. Create multiple users

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

Uses Mongoose `insertMany()`.

### 5. Update one user

**PATCH `/api/users/:id`**

Example request:

```json
{
  "email": "updated@example.com"
}
```

Replace `:id` with an existing user ID.

### 6. Update multiple users

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

### 7. Replace one user

**PUT `/api/users/:id/replace`**

Example request:

```json
{
  "email": "replacement@example.com",
  "password": "secret789"
}
```

### 8. Delete one user

**DELETE `/api/users/:id`**

Replace `:id` with an existing user ID.

### 9. Delete multiple users

**DELETE `/api/users/bulk`**

Example request:

```json
{
  "filter": {
    "email": "first@example.com"
  }
}
```

The endpoint requires a specific email filter to prevent accidental mass deletion.

## MongoDB Cursor

### 10. Read users using a cursor

**GET `/api/users/cursor`**

This route uses a Mongoose query cursor to process users without loading the entire collection into an array.

It uses:

- `User.find()` to select documents.
- `.select("-password")` to exclude passwords.
- `.sort()` to sort users.
- `.lean()` to return plain JavaScript objects.
- `.cursor({ batchSize: 100 })` to configure cursor batches.
- `for await...of` to process documents asynchronously.
- `res.write()` to stream the JSON response.

This approach is useful when working with large collections.

## Aggregation

### 11. User statistics

**GET `/api/users/stats`**

This route uses Mongoose `User.aggregate()` to calculate statistics.

The aggregation pipeline uses:

1. `$match` – selects documents with an email string.
2. `$project` – extracts the email domain.
3. `$group` – counts users for each domain.
4. `$sort` – sorts domains by user count.
5. `$group` – calculates total users and unique domains.
6. `$project` – formats the result.

Example response:

```json
{
  "totalUsers": 2,
  "uniqueDomains": 2,
  "domains": [
    {
      "domain": "example.com",
      "userCount": 1
    },
    {
      "domain": "gmail.com",
      "userCount": 1
    }
  ]
}
```

The numbers depend on the actual database contents.

## Testing

The application can be tested using Thunder Client or another API client.

Recommended testing steps:

1. Start Docker Desktop.
2. Run `docker compose up -d --build`.
3. Open `http://localhost:3000`.
4. Register a new user.
5. Log in.
6. Open `/users` to display users.
7. Test `GET /api/users`.
8. Test `GET /api/users/cursor`.
9. Test `GET /api/users/stats`.
10. Test POST, PATCH, PUT and DELETE requests using Thunder Client.

The API responses should confirm that the Mongoose operations work correctly.

## Conclusion

The application has been migrated to Mongoose.

MongoDB connection management, schema validation and database operations are handled through Mongoose models.

The project also includes authentication, CRUD functionality, cursor-based data processing, aggregation pipelines and Docker support.
