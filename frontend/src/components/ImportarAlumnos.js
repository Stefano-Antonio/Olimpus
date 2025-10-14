import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ImportarAlumnos.css';

/**
 * Componente para importar alumnos desde archivo Excel formato Olimpus
 * Formato esperado:
 * | MATRICULA | NOMBRE | APELLIDO | NUMERO TELEFONO | DISCIPLINA | ENTRENADOR | GRUPO |
 * | MENSUALIDAD | INSCRIPCION | MAY | JUN | JUL | AGO | SEP | OCT | NOV | DIC | FECHA DE INSCRIPCION |
 */
const ImportarAlumnos = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleFileChange = (e) => {
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
      
      setFile(selectedFile);
      setResultado(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor selecciona un archivo');
      return;
    }
    
    setLoading(true);
    setResultado(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:7000/api/excel/importar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { exitosos, fallidos, errores, totalProcesado } = response.data;
      
      setResultado({
        exitosos,
        fallidos,
        errores,
        totalProcesado
      });
      
      if (exitosos > 0) {
        toast.success(`${exitosos} alumno(s) importado(s) exitosamente`);
        if (onImportComplete) {
          onImportComplete();
        }
      }
      
      if (fallidos > 0) {
        toast.warning(`${fallidos} registro(s) fallido(s). Revisa los errores`);
      }
      
    } catch (error) {
      console.error('Error al importar alumnos:', error);
      toast.error(error.response?.data?.message || 'Error al importar alumnos');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultado(null);
  };

  return (
    <div className="importar-alumnos-container">
      <div className="importar-header">
        <h3>Importar Alumnos desde Excel - Formato Olimpus</h3>
        <p className="formato-requerido">
          Formato requerido: MATRICULA | NOMBRE | APELLIDO | NUMERO TELEFONO | DISCIPLINA | ENTRENADOR | GRUPO | MENSUALIDAD | INSCRIPCION | MAY-DIC | FECHA DE INSCRIPCION
        </p>
      </div>
      
      <div className="importar-content">
        {!resultado && (
          <>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                id="file-upload"
                disabled={loading}
              />
              <label htmlFor="file-upload" className="file-label">
                {file ? file.name : 'Seleccionar archivo Excel'}
              </label>
            </div>
            
            <div className="importar-actions">
              <button 
                onClick={handleImport}
                disabled={!file || loading}
                className="btn-importar"
              >
                {loading ? 'Importando...' : 'Importar Alumnos'}
              </button>
            </div>
          </>
        )}
        
        {resultado && (
          <div className="resultado-importacion">
            <h4>Resultado de la Importación</h4>
            
            <div className="resultado-stats">
              <div className="stat-item success">
                <span className="stat-label">Exitosos:</span>
                <span className="stat-value">{resultado.exitosos}</span>
              </div>
              
              <div className="stat-item error">
                <span className="stat-label">Fallidos:</span>
                <span className="stat-value">{resultado.fallidos}</span>
              </div>
              
              <div className="stat-item info">
                <span className="stat-label">Total procesado:</span>
                <span className="stat-value">{resultado.totalProcesado}</span>
              </div>
            </div>
            
            {resultado.errores && resultado.errores.length > 0 && (
              <div className="errores-lista">
                <h5>Errores encontrados:</h5>
                <ul>
                  {resultado.errores.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button onClick={handleReset} className="btn-nuevo-import">
              Importar otro archivo
            </button>
          </div>
        )}
      </div>
      
      <div className="importar-tips">
        <h5>💡 Consejos para el formato Olimpus:</h5>
        <ul>
          <li>El archivo debe estar en formato Excel (.xls o .xlsx)</li>
          <li>La primera fila debe contener los encabezados exactos del formato Olimpus</li>
          <li>DISCIPLINA debe coincidir con las modalidades existentes en el sistema</li>
          <li>Marcar con "X" los meses pagados (MAY, JUN, JUL, etc.)</li>
          <li>FECHA DE INSCRIPCION en formato DD/MM/YYYY</li>
          <li>MATRICULA es opcional, se generará automáticamente si está vacía</li>
          <li>No se importarán alumnos duplicados (mismo nombre y teléfono)</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportarAlumnos;
