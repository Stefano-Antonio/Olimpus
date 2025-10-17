const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Gasto', gastoSchema);