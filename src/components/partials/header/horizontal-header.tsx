import React from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo/_Logo_smartfrost.png";

const HorizontalHeader = ({ handleOpenSearch }: { handleOpenSearch: () => void }) => {
  return (
    <div className="flex items-center lg:gap-8 gap-3">
      {/* Logo y nombre */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Image 
              src={logo}
              alt="SmartFrost Logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
          </div>
          <span className="text-xl font-semibold text-primary lg:inline-block hidden">
            SmartFrost
          </span>
        </Link>
      </div>

      {/* Botón de búsqueda */}
      <button
        onClick={handleOpenSearch}
        className="inline-flex items-center gap-2 lg:gap-3 text-default-600 hover:text-default-900 dark:hover:text-default-300 transition-colors px-3 py-2 rounded-lg hover:bg-muted/50"
      >
        <Search className="h-4 w-4 lg:h-5 lg:w-5" />
        <span className="text-sm lg:text-base lg:inline-block hidden">
          Buscar...
        </span>
        <span className="text-xs lg:hidden inline-block">Buscar</span>
      </button>
    </div>
  );
};

export default HorizontalHeader;