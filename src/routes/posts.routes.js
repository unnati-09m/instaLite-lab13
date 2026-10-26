
import express from "express";
import {
  create,
  list,
  getOne,
  update,
  remove,
  listLikes,
} from "../controllers/posts.controller.js";
import { likePost, unlikePost } from "../controllers/likes.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.post("/:id/likes", likePost);
router.delete("/:id/likes/:userId", unlikePost);
router.get("/:id/likes", listLikes);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
