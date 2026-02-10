"use client";
import { Inter } from "next/font/google";
import { useThemeStore } from "@/store";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster as ReactToaster } from "@/components/ui/toaster";
import { Toaster } from "react-hot-toast";
import { SonnToaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const Providers = ({ children }: { children: React.ReactNode }) => {
  const { theme, radius } = useThemeStore();
  const location = usePathname();

  return (
    <div 
      className={cn(
        "dash-tail-app h-full", 
        location === "/" ? "" : "theme-" + theme
      )}
      style={{
        "--radius": `${radius}rem`,
      } as React.CSSProperties}
    >
      <ThemeProvider
        attribute="class"
        enableSystem={false}
        defaultTheme="light"
      >
        {children}
        <ReactToaster />
        <Toaster />
        <SonnToaster />
      </ThemeProvider>
    </div>
  );
};

export default Providers;