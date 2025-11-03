import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import Sensor from "./models/sensorModel.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔗 Ganti connection string di bawah ini dengan punyamu dari MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://sinalaits:kse1965@cluster0.jlz1wy6.mongodb.net/iot_data?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 📥 Endpoint untuk menerima data dari sensor
app.post("/api/sensor", async (req, res) => {
  try {
    const data = new Sensor(req.body);
    await data.save();
    res.json({ message: "Data sensor tersimpan!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📤 Endpoint untuk menampilkan data (30 hari terakhir)
app.get("/api/sensor", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ambil semua data 30 hari terakhir, urut dari lama → baru
    const data = await Sensor.find({ waktu: { $gte: thirtyDaysAgo } })
      .sort({ waktu: -1 }) // 🟢 urut dari BARU ke LAMA
      .lean();

    console.log(`📦 Mengirim ${data.length} data ke frontend`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Jalankan server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

// ==================== CRON JOB: Hapus data lebih dari 30 hari ====================
import cron from "node-cron";

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
