import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import Sensor from "./models/sensorModel.js";

dotenv.config();

const app = express();

// 🧠 AKTIFKAN CORS DI PALING ATAS
app.use(
  cors({
    origin: [
      "https://monitoring-sinala.vercel.app", // frontend di vercel
      "http://localhost:5173", // lokal dev
      "http://127.0.0.1:5500",
      "*", // ✅ tambah ini agar ESP32 bisa POST langsung
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());

// ✅ Tes route
app.get("/", (req, res) => {
  res.json({ message: "Sinala Backend is Running ✅" });
});

// ✅ MongoDB Atlas Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ POST data sensor dari ESP32
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

// ✅ GET data sensor (30 hari terakhir)
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

// ✅ Jalankan server di Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 🧹 Cron job hapus data lama (tiap tengah malam)
cron.schedule("0 0 * * *", async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  await Sensor.deleteMany({ waktu: { $lt: thirtyDaysAgo } });
  console.log("🧹 Data lebih dari 30 hari dihapus otomatis");
});
