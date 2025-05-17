const mongoose = require("mongoose");

const CitaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fecha: { type: Date, required: true },
  descripcion: { type: String },
  creadaEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cita", CitaSchema);

