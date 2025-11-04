import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import Sensor from "./models/sensorModel.js";

dotenv.config();

const app = express();

// ✅ Aktifkan CORS
app.use(
  cors({
    origin: ["https://monitoring-sinala.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Tambahkan ini untuk preflight request
app.options(
  "*",
  cors({
    origin: ["https://monitoring-sinala.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());

// ✅ Tes route buat memastikan CORS aktif
app.get("/", (req, res) => {
  res.json({ message: "Sinala Backend is Running ✅" });
});

// --- sisanya biarkan seperti semula ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

app.post("/api/sensor", async (req, res) => {
  try {
    const data = new Sensor(req.body);
    await data.save();
    res.json({ message: "Data sensor tersimpan!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sensor", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const data = await Sensor.find({ waktu: { $gte: thirtyDaysAgo } })
      .sort({ waktu: -1 })
      .lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
