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

// ✅ Carga diferida del componente de tabla DIOT
const DiotDataTable = dynamic(
  () => import("./basic-table"),
  {
    ssr: false
  }
);

// ✅ Carga diferida del diálogo para nueva declaración DIOT
const DiotCrearDialog = dynamic(
  () => import("./componets/diotAgregar").then(mod => ({
    default: ({ onDiotCreada }: { onDiotCreada: () => void }) => (
      <DialogContent overflowVisible={true} size="3xl">
        <DialogHeader>
          <DialogTitle>Nueva Declaración DIOT</DialogTitle>
          <DialogDescription>
            Crear una nueva declaración del DIOT
          </DialogDescription>
        </DialogHeader>
        <mod.DiotCrear />
      </DialogContent>
    )
  })),
  {
    ssr: false
  }
);

const DiotPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { hasSpecificRoute } = useModulePermissions("diot");
  const hasCreatePermission = hasSpecificRoute("POST", "diot/crear");

  const handleDiotCreada = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>DIOT</CardTitle>
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
                <DiotCrearDialog onDiotCreada={handleDiotCreada} />
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
                  <p className="text-sm font-medium text-gray-700">Cargando declaraciones DIOT</p>
                  <p className="text-xs text-gray-500 mt-1">Esto puede tomar unos segundos</p>
                </div>
              </div>
            </div>
          }>
            <DiotDataTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiotPage;