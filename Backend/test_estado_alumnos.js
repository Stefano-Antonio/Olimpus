// Script para probar la funcionalidad de alumnos activos/inactivos
const mongoose = require('mongoose');
const Alumno = require('./models/alumnos');

async function probarEstadoAlumnos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/olimpus');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar todos los alumnos
    const alumnos = await Alumno.find({});
    
    console.log('\n=== ESTADO ACTUAL DE ALUMNOS ===');
    if (alumnos.length === 0) {
      console.log('No hay alumnos registrados');
    } else {
      alumnos.forEach((alumno, index) => {
        console.log(`${index + 1}. ${alumno.nombre}`);
        console.log(`   Matrícula: ${alumno.matricula}`);
        console.log(`   Estado: ${alumno.activo !== false ? 'ACTIVO' : 'INACTIVO'}`);
        console.log(`   Pagos realizados: ${alumno.pagos_realizados || 0}`);
        console.log('   ---');
      });
    }
    
    // Verificar que todos los alumnos tengan el campo activo
    const alumnosSinCampoActivo = alumnos.filter(a => a.activo === undefined);
    
    if (alumnosSinCampoActivo.length > 0) {
      console.log(`\n🔧 Actualizando ${alumnosSinCampoActivo.length} alumnos sin campo activo...`);
      
      for (const alumno of alumnosSinCampoActivo) {
        alumno.activo = true; // Por defecto, activo
        await alumno.save();
        console.log(`✅ ${alumno.nombre} actualizado como activo`);
      }
    } else {
      console.log('\n✅ Todos los alumnos tienen el campo activo correctamente configurado');
    }
    
    console.log('\n💡 FUNCIONALIDADES DISPONIBLES:');
    console.log('• 💤 Desactivar: El alumno no acumula deuda ni se aplican cobros');
    console.log('• ✅ Activar: Se reanuda la acumulación normal de deuda');
    console.log('• 🚫 Pagos bloqueados: No se pueden registrar pagos en alumnos inactivos');
    console.log('• 👁️  Indicador visual: Los alumnos inactivos se muestran con 💤 y texto (Inactivo)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

probarEstadoAlumnos();