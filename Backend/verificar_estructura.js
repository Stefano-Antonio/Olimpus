// Script para verificar la estructura de datos de las modalidades
const mongoose = require('mongoose');
const Modalidad = require('./models/modalidades');

async function verificarEstructuraDatos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/olimpus');
    console.log('✅ Conectado a MongoDB');
    
    const modalidades = await Modalidad.find();
    
    console.log('\n=== ESTRUCTURA COMPLETA DE MODALIDADES ===');
    modalidades.forEach((modalidad, index) => {
      console.log(`\n${index + 1}. MODALIDAD COMPLETA:`);
      console.log(JSON.stringify(modalidad.toObject(), null, 2));
      console.log('---');
    });
    
    console.log('\n=== VERIFICACIÓN DE CAMPOS GRUPO ===');
    modalidades.forEach((modalidad) => {
      console.log(`Modalidad: ${modalidad.nombre}`);
      console.log(`  - grupo (valor): "${modalidad.grupo}"`);
      console.log(`  - grupo (tipo): ${typeof modalidad.grupo}`);
      console.log(`  - grupo (existe): ${modalidad.grupo !== undefined && modalidad.grupo !== null}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verificarEstructuraDatos();