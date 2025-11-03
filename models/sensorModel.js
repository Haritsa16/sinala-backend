import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  pHsensor: Number,
  ECSensor: Number,
  Tsensor: Number,
  waktu: {
    type: Date,
    default: Date.now, // ⬅️ otomatis isi waktu saat data dikirim
  },
});

export default mongoose.model("Sensor", sensorSchema);
