"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import dynamic from 'next/dynamic';

// ✅ Carga diferida de BasicDataTable - solo cuando se monta
const BasicDataTable = dynamic(
  () => import("./basic-table"),
  {
    ssr: false // Solo en cliente
  }
);

// ✅ Carga diferida del diálogo - solo cuando se abre
const TipoSensorAgregarDialog = dynamic(
  () => import("./components/TipoSensorAgregar").then(mod => ({
    default: ({ onTipoSensorCreado }: { onTipoSensorCreado: () => void }) => (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Tipo de Sensor</DialogTitle>
          <DialogDescription>
            Crear un nuevo tipo de sensor en el sistema
          </DialogDescription>
        </DialogHeader>
        <mod.TipoSensorAgregar onTipoSensorCreado={onTipoSensorCreado} />
      </DialogContent>
    )
  })),
  {
    ssr: false // Solo carga al abrir diálogo
  }
);

const DataTablePage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { hasSpecificRoute } = useModulePermissions("tipoSensores");
  const hasCreatePermission = hasSpecificRoute("POST", "tipoSensores/crear");

  const handleTipoSensorCreado = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tipos de Sensor</CardTitle>
          {hasCreatePermission && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 text-primary-foreground ltr:mr-1 rtl:ml-1" />
                  Agregar
                </Button>
              </DialogTrigger>
              <Suspense fallback={
                <DialogContent className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">Preparando formulario...</p>
                  </div>
                </DialogContent>
              }>
                <TipoSensorAgregarDialog onTipoSensorCreado={handleTipoSensorCreado} />
              </Suspense>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {/* ✅ BasicDataTable se carga solo al entrar a esta página */}
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Cargando tipos de sensor</p>
                  <p className="text-xs text-gray-500 mt-1">Por favor espera...</p>
                </div>
              </div>
            </div>
          }>
            <BasicDataTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataTablePage;