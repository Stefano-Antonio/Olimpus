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

// Función para aplicar recargos pendientes
const aplicarRecargosPendientes = async () => {
  try {
    console.log('🔄 Ejecutando tarea de recargos automáticos...');
    
    // Obtener configuración del sistema
    const config = await ConfiguracionSistema.obtenerConfiguracion();
    const { fechaCobroMensual, diasGraciaParaPago, montoRecargoTardio, tipoRecargo } = config;
    
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    // Calcular la fecha límite con días de gracia
    const fechaLimite = new Date(anioActual, mesActual, fechaCobroMensual + diasGraciaParaPago);
    
    // Solo aplicar recargos si ya pasó la fecha límite
    if (hoy < fechaLimite) {
      console.log('⏳ Aún no se ha alcanzado la fecha límite de pago con días de gracia');
      return;
    }
    
    // Obtener todos los alumnos
    const alumnos = await Alumno.find().populate('id_modalidad');
    
    let recargosAplicados = 0;
    
    for (const alumno of alumnos) {
      try {
        const modalidad = await Modalidad.findById(alumno.id_modalidad);
        
        if (!modalidad) {
          console.warn(`⚠️ Modalidad no encontrada para alumno ${alumno.nombre}`);
          continue;
        }
        
        // Calcular fecha de cobro del mes actual
        const fechaCobroDelMes = new Date(anioActual, mesActual, fechaCobroMensual);
        
        // Calcular meses vencidos
        const fechaInscripcion = new Date(alumno.fecha_inscripcion);
        const mesesTranscurridos = calcularMesesVencidosDesde(fechaInscripcion, hoy);
        const mesesPendientes = Math.max(0, mesesTranscurridos + 1 - alumno.pagos_realizados);
        
        // Si tiene pagos pendientes, verificar si ya se le aplicó recargo este mes
        if (mesesPendientes > 0) {
          // Verificar si ya tiene un recargo para este mes
          const recargoExistente = await Recargo.findOne({
            alumno: alumno._id,
            fechaVencimientoOriginal: fechaCobroDelMes
          });
          
          if (!recargoExistente) {
            // Calcular monto del recargo
            let montoRecargo = 0;
            if (tipoRecargo === 'fijo') {
              montoRecargo = montoRecargoTardio;
            } else if (tipoRecargo === 'porcentaje') {
              montoRecargo = (modalidad.costo * montoRecargoTardio) / 100;
            }
            
            // Crear nuevo recargo
            const nuevoRecargo = new Recargo({
              alumno: alumno._id,
              montoRecargo: montoRecargo,
              descripcion: `Recargo por pago tardío - Mensualidad vencida el ${fechaCobroDelMes.toLocaleDateString('es-MX')}`,
              fechaVencimientoOriginal: fechaCobroDelMes,
              fechaAplicacion: hoy,
              estado: 'pendiente'
            });
            
            await nuevoRecargo.save();
            recargosAplicados++;
            
            console.log(`✅ Recargo aplicado a ${alumno.nombre}: $${montoRecargo.toFixed(2)} MXN`);
          }
        }
      } catch (error) {
        console.error(`❌ Error al procesar alumno ${alumno.nombre}:`, error);
      }
    }
    
    console.log(`✨ Tarea completada. Total de recargos aplicados: ${recargosAplicados}`);
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
