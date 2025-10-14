// =================================================================
// MODELO DE RECARGOS - REGISTRO DE RECARGOS POR PAGO TARDÍO
// =================================================================
// Este modelo registra los recargos aplicados automáticamente
// a alumnos que no pagaron a tiempo.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecargoSchema = new Schema({
  // === RELACIÓN CON ALUMNO ===
  // Referencia al alumno que recibió el recargo
  alumno: { 
    type: Schema.Types.ObjectId, 
    ref: 'Alumno', 
    required: true 
  },
  
  // === INFORMACIÓN DEL RECARGO ===
  // Fecha en que se aplicó el recargo automáticamente
  fechaAplicacion: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  
  // Monto del recargo aplicado en pesos mexicanos
  montoRecargo: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Descripción del recargo (ej: "Recargo por pago tardío de mensualidad de Octubre 2025")
  descripcion: { 
    type: String, 
    required: true 
  },
  
  // Fecha de vencimiento original que causó el recargo
  fechaVencimientoOriginal: { 
    type: Date, 
    required: true 
  },
  
  // Estado del recargo: 'pendiente', 'pagado', 'condonado'
  estado: {
    type: String,
    enum: ['pendiente', 'pagado', 'condonado'],
    default: 'pendiente'
  }
});

module.exports = mongoose.model('Recargo', RecargoSchema);
