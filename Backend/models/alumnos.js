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
  
  // === ESTADO DEL ALUMNO ===
  activo: { type: Boolean, default: true }, // Estado activo/inactivo del alumno
  
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
    try {
      // Buscar todas las matrículas existentes para encontrar el número más alto
      const alumnos = await mongoose.model('Alumno').find({}, { matricula: 1 });
      
      let numeroMasAlto = 0;

      // Extraer todos los números de las matrículas existentes
      alumnos.forEach(alumno => {
        if (alumno.matricula) {
          // Extraer solo números puros (eliminar letras y obtener solo dígitos)
          const soloNumeros = alumno.matricula.replace(/\D/g, '');
          if (soloNumeros) {
            const numero = parseInt(soloNumeros);
            if (numero > numeroMasAlto) {
              numeroMasAlto = numero;
            }
          }
        }
      });

      // Siguiente número disponible (incremental, sin reutilizar eliminados)
      const siguienteNumero = numeroMasAlto + 1;

      // Generar nueva matrícula con formato simple de 3 dígitos: 001, 002, 003...
      this.matricula = String(siguienteNumero).padStart(3, '0');
      
      console.log(`Matrícula generada: ${this.matricula} (número más alto encontrado: ${numeroMasAlto})`);
    } catch (error) {
      console.error('Error al generar matrícula:', error);
      // Fallback: usar timestamp si hay error
      this.matricula = Date.now().toString().slice(-3).padStart(3, '0');
    }
  }
  next();
});

module.exports = mongoose.model('Alumno', AlumnoSchema);