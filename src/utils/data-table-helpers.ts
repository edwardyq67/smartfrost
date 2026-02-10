// utils/data-table-helpers.ts

export type ColumnType = 'avatar' | 'text' | 'badge' | 'status' | 'actions' | 'custom';

export interface ColumnConfig {
  key: string;
  header: string;
  type: ColumnType;
  
  // Para tipo 'avatar'
  avatarConfig?: {
    imageKey?: string;
    titleKey: string;
    subtitleKey?: string;
  };
  
  // Para tipo 'badge' - ahora más flexible
  badgeConfig?: {
    colorMap?: Record<string, string>;
    variantMap?: Record<string, string>;
    textMap?: Record<string, string>;
    defaultVariant?: string;
  };
  
  // Para tipo 'status'
  statusConfig?: {
    trueText?: string;
    falseText?: string;
    trueColor?: string;
    falseColor?: string;
    trueVariant?: string;
    falseVariant?: string;
  };
  
  // Para tipo 'text'
  textConfig?: {
    format?: (value: any) => string;
    className?: string;
  };
  
  // Para personalización general
  customConfig?: Record<string, any>;
}

// Tipos para TabletGlobal
export interface CellData {
  type: ColumnType;
  data: any;
  config?: any;
}

export interface TableRowData {
  id: string | number;
  [key: string]: CellData | any;
  _original?: any;
}

// Función para transformar datos usando ColumnConfig
export function transformDataForTable<T>(
  data: T[],
  columnsConfig: ColumnConfig[],
  options?: {
    idKey?: string;
    includeOriginal?: boolean;
  }
): TableRowData[] {
  const { idKey = 'id', includeOriginal = true } = options || {};
  
  return data.map((item: any) => {
    const row: TableRowData = {
      id: item[idKey] || item.uuid || item.id
    };
    
    columnsConfig.forEach(column => {
      const cellValue = item[column.key];
      
      switch (column.type) {
        case 'avatar':
          if (column.avatarConfig) {
            const { imageKey, titleKey, subtitleKey } = column.avatarConfig;
            row[column.key] = {
              type: 'avatar',
              data: {
                image: imageKey ? item[imageKey] : undefined,
                title: item[titleKey],
                subtitle: subtitleKey ? item[subtitleKey] : undefined
              },
              config: column.avatarConfig
            };
          }
          break;
          
        case 'text':
          const formattedValue = column.textConfig?.format 
            ? column.textConfig.format(cellValue) 
            : cellValue;
          
          row[column.key] = {
            type: 'text',
            data: {
              value: formattedValue
            },
            config: column.textConfig
          };
          break;
          
        case 'badge':
          const badgeText = column.badgeConfig?.textMap?.[cellValue] || cellValue;
          const badgeVariant = column.badgeConfig?.variantMap?.[cellValue] || 
                              column.badgeConfig?.colorMap?.[cellValue] || 
                              column.badgeConfig?.defaultVariant || 
                              'outline';
          
          row[column.key] = {
            type: 'badge',
            data: {
              value: badgeText,
              variant: badgeVariant
            },
            config: column.badgeConfig
          };
          break;
          
        case 'status':
          const isActive = cellValue === "1" || cellValue === true || cellValue === "true" || cellValue === "active";
          const statusText = isActive 
            ? (column.statusConfig?.trueText || 'Activo')
            : (column.statusConfig?.falseText || 'Inactivo');
          const statusVariant = isActive
            ? (column.statusConfig?.trueVariant || column.statusConfig?.trueColor || 'success')
            : (column.statusConfig?.falseVariant || column.statusConfig?.falseColor || 'destructive');
          
          row[column.key] = {
            type: 'status',
            data: {
              isActive,
              text: statusText,
              variant: statusVariant
            },
            config: column.statusConfig
          };
          break;
          
        case 'actions':
          row[column.key] = {
            type: 'actions',
            data: item, // Pasamos el objeto completo para las acciones
            config: column.customConfig
          };
          break;
          
        case 'custom':
          row[column.key] = {
            type: 'custom',
            data: cellValue,
            config: column.customConfig
          };
          break;
          
        default:
          row[column.key] = {
            type: 'text',
            data: { value: cellValue },
            config: column.textConfig
          };
      }
    });
    
    if (includeOriginal) {
      row._original = item;
    }
    
    return row;
  });
}