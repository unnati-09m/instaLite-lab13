import express from "express";
import usersRouter from "./routes/users.routes.js";
import postsRouter from "./routes/posts.routes.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "OK" });
});

app.use("/users", usersRouter);
app.use("/posts", postsRouter);

app.listen(port, () => {
  console.log("Server started on port 3000");
});
