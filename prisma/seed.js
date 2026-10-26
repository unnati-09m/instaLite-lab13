import prisma from "../src/db.js";
import { users, posts, likes } from "./seed-data.js";

async function main() {
  try {
    // Delete child rows first so this script can be run repeatedly.
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Return the user rows because their generated IDs are needed below.
    const createdUsers = await prisma.user.createManyAndReturn({
      data: users.map(({ createdAt, ...user }) => ({
        ...user,
        createdAt: new Date(createdAt),
      })),
    });

    const userIdByUsername = new Map(
      createdUsers.map(({ username, id }) => [username, id]),
    );

    // Convert each fixture's author username into the actual foreign key.
    const createdPosts = await prisma.post.createManyAndReturn({
      data: posts.map(({ author, createdAt, ...post }) => ({
        ...post,
        authorId: userIdByUsername.get(author),
        createdAt: new Date(createdAt),
      })),
    });

    // Each imageUrl has a stable insta## key, but its numeric id changes.
    const postIdByKey = new Map(
      createdPosts.map((post) => [post.imageUrl.split("/")[4], post.id]),
    );

    const createdLikes = await prisma.like.createMany({
      data: likes.map(({ user, post }) => ({
        userId: userIdByUsername.get(user),
        postId: postIdByKey.get(post),
      })),
    });

    console.log(
      `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.count} likes`,
    );
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
