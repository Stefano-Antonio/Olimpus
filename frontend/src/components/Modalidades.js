import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Modalidades.css";
import Pilares from '../assest/pilar_olimpus.jpg';

function Modalidades() {
  const navigate = useNavigate();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [file, setFile] = useState(null); // Almacenar el archivo CSV
  const id_carrera = localStorage.getItem("id_carrera");
  const [formData, setFormData] = useState({
    nombre: '',
    horarios: {
      lunes: '',
      martes: '',
      miercoles: '',
      jueves: '',
      viernes: '',
      sabado: ''
    },
    costo: '',
    id_entrenador: ''
  });

  // Estado para entrenadores y modalidades
  const [entrenadores, setEntrenadores] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [editandoModalidad, setEditandoModalidad] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // Estados para mostrar/ocultar secciones - solo una puede estar expandida
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  
  // Función para alternar formulario
  const toggleFormulario = () => {
    if (!mostrarFormulario && mostrarTabla) {
      setMostrarTabla(false);
    }
    setMostrarFormulario(!mostrarFormulario);
  };
  
  // Función para alternar tabla
  const toggleTabla = () => {
    if (!mostrarTabla && mostrarFormulario) {
      setMostrarFormulario(false);
    }
    setMostrarTabla(!mostrarTabla);
  };

  useEffect(() => {
    cargarEntrenadores();
    cargarModalidades();
  }, []);

  const cargarEntrenadores = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/entrenadores');
      setEntrenadores(response.data);
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
      toast.error('Error al cargar entrenadores');
    }
  };

  const cargarModalidades = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/modalidad');
      console.log('Modalidades cargadas:', response.data);
      setModalidades(response.data);
    } catch (error) {
      console.error('Error al cargar modalidades:', error);
      toast.error('Error al cargar modalidades');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userType");
    navigate("/");
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    if (["lunes", "martes", "miercoles", "jueves", "viernes","sabado"].includes(id)) {
      // Si el cambio es en los horarios, actualiza solo esa clave dentro de horarios
      setFormData((prevState) => ({
        ...prevState,
        horarios: {
          ...prevState.horarios,
          [id]: value, // Actualiza el día correspondiente
        },
      }));
    } else {
      // Si es otro campo, actualiza normalmente
      setFormData((prevState) => ({
        ...prevState,
        [id]: value,
      }));
    }
  };

  const handleBack = () => {
    navigate(-1); // Navegar a la página anterior
  };

  const editarModalidad = (modalidad) => {
    console.log('Editando modalidad:', modalidad);
    
    // Parsear los horarios del string guardado (ej: "L-Mi-V:16:00-17:00")
    const horariosReconstruidos = {
      lunes: '',
      martes: '',
      miercoles: '',
      jueves: '',
      viernes: '',
      sabado: ''
    };

    // Si hay horarios guardados, intentar parsearlos
    if (modalidad.horarios && typeof modalidad.horarios === 'string') {
      // Ejemplo de formato esperado: "L-Mi-V:16:00-17:00" o "M-J:18:00-19:00"
      // Por ahora los dejamos vacíos ya que el formato exacto puede variar
      // Se pueden llenar manualmente en el formulario
    }

    setFormData({
      nombre: modalidad.nombre,
      horarios: horariosReconstruidos,
      costo: modalidad.costo.toString(),
      id_entrenador: modalidad.id_entrenador || ''
    });
    
    setEditandoModalidad(modalidad._id);
    setModoEdicion(true);
    
    // Asegurarse de que el formulario esté visible
    if (!mostrarFormulario) {
      setMostrarFormulario(true);
    }
    // Ocultar la tabla para dar más espacio al formulario
    if (mostrarTabla) {
      setMostrarTabla(false);
    }
    
    // Scroll hacia el formulario después de que se renderice
    setTimeout(() => {
      const form = document.querySelector('.centered-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const cancelarEdicion = () => {
    setFormData({
      nombre: '',
      horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
      costo: '',
      id_entrenador: ''
    });
    setEditandoModalidad(null);
    setModoEdicion(false);
    
    // Opcional: volver a mostrar la tabla después de cancelar
    if (!mostrarTabla) {
      setMostrarTabla(true);
    }
  };

  const eliminarModalidad = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar la modalidad "${nombre}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:7000/api/modalidad/${id}`);
      await cargarModalidades();
      toast.success('Modalidad eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar modalidad:', error);
      toast.error('Error al eliminar modalidad');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Reemplaza valores vacíos en horarios con null y maneja entrenador
      const finalData = {
        ...formData,
        horarios: Object.fromEntries(
          Object.entries(formData.horarios).map(([key, value]) => [key, value === "" ? null : value])
        ),
        id_entrenador: formData.id_entrenador || null
      };

      if (modoEdicion) {
        // Actualizar modalidad existente
        const response = await axios.put(`http://localhost:7000/api/modalidad/${editandoModalidad}`, finalData);
        console.log("Modalidad actualizada:", response.data);
        toast.success('Modalidad actualizada con éxito');
        cancelarEdicion();
        // Mostrar la tabla para ver los cambios
        if (!mostrarTabla) {
          setMostrarTabla(true);
        }
      } else {
        // Crear nueva modalidad
        const response = await axios.post('http://localhost:7000/api/modalidad', finalData);
        console.log("Modalidad creada:", response.data);
        toast.success('Modalidad creada con éxito');
        setFormData({
          nombre: '',
          horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
          costo: '',
          id_entrenador: ''
        });
      }
      
      await cargarModalidades(); // Recargar la lista
    } catch (error) {
      console.error('Error al procesar la modalidad:', error);
      toast.error(modoEdicion ? 'Error al actualizar modalidad' : 'Error al crear modalidad');
    }
  };
    
return (
  <div className="materia-layout">
    <div className="materia-container">
      <div className="top-left">
        <button className="back-button" onClick={handleBack}>Regresar</button>
      </div>
      
      {/* Sección del Formulario con botón de minimizar */}
      <div className="seccion-header">
        <h1>{modoEdicion ? 'Editar Modalidad' : 'Agregar Modalidad'}</h1>
        <button 
          className="toggle-button" 
          onClick={toggleFormulario}
          title={mostrarFormulario ? "Ocultar formulario" : "Mostrar formulario"}
        >
          {mostrarFormulario ? '🔼 Minimizar' : '🔽 Expandir'}
        </button>
      </div>
      
      {mostrarFormulario && (
        <div className="materia-content">
          {modoEdicion && (
            <div className="modo-edicion-banner">
              <span>📝 Editando modalidad</span>
              <button 
                type="button" 
                onClick={cancelarEdicion} 
                className="btn-cancelar-rapido"
                title="Cancelar edición"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="centered-form">
          <div className="form-group">
            <div className="input-wrapper short-field">
              <label htmlFor="nombre">Nombre</label>
              <select id="nombre" value={formData.nombre} onChange={handleChange} required>
                <option value="" disabled hidden>Seleccione...</option>
                <option value="Gimnasia Femenil">Gimnasia Femenil</option>
                <option value="Parkour">Parkour</option>
                <option value="Baby Gym">Baby Gym</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="input-wrapper short-field">
              <label htmlFor="costo">Costo (MXN)</label>
              <input
                type="number"
                id="costo"
                value={formData.costo}
                onChange={handleChange}
                placeholder="Ingrese el costo en pesos"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="form-group">
            <div className="input-wrapper short-field">
              <label htmlFor="id_entrenador">Entrenador</label>
              <select 
                id="id_entrenador" 
                value={formData.id_entrenador} 
                onChange={handleChange}
              >
                <option value="">Sin entrenador asignado</option>
                {entrenadores.map((entrenador) => (
                  <option key={entrenador._id} value={entrenador._id}>
                    {entrenador.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"].map((dia) => (
              <div key={dia} className="input-wrapper short-field">
                <label htmlFor={dia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</label>
                <select id={dia} value={formData.horarios[dia]} onChange={handleChange}>
                  <option value="" disabled hidden>Seleccione...</option>
                  <option value="">-</option>
                  {dia === "sabado" ? (
                    <>
                      <option value="10:00-11:00">10:00am-11:00am</option>
                      <option value="11:00-12:00">11:00am-12:00pm</option>
                      <option value="11:00-12:00">10:00am-12:00pm</option>
                    </>
                  ) : (
                    <>
                      <option value="16:00-17:00">4:00pm-5:00pm</option>
                      <option value="16:00-18:00">4:00pm-6:00pm</option>
                      <option value="17:00-18:00">5:00pm-6:00pm</option>
                      <option value="17:00-19:00">5:00pm-7:00pm</option>
                      <option value="18:00-19:00">6:00pm-7:00pm</option>
                      <option value="18:00-20:00">6:00pm-8:00pm</option>
                      <option value="19:00-20:00">7:00pm-8:00pm</option>
                    </>
                  )}
                </select>
              </div>
            ))}
          </div>
          <div className="materia-buttons">
            <button type="submit" className="button">
              {modoEdicion ? 'Actualizar' : 'Agregar'}
            </button>
            {modoEdicion && (
              <button type="button" onClick={cancelarEdicion} className="button button-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* Tabla de modalidades existentes con botón de minimizar */}
      <div className="seccion-header">
        <h2>Modalidades Existentes ({modalidades.length})</h2>
        <button 
          className="toggle-button" 
          onClick={toggleTabla}
          title={mostrarTabla ? "Ocultar tabla" : "Mostrar tabla"}
        >
          {mostrarTabla ? '🔼 Minimizar' : '🔽 Expandir'}
        </button>
      </div>
      
      <div className={`modalidades-existentes ${mostrarTabla ? 'visible' : 'hidden'}`}>
        {console.log('Estado actual de modalidades:', modalidades)}
        {modalidades.length === 0 ? (
          <p className="no-modalidades">No hay modalidades registradas</p>
        ) : (
          <div className="table-container">
            <table className="modalidades-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Horarios</th>
                  <th>Costo</th>
                  <th>Entrenador</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modalidades.map((modalidad) => (
                  <tr key={modalidad._id}>
                    <td>{modalidad.nombre}</td>
                    <td>{modalidad.horarios}</td>
                    <td>${modalidad.costo}</td>
                    <td>
                      <select
                        value={modalidad.id_entrenador || ''}
                        onChange={async (e) => {
                          try {
                            const nuevoEntrenadorId = e.target.value || null;
                            await axios.put(`http://localhost:7000/api/modalidad/${modalidad._id}`, {
                              ...modalidad,
                              id_entrenador: nuevoEntrenadorId
                            });
                            await cargarModalidades();
                            toast.success('Entrenador actualizado');
                          } catch (error) {
                            toast.error('Error al actualizar entrenador');
                          }
                        }}
                        className="entrenador-select"
                      >
                        <option value="">Sin entrenador</option>
                        {entrenadores.map((entrenador) => (
                          <option key={entrenador._id} value={entrenador._id}>
                            {entrenador.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="modalidad-acciones">
                        <button
                          onClick={() => editarModalidad(modalidad)}
                          className="btn-editar-modalidad"
                          title="Editar modalidad"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => eliminarModalidad(modalidad._id, modalidad.nombre)}
                          className="btn-eliminar-modalidad"
                          title="Eliminar modalidad"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    {mostrarModal && (
      <div className="modal">
        <div className="modal-content">
          <h3>Subir base de datos</h3>
          <p>Seleccione el archivo a subir:</p>
          <button onClick={() => setMostrarModal(false)}>Cerrar</button>
        </div>
      </div>
    )}
  </div>
);
}

export default Modalidades;