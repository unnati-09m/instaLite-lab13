# InstaLite PS2 — Implementation Report

## Objective

PS2 extends the existing InstaLite MVC API with deterministic seed data, pagination, sorting, and filtering. No schema changes or new database migrations are required. Existing CRUD endpoints for individual users and posts remain in place.

## What was implemented

### 1. Deterministic seed data

**File:** `prisma/seed-data.js`

- Includes the lab's fixed set of 12 users and 24 posts.
- Uses the exact fixture values expected by the PS2 tests, including the lowercase `"goa"` location for `insta16`.
- Uses ES module exports because this repository sets `"type": "module"` in `package.json`.

### 2. Seed script

**File:** `prisma/seed.js`

- Imports the shared Prisma Client from `src/db.js`.
- Deletes posts first and users second, then creates the 12 users and 24 posts with one `createMany` call per model.
- Converts fixture ISO date strings into JavaScript `Date` objects for Prisma DateTime fields.
- Prints the counts returned by Prisma, reports failures, sets a failing exit code, and disconnects the Prisma Client in `finally`.

**Important:** Running the seed intentionally deletes the existing User and Post rows before inserting the fixed fixture data. Use it for local development/testing, not as a production data operation.

### 3. Registering the seed command

**Files:** `prisma7.config.ts`, `package.json`

- Configures Prisma's `migrations.seed` command as `node prisma/seed.js`.
- Adds `npm run seed`, which invokes `prisma db seed`.

### 4. User pagination

**Files:** `src/controllers/users.controller.js`, `src/services/users.service.js`

- Defaults to page 1 and limit 10; caps limits at 50.
- Rejects non-positive/non-integer page and limit values with HTTP 400 and the required error message.
- Returns a `{ data, meta }` object with `page`, `limit`, `total`, and `totalPages`.
- Orders users newest-first by default.
- Gets the current page and the matching total count in one Prisma transaction. A page beyond the last page returns an empty array while retaining total metadata.

### 5. User sorting

**Endpoint:** `GET /users`

- Accepts `sortBy=createdAt`, `sortBy=username`, or `sortBy=fullname`.
- Accepts `order=asc` or `order=desc`.
- Uses the required HTTP 400 messages for unsupported sorting fields or order values.

Examples:
- `GET /users?sortBy=username&order=asc`
- `GET /users?sortBy=fullname&order=desc&limit=3`

### 6. User filtering

**Endpoint:** `GET /users`

- `isPrivate=true` returns private accounts; `isPrivate=false` returns public accounts.
- Invalid `isPrivate` values return HTTP 400 with `isPrivate must be true or false`.
- `search` performs a case-insensitive contains search across `username` OR `fullname`.
- Filtering works together with sorting and pagination. The total count uses the same Prisma `where` filter as the returned data.

Examples:
- `GET /users?isPrivate=true`
- `GET /users?search=sh`
- `GET /users?search=SH&isPrivate=false&sortBy=fullname&order=asc&limit=2`

### 7. Post pagination and sorting

**Files:** `src/controllers/posts.controller.js`, `src/services/posts.service.js`

- Supports page/limit with the same defaults and maximum as users.
- Returns the same `{ data, meta }` structure.
- Defaults to `createdAt` descending and permits sorting by `createdAt` or `updatedAt`.
- Validates page, limit, sortBy, and order using the exact PS2 error messages.
- Fetches page data and total count within one Prisma transaction.

### 8. Post filtering

**Endpoint:** `GET /posts`

- `location`: case-insensitive exact match.
- `search`: case-insensitive contains search in `caption`.
- `from`: inclusive lower bound on `createdAt`.
- `to`: exclusive upper bound on `createdAt`.
- Invalid date parameters return HTTP 400 with `from and to must be valid dates`.
- All filters combine with each other, sorting, and pagination. `meta.total` counts only matching posts.

Examples:
- `GET /posts?location=GOA`
- `GET /posts?search=sunset`
- `GET /posts?from=2026-03-01&to=2026-04-01`
- `GET /posts?location=pune&search=CHAI&limit=2&page=1`

## Commits

