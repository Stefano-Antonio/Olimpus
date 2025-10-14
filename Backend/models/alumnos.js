// =================================================================
// MODELO DE ALUMNO - ESQUEMA PRINCIPAL DE LA BASE DE DATOS
// =================================================================
// Este modelo representa a los estudiantes del gimnasio Olimpus.
// Incluye información personal, modalidad asignada y control de pagos.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlumnoSchema = new Schema({
  // === RELACIÓN CON MODALIDAD ===
  // IMPORTANTE: Se conecta con el modelo Modalidad para obtener horarios y costos
  id_modalidad: { type: String, required: true },
  
  // === INFORMACIÓN PERSONAL ===
  fecha_nacimiento: { type: Date, required: true }, // Para calcular edad automáticamente
  fecha_inscripcion: { type: Date, default: Date.now, required: true }, // Base para cálculo de deudas
  nombre: { type: String, required: true }, // Nombre completo del alumno
  telefono: { type: String, required: true }, // Contacto
  correo: { type: String, required: true }, // Email de contacto
  
  // === SISTEMA DE PAGOS ===
  // NOTA PARA IA: El cálculo de deudas se hace dinámicamente en las rutas, no aquí
  pago_pendiente: { type: Number, default: 0 }, // Se calcula automáticamente
  pagos_realizados: { type: Number, default: 0 }, // Contador de mensualidades pagadas
  deuda: { type: Number, default: 0 } // Se calcula dinámicamente basado en meses transcurridos
});

module.exports = mongoose.model('Alumno', AlumnoSchema);