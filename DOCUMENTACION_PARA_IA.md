# DOCUMENTACIÓN COMPLETA - SISTEMA OLIMPUS GYMNASTICS

## 📋 RESUMEN EJECUTIVO

**Sistema de Registro de Alumnos para Gimnasio Olimpus**
- **Propósito**: Gestión integral de estudiantes de gimnasia
- **Ubicación**: Guadalupe, Zacatecas, México
- **Tecnologías**: React + Node.js + MongoDB Atlas
- **Estado**: Funcional con módulos de promociones pendientes

## 🏗️ ARQUITECTURA DEL SISTEMA

### Frontend (React.js)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Pantalla_inicio.js          # Dashboard principal
│   │   ├── Alumnos.js                  # Lista y gestión de alumnos
│   │   ├── Registrar_Alumno.js         # Formulario de registro
│   │   ├── Modalidades.js              # Gestión de clases
│   │   └── Promociones.js              # [VACÍO] Módulo futuro
│   └── App.js                          # Configuración de rutas
```

### Backend (Node.js + Express)
```
Backend/
├── models/
│   ├── alumnos.js                      # Esquema de estudiantes
│   ├── modalidades.js                  # Esquema de clases
│   ├── pagos.js                        # Registro de transacciones
│   └── promociones.js                  # [IMPLEMENTADO] Listo para uso
├── routes/
│   ├── alumnoRoutes.js                 # CRUD alumnos + cálculos
│   ├── modalidadesRoutes.js            # Modalidades + pagos + reportes
│   └── promocionesRoutes.js            # [VACÍO] Pendiente desarrollo
└── server.js                           # Servidor principal
```

## 🗄️ MODELOS DE BASE DE DATOS

### Alumno (Modelo Principal)
```javascript
{
  id_modalidad: String,         // Referencia a modalidad
  fecha_nacimiento: Date,       // Para cálculo de edad
  fecha_inscripcion: Date,      // Base para cálculo de deudas
  nombre: String,               // Nombre completo
  telefono: String,             // Contacto
  correo: String,               // Email
  pagos_realizados: Number,     // Contador de mensualidades pagadas
  pago_pendiente: Number,       // [CALCULADO] Meses pendientes
  deuda: Number                 // [CALCULADO] Monto total adeudado
}
```

### Modalidad (Tipos de Clase)
```javascript
{
  nombre: String,               // "Gimnasia Femenil", "Parkour", "Baby Gym"
  horarios: {
    lunes: String,              // "16:00-17:00" o null
    martes: String,
    miercoles: String,
    jueves: String,
    viernes: String,
    sabado: String              // Horarios especiales matutinos
  },
  costo: Number                 // Costo mensual en MXN
}
```

### Pago (Registro de Transacciones)
```javascript
{
  alumno: ObjectId,             // Referencia al alumno
  costo: Number,                // Monto pagado
  fecha: Date                   // Timestamp automático
}
```

## 🔄 FLUJOS PRINCIPALES DEL SISTEMA

### 1. Registro de Nuevo Alumno
```
Usuario llena formulario → Selecciona modalidad → 
Sistema calcula costo → Modal de opciones de pago →
Registra alumno + Primer pago → Actualiza contadores
```

### 2. Gestión de Pagos Existentes
```
Lista alumnos → Calcula deudas dinámicamente →
Selecciona alumno → Registrar pago → 
Actualiza pagos_realizados → Recalcula deuda
```

### 3. Cálculo Automático de Deudas
```javascript
// Lógica implementada en alumnoRoutes.js línea 35-55
mesesTranscurridos = fechaActual - fechaInscripcion
mesesPendientes = mesesTranscurridos - pagosRealizados  
deudaTotal = mesesPendientes * costoModalidad
```

## 🎯 FUNCIONALIDADES CLAVE

### ✅ IMPLEMENTADAS
- **Registro de alumnos**: Formulario completo con validaciones
- **Gestión de modalidades**: Creación de clases con horarios específicos
- **Sistema de pagos**: Mensualidades y anualidades
- **Cálculo automático de deudas**: Basado en fecha de inscripción
- **Reportes diarios**: Corte de caja por día
- **Búsqueda de alumnos**: Por nombre, modalidad, edad
- **Cambio de modalidades**: Con validación de pagos al día

### 🚧 EN DESARROLLO
- **Módulo de promociones**: Archivos creados pero vacíos
- **Autenticación**: No implementada (acceso libre)
- **Reportes avanzados**: Solo corte diario disponible

## 🛠️ CONFIGURACIÓN TÉCNICA

### URLs y Puertos
- **Frontend**: http://localhost:3000 (React Dev Server)
- **Backend**: http://localhost:7000 (Express Server)
- **Base de datos**: MongoDB Atlas (conexión hardcodeada)

### Dependencias Críticas
```json
// Frontend
"axios": "^1.9.0",              // Comunicación con API
"react-router-dom": "^7.5.2",   // Navegación SPA
"react-toastify": "^11.0.5"     // Notificaciones

