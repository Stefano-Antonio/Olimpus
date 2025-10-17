const express = require('express');
const router = express.Router();
const Gasto = require('../models/gastos'); // Assuming the model is named 'gastos.js'

// Get all gastos
router.get('/', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const filter = {};

  if (fechaInicio && fechaFin) {
    filter.fecha = {
      $gte: new Date(new Date(fechaInicio).setUTCHours(0, 0, 0, 0)), // Start of the day in UTC
      $lte: new Date(new Date(fechaFin).setUTCHours(23, 59, 59, 999)), // End of the day in UTC
    };
  }

  try {
    const gastos = await Gasto.find(filter);
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gastos', error });
  }
});

// Add a new gasto
router.post('/', async (req, res) => {
  const { nombre, monto } = req.body;
  try {
    const newGasto = new Gasto({ nombre, monto });
    const savedGasto = await newGasto.save();
    res.status(201).json(savedGasto);
  } catch (error) {
    res.status(500).json({ message: 'Error adding gasto', error });
  }
});

// Delete a gasto
router.delete('/:id', async (req, res) => {
  try {
    const deletedGasto = await Gasto.findByIdAndDelete(req.params.id);
    if (!deletedGasto) {
      return res.status(404).json({ message: 'Gasto not found' });
    }
    res.json({ message: 'Gasto deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting gasto', error });
  }
});

module.exports = router;