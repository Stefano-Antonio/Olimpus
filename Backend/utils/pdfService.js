// =================================================================
// SERVICIO DE GENERACIÓN DE PDFs
// =================================================================
// Este archivo maneja la generación de reportes en PDF

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Función para generar PDF del corte diario
const generarPDFCorte = async (fechaCorte, pagosCorte, totalCorte, resumenCorte) => {
  let browser;
  try {
    // Configurar Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Formatear fecha
    const fechaFormateada = new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Crear HTML para el PDF
    const htmlContent = generarHTMLCorte(fechaFormateada, pagosCorte, totalCorte, resumenCorte);
    
    // Configurar el contenido de la página
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    // Generar nombre del archivo temporal
    const nombreArchivo = `Corte_${fechaCorte}_${Date.now()}.pdf`;
    const rutaArchivo = path.join(__dirname, '..', 'temp', nombreArchivo);
    
    // Crear directorio temp si no existe
    const dirTemp = path.dirname(rutaArchivo);
    await fs.mkdir(dirTemp, { recursive: true });
    
    // Generar PDF
    await page.pdf({
      path: rutaArchivo,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    console.log(`✅ PDF generado: ${rutaArchivo}`);
    return rutaArchivo;
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Función para generar el HTML del reporte
const generarHTMLCorte = (fechaFormateada, pagosCorte, totalCorte, resumenCorte) => {
  // Generar filas de la tabla de pagos
  const filasPagos = pagosCorte.map(pago => `
    <tr>
      <td>${pago.alumno?.nombre || 'Desconocido'}</td>
      <td>
        <span class="concepto-badge ${(pago.concepto || 'mensualidad').toLowerCase()}">
          ${pago.concepto || 'Mensualidad'}
        </span>
      </td>
      <td class="amount">$${pago.costo.toFixed(2)}</td>
      <td>${new Date(pago.fecha).toLocaleString('es-MX')}</td>
    </tr>
  `).join('');

  // Generar resumen por concepto
  const resumenHTML = Object.entries(resumenCorte || {}).map(([concepto, datos]) => `
    <div class="concepto-resumen">
      <span class="concepto-badge ${concepto.toLowerCase()}">${concepto}</span>: 
      ${datos.cantidad} pago${datos.cantidad !== 1 ? 's' : ''} - $${datos.total.toFixed(2)}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corte Diario - Olimpus Gymnastics</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
        }
        
        .header {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header h2 {
          font-size: 1.5em;
          font-weight: 300;
          margin-bottom: 5px;
        }
        
        .header .fecha {
          font-size: 1.2em;
          opacity: 0.9;
        }
        
        .content {
          padding: 0 20px;
        }
        
        .resumen-section {
          background: #e8f4fd;
          border-left: 5px solid #4a90e2;
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 0 8px 8px 0;
        }
        
        .total-box {
          background: #27ae60;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.5em;
          font-weight: bold;
        }
        
        .concepto-resumen {
          margin: 8px 0;
          font-size: 14px;
        }
        
        .concepto-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          text-transform: uppercase;
        }
        
        .concepto-badge.mensualidad { background: #3498db; }
        .concepto-badge.inscripcion { background: #e74c3c; }
        .concepto-badge.anualidad { background: #9b59b6; }
        .concepto-badge.recargo { background: #f39c12; }
        
        .tabla-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.3em;
        }
        
        .pagos-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .pagos-table th {
          background: #34495e;
          color: white;
          padding: 15px 10px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        
        .pagos-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #ecf0f1;
          vertical-align: middle;
        }
        
        .pagos-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .pagos-table tr:hover {
          background-color: #e3f2fd;
        }
        
        .amount {
          font-weight: bold;
          color: #27ae60;
          text-align: right;
        }
        
        .no-pagos {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
          font-style: italic;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .footer {
          margin-top: 40px;
          padding: 20px;
          text-align: center;
          border-top: 2px solid #ecf0f1;
          color: #7f8c8d;
          font-size: 12px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-box {
          background: white;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          border-left: 4px solid #4a90e2;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .stat-number {
          font-size: 2em;
          font-weight: bold;
          color: #2c3e50;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏃‍♀️ OLIMPUS GYMNASTICS</h1>
          <h2>Corte Diario de Pagos</h2>
          <div class="fecha">${fechaFormateada}</div>
        </div>
        
        <div class="content">
          <div class="resumen-section">
            <div class="total-box">
              💰 Total Recaudado: $${totalCorte ? totalCorte.toFixed(2) : '0.00'}
            </div>
            
            ${resumenHTML ? `
              <h4 style="color: #2c3e50; margin-bottom: 15px;">📊 Resumen por Concepto:</h4>
              ${resumenHTML}
            ` : ''}
            
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number">${pagosCorte.length}</div>
                <div class="stat-label">📋 Pagos Registrados</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${new Set(pagosCorte.map(p => p.alumno?._id)).size}</div>
                <div class="stat-label">👥 Alumnos Distintos</div>
              </div>
            </div>
          </div>
          
          <div class="tabla-section">
            <h3>📋 Detalle de Pagos</h3>
            
            ${pagosCorte.length > 0 ? `
              <table class="pagos-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasPagos}
                </tbody>
              </table>
            ` : `
              <div class="no-pagos">
                <h4>📭 No se registraron pagos en esta fecha</h4>
                <p>No hay movimientos financieros para mostrar.</p>
              </div>
            `}
          </div>
        </div>
        
        <div class="footer">
          <p>📄 Reporte generado automáticamente por el Sistema Olimpus Gymnastics</p>
          <p>🕐 Fecha de generación: ${new Date().toLocaleString('es-MX')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generarPDFCorte
};