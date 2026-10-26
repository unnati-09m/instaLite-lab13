
import {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../services/posts.service.js";

export async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body;

  if (!imageUrl || authorId === undefined || authorId === null) {
    return res.status(400).json({
      error: "imageUrl and authorId are required",
    });
  }

  const parsedAuthorId = Number(authorId);
  if (!Number.isInteger(parsedAuthorId) || parsedAuthorId <= 0) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const post = await createPost({
      imageUrl,
      authorId: parsedAuthorId,
      caption,
      location,
    });

    return res.status(201).json(post);
  } catch (error) {
    // The foreign-key constraint reports an authorId that is not in User.
    if (error.code === "P2003") {
      return res.status(404).json({ error: "User not found" });
    }

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
  const { location, search, from, to } = req.query;

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

  const allowedSortFields = ["createdAt", "updatedAt", "likes"];
  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, updatedAt, likes",
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({
      error: "order must be asc or desc",
    });
  }

  const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === value
    );
  };

  if (
    (from !== undefined && !isValidDate(from)) ||
    (to !== undefined && !isValidDate(to))
  ) {
    return res.status(400).json({
      error: "from and to must be valid dates",
    });
  }

  const where = {};

  if (typeof location === "string" && location.length > 0) {
    where.location = {
      equals: location,
      mode: "insensitive",
    };
  }

  if (typeof search === "string" && search.length > 0) {
    where.caption = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (from !== undefined || to !== undefined) {
    where.createdAt = {};
    if (from !== undefined) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to !== undefined) {
      // 'to' is exclusive, so a monthly date range has no overlap.
      where.createdAt.lt = new Date(`${to}T00:00:00.000Z`);
    }
  }

  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await listPosts(skip, limit, sortBy, order, where);
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
