
import prisma from "../db.js";

export async function createPost(data) {
  return prisma.post.create({ data });
}

export async function listPosts() {
  return prisma.post.findMany();
}

export async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
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
