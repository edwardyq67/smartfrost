"use client";

import { useAuthStore } from "@/store/auth.store";
import { useMemo } from "react";

export const useModulePermissions = (moduleName: string) => { // ✅ Quitar specificRoute de aquí
  const permisos = useAuthStore((state) => state.permisos);
  
  return useMemo(() => {
    const module = permisos.find((permiso) => 
      permiso.modulo.toLowerCase() === moduleName.toLowerCase()
    );
    
    if (!module) return { 
      hasAny: false, 
      hasCreate: false, 
      hasRead: false, 
      hasUpdate: false, 
      hasDelete: false, 
      hasSpecificRoute: () => false,
      rutas: [],
      module: null 
    };
    
    const rutas = module.ruta || [];
    
    // ✅ FUNCIÓN CORREGIDA
    const hasSpecificRoute = (method: string, routePattern: string) => {
      return rutas.some(r => 
        r.metodo === method && 
        r.ruta === routePattern // ← Comparar DIRECTAMENTE la ruta
      );
    };
    
    return {
      hasAny: true,
      hasCreate: rutas.some(r => r.metodo === "POST"),
      hasRead: rutas.some(r => r.metodo === "GET"),
      hasUpdate: rutas.some(r => r.metodo === "PUT" || r.metodo === "PATCH"),
      hasDelete: rutas.some(r => r.metodo === "DELETE"),
      hasSpecificRoute, // ← Esta función ahora funcionará correctamente
      rutas,
      module,
    };
  }, [permisos, moduleName]);
};