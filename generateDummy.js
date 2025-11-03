// generateDummy.js
import mongoose from "mongoose";
import Sensor from "./models/sensorModel.js";

// === KONFIGURASI MONGODB ===
const MONGO_URI =
  "mongodb+srv://sinalaits:kse1965@cluster0.jlz1wy6.mongodb.net/iot_data?retryWrites=true&w=majority&appName=Cluster0";

await mongoose.connect(MONGO_URI);
console.log("✅ Terkoneksi ke MongoDB Atlas");

// === GENERATE 30 HARI DATA (setiap 10 menit) ===
const now = new Date();
const dummyData = [];
const TOTAL_DATA = 144 * 30; // 144 data/hari × 30 hari = 4320 data

for (let i = TOTAL_DATA - 1; i >= 0; i--) {
  const waktu = new Date(now.getTime() - i * 10 * 60 * 1000); // mundur per 10 menit
  dummyData.push({
    waktu,
    ECSensor: (Math.random() * 20 + 10).toFixed(2), // 10–30 mS/cm
    pHsensor: (Math.random() * 3 + 6).toFixed(2), // 6–9 pH
    Tsensor: (Math.random() * 5 + 27).toFixed(2), // 27–32 °C
  });
}

console.log(`📦 Membuat ${dummyData.length} data dummy...`);

await Sensor.insertMany(dummyData);
console.log("✅ Dummy data berhasil dimasukkan ke MongoDB!");

await mongoose.disconnect();
console.log("🔌 Koneksi MongoDB ditutup.");
process.exit();
