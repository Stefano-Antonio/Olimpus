// =================================================================
// MODELO DE ALUMNO - ESQUEMA PRINCIPAL DE LA BASE DE DATOS
// =================================================================
// Este modelo representa a los estudiantes del gimnasio Olimpus.
// Incluye información personal, modalidad asignada y control de pagos.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlumnoSchema = new Schema({
  // === IDENTIFICACIÓN ÚNICA ===
  matricula: { type: String, unique: true, sparse: true }, // Se genera automáticamente
  
  // === RELACIÓN CON MODALIDAD ===
  // IMPORTANTE: Se conecta con el modelo Modalidad para obtener horarios y costos
  // === RELACIONES CON OTROS MODELOS ===
  id_modalidad: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Modalidad', 
    required: false // MODALIDAD AHORA ES OPCIONAL - permite registro solo con inscripción
  },
  
  // === INFORMACIÓN PERSONAL ===
  fecha_nacimiento: { type: Date, required: true }, // Para calcular edad automáticamente
  fecha_inscripcion: { type: Date, default: Date.now, required: true }, // Base para cálculo de deudas
  nombre: { type: String, required: true }, // Nombre completo del alumno
  telefono: { type: String, required: true }, // Contacto
  correo: { type: String, required: true }, // Email de contacto
  
  // === CAMPOS ADICIONALES DEL EXCEL ===
  entrenador: { type: String, default: "Sin asignar" }, // Entrenador asignado
  grupo: { type: String, default: "Sin asignar" }, // Grupo al que pertenece
  costo_mensualidad: { type: Number, default: 0 }, // Costo mensual guardado del Excel
  costo_inscripcion_excel: { type: Number, default: 0 }, // Costo de inscripción del Excel
  
  // === SISTEMA DE PAGOS ===
  // NOTA PARA IA: El cálculo de deudas se hace dinámicamente en las rutas, no aquí
  pago_pendiente: { type: Number, default: 0 }, // Se calcula automáticamente
  pagos_realizados: { type: Number, default: 0 }, // Contador de mensualidades pagadas (compatibilidad)
  meses_pagados: { type: [String], default: [] }, // Array de meses pagados desde Excel (ej: ['MAY', 'JUN'])
  deuda: { type: Number, default: 0 } // Se calcula dinámicamente basado en meses transcurridos
});

// === MIDDLEWARE PARA GENERAR MATRÍCULA AUTOMÁTICAMENTE ===
AlumnoSchema.pre('save', async function(next) {
  if (!this.matricula) {
    // Generar matrícula única con formato: OLY + año + número secuencial
    const año = new Date().getFullYear();
    const count = await mongoose.model('Alumno').countDocuments();
    this.matricula = `OLY${año}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Alumno', AlumnoSchema);