// routes/signalRoutes.js - QUICK FIX
import express from "express";
import Signal from "../models/Signal.js";
import authenticateToken from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const router = express.Router();

// GET signals dengan filter berdasarkan role
router.get("/signals", authenticateToken, async (req, res) => {
  try {
    let whereCondition = {};
    
    // Filter berdasarkan role
    if (req.user.role === "user") {
      whereCondition.status = "approved";
    } else if (req.user.role === "callmaker") {
      whereCondition.created_by = req.user.id;
    }
    // Admin bisa lihat semua signals

    // ✅ FIX: Remove include untuk sementara
    const signals = await Signal.findAll({
      where: whereCondition,
      order: [['created_at', 'DESC']]
    });

    res.json(signals);
  } catch (error) {
    console.error("Get signals error:", error);
    res.status(500).json({ message: "Error fetching signals" });
  }
});

// CREATE signal (hanya callmaker & admin)
router.post("/signals", authenticateToken, authorizeRoles(["callmaker", "admin"]), async (req, res) => {
  try {
    const { coin_name, entry_price, target_price, stop_loss, note, chart_image } = req.body;
    
    if (!coin_name || !entry_price || !target_price || !stop_loss) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const signal = await Signal.create({
      coin_name,
      entry_price: parseFloat(entry_price),
      target_price: parseFloat(target_price),
      stop_loss: parseFloat(stop_loss),
      note,
      chart_image,
      created_by: req.user.id,
      status: req.user.role === "admin" ? "approved" : "pending"
    });

    // ✅ FIX: Return signal tanpa include
    res.status(201).json({ 
      message: req.user.role === "admin" ? "Signal published" : "Signal submitted for approval",
      signal
    });
  } catch (error) {
    console.error("Create signal error:", error);
    res.status(500).json({ message: "Error creating signal" });
  }
});

export default router;
// ... other routes tetap sama (tapi remove include juga) ...