const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');


// Crear un nuevo alumno
router.post('/', async (req, res) => {
  console.log('Creando Alumno:', req.body);
  const { id_modalidad, fecha_nacimiento, nombre, telefono, correo } = req.body;

  try {

    // Crear un nuevo alumno
    const fecha_inscripcion = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
    const newAlumno = new Alumno({ id_modalidad, fecha_nacimiento, fecha_inscripcion, nombre, telefono, correo});
    await newAlumno.save();

      

    res.status(201).json(newAlumno);
  } catch (error) {
    console.error('Error al crear el alumno:', error);
    res.status(500).json({ message: 'Error al crear el alumno', error });
  }
});

router.get('/', async (req, res) => {
  try {
    const alumnos = await Alumno.find().populate('id_modalidad', 'nombre costo');
    const alumnosConPagos = await Promise.all(alumnos.map(async (alumno) => {
      // Obtener fecha de inscripción
      const fechaInscripcion = new Date(alumno.fecha_inscripcion);
      const hoy = new Date(); // Toma la fecha actual del servidor o PC

      // Cálculo de los meses transcurridos entre fecha de inscripción y fecha actual
      let mesesTranscurridos = (hoy.getFullYear() - fechaInscripcion.getFullYear()) * 12;
      mesesTranscurridos += hoy.getMonth() - fechaInscripcion.getMonth();

      // Si la fecha de hoy no ha alcanzado el día de inscripción, ajustamos el cálculo
      if (hoy.getDate() < fechaInscripcion.getDate()) {
        mesesTranscurridos--;
      }

      // Ajuste: +1 para incluir el mes de inscripción como pendiente si no está pagado
      const mesesPendientes = Math.max(0, mesesTranscurridos + 1 - alumno.pagos_realizados);

      // Obtener el costo de la modalidad desde el modelo
      const modalidad = await Modalidad.findById(alumno.id_modalidad);
      const costoModalidad = modalidad ? modalidad.costo : 0;

      // Calcular deuda total (meses pendientes * costo modalidad)
      const deudaTotal = mesesPendientes * costoModalidad;
      console.log('Deuda total:', deudaTotal);

      return {
        ...alumno.toObject(),
        fecha_inscripcion: fechaInscripcion.toISOString().split('T')[0], // Formatear fecha
        pago_pendiente: mesesPendientes,
        deuda_total: deudaTotal,
      };
    }));

    res.status(200).json(alumnosConPagos);
  } catch (error) {
    console.error('Error al obtener los alumnos:', error);
    res.status(500).json({ message: 'Error al obtener los alumnos', error });
  }
});


// Obtener alumnos por id_modalidad
router.get('/modalidad/:id_modalidad', async (req, res) => {
  const { id_modalidad } = req.params;
  try {
    const alumnos = await Alumno.find({ id_modalidad }).populate('id_modalidad', 'nombre');
    res.status(200).json(alumnos);
  } catch (error) {
    console.error('Error al obtener los alumnos por modalidad:', error);
    res.status(500).json({ message: 'Error al obtener los alumnos por modalidad', error });
  }
});

// Eliminar un alumno por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAlumno = await Alumno.findByIdAndDelete(id);
    if (!deletedAlumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json({ message: 'Alumno eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar el alumno:', error);
    res.status(500).json({ message: 'Error al eliminar el alumno', error });
  }
});



// Calcular pagos pendientes
router.get('/calcular-pagos-pendientes', async (req, res) => {
  try {
    const alumnos = await Alumno.find();

    const alumnosActualizados = await Promise.all(alumnos.map(async (alumno) => {
      const modalidad = await Modalidad.findById(alumno.id_modalidad);

      if (!modalidad) {
        throw new Error(`No se encontró la modalidad con ID: ${alumno.id_modalidad}`);
      }

      const fechaInscripcion = new Date(alumno.fecha_inscripcion);
      const hoy = new Date();
      
      // Calcular meses transcurridos
      let mesesTranscurridos = (hoy.getFullYear() - fechaInscripcion.getFullYear()) * 12 + (hoy.getMonth() - fechaInscripcion.getMonth());
      // Ajuste si el día actual es menor que el día de inscripción
      if (hoy.getDate() < fechaInscripcion.getDate()) {
        mesesTranscurridos--;
      }
      mesesTranscurridos = Math.max(mesesTranscurridos, 0); // Nunca negativo
      
      const costoModalidad = modalidad.costo;
      const totalAcumulado = mesesTranscurridos * costoModalidad;

      // pagos_realizados es número de pagos
      const totalPagado = alumno.pagos_realizados * costoModalidad;
      const saldoPendiente = totalAcumulado - totalPagado;

      return {
        alumno_id: alumno._id,
        nombre: alumno.nombre,
        modalidad: modalidad.nombre,
        mesesTranscurridos,
        totalAcumulado,
        totalPagado,
        saldoPendiente
      };
    }));

    res.json(alumnosActualizados);

  } catch (error) {
    console.error('Error al calcular los pagos pendientes:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;