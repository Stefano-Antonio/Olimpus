// =================================================================
// MODELO DE CONFIGURACIÓN DEL SISTEMA
// =================================================================
// Este modelo almacena la configuración general del sistema,
// incluyendo fechas de cobro, recargos y otras configuraciones.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfiguracionSistemaSchema = new Schema({
  // === FECHA DE COBRO FIJA ===
  // Día del mes en que se debe realizar el cobro mensual (1-31)
  fechaCobroMensual: { 
    type: Number, 
    required: true, 
    default: 5,
    min: 1,
    max: 31
  },
  
  // === CONFIGURACIÓN DE COSTOS ===
  // Costo de inscripción (pago único al registrar nuevo alumno)
  costoInscripcion: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // === SISTEMA DE RECARGOS ===
  // Días de gracia después de la fecha límite antes de aplicar recargo
  diasGraciaParaPago: { 
    type: Number, 
    default: 5,
    min: 0
  },
  
  // Monto del recargo (puede ser fijo o porcentaje según tipoRecargo)
  montoRecargoTardio: { 
    type: Number, 
    default: 50,
    min: 0
  },
  
  // Tipo de recargo: "fijo" (monto fijo en MXN) o "porcentaje" (% del costo de modalidad)
  tipoRecargo: { 
    type: String, 
    enum: ['fijo', 'porcentaje'],
    default: 'fijo'
  },
  
  // === CONFIGURACIÓN DE REPORTES ===
  // Email donde se enviarán los reportes automáticos
  emailReportes: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(v) {
        // Solo validar si el campo no está vacío
        if (!v || v.trim() === '') return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Debe ser un email válido'
    }
  },
  
  // === METADATOS ===
  fechaActualizacion: { 
    type: Date, 
    default: Date.now 
  }
});

// Solo debe existir un documento de configuración
// Validación para asegurar que solo existe una configuración
ConfiguracionSistemaSchema.statics.obtenerConfiguracion = async function() {
  let config = await this.findOne();
  if (!config) {
    // Crear configuración por defecto si no existe
    config = await this.create({
      fechaCobroMensual: 5,
      costoInscripcion: 0,
      diasGraciaParaPago: 5,
      montoRecargoTardio: 50,
      tipoRecargo: 'fijo',
      emailReportes: ''
    });
  }
  return config;
};

module.exports = mongoose.model('ConfiguracionSistema', ConfiguracionSistemaSchema);
