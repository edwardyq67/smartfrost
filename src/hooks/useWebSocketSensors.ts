// hooks/useWebSocketSensors.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketSensorData {
    type: string;
    sensorId: string;
    deviceId?: string;
    value: number | string;
    timestamp: string;
    tipo_sensor?: string | number;
    estado?: string;
}

interface SensorValue {
    value: number | string;
    rawValue: number | string;
    tipo_sensor?: string | number;
    timestamp: string;
    deviceId?: string;
    formattedValue?: string;
    estado?: string;
    mensajeCompleto?: WebSocketSensorData;
}

interface SensorValues {
    [sensorId: string]: SensorValue;
}

export const useWebSocketSensors = (sensorIds: string[] = []) => {
    const [connected, setConnected] = useState(false);
    const [sensorValues, setSensorValues] = useState<SensorValues>({});

    const ws = useRef<WebSocket | null>(null);
    const userId = useRef(`user-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`);
    const currentSensorIds = useRef<string[]>([]);
    
    // ✅ REFS PARA CONTROLAR LOGS
    const componentId = useRef(`component-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
    const mountCount = useRef(0);
    const isMountedRef = useRef(true);

    const formatSensorValue = useCallback((data: WebSocketSensorData): SensorValue => {
        const rawValue = data.value;
        let formattedValue: number | string = rawValue;

        if (typeof rawValue === 'number') {
            formattedValue = Number(rawValue.toFixed(2));
        } else if (typeof rawValue === 'string' && !isNaN(Number(rawValue))) {
            formattedValue = Number(parseFloat(rawValue).toFixed(2));
        }

        return {
            value: formattedValue,
            rawValue: rawValue,
            tipo_sensor: data.tipo_sensor,
            timestamp: data.timestamp,
            deviceId: data.deviceId,
            formattedValue: `${formattedValue}`,
            estado: data.estado,
            mensajeCompleto: data
        };
    }, []);

    const patchSensorSubscription = useCallback(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const previousIds = currentSensorIds.current;
        const newIds = sensorIds;

        const idsChanged = 
            previousIds.length !== newIds.length ||
            !previousIds.every((id, index) => id === newIds[index]);

        if (!idsChanged) return;
        
        const message = {
            action: 'subscribe',
            sensorIds: newIds,
            userId: userId.current
        };
        
        ws.current.send(JSON.stringify(message));
        currentSensorIds.current = [...newIds];

        setSensorValues(prev => {
            const newValues = { ...prev };
            newIds.forEach(id => {
                if (!newValues[id]) {
                    newValues[id] = {
                        value: 0,
                        rawValue: 0,
                        tipo_sensor: undefined,
                        timestamp: new Date().toISOString(),
                        formattedValue: '0'
                    };
                }
            });
            return newValues;
        });

    }, [sensorIds]);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            patchSensorSubscription();
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

        try {
            ws.current = new WebSocket(`${wsUrl}?userId=${userId.current}`);

            ws.current.onopen = () => {
                
                setConnected(true);
                patchSensorSubscription();
            };

            ws.current.onmessage = (event) => {
                try {
                    const data: WebSocketSensorData = JSON.parse(event.data);
                    const sensorData = formatSensorValue(data);

                    setSensorValues(prev => ({
                        ...prev,
                        [data.sensorId]: sensorData
                    }));
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            ws.current.onclose = () => {
                
                setConnected(false);
            };

            ws.current.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setConnected(false);
            };

        } catch (error) {
            console.error('❌ Error connecting to WebSocket:', error);
        }
    }, [formatSensorValue, patchSensorSubscription]);

    const disconnect = useCallback(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        setConnected(false);
        currentSensorIds.current = [];
    }, []);

    const getSensorData = useCallback((sensorId: string): SensorValue | null => {
        return sensorValues[sensorId] || null;
    }, [sensorValues]);

    const getSensorTipo = useCallback((sensorId: string): string | number | undefined => {
        return sensorValues[sensorId]?.tipo_sensor;
    }, [sensorValues]);

    const getMensajeCompleto = useCallback((sensorId: string): WebSocketSensorData | undefined => {
        return sensorValues[sensorId]?.mensajeCompleto;
    }, [sensorValues]);
console.log(sensorValues);
    // ✅ EFECTO PRINCIPAL CON LOGS MEJORADOS
    useEffect(() => {
        mountCount.current++;
        isMountedRef.current = true;

        if (sensorIds.length > 0 && !connected) {
            connect();
        }
        
        if (connected && sensorIds.length > 0) {
            patchSensorSubscription();
        }

        // ✅ CLEANUP MEJORADO
        return () => {

            if (mountCount.current <= 1) {
               
                disconnect();
            } else {
                console.log("⚠️ Skipping disconnect - componente se está re-renderizando");
            }
            
            isMountedRef.current = false;
        };
    }, [sensorIds, connected, connect, patchSensorSubscription]);

    return {
        connected,
        sensorValues,
        getSensorData,
        getSensorTipo,
        getMensajeCompleto,
        connect,
        disconnect
    };
};