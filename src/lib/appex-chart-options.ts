export const getYAxisConfig = (color: string): { labels: { style: { color: string; fontFamily: string; } } } => ({
  labels: {
    style: {
      color: color,
      fontFamily: "Inter",
    },
  },
});


export const getXAxisConfig = (colors: string): { } => ({
  categories: [
    "1 Min",
    "2 Min",
    "3 Min",
    "4 Min",
    "5 Min",
    "6 Min",
    "7 Min",
    "8 Min",
    "9 Min",
    "10 Min",
    "11 Min",
    "12 Min",
  ],
  labels: getLabel(colors),
  axisBorder: {
    show: false,
  },
  axisTicks: {
    show: false,
  },
});

export const getLabel = (colors:any): {  } => ({
  style: {
    colors: colors,
    fontFamily: "Inter",
  },
});


export const getGridConfig = (color: string): { show: boolean; borderColor: string; strokeDashArray: number; position: string; } => ({
  show: true,
  borderColor: color,
  strokeDashArray: 10,
  position: "back",
});