// =================================================================
// SERVICIO DE CORREO ELECTRÓNICO
// =================================================================
// Este archivo maneja el envío de correos automáticos del sistema

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Configuración del transportador de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // Puedes cambiar por otro proveedor
    auth: {
      user: process.env.EMAIL_USER || 'tu-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'tu-app-password'
    }
  });
};

// Función para enviar correo con archivos adjuntos
const enviarCorreoReporte = async (archivoExcel, archivoPDF, fechaCorte, totalCorte, resumenPagos) => {
  try {
    const transporter = createTransporter();
    
    // Obtener la configuración del sistema para el correo destinatario
    const destinatario = process.env.EMAIL_DESTINATARIO || 'admin@olimpusgymnastics.com';
    
    const fechaFormateada = new Date(fechaCorte).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Crear el resumen de pagos para el correo
    let resumenTexto = '';
    if (resumenPagos && Object.keys(resumenPagos).length > 0) {
      resumenTexto = '\n\nResumen por concepto:\n';
      Object.entries(resumenPagos).forEach(([concepto, datos]) => {
        resumenTexto += `• ${concepto}: ${datos.cantidad} pago${datos.cantidad !== 1 ? 's' : ''} - $${datos.total.toFixed(2)}\n`;
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'sistema@olimpusgymnastics.com',
      to: destinatario,
      subject: `📊 Reporte Diario Olimpus Gymnastics - ${fechaFormateada}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; text-align: center;">🏃‍♀️ OLIMPUS GYMNASTICS</h1>
            <h2 style="margin: 10px 0 0 0; text-align: center; font-weight: normal;">Reporte Diario Automático</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
            <h3 style="color: #2c3e50; margin-top: 0;">📅 Fecha: ${fechaFormateada}</h3>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4a90e2;">
              <h4 style="color: #2c3e50; margin: 0 0 10px 0;">💰 Resumen Financiero del Día</h4>
              <p style="font-size: 18px; font-weight: bold; color: #27ae60; margin: 0;">
                Total recaudado: $${totalCorte ? totalCorte.toFixed(2) : '0.00'}
              </p>
              ${resumenTexto ? `<div style="margin-top: 10px; font-size: 14px; color: #666;">${resumenTexto.replace(/\n/g, '<br>')}</div>` : ''}
            </div>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #2c3e50; margin: 0 0 10px 0;">📎 Archivos Adjuntos</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>📊 Base_Alumnos.xlsx:</strong> Base de datos completa de alumnos</li>
                <li><strong>💰 Corte_Diario.pdf:</strong> Reporte detallado de pagos del día</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                📧 Correo generado automáticamente por el Sistema Olimpus Gymnastics<br>
                🕐 Enviado diariamente a las 8:00 PM
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'Base_Alumnos.xlsx',
          path: archivoExcel
        },
        {
          filename: 'Corte_Diario.pdf',
          path: archivoPDF
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente:', result.messageId);
    
    // Limpiar archivos temporales después del envío
    await limpiarArchivosTemporales([archivoExcel, archivoPDF]);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
};

// Función para limpiar archivos temporales
const limpiarArchivosTemporales = async (archivos) => {
  for (const archivo of archivos) {
    try {
      await fs.unlink(archivo);
      console.log(`🗑️ Archivo temporal eliminado: ${archivo}`);
    } catch (error) {
      console.warn(`⚠️ No se pudo eliminar el archivo temporal: ${archivo}`, error.message);
    }
  }
};

// Función para verificar configuración de correo
const verificarConfiguracionCorreo = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Configuración de correo incompleta. Configura EMAIL_USER y EMAIL_PASSWORD en .env');
    return false;
  }
  
  return true;
};

module.exports = {
  enviarCorreoReporte,
  verificarConfiguracionCorreo
};