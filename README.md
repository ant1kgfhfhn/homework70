# MongoDB CRUD, Data Processing and Docker

This project is a simple Express.js application connected to MongoDB.

It includes user authentication, CRUD operations, MongoDB cursors, aggregation and Docker support.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- bcryptjs
- Docker
- Docker Compose

## Installation without Docker

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

http://localhost:3000

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

Docker Compose starts two services:

- `app` – Express application on port 3000.
- `mongo` – MongoDB database on port 27017.

The application connects to MongoDB using:

```env
MONGODB_URI=mongodb://mongo:27017/hw66
```

The `depends_on` option with a health check makes the application wait until MongoDB is ready.

### Open the application

Open the browser:

http://localhost:3000

The application displays the Passport Authentication page.

### Volumes and automatic updates

Docker Compose uses volumes to synchronize the local project files with the container.

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

This keeps database data between container restarts.

### Stop containers

Press `Ctrl + C` in the terminal, then run:

```bash
docker compose down
```

To stop containers and remove the database volume:

```bash
docker compose down -v
```

**Note:** The second command deletes the MongoDB data stored in the Docker volume.

## Authentication

All `/api/users` routes require an authenticated user.

First, log in through the application.

When using Thunder Client, keep the session cookie from the login request. The cookie is needed for API requests.

## API Routes

The API base URL is:

```text
http://localhost:3000/api/users
```

### 1. Read users

**GET `/api/users`**

Returns users without their passwords.

### 2. Read users with projection

**GET `/api/users?fields=email`**

Returns only the user ID, email and creation date.

### 3. Create one user – insertOne

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

### 4. Create multiple users – insertMany

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

### 5. Update one user – updateOne

**PATCH `/api/users/:id`**

Example request:

```json
{
  "email": "updated@example.com"
}
```

Replace `:id` with an existing user ID.

### 6. Update multiple users – updateMany

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

### 7. Replace one user – replaceOne

**PUT `/api/users/:id/replace`**

Example request:

```json
{
  "email": "replacement@example.com",
  "password": "secret789"
}
```

### 8. Delete one user – deleteOne

**DELETE `/api/users/:id`**

Replace `:id` with an existing user ID.

### 9. Delete multiple users – deleteMany

**DELETE `/api/users/bulk`**

Example request:

```json
{
  "filter": {
    "email": "first@example.com"
  }
}
```

## MongoDB Cursor

### 10. Read users using a cursor

**GET `/api/users/cursor`**

This route reads users using a MongoDB cursor instead of loading the complete collection into an array.

It uses:

- `find()` to select documents.
- `projection` to exclude passwords.
- `sort()` to sort users.
- `batchSize(100)` to control document batches.
- `for await...of` to process documents asynchronously.
- `res.write()` to send the response gradually.

This approach is useful when working with large collections.

## Aggregation

### 11. User statistics

**GET `/api/users/stats`**

This route uses MongoDB aggregation to calculate statistics.

The pipeline uses:

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

The application can be tested with Thunder Client or another API client.

For Docker testing:

1. Start Docker Desktop.
2. Run `docker compose up --build`.
3. Open
