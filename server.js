// server.js
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import Sensor from "./models/sensorModel.js";

dotenv.config();

const app = express();

// ========================
// 🔐 KONFIGURASI CORS
// ========================
app.use(
  cors({
    origin: [
      "https://monitoring-sinala.vercel.app", // frontend di vercel
      "http://localhost:5173", // local dev (vite)
      "http://127.0.0.1:5500", // local dev (live server)
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ========================
// 🔧 MIDDLEWARE
// ========================
app.use(bodyParser.json({ limit: "1mb" }));

// ========================
// 🩵 ROUTE UTAMA
// ========================
app.get("/", (req, res) => {
  res.json({ message: "✅ Sinala Backend is Running" });
});

// ========================
// 🧠 KONEKSI MONGODB
// ========================
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI belum diset di environment variable!");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message || err);
    process.exit(1);
  });

// ========================
// 📩 ENDPOINT: SIMPAN DATA SENSOR
// ========================
app.post("/api/sensor", async (req, res) => {
  try {
    const { pHsensor, ECSensor, Tsensor, waktu } = req.body;

    // Validasi tipe data
    if (
      (pHsensor !== undefined && typeof pHsensor !== "number") ||
      (ECSensor !== undefined && typeof ECSensor !== "number") ||
      (Tsensor !== undefined && typeof Tsensor !== "number")
    ) {
      return res.status(400).json({
        error: "Invalid payload — semua nilai harus berupa angka",
      });
    }

    const data = new Sensor({
      pHsensor,
      ECSensor,
      Tsensor,
      ...(waktu ? { waktu } : {}),
    });

    await data.save();
    res.json({ message: "✅ Data sensor berhasil disimpan" });
  } catch (err) {
    console.error("POST /api/sensor error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// ========================
// 📤 ENDPOINT: AMBIL DATA SENSOR 30 HARI TERAKHIR
// ========================
app.get("/api/sensor", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Sensor.find({ waktu: { $gte: thirtyDaysAgo } })
      .sort({ waktu: -1 })
      .lean();

    res.json(data);
  } catch (err) {
    console.error("GET /api/sensor error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// ========================
// 🧹 CRON JOB: HAPUS DATA LAMA >30 HARI (TIAP JAM 00:00)
// ========================
cron.schedule("0 0 * * *", async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await Sensor.deleteMany({ waktu: { $lt: thirtyDaysAgo } });
    console.log(`🧹 Cron job: ${result.deletedCount} data lama dihapus`);
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

// ========================
// ⚠️ HANDLER ERROR GLOBAL
// ========================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// ========================
// 🚀 START SERVER
// ========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
