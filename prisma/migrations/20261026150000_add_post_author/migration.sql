-- Add a required author to every post.
-- Existing populated databases must be reset/reseeded before applying this migration.
ALTER TABLE "Post" ADD COLUMN "authorId" INTEGER NOT NULL;

CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

ALTER TABLE "Post"
ADD CONSTRAINT "Post_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
