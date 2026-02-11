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
import { useRefreshTableActuadores } from "@/store/actuadores/refreshTableActuadores";
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
const ActuadoresAgregarDialog = dynamic(
  () => import("./components/ActuadoresAgregar").then(mod => ({
    default: ({ onActuadorCreado }: { onActuadorCreado: () => void }) => (
      <DialogContent overflowVisible={true} size="3xl">
        <DialogHeader>
          <DialogTitle>Agregar Actuador</DialogTitle>
          <DialogDescription>
            Crear un nuevo actuador en el sistema
          </DialogDescription>
        </DialogHeader>
        <mod.ActuadoresAgregar onActuadorCreado={onActuadorCreado} />
      </DialogContent>
    )
  })),
  {
    ssr: false // Solo carga al abrir diálogo
  }
);

const DataTablePage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { refreshTrigger } = useRefreshTableActuadores();
  const { hasCreate } = useModulePermissions("actuadores");

  const handleActuadorCreado = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actuadores</CardTitle>
          {hasCreate && (
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
                    <p className="text-sm text-gray-600 mt-2">Preparando formulario...</p>
                  </div>
                </DialogContent>
              }>
                <ActuadoresAgregarDialog onActuadorCreado={handleActuadorCreado} />
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
                  <p className="text-sm font-medium text-gray-700">Cargando lista de actuadores</p>
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

export default DataTablePage;