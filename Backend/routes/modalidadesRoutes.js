const express = require('express');
const router = express.Router();
const Modalidad = require('../models/modalidades');
const Alumno = require('../models/alumnos');
const Pago = require('../models/pagos');

// Función auxiliar para obtener la siguiente letra disponible por tipo de modalidad
async function obtenerSiguienteGrupoPorModalidad(nombreModalidad) {
    try {
        // Buscar todas las modalidades del mismo tipo (nombre) que tienen grupo asignado
        const modalidadesMismoTipo = await Modalidad.find({ 
            nombre: nombreModalidad,
            grupo: { $ne: null } 
        }).sort({ grupo: 1 });
        
        const gruposUsados = modalidadesMismoTipo.map(m => m.grupo);
        
        // Buscar la primera letra disponible desde A para este tipo de modalidad
        for (let i = 65; i <= 90; i++) { // A-Z en ASCII
            const letra = String.fromCharCode(i);
            if (!gruposUsados.includes(letra)) {
                return letra;
            }
        }
        
        return null; // No hay letras disponibles para este tipo
    } catch (error) {
        console.error('Error al obtener siguiente grupo por modalidad:', error);
        return null;
    }
}

// Crear una nueva modalidad
router.post('/', async (req, res) => {
    const { nombre, horarios, costo, id_entrenador, grupo } = req.body;
    console.log('Datos recibidos para crear la materia:', req.body);
    // Log para depuración
    console.log(`[DEBUG] Intentando crear modalidad: nombre="${nombre}", grupo="${grupo}"`);

    try {
        // Asignar grupo automáticamente si no se proporciona (por tipo de modalidad)
        let grupoAsignado = grupo;
        if (!grupoAsignado) {
            grupoAsignado = await obtenerSiguienteGrupoPorModalidad(nombre);
        }

        console.log(`[DEBUG] Grupo asignado final: nombre="${nombre}", grupo="${grupoAsignado}"`);

        // Verificar si ya existe una modalidad con el mismo nombre y grupo
        if (grupoAsignado) {
            console.log(`[DEBUG] Buscando si existe modalidad con nombre="${nombre}" y grupo="${grupoAsignado}"`);
            const existingModalidadGrupo = await Modalidad.findOne({ 
                nombre: nombre, 
                grupo: grupoAsignado 
            });
            if (existingModalidadGrupo) {
                console.log(`[DEBUG] Ya existe:`, existingModalidadGrupo);
                return res.status(400).json({ 
                    message: `Ya existe una modalidad "${nombre}" con el grupo "${grupoAsignado}"` 
                });
            }
        }

        // Crear la modalidad con el entrenador y grupo
        const newModalidad = new Modalidad({
            nombre,
            horarios,
            costo,
            id_entrenador: id_entrenador || null,
            grupo: grupoAsignado
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
        const modalidades = await Modalidad.find().populate('id_entrenador', 'nombre');
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
                costo: modalidad.costo,
                grupo: modalidad.grupo || '-',
                entrenador: modalidad.id_entrenador ? modalidad.id_entrenador.nombre : 'Sin entrenador',
                id_entrenador: modalidad.id_entrenador ? modalidad.id_entrenador._id : null
            };
        });

        res.json(response);
    } catch (error) {
        console.error('Error al obtener modalidades:', error);
        res.status(500).json({ error: 'Error al obtener modalidades' });
    }
});

// Actualizar una modalidad existente
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, horarios, costo, id_entrenador, grupo } = req.body;
        
        console.log('Datos recibidos para actualizar modalidad:', req.body);

        // Obtener la modalidad actual
        const modalidadActual = await Modalidad.findById(id);
        if (!modalidadActual) {
            return res.status(404).json({ message: 'Modalidad no encontrada' });
        }

        // Si se está cambiando el grupo o el nombre, verificar que no exista la combinación
        if (grupo && (grupo !== modalidadActual.grupo || nombre !== modalidadActual.nombre)) {
            const existingModalidadGrupo = await Modalidad.findOne({ 
                nombre: nombre, 
                grupo: grupo,
                _id: { $ne: id } // Excluir la modalidad actual
            });
            if (existingModalidadGrupo) {
                return res.status(400).json({ 
                    message: `Ya existe otra modalidad "${nombre}" con el grupo "${grupo}"` 
                });
            }
        }

        const modalidadActualizada = await Modalidad.findByIdAndUpdate(
            id,
            {
                nombre,
                horarios,
                costo,
                id_entrenador: id_entrenador || null,
                grupo: grupo || null
            },
            { new: true, runValidators: true }
        );

        console.log('Modalidad actualizada:', modalidadActualizada);
        res.json(modalidadActualizada);
    } catch (error) {
        console.error('Error al actualizar modalidad:', error);
        if (error.code === 11000) { // Error de duplicado
            res.status(400).json({ message: 'Ya existe una modalidad con esa combinación de nombre y grupo' });
        } else {
            res.status(500).json({ message: 'Error al actualizar modalidad', error: error.message });
        }
    }
});

