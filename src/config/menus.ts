"use client";
import { useAuthStore, type ModulePermission, type RoutePermission } from "@/store/auth.store";
import { useModuleIconsStore } from "@/store/moduleIconsStore";
import { useEffect, useState, useMemo } from "react";

export interface MenuItemProps {
  title: string;
  icon: any;
  href?: string;
  child?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  nested?: MenuItemProps[];
  onClick: () => void;
}

const moduleHassidebarPermission = (module: ModulePermission): boolean => {
  return module.ruta.some((ruta) =>
    ruta.metodo === "GET" && ruta.ruta.includes("sidebar")
  );
};

const getModuleBaseRoute = (moduleName: string, routes: RoutePermission[]): string => {
  const baseRoute = routes.find(r =>
    r.metodo === "GET" &&
    r.ruta === moduleName.toLowerCase().replace(/\s+/g, '')
  );

  if (baseRoute) {
    return `/en/${baseRoute.ruta}`;
  }

  return `/en/${moduleName.toLowerCase().replace(/\s+/g, '-')}`;
};

export const useMenusConfig = () => {
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const permisos = useAuthStore((state) => state.permisos);
  const getModuleIcon = useModuleIconsStore((state) => state.getModuleIcon);

  useEffect(() => {
    const permisosValidos = permisos.filter(moduleHassidebarPermission);
    const generatedMenuItems: MenuItemProps[] = [];

    for (const modulo of permisosValidos) {
      const sidebarRoute = modulo.ruta.find(ruta =>
        ruta.metodo === "GET" && ruta.ruta.includes("sidebar")
      );

      if (sidebarRoute) {
        const baseRoute = getModuleBaseRoute(modulo.modulo, modulo.ruta);

        generatedMenuItems.push({
          title: modulo.modulo,
          icon: getModuleIcon(modulo.modulo),
          href: baseRoute,
          onClick: () => { },
        });
      }
    }

    setMenuItems(generatedMenuItems);
  }, [permisos, getModuleIcon]);

  const config = useMemo(() => ({
    mainNav: menuItems,
    sidebarNav: {
      modern: menuItems,
      classic: [
        {
          isHeader: true,
          title: "menu",
        },
        ...menuItems
      ],
    },
  }), [menuItems]);

  return config;
};

export const getInitialMenuConfig = (): { mainNav: MenuItemProps[], sidebarNav: any } => {
  const state = useAuthStore.getState();
  const { getModuleIcon } = useModuleIconsStore.getState();

  const permisosValidos = state.permisos.filter(moduleHassidebarPermission);
  const menuItems: MenuItemProps[] = [];

  for (const modulo of permisosValidos) {
    const sidebarRoute = modulo.ruta.find(ruta =>
      ruta.metodo === "GET" && ruta.ruta.includes("sidebar")
    );

    if (sidebarRoute) {
      const baseRoute = getModuleBaseRoute(modulo.modulo, modulo.ruta);

      menuItems.push({
        title: modulo.modulo,
        icon: getModuleIcon(modulo.modulo),
        href: baseRoute,
        onClick: () => { },
      });
    }
  }

  return {
    mainNav: menuItems,
    sidebarNav: {
      modern: menuItems,
      classic: [
        {
          isHeader: true,
          title: "menu",
        },
        ...menuItems
      ],
    },
  };
};

export const menusConfig = {
  get mainNav() {
    return getInitialMenuConfig().mainNav;
  },
  get sidebarNav() {
    return getInitialMenuConfig().sidebarNav;
  },
};

export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number]
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number]
export type MainNavType = (typeof menusConfig.mainNav)[number]
