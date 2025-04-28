const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModalidadSchema = new Schema({
  nombre: { type: String, required: true },
  horarios: {
      lunes: { type: String, default: null },
      martes: { type: String, default: null },
      miercoles: { type: String, default: null },
      jueves: { type: String, default: null },
      viernes: { type: String, default: null },
      sabado: { type: String, default: null }
  },
  costo: { type: Number, required: true },
});

module.exports = mongoose.model('Modalidad', ModalidadSchema);