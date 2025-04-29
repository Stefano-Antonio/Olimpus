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
    costo: ''
  });


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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      // Reemplaza valores vacíos en horarios con null
      const finalData = {
        ...formData,
        horarios: Object.fromEntries(
          Object.entries(formData.horarios).map(([key, value]) => [key, value === "" ? null : value])
        )
      };

      const response = await axios.post('http://localhost:7000/api/modalidad', finalData);
      console.log("Modalidad actualizada:", response.data);
      toast.success('Modalidad creada con éxito');
      setFormData({
        nombre: '',
        horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
        costo: ''
      });
    } catch (error) {
      console.error('Error al crear la modalidad:', error);
      toast.error('Hubo un error al crear la modalidad, o ya existe esta modalidad con esos horarios');
    }
  };
    
return (
  <div className="materia-layout">
    <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />
    <ToastContainer position="top-right" autoClose={3000} />
    <div className="materia-container">
      <div className="top-left">
        <button className="back-button" onClick={handleBack}>Regresar</button>
      </div>
      <h1>Agregar modalidad</h1>
      <div className="materia-content">
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
            <button type="submit" className="button">Agregar</button>
          </div>
        </form>
        <div className="materia-buttons">
        </div>
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
    <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />
  </div>
);
}

export default Modalidades;