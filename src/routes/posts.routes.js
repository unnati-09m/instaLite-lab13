
import express from "express";
import {
  create,
  list,
  getOne,
  update,
  remove,
} from "../controllers/posts.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
