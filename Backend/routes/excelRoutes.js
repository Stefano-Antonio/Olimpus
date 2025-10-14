const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  procesarArchivoExcel, 
  importarAlumnosDesdeExcel, 
  exportarAlumnosAExcel 
} = require('../utils/excelProcessor');

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos Excel
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'));
    }
  }
});

// Importar alumnos desde Excel
router.post('/importar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }
    
    // Procesar archivo Excel
    const data = procesarArchivoExcel(req.file.buffer);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío o no tiene el formato correcto' });
    }
    
    // Importar alumnos
    const resultados = await importarAlumnosDesdeExcel(data);
    
    res.status(200).json({
      message: 'Proceso de importación completado',
      exitosos: resultados.exitosos,
      fallidos: resultados.fallidos,
      errores: resultados.errores,
      totalProcesado: data.length
    });
    
  } catch (error) {
    console.error('Error al importar alumnos desde Excel:', error);
    res.status(500).json({ 
      message: 'Error al importar alumnos', 
      error: error.message 
    });
  }
});

// Exportar alumnos a Excel
router.get('/exportar', async (req, res) => {
  try {
    const buffer = await exportarAlumnosAExcel();
    
    // Configurar headers para descarga
    const filename = `alumnos_olimpus_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error al exportar alumnos a Excel:', error);
    res.status(500).json({ 
      message: 'Error al exportar alumnos', 
      error: error.message 
    });
  }
});

module.exports = router;
