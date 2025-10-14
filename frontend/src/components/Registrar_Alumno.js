// =================================================================
// COMPONENTE REGISTRAR ALUMNO - FORMULARIO DE REGISTRO
// =================================================================
// Formulario completo para registrar nuevos alumnos en el sistema.
// Incluye validaciones, selección de modalidades y procesamiento de pagos.
// FUNCIONALIDADES: registro de datos personales, asignación de modalidad,
// cálculo automático de costos, y procesamiento de primer pago.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Registrar_Alumno.css";
import Pilares from '../assest/pilar_olimpus.jpg';
import logo from '../assest/logo_olimpus.jpg';

function Registrar_Alumno() {
  // === HOOKS DE NAVEGACIÓN ===
  const navigate = useNavigate();
  const location = useLocation();

  // === ESTADOS DEL COMPONENTE ===
  // Estados para controlar modales y datos del formulario
  const [mostrarModal, setMostrarModal] = useState(false); // Modal de opciones de pago
  const [modalidades, setModalidades] = useState([]); // Lista de modalidades disponibles
  const [alumnoId, setAlumnoId] = useState(null); // ID del alumno registrado
  const [costoModalidad, setCostoModalidad] = useState(""); // Costo calculado automáticamente
  const [tipoPago, setTipoPago] = useState(""); // Tipo de pago seleccionado
  const [proximaFechaPago, setProximaFechaPago] = useState(""); // Próxima fecha de pago según configuración
  const [diaCobroMensual, setDiaCobroMensual] = useState(5); // Día de cobro mensual configurado

  // === FORMULARIO PRINCIPAL ===
  // Estado que mantiene todos los datos del nuevo alumno
  const [form, setForm] = useState({
    id_modalidad: "", // Se llena con el select de modalidades
    fecha_nacimiento: "", // Para calcular edad
    nombre: "", // Nombre completo (validado con regex)
    correo: "", // Email de contacto
    telefono: "", // Teléfono de contacto
  });

  
  // Obtener la lista de modalidades y próxima fecha de pago desde la API
  useEffect(() => {
    const fetchModalidades = async () => {
      try {
        const response = await axios.get(`http://localhost:7000/api/modalidad`);
        setModalidades(response.data); // Suponiendo que la API regresa un array de objetos [{_id, nombre}]
      } catch (error) {
        console.error("Error al obtener modalidades:", error);
      }
    };

    const fetchProximaFechaPago = async () => {
      try {
        const response = await axios.get(`http://localhost:7000/api/alumnos/proxima-fecha-pago`);
        setProximaFechaPago(response.data.proximaFechaPago);
        setDiaCobroMensual(response.data.diaCobroMensual);
      } catch (error) {
        console.error("Error al obtener próxima fecha de pago:", error);
      }
    };

    fetchModalidades();
    fetchProximaFechaPago();
  }, []);

  useEffect(() => {
    if (form.id_modalidad) {
        const modalidadSeleccionada = modalidades.find(
            (modalidad) => modalidad._id === form.id_modalidad
        );
        if (modalidadSeleccionada) {
            setCostoModalidad(modalidadSeleccionada.costo);
        }
    } else {
        setCostoModalidad(""); // Reinicia el costo si no hay modalidad seleccionada
    }
}, [form.id_modalidad, modalidades]);

  
  
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.id]: e.target.value
    });
  };


  const handleBack = () => { 
    navigate(-1); // Navegar a la página anterior 
  }

  // Removed duplicate handleSubmit function


  const handleSubmit = (e) => {
    e.preventDefault();
    setMostrarModal(true); // Solo mostrar el modal
  };

  const registrarAlumno = async () => {
    try {
      const response = await axios.post("http://localhost:7000/api/alumnos", form);
      console.log("Alumno agregado:", response.data);
      setAlumnoId(response.data._id); // Guardar el ID del nuevo alumno en la variable
      toast.success("Alumno agregado con éxito", alumnoId);
      setForm({ id_modalidad: "", fecha_nacimiento: "", nombre: "", correo: "", telefono: "" });
      setMostrarModal(false);
      setTipoPago(""); 
      return response.data._id; 
        } catch (error) {
      console.error("Error al agregar el alumno:", error);
      toast.error("Hubo un error al agregar el alumno");
    }
  };
  

  const handlePagoTarjeta = async (e) => {
    e.preventDefault();

    try {
      // 1. Crear un PaymentIntent en el servidor
      const { data: clientSecret } = await axios.post("http://localhost:7000/api/modalidad/pago", {
        amount: 1000, // Monto en centavos (por ejemplo, 1000 = $10.00)
        currency: "mxn",
      });



      // 3. Si el pago fue exitoso, registrar al alumno
      // Esperar a que se registre el alumno y obtener su ID
      // 3. Si el pago fue exitoso, registrar al alumno
      const id = await registrarAlumno(); // Usa el ID devuelto por registrarAlumno

      if (!id) {
          toast.error("No se pudo obtener el ID del alumno. Intente nuevamente.");
          return;
      }

      await sumarPagosRealizados(id, 1); // Usa el ID directamente

      toast.success("Pago y registro exitosos 🎉");
      setMostrarModal(false);
      setTipoPago(""); // Resetear
    } catch (error) {
      console.error("Error en el proceso de pago:", error);
      toast.error("Error en el proceso de pago");
    }
  };


  const handlePagoEfectivoOTransferencia = async () => {
    try {
        // 3. Si el pago fue exitoso, registrar al alumno
        const id = await registrarAlumno(); // Usa el ID devuelto por registrarAlumno

        if (!id) {
            toast.error("No se pudo obtener el ID del alumno. Intente nuevamente.");
            return;
        }

        await sumarPagosRealizados(id, 1); // Usa el ID directamente

        toast.success("Alumno registrado con éxito");
        setMostrarModal(false); // Cierra el modal
    } catch (error) {
        console.error("Error al registrar el alumno:", error);
        toast.error("Hubo un error al registrar el alumno");
    }
};
// Handle para sumar pagos realizados a la ruta
const sumarPagosRealizados = async (id, monto) => {
  try {
    await axios.post("http://localhost:7000/api/modalidad/sumarpago", { monto, id });
    console.log("Pago registrado exitosamente");
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    toast.error("Hubo un error al registrar el pago");
  }
};
  return (
    <div className="alumno-layout">
      <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="alumno-container">
        <div className="top-left"> 
          <button className="back-button" onClick={handleBack}>Regresar</button> 
        </div>
        <h1>Agregar alumno</h1>
        <div className="alumno-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper short-field">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  placeholder="Nombre del alumno"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(\s[a-zA-ZáéíóúÁÉÍÓÚñÑ]+){2,}$"
                  title="Debe ingresar al menos un nombre y dos apellidos"
                />
              </div>
              <div className="input-wrapper short-field2">
                <label htmlFor="fecha_nacimiento">Fecha nacimiento</label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  placeholder="YYYY-MM-DD"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-wrapper short-field">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  type="email"
                  id="correo"
                  placeholder="alguien@example.com"
                  value={form.correo}
                  onChange={handleChange}
                />
              </div>
              <div className="input-wrapper short-field2">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="text"
                  id="telefono"
                  placeholder="000-000-0000"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>
            {/* Campo para seleccionar la modalidad */}
            <div className="form-group">
                <div className="input-wrapper">
                  <label htmlFor="id_modalidad">Modalidad</label>
                  <select id="id_modalidad" value={form.id_modalidad} onChange={handleChange}>
                    <option value="">Seleccionar una modalidad</option>
                    {modalidades.map((modalidad) => (
                      <option key={modalidad._id} value={modalidad._id}>
                        {modalidad.nombre} - {modalidad.horarios}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            
            {/* Información de fechas de pago */}
            {proximaFechaPago && (
              <div className="info-pago-box">
                <h4>📅 Información de Pagos</h4>
                <p><strong>Día de cobro mensual:</strong> Día {diaCobroMensual} de cada mes</p>
                <p><strong>Próxima fecha de pago:</strong> {new Date(proximaFechaPago).toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            )}
            
            <div className="alumno-buttons">
              <button type="submit" className="button">Agregar</button>
            </div>
          </form>
        </div>
      </div>
      {mostrarModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>Opciones de pago</h3>
      <p>¿Cómo desea registrar el pago?</p>
      {/* Aquí mostramos el costo */}
      <p><strong>Costo de inscripción:</strong> $0</p>
      <p><strong>Costo de la modalidad:</strong> ${costoModalidad}</p>
      <p><strong>Total a pagar:</strong> ${0 + costoModalidad}</p>
      <p><strong>Costo de la anualidad:</strong> ${costoModalidad * 11}</p>

      <div className="pago-opciones">
    <button
        className="pago-button"
        onClick={() => {
          if (window.confirm("¿Está seguro de confirmar el pago?")) {
              handlePagoEfectivoOTransferencia();
              setMostrarModal(false);
          }
        }}
    >
        Confirmar Pago de mensualidad
    </button>
     <button className="pago-button" onClick={async () => {
          if (window.confirm("¿Está seguro de confirmar el pago?")) {
              handlePagoEfectivoOTransferencia();
              const id = await registrarAlumno();
          if (id) {
            await sumarPagosRealizados(id, 12); // Registrar 12 pagos
            toast.success("Anualidad registrada con éxito");
            setMostrarModal(false);
          }
          }
          
        }}>
          Pago de anualidad
        </button>
            </div>
            <button className="cerrar-button" onClick={() => setMostrarModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
      <img src={Pilares} alt="Pilar Derecho" className="pilar" />
    </div>
  );
}

export default Registrar_Alumno;