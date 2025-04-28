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

  if (loading) {
    return <div className="loading">Cargando información de alumnos...</div>;
  }

const alumnosFiltrados = alumnos.filter(alumno => {
    const modalidad = obtenerNombreModalidad(alumno.id_modalidad._id || alumno.id_modalidad).toLowerCase();
    const horario = obtenerHorarioModalidad(alumno.id_modalidad._id || alumno.id_modalidad).toLowerCase();
    const edad = calcularEdad(alumno.fecha_nacimiento).toString();
    return (
        alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modalidad.includes(searchTerm.toLowerCase()) ||
        horario.includes(searchTerm.toLowerCase()) ||
        edad.includes(searchTerm.toLowerCase())
    );
});

 const handlePagoEfectivoOTransferencia = async (alumno) => {
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
        
        await sumarPagosRealizados(id, alumno.mesesAPagar || 1);
        await fetchData(); // recargar la lista de alumnos

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
                    <table className="alumnos-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Modalidad</th>
                                <th>Horario</th>
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
                                    <td>{obtenerNombreModalidad(alumno.id_modalidad._id || alumno.id_modalidad)}</td>
                                    <td>{obtenerHorarioModalidad(alumno.id_modalidad._id || alumno.id_modalidad)}</td>
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
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado);
                                        setMostrarPagoModal(false);
                                    }
                                }}
                            >
                                Confirmar Pago
                            </button>
                            {alumnoSeleccionado?.mesesAPagar === 12 && (
                                <button className="pago-button" onClick={async () => {
                                    if (id) {
                                        await sumarPagosRealizados(id, 12);
                                        toast.success("Anualidad registrada con éxito");
                                        setMostrarPagoModal(false);
                                    } 
                                    if (window.confirm("¿Está seguro de confirmar el pago?")) {
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado);}
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
