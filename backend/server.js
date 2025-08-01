import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLAUDINARY_CLOUD_NAME,
    api_key: process.env.CLAUDINARY_API_KEY,
    api_secret: process.env.CLAUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve(); // Get the root directory of the project

// Middleware
app.use(express.json({ limit: "5mb" })) // for accessing request json bodies (req.body) // with a limit of 5mb (limit shouldn't be too high to prevent DoS attacks)
app.use(express.urlencoded({ extended: true })); // to parse form data (urlencoded)
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "./frontend/dist"))); // Serve static files from the React frontend app

    app.get("/*catchall", (req, res) => {
        res.sendFile(path.resolve(__dirname, "./frontend/dist/index.html")); // Serve the React app for any other route
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
});