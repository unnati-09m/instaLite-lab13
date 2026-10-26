# InstaLite PS3 — Relations, Likes, and Related Queries

## Goal

PS3 adds relationships between users and posts, plus a separate Like table. It then uses those relationships in seed data, read endpoints, write endpoints, relation filters, pagination, and cascading deletes.

## Step-by-step implementation

### Step 01 — User to Post (one-to-many)

**Files:** `prisma/schema.prisma`, `prisma/migrations/20261026150000_add_post_author/migration.sql`

- A Post now has a required `authorId` foreign key and an `author` relation to User.
- User has the reverse `posts Post[]` relation.
- Posts have an index on `authorId`.
- The relation uses `onDelete: Cascade`, so deleting an author also deletes their posts.

A required foreign key cannot be safely added to a populated table unless every existing row is assigned a valid author. The PS3 fixture provides the intended records, so the local database must be reset/recreated and seeded after the migrations are in place.

### Step 02 — Explicit many-to-many Like relation

**Files:** `prisma/schema.prisma`, `prisma/migrations/20261026150100_add_likes/migration.sql`

- Adds `Like`, with `userId`, `postId`, and `createdAt`.
- `@@id([userId, postId])` is a composite primary key. There is no separate `id` field.
- The foreign keys cascade on deletion, and `postId` has an index.
- User and Post both expose a `likes Like[]` relation.

The composite key prevents the same user from liking the same post twice at the database level. The API catches Prisma's duplicate-key error to return the required HTTP 409 response.

### Step 03 — Related seed data

**Files:** `prisma/seed-data.js`, `prisma/seed.js`

- Keeps the same 12 users and 24 posts, but each post fixture now names its author by username.
- Adds the lab's 29 likes using the username and the `insta##` identifier from the image URL, not hard-coded numeric IDs.
- The seed script deletes likes, posts, and users in that order, then creates the groups in batches.
- It uses `createManyAndReturn` to get generated user/post IDs, builds lookup maps, and inserts the likes.
- It prints the counts returned by Prisma and disconnects even if an error occurs.

### Step 04 — Require an author when creating a post

**File:** `src/controllers/posts.controller.js`

- `POST /posts` requires both `imageUrl` and `authorId`.
- Missing fields return HTTP 400 with `imageUrl and authorId are required`.
- An invalid/nonexistent author returns HTTP 404 with `User not found`.
- `PATCH /posts/:id` still only accepts `caption` and `location`; any supplied `authorId` is ignored.

### Step 05 — Read one post with author and like count

**File:** `src/services/posts.service.js`

- `GET /posts/:id` fetches the post, its author summary, and the count of likes in one Prisma query.
- The nested author uses `select` for only `id`, `username`, and `fullname`; the user's email is not exposed.
- A missing post still returns `404 { "error": "Post not found" }`.

### Step 06 — Add author/count data and like sorting to the post list

**Files:** `src/controllers/posts.controller.js`, `src/services/posts.service.js`

- Every item from `GET /posts` includes the author summary and `_count: { likes }`.
- `sortBy=likes` sorts by like count. Ties use `createdAt: "desc"` no matter whether the main like sort is ascending or descending.
- The allowed sort fields are now `createdAt`, `updatedAt`, and `likes`, with the exact required error message.
- Existing filters, pagination, and the transaction for posts plus total count remain in place.

### Step 07 — User counts and `hasPosts`

**Files:** `src/controllers/users.controller.js`, `src/services/users.service.js`

- `GET /users/:id` now includes `_count: { posts, likes }`.
- `GET /users?hasPosts=true` returns users who have at least one post.
- `GET /users?hasPosts=false` returns users with no posts.
- Invalid values return HTTP 400 with `hasPosts must be true or false`.
- This filter works with `isPrivate`, `search`, sorting, and pagination; the count applies the same combined filters.

### Step 08 — Shared pagination and posts by user

**Files:** `src/utils/pagination.js`, `src/controllers/users.controller.js`, `src/services/users.service.js`, `src/routes/users.routes.js`

