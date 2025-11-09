// server.js - HYBRID FIXED VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import signalRoutes from "./routes/signalRoutes.js";
import sequelize from "./config/db.js";
import User from "./models/User.js";
import Signal from "./models/Signal.js";
import signal from "./routes/signal.js";

dotenv.config();
const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Log requests untuk debug
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.url}`);
  next();
});

// ✅ ROUTES UTAMA
app.use("/api/auth", authRoutes);    // Login/Register ada di sini
app.use("/api/admin", adminRoutes);
app.use("/api", signalRoutes);
app.use("/api/signals", signal);


// ✅ ✅ ✅ DASHBOARD ROUTES - UNCOMMENT YANG INI ✅ ✅ ✅
// Get current user data
app.get("/api/user", async (req, res) => {
  try {
    console.log('🔐 GET /api/user called');
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔑 Token present:', token ? 'YES' : 'NO');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ Token decoded userId:', decoded.userId);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    console.log('👤 User found:', user ? user.username : 'NOT FOUND');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.fullname,
      role: user.role
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get user's signals
app.get("/api/signals/user", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const signals = await Signal.findAll({
      where: { created_by: decoded.userId }, // ✅ created_by, bukan userId
      order: [['created_at', 'DESC']]
    });

    res.json(signals || []);
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.json([]);
  }
});

// Get pending signals count
app.get("/api/signals/pending/count", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const count = await Signal.count({
      where: { 
        created_by: decoded.userId, // ✅ created_by, bukan userId
        status: 'pending'
      }
    });

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting pending signals:', error);
    res.json({ count: 0 });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    database: "Connected",
    timestamp: new Date().toISOString()
  });
});

// Sync database
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Database synced successfully');
  })
  .catch((error) => {
    console.error('❌ Database sync error:', error);
  });

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
  console.log("🔑 Login endpoint: POST /api/auth/login");
  console.log("📊 Dashboard endpoints:");
  console.log("   GET /api/user");
  console.log("   GET /api/signals/user"); 
  console.log("   GET /api/signals/pending/count");
});