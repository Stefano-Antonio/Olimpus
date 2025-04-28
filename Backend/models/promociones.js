const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PromocionesSchema = new Schema({
    nombre: { type: String, required: true },
    activo: { type: Boolean, default: true },
    telefono: { type: String, required: true}
  });
  
module.exports = mongoose.model('Promociones', PromocionesSchema);