- Moves page/limit validation into `parsePagination()`, shared by `GET /users`, `GET /posts`, and `GET /users/:id/posts`.
- Keeps the same error text, default page 1, default limit 10, and cap of 50.
- Adds `GET /users/:id/posts`: that user's posts, newest first, paginated with `{ data, meta }`.
- Each post in this endpoint includes `_count: { likes }`, and the total count covers only posts by that user.
- Unknown user IDs return `404 User not found`.

### Step 09 — List users who liked a post

**Files:** `src/services/posts.service.js`, `src/controllers/posts.controller.js`, `src/routes/posts.routes.js`

- Adds `GET /posts/:id/likes`.
- Returns a plain array of user summaries, sorted by username ascending.
- An existing post with no likes returns `[]`; a missing post returns `404 Post not found`.
- Nested user data only contains `id`, `username`, and `fullname`.

### Step 10 — Like and unlike

**Files:** `src/services/likes.service.js`, `src/controllers/likes.controller.js`, `src/routes/posts.routes.js`

- `POST /posts/:id/likes` requires `{ "userId": number }`.
- It returns HTTP 201 with `{ userId, postId, createdAt }` when successful.
- It validates in the required order and returns the lab's exact 400/404 messages. Duplicate insertion catches Prisma `P2002` and returns `409 { "error": "Already liked" }`.
- `DELETE /posts/:id/likes/:userId` deletes using the composite key. It returns 204 with an empty response, or 404 `Like not found` if that like does not exist.

### Step 11 — Verify cascade behaviour

No extra endpoint code is required for this step. The foreign keys added in Steps 01 and 02 implement the cascade:

- Deleting a user deletes their posts.
- Deleting that user's posts also deletes likes on those posts.
- Likes the user gave to other people's posts are deleted as well.

Run the Step 11 checks in the handout after re-seeding, then re-seed again to restore the standard dataset.

### Step 12 — Bonus: posts liked by a user

**Files:** `src/services/users.service.js`, `src/controllers/users.controller.js`, `src/routes/users.routes.js`

- Adds `GET /users/:id/liked-posts`.
- Queries the Post model using the relation filter `likes: { some: { userId } }`, rather than fetching IDs from Like and looping.
- Returns newest-first posts with author summaries and like counts, paginated with `{ data, meta }`.
- The posts query and matching count use one Prisma transaction; an unknown user returns 404.

### Prisma CLI configuration

**File:** `prisma.config.ts`

The repository now uses the standard Prisma config filename and registers `node prisma/seed.js` as the seed command, so `npx prisma db seed` and `npm run seed` can find it without a custom `--config` argument.

## Commits

