"use client";

import { useAuthStore } from "@/store/auth.store";
import ReportsSnapshot from "./components/reports-snapshot";
import Trabajo from "../trabajos/basic-table";
import UsersStat from "./components/users-stat";

interface DashboardPageViewProps {
  trans: {
    [key: string]: string;
  };
}

const DashboardPageView = ({ trans }: DashboardPageViewProps) => {
  const { user } = useAuthStore();
  const hasEmpresa = Boolean(user?.empresa);

  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-medium text-default-800">
          Smartfrost
        </div>
      </div>
      
      {/* reports area */}
      <div className={`grid grid-cols-12 gap-6`}>
        {hasEmpresa ? (
          // Si tiene empresa: ReportsSnapshot ocupa toda la fila
          <div className="col-span-12">
            <ReportsSnapshot empresaId={user?.empresa} />
          </div>
        ) : (
          // Si NO tiene empresa: ReportsSnapshot y UsersStat lado a lado
          <>
            <div className="col-span-12 lg:col-span-8">
              <ReportsSnapshot />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <UsersStat />
            </div>
          </>
        )}
      </div>
      
      <div className="bg-white dark:bg-[#1F2937] p-4 pt-6">
        {/* Mostrar solo 6 trabajos en el dashboard */}
        <Trabajo size={6} />
      </div>
    </div>
  );
};

export default DashboardPageView;