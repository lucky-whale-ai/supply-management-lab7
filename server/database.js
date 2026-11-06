import "dotenv/config";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  process.env.PGDATABASE || "progress_lab7",
  process.env.PGUSER || "postgres",
  process.env.PGPASSWORD || "",
  {
    dialect: "postgres",
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    logging: false,
    define: { timestamps: false },
  },
);
