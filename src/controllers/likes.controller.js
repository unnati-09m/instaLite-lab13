import {
  createLike,
  deleteLike,
  findPostForLike,
  findUserForLike,
} from "../services/likes.service.js";

export async function likePost(req, res) {
  const { userId } = req.body ?? {};

  // Follow the lab's required order: missing body, post, user, duplicate.
  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: "userId is required" });
  }

  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await findPostForLike(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await findUserForLike(parsedUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    try {
      const createdLike = await createLike(parsedUserId, postId);
      return res.status(201).json(createdLike);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Already liked" });
      }
      if (error.code === "P2003") {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function unlikePost(req, res) {
  const postId = Number(req.params.id);
  const userId = Number(req.params.userId);

  if (
    !Number.isInteger(postId) ||
    postId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await deleteLike(userId, postId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
