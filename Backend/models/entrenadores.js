// =================================================================
// MODELO DE ENTRENADOR - ESQUEMA PARA GESTIÓN DE ENTRENADORES
// =================================================================
// Este modelo representa a los entrenadores del gimnasio Olimpus.
// Se relaciona con las modalidades para asignar responsables.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntrenadorSchema = new Schema({
  // === INFORMACIÓN BÁSICA ===
  nombre: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  
  // === METADATOS ===
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  
  // === ESTADO ===
  activo: { 
    type: Boolean, 
    default: true 
  }
});

// === ÍNDICES PARA OPTIMIZACIÓN ===
EntrenadorSchema.index({ nombre: 1 });
EntrenadorSchema.index({ activo: 1 });

// === VALIDACIONES PERSONALIZADAS ===
EntrenadorSchema.pre('save', function(next) {
  // Capitalizar nombre automáticamente
  if (this.nombre) {
    this.nombre = this.nombre.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  next();
});

module.exports = mongoose.model('Entrenador', EntrenadorSchema);