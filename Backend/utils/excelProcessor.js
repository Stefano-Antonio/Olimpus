// =================================================================
// PROCESADOR DE ARCHIVOS EXCEL - FORMATO OLIMPUS
// =================================================================
// Este archivo maneja la importación y exportación de datos en el formato específico de Olimpus
// Formato basado en: MATRICULA | NOMBRE | APELLIDO | NUMERO TELEFONO | DISCIPLINA | 
// ENTRENADOR | GRUPO | MENSUALIDAD | INSCRIPCION | MAY | JUN | JUL | AGO | SEP | OCT | NOV | DIC | FECHA DE INSCRIPCION

const XLSX = require('xlsx');
const Alumno = require('../models/alumnos');
const Modalidad = require('../models/modalidades');

/**
 * Procesar archivo Excel y convertir a array de alumnos
 * Formato esperado de Olimpus:
 * | MATRICULA | NOMBRE | APELLIDO | NUMERO TELEFONO | DISCIPLINA | ENTRENADOR | GRUPO | 
 * | MENSUALIDAD | INSCRIPCION | MAY | JUN | JUL | AGO | SEP | OCT | NOV | DIC | FECHA DE INSCRIPCION |
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
 * Validar datos de un alumno del Excel formato Olimpus
 * Solo valida campos esenciales, otros se completarán con "Sin asignar"
 */
const validarDatosAlumno = (row, index) => {
  const errores = [];
  
  // Validar nombre (REQUERIDO)
  if (!row.NOMBRE || row.NOMBRE.toString().trim() === '') {
    errores.push(`Fila ${index + 2}: Nombre es requerido`);
  }
  
  // Validar apellido (REQUERIDO)
  if (!row.APELLIDO || row.APELLIDO.toString().trim() === '') {
    errores.push(`Fila ${index + 2}: Apellido es requerido`);
  }
  
  // Validar número de teléfono (REQUERIDO)
  if (!row['NUMERO TELEFONO'] && !row['NUMERO TELEFONICO']) {
    errores.push(`Fila ${index + 2}: Número de teléfono es requerido`);
  }
  
  // Validar disciplina (OPCIONAL - si no existe modalidad, se deja sin asignar)
  // La disciplina ya no es requerida - se puede registrar solo con inscripción
  
  // Los siguientes campos son OPCIONALES - se llenarán con "Sin asignar" si faltan:
  // - MATRICULA (se genera automáticamente)
  // - ENTRENADOR 
  // - GRUPO
  // - MENSUALIDAD (se toma de la modalidad si falta)
  // - INSCRIPCION (default 0)
  // - FECHA DE INSCRIPCION (default fecha actual)
  // - Meses MAR-FEB (12 meses del año, default sin pagos)
  
  return errores;
};

/**
 * Contar el número de meses pagados basándose en el array de meses
 */
