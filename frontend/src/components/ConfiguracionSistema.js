import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './ConfiguracionSistema.css';
import Pilares from '../assest/pilar_olimpus.jpg';

const ConfiguracionSistema = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configuracion, setConfiguracion] = useState({
    fechaCobroMensual: 5,
    costoInscripcion: 0,
    diasGraciaParaPago: 5,
    montoRecargoTardio: 50,
    tipoRecargo: 'fijo'
  });

  // Estados para gestión de entrenadores
  const [entrenadores, setEntrenadores] = useState([]);
  const [nuevoEntrenador, setNuevoEntrenador] = useState('');
  const [editandoEntrenador, setEditandoEntrenador] = useState(null);
  const [nombreEditando, setNombreEditando] = useState('');

  useEffect(() => {
    cargarConfiguracion();
    cargarEntrenadores();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/configuracion');
      setConfiguracion(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
      setLoading(false);
    }
  };

  const cargarEntrenadores = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/entrenadores');
      setEntrenadores(response.data);
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
      toast.error('Error al cargar entrenadores');
    }
  };

  const crearEntrenador = async (e) => {
    e.preventDefault();
    if (!nuevoEntrenador.trim()) {
      toast.error('El nombre del entrenador es obligatorio');
      return;
    }

    try {
      await axios.post('http://localhost:7000/api/entrenadores', {
        nombre: nuevoEntrenador.trim()
      });
      
      setNuevoEntrenador('');
      await cargarEntrenadores();
      toast.success('Entrenador creado exitosamente');
    } catch (error) {
      console.error('Error al crear entrenador:', error);
      toast.error(error.response?.data?.message || 'Error al crear entrenador');
    }
  };

  const actualizarEntrenador = async (e) => {
    e.preventDefault();
    if (!nombreEditando.trim()) {
      toast.error('El nombre del entrenador es obligatorio');
      return;
    }

    try {
      await axios.put(`http://localhost:7000/api/entrenadores/${editandoEntrenador}`, {
        nombre: nombreEditando.trim()
      });
      
      setEditandoEntrenador(null);
      setNombreEditando('');
      await cargarEntrenadores();
      toast.success('Entrenador actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar entrenador:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar entrenador');
    }
  };

  const eliminarEntrenador = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar al entrenador "${nombre}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:7000/api/entrenadores/${id}`);
      await cargarEntrenadores();
      toast.success('Entrenador eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar entrenador:', error);
      toast.error('Error al eliminar entrenador');
    }
  };

  const iniciarEdicion = (entrenador) => {
    setEditandoEntrenador(entrenador._id);
    setNombreEditando(entrenador.nombre);
  };

  const cancelarEdicion = () => {
    setEditandoEntrenador(null);
    setNombreEditando('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfiguracion(prev => ({
      ...prev,
      [name]: name === 'tipoRecargo' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (configuracion.fechaCobroMensual < 1 || configuracion.fechaCobroMensual > 31) {
      toast.error('La fecha de cobro debe estar entre 1 y 31');
      return;
    }
    
    if (configuracion.diasGraciaParaPago < 0) {
      toast.error('Los días de gracia no pueden ser negativos');
      return;
    }
    
    if (configuracion.costoInscripcion < 0) {
      toast.error('El costo de inscripción no puede ser negativo');
      return;
    }
    
    if (configuracion.montoRecargoTardio < 0) {
      toast.error('El monto de recargo no puede ser negativo');
      return;
    }
    
    try {
      await axios.put('http://localhost:7000/api/configuracion', configuracion);
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      toast.error('Error al actualizar la configuración');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Cargando configuración...</div>;
  }

  return (
    <div className="configuracion-layout">
      <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="configuracion-container">
        <div className="top-left">
          <button className="back-button" onClick={handleBack}>Regresar</button>
        </div>
        
        <h1>⚙️ Configuración del Sistema</h1>
        
        <form onSubmit={handleSubmit} className="configuracion-form">
          {/* Configuración de Costos */}
          <div className="config-section">
            <h2>💰 Configuración de Costos</h2>
            
            <div className="form-group">
              <label htmlFor="costoInscripcion">
                Costo de Inscripción (S/.):
              </label>
              <input
                type="number"
                id="costoInscripcion"
                name="costoInscripcion"
                value={configuracion.costoInscripcion}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              <p className="help-text">
                Este monto se cobrará una sola vez al momento de la inscripción de nuevos alumnos
              </p>
            </div>
          </div>

          {/* Fecha de Cobro Mensual */}
          <div className="config-section">
            <h2>📅 Fecha de Cobro Mensual</h2>
            <div className="form-group">
              <label htmlFor="fechaCobroMensual">
                Día del mes para cobro (1-31):
              </label>
              <input
                type="number"
                id="fechaCobroMensual"
                name="fechaCobroMensual"
                value={configuracion.fechaCobroMensual}
                onChange={handleChange}
                min="1"
                max="31"
                required
              />
              <p className="help-text">
                Los pagos se cobrarán automáticamente el día {configuracion.fechaCobroMensual} de cada mes
              </p>
            </div>
          </div>

          {/* Sistema de Recargos */}
          <div className="config-section">
            <h2>💰 Sistema de Recargos por Pago Tardío</h2>
            
            <div className="form-group">
              <label htmlFor="diasGraciaParaPago">
                Días de gracia después de la fecha de cobro:
              </label>
              <input
                type="number"
                id="diasGraciaParaPago"
                name="diasGraciaParaPago"
                value={configuracion.diasGraciaParaPago}
                onChange={handleChange}
                min="0"
                required
              />
              <p className="help-text">
                El recargo se aplicará {configuracion.diasGraciaParaPago} días después de la fecha de cobro
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="tipoRecargo">
                Tipo de recargo:
              </label>
              <select
                id="tipoRecargo"
                name="tipoRecargo"
                value={configuracion.tipoRecargo}
                onChange={handleChange}
                required
              >
                <option value="fijo">Monto Fijo (MXN)</option>
                <option value="porcentaje">Porcentaje (%)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="montoRecargoTardio">
                {configuracion.tipoRecargo === 'fijo' ? 'Monto del recargo (MXN):' : 'Porcentaje del recargo (%):'}
              </label>
              <input
                type="number"
                id="montoRecargoTardio"
                name="montoRecargoTardio"
                value={configuracion.montoRecargoTardio}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <p className="help-text">
                {configuracion.tipoRecargo === 'fijo' 
                  ? `Se cobrará un recargo fijo de $${configuracion.montoRecargoTardio} MXN`
                  : `Se cobrará un recargo del ${configuracion.montoRecargoTardio}% del costo de la modalidad`
                }
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-guardar">
              Guardar Configuración
            </button>
            <button type="button" onClick={handleBack} className="btn-cancelar">
              Cancelar
            </button>
          </div>
        </form>

        {/* Sección de Entrenadores */}
        <div className="config-section">
          <h2>👨‍🏫 Gestión de Entrenadores</h2>
          
          {/* Crear nuevo entrenador */}
          <form onSubmit={crearEntrenador} className="entrenador-form">
            <div className="form-group-inline">
              <input
                type="text"
                value={nuevoEntrenador}
                onChange={(e) => setNuevoEntrenador(e.target.value)}
                placeholder="Nombre del nuevo entrenador"
                className="entrenador-input"
              />
              <button type="submit" className="btn-agregar">
                ➕ Agregar
              </button>
            </div>
          </form>

          {/* Lista de entrenadores */}
          <div className="entrenadores-lista">
            <h3>Entrenadores Registrados:</h3>
            {entrenadores.length === 0 ? (
              <p className="no-entrenadores">No hay entrenadores registrados</p>
            ) : (
              <div className="entrenadores-grid">
                {entrenadores.map((entrenador) => (
                  <div key={entrenador._id} className="entrenador-item">
                    {editandoEntrenador === entrenador._id ? (
                      <form onSubmit={actualizarEntrenador} className="editar-form">
                        <input
                          type="text"
                          value={nombreEditando}
                          onChange={(e) => setNombreEditando(e.target.value)}
                          className="editar-input"
                          autoFocus
                        />
                        <div className="editar-acciones">
                          <button type="submit" className="btn-guardar-mini">
                            ✓
                          </button>
                          <button type="button" onClick={cancelarEdicion} className="btn-cancelar-mini">
                            ✕
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="entrenador-nombre">{entrenador.nombre}</span>
                        <div className="entrenador-acciones">
                          <button 
                            onClick={() => iniciarEdicion(entrenador)}
                            className="btn-editar"
                            title="Editar entrenador"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => eliminarEntrenador(entrenador._id, entrenador.nombre)}
                            className="btn-eliminar"
                            title="Eliminar entrenador"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="config-info">
          <h3>ℹ️ Información Importante</h3>
          <ul>
            <li>Los cambios en la configuración aplicarán para futuros cálculos de pagos</li>
            <li>Los recargos se aplican automáticamente todos los días a las 5:00 PM</li>
            <li>Los alumnos con pagos atrasados recibirán recargos solo una vez por mes</li>
            <li>Puedes revisar los recargos aplicados en la sección de alumnos</li>
          </ul>
        </div>
      </div>

      <img src={Pilares} alt="Pilar Derecho" className="pilar" />
    </div>
  );
};

export default ConfiguracionSistema;
