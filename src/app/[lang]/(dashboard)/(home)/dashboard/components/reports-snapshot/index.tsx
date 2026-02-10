"use client";

import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ReportsChart from "./reports-chart";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard/dataDashboard";
import { useEffect, useState, useRef, useCallback } from "react";
import { sensoresService } from "@/lib/sensores/UseSensores";
import { wsService } from "@/lib/ws/UseWs";

interface ReportsSnapshotProps {
  empresaId?: string;
}

interface EstadisticasGlobales {
  avg: number;
  count: number;
  max: number;
  min: number;
  p25: number;
  p50: number;
  p75: number;
  std: number;
  sum: number;
}

interface WsResponse {
  resumen_global?: {
    estadisticas_globales: EstadisticasGlobales;
  };
}

const MAX_DATA_POINTS = 50; // Máximo de puntos a mostrar en el gráfico

const ReportsSnapshot = ({ empresaId }: ReportsSnapshotProps) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasGlobales | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [valorActual, setValorActual] = useState<number | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { theme: config } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);
  const primary = `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].primary})`;
  const { empresa } = useDashboardStore();
  const empresaAUtilizar = empresaId || empresa?.uuid;
  
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const contadorActualizacionesRef = useRef(0);
  const empresaAnteriorRef = useRef<string | undefined>(empresaAUtilizar);

  // Función para reiniciar todos los datos
  const reiniciarDatos = useCallback(() => {
    console.log("Reiniciando datos para nueva empresa:", empresaAUtilizar);
    setEstadisticas(null);
    setValorActual(null);
    setChartData([]);
    setChartLabels([]);
    setUltimaActualizacion(null);
    contadorActualizacionesRef.current = 0;
    
    // Limpiar intervalo anterior
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, [empresaAUtilizar]);

  // Función para obtener y procesar datos
  const obtenerDatosWs = useCallback(async () => {
    try {
      if (!empresaAUtilizar) {
        console.log("No hay empresa seleccionada");
        return;
      }

      setIsLoading(true);
      
      // Verificar si cambió la empresa
      if (empresaAnteriorRef.current !== empresaAUtilizar) {
        console.log("Empresa cambiada, reiniciando datos");
        reiniciarDatos();
        empresaAnteriorRef.current = empresaAUtilizar;
      }

      // Obtener sensores
      const res = await sensoresService.getSensores({
        page: 1, 
        size: 100, 
        id_empresa: empresaAUtilizar
      });
      
      // Extraer IMEIs únicos
      const imeisUnicos = new Set<string>();
      res.data.data.forEach((sensor: any) => {
        if (sensor.imei) {
          imeisUnicos.add(sensor.imei);
        }
      });
      
      const imeisArray = Array.from(imeisUnicos);
      
      if (imeisArray.length === 0) {
        console.log("No hay sensores con IMEI para esta empresa");
        setEstadisticas({
          avg: 0,
          count: 0,
          max: 0,
          min: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          std: 0,
          sum: 0
        });
        setValorActual(0);
        return;
      }
      
      // Obtener datos del WebSocket
      const resimeis: WsResponse = await wsService.getWsConnection({
        sensors: imeisArray, 
        minutes: 1
      });
      
      if (resimeis.resumen_global?.estadisticas_globales) {
        const nuevasEstadisticas = resimeis.resumen_global.estadisticas_globales;
        
        // Actualizar estadísticas
        setEstadisticas(nuevasEstadisticas);
        
        // Actualizar valor actual (usando el promedio)
        const nuevoValor = parseFloat(nuevasEstadisticas.avg.toFixed(2));
        setValorActual(nuevoValor);
        
        // Incrementar contador
        contadorActualizacionesRef.current += 1;
        
        // Obtener hora actual para la etiqueta
        const ahora = new Date();
        const horaFormateada = ahora.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Actualizar datos del gráfico con desplazamiento
        setChartData(prev => {
          const nuevosDatos = [...prev, nuevoValor];
          // Mantener solo los últimos MAX_DATA_POINTS valores
          return nuevosDatos.length > MAX_DATA_POINTS 
            ? nuevosDatos.slice(-MAX_DATA_POINTS)
            : nuevosDatos;
        });
        
        // Actualizar etiquetas del gráfico
        setChartLabels(prev => {
          const nuevasEtiquetas = [...prev, horaFormateada];
          // Mantener solo las últimas MAX_DATA_POINTS etiquetas
          return nuevasEtiquetas.length > MAX_DATA_POINTS
            ? nuevasEtiquetas.slice(-MAX_DATA_POINTS)
            : nuevasEtiquetas;
        });
        
        setUltimaActualizacion(ahora);
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [empresaAUtilizar, reiniciarDatos]);

  // Efecto principal para manejar cambios de empresa y configurar intervalo
  useEffect(() => {
    console.log("Efecto ejecutado - Empresa actual:", empresaAUtilizar, "Anterior:", empresaAnteriorRef.current);
    
    if (!empresaAUtilizar) {
      console.log("No hay empresa seleccionada, limpiando datos");
      reiniciarDatos();
      return;
    }

    // Verificar si cambió la empresa
    if (empresaAnteriorRef.current !== empresaAUtilizar) {
      console.log("Empresa cambiada, reiniciando datos antes de obtener nuevos");
      reiniciarDatos();
      empresaAnteriorRef.current = empresaAUtilizar;
    }

    // Obtener datos iniciales
    obtenerDatosWs();
    
    // Configurar intervalo para actualizar cada minuto
    if (!intervaloRef.current) {
      console.log("Configurando intervalo para empresa:", empresaAUtilizar);
      intervaloRef.current = setInterval(() => {
        console.log("Ejecutando intervalo para empresa:", empresaAUtilizar);
        obtenerDatosWs();
      }, 60000); // 60000 ms = 1 minuto
    }

    // Limpiar intervalo al desmontar o cuando cambia la empresa
    return () => {
      console.log("Limpiando efecto - Empresa:", empresaAUtilizar);
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, [empresaAUtilizar, obtenerDatosWs, reiniciarDatos]);

  // Formatear tiempo de última actualización
  const formatearTiempo = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const tabsTrigger = [
    {
      value: "min",
      text: "Min",
      total: estadisticas ? estadisticas.min.toFixed(2) : "--",
      color: "primary",
    },
    {
      value: "max",
      text: "Max",
      total: estadisticas ? estadisticas.max.toFixed(2) : "--",
      color: "warning",
    },
    {
      value: "actual",
      text: "Valor Actual",
      total: valorActual !== null ? valorActual.toFixed(2) : "--",
      color: "success",
    },
    {
      value: "sensores",
      text: "Cant. Lecturas",
      total: estadisticas ? estadisticas.count.toString() : "--",
      color: "info",
    },
  ];

  // Preparar datos para el gráfico
  const allUsersSeries = [
    {
      name: "Temperatura Promedio",
      data: chartData.length > 0 ? chartData : [0],
    },
  ];

  return (
    <Card>
      <CardHeader className="border-none pb-0">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1">
            <div className="text-xl font-semibold text-default-900 whitespace-nowrap">
              Reports Snapshot
            </div>
            <span className="text-xs text-default-600">
              {empresaAUtilizar ? (
                isLoading ? (
                  "Cargando datos..."
                ) : ultimaActualizacion ? (
                  `Última actualización: ${formatearTiempo(ultimaActualizacion)} (${contadorActualizacionesRef.current} lecturas)`
                ) : (
                  "Esperando datos..."
                )
              ) : (
                "Seleccione una empresa para ver datos"
              )}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 md:p-5">
        {!empresaAUtilizar ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Seleccione una empresa para ver el reporte de sensores</p>
          </div>
        ) : isLoading && chartData.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando datos de sensores...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
              {tabsTrigger.map((item, index) => (
                <div
                  key={`report-card-${index}`}
                  className={cn(
                    "flex flex-col gap-1.5 p-4 overflow-hidden items-start relative rounded-lg",
                    {
                      "bg-primary/50 ring-1 ring-primary/20 dark:bg-primary dark:ring-primary/40": item.color === "primary",
                      "bg-orange-200 ring-1 ring-orange-100 dark:bg-orange-300 dark:ring-orange-400": item.color === "warning",
                      "bg-green-200 ring-1 ring-green-100 dark:bg-green-300 dark:ring-green-400": item.color === "success",
                      "bg-cyan-200 ring-1 ring-cyan-100 dark:bg-cyan-300 dark:ring-cyan-400": item.color === "info",
                    }
                  )}
                >
                  <span
                    className={cn(
                      "h-10 w-10 rounded-full absolute -top-3 -right-3 ring-8",
                      {
                        "bg-primary/40 ring-primary/30 dark:bg-primary dark:ring-primary/40": item.color === "primary",
                        "bg-orange-200 ring-orange-100 dark:bg-orange-300 dark:ring-orange-400": item.color === "warning",
                        "bg-green-200 ring-green-100 dark:bg-green-300 dark:ring-green-400": item.color === "success",
                        "bg-cyan-200 ring-cyan-100 dark:bg-cyan-300 dark:ring-cyan-400": item.color === "info",
                      }
                    )}
                  ></span>
                  <span className="text-sm text-default-800 dark:text-primary-foreground font-semibold capitalize relative z-10">
                    {item.text}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold relative z-10",
                    {
                      "text-primary/80 dark:text-primary-foreground": item.color === "primary",
                      "text-orange-600 dark:text-orange-800": item.color === "warning",
                      "text-green-600 dark:text-green-800": item.color === "success",
                      "text-cyan-600 dark:text-cyan-800": item.color === "info",
                    }
                  )}>
                    {item.total}
                    {item.value === "actual" && valorActual !== null && "°C"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <ReportsChart 
                series={allUsersSeries} 
                chartColor={primary}
                labels={chartLabels}
                title={`Evolución del promedio (últimas ${chartData.length} lecturas)`}
               
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsSnapshot;