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
  // Filtro de nombre para la tabla de modalidades
  const [filtroNombreModalidad, setFiltroNombreModalidad] = useState("");
  // ...existing code...

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

  // Estados para entrenadores y modalidades
  const [entrenadores, setEntrenadores] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [editandoModalidad, setEditandoModalidad] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [gruposUsados, setGruposUsados] = useState([]);
  
  // Estados para mostrar/ocultar secciones - inicial: mostrar tabla, formulario oculto
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarTabla, setMostrarTabla] = useState(true);

  // Modalidades filtradas y ordenadas por grupo (letra)
  const modalidadesFiltradas = (modalidades || [])
    .filter(m => {
      if (!filtroNombreModalidad) return true;
      return m.nombre === filtroNombreModalidad;
    })
    .sort((a, b) => {
      // Ordenar por grupo (letra) alfabéticamente
      if (!a.grupo && !b.grupo) return 0;
      if (!a.grupo) return 1;
      if (!b.grupo) return -1;
      return a.grupo.localeCompare(b.grupo);
    });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const modalidadesPorPagina = 8;
  const totalPaginas = Math.ceil(modalidadesFiltradas.length / modalidadesPorPagina);
  const inicio = (paginaActual - 1) * modalidadesPorPagina;
  const fin = inicio + modalidadesPorPagina;
  const modalidadesPagina = modalidadesFiltradas.slice(inicio, fin);

  // Obtener nombres únicos de modalidades para el select
  const nombresUnicos = Array.from(new Set((modalidades || []).map(m => m.nombre)));
  
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

  // Calcular grupos usados por tipo de modalidad
  useEffect(() => {
    if (formData.nombre && modalidades.length > 0) {
      const modalidadesMismoTipo = modalidades.filter(m => m.nombre === formData.nombre);
      const grupos = modalidadesMismoTipo
        .map(m => m.grupo)
        .filter(g => g && g !== '-')
        .sort();
      setGruposUsados(grupos);
    } else {
      setGruposUsados([]);
    }
  }, [formData.nombre, modalidades]);

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
      console.log('Modalidades crudas cargadas:', response.data);
      const datos = (response.data || []).map(m => ({
        ...m,
        horarios: typeof m.horarios === 'string' ? parseHorarios(m.horarios) : m.horarios
      }));
      console.log('Modalidades normalizadas:', datos);
      setModalidades(datos);
      return datos;
    } catch (error) {
      console.error('Error al cargar modalidades:', error);
      toast.error('Error al cargar modalidades');
      return [];
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
      
      // Crear header de la tabla (primera fila) - usar tamaño y espaciado reducido para filas compactas
      const headerCells = [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: "ALUMNO", bold: true, size: 14 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: 200 }
          })],
          width: { size: 4000, type: WidthType.DXA },
          verticalAlign: "center",
          margins: { top: 100, bottom: 100 }
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
        // Crear celdas con espaciado mínimo y tamaño de fuente reducido para filas compactas
        const cells = [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: (alumno.nombre_completo && String(alumno.nombre_completo).replace(/\s+/g,' ')) || `${alumno.nombre || ''} ${alumno.apellido || ''}`, size: 14 })],
              spacing: { before: 0, after: 0, line: 200 },
            })],
            width: { size: 4000, type: WidthType.DXA },
            verticalAlign: "center",
            margins: { top: 100, bottom: 100 }
          })
        ];

        // Agregar celdas vacías para cada día con formato compacto
        for (let dia = 1; dia <= diasEnMes; dia++) {
          cells.push(
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: " ", size: 14 })], spacing: { before: 0, after: 0, line: 200 } })],
              width: { size: 600, type: WidthType.DXA },
              verticalAlign: "center",
              margins: { top: 80, bottom: 80 }
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

  // Helper: formatear horarios para mostrar en la tabla como cadena
  const formatHorariosForDisplay = (horarios) => {
    if (!horarios) return '-';
    // Si viene como objeto (modelo), unir los días que tengan valor
    if (typeof horarios === 'object' && horarios !== null) {
      const parts = [];
      const dias = { lunes: 'L', martes: 'M', miercoles: 'Mi', jueves: 'J', viernes: 'V', sabado: 'S' };
      Object.entries(dias).forEach(([key, abrev]) => {
        const val = horarios[key];
        if (val && val !== null && String(val).trim() !== '') {
          parts.push(`${abrev}:${val}`);
        }
      });
      return parts.length > 0 ? parts.join(' - ') : '-';
    }

    // Si viene como string, retornarla tal cual
    if (typeof horarios === 'string') {
      return horarios || '-';
    }

    return '-';
  };

  // Helper: parsear string de horarios (ej. "L-16:00-17:00 - Mi-18:00-19:00") a objeto
  const parseHorarios = (h) => {
    const result = { lunes: null, martes: null, miercoles: null, jueves: null, viernes: null, sabado: null };
    if (h === null || h === undefined) return result;
    const raw = String(h).trim();
    if (raw === '' || raw === '-' || raw.toLowerCase() === 'null' || raw === '-null') return result;

    // Primero: detectar formato compacto donde al final hay un rango horario
    // Ej: "L-J-V-16:00-17:00" o "L-M-Mi-J-V-S-16:00-18:00"
    const timeRangeMatch = raw.match(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})$/);
    const map = { l: 'lunes', m: 'martes', mi: 'miercoles', j: 'jueves', v: 'viernes', s: 'sabado' };

    if (timeRangeMatch) {
      const timeRange = timeRangeMatch[1];
      // obtener la parte de días antes del rango
      const daysPart = raw.slice(0, timeRangeMatch.index).replace(/[-,;\s]+$/,'').trim();
      // separar tokens por '-' o ',' o espacios
      const tokens = daysPart.split(/-|,|\s+/).map(t => t.trim()).filter(Boolean);
      tokens.forEach(tok => {
        let key = tok.toLowerCase();
        if (key !== 'mi') key = key.charAt(0);
        const dia = map[key];
        if (dia) {
          result[dia] = timeRange;
        }
      });
      return result;
    }

    // Si no es formato compacto, separar por ' - ' o ';' o ',' y parsear cada segmento
    const parts = raw.split(/\s-\s|;|,/).map(p => p.trim()).filter(Boolean);

    parts.forEach(part => {
      const m = part.match(/^([A-Za-z]{1,2})[:\-\s](.+)$/);
      if (m) {
        let key = m[1].toLowerCase();
        if (key !== 'mi') key = key.charAt(0);
        const dia = map[key];
        if (dia) {
          let horario = m[2].trim();
          if (horario === '' || horario === '-' || horario.toLowerCase() === 'null') {
            result[dia] = null;
          } else {
            result[dia] = horario;
          }
        }
      }
    });

    return result;
  };

  // Opciones por defecto para selects
  const weekdayOptions = [
    '16:00-17:00',
    '16:00-18:00',
    '17:00-18:00',
    '17:00-19:00',
    '18:00-19:00',
    '18:00-20:00',
    '19:00-20:00'
  ];
  const saturdayOptions = ['10:00-11:00','11:00-12:00','10:00-12:00'];

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
    console.log('Horarios originales raw:', modalidad.horarios, 'Tipo:', typeof modalidad.horarios);
    
    // Parsear los horarios del string guardado (ej: "L:16:00-17:00 - Mi:18:00-19:00")
    const horariosReconstruidos = {
      lunes: '',
      martes: '',
      miercoles: '',
      jueves: '',
      viernes: '',
      sabado: ''
    };

    // Si hay horarios guardados, parsearlos según el formato que venga del backend
  if (modalidad.horarios) {
  if (typeof modalidad.horarios === 'object' && modalidad.horarios !== null) {
        // Si viene como objeto (formato del modelo), iterar los días conocidos para asegurar valores
        const diasOrden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        diasOrden.forEach(dia => {
          const horario = modalidad.horarios[dia];
          if (horario && horario !== null && String(horario).trim() !== '') {
            horariosReconstruidos[dia] = String(horario).trim();
          } else {
            horariosReconstruidos[dia] = '-';
          }
        });
      } else if (typeof modalidad.horarios === 'string') {
        // Si viene como string (formato de la ruta GET), parsearlo con mapeo case-insensitive
        const diasMapLower = {
          'l': 'lunes',
          'm': 'martes',
          'mi': 'miercoles',
          'j': 'jueves',
          'v': 'viernes',
          's': 'sabado'
        };

        // Dividir por ' - ' para obtener cada día:horario
        const partesHorarios = modalidad.horarios.split(' - ');

        partesHorarios.forEach(parte => {
          // Buscar patrón: DIA:HORARIO (ej: "L:16:00-17:00")
          const match = parte.match(/^([A-Za-z]+):(.+)$/);
          if (match) {
            const [, diaAbrev, horario] = match;
            const key = diaAbrev.toLowerCase();
            const diaNombre = diasMapLower[key];
            if (diaNombre) {
              horariosReconstruidos[diaNombre] = horario && horario.trim() !== '' ? horario.trim() : '-';
            }
          }
        });

        // Asegurar que los días no presentes en la cadena reciban '-'
        ['lunes','martes','miercoles','jueves','viernes','sabado'].forEach(d => {
          if (!horariosReconstruidos[d] || horariosReconstruidos[d] === '') {
            horariosReconstruidos[d] = '-';
          }
        });
      }
    }

    console.log('Horarios reconstruidos para formulario:', horariosReconstruidos);

    console.log('Horarios reconstruidos:', horariosReconstruidos);

    setFormData({
      nombre: modalidad.nombre,
      horarios: horariosReconstruidos,
      costo: modalidad.costo != null ? String(modalidad.costo) : '',
      id_entrenador: modalidad.id_entrenador || '',
      grupo: modalidad.grupo || ''
    });
    
    setEditandoModalidad(modalidad._id);
    setModoEdicion(true);
    
    // Asegurarse de que el formulario esté visible
    // Mostrar el formulario y ocultar la tabla de forma consistente
    setMostrarFormulario(true);
    setMostrarTabla(false);
    
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
    
    // Cerrar el formulario y volver a mostrar la tabla
    setMostrarFormulario(false);
    setMostrarTabla(true);
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
      // Validar que se haya ingresado al menos un campo requerido
      if (!formData.nombre.trim()) {
        toast.error('El nombre de la modalidad es requerido');
        return;
      }

      if (!formData.costo || parseFloat(formData.costo) <= 0) {
        toast.error('El costo debe ser mayor a 0');
        return;
      }

      // Procesar horarios - crear objeto en el formato que espera el modelo
      const horariosParaEnviar = {};
      
      Object.entries(formData.horarios).forEach(([dia, horario]) => {
        if (horario && horario.trim() !== '' && horario !== '-') {
          horariosParaEnviar[dia] = horario.trim();
        } else {
          horariosParaEnviar[dia] = null;
        }
      });

      const modalidadData = {
        nombre: formData.nombre.trim(),
        horarios: horariosParaEnviar,
        costo: parseFloat(formData.costo),
        id_entrenador: formData.id_entrenador || null,
        grupo: formData.grupo?.trim() || null
      };

      console.log('Datos a enviar:', modalidadData);

      // Guardaremos el id del elemento afectado para buscar su página después
      let savedId = null;
      if (modoEdicion) {
        // Actualizar modalidad existente
        savedId = editandoModalidad;
        const response = await axios.put(`http://localhost:7000/api/modalidad/${editandoModalidad}`, modalidadData);
        console.log('Modalidad actualizada:', response.data);
        toast.success('Modalidad actualizada exitosamente');
        // limpiar modo edición pero no antes de guardar el id
        cancelarEdicion();
      } else {
        // Crear nueva modalidad
        const response = await axios.post('http://localhost:7000/api/modalidad', modalidadData);
        console.log('Modalidad creada:', response.data);
        toast.success('Modalidad agregada exitosamente');
        // Intentar obtener id del nuevo recurso devuelto por la API
        if (response && response.data && response.data._id) savedId = response.data._id;

        // Limpiar formulario después de crear
        setFormData({
          nombre: '',
          horarios: { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '' },
          costo: '',
          id_entrenador: '',
          grupo: ''
        });
      }

      // Recargar la lista de modalidades para reflejar los cambios
      const datos = await cargarModalidades();
      // Mostrar tabla y cerrar formulario
      setMostrarTabla(true);
      setMostrarFormulario(false);

      // Si tenemos id del elemento afectado, calcular la página donde aparece y navegar a ella
      if (savedId && datos.length > 0) {
        const idx = datos.findIndex(d => d._id === savedId);
        if (idx >= 0) {
          const nuevaPagina = Math.floor(idx / modalidadesPorPagina) + 1;
          setPaginaActual(nuevaPagina);
        }
      }
    } catch (error) {
      console.error('Error al procesar modalidad:', error);
      toast.error('Error al procesar modalidad');
    }
  };
    
