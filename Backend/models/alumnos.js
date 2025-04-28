const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlumnoSchema = new Schema({
  id_modalidad: { type: String, required: true },
  fecha_nacimiento: { type: Date, required: true },
  fecha_inscripcion: { type: Date, default: Date.now, required: true },
  pago_pendiente: { type: Number, default: 0 },
  pagos_realizados: { type: Number, default: 0 },
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  correo: { type: String, required: true }
});

module.exports = mongoose.model('Alumno', AlumnoSchema);