// Backend  
"express": "^5.1.0",            // Framework web
"mongoose": "^8.14.0",          // ODM MongoDB
"cors": "^2.8.5"                // Cross-Origin requests
```

### Endpoints API Principales
```
GET  /api/alumnos                    # Lista todos los alumnos
POST /api/alumnos                    # Registra nuevo alumno
DELETE /api/alumnos/:id              # Elimina alumno

GET  /api/modalidad                  # Lista modalidades
POST /api/modalidad                  # Crea nueva modalidad
POST /api/modalidad/sumarpago        # Registra pago
POST /api/modalidad/cambiarModalidad # Cambia modalidad alumno
GET  /api/modalidad/corte-dia        # Reporte diario
```

## 🎨 DISEÑO Y UX

### Temática Visual
- **Colores principales**: Azul oscuro corporativo (#0C1A2B, #192939)
- **Elementos distintivos**: Pilares de gimnasio como decoración lateral
- **Logo**: Olimpus Gymnastics con assets personalizados
- **Responsive**: Diseño adaptativo con media queries

### Componentes Reutilizables
- **Modal de confirmación**: Usado en eliminación y pagos
- **Botones de navegación**: Estilo consistente en toda la app
- **Formularios**: Validación HTML5 + patrones personalizados
- **Tablas**: Scroll horizontal para datos extensos

## 🧠 GUÍA PARA AGENTES DE IA

### Modificaciones Comunes
1. **Agregar nueva modalidad**: Editar select en `Modalidades.js` línea 70
2. **Cambiar cálculo de deudas**: Modificar `alumnoRoutes.js` líneas 35-55  
3. **Nuevos campos en alumno**: Actualizar modelo + formulario + tabla
4. **Reportes adicionales**: Crear nuevas rutas en `modalidadesRoutes.js`

### Patrones de Código
- **Estados React**: Usar hooks funcionales (useState, useEffect)
- **API calls**: Siempre con try/catch y toast notifications
- **Validación**: HTML5 + regex patterns en inputs
- **Navegación**: React Router v6 con useNavigate

### Ubicaciones Críticas
- **Conexión DB**: `server.js` línea 26 (hardcodeada)
- **Cálculo deudas**: `alumnoRoutes.js` línea 35-55
- **Sistema pagos**: `modalidadesRoutes.js` líneas 85-105
- **Configuración CORS**: `server.js` línea 20

### Archivos Listos para Expansión
- `promocionesRoutes.js` - Completamente vacío
- `Promociones.js` - Componente vacío con imports listos
- `Promociones.css` - Archivo de estilos vacío
- Modelo `promociones.js` - Schema básico implementado

## 🚨 CONSIDERACIONES IMPORTANTES

### Seguridad
- **Sin autenticación**: Acceso libre a todas las funciones
- **Conexión DB expuesta**: Credenciales hardcodeadas en código
- **CORS abierto**: Permite requests desde cualquier origen

### Performance  
- **Populate queries**: Optimizar joins con modalidades
- **Cálculos dinámicos**: Deudas se recalculan en cada request
- **Sin paginación**: Todas las listas cargan registros completos

### Escalabilidad
- **Arquitectura lista**: Para agregar módulos (promociones, reportes)
- **Componentes modulares**: Fácil reutilización y mantenimiento  
- **API RESTful**: Endpoints bien estructurados para expansión

---

## 📞 INFORMACIÓN DE CONTACTO DEL NEGOCIO
- **Nombre**: OLIMPUS GYMNASTICS
- **Ubicación**: Blvr. Revolución Mexicana #225, Guadalupe, Zacatecas
- **Teléfono**: 492 125 3088
- **Modalidades actuales**: Gimnasia Femenil, Parkour, Baby Gym

---

*Esta documentación está diseñada para facilitar el trabajo de agentes de IA en el mantenimiento y expansión del sistema.*