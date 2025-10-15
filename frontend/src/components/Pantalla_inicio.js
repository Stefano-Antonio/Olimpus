import React, { useState, useEffect } from 'react';
import './Pantalla_inicio.css'; // Importa el CSS
import Pilares from '../assest/pilar_olimpus.jpg';
import logo from '../assest/logo_olimpus.jpg';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const PantallaInicio = () => {
        const navigate = useNavigate();
        const [configuracionCorreo, setConfiguracionCorreo] = useState(null);
        const [enviandoReporte, setEnviandoReporte] = useState(false);

        useEffect(() => {
            verificarConfiguracionCorreo();
        }, []);

        const verificarConfiguracionCorreo = async () => {
            try {
                const response = await axios.get('http://localhost:7000/api/reportes/verificar-configuracion');
                setConfiguracionCorreo(response.data);
            } catch (error) {
                console.error('Error al verificar configuración:', error);
                setConfiguracionCorreo({ configuracionValida: false, message: 'Error de conexión' });
            }
        };

        const enviarReporteManual = async () => {
            if (enviandoReporte) return;
            
            try {
                setEnviandoReporte(true);
                toast.info('📧 Generando y enviando reporte...', { autoClose: 2000 });
                
                const response = await axios.post('http://localhost:7000/api/reportes/enviar-manual');
                
                if (response.data.success) {
                    toast.success(`✅ Reporte enviado exitosamente! Total del día: $${response.data.datos.totalPagado}`, {
                        autoClose: 5000
                    });
                } else {
                    toast.error(`❌ Error: ${response.data.message}`);
                }
            } catch (error) {
                console.error('Error al enviar reporte:', error);
                toast.error('❌ Error al enviar reporte. Verifica la configuración del servidor.');
            } finally {
                setEnviandoReporte(false);
            }
        };

        return (
            <div className="pantalla-inicio">
            <ToastContainer position="top-right" autoClose={3000} />
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
                    Modalidades
                    </button>
                    <button onClick={() => navigate('/configuracion')} className="boton boton-config">
                    ⚙️ Configuración del Sistema
                    </button>
                    
                    {/* Nueva sección de reportes automáticos */}
                    <div className="seccion-reportes">
                        <h3 className="titulo-reportes">📧 Reportes Automáticos</h3>
                        <div className="info-reportes">
                            <p>🕐 <strong>Envío automático:</strong> Todos los días a las 8:30 PM</p>
                            <p>📋 <strong>Incluye:</strong> Base de alumnos (Excel) + Corte del día (PDF)</p>
                            
                            {configuracionCorreo && (
                                <div className={`estado-config ${configuracionCorreo.configuracionValida ? 'valida' : 'invalida'}`}>
                                    <span className="icono-estado">
                                        {configuracionCorreo.configuracionValida ? '✅' : '⚠️'}
                                    </span>
                                    <span className="mensaje-estado">
                                        {configuracionCorreo.message}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={enviarReporteManual}
                            disabled={enviandoReporte || !configuracionCorreo?.configuracionValida}
                            className={`boton boton-reporte ${!configuracionCorreo?.configuracionValida ? 'deshabilitado' : ''}`}
                        >
                            {enviandoReporte ? '⏳ Enviando...' : '📤 Enviar Reporte Ahora'}
                        </button>
                        
                        {!configuracionCorreo?.configuracionValida && (
                            <p className="advertencia-config">
                                ⚠️ Para usar esta función, configura EMAIL_USER y EMAIL_PASSWORD en el servidor
                            </p>
                        )}
                    </div>
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
