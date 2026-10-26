
import prisma from "../db.js";

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function listUsers(skip, take) {
  return prisma.user.findMany({
    skip,
    take,
    orderBy: {
      id: "asc",
    },
  });
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
