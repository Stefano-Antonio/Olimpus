import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Modalidades.css";
import Pilares from '../assest/pilar_olimpus.jpg';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

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
    id_entrenador: '',
    grupo: ''
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

  // Función para generar y descargar lista de asistencia en Word
  const descargarListaAsistencia = async (modalidad) => {
    try {
      toast.info('Generando lista de asistencia en Word...');
      
      // Obtener alumnos de esta modalidad
      const response = await axios.get(`http://localhost:7000/api/alumnos`);
      const todosLosAlumnos = response.data;
      
      // Filtrar alumnos que tienen esta modalidad asignada y están activos
      const alumnosModalidad = todosLosAlumnos.filter(alumno => 
        alumno.activo !== false && 
        alumno.id_modalidad && 
        (typeof alumno.id_modalidad === 'object' 
          ? alumno.id_modalidad._id === modalidad._id 
          : alumno.id_modalidad === modalidad._id)
      );

      if (alumnosModalidad.length === 0) {
        toast.warning('No hay alumnos registrados en esta modalidad');
        return;
      }

      // Generar los días del mes actual
      const fechaActual = new Date();
      const año = fechaActual.getFullYear();
      const mes = fechaActual.getMonth();
      const diasEnMes = new Date(año, mes + 1, 0).getDate();
      const nombreMes = fechaActual.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      
      // Crear header de la tabla (primera fila)
      const headerCells = [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: "ALUMNO", bold: true })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 3000, type: WidthType.DXA },
        })
      ];

      // Agregar columnas para cada día del mes
      for (let dia = 1; dia <= diasEnMes; dia++) {
        headerCells.push(
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: dia.toString(), bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            width: { size: 800, type: WidthType.DXA },
          })
        );
      }

      // Crear filas para cada alumno
      const alumnoRows = alumnosModalidad.map(alumno => {
        const cells = [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: alumno.nombre_completo || `${alumno.nombre} ${alumno.apellido}` })],
            })],
            width: { size: 3000, type: WidthType.DXA },
          })
        ];

        // Agregar celdas vacías para cada día
        for (let dia = 1; dia <= diasEnMes; dia++) {
          cells.push(
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
              width: { size: 800, type: WidthType.DXA },
            })
          );
        }

        return new TableRow({ children: cells });
      });

      // Crear la tabla completa
      const table = new Table({
        rows: [
          new TableRow({ children: headerCells }),
          ...alumnoRows
        ],
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        },
      });

      // Crear el documento Word
      const doc = new Document({
        sections: [
          {
            children: [
              // Título principal
              new Paragraph({
                children: [
                  new TextRun({
                    text: "🏃‍♂️ OLIMPUS - LISTA DE ASISTENCIA",
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              // Título de modalidad
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${modalidad.nombre.toUpperCase()} - GRUPO ${modalidad.grupo || '-'}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              // Mes
              new Paragraph({
                children: [
                  new TextRun({
                    text: nombreMes.toUpperCase(),
                    bold: true,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              // Información de la modalidad
              new Paragraph({
                children: [
                  new TextRun({ text: "Modalidad: ", bold: true }),
                  new TextRun({ text: modalidad.nombre }),
                  new TextRun({ text: " | " }),
                  new TextRun({ text: "Grupo: ", bold: true }),
                  new TextRun({ text: modalidad.grupo || 'Sin grupo' }),
                  new TextRun({ text: " | " }),
                  new TextRun({ text: "Horarios: ", bold: true }),
                  new TextRun({ text: modalidad.horarios || 'No especificado' }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: "Entrenador: ", bold: true }),
                  new TextRun({ text: modalidad.entrenador || 'Sin asignar' }),
                  new TextRun({ text: " | " }),
                  new TextRun({ text: "Total Alumnos: ", bold: true }),
                  new TextRun({ text: alumnosModalidad.length.toString() }),
                ],
                spacing: { after: 400 },
              }),
              // Tabla de asistencia
              table,
              // Sección de notas
              new Paragraph({
                children: [
                  new TextRun({
                    text: "📝 NOTAS Y OBSERVACIONES:",
                    bold: true,
                    size: 16,
                  }),
                ],
                spacing: { before: 600, after: 200 },
              }),
              // Líneas para notas
              ...Array.from({ length: 5 }, () => 
                new Paragraph({
                  children: [new TextRun({ text: "_".repeat(100) })],
                  spacing: { after: 200 },
                })
              ),
              // Pie de página
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Lista generada el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
                    size: 16,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      // Generar el archivo y descargarlo
      const blob = await Packer.toBlob(doc);
      
      saveAs(blob, `Lista_Asistencia_${modalidad.nombre}_Grupo${modalidad.grupo || 'X'}_${nombreMes.replace(' ', '_')}.docx`);

      toast.success(`Lista de asistencia Word descargada: ${alumnosModalidad.length} alumnos`);

    } catch (error) {
      console.error('Error al generar lista de asistencia:', error);
      toast.error('Error al generar la lista de asistencia en Word');
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
          [id]: value,
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
      id_entrenador: modalidad.id_entrenador || '',
      grupo: modalidad.grupo || ''
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
        form.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const cancelarEdicion = () => {
    setFormData({
      nombre: '',
      horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
      costo: '',
      id_entrenador: '',
      grupo: ''
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
      // Crear el string de horarios
      const horariosArray = [];
      const diasAbrev = {
        lunes: 'L',
        martes: 'M',
        miercoles: 'Mi',
        jueves: 'J',
        viernes: 'V',
        sabado: 'S'
      };

      Object.entries(formData.horarios).forEach(([dia, horario]) => {
        if (horario && horario !== '') {
          horariosArray.push(`${diasAbrev[dia]}:${horario}`);
        }
      });

      const modalidadData = {
        nombre: formData.nombre,
        horarios: horariosArray.join(' - '),
        costo: parseFloat(formData.costo),
        id_entrenador: formData.id_entrenador || null,
        grupo: formData.grupo || null
      };

      if (modoEdicion) {
        // Actualizar modalidad existente
        await axios.put(`http://localhost:7000/api/modalidad/${editandoModalidad}`, modalidadData);
        toast.success('Modalidad actualizada exitosamente');
        cancelarEdicion();
      } else {
        // Crear nueva modalidad
        await axios.post('http://localhost:7000/api/modalidad', modalidadData);
        toast.success('Modalidad agregada exitosamente');
        setFormData({
          nombre: '',
          horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
          costo: '',
          id_entrenador: '',
          grupo: ''
        });
      }
      
      await cargarModalidades();
    } catch (error) {
      console.error('Error al procesar modalidad:', error);
      toast.error('Error al procesar modalidad');
    }
  };
    
return (
  <div className="materia-layout">
    <img src={Pilares} alt="Pilar izquierdo" className="pilar" />
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
              <label htmlFor="grupo">Grupo (Letra)</label>
              <input
                type="text"
                id="grupo"
                value={formData.grupo}
                onChange={(e) => {
                  const valor = e.target.value.toUpperCase();
                  if (valor === '' || /^[A-Z]$/.test(valor)) {
                    setFormData({ ...formData, grupo: valor });
                  }
                }}
                placeholder="A, B, C..."
                maxLength="1"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="help-text">
                Letra que identifica esta modalidad para importación Excel. Se asigna automáticamente si se deja vacío.
              </p>
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
                      <option value="10:00-12:00">10:00am-12:00pm</option>
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
                  <th>Grupo</th>
                  <th>Nombre</th>
                  <th>Horarios</th>
                  <th>Costo</th>
                  <th>Entrenador</th>
                  <th>Alumnos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modalidades.map((modalidad) => (
                  <tr key={modalidad._id}>
                    <td>
                      <span className="grupo-badge">
                        {modalidad.grupo || '-'}
                      </span>
                    </td>
                    <td>{modalidad.nombre}</td>
                    <td>{modalidad.horarios}</td>
                    <td>${modalidad.costo}</td>
                    <td>
                      <select
                        value={modalidad.id_entrenador || ''}
                        onChange={async (e) => {
                          try {
                            await axios.put(`http://localhost:7000/api/modalidad/${modalidad._id}`, {
                              ...modalidad,
                              id_entrenador: e.target.value || null
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
                      <button
                        onClick={() => descargarListaAsistencia(modalidad)}
                        className="btn-lista-asistencia"
                        title="Descargar lista de asistencia en Word"
                      >
                        📋 Lista
                      </button>
                    </td>
                    <td>
                      <div className="modalidad-acciones">
                        <button
                          onClick={() => eliminarModalidad(modalidad._id, modalidad.nombre)}
                          className="btn-eliminar-modalidad"
                          title="Eliminar modalidad"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => editarModalidad(modalidad)}
                          className="btn-editar-modalidad"
                          title="Editar modalidad"
                        >
                          ✏️
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
    <img src={Pilares} alt="Pilar derecho" className="pilar" />
    {mostrarModal && (
      <div className="modal">
        <div className="modal-content">
          <h3>Subir base de datos</h3>
          <p>Seleccione el archivo a subir:</p>
          <button onClick={() => setMostrarModal(false)}>Cerrar</button>
        </div>
      </div>
    )}
    <ToastContainer />
  </div>
);
}

export default Modalidades;