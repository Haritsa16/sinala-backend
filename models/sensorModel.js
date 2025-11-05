// models/sensorModel.js
import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  pHsensor: { type: Number, required: true },
  ECSensor: { type: Number, required: true },
  Tsensor: { type: Number, required: true },
  waktu: {
    type: Date,
    default: Date.now, // otomatis isi waktu saat data dikirim
  },
});

export default mongoose.model("Sensor", sensorSchema);
