// =================================================================
// RUTAS DE REPORTES
// =================================================================
// Este archivo maneja las rutas relacionadas con reportes automáticos

const express = require('express');
const router = express.Router();
const { enviarReporteManual, obtenerCorteDelDia } = require('../utils/reporteService');
const { verificarConfiguracionCorreo } = require('../utils/emailService');

// Enviar reporte manual desde la interfaz
router.post('/enviar-manual', async (req, res) => {
  try {
    console.log('📧 Solicitud de envío manual de reporte...');
    
    // Verificar configuración de correo
    if (!verificarConfiguracionCorreo()) {
      return res.status(400).json({
        success: false,
        message: 'Configuración de correo incompleta. Verifica EMAIL_USER y EMAIL_PASSWORD en la configuración del servidor.'
      });
    }
    
    const resultado = await enviarReporteManual();
    
    if (resultado.success) {
      res.status(200).json({
        success: true,
        message: 'Reporte enviado exitosamente',
        datos: resultado.datos
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar reporte',
        error: resultado.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en envío manual de reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Verificar configuración de correo
router.get('/verificar-configuracion', (req, res) => {
  try {
    const configuracionValida = verificarConfiguracionCorreo();
    
    res.status(200).json({
      configuracionValida,
      message: configuracionValida 
        ? 'Configuración de correo válida' 
        : 'Configuración de correo incompleta'
    });
    
  } catch (error) {
    res.status(500).json({
      configuracionValida: false,
      message: 'Error al verificar configuración',
      error: error.message
    });
  }
});

// Obtener vista previa del corte (sin enviar correo)
router.get('/preview-corte', async (req, res) => {
  try {
    const fecha = req.query.fecha || null;
    const corteData = await obtenerCorteDelDia(fecha);
    
    res.status(200).json({
      success: true,
      datos: corteData
    });
    
  } catch (error) {
    console.error('❌ Error al obtener preview del corte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del corte',
      error: error.message
    });
  }
});

module.exports = router;