import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d"
    })

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // in miliseconds
        httpOnly: true, // to protect againts XSS (cross-site scripting) attacks
        sameSite: "strict", //to protect againts CSRF attacks (cross-site request forgery)
        secure: process.env.NODE_ENV !== "development",
    })
};