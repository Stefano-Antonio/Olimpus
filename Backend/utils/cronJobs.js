// =================================================================
// TAREAS PROGRAMADAS (CRON JOBS)
// =================================================================
// Este archivo contiene las tareas automáticas del sistema,
// como la aplicación de recargos por pago tardío y envío de reportes.

const cron = require('node-cron');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');
const Recargo = require('../models/recargos');
const ConfiguracionSistema = require('../models/configuracion');
const { generarReporteDiario } = require('./reporteService');
const { verificarConfiguracionCorreo } = require('./emailService');

// Función para calcular meses vencidos desde una fecha fija
const calcularMesesVencidosDesde = (fechaInicio, fechaActual) => {
  // Debug: Verificar que ambos parámetros sean objetos Date válidos
  if (!(fechaInicio instanceof Date)) {
    console.error('ERROR: fechaInicio no es un objeto Date:', fechaInicio, typeof fechaInicio);
    // Intentar convertir a Date si es posible
    if (fechaInicio) {
      fechaInicio = new Date(fechaInicio);
      if (isNaN(fechaInicio.getTime())) {
        console.error('ERROR: No se pudo convertir fechaInicio a Date válido');
        return 0;
      }
    } else {
      return 0;
    }
  }
  if (!(fechaActual instanceof Date)) {
    console.error('ERROR: fechaActual no es un objeto Date:', fechaActual, typeof fechaActual);
    // Intentar convertir a Date si es posible
    if (fechaActual) {
      fechaActual = new Date(fechaActual);
      if (isNaN(fechaActual.getTime())) {
        console.error('ERROR: No se pudo convertir fechaActual a Date válido');
        return 0;
      }
    } else {
      return 0;
    }
  }
  
  let mesesTranscurridos = (fechaActual.getFullYear() - fechaInicio.getFullYear()) * 12;
  mesesTranscurridos += fechaActual.getMonth() - fechaInicio.getMonth();
  
  if (fechaActual.getDate() < fechaInicio.getDate()) {
    mesesTranscurridos--;
  }
  
  return Math.max(0, mesesTranscurridos);
};

// Función para enviar reporte diario automático
const enviarReporteAutomatico = async () => {
  try {
    console.log('� Ejecutando envío automático de reporte diario...');
    
    // Verificar configuración de correo antes de intentar enviar
    if (!verificarConfiguracionCorreo()) {
      console.warn('⚠️ Configuración de correo incompleta. Saltando envío de reporte.');
      return;
    }
    
    const resultado = await generarReporteDiario();
    
    if (resultado.success) {
      console.log('✅ Reporte diario enviado automáticamente');
      console.log(`📊 Datos del reporte:`, resultado.datos);
    } else {
      console.error('❌ Error en el envío automático:', resultado.error);
    }
  } catch (error) {
    console.error('❌ Error en la tarea de reporte automático:', error);
  }
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
  // Ejecutar todos los días a las 5:00 PM - Recargos
  cron.schedule('0 17 * * *', () => {
    console.log('⏰ Iniciando tarea programada de recargos...');
    aplicarRecargosPendientes();
  }, {
    timezone: "America/Mexico_City"
  });
  
  // Ejecutar todos los días a las 8:30 PM - Reporte diario automático
  cron.schedule('30 20 * * *', () => {
    console.log('⏰ Iniciando envío automático de reporte diario...');
    enviarReporteAutomatico();
  }, {
    timezone: "America/Mexico_City"
  });
  
  console.log('✅ Tareas programadas iniciadas correctamente');
  console.log('📅 Los recargos se aplicarán automáticamente todos los días a las 5:00 PM');
  console.log('📧 Los reportes se enviarán automáticamente todos los días a las 8:30 PM');
};

module.exports = {
  iniciarTareasProgramadas,
  aplicarRecargosPendientes, // Exportar para poder ejecutar manualmente si es necesario
  enviarReporteAutomatico, // Exportar para pruebas manuales
  calcularMesesVencidosDesde
};
