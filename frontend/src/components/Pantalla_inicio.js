import React from 'react';
import './Pantalla_inicio.css'; // Importa el CSS
import Pilares from '../assest/pilar_olimpus.jpg';
import logo from '../assest/logo_olimpus.jpg';
import { useNavigate } from 'react-router-dom';

const PantallaInicio = () => {
        const navigate = useNavigate();

        return (
            <div className="pantalla-inicio">
            <img src={logo} alt="Logo" className="logo" />

            <div className="contenido-principal">
                <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />

                <div className="info-centro">
                <h1>OLIMPUS GYMNASTICS</h1>
                <p>Sistema de registros</p>



                <div className="botones">
                    <button onClick={() => navigate('/alumnos/nuevo')} className="boton">
                    Registrar Alumno
                    </button>
                    <button onClick={() => navigate('/alumnos')} className="boton">
                    Alumnos Registrados y Pagos
                    </button>
                    <button onClick={() => navigate('/modalidades')} className="boton">
                    Agregar Modalidades
                    </button>
                    <button onClick={() => navigate('/configuracion')} className="boton boton-config">
                    ⚙️ Configuración del Sistema
                    </button>
                </div>

                <div className="contacto">
                    <p>Contacto: <strong>492 125 3088</strong></p>
                    <p>Blvr. Revolución Mexicana #225, Guadalupe, Zacatecas</p>
                </div>
                </div>

                <img src={Pilares} alt="Pilar Derecho" className="pilar" />
            </div>
            </div>
        );
    };


export default PantallaInicio;
