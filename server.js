import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import Sensor from "./models/sensorModel.js";

dotenv.config();

const app = express();

// 🧠 Tambahkan konfigurasi CORS di sini:
app.use(
  cors({
    origin: ["https://monitoring-sinala.vercel.app", "http://localhost:5173"], // tambahkan domain frontend kamu di sini
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());

// ✅ Root endpoint (buat tes server)
app.get("/", (req, res) => {
  res.send("✅ Sinala Backend is Running!");
});

// ✅ MongoDB connection
console.log("🚀 Starting Express server...");
console.log("📡 Connecting to MongoDB Atlas...");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 📥 Endpoint POST data sensor
app.post("/api/sensor", async (req, res) => {
  try {
    const data = new Sensor(req.body);
    await data.save();
    res.json({ message: "Data sensor tersimpan!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📤 Endpoint GET data 30 hari terakhir
app.get("/api/sensor", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Sensor.find({ waktu: { $gte: thirtyDaysAgo } })
      .sort({ waktu: -1 })
      .lean();

    console.log(`📦 Mengirim ${data.length} data ke frontend`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Jalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 🧹 Cron job hapus data lama (>30 hari)
cron.schedule("0 0 * * *", async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await Sensor.deleteMany({ waktu: { $lt: thirtyDaysAgo } });
    console.log(
      `🧹 Hapus ${result.deletedCount} data lama (lebih dari 30 hari)`
    );
  } catch (err) {
    console.error("❌ Error saat hapus data lama:", err);
  }
});
