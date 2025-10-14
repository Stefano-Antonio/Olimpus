import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Alumnos.css";
import Pilares from '../assest/pilar_olimpus.jpg';
import EstadoPagoIndicador from './EstadoPagoIndicador';

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
  const [resumenCorte, setResumenCorte] = useState({});
  // Estados para importación de Excel
  const [mostrarImportModal, setMostrarImportModal] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [importandoExcel, setImportandoExcel] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
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

// Efecto para manejar el scroll del body cuando el modal esté abierto
useEffect(() => {
    if (mostrarImportModal || mostrarModal || mostrarPagoModal) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    }
    
    // Cleanup function para restaurar el scroll al desmontar
    return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    };
}, [mostrarImportModal, mostrarModal, mostrarPagoModal]);

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
        // Enviar la fecha en formato YYYY-MM-DD directamente, sin conversión UTC
      console.log('Solicitando corte para la fecha:', fechaCorte);
      const res = await axios.get(`http://localhost:7000/api/modalidad/corte-dia?fecha=${fechaCorte}`);
      console.log('Respuesta del corte del día:', res.data); // Debug
      setPagosCorte(res.data.pagos || []); // Actualiza el estado con los pagos
      setTotalCorte(res.data.totalPagado || 0); // Actualiza el estado con el total
      setResumenCorte(res.data.resumen || {}); // Actualiza el resumen por concepto
      
      // Mostrar mensaje informativo
      const fechaFormateada = new Date(fechaCorte).toLocaleDateString('es-MX');
      if (res.data.pagos && res.data.pagos.length > 0) {
        toast.info(`Mostrando ${res.data.pagos.length} pago(s) del ${fechaFormateada}`);
      } else {
        toast.info(`No se encontraron pagos para el ${fechaFormateada}`);
      }
    } catch (error) {
      console.error("Error al obtener el corte:", error);
      toast.error("Error al obtener el corte del día");
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
    if (!idModalidad) return 'Sin modalidad';
    const modalidad = modalidades.find(m => m._id === idModalidad);
    return modalidad ? modalidad.nombre : 'Sin modalidad';
  };

  const obtenerNombreEntrenador = (idModalidad) => {
    if (!idModalidad) return 'Sin asignar';
    const modalidad = modalidades.find(m => m._id === idModalidad);
    if (!modalidad) return 'Sin asignar';
    
    // El backend ya envía el campo 'entrenador' con el nombre del entrenador
    return modalidad.entrenador && modalidad.entrenador !== 'Sin entrenador' 
      ? modalidad.entrenador 
      : 'Sin asignar';
  };

  const setModal = (id) => {
    setAlumnoAEliminar(id);
    setMostrarModal(true);
  };

  
  const handleBack = () => { 
    navigate(-1); // Navegar a la página anterior 
  }

  const handleExportarExcel = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/excel/exportar', {
        responseType: 'blob'
      });
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `alumnos_olimpus_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast.error('Error al exportar los datos a Excel');
    }
  }

  const handleDescargarPlantilla = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/excel/plantilla', {
        responseType: 'blob'
      });
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plantilla_olimpus_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Plantilla Excel descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar la plantilla Excel');
    }
  }

  // Funciones para importación de Excel
  const handleArchivoExcelChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Por favor selecciona un archivo Excel (.xls o .xlsx)');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      
      setArchivoExcel(selectedFile);
      setResultadoImport(null);
    }
  };

  const handleImportarExcel = async () => {
    if (!archivoExcel) {
      toast.error('Por favor selecciona un archivo');
      return;
    }
    
    setImportandoExcel(true);
    setResultadoImport(null);
    
    try {
      const formData = new FormData();
      formData.append('file', archivoExcel);
      
      const response = await axios.post('http://localhost:7000/api/excel/importar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { exitosos, fallidos, duplicados = 0, errores, registrosRechazados = [], totalProcesado } = response.data;
      
      setResultadoImport({
        exitosos,
        fallidos,
        duplicados,
        errores,
        registrosRechazados,
        totalProcesado
      });
      
      // Mensajes más específicos
      if (exitosos > 0) {
        toast.success(`✅ ${exitosos} alumno(s) creado(s) exitosamente`);
        await fetchData(); // Recargar la lista de alumnos
      }
      
      if (duplicados > 0) {
        toast.info(`🔄 ${duplicados} registro(s) ya existían (duplicados)`);
      }
      
      if (fallidos > 0) {
        toast.warning(`❌ ${fallidos} registro(s) con errores. Revisa los detalles abajo`);
      }
      
    } catch (error) {
      console.error('Error al importar alumnos:', error);
      toast.error(error.response?.data?.message || 'Error al importar alumnos');
    } finally {
      setImportandoExcel(false);
    }
  };

  const cerrarModalImport = () => {
    setMostrarImportModal(false);
    setArchivoExcel(null);
    setResultadoImport(null);
  };

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

        // 💡 Solo verificar pagos pendientes SI YA TIENE una modalidad asignada
        const tieneModalidadAsignada = alumno.id_modalidad && 
                                     (typeof alumno.id_modalidad === 'object' ? 
                                      alumno.id_modalidad._id : 
                                      alumno.id_modalidad);

        if (tieneModalidadAsignada && alumno.pago_pendiente > 0) {
            toast.error("No se puede cambiar la modalidad porque el alumno tiene pagos pendientes. Por favor, registre los pagos primero.");
            return;
        }

        // Si selecciona "Sin modalidad" (valor vacío)
        if (!nuevaModalidadId || nuevaModalidadId === "") {
            if (tieneModalidadAsignada && alumno.pago_pendiente > 0) {
                toast.error("No se puede quitar la modalidad porque el alumno tiene pagos pendientes.");
                return;
            }
            
            await axios.post(`http://localhost:7000/api/modalidad/cambiarModalidad`, {
                idAlumno: alumnoId,
                idModalidad: null,
            });

            await fetchData();
            setCostoModalidad("");
            toast.success("Modalidad removida con éxito");
            return;
        }

        // Si selecciona una modalidad específica
        const selectedModalidad = modalidades.find(m => m._id === nuevaModalidadId);

        if (selectedModalidad) {
            setCostoModalidad(selectedModalidad.costo);

            await axios.post(`http://localhost:7000/api/modalidad/cambiarModalidad`, {
                idAlumno: alumnoId,
                idModalidad: nuevaModalidadId,
            });

            await fetchData();

            toast.success(`Modalidad cambiada a "${selectedModalidad.nombre}" con éxito`);
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
    if (!alumno) return false;

    const modalidadId = alumno.id_modalidad ? (alumno.id_modalidad._id || alumno.id_modalidad) : null;
    const modalidad = obtenerNombreModalidad(modalidadId)?.toLowerCase() || "";
    const horario = modalidadId ? obtenerHorarioModalidad(modalidadId)?.toLowerCase() || "" : "";
    const edad = calcularEdad(alumno.fecha_nacimiento)?.toString() || "";
    const fechaInscripcion = new Date(alumno.fecha_inscripcion).toLocaleDateString('es-MX') || "";

    return (
        alumno.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modalidad.includes(searchTerm.toLowerCase()) ||
        horario.includes(searchTerm.toLowerCase()) ||
        edad.includes(searchTerm.toLowerCase()) ||
        fechaInscripcion.includes(searchTerm.toLowerCase())
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

            <div className="search-and-actions">
              <input
                  type="text"
                  placeholder="Buscar por nombre, modalidad, fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar"
              />
              <div className="excel-actions">
                <button onClick={handleDescargarPlantilla} className="btn-plantilla">
                  📄 Plantilla Excel
                </button>
                <button onClick={() => setMostrarImportModal(true)} className="btn-importar">
                  📤 Importar Excel
                </button>
                <button onClick={handleExportarExcel} className="btn-exportar">
                  📥 Descargar Excel
                </button>
              </div>
            </div>

            {alumnosFiltrados.length > 0 ? (
                <div className="alumno-scrollable-table">
                    <div className="corte-dia-section">
                    <div>
                <h4>Corte del día - {fechaCorte ? new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-MX') : 'Hoy'}</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                      type="date"
                      value={fechaCorte}
                      onChange={(e) => setFechaCorte(e.target.value)}
                      style={{ padding: '5px' }}
                  />
                  <button onClick={obtenerCorteDelDia} style={{ padding: '5px 15px' }}>
                    📊 Ver corte
                  </button>
                  <button 
                    onClick={() => setFechaCorte(new Date().toISOString().split('T')[0])}
                    style={{ padding: '5px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    📅 Hoy
                  </button>
                </div>

                {totalCorte > 0 && (
                    <div className="total-corte">
                        <p><strong>Total pagado del día: ${totalCorte}</strong></p>
                        {Object.keys(resumenCorte).length > 0 && (
                            <div className="resumen-conceptos">
                                <h6>Resumen por concepto:</h6>
                                {Object.entries(resumenCorte).map(([concepto, datos]) => (
                                    <p key={concepto} className="concepto-resumen">
                                        <span className={`concepto-badge ${concepto.toLowerCase()}`}>
                                            {concepto}
                                        </span>: {datos.cantidad} pago{datos.cantidad !== 1 ? 's' : ''} - ${datos.total.toFixed(2)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {pagosCorte.length > 0 ? (
                    <div className="corte-result">
                    <h5>📋 {pagosCorte.length} pago(s) registrado(s) el {new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-MX')}</h5>
                    <table>
                        <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pagosCorte.map((pago) => (
                            <tr key={pago._id}>
                            <td>{pago.alumno?.nombre || "Desconocido"}</td>
                            <td>
                                <span className={`concepto-badge ${pago.concepto?.toLowerCase() || 'mensualidad'}`}>
                                  {pago.concepto || 'Mensualidad'}
                                </span>
                            </td>
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
                                <th>Estado     </th>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Modalidad</th>
                                <th>Entrenador</th>
                                <th>F. Inscripción</th>
                                <th>Pend.</th>
                                <th>Pagos</th>
                                <th>Deuda</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumnosFiltrados
                              .sort((a, b) => {
                                // Ordenar: rojos primero, luego amarillos, luego verdes
                                const prioridad = { rojo: 0, amarillo: 1, verde: 2 };
                                return prioridad[a.estado_pago || 'verde'] - prioridad[b.estado_pago || 'verde'];
                              })
                              .map((alumno) => (
                                <tr key={alumno._id}>
                                    <td>
                                      <EstadoPagoIndicador 
                                        estado={alumno.estado_pago || 'verde'} 
                                        diasVencidos={alumno.dias_vencidos || 0}
                                      />
                                    </td>
                                    <td>{alumno.nombre}</td>
                                    <td>{calcularEdad(alumno.fecha_nacimiento)}</td>
                                    <td>
                                        <select
                                            value={alumno.id_modalidad ? (alumno.id_modalidad._id || alumno.id_modalidad) : ""}
                                            onChange={(e) => handleModalidadChange(alumno._id, e.target.value)}
                                        >
                                            <option value="">Sin modalidad</option>
                                            {modalidades.map((modalidad) => (
                                                <option key={modalidad._id} value={modalidad._id}>
                                                    {modalidad.nombre} - {modalidad.horarios} - ${modalidad.costo || modalidad.precio || 0}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        {obtenerNombreEntrenador(alumno.id_modalidad ? (alumno.id_modalidad._id || alumno.id_modalidad) : null)}
                                    </td>
                                    <td>{new Date(alumno.fecha_inscripcion).toLocaleDateString('es-MX')}</td>
                                    <td>{alumno.pago_pendiente}</td>
                                    <td>{alumno.pagos_realizados}</td>
                                    <td>
                                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
                                        <span>${(alumno.deuda_total_con_recargos || alumno.deuda_total || 0).toFixed(2)}</span>
                                        {alumno.total_recargos > 0 && (
                                          <span className="recargo-badge" title={`Recargos: ${alumno.total_recargos}`}>
                                            +{alumno.total_recargos}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td>
                                        <button
                                            className="icon-button"
                                            onClick={() => {
                                                setAlumnoSeleccionado(alumno);
                                                setMostrarPagoModal(true);
                                            }}
                                        >
                                            💰 Pago
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
                                    montoPersonalizado: undefined // Reset el monto personalizado cuando cambia la selección
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
                                <p><strong>Costo calculado:</strong> ${(alumnoSeleccionado.costoPorMes * alumnoSeleccionado.mesesAPagar).toFixed(2)}</p>
                                
                                <div style={{ margin: '15px 0' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        💰 Monto a cobrar (editable):
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={alumnoSeleccionado.montoPersonalizado !== undefined ? 
                                               alumnoSeleccionado.montoPersonalizado : 
                                               (alumnoSeleccionado.costoPorMes * alumnoSeleccionado.mesesAPagar).toFixed(2)}
                                        onChange={(e) => {
                                            const nuevoMonto = parseFloat(e.target.value) || 0;
                                            setAlumnoSeleccionado(prev => ({
                                                ...prev,
                                                montoPersonalizado: nuevoMonto
                                            }));
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
                                        {alumnoSeleccionado.montoPersonalizado !== undefined && (
                                            <button
                                                onClick={() => {
                                                    setAlumnoSeleccionado(prev => ({
                                                        ...prev,
                                                        montoPersonalizado: undefined
                                                    }));
                                                }}
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
                            </>
                        )}

                        <div className="pago-opciones">
                            <button
                                className="pago-button"
                                onClick={() => {
                                    const montoFinal = alumnoSeleccionado?.montoPersonalizado !== undefined ? 
                                                     alumnoSeleccionado.montoPersonalizado : 
                                                     (alumnoSeleccionado?.costoPorMes * alumnoSeleccionado?.mesesAPagar);
                                    
                                    const montoCalculado = (alumnoSeleccionado?.costoPorMes * alumnoSeleccionado?.mesesAPagar).toFixed(2);
                                    const esMontoModificado = montoFinal !== (alumnoSeleccionado?.costoPorMes * alumnoSeleccionado?.mesesAPagar);
                                    
                                    let mensaje = `¿Está seguro de confirmar el pago de $${montoFinal.toFixed(2)}?`;
                                    if (esMontoModificado) {
                                        mensaje += `\n\n(Monto original: $${montoCalculado} - Monto modificado aplicado)`;
                                    }
                                    
                                    if (window.confirm(mensaje)) {
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado, montoFinal);
                                        setMostrarPagoModal(false);
                                    }
                                }}
                            >
                                💰 Confirmar Pago ${alumnoSeleccionado?.montoPersonalizado !== undefined ? 
                                  `$${alumnoSeleccionado.montoPersonalizado.toFixed(2)}` : 
                                  `$${(alumnoSeleccionado?.costoPorMes * alumnoSeleccionado?.mesesAPagar || 0).toFixed(2)}`}
                            </button>
                            {alumnoSeleccionado?.mesesAPagar === 12 && (
                                <button className="pago-button" onClick={async () => {
                                    const montoFinal = alumnoSeleccionado?.montoPersonalizado !== undefined ? 
                                                     alumnoSeleccionado.montoPersonalizado : 
                                                     (alumnoSeleccionado?.costoPorMes * 12);
                                    
                                    const montoCalculado = (alumnoSeleccionado?.costoPorMes * 12).toFixed(2);
                                    const esMontoModificado = montoFinal !== (alumnoSeleccionado?.costoPorMes * 12);
                                    
                                    let mensaje = `¿Está seguro de confirmar el pago anual de $${montoFinal.toFixed(2)}?`;
                                    if (esMontoModificado) {
                                        mensaje += `\n\n(Monto original: $${montoCalculado} - Monto modificado aplicado)`;
                                    }
                                    
                                    if (window.confirm(mensaje)) {
                                        handlePagoEfectivoOTransferencia(alumnoSeleccionado, montoFinal);
                                        setMostrarPagoModal(false);
                                    }
                                }}>
                                    📅 Pago de Anualidad
                                </button>
                            )}
                        </div>

                        <button onClick={() => {
                            setMostrarPagoModal(false);
                            // Limpiar el monto personalizado al cerrar
                            setAlumnoSeleccionado(prev => prev ? {
                                ...prev,
                                montoPersonalizado: undefined
                            } : null);
                        }}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal de Importación de Excel */}
            {mostrarImportModal && (
                <div className="modal">
                    <div className="modal-content import-modal">
                        <h3>📤 Importar Alumnos desde Excel</h3>
                        <p className="formato-info">
                            <strong>Formato requerido:</strong> MATRICULA | NOMBRE | APELLIDO | NUMERO TELEFONO | DISCIPLINA | ENTRENADOR | GRUPO | MENSUALIDAD | INSCRIPCION | ENE-DIC (12 meses) | FECHA DE INSCRIPCION
                        </p>

                        {!resultadoImport ? (
                            <>
                                <div className="file-upload-area">
                                    <input 
                                        type="file" 
                                        accept=".xls,.xlsx"
                                        onChange={handleArchivoExcelChange}
                                        id="excel-file-input"
                                        style={{ display: 'none' }}
                                        disabled={importandoExcel}
                                    />
                                    <label htmlFor="excel-file-input" className="file-upload-label">
                                        <div className="upload-icon">📁</div>
                                        <div className="upload-text">
                                            {archivoExcel ? archivoExcel.name : 'Seleccionar archivo Excel'}
                                        </div>
                                        <div className="upload-hint">
                                            Formatos: .xls, .xlsx (máx. 5MB)
                                        </div>
                                    </label>
                                </div>
                                
                                <div className="import-actions">
                                    <button 
                                        onClick={handleImportarExcel}
                                        disabled={!archivoExcel || importandoExcel}
                                        className="btn-procesar"
                                    >
                                        {importandoExcel ? '⏳ Procesando...' : '🚀 Procesar Archivo'}
                                    </button>
                                    <button onClick={cerrarModalImport} className="btn-cancelar">
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="resultado-import">
                                <h4>📊 Resultado de la Importación</h4>
                                
                                <div className="stats-grid">
                                    <div className="stat-box exitosos">
                                        <div className="stat-number">{resultadoImport.exitosos}</div>
                                        <div className="stat-label">✅ Creados</div>
                                    </div>
                                    <div className="stat-box fallidos">
                                        <div className="stat-number">{resultadoImport.fallidos}</div>
                                        <div className="stat-label">❌ Errores</div>
                                    </div>
                                    {resultadoImport.duplicados !== undefined && (
                                        <div className="stat-box duplicados">
                                            <div className="stat-number">{resultadoImport.duplicados}</div>
                                            <div className="stat-label">🔄 Duplicados</div>
                                        </div>
                                    )}
                                    <div className="stat-box total">
                                        <div className="stat-number">{resultadoImport.totalProcesado}</div>
                                        <div className="stat-label">📊 Total</div>
                                    </div>
                                </div>
                                
                                {resultadoImport.errores && resultadoImport.errores.length > 0 && (
                                    <div className="errores-container">
                                        <h5>❌ Errores encontrados:</h5>
                                        <div className="errores-lista">
                                            {resultadoImport.errores.map((error, index) => (
                                                <div key={index} className="error-item">
                                                    {error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {resultadoImport.registrosRechazados && resultadoImport.registrosRechazados.length > 0 && (
                                    <div className="rechazados-container">
                                        <h5>⚠️ Registros no procesados:</h5>
                                        <div className="rechazados-lista">
                                            {resultadoImport.registrosRechazados.map((registro, index) => (
                                                <div key={index} className="rechazado-item">
                                                    <div className="rechazado-header">
                                                        <strong>Fila {registro.fila}:</strong> {registro.datos.nombre} {registro.datos.apellido}
                                                    </div>
                                                    <div className="rechazado-datos">
                                                        Disciplina: {registro.datos.disciplina} | Teléfono: {registro.datos.telefono}
                                                    </div>
                                                    <div className="rechazado-motivo">
                                                        <span className="motivo-label">Motivo:</span> {registro.motivo}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <button onClick={cerrarModalImport} className="btn-cerrar-resultado">
                                    ✅ Cerrar
                                </button>
                            </div>
                        )}

                        <div className="consejos-import">
                            <h5>💡 Consejos:</h5>
                            <ul>
                                <li>Descarga la plantilla para ver el formato exacto</li>
                                <li>DISCIPLINA debe coincidir con modalidades existentes</li>
                                <li>Marca con "X" los meses pagados</li>
                                <li>MATRICULA es opcional (se genera automáticamente)</li>
                                <li>No se importarán alumnos duplicados</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default Alumnos;