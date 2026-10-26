
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../services/users.service.js";

export async function create(req, res) {
  const { username, email, fullname, bio } = req.body;

  if (!username || !email || !fullname) {
    return res.status(400).json({
      error: "username, email and fullname are required",
    });
  }

  try {
    const user = await createUser({
      username,
      email,
      fullname,
      bio,
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "username or email already taken",
      });
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
  const { isPrivate, search, hasPosts } = req.query;

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

  const allowedSortFields = ["createdAt", "username", "fullname"];
  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, username, fullname",
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({
      error: "order must be asc or desc",
    });
  }

  const where = {};
  if (isPrivate !== undefined) {
    if (isPrivate !== "true" && isPrivate !== "false") {
      return res.status(400).json({
        error: "isPrivate must be true or false",
      });
    }
    where.isPrivate = isPrivate === "true";
  }

  if (typeof search === "string" && search.length > 0) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  if (hasPosts !== undefined && hasPosts !== "true" && hasPosts !== "false") {
    return res.status(400).json({
      error: "hasPosts must be true or false",
    });
  }

  if (hasPosts !== undefined) {
    where.posts = hasPosts === "true" ? { some: {} } : { none: {} };
  }

  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await listUsers(skip, limit, sortBy, order, where);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: users,
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
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
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
    return res.status(404).json({ error: "User not found" });
  }

  const { fullname, bio, isPrivate } = req.body;
  const data = {};

  if (fullname !== undefined) data.fullname = fullname;
  if (bio !== undefined) data.bio = bio;
  if (isPrivate !== undefined) data.isPrivate = isPrivate;

  try {
    const user = await updateUser(id, data);
    return res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
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
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await deleteUser(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
