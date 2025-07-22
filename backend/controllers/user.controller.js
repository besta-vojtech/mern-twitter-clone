import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username: username }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getUserProfile", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id); // the user we want to follow/unfollow
        const currentUser = await User.findById(req.user._id); // current user; accessible thanks to the middleware protectRoute function

        if (id == req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(400).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }); // pulling (removing) ID of the currentUser from userToModify's followers array
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } }); // pulling (removing) ID of the userToModify form currentUser's following array

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }); // pushing ID of the currentUser to the followers array of the userToModify
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } }); // pushing ID of the userToModify to the following array of the currentUser

            // send notification to the user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();

            res.status(200).json({ message: "User followed successfully" });
        }

    } catch (error) {
        console.error("Error in followUnfollowUser", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id; // the current user

        const usersFollowedByMe = await User.findById(userId._id).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId } // "ne" means "not equal to"
                }
            },
            { $sample: { size: 10 } }
        ]);

        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const SuggestedUsers = filteredUsers.slice(0, 4)

        SuggestedUsers.forEach((user) => user.password = null);

        res.status(200).json(SuggestedUsers);

    } catch (error) {
        console.error("Error in getSuggestedUsers", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if ((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must have at least 6 characters" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg) {

            if (user.profileImg) {
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]) // extracting image id from the image URL
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        if (coverImg) {

            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]) // extracting image id from the image URL
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // found on internet :D
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid email format" });
            }
            user.email = email;
        }

        if (username) {
            const existingUser = await User.findOne({ username: username });
            if (existingUser) {
                return res.status(400).json({ error: "This username is already taken" });
            }
            user.username = username;
        }

        user.fullName = fullName || user.fullName;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        // password should be null in response
        user.password = null;

        return res.status(200).json(user);

    } catch (error) {
        console.error("Error in updateUserProfile", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};