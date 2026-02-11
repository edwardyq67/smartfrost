// lib/tipoAutomatizacion/UseTipoAutomatizacionRelacion.ts
import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interface para items individuales
export interface ItemRelacion {
  id_entidad: string;
  tipo_entidad: 'TIPO_SENSOR' | 'TIPO_ACTUADOR';
  cantidad: number;
}

// Interface principal para crear relaciones
export interface CreateTipoAutomatizacionRelacionData {
  id_tipo_automatizacion: string;
  items: ItemRelacion[];
}

// Interface para la respuesta del backend
export interface CreateTipoAutomatizacionRelacionResponse {
  status: number;
  message: string;
  data: {
    relacion: any;
  };
  description: string;
}

export const tipoAutomatizacionRelacionService = {
  // Crear relación de tipo de automatización (masivo)
  createTipoAutomatizacionRelacion: async (
    data: CreateTipoAutomatizacionRelacionData
  ): Promise<CreateTipoAutomatizacionRelacionResponse> => {
    const response = await axiosInstance.post(
      `${API_ENDPOINTS.tipoAutomatizacionRelacion}/masivo`, 
      data,
      {
        headers: useAuthStore.getState().getAuthHeaders()
      }
    );
    
    return response.data;
  }
};