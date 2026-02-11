import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { themes } from "@/config/thems";
import { useThemeStore } from "@/store";
import { useTheme } from "next-themes";
import { CheckCircle, LayoutGrid, LayoutList, LayoutTemplate } from "lucide-react"; // ✅ SOLO lucide-react

const layoutOptions = [
  {
    key: "vertical",
    label: "Vertical",
    icon: LayoutList, // ✅ Usamos el icono de lucide-react
  },
  {
    key: "horizontal",
    label: "Horizontal",
    icon: LayoutGrid, // ✅ Usamos el icono de lucide-react
  },
  {
    key: "semibox",
    label: "Semi-Box",
    icon: LayoutTemplate, // ✅ Usamos el icono de lucide-react
  },
];

const SelectLayout = () => {
  const { layout, setLayout } = useThemeStore();
  const { resolvedTheme: mode } = useTheme();
  const { theme: config } = useThemeStore();
  const newTheme = themes.find((theme) => theme.name === config);

  return (
    <div
      style={{
        "--theme-primary": `hsl(${newTheme?.cssVars[mode === "dark" ? "dark" : "light"].primary
          })`,
      } as React.CSSProperties}
    >
      <div className="mb-2 relative inline-block px-3 py-[3px] rounded-md before:bg-[--theme-primary] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:rounded before:opacity-10 before:z-[-1] text-[--theme-primary] text-xs font-medium">
        Layout
      </div>
      <div className="text-muted-foreground font-normal text-xs mb-4">
        Choose your layout
      </div>
      <div className="grid grid-cols-3 gap-3">
        {layoutOptions.map((layoutOption) => {
          const IconComponent = layoutOption.icon; // ✅ Asignamos el componente de icono
          
          return (
            <div key={layoutOption.key}>
              <button
                onClick={() => setLayout(layoutOption.key)}
                className={cn("border block rounded relative h-[72px] w-full", {
                  "text-[--theme-primary] border-[--theme-primary]":
                    layout === layoutOption.key,
                  "text-muted-foreground border-border":
                    layout !== layoutOption.key,
                })}
              >
                {layout === layoutOption.key && (
                  <CheckCircle 
                    className="text-[--theme-primary] absolute top-1 right-1 w-5 h-5" 
                  />
                )}
                <IconComponent className="w-8 h-8 mx-auto" /> {/* ✅ Renderizamos el icono */}
              </button>
              <Label className="text-muted-foreground font-normal block mt-2">
                {layoutOption.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectLayout;