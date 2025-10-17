// filepath: c:\Users\Stefano\Documents\OLYMPUS\sistema_registros\frontend\src\App.js
// =================================================================
// APLICACIÓN PRINCIPAL - FRONTEND REACT
// =================================================================
// Punto de entrada de la aplicación React para el sistema de registro
// de alumnos de Olimpus Gymnastics. Configura las rutas principales.

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// === IMPORTACIÓN DE COMPONENTES PRINCIPALES ===
import PantallaInicio from './components/Pantalla_inicio'; // Dashboard principal
import Alumnos from './components/Alumnos'; // Lista y gestión de alumnos registrados
import Registrar_Alumno from './components/Registrar_Alumno'; // Formulario de nuevo registro
import Modalidades from './components/Modalidades.js'; // Gestión de clases/modalidades
import ConfiguracionSistema from './components/ConfiguracionSistema'; // Configuración del sistema
import RegistrarGastos from './components/RegistrarGastos'; // Formulario de registro de gastos

// === IMPORTACIÓN DE ESTILOS ===
import './App.css'; // Estilos globales
import './components/Alumnos.css'; // Estilos de lista de alumnos
import './components/Pantalla_inicio.css'; // Estilos del dashboard
import './components/Registrar_Alumno.css'; // Estilos del formulario de registro


function App() {
    return (
        <>
            <Router>
                {/* === CONFIGURACIÓN DE RUTAS === */}
                {/* IMPORTANTE: Todas las rutas usan React Router v6 con element prop */}
                <Routes>
                    {/* Dashboard principal con navegación a todas las funciones */}
                    <Route path="/" element={<PantallaInicio />} />
                    
                    {/* Gestión de alumnos - Lista completa con búsqueda y pagos */}
                    <Route path="/alumnos" element={<Alumnos />} />
                    
                    {/* Formulario de registro de nuevos estudiantes */}
                    <Route path="/alumnos/nuevo" element={<Registrar_Alumno />} />
                    
                    {/* Gestión de modalidades/clases del gimnasio */}
                    <Route path="/modalidades" element={<Modalidades />} />
                    
                    {/* Configuración del sistema - Fechas de pago y recargos */}
                    <Route path="/configuracion" element={<ConfiguracionSistema />} />
                    
                    {/* Formulario de registro de gastos */}
                    <Route path="/registrar-gastos" element={<RegistrarGastos />} />
                    
                    {/* NOTA PARA IA: Rutas futuras pueden incluir:
                        - /reportes (reportes detallados)
                        - /promociones (gestión de ofertas)
                    */}
                </Routes>
            </Router>
        </>
    );
}

export default App;