const contarMesesPagados = (mesesPagados) => {
  if (!Array.isArray(mesesPagados)) {
    return 0;
  }
  return mesesPagados.length;
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
 * Calcular pagos realizados desde el Excel formato Olimpus
 * Acepta múltiples formatos de pago: 'x', '1', 'si', 'pagado', 'p', etc.
 * Maneja los 12 meses del año empezando desde marzo
 */
const calcularPagosRealizados = (row) => {
  // Mapeo de meses (tanto formato corto como largo)
  const mesesMap = {
    'ENE': 'ENE', 'ENERO': 'ENE',
    'FEB': 'FEB', 'FEBRERO': 'FEB', 
    'MAR': 'MAR', 'MARZO': 'MAR',
    'ABR': 'ABR', 'ABRIL': 'ABR',
    'MAY': 'MAY', 'MAYO': 'MAY',
    'JUN': 'JUN', 'JUNIO': 'JUN',
    'JUL': 'JUL', 'JULIO': 'JUL',
    'AGO': 'AGO', 'AGOSTO': 'AGO',
    'SEP': 'SEP', 'SEPTIEMBRE': 'SEP', 'SEPT': 'SEP',
    'OCT': 'OCT', 'OCTUBRE': 'OCT',
    'NOV': 'NOV', 'NOVIEMBRE': 'NOV',
    'DIC': 'DIC', 'DICIEMBRE': 'DIC'
  };
  
  // 12 meses en orden
  const mesesOrdenados = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const pagosRealizados = [];
  
  console.log('🔍 DEBUG - Analizando fila:', row.NOMBRE);
  
  // Buscar en todas las propiedades del row las que puedan ser meses
  Object.keys(row).forEach(columna => {
    const columnaUpper = columna.toString().toUpperCase().trim();
    
    // Primero verificar si coincide exactamente con algún mes
    let mesNormalizado = mesesMap[columnaUpper];
    
    // Si no coincide exactamente, tomar las primeras 3 letras
    if (!mesNormalizado && columnaUpper.length >= 3) {
      const tresPrimeras = columnaUpper.substring(0, 3);
      mesNormalizado = mesesMap[tresPrimeras];
    }
    
    // Si encontramos un mes válido, verificar si tiene marca de pago
    if (mesNormalizado && row[columna]) {
      const valor = row[columna].toString().trim().toLowerCase();
      console.log(`🔍 Revisando columna "${columna}" -> Mes: ${mesNormalizado}, Valor: "${valor}"`);
      
      // Formatos aceptados para "pagado"
      if (valor === 'x' || valor === '1' || valor === 'si' || valor === 'sí' || 
          valor === 'pagado' || valor === 'p' || valor === 'ok' || 
          valor === 'yes' || valor === 'y' || valor === 'true') {
        
        // Evitar duplicados
        if (!pagosRealizados.includes(mesNormalizado)) {
          pagosRealizados.push(mesNormalizado);
          console.log(`✅ ${mesNormalizado} AGREGADO - Valor reconocido: "${valor}"`);
        }
      } else {
        console.log(`❌ ${mesNormalizado} NO AGREGADO - Valor no reconocido: "${valor}"`);
      }
    }
  });
  
  // Ordenar los meses según el orden natural (ENE, FEB, MAR, etc.)
  pagosRealizados.sort((a, b) => {
    return mesesOrdenados.indexOf(a) - mesesOrdenados.indexOf(b);
  });
  
  console.log('📊 RESULTADO - Meses con pago:', pagosRealizados, 'Total:', pagosRealizados.length);
  return pagosRealizados;
};

/**
 * Importar alumnos desde datos de Excel formato Olimpus
 */
const importarAlumnosDesdeExcel = async (data) => {
  const resultados = {
    exitosos: 0,
    fallidos: 0,
    duplicados: 0,
    errores: [],
    alumnos: [],
    registrosRechazados: []
  };
  

  // Obtener todas las modalidades para mapear por grupo y disciplina (nombre completo y abreviado)
  const modalidades = await Modalidad.find();

  // Mapeo compuesto: { [nombreModalidad]: { [grupo]: modalidad } }
  const modalidadesMapCompuesto = {};
  const modalidadesMapNombre = {};
  const modalidadesMapAbreviado = {};
  const abreviaturas = {
    'pk': 'parkour',
    'gaf': 'gimnasia femenil',
    'bg': 'baby gym'
  };

  console.log('=== MODALIDADES DISPONIBLES ===');
  modalidades.forEach(m => {
    const nombreLower = m.nombre.toLowerCase();
    if (!modalidadesMapCompuesto[nombreLower]) modalidadesMapCompuesto[nombreLower] = {};
    if (m.grupo) modalidadesMapCompuesto[nombreLower][m.grupo.toUpperCase()] = m;
    modalidadesMapNombre[nombreLower] = m;
    for (const [abr, nombreCompleto] of Object.entries(abreviaturas)) {
      if (nombreLower === nombreCompleto) modalidadesMapAbreviado[abr] = m;
    }
  });

  console.log('=== MAPEOS COMPUESTOS ===');
  Object.entries(modalidadesMapCompuesto).forEach(([nombre, grupos]) => {
    console.log(`Modalidad: ${nombre} => Grupos:`, Object.keys(grupos));
  });

  console.log('=== MAPEOS CREADOS ===');
  console.log('Nombres disponibles:', Object.keys(modalidadesMapNombre));
  console.log('Abreviados disponibles:', Object.keys(modalidadesMapAbreviado));
  
  // Obtener todas las matrículas existentes para evitar duplicados
  const matriculasExistentes = new Set();
  const alumnosExistentes = await Alumno.find({}, 'matricula');
  alumnosExistentes.forEach(alumno => {
    if (alumno.matricula) {
      matriculasExistentes.add(alumno.matricula);
    }
  });
  
  // Procesar cada fila individualmente (permite importación parcial)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Saltar filas vacías
    if (!row.NOMBRE && !row.APELLIDO && !row.DISCIPLINA && !row.GRUPO) {
      continue;
    }
    
    try {
      // Validar datos esenciales con manejo seguro
      const nombre = (row.NOMBRE || '').toString().trim();
      const apellido = (row.APELLIDO || '').toString().trim();
      const disciplina = (row.DISCIPLINA || '').toString().trim();
      
      // Extraer grupo con múltiples variaciones de nombre de columna
      let grupo = '';
      const posiblesColumnasGrupo = ['GRUPO', 'grupo', 'Grupo', 'LETTER', 'letter', 'Letter', 'LETRA', 'letra', 'Letra'];
      
      for (const columna of posiblesColumnasGrupo) {
        if (row[columna] !== undefined && row[columna] !== null && row[columna] !== '') {
          grupo = row[columna].toString().trim().toUpperCase();
          break;
        }
      }
      
      const telefono = ((row['NUMERO TELEFONO'] || row['NUMERO TELEFONICO']) || '').toString().trim();
      const matricula = row.MATRICULA ? row.MATRICULA.toString().trim() : null;
      
      console.log(`\n=== PROCESANDO FILA ${i + 2} ===`);
      console.log(`Nombre: "${nombre}", Apellido: "${apellido}"`);
      console.log(`Grupo Excel: "${grupo}", Disciplina: "${disciplina}"`);
      console.log(`Teléfono: "${telefono}", Matrícula: "${matricula}"`);
      console.log(`Columnas disponibles en la fila:`, Object.keys(row));
      
      // Verificar si la matrícula ya existe
      if (matricula && matriculasExistentes.has(matricula)) {
        resultados.duplicados++;
        resultados.registrosRechazados.push({
          fila: i + 2,
          datos: { nombre, apellido, disciplina, matricula },
          motivo: `Matrícula "${matricula}" ya existe en el sistema`
        });
        continue;
      }
      
      // Validar campos requeridos con detalles específicos
      const erroresCampo = [];
      if (!nombre) erroresCampo.push('nombre');
      if (!apellido) erroresCampo.push('apellido');
      if (!telefono) erroresCampo.push('teléfono');
      // disciplina ya no es requerida
      
      if (erroresCampo.length > 0) {
        resultados.fallidos++;
        const camposFaltantes = erroresCampo.join(', ');
        resultados.registrosRechazados.push({
          fila: i + 2,
          datos: { nombre, apellido, disciplina, telefono },
          motivo: `Faltan campos requeridos: ${camposFaltantes}`
        });
        resultados.errores.push(`Fila ${i + 2}: Faltan campos requeridos: ${camposFaltantes}`);
        continue;
      }
      
      // Buscar modalidad por grupo y tipo (nombre completo o abreviado)
      let modalidadEncontrada = null;
      console.log(`Buscando modalidad...`);

      // Normalizar disciplina
      let disciplinaLower = disciplina.toLowerCase();
      if (abreviaturas[disciplinaLower]) {
        disciplinaLower = abreviaturas[disciplinaLower];
      }

      // 1. Buscar por grupo y modalidad
      if (grupo && grupo !== '' && disciplinaLower) {
        if (
          modalidadesMapCompuesto[disciplinaLower] &&
          modalidadesMapCompuesto[disciplinaLower][grupo]
        ) {
          modalidadEncontrada = modalidadesMapCompuesto[disciplinaLower][grupo];
          console.log(`✅ Modalidad encontrada por grupo "${grupo}" y disciplina "${disciplinaLower}":`, modalidadEncontrada.nombre);
        }
      }

      // 2. Si no se encuentra por grupo y modalidad, NO asignar modalidad aunque exista por nombre o abreviado
      if (!modalidadEncontrada) {
        console.log(`❌ No se encontró modalidad exacta para grupo "${grupo}" y disciplina "${disciplinaLower}". Alumno se registrará SIN modalidad asignada.`);
      }
      
      // Construir nombre completo
      const nombreCompleto = `${nombre} ${apellido}`;
      
      // Verificar si ya existe un alumno con el mismo nombre y teléfono
      const alumnoExistente = await Alumno.findOne({ 
        nombre: nombreCompleto,
        telefono: telefono
      });
      
      if (alumnoExistente) {
        resultados.duplicados++;
        resultados.registrosRechazados.push({
          fila: i + 2,
          datos: { nombre, apellido, disciplina, telefono },
          motivo: `Ya existe un alumno con el nombre "${nombreCompleto}" y teléfono "${telefono}"`
        });
        resultados.errores.push(`Fila ${i + 2}: Ya existe un alumno con el nombre "${nombreCompleto}" y teléfono "${telefono}"`);
        continue;
      }
      
      // Convertir fecha de inscripción con manejo seguro
      let fechaInscripcion = new Date(); // Default: fecha actual
      if (row['FECHA DE INSCRIPCION'] || row['FECHA DE INSCRIPCIÓN']) {
        try {
          const fechaConvertida = convertirFechaExcel(row['FECHA DE INSCRIPCION'] || row['FECHA DE INSCRIPCIÓN']);
          if (fechaConvertida && !isNaN(fechaConvertida)) {
            fechaInscripcion = fechaConvertida;
          }
        } catch (error) {
          // Mantener fecha actual como default
        }
      }
      
      // Calcular fecha de nacimiento aproximada 
      const fechaNacimiento = new Date(fechaInscripcion.getTime() - (25 * 365 * 24 * 60 * 60 * 1000));
      
      // Calcular pagos realizados basado en las X de los meses
      const mesesConPago = calcularPagosRealizados(row);
      
      // Asegurarse de que sea un array válido
      const mesesArray = Array.isArray(mesesConPago) ? mesesConPago : [];
      
      // Contar explícitamente el número de meses
      let numeroPagosRealizados = 0;
      if (Array.isArray(mesesArray)) {
        numeroPagosRealizados = mesesArray.length;
      }
      
      // Forzar a ser número entero
      numeroPagosRealizados = parseInt(numeroPagosRealizados) || 0;
      
      console.log(`Fila ${i + 2}: mesesArray:`, mesesArray, 'numeroPagosRealizados:', numeroPagosRealizados, 'tipo:', typeof numeroPagosRealizados);
      
      // Procesar campos adicionales con valores seguros por defecto
      const entrenador = row.ENTRENADOR ? row.ENTRENADOR.toString().trim() : "Sin asignar";
      const grupoAdicional = row.GRUPO ? row.GRUPO.toString().trim() : "Sin asignar";
      
      // Procesar costos con validación numérica
      let costoMensualidad = 0; // Default 0 si no hay modalidad
      if (modalidadEncontrada) {
        costoMensualidad = modalidadEncontrada.costo || 0;
        // Si hay valor en el Excel, usarlo
        if (row.MENSUALIDAD) {
          const mensualidadExcel = parseFloat(row.MENSUALIDAD);
          if (!isNaN(mensualidadExcel) && mensualidadExcel > 0) {
            costoMensualidad = mensualidadExcel;
          }
        }
      }
      
      let costoInscripcionExcel = 0; // Default 0
      if (row.INSCRIPCION) {
        const inscripcionExcel = parseFloat(row.INSCRIPCION);
        if (!isNaN(inscripcionExcel) && inscripcionExcel >= 0) {
          costoInscripcionExcel = inscripcionExcel;
        }
      }
      
      // Generar correo con formato seguro
      const correoGenerado = row.CORREO ? row.CORREO.toString().trim() : 
                            `${nombre.toLowerCase().replace(/\s+/g, '')}.${apellido.toLowerCase().replace(/\s+/g, '')}@olimpus.com`;
      
      // Crear nuevo alumno con todos los campos
      const nuevoAlumno = new Alumno({
        matricula: matricula || undefined, // Se generará automáticamente si no existe
        id_modalidad: modalidadEncontrada ? modalidadEncontrada._id : null, // Puede ser null si no hay modalidad
        fecha_nacimiento: fechaNacimiento,
        fecha_inscripcion: fechaInscripcion,
        nombre: nombreCompleto,
        telefono: telefono,
        correo: correoGenerado,
        entrenador: entrenador,
        grupo: modalidadEncontrada ? modalidadEncontrada.grupo : grupoAdicional,
        costo_mensualidad: costoMensualidad,
        costo_inscripcion_excel: costoInscripcionExcel,
        pagos_realizados: numeroPagosRealizados, // Número de meses pagados (cuenta las X)
        meses_pagados: mesesArray, // Array de meses desde Excel
        pago_pendiente: 0, // Se calculará automáticamente
        deuda: 0 // Se calculará automáticamente
      });
      
      await nuevoAlumno.save();
      resultados.exitosos++;
      resultados.alumnos.push(nuevoAlumno);
      
      console.log(`✅ Alumno creado exitosamente: ${nombreCompleto}`);
      console.log(`   - Matrícula: ${nuevoAlumno.matricula} ${!matricula ? '(generada automáticamente)' : '(del Excel)'}`);
      console.log(`   - Modalidad: ${modalidadEncontrada ? modalidadEncontrada.nombre : 'SIN MODALIDAD'}`);
      console.log(`   - Grupo asignado: ${nuevoAlumno.grupo}`);
      console.log(`   - ID Modalidad: ${nuevoAlumno.id_modalidad || 'null'}`);
      
    } catch (error) {
      resultados.fallidos++;
      // Intentar extraer datos de la fila para el registro rechazado
      const datosError = {
        nombre: (row.NOMBRE || '').toString().trim(),
        apellido: (row.APELLIDO || '').toString().trim(),
        disciplina: (row.DISCIPLINA || '').toString().trim(),
        telefono: ((row['NUMERO TELEFONO'] || row['NUMERO TELEFONICO']) || '').toString().trim()
      };
      
      resultados.registrosRechazados.push({
        fila: i + 2,
        datos: datosError,
        motivo: `Error de procesamiento: ${error.message}`
      });
      resultados.errores.push(`Fila ${i + 2}: ${error.message}`);
    }
  }
  
  return resultados;
};

