
import {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../services/posts.service.js";

export async function create(req, res) {
  const { imageUrl, caption, location } = req.body;

  if (!imageUrl) {
    return res.status(400).json({
      error: "imageUrl is required",
    });
  }

  try {
    const post = await createPost({
      imageUrl,
      caption,
      location,
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function list(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const requestedLimit =
    req.query.limit === undefined ? 10 : Number(req.query.limit);
  const sortBy = req.query.sortBy ?? "createdAt";
  const order = req.query.order ?? "desc";

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(requestedLimit) ||
    page < 1 ||
    requestedLimit < 1
  ) {
    return res.status(400).json({
      error: "page and limit must be positive integers",
    });
  }

  const allowedSortFields = ["createdAt", "updatedAt"];
  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, updatedAt",
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({
      error: "order must be asc or desc",
    });
  }

  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await listPosts(skip, limit, sortBy, order);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getOne(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await getPostById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function update(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { caption, location } = req.body;
  const data = {};

  if (caption !== undefined) data.caption = caption;
  if (location !== undefined) data.location = location;

  try {
    const post = await updatePost(id, data);
    return res.status(200).json(post);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function remove(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    await deletePost(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
