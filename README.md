# InstaLite

A REST API for users and posts built with Express, PostgreSQL, and Prisma.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your PostgreSQL connection string to `.env` as `DATABASE_URL`.

3. Apply the database migrations and generate the Prisma Client:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Seed the sample data:

   ```bash
   npm run seed
   ```

5. Start the API:

   ```bash
   node src/index.js
   ```

The API runs on port 3000.

## Endpoints

- `/users` — create, list, update, and delete users; supports pagination, sorting, and filters.
- `/posts` — create, list, update, and delete posts; supports pagination, sorting, and filters.
- `/posts/:id/likes` — view and add likes to a post.
- `/users/:id/posts` — list posts by a user.
- `/users/:id/liked-posts` — list posts liked by a user.

Use a local PostgreSQL database and keep your `.env` file out of version control.
