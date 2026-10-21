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


app.get('/health', (req, res) => {
   res.status(200).json({ status: "OK" });
});



app.listen(port, () => {
  console.log("Server started on port 3000");
});

