"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import logo from "@/public/images/logo/_Logo_smartfrost.png";
import { useMediaQuery } from "@/hooks/use-media-query";

const LayoutLoader = () => {
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");

  return (
    <div className="h-screen flex items-center justify-center flex-col space-y-4">
      <div className="relative">
        <Image 
          src={logo}
          alt="SmartFrost Logo"
          width={isDesktop2xl ? 80 : 96}
          height={isDesktop2xl ? 80 : 96}
          className={`${isDesktop2xl ? 'w-20 h-20' : 'w-24 h-24'} animate-pulse`}
          priority
        />
      </div>
      <div className="inline-flex gap-2 items-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando aplicación...</span>
      </div>
    </div>
  );
};

export default LayoutLoader;