import { axiosInstance } from '../axios-config';
import { API_ENDPOINTS } from '../api';
import { useAuthStore } from '@/store/auth.store';

// Interfaces para la respuesta de la API de Archivos
export interface ArchivoData {
  ok: boolean;
  url: string;
  mime: string;
  size: number;
}

export interface ArchivoResponse {
  status: number;
  message: string;
  data: ArchivoData;
  description: string;
}

// Interface para subir un archivo
export interface UploadArchivoData {
  file: File;
  carpeta?: string;
  nombre?: string;
}

// En useArchivos.ts - VERSIÓN CORREGIDA
export const archivosService = {
  uploadArchivo: async (archivoData: UploadArchivoData): Promise<ArchivoResponse> => {
    const formData = new FormData();

    formData.append('file', archivoData.file, archivoData.file.name);
    
    if (archivoData.carpeta) {
      formData.append('carpeta', archivoData.carpeta);
    }
    
    if (archivoData.nombre) {
      formData.append('nombre', archivoData.nombre);
    }

    const response = await axiosInstance.post(API_ENDPOINTS.archivos, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // ✅ Asegurar que el token se incluya correctamente
        'Authorization': `Bearer ${useAuthStore.getState().token}`
      }
    });
    
    return response.data;
  }
};