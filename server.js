import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import http from "http"; // ⚡ buat self-ping anti sleep
import Sensor from "./models/sensorModel.js";

dotenv.config();

const app = express();

// =============================
// === CORS & Middleware ===
// =============================
app.use(
  cors({
    origin: [
      "https://monitoring-sinala.vercel.app", // frontend di vercel
      "http://localhost:5173", // lokal dev
      "http://127.0.0.1:5500",
      "*", // ✅ supaya ESP32 bisa POST
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(bodyParser.json());

// =============================
// === ROUTES ===
// =============================
app.get("/", (req, res) => {
  res.json({ message: "Sinala Backend is Running ✅" });
});

// =============================
// === MongoDB Connection ===
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// =============================
// === POST Data Sensor (ESP32) ===
// =============================
app.post("/api/sensor", async (req, res) => {
  try {
    console.log("📩 Data masuk dari ESP32:", req.body);
    const data = new Sensor(req.body);
    await data.save();
    res.json({ message: "Data sensor tersimpan!" });
  } catch (err) {
    console.error("❌ Error simpan data:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// === GET Data Sensor (30 Hari) ===
// =============================
app.get("/api/sensor", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await Sensor.find({ waktu: { $gte: thirtyDaysAgo } })
      .sort({ waktu: -1 })
      .lean();
    res.json(data);
  } catch (err) {
    console.error("❌ Error ambil data:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// === Jalankan Server ===
// =============================
const PORT = process.env.PORT || 8080;
console.log("PORT dari environment:", process.env.PORT);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// =============================
// === Anti Sleep Ping (Railway) ===
// =============================
// Self-ping ke domain Railway tiap 5 menit biar gak auto sleep
setInterval(() => {
  http
    .get("https://sinala-backend-production.up.railway.app", (res) => {
      console.log("💤 Keep-alive ping sent:", res.statusCode);
    })
    .on("error", (err) => {
      console.error("Ping error:", err.message);
    });
}, 1000 * 60 * 5); // setiap 5 menit

// =============================
// === Cron Job Hapus Data Lama ===
// =============================
cron.schedule("0 0 * * *", async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  await Sensor.deleteMany({ waktu: { $lt: thirtyDaysAgo } });
  console.log("🧹 Data lebih dari 30 hari dihapus otomatis");
});
