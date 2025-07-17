import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { text } = req.body;
        let { img } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!text && !img) {
            return res.status(400).json({ error: "Post must have text or image" });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }
        const newPost = new Post({
            user: userId,
            text: text || "",
            img: img || "",
        });

        await newPost.save();

        return res.status(201).json({ newPost });
    } catch (error) {
        console.error("Error in createPost:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const userId = req.user._id;
        const { text } = req.body;

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (!text) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        const comment = {
            user: userId,
            text: text,
            createdAt: new Date(),
        };

        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);

    } catch (error) {
        console.error("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // unlike the post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } })

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());

            return res.status(200).json(updatedLikes);
        } else {
            // like the post  
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like",
            });

            await notification.save();

            const updatedLikes = post.likes;

            return res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.error("Error in likeUnlikePost controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password",    // find() -> returns all posts; createdAt: -1 -> in descending order (latest post first); populate({path:"user", select:"-password"}) -> it inserts the whole user object into the response without the password (otherwise we only get the user's ID);
        })
            .populate({
                path: "comments.user",  // also populate the user field inside the post comments
                select: "-password",
            });

        if (posts.length === 0) {
            return res.status(200).json([])
        }

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getAllPosts controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.error("Error in getLikedPosts controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const following = user.following;

        const feedPosts = await Post.find({ user: { $in: following } })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(feedPosts);
    } catch (error) {
        console.error("Error in getFollowingPosts controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const username = req.params.username;

        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getUserPosts controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
