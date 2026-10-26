
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
