import express from "express";
import { protectRoute } from "../middlewear/protectRoute.js";

import { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts, saveUnsavePost, getSavedPosts, unsaveAllPosts } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.get("/saved", protectRoute, getSavedPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.post("/save/:id", protectRoute, saveUnsavePost);
router.post("/unsave", protectRoute, unsaveAllPosts)
router.delete("/:id", protectRoute, deletePost);

export default router;