import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegistrarGastos.css';

const RegistrarGastosPagos = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [view, setView] = useState('gastos'); // State to toggle between gastos and pagos

  // States for gastos
  const [gastos, setGastos] = useState([]);
  const [nombreGasto, setNombreGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState('');
  const [fechaInicioGasto, setFechaInicioGasto] = useState(today);
  const [fechaFinGasto, setFechaFinGasto] = useState(today);

  // States for pagos
  const [pagos, setPagos] = useState([]);
  const [nombrePago, setNombrePago] = useState('');
  const [montoPago, setMontoPago] = useState('');
  const [fechaInicioPago, setFechaInicioPago] = useState(today);
  const [fechaFinPago, setFechaFinPago] = useState(today);

  useEffect(() => {
    if (view === 'gastos' && fechaInicioGasto && fechaFinGasto) {
      fetchGastos();
    } else if (view === 'pagos' && fechaInicioPago && fechaFinPago) {
      fetchPagos();
    }
  }, [view, fechaInicioGasto, fechaFinGasto, fechaInicioPago, fechaFinPago]);

  const fetchGastos = async () => {
    try {
      const response = await axios.get(`http://localhost:7000/api/gastos?fechaInicio=${fechaInicioGasto}&fechaFin=${fechaFinGasto}`);
      setGastos(response.data);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    }
  };

  const fetchPagos = async () => {
    try {
      const response = await axios.get(`http://localhost:7000/api/pagos?fechaInicio=${fechaInicioPago}&fechaFin=${fechaFinPago}`);
      setPagos(response.data);
    } catch (error) {
      console.error('Error fetching pagos:', error);
    }
  };

  const handleAddGasto = async () => {
    try {
      const response = await axios.post('http://localhost:7000/api/gastos', { nombre: nombreGasto, monto: montoGasto, fecha: fechaInicioGasto });
      setGastos([...gastos, response.data]);
      setNombreGasto('');
      setMontoGasto('');
    } catch (error) {
      console.error('Error adding gasto:', error);
    }
  };

  const handleAddPago = async () => {
    try {
      const response = await axios.post('http://localhost:7000/api/pagos', { nombre: nombrePago, monto: montoPago, fecha: fechaInicioPago });
      setPagos([...pagos, response.data]);
      setNombrePago('');
      setMontoPago('');
    } catch (error) {
      console.error('Error adding pago:', error);
    }
  };

  const handleDeleteGasto = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      try {
        await axios.delete(`http://localhost:7000/api/gastos/${id}`);
        setGastos(gastos.filter(gasto => gasto._id !== id));
      } catch (error) {
        console.error('Error deleting gasto:', error);
      }
    }
  };

  const handleDeletePago = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este pago?')) {
      try {
        await axios.delete(`http://localhost:7000/api/pagos/${id}`);
        setPagos(pagos.filter(pago => pago._id !== id));
      } catch (error) {
        console.error('Error deleting pago:', error);
      }
    }
  };

  return (
    <div className="registrar-gastos-pagos-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '150px' }}>
      <div className="registrar-gastos-pagos-wrapper" style={{ border: '2px solid #000', padding: '20px', borderRadius: '10px', backgroundColor: '#fff', width: '80%', margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="registrar-gastos-pagos-back-button" 
            style={{ backgroundColor: '#000', color: '#fff', padding: '10px', borderRadius: '5px' }}
          >
            Regresar
          </button>
          <div className="registrar-gastos-pagos-toggle" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setView('gastos')} className={view === 'gastos' ? 'active' : ''} style={{ backgroundColor: '#000', color: '#fff', padding: '10px', borderRadius: '5px' }}>Gastos</button>
            <button onClick={() => setView('pagos')} className={view === 'pagos' ? 'active' : ''} style={{ backgroundColor: '#000', color: '#fff', padding: '10px', borderRadius: '5px' }}>Pagos</button>
          </div>
        </div>
        {view === 'gastos' ? (
          <div>
            <h1 className="registrar-gastos-title">Registrar Gastos</h1>
            <div className="registrar-gastos-form">
              <label>Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicioGasto}
                onChange={(e) => setFechaInicioGasto(e.target.value)}
                className="registrar-gastos-input"
              />
              <label>Fecha Fin:</label>
              <input
                type="date"
                value={fechaFinGasto}
                onChange={(e) => setFechaFinGasto(e.target.value)}
                className="registrar-gastos-input"
              />
              <input
                type="text"
                placeholder="Nombre del gasto"
                value={nombreGasto}
                onChange={(e) => setNombreGasto(e.target.value)}
                className="registrar-gastos-input"
              />
              <input
                type="number"
                placeholder="Monto del gasto"
                value={montoGasto}
                onChange={(e) => setMontoGasto(e.target.value)}
                className="registrar-gastos-input"
              />
              <button onClick={handleAddGasto} className="registrar-gastos-button">Agregar Gasto</button>
            </div>
            <table className="registrar-gastos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Monto</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Fecha</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto._id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{gasto.nombre}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>${gasto.monto}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{new Date(gasto.fecha).toLocaleDateString()}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => handleDeleteGasto(gasto._id)} className="registrar-gastos-delete-button">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : view === 'pagos' ? (
          <div>
            <h1 className="registrar-gastos-title">Administrar Pagos</h1>
            <div className="registrar-gastos-form">
              <label>Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicioPago}
                onChange={(e) => setFechaInicioPago(e.target.value)}
                className="registrar-gastos-input"
              />
              <label>Fecha Fin:</label>
              <input
                type="date"
                value={fechaFinPago}
                onChange={(e) => setFechaFinPago(e.target.value)}
                className="registrar-gastos-input"
              />
            </div>
            <table className="registrar-gastos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nombre</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Monto</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Fecha</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago._id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{pago.concepto}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>${pago.costo.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{new Date(pago.fecha).toLocaleDateString()}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => handleDeletePago(pago._id)} className="registrar-pagos-delete-button">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RegistrarGastosPagos;