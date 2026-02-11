// utils/temperatureUtils.js

/**
 * Formatea la temperatura para mostrar
 * @param {string|number} temp - Temperatura a formatear
 * @param {string} unidad - Unidad de medida (ej: "°C")
 * @returns {string} Temperatura formateada
 */
export const formatTemperature = (temp, unidad) => {
  if (temp === "Apagado" || temp === null || temp === undefined || isNaN(parseFloat(temp))) {
    return "Apagado";
  }
  
  const tempNum = parseFloat(temp);
  return `${tempNum.toFixed(2)}${unidad || ""}`;
};

/**
 * Obtiene el color basado en la temperatura y rango
 * @param {string|number} temp - Temperatura actual
 * @param {Object} estadistica - Objeto con minimo y maximo
 * @returns {string} Color en formato hexadecimal
 */
export const getTemperatureColor = (temp, estadistica) => {
  if (temp === "Apagado" || temp === null || temp === undefined || isNaN(parseFloat(temp))) {
    return "#888888"; // Gris para apagado
  }
  
  const tempNum = parseFloat(temp);
  const minimo = estadistica?.minimo ? parseFloat(estadistica.minimo) : 12;
  const maximo = estadistica?.maximo ? parseFloat(estadistica.maximo) : 30;
  
  // SOLO ROJO SI SE PASA DEL MÁXIMO
  if (tempNum > maximo) {
   
    return "#ff3333";
  } else if (tempNum < minimo) {
    
    return "#0066ff";
  } else {
    
    return "#1AA24D";
  }
};