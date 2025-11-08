import express from "express";
import authenticate from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import Signal from "../models/Signal.js";

const router = express.Router();

// 🔹 Admin bisa melihat semua sinyal yang belum di-ACC
router.get("/pending", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const pending = await Signal.findAll({ where: { status: "pending" } });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data sinyal pending" });
  }
});

// 🔹 Admin bisa ACC sinyal
router.put("/approve/:id", authenticate, authorizeRoles("admin"), async (req, res) => {
  try {
    const signal = await Signal.findByPk(req.params.id);
    if (!signal) return res.status(404).json({ message: "Sinyal tidak ditemukan" });

    signal.status = "approved";
    await signal.save();
    res.json({ message: "Sinyal disetujui" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menyetujui sinyal" });
  }
});

export default router;
