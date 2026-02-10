"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { themes } from "@/config/thems";
import {
  getGridConfig,
  getXAxisConfig,
  getYAxisConfig,
} from "@/lib/appex-chart-options";

interface ReportsChartProps {
  series: ApexAxisChartSeries;
  chartColor: string;
  height?: number;
  labels?: string[];
  title?: string;
}

const ReportsChart = ({ 
  series, 
  chartColor, 
  height = 300,
  labels,
  title
}: ReportsChartProps) => {
  const { theme: config } = useThemeStore();
  const { theme: mode } = useTheme();

  const theme = themes.find((theme) => theme.name === config);

  // Obtener configuraciones base
  const baseXAxis = getXAxisConfig(
    `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`
  );
  
  const baseYAxis = getYAxisConfig(
    `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`
  );

  const options: any = {
    chart: {
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000,
        },
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 4,
    },
    colors: [chartColor],
    tooltip: {
      theme: mode === "dark" ? "dark" : "light",
    },
    grid: getGridConfig(
      `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartGird})`
    ),
    fill: {
      type: "gradient",
      colors: chartColor,
      gradient: {
        shadeIntensity: 0.1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [50, 100, 0],
      },
    },
    yaxis: {
      ...baseYAxis, // Spread de toda la configuración base
      title: {
        text: "Temperatura (°C)",
        style: {
          color: `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`,
          fontSize: '12px',
          fontWeight: 400,
        }
      },
      // Si baseYAxis ya tiene labels, los mantenemos, sino los añadimos
      labels: baseYAxis.labels ? {
        ...baseYAxis.labels,
        formatter: function(val: number) {
          return val.toFixed(2) + "°C";
        }
      } : {
        formatter: function(val: number) {
          return val.toFixed(2) + "°C";
        }
      }
    },
    xaxis: {
      ...baseXAxis, // Spread de toda la configuración base
      categories: labels, // Usar categories para etiquetas personalizadas
      tickAmount: labels ? labels.length : 10,
    },
    padding: {
      top: 20,
      right: 10,
      bottom: 20,
      left: 10,
    },
    title: title ? {
      text: title,
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: `hsl(${theme?.cssVars[mode === "dark" ? "dark" : "light"].chartLabel})`,
      }
    } : undefined,
  };
  
  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={height}
      width={"100%"}
    />
  )
}

export default ReportsChart;