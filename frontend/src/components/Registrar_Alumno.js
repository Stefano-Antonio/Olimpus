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
  const [costoInscripcion, setCostoInscripcion] = useState(0); // Costo de inscripción configurable
  const [montoPersonalizado, setMontoPersonalizado] = useState(undefined); // Monto personalizable para pagos
  const [tipoSeleccionado, setTipoSeleccionado] = useState(""); // Tipo de pago seleccionado (mensual/anual)
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null); // Modalidad actualmente seleccionada

  // === FORMULARIO PRINCIPAL ===
  // Estado que mantiene todos los datos del nuevo alumno
  const [form, setForm] = useState({
    id_modalidad: "", // Se llena con el select de modalidades
    fecha_nacimiento: "", // Para calcular edad
    nombre: "", // Nombre completo (validado con regex)
    correo: "", // Email de contacto
    telefono: "", // Teléfono de contacto
  });

  
  // Obtener la lista de modalidades, próxima fecha de pago y configuración del sistema desde la API
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

    const fetchConfiguracion = async () => {
      try {
        const response = await axios.get(`http://localhost:7000/api/configuracion`);
        setCostoInscripcion(response.data.costoInscripcion || 0);
      } catch (error) {
        console.error("Error al obtener configuración:", error);
        setCostoInscripcion(0); // Valor por defecto en caso de error
      }
    };

    fetchModalidades();
    fetchProximaFechaPago();
    fetchConfiguracion();
  }, []);

  useEffect(() => {
    if (form.id_modalidad) {
        const modalidadEncontrada = modalidades.find(
            (modalidad) => modalidad._id === form.id_modalidad
        );
        if (modalidadEncontrada) {
            setCostoModalidad(modalidadEncontrada.costo);
            setModalidadSeleccionada(modalidadEncontrada);
        } else {
            setModalidadSeleccionada(null);
        }
    } else {
        setCostoModalidad(""); // Reinicia el costo si no hay modalidad seleccionada
        setModalidadSeleccionada(null);
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
    
    // Siempre mostrar el modal de opciones de pago, con o sin modalidad
    setMostrarModal(true);
    
    // Si no hay modalidad, preseleccionar "Solo Inscripción"
    if (!form.id_modalidad) {
      setTipoSeleccionado('inscripcion');
    }
  };

  // Función para registrar alumno sin pago (solo datos personales)
  const registrarAlumnoSinPago = async () => {
    try {
      const formData = {
        ...form,
        id_modalidad: null // Explícitamente null cuando no hay modalidad
      };

      const response = await axios.post("http://localhost:7000/api/alumnos", formData);
      console.log("Alumno registrado sin modalidad:", response.data);
      toast.success("Alumno registrado exitosamente sin modalidad");
      setForm({ id_modalidad: "", fecha_nacimiento: "", nombre: "", correo: "", telefono: "" });
      setModalidadSeleccionada(null); // Limpiar modalidad seleccionada
    } catch (error) {
      console.error("Error al registrar el alumno:", error.response?.data || error);
      toast.error("Hubo un error al registrar el alumno");
    }
  };

  const registrarAlumno = async () => {
    try {
      // Preparar los datos del formulario, convirtiendo id_modalidad vacío a null
      const formData = {
        ...form,
        id_modalidad: form.id_modalidad || null // Si está vacío, enviar null
      };

      const response = await axios.post("http://localhost:7000/api/alumnos", formData);
      console.log("Alumno agregado:", response.data);
      setAlumnoId(response.data._id); // Guardar el ID del nuevo alumno en la variable
      toast.success("Alumno agregado con éxito");
      
      // Limpiar formulario
      setForm({ id_modalidad: "", fecha_nacimiento: "", nombre: "", correo: "", telefono: "" });
      setMostrarModal(false);
      setTipoPago(""); 
      setModalidadSeleccionada(null); // Limpiar modalidad seleccionada 
      setMontoPersonalizado(undefined);
      setTipoSeleccionado("");
      
      return response.data._id; 
    } catch (error) {
      console.error("Error al agregar el alumno:", error.response?.data || error);
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

      await registrarPagosDetallados(id, false); // false = pago mensual

      toast.success("Pago y registro exitosos 🎉");
      setMostrarModal(false);
      setTipoPago(""); // Resetear
    } catch (error) {
      console.error("Error en el proceso de pago:", error);
      toast.error("Error en el proceso de pago");
    }
  };


  // Función legacy mantenida para compatibilidad (ya no se usa directamente)
  const handlePagoEfectivoOTransferencia = async () => {
    try {
        const id = await registrarAlumno();

        if (!id) {
            toast.error("No se pudo obtener el ID del alumno. Intente nuevamente.");
            return;
        }

        await registrarPagosDetallados(id, false); // false = pago mensual

        toast.success("Alumno registrado con éxito");
        setMostrarModal(false);
    } catch (error) {
        console.error("Error al registrar el alumno:", error);
        toast.error("Hubo un error al registrar el alumno");
    }
};
// Handle para sumar pagos realizados a la ruta
const sumarPagosRealizados = async (id, monto, costo) => {
  try {
    await axios.post("http://localhost:7000/api/modalidad/sumarpago", { monto, id, costo });
    console.log("Pago registrado exitosamente");
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    toast.error("Hubo un error al registrar el pago");
  }
};

// Función específica para registrar pagos de inscripción por separado
const registrarPagosDetallados = async (id, esAnualidad = false, montoTotalPersonalizado = null) => {
  try {
    // Si hay monto personalizado, calcular proporcionalmente
    let costoInscripcionFinal = costoInscripcion;
    let costoModalidadFinal = parseFloat(costoModalidad || 0) * (esAnualidad ? 11 : 1);
    
    if (montoTotalPersonalizado !== null) {
      const totalOriginal = costoInscripcion + costoModalidadFinal;
      if (totalOriginal > 0) {
        // Calcular proporción para cada concepto
        const proporcionInscripcion = costoInscripcion / totalOriginal;
        const proporcionModalidad = costoModalidadFinal / totalOriginal;
        
        costoInscripcionFinal = montoTotalPersonalizado * proporcionInscripcion;
        costoModalidadFinal = montoTotalPersonalizado * proporcionModalidad;
      } else {
        // Si no hay modalidad, todo el monto va a inscripción
        costoInscripcionFinal = montoTotalPersonalizado;
        costoModalidadFinal = 0;
      }
    }

    // 1. Registrar pago de inscripción (si es mayor a 0)
    if (costoInscripcionFinal > 0) {
      await axios.post("http://localhost:7000/api/modalidad/sumarpago", { 
        monto: 0, // No suma meses, solo registra el pago
        id, 
        costo: costoInscripcionFinal,
        concepto: "Inscripción"
      });
    }

    // 2. Registrar pago de modalidad (solo si hay modalidad seleccionada y costo > 0)
    if (costoModalidad && costoModalidadFinal > 0) {
      const mesesAPagar = esAnualidad ? 12 : 1;
      
      await axios.post("http://localhost:7000/api/modalidad/sumarpago", { 
        monto: mesesAPagar, // Suma los meses correspondientes
        id, 
        costo: costoModalidadFinal,
        concepto: esAnualidad ? "Anualidad" : "Mensualidad"
      });
    }

    console.log("Pagos detallados registrados exitosamente", {
      inscripcion: costoInscripcionFinal,
      modalidad: costoModalidadFinal,
      esAnualidad,
      montoPersonalizado: montoTotalPersonalizado
    });
  } catch (error) {
    console.error("Error al registrar los pagos detallados:", error);
    toast.error("Hubo un error al registrar los pagos");
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
                  <label htmlFor="id_modalidad">Modalidad (Opcional)</label>
                  <select id="id_modalidad" value={form.id_modalidad} onChange={handleChange}>
                    <option value="">Sin modalidad (solo inscripción)</option>
                    {modalidades.map((modalidad) => (
                      <option key={modalidad._id} value={modalidad._id}>
                        {modalidad.grupo ? `[${modalidad.grupo}] ` : ''}
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
              </div>
            )}
            
            <div className="alumno-buttons">
              <button type="submit" className="button">
                Continuar con Registro
              </button>
            </div>
          </form>
        </div>
      </div>
      {mostrarModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>Opciones de pago - {modalidadSeleccionada?.nombre || "Sin modalidad"}</h3>
      <p>{modalidadSeleccionada ? 
          `Alumno: ${form.nombre} - Modalidad: ${modalidadSeleccionada.nombre}` : 
          `Registrando alumno: ${form.nombre} (solo inscripción)`}
      </p>
      
      {/* Selección de tipo de pago */}
      <div style={{ margin: '15px 0' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Seleccione el tipo de pago:
        </label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          {costoModalidad && modalidadSeleccionada ? (
            <>
              <button
                onClick={() => setTipoSeleccionado('mensual')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tipoSeleccionado === 'mensual' ? '#3b82f6' : '#e5e7eb',
                  color: tipoSeleccionado === 'mensual' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                💰 Pago Mensual
              </button>
              <button
                onClick={() => setTipoSeleccionado('anual')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tipoSeleccionado === 'anual' ? '#3b82f6' : '#e5e7eb',
                  color: tipoSeleccionado === 'anual' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                📅 Pago Anual
              </button>
            </>
          ) : (
            <button
              onClick={() => setTipoSeleccionado('inscripcion')}
              style={{
                padding: '8px 16px',
                backgroundColor: tipoSeleccionado === 'inscripcion' ? '#3b82f6' : '#e5e7eb',
                color: tipoSeleccionado === 'inscripcion' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              📝 Solo Inscripción
            </button>
          )}
        </div>
      </div>

      {/* Información de costos */}
      <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
        <p><strong>Costo de inscripción:</strong> ${costoInscripcion.toFixed(2)}</p>
        {costoModalidad && tipoSeleccionado === 'mensual' && (
          <>
            <p><strong>Costo de modalidad (1 mes):</strong> ${costoModalidad}</p>
            <p><strong>Total calculado:</strong> ${(costoInscripcion + parseFloat(costoModalidad || 0)).toFixed(2)}</p>
          </>
        )}
        {costoModalidad && tipoSeleccionado === 'anual' && (
          <>
            <p><strong>Costo modalidad (11 meses):</strong> ${(costoModalidad * 11).toFixed(2)}</p>
            <p><strong>Total calculado:</strong> ${(costoInscripcion + (costoModalidad * 11)).toFixed(2)}</p>
          </>
        )}
        {tipoSeleccionado === 'inscripcion' && (
          <p><strong>Total calculado:</strong> ${costoInscripcion.toFixed(2)}</p>
        )}
      </div>

      {/* Campo de monto personalizable */}
      {tipoSeleccionado && (
        <div style={{ margin: '15px 0' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            💰 Monto a cobrar (editable):
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={
              montoPersonalizado !== undefined 
                ? montoPersonalizado 
                : tipoSeleccionado === 'mensual'
                  ? (costoInscripcion + parseFloat(costoModalidad || 0)).toFixed(2)
                  : tipoSeleccionado === 'anual'
                    ? (costoInscripcion + (costoModalidad * 11)).toFixed(2)
                    : costoInscripcion.toFixed(2)
            }
            onChange={(e) => {
              const nuevoMonto = parseFloat(e.target.value) || 0;
              setMontoPersonalizado(nuevoMonto);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
              backgroundColor: '#f0f9ff'
            }}
            placeholder="0.00"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              Puedes modificar el monto para aplicar descuentos o ajustes
            </small>
            {montoPersonalizado !== undefined && (
              <button
                onClick={() => setMontoPersonalizado(undefined)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Restablecer
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pago-opciones">
        {tipoSeleccionado && (
          <button
            className="pago-button"
            onClick={async () => {
              const montoFinal = montoPersonalizado !== undefined 
                ? montoPersonalizado 
                : tipoSeleccionado === 'mensual'
                  ? (costoInscripcion + parseFloat(costoModalidad || 0))
                  : tipoSeleccionado === 'anual'
                    ? (costoInscripcion + (costoModalidad * 11))
                    : costoInscripcion;
              
              const montoCalculado = tipoSeleccionado === 'mensual'
                ? (costoInscripcion + parseFloat(costoModalidad || 0)).toFixed(2)
                : tipoSeleccionado === 'anual'
                  ? (costoInscripcion + (costoModalidad * 11)).toFixed(2)
                  : costoInscripcion.toFixed(2);
              
              const esMontoModificado = montoPersonalizado !== undefined;
              
              let mensaje = `¿Está seguro de confirmar el ${
                tipoSeleccionado === 'mensual' ? 'pago mensual' : 
                tipoSeleccionado === 'anual' ? 'pago anual' : 
                'registro (solo inscripción)'
              } de $${montoFinal.toFixed(2)}?`;
              
              if (esMontoModificado) {
                mensaje += `\n\n(Monto original: $${montoCalculado} - Monto modificado aplicado)`;
              }
              
              if (window.confirm(mensaje)) {
                try {
                  const id = await registrarAlumno();
                  if (id) {
                    // Registrar pagos con el monto personalizado
                    if (tipoSeleccionado === 'anual') {
                      await registrarPagosDetallados(id, true, montoFinal);
                      toast.success("Anualidad registrada con éxito");
                    } else {
                      await registrarPagosDetallados(id, false, montoFinal);
                      toast.success("Pago registrado con éxito");
                    }
                    setMostrarModal(false);
                    setMontoPersonalizado(undefined);
                    setTipoSeleccionado("");
                  }
                } catch (error) {
                  console.error("Error en el proceso:", error);
                  toast.error("Error en el proceso de registro");
                }
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {tipoSeleccionado === 'mensual' && '💰 Confirmar Pago Mensual'}
            {tipoSeleccionado === 'anual' && '📅 Confirmar Pago Anual'}
            {tipoSeleccionado === 'inscripcion' && '📝 Confirmar Solo Inscripción'}
            {montoPersonalizado !== undefined && ` - $${montoPersonalizado.toFixed(2)}`}
          </button>
        )}
      </div>
            <button className="cerrar-button" onClick={() => {
              setMostrarModal(false);
              setMontoPersonalizado(undefined);
              setTipoSeleccionado("");
              setModalidadSeleccionada(null); // Limpiar modalidad seleccionada
            }}>Cerrar</button>
          </div>
        </div>
      )}
      <img src={Pilares} alt="Pilar Derecho" className="pilar" />
    </div>
  );
}

export default Registrar_Alumno;