- [Add fixed PS2 seed dataset](https://github.com/unnati-09m/instaLite-lab13/commit/478811cc6374c43f2dfb4c649dc73017b67a63de)
- [Add deterministic Prisma seed script](https://github.com/unnati-09m/instaLite-lab13/commit/e82323a8a4b6f55d261f7d85a2b58b581f954a2d)
- [Register Prisma seed command](https://github.com/unnati-09m/instaLite-lab13/commit/23a9b42894415ab9ea074b17df529b6150e67a80)
- [Add npm seed script](https://github.com/unnati-09m/instaLite-lab13/commit/6eea17e9ae30fbb641279cf1b4c6a21f2c6aa085)
- [Make user pagination transactional and spec compliant](https://github.com/unnati-09m/instaLite-lab13/commit/990f4ca2b203fced9c9eb06084b4ba51ab76b38c)
- [Add validated sorting to GET users](https://github.com/unnati-09m/instaLite-lab13/commit/596ccf4912569072ad6a669a6b2e4853ec1f1839)
- [Add filters to GET users](https://github.com/unnati-09m/instaLite-lab13/commit/c3cb5463a6f075b4bde3cb129cf596accd3c211e)
- [Add pagination and sorting to GET posts](https://github.com/unnati-09m/instaLite-lab13/commit/10b7de95c9e573c86590085025d7e4b4bcd37a1d)
- [Add post location caption and date filters](https://github.com/unnati-09m/instaLite-lab13/commit/1211cfd1573aee043e14982de6f16ed265977c30)

## Local verification checklist

The implementation has been pushed to GitHub. Runtime tests still need to be run against the local PostgreSQL database.

From the `instaLite-lab13` project directory:

```bash
git pull origin master
npm run seed
node src/index.js
```

In a second terminal, test the following requests:

```bash
# Users: page, limit, and response metadata
curl -s "http://localhost:3000/users"
curl -s "http://localhost:3000/users?page=2"
curl -s "http://localhost:3000/users?limit=100"
curl -s "http://localhost:3000/users?page=999"
curl -i "http://localhost:3000/users?page=0"
curl -i "http://localhost:3000/users?limit=abc"

# Users: sorting and filters
curl -s "http://localhost:3000/users?sortBy=username&order=asc"
curl -i "http://localhost:3000/users?sortBy=email"
curl -i "http://localhost:3000/users?order=sideways"
curl -s "http://localhost:3000/users?isPrivate=true"
curl -s "http://localhost:3000/users?isPrivate=false"
curl -s "http://localhost:3000/users?search=sh"
curl -s "http://localhost:3000/users?search=SH&isPrivate=false&sortBy=fullname&order=asc&limit=2"
curl -s "http://localhost:3000/users?search=zzz"
curl -i "http://localhost:3000/users?isPrivate=maybe"

# Posts: page, limit, and sorting
curl -s "http://localhost:3000/posts"
curl -s "http://localhost:3000/posts?page=3"
curl -s "http://localhost:3000/posts?page=4"
curl -s "http://localhost:3000/posts?order=asc&limit=3"
curl -i "http://localhost:3000/posts?limit=0"
curl -i "http://localhost:3000/posts?sortBy=caption"
curl -i "http://localhost:3000/posts?order=up"

# Posts: filters and date validation
curl -s "http://localhost:3000/posts?location=GOA"
curl -s "http://localhost:3000/posts?search=sunset"
curl -s "http://localhost:3000/posts?from=2026-03-01&to=2026-04-01"
curl -s "http://localhost:3000/posts?from=2026-04-01"
curl -s "http://localhost:3000/posts?location=pune&search=CHAI"
curl -s "http://localhost:3000/posts?location=mumbai&limit=2&page=2"
curl -i "http://localhost:3000/posts?from=yesterday"
```

Then verify that previous-lab CRUD still works (for example, create a user, patch a post, and delete a user). Re-run `npm run seed` to restore the standard fixture after any destructive test.

## Concepts practiced

- Seed scripts and reproducible development data.
- Express `req.query` parsing and validation.
- Pagination with `skip` and `take`.
- Whitelisted dynamic `orderBy` fields.
- Prisma `where` filters, `OR`, `contains`, and case-insensitive matching.
- Date range filtering with inclusive/exclusive boundaries.
- `count` and `$transaction` to keep pagination metadata aligned with result queries.
- The MVC separation: routes map requests, controllers validate/format responses, services query Prisma.
