// filepath: c:\Users\Stefano\Documents\OLYMPUS\sistema_registros\frontend\src\App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PantallaInicio from './components/Pantalla_inicio';
import Alumnos from './components/Alumnos'; // Asegúrate de que la ruta sea correcta
import './App.css'; // Importa el CSS global
import Registrar_Alumno from './components/Registrar_Alumno'; // Asegúrate de que la ruta sea correcta
import './components/Alumnos.css'; // Importa el CSS específico de Alumnos
import './components/Pantalla_inicio.css'; // Importa el CSS específico de Pantalla Inicio
import './components/Registrar_Alumno.css'; // Importa el CSS específico de Registrar Alumno
import  Modalidades from './components/Modalidades.js'; // Importa el CSS específico de Registrar Alumno


function App() {
    return (
        <>
                <Router>
                    <Routes>
                        <Route path="/" element={<PantallaInicio />} />
                        <Route path="/alumnos" element={<Alumnos />} />
                        <Route path="/alumnos/nuevo" element={<Registrar_Alumno />} /> {/* Cambia esto por el componente de registro de alumnos */}
                        <Route path="/modalidades" element={<Modalidades />} /> {/* Cambia esto por el componente de modalidades */}
                        {/* Agrega otras rutas aquí si es necesario */}
                    </Routes>
                </Router>
        </>
    );
}

export default App;