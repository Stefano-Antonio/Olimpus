// models/Pago.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PagoSchema = new Schema({
  alumno: { type: Schema.Types.ObjectId, ref: 'Alumno', required: true },
  costo: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pago', PagoSchema);
