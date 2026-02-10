// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_HOSTNAME;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

export const API_ENDPOINTS = {
  login: `${API_BASE}/${API_VERSION}/login`,
  register: `${API_BASE}/${API_VERSION}/register`,
  users: `${API_BASE}/${API_VERSION}/usuarios`,
  profile: `${API_BASE}/${API_VERSION}/profile`,
  roles: `${API_BASE}/${API_VERSION}/roles`,
  empresas: `${API_BASE}/${API_VERSION}/empresas`,
  dispositivos: `${API_BASE}/${API_VERSION}/dispositivos`,
  tipoSensor: `${API_BASE}/${API_VERSION}/tipoSensor`,
  sensores: `${API_BASE}/${API_VERSION}/sensores`,
  permisos: `${API_BASE}/${API_VERSION}/permisos`,
  notificaciones: `${API_BASE}/${API_VERSION}/notificaciones`,
  tipoSistema: `${API_BASE}/${API_VERSION}/tipoSistema`,
  daq: `${API_BASE}/${API_VERSION}/daq`,
  mapa: `${API_BASE}/${API_VERSION}/mapa`,
  zona: `${API_BASE}/${API_VERSION}/zona`,
  zonaRelacion:`${API_BASE}/${API_VERSION}/zonaRelacion`,
  archivos:`${API_BASE}/${API_VERSION}/archivos`,
  dataSheet:`${API_BASE}/${API_VERSION}/dataSheet`,
  auditoria:`${API_BASE}/${API_VERSION}/auditoria`,
  tipoActuadores:`${API_BASE}/${API_VERSION}/tipoActuadores`,
  actuadores:`${API_BASE}/${API_VERSION}/actuadores`,
  tipoAutomatizacion:`${API_BASE}/${API_VERSION}/tipoAutomatizacion`,
  tipoAutomatizacionRelacion:`${API_BASE}/${API_VERSION}/tipoAutomatizacionRelacion`,
  trabajos:`${API_BASE}/${API_VERSION}/trabajos`,
};