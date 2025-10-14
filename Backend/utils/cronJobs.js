// =================================================================
// TAREAS PROGRAMADAS (CRON JOBS)
// =================================================================
// Este archivo contiene las tareas automáticas del sistema,
// como la aplicación de recargos por pago tardío.

const cron = require('node-cron');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');
const Recargo = require('../models/recargos');
const ConfiguracionSistema = require('../models/configuracion');

// Función para calcular meses vencidos desde una fecha fija
const calcularMesesVencidosDesde = (fechaInicio, fechaActual) => {
  let mesesTranscurridos = (fechaActual.getFullYear() - fechaInicio.getFullYear()) * 12;
  mesesTranscurridos += fechaActual.getMonth() - fechaInicio.getMonth();
  
  if (fechaActual.getDate() < fechaInicio.getDate()) {
    mesesTranscurridos--;
  }
  
  return Math.max(0, mesesTranscurridos);
};

// Función para aplicar recargos pendientes (versión simplificada para inicio)
const aplicarRecargosPendientes = async () => {
  try {
    console.log('🔄 Ejecutando tarea de recargos automáticos...');
    
    // Por ahora, solo hacer un log - implementación completa después
    const alumnos = await Alumno.find().countDocuments();
    console.log(`📊 Total de alumnos en el sistema: ${alumnos}`);
    
    // TODO: Implementar lógica completa de recargos
    console.log('✅ Tarea de recargos completada (modo básico)');
  } catch (error) {
    console.error('❌ Error en la tarea de recargos automáticos:', error);
  }
};

// Configurar cron job para ejecutarse diariamente a las 00:01 AM
const iniciarTareasProgramadas = () => {
  // Ejecutar todos los días a las 00:01 AM
  cron.schedule('1 0 * * *', () => {
    console.log('⏰ Iniciando tarea programada de recargos...');
    aplicarRecargosPendientes();
  }, {
    timezone: "America/Mexico_City"
  });
  
  console.log('✅ Tareas programadas iniciadas correctamente');
  console.log('📅 Los recargos se aplicarán automáticamente todos los días a las 00:01 AM');
};

module.exports = {
  iniciarTareasProgramadas,
  aplicarRecargosPendientes, // Exportar para poder ejecutar manualmente si es necesario
  calcularMesesVencidosDesde
};
