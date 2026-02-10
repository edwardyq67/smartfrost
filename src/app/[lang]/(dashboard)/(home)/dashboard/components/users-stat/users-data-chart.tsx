"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";

interface UsersDataChartProps {
  height?: number;
  dispositivosData?: {
    diot: number;
    daq: number;
    sensor: number;
    automatizacion: number;
    total: number;
  };
  dispositivoSeleccionado?: string;
  colors?: string[];
}

const UsersDataChart = ({ 
  height = 260, 
  dispositivosData,
  dispositivoSeleccionado = "general",
  colors = []
}: UsersDataChartProps) => {
  const { theme: config } = useThemeStore();
  const { theme: mode } = useTheme();
  const theme = themes.find((theme) => theme.name === config);

  // Obtener datos para el gráfico basados en dispositivosData
  const getChartData = () => {
    if (!dispositivosData) {
      return [];
    }

    // Si es "general", mostrar todos los dispositivos
    if (dispositivoSeleccionado === "general") {
      return [
        dispositivosData.diot,
        dispositivosData.daq,
        dispositivosData.sensor,
        dispositivosData.automatizacion,
      ];
    }

    // Si es un dispositivo específico, mostrar solo ese
    const valueMap: Record<string, number> = {
      'diot': dispositivosData.diot,
      'daq': dispositivosData.daq,
      'sensor': dispositivosData.sensor,
      'automatizacion': dispositivosData.automatizacion
    };

    return [valueMap[dispositivoSeleccionado] || 0];
  };

  const chartData = getChartData();
  const categories = dispositivoSeleccionado === "general" 
    ? ["Diot", "Daq", "Sensores", "Automatización"]
    : [dispositivoSeleccionado.charAt(0).toUpperCase() + dispositivoSeleccionado.slice(1)];

  const series = [
    {
      name: "Dispositivos",
      data: chartData,
    },
  ];

  // Colores personalizados suaves según el tipo de dispositivo
  const getCustomColors = () => {
    if (dispositivoSeleccionado === "general") {
      // Para gráfico general: un color para cada barra
        return [
      'rgb(96, 165, 250)', // Diot - Azul más fuerte (#60a5fa)
      'rgb(251, 191, 36)', // Daq - Naranja más fuerte (#fbbf24)
      'rgb(52, 211, 153)', // Sensores - Verde más fuerte (#34d399)
      'rgb(34, 211, 238)', // Automatización - Cian más fuerte (#22d3ee)
    ];
    } else {
      // Para dispositivo específico: usar color correspondiente
      const specificColors: Record<string, string> = {
        'diot': 'rgb(188, 208, 249)',
        'daq': 'rgb(255, 247, 237)',
        'sensor': 'rgb(240, 253, 244)',
        'automatizacion': 'rgb(238, 241, 249)'
      };
      return [specificColors[dispositivoSeleccionado] || 'rgb(188, 208, 249)'];
    }
  };

  // Usar colores personalizados suaves
  const chartColors = getCustomColors();

  const options: any = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: dispositivoSeleccionado === "general" ? 0 : 2,
      colors: ['rgba(0, 0, 0, 0.1)'], // Stroke sutil
    },
    colors: chartColors,
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
      y: {
        formatter: (value: number) => `${value} dispositivo${value !== 1 ? 's' : ''}`
      },
      style: {
        fontSize: '12px'
      }
    },
    grid: {
      borderColor: mode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      },
    },
    yaxis: {
      show: true,
      title: {
        text: "Cantidad",
        style: {
          fontSize: '12px',
          color: mode === "dark" ? '#94a3b8' : '#64748b',
          fontWeight: 500,
        }
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: mode === "dark" ? '#94a3b8' : '#64748b',
        },
        formatter: function(val: number) {
          return Math.floor(val).toString();
        }
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '11px',
          colors: mode === "dark" ? '#94a3b8' : '#64748b',
          fontWeight: 500,
        }
      },
      axisBorder: {
        show: true,
        color: mode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        height: 1,
      },
      axisTicks: {
        show: true,
        color: mode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: dispositivoSeleccionado === "general" ? '75%' : '60%',
        borderRadius: 8, // Bordes más redondeados para look suave
        distributed: dispositivoSeleccionado === "general",
        dataLabels: {
          position: 'top',
        },
      },
    },
    // Estados hover suaves
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.1, // Efecto hover muy sutil
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.05,
        }
      }
    },
    // Animaciones suaves
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 600,
      animateGradually: {
        enabled: true,
        delay: 100
      },
    },
    padding: {
      top: 20,
      right: 15,
      bottom: 10,
      left: 15,
    },
  };

  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0 || chartData.every(value => value === 0)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[160px] bg-muted/20 rounded-lg">
        <div className="text-center text-muted-foreground">
          <p>No hay datos disponibles</p>
          <p className="text-sm">para mostrar en el gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Chart
        options={options}
        series={series}
        type="bar"
        height={height}
        width={"100%"}
      />
    </div>
  );
};

export default UsersDataChart;