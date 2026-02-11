"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { useRefreshTableAuditoria } from "@/store/auditoria/refreshTableAuditoria";
import dynamic from 'next/dynamic';

// ✅ Carga diferida del componente pesado BasicDataTable
// Solo se cargará cuando el usuario entre a esta página
const BasicDataTable = dynamic(
  () => import("./basic-table"),
  {
    ssr: false // No cargar durante SSR, solo en cliente
  }
);

const AuditoriaPage = () => {
  const { refreshTrigger } = useRefreshTableAuditoria();

  return (
    <div className="space-y-5">
      <Card className="ltr:mr-1 rtl:ml-1 pt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="flex-1 leading-normal">Auditoría</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* ✅ BasicDataTable se carga solo al entrar a esta página */}
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Cargando registros de auditoría</p>
                  <p className="text-xs text-gray-500 mt-1">Por favor espera...</p>
                </div>
              </div>
            </div>
          }>
            <BasicDataTable refreshTrigger={refreshTrigger} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaPage;