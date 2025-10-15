// Script para verificar modalidades y sus grupos
const mongoose = require('mongoose');
const Modalidad = require('./models/modalidades');

async function verificarModalidades() {
  try {
    // Conectar a la base de datos
    await mongoose.connect('mongodb://localhost:27017/olimpus');
    console.log('✅ Conectado a MongoDB');
    
    // Obtener todas las modalidades
    const modalidades = await Modalidad.find();
    
    console.log('\n=== MODALIDADES EN EL SISTEMA ===');
    if (modalidades.length === 0) {
      console.log('❌ No hay modalidades en el sistema');
      console.log('🔧 Creando modalidades de ejemplo...');
      
      // Crear modalidades de ejemplo con grupos
      const modalidadesEjemplo = [
        { nombre: 'Karate', costo: 100, grupo: 'A' },
        { nombre: 'Taekwondo', costo: 120, grupo: 'B' },
        { nombre: 'Judo', costo: 110, grupo: 'C' },
        { nombre: 'Boxing', costo: 130, grupo: 'D' }
      ];
      
      for (const modalidadData of modalidadesEjemplo) {
        const modalidad = new Modalidad(modalidadData);
        await modalidad.save();
        console.log(`✅ Modalidad creada: ${modalidad.nombre} - Grupo ${modalidad.grupo}`);
      }
    } else {
      modalidades.forEach((m, index) => {
        console.log(`${index + 1}. Nombre: "${m.nombre}"`);
        console.log(`   Grupo: "${m.grupo || 'SIN GRUPO'}"`);
        console.log(`   Costo: $${m.costo}`);
        console.log(`   ID: ${m._id}`);
        console.log('   ---');
      });
      
      // Verificar cuántas tienen grupos
      const conGrupo = modalidades.filter(m => m.grupo);
      const sinGrupo = modalidades.filter(m => !m.grupo);
      
      console.log(`\n📊 RESUMEN:`);
      console.log(`   Total modalidades: ${modalidades.length}`);
      console.log(`   Con grupo: ${conGrupo.length}`);
      console.log(`   Sin grupo: ${sinGrupo.length}`);
      
      if (sinGrupo.length > 0) {
        console.log('\n🔧 Asignando grupos a modalidades sin grupo...');
        const letrasDisponibles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const gruposUsados = conGrupo.map(m => m.grupo);
        
        let letraIndex = 0;
        for (const modalidad of sinGrupo) {
          // Buscar siguiente letra disponible
          while (gruposUsados.includes(letrasDisponibles[letraIndex])) {
            letraIndex++;
          }
          
          modalidad.grupo = letrasDisponibles[letraIndex];
          await modalidad.save();
          console.log(`✅ Grupo "${letrasDisponibles[letraIndex]}" asignado a "${modalidad.nombre}"`);
          
          gruposUsados.push(letrasDisponibles[letraIndex]);
          letraIndex++;
        }
      }
    }
    
    // Mostrar mapeo final
    const modalidadesActualizadas = await Modalidad.find();
    console.log('\n=== MAPEO GRUPO -> MODALIDAD ===');
    modalidadesActualizadas.forEach(m => {
      if (m.grupo) {
        console.log(`${m.grupo} -> ${m.nombre} ($${m.costo})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

verificarModalidades();