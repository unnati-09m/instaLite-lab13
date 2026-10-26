import prisma from "../db.js";

export async function findPostForLike(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
}

export async function findUserForLike(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}

export async function createLike(userId, postId) {
  return prisma.like.create({
    data: { userId, postId },
  });
}

export async function deleteLike(userId, postId) {
  return prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}
