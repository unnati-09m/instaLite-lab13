import express from "express" ;
const app = express();
const port = 3000;
app.use(express.json());

import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

// Step 4: POST /users

app.post("/users", async (req, res) => {
  const { username, email, fullname, bio } = req.body;

  if (!username || !email || !fullname) {
    return res.status(400).json({
      error: "username, email and fullname are required",
    });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullname,
        bio,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "username or email already taken",
      });
    }

    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Step 5: GET /users

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Step 6: GET /users/:id
app.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get('/health', (req, res) => {
   res.status(200).json({ status: "OK" });
});

// Step 7: PATCH /users/:id
app.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { fullname, bio, isPrivate } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  const data = {};

  if (fullname !== undefined) data.fullname = fullname;
  if (bio !== undefined) data.bio = bio;
  if (isPrivate !== undefined) data.isPrivate = isPrivate;

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});
// Step 8: DELETE /users/:id
app.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "User not found",
      });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log("Server started on port 3000");
});

