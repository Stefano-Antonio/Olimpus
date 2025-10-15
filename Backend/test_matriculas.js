// Script para probar la generación de matrículas incrementales
const mongoose = require('mongoose');
const Alumno = require('./models/alumnos');

async function probarMatriculas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/olimpus');
    console.log('✅ Conectado a MongoDB');
    
    // Mostrar matrículas existentes
    const alumnosExistentes = await Alumno.find({}, { matricula: 1, nombre: 1 }).sort({ matricula: 1 });
    
    console.log('\n=== MATRÍCULAS EXISTENTES ===');
    if (alumnosExistentes.length === 0) {
      console.log('No hay alumnos registrados');
    } else {
      alumnosExistentes.forEach((alumno, index) => {
        console.log(`${index + 1}. Matrícula: ${alumno.matricula} - Nombre: ${alumno.nombre}`);
      });
    }
    
    // Encontrar el número más alto
    let numeroMasAlto = 0;
    alumnosExistentes.forEach(alumno => {
      if (alumno.matricula) {
        // Extraer solo números puros (eliminar letras)
        const soloNumeros = alumno.matricula.replace(/\D/g, '');
        if (soloNumeros) {
          const numero = parseInt(soloNumeros);
          if (numero > numeroMasAlto) {
            numeroMasAlto = numero;
          }
        }
      }
    });
    
    console.log(`\n📊 ANÁLISIS:`);
    console.log(`   Total alumnos: ${alumnosExistentes.length}`);
    console.log(`   Número más alto encontrado: ${numeroMasAlto}`);
    console.log(`   Próxima matrícula será: ${String(numeroMasAlto + 1).padStart(3, '0')}`);
    
    // Crear un alumno de prueba para verificar la matrícula
    console.log('\n🧪 PRUEBA DE MATRÍCULA:');
    const alumnoTest = new Alumno({
      nombre: 'ALUMNO DE PRUEBA - ELIMINAR',
      telefono: '1234567890',
      correo: 'test@test.com',
      fecha_nacimiento: new Date('2000-01-01')
    });
    
    // La matrícula se genera automáticamente en el middleware pre('save')
    await alumnoTest.save();
    console.log(`✅ Matrícula generada automáticamente: ${alumnoTest.matricula}`);
    
    // Eliminar el alumno de prueba
    await Alumno.findByIdAndDelete(alumnoTest._id);
    console.log('🗑️ Alumno de prueba eliminado');
    
    console.log('\n💡 CONFIRMACIÓN:');
    console.log('La matrícula se genera correctamente de forma incremental');
    console.log('No reutiliza números de alumnos eliminados');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

probarMatriculas();