/**
 * Generar plantilla Excel con formato Olimpus
 */
const generarPlantillaExcel = async () => {
  try {
    // Datos de ejemplo para la plantilla
    const datosEjemplo = [
      {
        'MATRICULA': 'OLY20250001',
        'NOMBRE': 'Juan',
        'APELLIDO': 'Pérez García',
        'NUMERO TELEFONO': '4921234567',
        'DISCIPLINA': 'Gimnasio',
        'ENTRENADOR': 'Carlos López',
        'GRUPO': 'A',
        'MENSUALIDAD': 500.00,
        'INSCRIPCION': 0.00,
        'ENE': 'X',
        'FEB': 'X',
        'MAR': 'X',
        'ABR': '',
        'MAY': '',
        'JUN': '',
        'JUL': '',
        'AGO': '',
        'SEP': '',
        'OCT': '',
        'NOV': '',
        'DIC': '',
        'FECHA DE INSCRIPCION': '28/03/2025'
      },
      {
        'MATRICULA': '',
        'NOMBRE': 'María',
        'APELLIDO': 'González Soto',
        'NUMERO TELEFONO': '4929876543',
        'DISCIPLINA': 'CrossFit',
        'ENTRENADOR': 'Ana Rodríguez',
        'GRUPO': 'B',
        'MENSUALIDAD': 600.00,
        'INSCRIPCION': 0.00,
        'ENE': '',
        'FEB': '',
        'MAR': '',
        'ABR': '',
        'MAY': '',
        'JUN': '',
        'JUL': '',
        'AGO': '',
        'SEP': '',
        'OCT': '',
        'NOV': '',
        'DIC': '',
        'FECHA DE INSCRIPCION': '01/05/2025'
      }
    ];
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);
    
    // Ajustar ancho de columnas (12 meses completos)
    const colWidths = [
      { wch: 12 }, // MATRICULA
      { wch: 15 }, // NOMBRE
      { wch: 15 }, // APELLIDO
      { wch: 15 }, // NUMERO TELEFONO
      { wch: 12 }, // DISCIPLINA
      { wch: 12 }, // ENTRENADOR
      { wch: 8 },  // GRUPO
      { wch: 12 }, // MENSUALIDAD
      { wch: 12 }, // INSCRIPCION
      { wch: 5 },  // ENE
      { wch: 5 },  // FEB
      { wch: 5 },  // MAR
      { wch: 5 },  // ABR
      { wch: 5 },  // MAY
      { wch: 5 },  // JUN
      { wch: 5 },  // JUL
      { wch: 5 },  // AGO
      { wch: 5 },  // SEP
      { wch: 5 },  // OCT
      { wch: 5 },  // NOV
      { wch: 5 },  // DIC
      { wch: 18 }  // FECHA DE INSCRIPCION
    ];
    worksheet['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Olimpus');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  } catch (error) {
    throw new Error(`Error al generar plantilla: ${error.message}`);
  }
};

