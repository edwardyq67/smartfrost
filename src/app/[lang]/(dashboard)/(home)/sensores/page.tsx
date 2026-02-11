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
import { useRefreshTableSensores } from "@/store/sensores/refreshTableSensores";

// ✅ Carga diferida del componente de tabla de sensores
const SensorsDataTable = dynamic(
  () => import("./basic-table"),
  {
    ssr: false
  }
);

// ✅ Carga diferida del diálogo para nuevo sensor
const SensorCrearDialog = dynamic(
  () => import("./componets/sensoresAgregar").then(mod => ({
    default: ({ onSensorCreado }: { onSensorCreado: () => void }) => (
      <DialogContent overflowVisible={true} size="3xl">
        <DialogHeader>
          <DialogTitle>Nuevo Sensor</DialogTitle>
          <DialogDescription>
            Crear un nuevo sensor
          </DialogDescription>
        </DialogHeader>
        <mod.SensorCrear onSensorCreado={onSensorCreado} />
      </DialogContent>
    )
  })),
  {
    ssr: false
  }
);

const SensorsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { refreshTrigger } = useRefreshTableSensores();
  
  const { hasSpecificRoute } = useModulePermissions("sensores");
  const hasCreatePermission = hasSpecificRoute("POST", "sensors/crear");

  const handleSensorCreado = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sensores</CardTitle>
          {hasCreatePermission && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 text-primary-foreground ltr:mr-1 rtl:ml-1" />
                  Agregar
                </Button>
              </DialogTrigger>
              <Suspense fallback={
                <DialogContent className="flex items-center justify-center min-h-[200px]" overflowVisible={true} size="3xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando formulario...</p>
                  </div>
                </DialogContent>
              }>
                <SensorCrearDialog onSensorCreado={handleSensorCreado} />
              </Suspense>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Cargando sensores</p>
                  <p className="text-xs text-gray-500 mt-1">Esto puede tomar unos segundos</p>
                </div>
              </div>
            </div>
          }>
            <SensorsDataTable refreshTrigger={refreshTrigger} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorsPage;