// =================================================================
// SERVIDOR PRINCIPAL - OLIMPUS GYMNASTICS SISTEMA DE REGISTROS
// =================================================================
// Este archivo configura el servidor backend para el sistema de gestión
// de alumnos del gimnasio Olimpus. Maneja conexiones a MongoDB Atlas,
// configuración de CORS para el frontend React, y rutas principales.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// === IMPORTACIÓN DE RUTAS ===
// Las rutas están organizadas por funcionalidad:
// - modalidadesRoutes: Gestión de clases/modalidades y pagos
// - alumnosRoutes: CRUD de alumnos y cálculos de deudas
// - excelRoutes: Importación y exportación de datos Excel
// - entrenadorRoutes: Gestión de entrenadores
// - reportesRoutes: Envío automático de reportes por correo
const modalidadesRoutes = require('./routes/modalidadesRoutes'); 
const alumnosRoutes = require('./routes/alumnoRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const excelRoutes = require('./routes/excelRoutes');
const entrenadorRoutes = require('./routes/entrenadorRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

// === IMPORTACIÓN DE MODELOS ===
const Alumno = require('./models/alumnos'); // Modelo principal de estudiantes

// === IMPORTACIÓN DE UTILIDADES ===
const { iniciarTareasProgramadas } = require('./utils/cronJobs');

require('dotenv').config(); // Variables de entorno (MongoDB, Stripe, etc.)

// === CONFIGURACIÓN DE APLICACIÓN EXPRESS ===
const app = express();

// === MIDDLEWARE CONFIGURATION ===
app.use(cors()); // Permite peticiones desde el frontend React (localhost:3000)
app.use(express.json()); // Parser para JSON en requests

// === RUTAS DE API ===
// IMPORTANTE: Todas las rutas de modalidades incluyen también funciones de pago
app.use('/api/modalidad', modalidadesRoutes); // Gestión de clases y pagos
app.use('/api/alumnos', alumnosRoutes); // Gestión de estudiantes
app.use('/api/configuracion', configuracionRoutes); // Configuración del sistema
app.use('/api/excel', excelRoutes); // Importación/exportación Excel
app.use('/api/entrenadores', entrenadorRoutes); // Gestión de entrenadores
app.use('/api/reportes', reportesRoutes); // Reportes automáticos por correo

// === CONEXIÓN A BASE DE DATOS ===
// MongoDB Atlas - Base de datos en la nube
// NOTA PARA IA: Esta conexión está hardcodeada, considerar mover a variables de entorno
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  // Iniciar tareas programadas después de conectar a la base de datos
  iniciarTareasProgramadas();
}).catch(error => {
  console.error('❌ Error al conectar a MongoDB:', error);
});

// Puerto
const PORT = process.env.PORT || 7000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

