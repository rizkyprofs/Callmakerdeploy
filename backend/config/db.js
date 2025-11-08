import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "callmaker_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
  }
);

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");
} catch (error) {
  console.error("❌ Database connection error:", error);
}

export default sequelize; // ⚠️ pakai DEFAULT EXPORT
