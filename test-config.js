// Test script para verificar la configuración
require('dotenv').config({ path: './Backend/.env' });
const mongoose = require('mongoose');
const ConfiguracionSistema = require('./Backend/models/configuracion');

async function testConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');
    
    // Obtener configuración actual
    const config = await ConfiguracionSistema.obtenerConfiguracion();
    console.log('Configuración actual:', JSON.stringify(config, null, 2));
    
    // Si no tiene emailReportes, agregarlo
    if (!config.emailReportes) {
      config.emailReportes = '';
      await config.save();
      console.log('Campo emailReportes agregado');
    }
    
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testConfig();