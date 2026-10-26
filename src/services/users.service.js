
import prisma from "../db.js";

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function listUsers(
  skip,
  take,
  sortBy = "createdAt",
  order = "desc",
  where = {},
) {
  return prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: order,
      },
    }),
    prisma.user.count({ where }),
  ]);
}
export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function listPostsByUser(userId, skip, take) {
  const where = { authorId: userId };

  return prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);
}
