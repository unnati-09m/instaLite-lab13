import prisma from "../src/db.js";
import { users, posts } from "./seed-data.js";

async function main() {
  try {
    // Delete dependent data first so re-running the seed never duplicates rows.
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // The fixture stores ISO strings; Prisma DateTime fields need Date objects.
    const createdUsers = await prisma.user.createMany({
      data: users.map(({ createdAt, ...user }) => ({
        ...user,
        createdAt: new Date(createdAt),
      })),
    });

    const createdPosts = await prisma.post.createMany({
      data: posts.map(({ createdAt, ...post }) => ({
        ...post,
        createdAt: new Date(createdAt),
      })),
    });

    console.log(
      `🌱 Seeded ${createdUsers.count} users and ${createdPosts.count} posts`,
    );
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
