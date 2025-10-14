// =================================================================
// MODELO DE MODALIDAD - TIPOS DE CLASES DEL GIMNASIO
// =================================================================
// Define los diferentes tipos de entrenamiento disponibles:
// - Gimnasia Femenil, Parkour, Baby Gym
// Cada modalidad tiene horarios específicos por día y costo mensual.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModalidadSchema = new Schema({
  // === INFORMACIÓN DE LA CLASE ===
  nombre: { type: String, required: true }, // Ej: "Gimnasia Femenil", "Parkour", "Baby Gym"
  
  // === HORARIOS SEMANALES ===
  // IMPORTANTE: Los horarios se guardan como strings (ej: "16:00-17:00")
  // null indica que no hay clase ese día
  horarios: {
      lunes: { type: String, default: null },
      martes: { type: String, default: null },
      miercoles: { type: String, default: null },
      jueves: { type: String, default: null },
      viernes: { type: String, default: null },
      sabado: { type: String, default: null } // Horarios especiales de sábado (matutinos)
  },
  
  // === COSTO MENSUAL ===
  // Este valor se usa para calcular deudas automáticamente
  costo: { type: Number, required: true } // Costo en pesos mexicanos (MXN)
});

module.exports = mongoose.model('Modalidad', ModalidadSchema);