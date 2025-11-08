// routes/auth.js - FOCUS ON LOGIN ONLY
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// GET CURRENT USER DATA
router.get("/user", async (req, res) => {
  try {
    console.log('🔐 GET /api/auth/user called');
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔑 Token present:', token ? 'YES' : 'NO');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ Token decoded userId:', decoded.userId);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    console.log('👤 User found:', user ? user.username : 'NOT FOUND');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.fullname,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Server error: ' + error.message 
    });
  }
});


// LOGIN ONLY
router.post("/login", async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username and password are required" 
      });
    }

    const user = await User.findOne({ where: { username } });
    console.log('👤 User found:', user ? user.username : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', match);
    
    if (!match) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Create token
      const token = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: user.role   // ✅ tambahkan role ke dalam token
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: "24h" }
      );


    console.log('✅ Login successful for user:', user.username);
    
    res.json({ 
      success: true,
      message: "Login success", 
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.fullname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
});

// Optional: Register
router.post("/register", async (req, res) => {
  try {
    const { username, password, fullname } = req.body;

    if (!username || !password || !fullname) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "Username already exists" 
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      password: hashed, 
      fullname 
    });

    res.json({ 
      success: true,
      message: "Register success",
      user: {
        id: user.id,
        username: user.username,
        name: user.fullname
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
});

export default router;