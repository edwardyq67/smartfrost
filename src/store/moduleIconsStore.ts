import { create } from 'zustand';
import {
  Users,
  Shield,
  Key,
  Settings,
  Building,
  Gauge,
  Radio,
  Monitor,
  Calendar,
  Clipboard,
  MessageSquare,
  Mail,
  BarChart3,
  LucideIcon,
  Layers,
  CircuitBoard,
  Activity,
  Map,
  FileSpreadsheet,
  Bell,
  Search,
  Zap,
  Cog,
  Link,
  Cpu,
  Network,
  Workflow,
  Wrench,
  Briefcase,
  HardHat,
  Home,
  LayoutDashboard,
  BellRing, // ✅ Icono de notificaciones (más específico)
} from "lucide-react";

interface ModuleIconsState {
  iconMap: Record<string, LucideIcon>;
  getModuleIcon: (moduleName: string) => LucideIcon;
  addCustomIcon: (moduleName: string, icon: LucideIcon) => void;
}

export const useModuleIconsStore = create<ModuleIconsState>((set, get) => ({
  iconMap: {
    // Iconos existentes
    'Dashboard': LayoutDashboard,
    'dashboard': LayoutDashboard,
    'DASHBOARD': LayoutDashboard,
    'Home': Home,
    'home': Home,
    'HOME': Home,
    'Inicio': Home,
    'inicio': Home,
    'Application': Monitor,
    'Chat': MessageSquare,
    'Email': Mail,
    'Kanban': Clipboard,
    'Task': Clipboard,
    'Calendar': Calendar,
    'Project': Clipboard,
    'Users': Users,
    'Settings': Settings,
    'Reports': Clipboard,
    'Analytics': BarChart3,
    'Mapa': Map,
    'usuarios': Users,
    'roles': Shield,
    'permisos': Key,
    'general': Settings,
    'empresas': Building,
    'tipoSensores': Activity,
    'tiposensor': Activity,
    'diot': Gauge,
    'sensores': Radio,
    'tiposistema': Layers,
    'daq': CircuitBoard,
    'DataSheet': FileSpreadsheet,
    'datasheet': FileSpreadsheet,
    'Alertas': Bell,
    'alertas': Bell,
    'Auditoria': Search,
    'auditoria': Search,
    'application': Monitor,
    'chat': MessageSquare,
    'email': Mail,
    'kanban': Clipboard,
    'task': Clipboard,
    'calendar': Calendar,
    'project': Clipboard,
    'users': Users,
    'settings': Settings,
    'reports': Clipboard,
    'analytics': BarChart3,
    'actuadores': Cog,
    'tipoactuadores': Zap,
    
    // ✅ ICONOS PARA NOTIFICACIONES AGREGADOS
    'notificaciones': BellRing,
    'Notificaciones': BellRing,
    'NOTIFICACIONES': BellRing,
    'Notificación': BellRing,
    'notificación': BellRing,
    'Notification': BellRing,
    'notification': BellRing,
    'NOTIFICATION': BellRing,
    'Alerts': Bell, // También puede ser Bell (alternativa)
    'alerts': Bell,
    'ALERTS': Bell,
    
    // NUEVOS ICONOS AGREGADOS (sin duplicados)
    'relaciones': Link,
    'tipoautomatizacion': Workflow,
    'tipoautomatizacionrelacion': Network,
    'automatizaciondetalle': Cpu,
    
    // ICONO PARA TRABAJOS AÑADIDO
    'trabajos': Wrench,
    'Trabajos': Wrench,
    'TRABAJOS': Wrench,
    'Trabajo': Wrench,
    'trabajo': Wrench,
    'Mantenimiento': Wrench,
    'mantenimiento': Wrench,
    'Works': Briefcase,
    'works': Briefcase,
    'Projects': Briefcase,
    'projects': Briefcase,
    'Jobs': HardHat,
    'jobs': HardHat,
    
    // Variaciones adicionales para módulos comunes
    'Panel': LayoutDashboard,
    'panel': LayoutDashboard,
    'Control': Settings,
    'control': Settings,
    'Configuracion': Settings,
    'configuracion': Settings,
    'Configuración': Settings,
    'configuración': Settings,
    'Perfil': Users,
    'perfil': Users,
    'Profile': Users,
    'profile': Users,
    'Mensajes': MessageSquare,
    'mensajes': MessageSquare,
    'Correo': Mail,
    'correo': Mail,
    'Empresa': Building,
    'empresa': Building,
    'Reportes': Clipboard,
    'reportes': Clipboard,
    'Estadisticas': BarChart3,
    'estadisticas': BarChart3,
    'Estadísticas': BarChart3,
    'estadísticas': BarChart3,
    'Map': Map,
    'map': Map,
    'Sensor': Activity,
    'sensor': Activity,
    'Actuador': Cog,
    'actuador': Cog,
  },

  getModuleIcon: (moduleName: string) => {
    const { iconMap } = get();
    
    // Normalizar el nombre del módulo
    const normalizedModule = moduleName.trim();

    return iconMap[normalizedModule] ||
           iconMap[normalizedModule.toLowerCase()] ||
           iconMap[normalizedModule.charAt(0).toUpperCase() + normalizedModule.slice(1).toLowerCase()] ||
           iconMap[normalizedModule.split(' ')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                   .join('')] ||
           LayoutDashboard; // Icono por defecto
  },

  addCustomIcon: (moduleName: string, icon: LucideIcon) => {
    set((state) => ({
      iconMap: {
        ...state.iconMap,
        // Agregar múltiples variaciones del nombre
        [moduleName]: icon,
        [moduleName.toLowerCase()]: icon,
        [moduleName.toUpperCase()]: icon,
        [moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase()]: icon,
      }
    }));
  },
}));