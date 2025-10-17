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
  
  // === GRUPO IDENTIFICADOR ===
  // Letra mayúscula que identifica la modalidad para importaciones Excel (A, B, C, D...)
  // Ahora es único por tipo de modalidad, no globalmente único
  grupo: { 
    type: String, 
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]$/.test(v); // Solo letras mayúsculas
      },
      message: 'El grupo debe ser una letra mayúscula (A-Z)'
    }
    // Removido unique: true para permitir la misma letra en diferentes modalidades
  },
  
  // === ENTRENADOR ASIGNADO ===
  id_entrenador: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Entrenador', 
    required: false,
    default: null // Permite modalidades sin entrenador asignado
  },
  
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

// Índice compuesto para asegurar que no haya duplicados de nombre+grupo
// Permite que diferentes modalidades tengan la misma letra, pero no la misma modalidad
ModalidadSchema.index({ nombre: 1, grupo: 1 }, { 
  unique: true, 
  sparse: true, // Permite valores null en grupo
  name: 'nombre_grupo_unique'
});

module.exports = mongoose.model('Modalidad', ModalidadSchema);