// Script para convertir matrículas existentes al nuevo formato de 3 dígitos
const mongoose = require('mongoose');
const Alumno = require('./models/alumnos');

async function convertirMatriculas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/olimpus');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar todos los alumnos
    const alumnos = await Alumno.find({});
    
    console.log('\n=== MATRÍCULAS ANTES DE LA CONVERSIÓN ===');
    alumnos.forEach((alumno, index) => {
      console.log(`${index + 1}. ${alumno.matricula} - ${alumno.nombre}`);
    });
    
    if (alumnos.length === 0) {
      console.log('No hay alumnos para convertir');
      return;
    }
    
    // Encontrar todos los números existentes para asignar nuevos números secuenciales
    let numeroAsignar = 1;
    
    console.log('\n=== CONVIRTIENDO MATRÍCULAS ===');
    
    for (const alumno of alumnos) {
      const matriculaAnterior = alumno.matricula;
      const nuevaMatricula = String(numeroAsignar).padStart(3, '0');
      
      console.log(`Alumno: ${alumno.nombre}`);
      console.log(`  Matrícula anterior: ${matriculaAnterior}`);
      console.log(`  Nueva matrícula: ${nuevaMatricula}`);
      
      // Actualizar la matrícula
      await Alumno.findByIdAndUpdate(alumno._id, { matricula: nuevaMatricula });
      
      numeroAsignar++;
      console.log('  ✅ Actualizada\n');
    }
    
    console.log('=== MATRÍCULAS DESPUÉS DE LA CONVERSIÓN ===');
    const alumnosActualizados = await Alumno.find({}).sort({ matricula: 1 });
    alumnosActualizados.forEach((alumno, index) => {
      console.log(`${index + 1}. ${alumno.matricula} - ${alumno.nombre}`);
    });
    
    console.log(`\n✅ ${alumnos.length} matrícula(s) convertida(s) al nuevo formato`);
    console.log(`📊 Próxima matrícula automática será: ${String(numeroAsignar).padStart(3, '0')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

convertirMatriculas();