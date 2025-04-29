const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Modalidad = require('../models/modalidades');
const stripe = require('stripe')('tu_clave_secreta_de_stripe');
const Alumno = require('../models/alumnos'); // Asegúrate de tener el modelo de Alumno


// Crear una nueva modalidad
router.post('/', async (req, res) => {
    const { nombre, horarios, costo } = req.body;
    console.log('Datos recibidos para crear la materia:', req.body);

    try {
        // Verificar si ya existe una modalidad con el mismo nombre y horarios
        const existingModalidad = await Modalidad.findOne({ nombre, horarios, costo });
        if (existingModalidad) {
            return res.status(400).json({ message: 'Ya existe una modalidad con este nombre y horarios' });
        }

        // Crear la modalidad con la matrícula del docente
        const newModalidad = new Modalidad({
            nombre,
            horarios,
            costo
        });

        await newModalidad.save();
        console.log('Modalidad creada:', newModalidad);

        res.status(201).json(newModalidad);
    } catch (error) {
        console.error('Error al crear la materia:', error);
        res.status(500).json({ message: 'Error al crear la materia', error: error.message });
    }
});

// Obtener modalidades con formato de horarios
router.get('/', async (req, res) => {
    console.log('Obtener modalidades');
    try {
        const modalidades = await Modalidad.find();
        const response = modalidades.map((modalidad) => {
            const diasCortos = {
                lunes: 'L',
                martes: 'M',
                miercoles: 'Mi',
                jueves: 'J',
                viernes: 'V',
                sabado: 'S'
            };

            const dias = [];
            let horaComun = null;

            for (const [dia, hora] of Object.entries(modalidad.horarios)) {
                if (hora) {
                    dias.push(diasCortos[dia]);
                    if (!horaComun) {
                        horaComun = hora;
                    }
                }
            }

            return {
                _id: modalidad._id,
                nombre: modalidad.nombre,
                horarios: `${dias.join('-')}-${horaComun}`,
                costo: modalidad.costo
            };
        });

        res.json(response);
    } catch (error) {
        console.error('Error al obtener modalidades:', error);
        res.status(500).json({ error: 'Error al obtener modalidades' });
    }
});

router.post('/pago', async (req, res) => {
  const { amount } = req.body; // el monto que quieres cobrar

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centavos (ej: 1000 = $10.00)
      currency: 'mxn', // o 'usd', 'eur', etc.
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Ruta para sumar pagos realizados al alumno
router.post('/sumarpago', async (req, res) => {
    const { monto, id  } = req.body;
    console.log('sumando pago', monto, id);
    try {
        // Buscar al alumno por su ID
        const alumno = await Alumno.findById(id);
        console.log('alumno', alumno);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
            
        console.log('Alumno no encontrado');
        }

        // Sumar el monto al total de pagos realizados
        alumno.pagos_realizados = (alumno.pagos_realizados || 0) + monto;
        console.log('Pagos realizados antes de guardar:', alumno.pagos_realizados);
        // Guardar los cambios en la base de datos
        await alumno.save();
        console.log('alumno', alumno);
        console.log('Pagos realizados guardados exitosamente');

        res.status(200).json({ message: 'Pago sumado exitosamente', alumno });
    } catch (error) {
        console.error('Error al sumar el pago:', error);
        res.status(500).json({ message: 'Error al sumar el pago', error: error.message });
    }
});

// ruta oara cambiar la modalidad de un alumno
router.post('/cambiarModalidad', async (req, res) => {
    const { idAlumno, idModalidad } = req.body;
    console.log('Datos recibidos para cambiar la modalidad:', req.body);

    try {
        // Buscar al alumno por su ID
        const alumno = await Alumno.findById(idAlumno);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        // Cambiar la modalidad del alumno
        alumno.id_modalidad = idModalidad;
        await alumno.save();

        res.status(200).json({ message: 'Modalidad cambiada exitosamente', alumno });
    } catch (error) {
        console.error('Error al cambiar la modalidad:', error);
        res.status(500).json({ message: 'Error al cambiar la modalidad', error: error.message });
    }
});

module.exports = router;