const express = require('express');
const router = express.Router();
const Entrenador = require('../models/entrenadores');

// ===== RUTAS PARA GESTIÓN DE ENTRENADORES =====

// Obtener todos los entrenadores activos
router.get('/', async (req, res) => {
    try {
        const entrenadores = await Entrenador.find({ activo: true }).sort({ nombre: 1 });
        res.json(entrenadores);
    } catch (error) {
        console.error('Error al obtener entrenadores:', error);
        res.status(500).json({ message: 'Error al obtener entrenadores', error: error.message });
    }
});

// Crear un nuevo entrenador
router.post('/', async (req, res) => {
    try {
        const { nombre } = req.body;

        // Validaciones
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ message: 'El nombre del entrenador es obligatorio' });
        }

        // Verificar si ya existe un entrenador con ese nombre
        const entrenadorExistente = await Entrenador.findOne({ 
            nombre: new RegExp(`^${nombre.trim()}$`, 'i'),
            activo: true 
        });

        if (entrenadorExistente) {
            return res.status(400).json({ message: 'Ya existe un entrenador con ese nombre' });
        }

        // Crear el entrenador
        const nuevoEntrenador = new Entrenador({
            nombre: nombre.trim()
        });

        await nuevoEntrenador.save();
        console.log('Entrenador creado:', nuevoEntrenador);

        res.status(201).json(nuevoEntrenador);
    } catch (error) {
        console.error('Error al crear entrenador:', error);
        res.status(500).json({ message: 'Error al crear entrenador', error: error.message });
    }
});

// Actualizar un entrenador
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ message: 'El nombre del entrenador es obligatorio' });
        }

        // Verificar si ya existe otro entrenador con ese nombre
        const entrenadorExistente = await Entrenador.findOne({ 
            nombre: new RegExp(`^${nombre.trim()}$`, 'i'),
            activo: true,
            _id: { $ne: id }
        });

        if (entrenadorExistente) {
            return res.status(400).json({ message: 'Ya existe un entrenador con ese nombre' });
        }

        const entrenadorActualizado = await Entrenador.findByIdAndUpdate(
            id,
            { nombre: nombre.trim() },
            { new: true, runValidators: true }
        );

        if (!entrenadorActualizado) {
            return res.status(404).json({ message: 'Entrenador no encontrado' });
        }

        res.json(entrenadorActualizado);
    } catch (error) {
        console.error('Error al actualizar entrenador:', error);
        res.status(500).json({ message: 'Error al actualizar entrenador', error: error.message });
    }
});

// Eliminar (desactivar) un entrenador
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const entrenadorEliminado = await Entrenador.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!entrenadorEliminado) {
            return res.status(404).json({ message: 'Entrenador no encontrado' });
        }

        res.json({ message: 'Entrenador eliminado exitosamente', entrenador: entrenadorEliminado });
    } catch (error) {
        console.error('Error al eliminar entrenador:', error);
        res.status(500).json({ message: 'Error al eliminar entrenador', error: error.message });
    }
});

// Obtener un entrenador específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const entrenador = await Entrenador.findById(id);

        if (!entrenador || !entrenador.activo) {
            return res.status(404).json({ message: 'Entrenador no encontrado' });
        }

        res.json(entrenador);
    } catch (error) {
        console.error('Error al obtener entrenador:', error);
        res.status(500).json({ message: 'Error al obtener entrenador', error: error.message });
    }
});

module.exports = router;