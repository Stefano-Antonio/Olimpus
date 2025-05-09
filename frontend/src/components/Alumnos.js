import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Alumnos.css";
import Pilares from '../assest/pilar_olimpus.jpg';

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarPagoModal, setMostrarPagoModal] = useState(false);
  const [id, setAlumnoId] = useState(null);
  const [costoModalidad, setCostoModalidad] = useState(""); // Inicializa con una cadena vacía
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [AlumnoAEliminar, setAlumnoAEliminar] = useState(null);
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [pagosCorte, setPagosCorte] = useState([]);
  const [totalCorte, setTotalCorte] = useState(0);
  // Removed unused declaration
  const navigate = useNavigate();

const fetchData = async () => {
    try {
        // Traer alumnos con su modalidad (populate)
        const alumnosResponse = await axios.get(`http://localhost:7000/api/alumnos`);
        const alumnosData = alumnosResponse.data;

        // Traer modalidades para poder obtener el horario
        const modalidadesResponse = await axios.get(`http://localhost:7000/api/modalidad`);
        const modalidadesData = modalidadesResponse.data;

        
        setAlumnos(alumnosData);
        setModalidades(modalidadesData);
        setLoading(false);
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
};


useEffect(() => {
    fetchData();
}, []);

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const obtenerCorteDelDia = async () => {
    try {
        const fecha = new Date(fechaCorte);
      const res = await axios.get(`http://localhost:7000/api/modalidad/corte-dia?fecha=${fecha.toISOString}`);
      setPagosCorte(res.data.pagos); // Actualiza el estado con los pagos
      setTotalCorte(res.data.totalPagado); // Actualiza el estado con el total
    } catch (error) {
      console.error("Error al obtener el corte:", error);
    }
  };
  
  const obtenerDetallesAlumno = async (alumnoId) => {
    try {
      const res = await axios.get(`http://localhost:7000/api/alumno/${alumnoId}`);
      return res.data;
    } catch (error) {
      console.error("Error al obtener los detalles del alumno:", error);
      return null;
    }
  };
  
 
  

  const obtenerHorarioModalidad = (idModalidad) => {
    const modalidad = modalidades.find(m => m._id === idModalidad);
    return modalidad ? modalidad.horarios : 'Horario no disponible';
  };

  const obtenerNombreModalidad = (idModalidad) => {
    const modalidad = modalidades.find(m => m._id === idModalidad);
    return modalidad ? modalidad.nombre : 'Modalidad desconocida';
  };

  const setModal = (id) => {
    setAlumnoAEliminar(id);
    setMostrarModal(true);
  };

  
  const handleBack = () => { 
    navigate(-1); // Navegar a la página anterior 
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:7000/api/alumnos/${AlumnoAEliminar}`);
      setAlumnos(prevState => prevState.filter(alumno => alumno._id !== AlumnoAEliminar));
      toast.success("Alumno eliminado con éxito");
      setMostrarModal(false);
    } catch (error) {
      console.error('Error al eliminar alumno:', error);
      toast.error("Hubo un error al eliminar el alumno");
    }
  };

  const handleModalidadChange = async (alumnoId, nuevaModalidadId) => {
    try {
        const alumno = alumnos.find(a => a._id === alumnoId);

        if (!alumno) {
            toast.error("Alumno no encontrado");
            return;
        }

        // 💡 Aquí se verifica que no tenga pagos pendientes
        if (alumno.pago_pendiente > 0) {
            toast.error("No se puede cambiar la modalidad porque el alumno tiene pagos pendientes.");
            return;
        }

        const selectedModalidad = modalidades.find(m => m._id === nuevaModalidadId);

        if (selectedModalidad) {
            setCostoModalidad(selectedModalidad.costo);

            await axios.post(`http://localhost:7000/api/modalidad/cambiarModalidad`, {
                idAlumno: alumnoId,
                idModalidad: nuevaModalidadId,
            });

            await fetchData();

            toast.success("Modalidad actualizada con éxito");
        } else {
            setCostoModalidad("");
            toast.error("Modalidad seleccionada no válida");
        }
    } catch (error) {
        console.error("Error al actualizar la modalidad:", error);
        toast.error("Hubo un error al actualizar la modalidad");
    }
};

    
  if (loading) {
    return <div className="loading">Cargando información de alumnos...</div>;
  }
  const alumnosFiltrados = alumnos.filter(alumno => {
    if (!alumno || !alumno.id_modalidad) return false;

    const modalidadId = alumno.id_modalidad._id || alumno.id_modalidad;
    const modalidad = obtenerNombreModalidad(modalidadId)?.toLowerCase() || "";
    const horario = obtenerHorarioModalidad(modalidadId)?.toLowerCase() || "";
    const edad = calcularEdad(alumno.fecha_nacimiento)?.toString() || "";

    return (
        alumno.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modalidad.includes(searchTerm.toLowerCase()) ||
        horario.includes(searchTerm.toLowerCase()) ||
        edad.includes(searchTerm.toLowerCase())
    );
});

 const handlePagoEfectivoOTransferencia = async (alumno, costo) => {
    try {

        const id= alumno._id;
        console.log('alumnoid:',id)
        if (!id) {
            toast.error("No se pudo obtener el ID del alumno. Intente nuevamente.");
            return;
        }

        if (!alumnoSeleccionado?.mesesAPagar) {
            toast.error("Seleccione la cantidad de meses a pagar.");
            return;
        }
        
        await sumarPagosRealizados(id, alumno.mesesAPagar || 1, costo);
        await fetchData(); // recargar la lista de alumnos

        toast.success("Pago registrado con éxito");
        setMostrarModal(false); // Cierra el modal
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

return (
    <div className="alumno-layout">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="pilares-background">
            <img src={Pilares} alt="Pilar Izquierdo" className="pilar" />
            <img src={Pilares} alt="Pilar Derecho" className="pilar" />
        </div>
        <div className="alumno-container">
            <div className="top-left"> 
                <button className="back-button" onClick={handleBack}>Regresar</button> 
            </div>
            <h3>Administrar alumnos</h3>

            <input
                type="text"
                placeholder="Buscar por nombre, modalidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
            />

            {alumnosFiltrados.length > 0 ? (
                <div className="alumno-scrollable-table">
                    <div className="corte-dia-section">
                    <div>
                <h4>Corte del día</h4>
                <input
                    type="date"
                    value={fechaCorte}
                    onChange={(e) => setFechaCorte(e.target.value)}
                />
                <button onClick={obtenerCorteDelDia}>Ver corte</button>

                {totalCorte && (
                    <p>Total pagado del día: ${totalCorte}</p>
                )}

                {pagosCorte.length > 0 ? (
                    <div className="corte-result">
                    <h5>Pagos registrados el {fechaCorte}</h5>
                    <table>
                        <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pagosCorte.map((pago) => (
                            <tr key={pago._id}>
                            <td>{pago.alumno?.nombre || "Desconocido"}</td>
                            <td>${pago.costo}</td>
                            <td>{new Date(pago.fecha).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p>No se encontraron pagos para la fecha seleccionada.</p>
                )}
                </div>
                </div>
                    <table className="alumnos-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Modalidad</th>
                                <th>Fecha de inscripción</th>
                                <th>Meses pendientes</th>
                                <th>Meses pagados</th>
                                <th>Deuda en $</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumnosFiltrados.map((alumno) => (
                                <tr key={alumno._id}>
                                    <td>{alumno.nombre}</td>
                                    <td>{calcularEdad(alumno.fecha_nacimiento)}</td>
                                    <td>
                                        <select
                                            value={alumno.id_modalidad._id || alumno.id_modalidad}
                                            onChange={(e) => handleModalidadChange(alumno._id, e.target.value)}
                                        >
                                            {modalidades.map((modalidad) => (
                                                <option key={modalidad._id} value={modalidad._id}>
                                                    {modalidad.nombre} - {modalidad.horarios} 
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{new Date(alumno.fecha_inscripcion).toISOString().split('T')[0]}</td>
                                    <td>{alumno.pago_pendiente}</td>
                                    <td>{alumno.pagos_realizados}</td>
                                    <td>{alumno.deuda_total}</td>

                                    <td>
                                        <button
                                            className="icon-button"
                                            onClick={() => {
                                                setAlumnoSeleccionado(alumno);
                                                setMostrarPagoModal(true);
                                            }}
                                        >
                                            Registrar Pago
                                        </button>
                                        <button className="icon-button" onClick={() => setModal(alumno._id)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                                <path d="M10 11v6"></path>
                                                <path d="M14 11v6"></path>
                                                <path d="M15 6V4a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="no-alumnos-message">No se encontraron resultados.</p>
            )}
            
            {mostrarModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>AVISO</h3>
                        <p>¿Está seguro que desea eliminar al alumno?</p>
                        <p>Una vez eliminado, no podrá revertirse el proceso.</p>
                        <button onClick={handleDelete}>Continuar</button>
                        <button onClick={() => setMostrarModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
            {mostrarPagoModal && (
                <div className="modal">
                    <div className="modal-content">
                        <p>Seleccione la cantidad de meses que desea pagar:</p>

                        <p><strong>Deuda total:</strong> ${alumnoSeleccionado?.deuda_total ? alumnoSeleccionado.deuda_total.toFixed(2) : '0.00'}</p>

                        <select
                            onChange={(e) => {
                                const meses = parseInt(e.target.value, 10);
                                if (isNaN(meses) || meses === 0) {
                                    return;
                                }
                                
                                const costoPorMes = alumnoSeleccionado?.deuda_total / alumnoSeleccionado?.pago_pendiente;

                                setAlumnoSeleccionado((prev) => ({
                                    ...prev,
                                    mesesAPagar: meses,
                                    costoPorMes: alumnoSeleccionado?.deuda_total > 0 
                                        ? costoPorMes 
                                        : modalidades.find(m => m._id === alumnoSeleccionado?.id_modalidad)?.costo || 0,
                                }));
                            }}
                        >
                            <option value="">Seleccione meses</option>
                            <option value="11">Anualidad</option>
                            {Array.from({ length: Math.max(alumnoSeleccionado?.pago_pendiente || 0, 12) }, (_, i) => i + 1).map((mes) => (
                                <option key={mes} value={mes}>
                                    {mes} {mes === 1 ? "mes" : "meses"}
                                </option>
                            ))}
                        </select>

                        {alumnoSeleccionado?.mesesAPagar && (
                            <>
                                <p><strong>Costo por mes:</strong> ${alumnoSeleccionado?.costoPorMes ? alumnoSeleccionado.costoPorMes.toFixed(2) : '0.00'}</p>
                                <p><strong>Costo total:</strong> ${(alumnoSeleccionado.costoPorMes * alumnoSeleccionado.mesesAPagar).toFixed(2)}</p>
                            </>
                        )}

                        <div className="pago-opciones">
                            <button
                                className="pago-button"
                                onClick={() => {
                                    if (window.confirm("¿Está seguro de confirmar el pago?")) {
                                        const costo = alumnoSeleccionado?.costoPorMes * alumnoSeleccionado?.mesesAPagar;
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado, costo);
                                        setMostrarPagoModal(false);
                                    }
                                }}
                            >
                                Confirmar Pago
                            </button>
                            {alumnoSeleccionado?.mesesAPagar === 12 && (
                                <button className="pago-button" onClick={async () => {
                                    if (id) {
                                        const costo = alumnoSeleccionado?.costoPorMes * 12;
                                        await sumarPagosRealizados(id, 12, costo);
                                        toast.success("Anualidad registrada con éxito");
                                        setMostrarPagoModal(false);
                                    } 
                                    if (window.confirm("¿Está seguro de confirmar el pago?")) {
                                        const costo = alumnoSeleccionado?.costoPorMes * 12;
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado, costo);}
                                }}>
                                    Pago de anualidad
                                </button>
                            )}
                        </div>

                        <button onClick={() => setMostrarPagoModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default Alumnos;