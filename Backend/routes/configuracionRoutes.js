const express = require('express');
const router = express.Router();
const ConfiguracionSistema = require('../models/configuracion');
const Recargo = require('../models/recargos');

// Obtener la configuración actual del sistema
router.get('/', async (req, res) => {
  try {
    const config = await ConfiguracionSistema.obtenerConfiguracion();
    res.status(200).json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ message: 'Error al obtener configuración', error: error.message });
  }
});

// Actualizar la configuración del sistema
router.put('/', async (req, res) => {
  try {
        const { 
      fechaCobroMensual, 
      costoInscripcion,
      diasGraciaParaPago, 
      montoRecargoTardio, 
      tipoRecargo,
      emailReportes
    } = req.body;
    
    // Validaciones
    if (fechaCobroMensual && (fechaCobroMensual < 1 || fechaCobroMensual > 31)) {
      return res.status(400).json({ message: 'La fecha de cobro debe estar entre 1 y 31' });
    }
    
    let config = await ConfiguracionSistema.findOne();
    
    if (!config) {
      // Crear nueva configuración si no existe
      config = new ConfiguracionSistema({
        fechaCobroMensual: fechaCobroMensual || 5,
        costoInscripcion: costoInscripcion || 0,
        diasGraciaParaPago: diasGraciaParaPago || 5,
        montoRecargoTardio: montoRecargoTardio || 50,
        tipoRecargo: tipoRecargo || 'fijo',
        emailReportes: emailReportes || ''
      });
    } else {
      // Actualizar configuración existente
      if (fechaCobroMensual !== undefined) config.fechaCobroMensual = fechaCobroMensual;
      if (costoInscripcion !== undefined) config.costoInscripcion = costoInscripcion;
      if (diasGraciaParaPago !== undefined) config.diasGraciaParaPago = diasGraciaParaPago;
      if (montoRecargoTardio !== undefined) config.montoRecargoTardio = montoRecargoTardio;
      if (tipoRecargo !== undefined) config.tipoRecargo = tipoRecargo;
      if (emailReportes !== undefined) config.emailReportes = emailReportes;
      config.fechaActualizacion = new Date();
    }
    
    await config.save();
    res.status(200).json({ message: 'Configuración actualizada exitosamente', config });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error al actualizar configuración', error: error.message });
  }
});

// Actualizar solo la fecha de cobro mensual
router.put('/fecha-pago', async (req, res) => {
  try {
    const { fechaCobroMensual } = req.body;
    
    if (!fechaCobroMensual || fechaCobroMensual < 1 || fechaCobroMensual > 31) {
      return res.status(400).json({ message: 'La fecha de cobro debe estar entre 1 y 31' });
    }
    
    let config = await ConfiguracionSistema.findOne();
    
    if (!config) {
      config = new ConfiguracionSistema({ fechaCobroMensual });
    } else {
      config.fechaCobroMensual = fechaCobroMensual;
      config.fechaActualizacion = new Date();
    }
    
    await config.save();
    res.status(200).json({ message: 'Fecha de pago actualizada exitosamente', config });
  } catch (error) {
    console.error('Error al actualizar fecha de pago:', error);
    res.status(500).json({ message: 'Error al actualizar fecha de pago', error: error.message });
  }
});

// Obtener recargos de un alumno específico
router.get('/recargos/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const recargos = await Recargo.find({ alumno: alumnoId }).sort({ fechaAplicacion: -1 });
    res.status(200).json(recargos);
  } catch (error) {
    console.error('Error al obtener recargos:', error);
    res.status(500).json({ message: 'Error al obtener recargos', error: error.message });
  }
});

// Obtener todos los recargos pendientes
router.get('/recargos-pendientes', async (req, res) => {
  try {
    const recargos = await Recargo.find({ estado: 'pendiente' })
      .populate('alumno', 'nombre telefono correo')
      .sort({ fechaAplicacion: -1 });
    res.status(200).json(recargos);
  } catch (error) {
    console.error('Error al obtener recargos pendientes:', error);
    res.status(500).json({ message: 'Error al obtener recargos pendientes', error: error.message });
  }
});

// Marcar recargo como pagado
router.put('/recargos/:recargoId/pagar', async (req, res) => {
  try {
    const { recargoId } = req.params;
    const recargo = await Recargo.findById(recargoId);
    
    if (!recargo) {
      return res.status(404).json({ message: 'Recargo no encontrado' });
    }
    
    recargo.estado = 'pagado';
    await recargo.save();
    
    res.status(200).json({ message: 'Recargo marcado como pagado', recargo });
  } catch (error) {
    console.error('Error al marcar recargo como pagado:', error);
    res.status(500).json({ message: 'Error al marcar recargo como pagado', error: error.message });
  }
});

// Condonar un recargo
router.put('/recargos/:recargoId/condonar', async (req, res) => {
  try {
    const { recargoId } = req.params;
    const recargo = await Recargo.findById(recargoId);
    
    if (!recargo) {
      return res.status(404).json({ message: 'Recargo no encontrado' });
    }
    
    recargo.estado = 'condonado';
    await recargo.save();
    
    res.status(200).json({ message: 'Recargo condonado', recargo });
  } catch (error) {
    console.error('Error al condonar recargo:', error);
    res.status(500).json({ message: 'Error al condonar recargo', error: error.message });
  }
});

module.exports = router;
