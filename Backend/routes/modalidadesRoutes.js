const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Modalidad = require('../models/modalidades');
const stripe = require('stripe')('tu_clave_secreta_de_stripe');
const Alumno = require('../models/alumnos'); // Asegúrate de tener el modelo de Alumno
const Pago = require('../models/pagos'); // Asegúrate de tener el modelo de Pago

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

router.post('/sumarpago', async (req, res) => {
  const { monto, id, costo } = req.body;
  try {
    const alumno = await Alumno.findById(id);
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    console.log('Datos recibidos para registrar el pago:', req.body);
    // 1. Registrar el nuevo pago
    const nuevoPago = new Pago({
      alumno: id,
      costo: costo,
      fecha: new Date() // Fecha actual
    });

    await nuevoPago.save();

    // 2. Sumar el monto a los pagos realizados
    alumno.pagos_realizados = (alumno.pagos_realizados || 0) + monto;
    await alumno.save();

    res.status(200).json({ message: 'Pago registrado y guardado con éxito', alumno });
  } catch (error) {
    console.error('Error al registrar el pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago', error: error.message });
  }
});


// ruta para cambiar la modalidad de un alumno
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

// Descargar el total de los pagos del día
router.get('/corte-dia', async (req, res) => {
    try {
      const hoy = new Date();
      const inicioDelDia = new Date(hoy.setHours(0, 0, 0, 0));
      const finDelDia = new Date(hoy.setHours(23, 59, 59, 999));
  
      // Obtener los pagos realizados en el día
      const pagosDelDia = await Pago.find({
        fecha: { $gte: inicioDelDia, $lte: finDelDia }
      });
  
      // Sumar los costos de todos los pagos
      const totalPagado = pagosDelDia.reduce((acc, pago) => acc + (pago.costo || 0), 0);
        console.log('Total pagado del día:', totalPagado,pagosDelDia);
      
        // Devolver todos los pagos y el total
        res.status(200).json({
            totalPagado: totalPagado.toFixed(2),
            pagos: pagosDelDia
        });
  
    } catch (error) {
      console.error('Error al generar el corte del día:', error);
      res.status(500).json({ message: 'Error al generar el corte del día', error: error.message });
    }
  });
  
  
module.exports = router;