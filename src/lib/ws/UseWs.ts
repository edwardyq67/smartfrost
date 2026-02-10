import { axiosInstance } from '../axios-config';

const API_WS = process.env.NEXT_PUBLIC_WS_DASHBOARD_URL;

export interface WsConnectionParams {
  sensors?: string[];
  minutes?: number;
}

export const wsService = {
    getWsConnection: async(params: WsConnectionParams = {}) => {
        const minutes = params.minutes || 1;
        const url = `${API_WS}/?minutes=${minutes}`;
        
        const body = {
            sensors: params.sensors || []
        };
        
        // Cambiar a POST
        const response = await axiosInstance.post(url, body);
        return response.data;
    }
}