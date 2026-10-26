
import express from "express";
import {
  create,
  list,
  getOne,
  update,
  remove,
  listUserPosts,
} from "../controllers/users.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id/posts", listUserPosts);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
