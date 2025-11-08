// middleware/auth.js - FIXED VERSION
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari DB biar dapat role juga
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Set data lengkap user ke request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }
}
