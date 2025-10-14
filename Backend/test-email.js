// =================================================================
// SCRIPT DE PRUEBA PARA REPORTES AUTOMÁTICOS
// =================================================================
// Este archivo permite probar el sistema de correos sin activar el cron

require('dotenv').config();
const mongoose = require('mongoose');
const { enviarReporteManual, obtenerCorteDelDia } = require('./utils/reporteService');
const { verificarConfiguracionCorreo } = require('./utils/emailService');

console.log('🧪 === PRUEBA DEL SISTEMA DE REPORTES ===\n');

async function conectarMongoDB() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect('mongodb+srv://Stefano117:Mixbox360@cluster0.qgw2j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Conectado a MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    return false;
  }
}

async function probarSistema() {
  try {
    // Paso 0: Conectar a MongoDB
    console.log('🔌 Paso 0: Conectando a base de datos...');
    const dbConectada = await conectarMongoDB();
    if (!dbConectada) {
      console.log('❌ No se pudo conectar a MongoDB. Abortando prueba.');
      return;
    }
    console.log('');
    
    console.log('📋 Paso 1: Verificando configuración...');
    const configValida = verificarConfiguracionCorreo();
    
    if (!configValida) {
      console.log('❌ Configuración inválida. Verifica:');
      console.log('   - EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ Faltante');
      console.log('   - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Configurado' : '❌ Faltante');
      console.log('   - EMAIL_DESTINATARIO:', process.env.EMAIL_DESTINATARIO ? '✅ Configurado' : '❌ Faltante');
      return;
    }
    
    console.log('✅ Configuración válida');
    console.log('📧 Desde:', process.env.EMAIL_USER);
    console.log('📨 Hacia:', process.env.EMAIL_DESTINATARIO);
    console.log('');
    
    console.log('📊 Paso 2: Obteniendo datos del corte de hoy...');
    const corte = await obtenerCorteDelDia();
    console.log(`💰 Total del día: $${corte.totalPagado.toFixed(2)}`);
    console.log(`📋 Pagos registrados: ${corte.pagos.length}`);
    console.log('');
    
    console.log('📧 Paso 3: Enviando reporte de prueba...');
    console.log('⏳ Esto puede tomar 30-60 segundos...\n');
    
    const resultado = await enviarReporteManual();
    
    if (resultado.success) {
      console.log('🎉 ¡ÉXITO! Reporte enviado correctamente');
      console.log('📧 ID del mensaje:', resultado.datos.messageId);
      console.log('💰 Total enviado:', `$${resultado.datos.totalPagado}`);
      console.log('📋 Pagos incluidos:', resultado.datos.cantidadPagos);
      console.log('');
      console.log('📬 Revisa tu bandeja de entrada en:', process.env.EMAIL_DESTINATARIO);
      console.log('📁 Si no lo ves, revisa la carpeta de SPAM');
    } else {
      console.log('❌ Error al enviar reporte:');
      console.log('   Mensaje:', resultado.error);
      console.log('');
      console.log('🔍 Posibles causas:');
      console.log('   1. Contraseña de aplicación incorrecta');
      console.log('   2. EMAIL_USER no es válido');
      console.log('   3. Verificación en 2 pasos no activada en Gmail');
      console.log('   4. Problema de conectividad');
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    console.log('');
    console.log('🔧 Pasos para solucionar:');
    console.log('   1. Verificar conexión a internet');
    console.log('   2. Confirmar que MongoDB esté conectado');
    console.log('   3. Revisar que todas las dependencias estén instaladas');
  }
}

// Ejecutar la prueba
probarSistema().then(() => {
  console.log('\n🏁 Prueba completada');
  mongoose.connection.close();
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  mongoose.connection.close();
  process.exit(1);
});