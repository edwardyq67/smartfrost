// store/dispositivos/qrStore.ts
import { create } from 'zustand';

export interface QrDataItem {
  id_sensor: string;
  id_modbus: number;
  tipo_sensor: string;
  register: number;
  factor: number;
  offset: number;
  install: boolean;
}

export interface QrResponse {
  imei: string;
  data: QrDataItem[];
}

interface QrState {
  // Última respuesta QR capturada
  qrData: QrResponse | null;
  
  // Actions
  setQrData: (response: QrResponse) => void;
  clearQrData: () => void;
}

// Store principal
export const useQrStore = create<QrState>((set) => ({
  // Estado inicial
  qrData: null,
  
  // Guardar respuesta QR
  setQrData: (response) => {
    set({ qrData: response });
  },
  
  // Limpiar respuesta
  clearQrData: () => {
    set({ qrData: null });
  },
}));

// Hook personalizado useQrData
export const useQrData = () => {
  const { qrData, setQrData, clearQrData } = useQrStore();

  // Capturar QR desde objeto JSON
  const captureQr = (qrJson: QrResponse) => {
    setQrData(qrJson);
    return qrJson;
  };

  // Obtener datos específicos
  const getImei = () => qrData?.imei || null;
  const getSensors = () => qrData?.data || [];
  const getSensorCount = () => qrData?.data.length || 0;

  return {
    // Estado completo
    qrData,
    
    // Acciones del store
    setQrData,
    clearQrData,
    
    // Acciones personalizadas
    captureQr,
    
    // Helpers
    hasQrData: !!qrData,
    imei: getImei(),
    sensors: getSensors(),
    sensorCount: getSensorCount(),
    
    // Buscar sensor por ID
    findSensor: (id_sensor: string) => 
      qrData?.data.find(sensor => sensor.id_sensor === id_sensor),
  };
};