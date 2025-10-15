// Script para crear un archivo Excel de ejemplo con el formato correcto
const XLSX = require('xlsx');

function crearEjemploExcel() {
  // Datos de ejemplo con el formato correcto
  const datosEjemplo = [
    {
      'MATRICULA': 'OLI001',
      'NOMBRE': 'Juan',
      'APELLIDO': 'Pérez',
      'NUMERO TELEFONO': '1234567890',
      'DISCIPLINA': 'Karate',
      'GRUPO': 'A',  // <- Esta es la columna clave
      'ENTRENADOR': 'Carlos Martínez',
      'MENSUALIDAD': 100,
      'INSCRIPCION': 50,
      'MAY': 'X',
      'JUN': 'X',
      'JUL': '',
      'AGO': '',
      'SEP': '',
      'OCT': '',
      'NOV': '',
      'DIC': '',
      'FECHA DE INSCRIPCION': '2024-05-01'
    },
    {
      'MATRICULA': 'OLI002',
      'NOMBRE': 'María',
      'APELLIDO': 'González',
      'NUMERO TELEFONO': '0987654321',
      'DISCIPLINA': 'Taekwondo',
      'GRUPO': 'B',  // <- Esta es la columna clave
      'ENTRENADOR': 'Ana López',
      'MENSUALIDAD': 120,
      'INSCRIPCION': 60,
      'MAY': 'X',
      'JUN': 'X',
      'JUL': 'X',
      'AGO': '',
      'SEP': '',
      'OCT': '',
      'NOV': '',
      'DIC': '',
      'FECHA DE INSCRIPCION': '2024-05-01'
    },
    {
      'MATRICULA': 'OLI003',
      'NOMBRE': 'Pedro',
      'APELLIDO': 'Ramírez',
      'NUMERO TELEFONO': '5551234567',
      'DISCIPLINA': 'Judo',
      'GRUPO': 'C',  // <- Esta es la columna clave
      'ENTRENADOR': 'Miguel Torres',
      'MENSUALIDAD': 110,
      'INSCRIPCION': 55,
      'MAY': 'X',
      'JUN': 'X',
      'JUL': 'X',
      'AGO': 'X',
      'SEP': '',
      'OCT': '',
      'NOV': '',
      'DIC': '',
      'FECHA DE INSCRIPCION': '2024-05-01'
    }
  ];

  // Crear el libro de trabajo
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosEjemplo);

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

  // Guardar el archivo
  XLSX.writeFile(wb, 'ejemplo_alumnos_con_grupos.xlsx');
  
  console.log('✅ Archivo de ejemplo creado: ejemplo_alumnos_con_grupos.xlsx');
  console.log('\n📋 FORMATO REQUERIDO:');
  console.log('- MATRICULA: Código único del alumno');
  console.log('- NOMBRE: Nombre del alumno');
  console.log('- APELLIDO: Apellido del alumno');
  console.log('- NUMERO TELEFONO: Teléfono de contacto');
  console.log('- DISCIPLINA: Nombre de la disciplina (opcional si hay GRUPO)');
  console.log('- GRUPO: LETRA MAYÚSCULA (A, B, C, D...) - CLAVE PARA ASIGNACIÓN');
  console.log('- ENTRENADOR: Nombre del entrenador');
  console.log('- MENSUALIDAD: Costo mensual');
  console.log('- INSCRIPCION: Costo de inscripción');
  console.log('- MAY, JUN, JUL... DIC: Meses pagados (marcar con X)');
  console.log('- FECHA DE INSCRIPCION: Fecha de inscripción');
  
  console.log('\n🎯 IMPORTANTE:');
  console.log('La columna GRUPO debe contener la letra (A, B, C...) que corresponde');
  console.log('al grupo asignado a cada modalidad en el sistema.');
}

crearEjemploExcel();