return (
  <div className="materia-layout">
    <div className="materia-container">
      <div className="top-left">
        <button className="back-button" onClick={handleBack}>Regresar</button>
      </div>
      
      {/* Formulario aparece en panel flotante cuando mostrarFormulario === true */}
      {mostrarFormulario && (
        <div className="materia-content form-panel">
          <div className="form-header">
            <h1>{modoEdicion ? 'Editar Modalidad' : 'Agregar Modalidad'}</h1>
            </div>
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
                Letra que identifica esta modalidad para importación Excel. Cada modalidad del mismo tipo (nombre) debe tener una letra diferente. Se asigna automáticamente si se deja vacío.
                {formData.nombre && gruposUsados.length > 0 && (
                  <span style={{ display: 'block', marginTop: '5px', fontWeight: 'bold', color: '#e74c3c' }}>
                    🚫 Grupos ya usados en "{formData.nombre}": {gruposUsados.join(', ')}
                  </span>
                )}
                {formData.nombre && gruposUsados.length === 0 && (
                  <span style={{ display: 'block', marginTop: '5px', fontWeight: 'bold', color: '#27ae60' }}>
                    ✅ Primer grupo para "{formData.nombre}" - se asignará "A" automáticamente
                  </span>
                )}
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
                  <option value="-">- (Sin horario)</option>
                  {dia === "sabado" ? (
                    <>
                      {saturdayOptions.map(opt => (
                        <option key={opt} value={opt}>{opt.replace(':00','').replace('-','-')}</option>
                      ))}
                      {/* Si el valor actual no está entre las opciones, mostrarlo para no perderlo */}
                      {formData.horarios[dia] && formData.horarios[dia] !== '-' && !saturdayOptions.includes(formData.horarios[dia]) && (
                        <option value={formData.horarios[dia]}>{formData.horarios[dia]}</option>
                      )}
                    </>
                  ) : (
                    <>
                      {weekdayOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {formData.horarios[dia] && formData.horarios[dia] !== '-' && !weekdayOptions.includes(formData.horarios[dia]) && (
                        <option value={formData.horarios[dia]}>{formData.horarios[dia]}</option>
                      )}
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
            <button type="button" onClick={() => { cancelarEdicion(); setMostrarFormulario(false); }} className="button button-secondary">
              Cerrar
            </button>
          </div>
        </form>
      </div>
      )}

      
      {mostrarTabla && (
      <div className={`modalidades-existentes`} style={{flex: 1, minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        {/* Filtro de nombre y paginación juntos */}
        <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label htmlFor="filtro-nombre" style={{ fontWeight: 'bold' }}>Filtrar por nombre:</label>
          <select
            id="filtro-nombre"
            value={filtroNombreModalidad}
            onChange={e => {
              setFiltroNombreModalidad(e.target.value);
              setPaginaActual(1); // Resetear a la primera página al cambiar filtro
            }}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px' }}
          >
            <option value="">Todas</option>
            {nombresUnicos.map(nombre => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
          {/* Paginación al lado del filtro */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccc', background: paginaActual === 1 ? '#eee' : '#fff', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
              >
                ◀
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPaginaActual(i + 1)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: paginaActual === i + 1 ? '#007bff' : '#fff',
                    color: paginaActual === i + 1 ? '#fff' : '#333',
                    fontWeight: paginaActual === i + 1 ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccc', background: paginaActual === totalPaginas ? '#eee' : '#fff', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}
              >
                ▶
              </button>
            </div>
      )}

      {/* Botón para agregar modalidad debajo de la tabla */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
        <button
          className="button"
          onClick={() => {
            // Abrir formulario en modo creación
            setModoEdicion(false);
            setEditandoModalidad(null);
            setFormData({ nombre: '', horarios: { lunes: '-', martes: '-', miercoles: '-', jueves: '-', viernes: '-', sabado: '-' }, costo: '', id_entrenador: '', grupo: '' });
            setMostrarFormulario(true);
            setMostrarTabla(false);
          }}
        >
          ➕ Agregar Modalidad
        </button>
      </div>
        </div>
        {console.log('Estado actual de modalidades:', modalidades)}
        {modalidadesFiltradas.length === 0 ? (
          <p className="no-modalidades">No hay modalidades registradas</p>
        ) : (
          <>
            <div className="table-container" style={{overflowX: 'auto', width: '100%', maxWidth: '100%', maxHeight: '400px', marginBottom: '20px', boxSizing: 'border-box'}}>
              <table className="modalidades-table" style={{minWidth: '700px', width: '100%', tableLayout: 'auto'}}>
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
                  {modalidadesPagina.map((modalidad) => (
                    <tr key={modalidad._id}>
                      <td>
                        <span className="grupo-badge">
                          {modalidad.grupo || '-'}
                        </span>
                      </td>
                      <td>{modalidad.nombre}</td>
                      <td>{formatHorariosForDisplay(modalidad.horarios)}</td>
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
            {/* Paginación movida al lado del filtro */}
          </>
        )}
      </div>
      )}
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
    <ToastContainer />
  </div>
);
}

export default Modalidades;