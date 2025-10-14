import React from 'react';
import './EstadoPagoIndicador.css';

/**
 * Componente de indicador visual de estado de pago (semáforo)
 * Estados:
 * - verde: Al día (sin deudas)
 * - amarillo: Por vencer (3 días antes de la fecha de pago)
 * - rojo: Atrasado (después de la fecha límite)
 */
const EstadoPagoIndicador = ({ estado, diasVencidos = 0 }) => {
  const obtenerTextoEstado = () => {
    switch(estado) {
      case 'verde':
        return 'Al día';
      case 'amarillo':
        return 'Por vencer';
      case 'rojo':
        return 'Atrasado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className={`estado-pago-indicador semaforo-${estado}`}>
      <span className="icono-estado">●</span>
      <span className="texto-estado">{obtenerTextoEstado()}</span>
      {diasVencidos > 0 && (
        <span className="dias-atraso">+{diasVencidos} días</span>
      )}
    </div>
  );
};

export default EstadoPagoIndicador;
