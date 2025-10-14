// =================================================================
// PROCESADOR DE ARCHIVOS EXCEL
// =================================================================
// Este archivo maneja la importación y exportación de datos en formato Excel

const XLSX = require('xlsx');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');

/**
 * Procesar archivo Excel y convertir a array de alumnos
 * Formato esperado:
 * | Nombre | Fecha Nacimiento | Teléfono | Correo | Modalidad | Observaciones |
 */
const procesarArchivoExcel = (buffer) => {
  try {
    // Leer el archivo Excel desde buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    throw new Error(`Error al procesar archivo Excel: ${error.message}`);
  }
};

/**
 * Validar datos de un alumno del Excel
 */
const validarDatosAlumno = (row, index) => {
  const errores = [];
  
  // Validar nombre
  if (!row.Nombre || row.Nombre.trim() === '') {
    errores.push(`Fila ${index + 2}: Nombre es requerido`);
  }
  
  // Validar fecha de nacimiento
  if (!row['Fecha Nacimiento']) {
    errores.push(`Fila ${index + 2}: Fecha de Nacimiento es requerida`);
  }
  
  // Validar teléfono
  if (!row.Teléfono && !row.Telefono) {
    errores.push(`Fila ${index + 2}: Teléfono es requerido`);
  }
  
  // Validar correo
  if (!row.Correo) {
    errores.push(`Fila ${index + 2}: Correo es requerido`);
  } else {
    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.Correo)) {
      errores.push(`Fila ${index + 2}: Formato de correo inválido`);
    }
  }
  
  // Validar modalidad
  if (!row.Modalidad) {
    errores.push(`Fila ${index + 2}: Modalidad es requerida`);
  }
  
  return errores;
};

/**
 * Convertir fecha de Excel a Date
 */
const convertirFechaExcel = (fechaExcel) => {
  // Si es un número (formato serial de Excel)
  if (typeof fechaExcel === 'number') {
    const fecha = XLSX.SSF.parse_date_code(fechaExcel);
    return new Date(fecha.y, fecha.m - 1, fecha.d);
  }
  
  // Si es string, intentar parsear
  if (typeof fechaExcel === 'string') {
    // Intentar varios formatos comunes
    const formatos = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY o MM/DD/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const formato of formatos) {
      const match = fechaExcel.match(formato);
      if (match) {
        // Asumir formato DD/MM/YYYY para el primer caso
        if (formato === formatos[0]) {
          return new Date(match[3], match[2] - 1, match[1]);
        } else if (formato === formatos[1]) {
          return new Date(match[1], match[2] - 1, match[3]);
        } else if (formato === formatos[2]) {
          return new Date(match[3], match[2] - 1, match[1]);
        }
      }
    }
  }
  
  return new Date(fechaExcel);
};

/**
 * Importar alumnos desde datos de Excel
 */
const importarAlumnosDesdeExcel = async (data) => {
  const resultados = {
    exitosos: 0,
    fallidos: 0,
    errores: [],
    alumnos: []
  };
  
  // Validar todas las filas primero
  const erroresValidacion = [];
  data.forEach((row, index) => {
    const erroresFila = validarDatosAlumno(row, index);
    erroresValidacion.push(...erroresFila);
  });
  
  if (erroresValidacion.length > 0) {
    resultados.errores = erroresValidacion;
    return resultados;
  }
  
  // Obtener todas las modalidades para mapear por nombre
  const modalidades = await Modalidad.find();
  const modalidadesMap = {};
  modalidades.forEach(m => {
    modalidadesMap[m.nombre.toLowerCase()] = m._id;
  });
  
  // Procesar cada fila
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Buscar modalidad por nombre
      const nombreModalidad = row.Modalidad.toLowerCase();
      const idModalidad = modalidadesMap[nombreModalidad];
      
      if (!idModalidad) {
        resultados.fallidos++;
        resultados.errores.push(`Fila ${i + 2}: Modalidad "${row.Modalidad}" no encontrada`);
        continue;
      }
      
      // Verificar si ya existe un alumno con el mismo correo
      const alumnoExistente = await Alumno.findOne({ correo: row.Correo });
      if (alumnoExistente) {
        resultados.fallidos++;
        resultados.errores.push(`Fila ${i + 2}: Ya existe un alumno con el correo ${row.Correo}`);
        continue;
      }
      
      // Convertir fecha de nacimiento
      const fechaNacimiento = convertirFechaExcel(row['Fecha Nacimiento']);
      
      // Crear nuevo alumno
      const nuevoAlumno = new Alumno({
        id_modalidad: idModalidad,
        fecha_nacimiento: fechaNacimiento,
        fecha_inscripcion: new Date(),
        nombre: row.Nombre.trim(),
        telefono: (row.Teléfono || row.Telefono).toString().trim(),
        correo: row.Correo.trim(),
        pagos_realizados: 0,
        pago_pendiente: 0,
        deuda: 0
      });
      
      await nuevoAlumno.save();
      resultados.exitosos++;
      resultados.alumnos.push(nuevoAlumno);
      
    } catch (error) {
      resultados.fallidos++;
      resultados.errores.push(`Fila ${i + 2}: ${error.message}`);
    }
  }
  
  return resultados;
};

/**
 * Exportar alumnos a formato Excel
 */
const exportarAlumnosAExcel = async () => {
  try {
    // Obtener todos los alumnos con sus modalidades
    const alumnos = await Alumno.find().populate('id_modalidad');
    
    // Convertir a formato para Excel
    const datosExcel = alumnos.map(alumno => {
      const modalidad = alumno.id_modalidad;
      
      return {
        'Nombre': alumno.nombre,
        'Fecha Nacimiento': new Date(alumno.fecha_nacimiento).toLocaleDateString('es-MX'),
        'Teléfono': alumno.telefono,
        'Correo': alumno.correo,
        'Modalidad': modalidad ? modalidad.nombre : 'Sin modalidad',
        'Fecha Inscripción': new Date(alumno.fecha_inscripcion).toLocaleDateString('es-MX'),
        'Pagos Realizados': alumno.pagos_realizados,
        'Pagos Pendientes': alumno.pago_pendiente || 0,
        'Deuda Total (MXN)': alumno.deuda || 0
      };
    });
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 18 }, // Fecha Nacimiento
      { wch: 15 }, // Teléfono
      { wch: 30 }, // Correo
      { wch: 20 }, // Modalidad
      { wch: 18 }, // Fecha Inscripción
      { wch: 15 }, // Pagos Realizados
      { wch: 15 }, // Pagos Pendientes
      { wch: 18 }  // Deuda Total
    ];
    worksheet['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  } catch (error) {
    throw new Error(`Error al exportar alumnos: ${error.message}`);
  }
};

module.exports = {
  procesarArchivoExcel,
  importarAlumnosDesdeExcel,
  exportarAlumnosAExcel,
  validarDatosAlumno,
  convertirFechaExcel
};
