
import prisma from "../db.js";

export async function createPost(data) {
  return prisma.post.create({ data });
}

export async function listPosts(
  skip,
  take,
  sortBy = "createdAt",
  order = "desc",
  where = {},
) {
  const orderBy =
    sortBy === "likes"
      ? [{ likes: { _count: order } }, { createdAt: "desc" }]
      : { [sortBy]: order };

  return prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);
}

export async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: { likes: true },
      },
    },
  });
}

export async function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data,
  });
}

export async function deletePost(id) {
  return prisma.post.delete({
    where: { id },
  });
}

export async function getPostLikers(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      likes: {
        orderBy: {
          user: { username: "asc" },
        },
        select: {
          user: {
            select: {
              id: true,
              username: true,
              fullname: true,
            },
          },
        },
      },
    },
  });
}
