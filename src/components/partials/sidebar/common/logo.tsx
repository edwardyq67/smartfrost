import React from "react";
import Image from "next/image";
import { useSidebar } from "@/store";
import { Menu } from "lucide-react";

const SidebarLogo = ({ hovered = false }: { hovered?: boolean }) => {
  const { sidebarType, setCollapsed, collapsed } = useSidebar();
  
  // Determinar si mostrar texto
  const showText = !collapsed || hovered;
  
  return (
    <div className="px-4 py-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-x-3 min-w-0">
          {/* Logo como imagen */}
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src="/images/logo/_Logo smartfrost.png" // Ajusta la ruta
              alt="Smartfrost Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          
          {/* Texto del logo - condicional */}
          {showText && (
            <div className="flex-1 min-w-0">
              <span className="text-xl font-semibold text-primary truncate block">
                Smartfrost
              </span>
            </div>
          )}
        </div>
        
        {/* Botón para colapsar/expandir - solo en classic */}
        {sidebarType === "classic" && showText && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-none lg:block hidden p-1 rounded-md hover:bg-muted transition-colors"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarLogo;