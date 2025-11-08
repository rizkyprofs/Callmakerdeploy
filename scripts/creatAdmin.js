// createAdmin.js
import bcrypt from "bcryptjs";
import sequelize from "../backend/config/db.js";
import User from "../backend/models/User.js";

const createAdmin = async () => {
  try {
    // hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // buat user admin baru
    const newUser = await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      fullname: "Administrator",
    });

    console.log("✅ Admin user created successfully:");
    console.log({
      username: newUser.username,
      password: "admin123", // password asli untuk login
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
