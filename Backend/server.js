const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const modalidadesRoutes = require('./routes/modalidadesRoutes'); 
const alumnosRoutes = require('./routes/alumnoRoutes');  // Asegúrate de importar las rutas de alumnos
const Alumno = require('./models/alumnos');  // Asegúrate de importar el modelo de alumnos
const cron = require('node-cron');

require('dotenv').config();

// Crear instancia de la aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/modalidad', modalidadesRoutes);  // Usa las rutas de autenticación
app.use('/api/alumnos', alumnosRoutes);  // Usa las rutas de alumnos

// Conexión a MongoDB
mongoose.connect('mongodb+srv://Stefano117:Mixbox360@cluster0.qgw2j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
}).then(() => {
  console.log('Conectado a MongoDB');

}).catch(error => {
  console.error('Error al conectar a MongoDB:', error);
});

// Puerto
const PORT = process.env.PORT || 7000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

