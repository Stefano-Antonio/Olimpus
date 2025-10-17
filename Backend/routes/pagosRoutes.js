const express = require('express');
const router = express.Router();
const Pago = require('../models/pagos');

// Obtener todos los pagos con filtro por fecha
router.get('/', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const filter = {};

  if (fechaInicio && fechaFin) {
    filter.fecha = {
      $gte: new Date(new Date(fechaInicio).setUTCHours(0, 0, 0, 0)),
      $lte: new Date(new Date(fechaFin).setUTCHours(23, 59, 59, 999)),
    };
  }

  try {
    const pagos = await Pago.find(filter).populate('alumno');
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos', error });
  }
});

// Registrar un nuevo pago
router.post('/', async (req, res) => {
  const { alumno, costo, fecha, concepto } = req.body;

  try {
    const nuevoPago = new Pago({ alumno, costo, fecha, concepto });
    const pagoGuardado = await nuevoPago.save();
    res.status(201).json(pagoGuardado);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el pago', error });
  }
});

// Eliminar un pago por ID
router.delete('/:id', async (req, res) => {
  try {
    const pagoEliminado = await Pago.findByIdAndDelete(req.params.id);
    if (!pagoEliminado) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    res.status(200).json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el pago', error });
  }
});

module.exports = router;