/**
 * Exportar alumnos a formato Excel Olimpus
 */
const exportarAlumnosAExcel = async () => {
  try {
    // Obtener todos los alumnos con sus modalidades
    const alumnos = await Alumno.find().populate('id_modalidad');
    
    // Obtener el año actual para determinar qué meses mostrar
    const añoActual = new Date().getFullYear();
    const mesActual = new Date().getMonth(); // 0-11
    
    // Convertir a formato Olimpus para Excel
    const datosExcel = alumnos.map(alumno => {
      const modalidad = alumno.id_modalidad;
      
      // Separar nombre y apellido
      const nombreCompleto = alumno.nombre.split(' ');
      const nombre = nombreCompleto[0] || '';
      const apellido = nombreCompleto.slice(1).join(' ') || '';
      
      // Generar marcas X para los meses pagados (12 meses empezando desde enero)
      const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const marcasMeses = {};
      
      // Marcar los meses según el array de meses pagados
      meses.forEach(mes => {
        if (alumno.meses_pagados && Array.isArray(alumno.meses_pagados)) {
          marcasMeses[mes] = alumno.meses_pagados.includes(mes) ? 'X' : '';
        } else {
          // Compatibilidad con el formato anterior (número de pagos)
          const numPagos = alumno.pagos_realizados || 0;
          const indiceMes = meses.indexOf(mes);
          marcasMeses[mes] = indiceMes < numPagos ? 'X' : '';
        }
      });
      
      return {
        'MATRICULA': alumno.matricula || '',
        'NOMBRE': nombre,
        'APELLIDO': apellido,
        'NUMERO TELEFONO': alumno.telefono,
        'DISCIPLINA': modalidad ? modalidad.nombre : '',
        'ENTRENADOR': alumno.entrenador || 'Sin asignar',
        'GRUPO': alumno.grupo || 'Sin asignar',
        'MENSUALIDAD': alumno.costo_mensualidad || (modalidad ? modalidad.precio : 0),
        'INSCRIPCION': alumno.costo_inscripcion_excel || 0,
        'ENE': marcasMeses.ENE,
        'FEB': marcasMeses.FEB,
        'MAR': marcasMeses.MAR,
        'ABR': marcasMeses.ABR,
        'MAY': marcasMeses.MAY,
        'JUN': marcasMeses.JUN,
        'JUL': marcasMeses.JUL,
        'AGO': marcasMeses.AGO,
        'SEP': marcasMeses.SEP,
        'OCT': marcasMeses.OCT,
        'NOV': marcasMeses.NOV,
        'DIC': marcasMeses.DIC,
        'FECHA DE INSCRIPCION': new Date(alumno.fecha_inscripcion).toLocaleDateString('es-MX')
      };
    });
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas según el formato Olimpus (12 meses)
    const colWidths = [
      { wch: 12 }, // MATRICULA
      { wch: 15 }, // NOMBRE
      { wch: 15 }, // APELLIDO
      { wch: 15 }, // NUMERO TELEFONO
      { wch: 12 }, // DISCIPLINA
      { wch: 12 }, // ENTRENADOR
      { wch: 8 },  // GRUPO
      { wch: 12 }, // MENSUALIDAD
      { wch: 12 }, // INSCRIPCION
      { wch: 5 },  // ENE
      { wch: 5 },  // FEB
      { wch: 5 },  // MAR
      { wch: 5 },  // ABR
      { wch: 5 },  // MAY
      { wch: 5 },  // JUN
      { wch: 5 },  // JUL
      { wch: 5 },  // AGO
      { wch: 5 },  // SEP
      { wch: 5 },  // OCT
      { wch: 5 },  // NOV
      { wch: 5 },  // DIC
      { wch: 18 }  // FECHA DE INSCRIPCION
    ];
    worksheet['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos Olimpus');
    
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
  generarPlantillaExcel,
  validarDatosAlumno,
  convertirFechaExcel,
  calcularPagosRealizados,
  contarMesesPagados
};
