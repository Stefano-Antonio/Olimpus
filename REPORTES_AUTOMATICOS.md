# 📧 Sistema de Reportes Automáticos - Olimpus Gymnastics

## 🎯 Funcionalidad Implementada

El sistema ahora incluye un **servicio de reportes automáticos** que envía por correo electrónico todos los días a las **8:00 PM**:

### 📦 Contenido del Reporte
1. **📊 Archivo Excel**: Base de datos completa de alumnos (igual al que se descarga manualmente)
2. **💰 Archivo PDF**: Reporte detallado del corte del día con:
   - Total recaudado del día
   - Lista de todos los pagos realizados
   - Resumen por concepto (mensualidad, inscripción, anualidad, etc.)
   - Estadísticas generales

### ⚙️ Configuración Requerida

#### 1. Variables de Entorno
Crea un archivo `.env` en la carpeta `Backend/` con la siguiente configuración:

```env
# Configuración de correo (Gmail recomendado)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-16-caracteres
EMAIL_DESTINATARIO=admin@olimpusgymnastics.com

# Configuración del servidor
PORT=7000
TZ=America/Mexico_City
```

#### 2. Configuración de Gmail (Recomendado)

Para usar Gmail como proveedor de correo:

1. **Habilitar 2FA** en tu cuenta de Gmail
2. **Generar contraseña de aplicación**:
   - Ve a [Configuración de Google](https://myaccount.google.com/security)
   - Busca "Contraseñas de aplicaciones"
   - Selecciona "Correo" y "Otra (personalizada)"
   - Copia la contraseña de 16 caracteres generada
   - Úsala como `EMAIL_PASSWORD` en el .env

#### 3. Otros Proveedores de Correo

El sistema también funciona con otros proveedores. Edita `Backend/utils/emailService.js`:

```javascript
// Para Outlook/Hotmail
service: 'hotmail'

// Para Yahoo
service: 'yahoo'

// Para servidor SMTP personalizado
host: 'smtp.tudominio.com',
port: 587,
secure: false
```

### 🕐 Horarios Programados

- **5:00 PM diarios**: Aplicación automática de recargos por pagos tardíos
- **8:00 PM diarios**: Envío automático de reportes

### 🎮 Controles desde la Interfaz

#### Pantalla de Inicio
- **Estado de configuración**: Indica si el correo está configurado correctamente
- **Botón "Enviar Reporte Ahora"**: Permite enviar un reporte manual inmediatamente
- **Información automática**: Muestra el horario y contenido de los reportes

#### Funciones Disponibles
- ✅ Verificación automática de configuración
- ✅ Envío manual desde la interfaz
- ✅ Notificaciones de éxito/error
- ✅ Vista previa del contenido antes del envío

### 🏗️ Arquitectura Técnica

#### Backend - Nuevos Archivos
```
Backend/
├── utils/
│   ├── emailService.js      # Servicio de envío de correos
│   ├── pdfService.js        # Generación de PDFs con Puppeteer
│   ├── reporteService.js    # Orquestador principal de reportes
│   └── cronJobs.js          # Actualizado con nueva tarea
├── routes/
│   └── reportesRoutes.js    # API para control de reportes
└── .env.example             # Plantilla de configuración
```

#### Dependencias Agregadas
- `nodemailer`: Envío de correos electrónicos
- `puppeteer`: Generación de PDFs desde HTML

#### Frontend - Modificaciones
```
frontend/src/components/
├── Pantalla_inicio.js       # Agregada sección de reportes
└── Pantalla_inicio.css      # Estilos para la nueva sección
```

### 🚀 Inicialización

1. **Instalar dependencias**:
   ```bash
   cd Backend
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus datos reales
   ```

3. **Reiniciar el servidor**:
   ```bash
   npm start
   ```

4. **Verificar en la interfaz**:
   - Abrir la pantalla de inicio
   - Verificar que aparezca "✅ Configuración de correo válida"
   - Probar con "📤 Enviar Reporte Ahora"

### 📊 Formato del PDF

El PDF generado incluye:
- **Header**: Logo y título de Olimpus Gymnastics
- **Resumen ejecutivo**: Total del día y estadísticas
- **Tabla detallada**: Todos los pagos con alumno, concepto, monto y fecha
- **Diseño responsive**: Optimizado para impresión y visualización
- **Branding**: Colores y estilos de la marca

### 🔧 Solución de Problemas

#### Error: "Configuración de correo incompleta"
- Verificar que existan `EMAIL_USER` y `EMAIL_PASSWORD` en `.env`
- Reiniciar el servidor después de modificar `.env`

#### Error: "Authentication failed"
- Verificar que la contraseña de aplicación sea correcta
- Confirmar que 2FA esté habilitado en Gmail

#### Error: "PDF generation failed"
- Verificar que Puppeteer se haya instalado correctamente
- En algunos servidores puede requerir dependencias adicionales

#### Los correos no llegan
- Verificar la carpeta de spam
- Confirmar que `EMAIL_DESTINATARIO` sea correcta
- Revisar los logs del servidor para errores

### 📝 Logs del Sistema

El sistema genera logs detallados:
```
✅ Tareas programadas iniciadas correctamente
📅 Los recargos se aplicarán automáticamente todos los días a las 00:01 AM
📧 Los reportes se enviarán automáticamente todos los días a las 8:00 PM
```

En el envío:
```
🚀 Iniciando generación de reporte diario automático...
📊 Paso 1/4: Obteniendo datos del corte...
📋 Paso 2/4: Generando archivo Excel...
📄 Paso 3/4: Generando reporte PDF...
📧 Paso 4/4: Enviando correo electrónico...
✅ Reporte diario enviado exitosamente
```

### 🎯 Próximas Mejoras

- [ ] Personalización de horarios desde la interfaz
- [ ] Múltiples destinatarios
- [ ] Plantillas de correo personalizables
- [ ] Historial de reportes enviados
- [ ] Reportes semanales/mensuales
- [ ] Integración con WhatsApp Business API

---

**Implementado el**: Octubre 2025  
**Versión**: 1.0  
**Estado**: ✅ Funcional y listo para producción