- [Step 01 — Add required author relation to posts](https://github.com/unnati-09m/instaLite-lab13/commit/f9d67ae7d3ba783408ec9eae1dd80a6a9de80c07)
- [Step 02 — Add explicit Like relation with composite key](https://github.com/unnati-09m/instaLite-lab13/commit/9383496789fc64f31ec449ee0aa0e7ae6193d107)
- [Step 03 — Seed post authors and likes by stable fixture keys](https://github.com/unnati-09m/instaLite-lab13/commit/9b666779bdc1941d52fef4585d465bdd821297cd)
- [Step 04 — Require an existing author when creating posts](https://github.com/unnati-09m/instaLite-lab13/commit/2428fcc54e756f90f515d78fd398667c6a8610dd)
- [Step 05 — Include post author summary and like count](https://github.com/unnati-09m/instaLite-lab13/commit/b346e8ffdab2dddca98666399cef175176f0b407)
- [Step 06 — Include post authors and sort by like count](https://github.com/unnati-09m/instaLite-lab13/commit/2ac0d010121a3d42f7644e15100f3fa7ed342528)
- [Step 07 — Add user relation counts and hasPosts filter](https://github.com/unnati-09m/instaLite-lab13/commit/dd42911104f347cea37d0c2007503056e05911e1)
- [Step 08 — Share pagination logic and add user posts endpoint](https://github.com/unnati-09m/instaLite-lab13/commit/42d55ca68301929cb498d7a25d3fadac85d3da6f)
- [Date validation correction](https://github.com/unnati-09m/instaLite-lab13/commit/c929f5e219fc70540e4412ddb6d5542bd0751637)
- [Step 09 — Add endpoint listing users who liked a post](https://github.com/unnati-09m/instaLite-lab13/commit/cb871489a71e0261409274dbe3096fbaa1102e39)
- [Step 10 — Add like and unlike post endpoints](https://github.com/unnati-09m/instaLite-lab13/commit/d15ad7f704e9338085b4f0f6e500165134f8711e)
- [Step 12 — Add paginated liked-posts endpoint](https://github.com/unnati-09m/instaLite-lab13/commit/78e9b99ac127462be53a61e175e73abe2611a1a2)
- [Use the standard Prisma CLI config filename](https://github.com/unnati-09m/instaLite-lab13/commit/30ea2ff944c82046a02ed657a9a785f2198e03bf)
- [Remove superseded Prisma config file](https://github.com/unnati-09m/instaLite-lab13/commit/871b565ec4e7863ccdbd19e097d9be1a6b7ef872)

## Local setup and verification

**Important:** the reset command deletes the current database contents and rebuilds the schema from migrations. Do this only for the local PS3 development database.

From the project root:

```bash
git pull origin master
npx prisma validate
npx prisma generate
npx prisma migrate reset
npm run seed
node src/index.js
```

The seed is deterministic; after seeding, expect 12 users, 24 posts, and 29 likes. If the reset runs the seed automatically, running `npm run seed` once more is safe and restores the same fixture.

Run the PS3 tests from the handout. A representative checklist:

```bash
# Related post data
curl -s "http://localhost:3000/posts?limit=2"
curl -s "http://localhost:3000/posts?sortBy=likes&limit=5"
curl -s "http://localhost:3000/posts?sortBy=likes&order=asc&limit=3"
curl -i "http://localhost:3000/posts?sortBy=comments"
curl -s "http://localhost:3000/posts?location=goa&sortBy=likes"

# User counts and relation filter
curl -s "http://localhost:3000/users?hasPosts=false"
curl -s "http://localhost:3000/users?hasPosts=true"
curl -s "http://localhost:3000/users?hasPosts=true&isPrivate=true"
curl -i "http://localhost:3000/users?hasPosts=yes"

# Replace placeholders with IDs obtained from the seeded responses.
curl -s "http://localhost:3000/users/<RIYA_ID>/posts?limit=3"
curl -s "http://localhost:3000/posts/<INSTA01_ID>/likes"
curl -i -X POST "http://localhost:3000/posts/<INSTA05_ID>/likes" -H "Content-Type: application/json" -d '{"userId":<RIYA_ID>}'
curl -i -X DELETE "http://localhost:3000/posts/<INSTA05_ID>/likes/<RIYA_ID>"
curl -s "http://localhost:3000/users/<RIYA_ID>/liked-posts"
```

Re-seed before the Step 11 deletion experiment and re-seed again afterward. Also re-test some PS1/PS2 CRUD and filters so the earlier endpoints are still working.

## Viva notes

1. **Why did adding required `authorId` fail on existing rows?** Existing posts had no author value to populate the required foreign key with. The old rows must be cleared/backfilled before that constraint can be enforced.
2. **Why does Like have a composite primary key?** The pair `(userId, postId)` must be unique, so a user cannot like the same post twice; the database enforces it.
3. **Why make Like explicit?** It stores the `createdAt` timestamp on each like.
4. **include vs select?** `include` adds related data while keeping the main record's fields; `select` returns only the selected fields. Author summaries use `select` so nested users' emails aren't sent.
5. **What is N+1?** Fetching a page and then querying the author and like count separately for every post causes many extra queries. Relation includes and `_count` avoid the per-post loop.
6. **Why catch P2002?** The database's unique constraint handles duplicate likes safely, even if two like requests arrive at almost the same time.
7. **Why did Arjun's like count change after Riya was deleted?** Likes attached to Riya's deleted posts were also deleted, including likes Arjun gave those posts.
8. **Cascade vs Restrict?** Cascade suits content that should disappear with its owner; financial/audit records usually need retention, so restricting deletion or soft deletion is safer.

## Verification status

The code and migration files have been committed and pushed to GitHub. The Prisma commands and HTTP tests above have **not** been executed against the local PostgreSQL database from this environment. Treat PS3 as implemented in the repository, and locally verified only after the checklist passes.
