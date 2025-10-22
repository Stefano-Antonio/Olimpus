// Script para convertir 'horarios' en formato string a objeto {lunes,...,sabado}
// Uso: node scripts/convert_horarios.js

const modalidades = [
    {
        "_id": "68f1cd63204efab17575d648",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-16:00-17:00",
        "costo": 100,
        "grupo": "A",
        "entrenador": "Chino",
        "id_entrenador": "68ee0897ee6cd72f760445ac"
    },
    {
        "_id": "68f1cd6e204efab17575d64d",
        "nombre": "Parkour",
        "horarios": "L-16:00-17:00",
        "costo": 100,
        "grupo": "A",
        "entrenador": "Fano",
        "id_entrenador": "68ee089cee6cd72f760445b0"
    },
    {
        "_id": "68f1cece204efab17575d652",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-16:00-17:00",
        "costo": 250,
        "grupo": "I",
        "entrenador": "Monste",
        "id_entrenador": "68ee08a1ee6cd72f760445b4"
    },
    {
        "_id": "68f1cf59204efab17575d8e0",
        "nombre": "Parkour",
        "horarios": "L-16:00-17:00",
        "costo": 1,
        "grupo": "B",
        "entrenador": "Fano",
        "id_entrenador": "68ee089cee6cd72f760445b0"
    },
    {
        "_id": "68f1cf62204efab17575d8e5",
        "nombre": "Baby Gym",
        "horarios": "L-16:00-17:00",
        "costo": 1,
        "grupo": "B",
        "entrenador": "Anita",
        "id_entrenador": "68ef0b27bb5ac7ce9ddc64e0"
    },
    {
        "_id": "68f2b0102eefa262200e6cb4",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-16:00-17:00",
        "costo": 100,
        "grupo": "F",
        "entrenador": "Chino",
        "id_entrenador": "68ee0897ee6cd72f760445ac"
    },
    {
        "_id": "68f2b0202eefa262200e6cb9",
        "nombre": "Parkour",
        "horarios": "L-16:00-18:00",
        "costo": 100,
        "grupo": "D",
        "entrenador": "Fano",
        "id_entrenador": "68ee089cee6cd72f760445b0"
    },
    {
        "_id": "68f2b0302eefa262200e6cbe",
        "nombre": "Gimnasia Femenil",
        "horarios": "-null",
        "costo": 1000,
        "grupo": "B",
        "entrenador": "Chino",
        "id_entrenador": "68ee0897ee6cd72f760445ac"
    },
    {
        "_id": "68f2b0462eefa262200e6cc3",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-16:00-18:00",
        "costo": 100,
        "grupo": "K",
        "entrenador": "Chino",
        "id_entrenador": "68ee0897ee6cd72f760445ac"
    },
    {
        "_id": "68f2b0792eefa262200e6cc9",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-18:00-19:00",
        "costo": 100,
        "grupo": "L",
        "entrenador": "Monste",
        "id_entrenador": "68ee08a1ee6cd72f760445b4"
    },
    {
        "_id": "68f2b08a2eefa262200e6cce",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-16:00-17:00",
        "costo": 100,
        "grupo": "C",
        "entrenador": "Monste",
        "id_entrenador": "68ee08a1ee6cd72f760445b4"
    },
    {
        "_id": "68f2b09e2eefa262200e6cd3",
        "nombre": "Baby Gym",
        "horarios": "L-18:00-20:00",
        "costo": 100,
        "grupo": "C",
        "entrenador": "Anita",
        "id_entrenador": "68ef0b27bb5ac7ce9ddc64e0"
    },
    {
        "_id": "68f2b0ab2eefa262200e6cd8",
        "nombre": "Gimnasia Femenil",
        "horarios": "L-18:00-20:00",
        "costo": 100,
        "grupo": "G",
        "entrenador": "Monste",
        "id_entrenador": "68ee08a1ee6cd72f760445b4"
    },
    {
        "_id": "68f2b0c92eefa262200e6cdd",
        "nombre": "Baby Gym",
        "horarios": "L-17:00-19:00",
        "costo": 100,
        "grupo": "D",
        "entrenador": "Anita",
        "id_entrenador": "68ef0b27bb5ac7ce9ddc64e0"
    }
];

function parseHorarios(h) {
  const result = {
    lunes: null,
    martes: null,
    miercoles: null,
    jueves: null,
    viernes: null,
    sabado: null
  };

  if (h === null || h === undefined) return result;

  const raw = String(h).trim();
  if (raw === '' || raw === '-' || raw.toLowerCase() === 'null' || raw === '-null') return result;

  // Normalizar separadores: se espera que las partes de días estén separadas por ' - ' o ';' o ','
  // Usamos ' - ' como preferido, pero también soportamos variantes.
  // Primero reemplazamos combinaciones ' - ' que separan partes manteniendo los '-' dentro de horarios.
  // Supongamos que los distintos segmentos vienen como 'L-16:00-17:00 - Mi-18:00-19:00'

  // Dividir por ' - ' (espacio-guion-espacio) o por ';' o por ','
  let parts = raw.split(/\s-\s|;|,/).map(p => p.trim()).filter(Boolean);

  // Mapeo abreviaturas
  const map = { l: 'lunes', m: 'martes', mi: 'miercoles', j: 'jueves', v: 'viernes', s: 'sabado' };

  parts.forEach(part => {
    // Buscar patrón DIA[:|-]HORARIO
    const m = part.match(/^([A-Za-z]{1,2})[:\-](.+)$/);
    if (m) {
      let key = m[1].toLowerCase();
      // Normalizar: si es 'mi' se mantiene, si es 'm' usar 'm'
      if (key === 'mi') key = 'mi';
      else key = key.charAt(0);

      const dia = map[key];
      if (dia) {
        let horario = m[2].trim();
        // Si horario contiene la palabra 'null' o '-' vacío, tratar como null
        if (horario === '' || horario === '-' || horario.toLowerCase() === 'null') {
          result[dia] = null;
        } else {
          result[dia] = horario;
        }
      }
    }
  });

  return result;
}

const converted = modalidades.map(m => ({
  ...m,
  horarios: parseHorarios(m.horarios)
}));

console.log(JSON.stringify(converted, null, 2));

// También exportamos la función por si quieres usarla desde otro script
module.exports = { parseHorarios };