// Obtener modalidades por grupo (para importación Excel)
// Ahora puede haber múltiples modalidades con el mismo grupo
router.get('/grupo/:grupo', async (req, res) => {
    try {
        const { grupo } = req.params;
        const modalidades = await Modalidad.find({ grupo: grupo.toUpperCase() });
        
        if (modalidades.length === 0) {
            return res.status(404).json({ message: `No se encontraron modalidades con grupo ${grupo}` });
        }
        
        res.json(modalidades);
    } catch (error) {
        console.error('Error al buscar modalidades por grupo:', error);
        res.status(500).json({ message: 'Error al buscar modalidades por grupo', error: error.message });
    }
});

// Nueva ruta: Obtener modalidad específica por nombre y grupo
router.get('/buscar/:nombre/:grupo', async (req, res) => {
    try {
        const { nombre, grupo } = req.params;
        const modalidad = await Modalidad.findOne({ 
            nombre: nombre, 
            grupo: grupo.toUpperCase() 
        });
        
        if (!modalidad) {
            return res.status(404).json({ 
                message: `No se encontró modalidad "${nombre}" con grupo "${grupo}"` 
            });
        }
        
        res.json(modalidad);
    } catch (error) {
        console.error('Error al buscar modalidad por nombre y grupo:', error);
        res.status(500).json({ message: 'Error al buscar modalidad', error: error.message });
    }
});

// Eliminar una modalidad
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const modalidadEliminada = await Modalidad.findByIdAndDelete(id);

        if (!modalidadEliminada) {
            return res.status(404).json({ message: 'Modalidad no encontrada' });
        }

        console.log('Modalidad eliminada:', modalidadEliminada);
        res.json({ message: 'Modalidad eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar modalidad:', error);
        res.status(500).json({ message: 'Error al eliminar modalidad', error: error.message });
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
  const { monto, id, costo, concepto } = req.body;
  try {
    const alumno = await Alumno.findById(id);
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    // Verificar si el alumno está activo
    if (alumno.activo === false) {
      return res.status(400).json({ 
        message: 'No se pueden registrar pagos para alumnos inactivos. Active al alumno primero.' 
      });
    }

    console.log('Datos recibidos para registrar el pago:', req.body);
    
    // 1. Registrar el nuevo pago con concepto
    const nuevoPago = new Pago({
      alumno: id,
      costo: costo,
      fecha: new Date(),
      concepto: concepto || 'Mensualidad'
    });

    await nuevoPago.save();

    // 2. Sumar el monto a los pagos realizados (solo si monto > 0)
    if (monto > 0) {
      alumno.pagos_realizados = (alumno.pagos_realizados || 0) + monto;
      await alumno.save();
    }

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
      // Obtener la fecha del parámetro o usar la fecha actual
      let fechaConsulta;
      if (req.query.fecha) {
        // Crear la fecha usando la fecha local sin conversión UTC
        const [year, month, day] = req.query.fecha.split('-');
        fechaConsulta = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        fechaConsulta = new Date();
      }
      
      // Crear inicio y fin del día en hora local
      const inicioDelDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate(), 0, 0, 0, 0);
      const finDelDia = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth(), fechaConsulta.getDate(), 23, 59, 59, 999);
  
      console.log('Fecha consultada:', req.query.fecha);
      console.log('Fecha procesada:', fechaConsulta);
      console.log('Buscando pagos entre:', inicioDelDia, 'y', finDelDia);
  
      // Obtener los pagos realizados en el día con populate para traer datos del alumno
      const pagosDelDia = await Pago.find({
        fecha: { $gte: inicioDelDia, $lte: finDelDia }
      }).populate('alumno', 'nombre').sort({ fecha: -1 });
      
      // Agrupar pagos por concepto para el resumen
      const resumenPorConcepto = pagosDelDia.reduce((acc, pago) => {
        const concepto = pago.concepto || 'Mensualidad';
        if (!acc[concepto]) {
          acc[concepto] = { cantidad: 0, total: 0 };
        }
        acc[concepto].cantidad += 1;
        acc[concepto].total += pago.costo || 0;
        return acc;
      }, {});
  
      // Sumar los costos de todos los pagos
      const totalPagado = pagosDelDia.reduce((acc, pago) => acc + (pago.costo || 0), 0);
      
      console.log('Total pagado del día:', totalPagado, 'Cantidad de pagos:', pagosDelDia.length);
      
      // Devolver todos los pagos y el total
      res.status(200).json({
          totalPagado: totalPagado.toFixed(2),
          pagos: pagosDelDia,
          fecha: fechaConsulta.toISOString().split('T')[0],
          resumen: resumenPorConcepto
      });
  
    } catch (error) {
      console.error('Error al generar el corte del día:', error);
      res.status(500).json({ message: 'Error al generar el corte del día', error: error.message });
    }
  });
  
  
module.exports = router;