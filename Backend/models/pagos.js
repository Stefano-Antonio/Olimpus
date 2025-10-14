// =================================================================
// MODELO DE PAGO - REGISTRO DE TRANSACCIONES INDIVIDUALES
// =================================================================
// Cada pago representa una transacción específica realizada por un alumno.
// Se usa para generar reportes diarios y llevar historial detallado.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PagoSchema = new Schema({
  // === RELACIÓN CON ALUMNO ===
  // Referencia al alumno que realizó el pago (populate para obtener datos)
  alumno: { type: Schema.Types.ObjectId, ref: 'Alumno', required: true },
  
  // === INFORMACIÓN DEL PAGO ===
  costo: { type: Number, required: true }, // Monto pagado en pesos mexicanos
  fecha: { type: Date, default: Date.now } // Timestamp automático para reportes diarios
  
  // NOTA PARA IA: Este modelo se usa principalmente para:
  // 1. Generar cortes diarios de ingresos
  // 2. Historial detallado de pagos por alumno
  // 3. Auditoría de transacciones
});

module.exports = mongoose.model('Pago', PagoSchema);
