// =================================================================
// SERVICIO DE REPORTES AUTOMÁTICOS
// =================================================================
// Este archivo maneja la generación automática de reportes diarios

const path = require('path');
const fs = require('fs').promises;
const { exportarAlumnosAExcel } = require('./excelProcessor');
const { generarPDFCorte } = require('./pdfService');
const { enviarCorreoReporte } = require('./emailService');
const Pago = require('../models/pagos');

// Función para obtener el corte del día
const obtenerCorteDelDia = async (fecha = null) => {
  try {
    // Usar la fecha proporcionada o la fecha actual
    let fechaConsulta = fecha ? new Date(fecha + 'T00:00:00') : new Date();
    
    // Crear inicio y fin del día en hora local
    const inicioDelDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate(), 0, 0, 0, 0);
    const finDelDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate(), 23, 59, 59, 999);

    console.log(`🔍 Obteniendo corte del día para: ${fechaConsulta.toLocaleDateString('es-MX')}`);
    console.log(`📅 Rango: ${inicioDelDia.toLocaleString()} a ${finDelDia.toLocaleString()}`);

    // Obtener los pagos realizados en el día con populate para traer datos del alumno
    const pagosDelDia = await Pago.find({
      fecha: { $gte: inicioDelDia, $lte: finDelDia }
    }).populate('alumno', 'nombre').sort({ fecha: -1 });
    
    // Agrupar pagos por concepto para el resumen
    const resumenPorConcepto = pagosDelDia.reduce((acc, pago) => {
      const concepto = pago.concepto || 'Mensualidad';
      if (!acc[concepto]) {
        acc[concepto] = { cantidad: 0, total: 0 };
      }
      acc[concepto].cantidad += 1;
      acc[concepto].total += pago.costo || 0;
      return acc;
    }, {});

    // Sumar los costos de todos los pagos
    const totalPagado = pagosDelDia.reduce((acc, pago) => acc + (pago.costo || 0), 0);
    
    console.log(`💰 Total pagado del día: $${totalPagado.toFixed(2)}`);
    console.log(`📊 Cantidad de pagos: ${pagosDelDia.length}`);
    
    return {
      fecha: fechaConsulta.toISOString().split('T')[0],
      totalPagado,
      pagos: pagosDelDia,
      resumenPorConcepto
    };
  } catch (error) {
    console.error('❌ Error al obtener corte del día:', error);
    throw error;
  }
};

// Función para generar Excel de alumnos como archivo temporal
const generarExcelAlumnos = async () => {
  try {
    console.log('📊 Generando archivo Excel de alumnos...');
    const buffer = await exportarAlumnosAExcel();
    
    // Crear nombre del archivo temporal
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Base_Alumnos_${fecha}_${Date.now()}.xlsx`;
    const rutaArchivo = path.join(__dirname, '..', 'temp', nombreArchivo);
    
    // Crear directorio temp si no existe
    const dirTemp = path.dirname(rutaArchivo);
    await fs.mkdir(dirTemp, { recursive: true });
    
    // Escribir el archivo
    await fs.writeFile(rutaArchivo, buffer);
    
    console.log(`✅ Excel generado: ${rutaArchivo}`);
    return rutaArchivo;
  } catch (error) {
    console.error('❌ Error al generar Excel:', error);
    throw error;
  }
};

// Función principal para generar y enviar reporte diario
const generarReporteDiario = async () => {
  try {
    console.log('🚀 Iniciando generación de reporte diario automático...');
    const fecha = new Date().toISOString().split('T')[0];
    
    // 1. Obtener corte del día
    console.log('📊 Paso 1/4: Obteniendo datos del corte...');
    const corteData = await obtenerCorteDelDia(fecha);
    
    // 2. Generar archivo Excel de alumnos
    console.log('📋 Paso 2/4: Generando archivo Excel...');
    const rutaExcel = await generarExcelAlumnos();
    
    // 3. Generar PDF del corte
    console.log('📄 Paso 3/4: Generando reporte PDF...');
    const rutaPDF = await generarPDFCorte(
      corteData.fecha, 
      corteData.pagos, 
      corteData.totalPagado, 
      corteData.resumenPorConcepto
    );
    
    // 4. Enviar correo con archivos adjuntos
    console.log('📧 Paso 4/4: Enviando correo electrónico...');
    const resultadoCorreo = await enviarCorreoReporte(
      rutaExcel,
      rutaPDF,
      corteData.fecha,
      corteData.totalPagado,
      corteData.resumenPorConcepto
    );
    
    if (resultadoCorreo.success) {
      console.log('✅ Reporte diario enviado exitosamente');
      console.log(`📧 ID del mensaje: ${resultadoCorreo.messageId}`);
      return {
        success: true,
        mensaje: 'Reporte enviado exitosamente',
        datos: {
          fecha: corteData.fecha,
          totalPagado: corteData.totalPagado,
          cantidadPagos: corteData.pagos.length,
          messageId: resultadoCorreo.messageId
        }
      };
    } else {
      throw new Error(resultadoCorreo.error);
    }
    
  } catch (error) {
    console.error('❌ Error en la generación del reporte diario:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para enviar reporte manual (desde la interfaz)
const enviarReporteManual = async (fecha = null) => {
  try {
    console.log('🔧 Generando reporte manual...');
    const resultado = await generarReporteDiario();
    return resultado;
  } catch (error) {
    console.error('❌ Error en reporte manual:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generarReporteDiario,
  enviarReporteManual,
  obtenerCorteDelDia,
  generarExcelAlumnos
};