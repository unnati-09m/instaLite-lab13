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


app.get('/health', (req, res) => {
   res.status(200).json({ status: "OK" });
});



app.listen(port, () => {
  console.log("Server started on port 3000");
});

