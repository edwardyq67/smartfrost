import React from "react";
import { Label } from "@/components/ui/label";
import { useSidebar, useThemeStore } from "@/store";
import { themes } from "@/config/thems";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CheckCircle, LayoutTemplate, LayoutGrid, PanelLeft } from "lucide-react"; // ✅ SOLO lucide-react

const sidebarOptions = [
  {
    key: "module",
    label: "Module",
    disabled: (layout: string) => layout === "semibox" || layout === "horizontal",
    icon: LayoutGrid, // ✅ Icono para Module
  },
  {
    key: "classic",
    label: "Classic",
    disabled: (layout: string) => layout === "semibox",
    icon: LayoutTemplate, // ✅ Icono para Classic
  },
  {
    key: "popover",
    label: "Popover",
    icon: PanelLeft, // ✅ Icono para Popover
  },
];

const SidebarChange = () => {
  const { sidebarType, setSidebarType } = useSidebar();
  const { resolvedTheme: mode } = useTheme();
  const { theme: config, layout } = useThemeStore();
  const newTheme = themes.find((theme) => theme.name === config);

  return (
    <div
      style={{
        "--theme-primary": `hsl(${newTheme?.cssVars[mode === "dark" ? "dark" : "light"].primary
          })`,
      } as React.CSSProperties}
    >
      <div className="mb-2 relative inline-block px-3 py-[3px] rounded-md before:bg-[--theme-primary] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:rounded before:opacity-10 before:z-[-1] text-[--theme-primary] text-xs font-medium">
        Sidebar Layout
      </div>
      <div className="text-muted-foreground font-normal text-xs mb-4">
        Choose your layout
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sidebarOptions.map((sidebarOption) => {
          const IconComponent = sidebarOption.icon; // ✅ Asignamos el componente de icono
          
          return (
            <div key={sidebarOption.key}>
              <button
                onClick={() => setSidebarType(sidebarOption.key)}
                disabled={sidebarOption.disabled?.(layout)}
                className={cn(
                  "border block rounded relative h-[72px] w-full disabled:cursor-not-allowed disabled:opacity-50",
                  {
                    "text-[--theme-primary] border-[--theme-primary]":
                      sidebarType === sidebarOption.key,
                    "text-muted-foreground border-border":
                      sidebarType !== sidebarOption.key,
                  }
                )}
              >
                {sidebarType === sidebarOption.key && (
                  <CheckCircle 
                    className="text-[--theme-primary] absolute top-1 right-1 w-5 h-5" 
                  />
                )}
                <IconComponent className="w-8 h-8 mx-auto" /> {/* ✅ Renderizamos el icono */}
              </button>
              <Label className="text-muted-foreground font-normal block mt-2">
                {sidebarOption.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarChange;