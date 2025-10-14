const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');
const ConfiguracionSistema = require('../models/configuracion');
const Recargo = require('../models/recargos');
const { calcularMesesVencidosDesde } = require('../utils/cronJobs');


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
    // Obtener configuración del sistema para fecha de cobro
    const config = await ConfiguracionSistema.obtenerConfiguracion();
    const fechaCobroMensual = config.fechaCobroMensual;
    
    const alumnos = await Alumno.find().populate('id_modalidad', 'nombre costo');
    const alumnosConPagos = await Promise.all(alumnos.map(async (alumno) => {
      const fechaInscripcion = new Date(alumno.fecha_inscripcion);
      const hoy = new Date();

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
      
      // Calcular próxima fecha de pago (día fijo del próximo mes si ya pasó este mes)
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();
      let proximaFechaPago;
      
      if (hoy.getDate() < fechaCobroMensual) {
        // Si aún no llegamos al día de cobro del mes actual
        proximaFechaPago = new Date(anioActual, mesActual, fechaCobroMensual);
      } else {
        // Ya pasó el día de cobro, la próxima es el mes siguiente
        proximaFechaPago = new Date(anioActual, mesActual + 1, fechaCobroMensual);
      }
      
      // Obtener recargos pendientes del alumno
      const recargosPendientes = await Recargo.find({ 
        alumno: alumno._id, 
        estado: 'pendiente' 
      });
      
      const totalRecargos = recargosPendientes.reduce((sum, r) => sum + r.montoRecargo, 0);
      
      // Calcular estado de pago para semáforo
      let estadoPago = 'verde'; // Al día
      let diasVencidos = 0;
      
      if (mesesPendientes > 0) {
        // Tiene deuda - calcular días de atraso
        const fechaCobro = new Date(anioActual, mesActual, fechaCobroMensual);
        if (hoy > fechaCobro) {
          estadoPago = 'rojo'; // Atrasado
          diasVencidos = Math.floor((hoy - fechaCobro) / (1000 * 60 * 60 * 24));
        }
      } else if (mesesPendientes === 0) {
        // Verificar si está próximo a vencer (3 días antes)
        const diasParaVencer = Math.floor((proximaFechaPago - hoy) / (1000 * 60 * 60 * 24));
        if (diasParaVencer <= 3 && diasParaVencer >= 0) {
          estadoPago = 'amarillo'; // Por vencer
        }
      }

      return {
        ...alumno.toObject(),
        fecha_inscripcion: fechaInscripcion.toISOString().split('T')[0],
        pago_pendiente: mesesPendientes,
        deuda_total: deudaTotal,
        proxima_fecha_pago: proximaFechaPago.toISOString().split('T')[0],
        total_recargos: totalRecargos,
        deuda_total_con_recargos: deudaTotal + totalRecargos,
        estado_pago: estadoPago,
        dias_vencidos: diasVencidos
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



// Obtener próxima fecha de pago según configuración
router.get('/proxima-fecha-pago', async (req, res) => {
  try {
    const config = await ConfiguracionSistema.obtenerConfiguracion();
    const fechaCobroMensual = config.fechaCobroMensual;
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    let proximaFechaPago;
    if (hoy.getDate() < fechaCobroMensual) {
      proximaFechaPago = new Date(anioActual, mesActual, fechaCobroMensual);
    } else {
      proximaFechaPago = new Date(anioActual, mesActual + 1, fechaCobroMensual);
    }
    
    res.status(200).json({
      proximaFechaPago: proximaFechaPago.toISOString().split('T')[0],
      diaCobroMensual: fechaCobroMensual
    });
  } catch (error) {
    console.error('Error al obtener próxima fecha de pago:', error);
    res.status(500).json({ message: 'Error al obtener próxima fecha de pago', error: error.message });
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