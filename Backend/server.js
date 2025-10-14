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
const modalidadesRoutes = require('./routes/modalidadesRoutes'); 
const alumnosRoutes = require('./routes/alumnoRoutes');

// === IMPORTACIÓN DE MODELOS ===
const Alumno = require('./models/alumnos'); // Modelo principal de estudiantes
const cron = require('node-cron'); // Para tareas programadas futuras

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

// === CONEXIÓN A BASE DE DATOS ===
// MongoDB Atlas - Base de datos en la nube
// NOTA PARA IA: Esta conexión está hardcodeada, considerar mover a variables de entorno
mongoose.connect('mongodb+srv://Stefano117:Mixbox360@cluster0.qgw2j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
}).then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
}).catch(error => {
  console.error('❌ Error al conectar a MongoDB:', error);
});

// Puerto
const PORT = process.env.PORT || 7000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

