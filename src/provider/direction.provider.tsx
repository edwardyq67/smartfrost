// provider/direction.provider.tsx
"use client";
import React, { useState } from "react";
import { useThemeStore } from "@/store";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";

const DirectionProvider = ({ children, lang }: { children: React.ReactNode; lang: string }) => {
  const { isRtl } = useThemeStore();
  const [isClient, setIsClient] = useState(false);

  // Detectar cuando estamos en el cliente
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const direction = lang === "ar" || isRtl ? "rtl" : "ltr";
  const ssrDirection = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={isClient ? direction : ssrDirection}>
      <RadixDirectionProvider dir={isClient ? direction : ssrDirection}>
        {children}
      </RadixDirectionProvider>
    </div>
  );
};

export default DirectionProvider;