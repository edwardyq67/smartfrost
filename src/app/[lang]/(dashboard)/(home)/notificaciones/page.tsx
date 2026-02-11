"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, Suspense } from "react";
import { useRefreshNotificaciones } from "@/store/notificaciones/refreshNotificacionesStore";
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

// ✅ Carga diferida de componentes pesados
const BasicDataTable = dynamic(
  () => import("./basic-table"),
  {
    ssr: false
  }
);

const NotificacionesAgregarDialog = dynamic(
  () => import("./components/notificacionesAgregar").then(mod => ({
    default: ({ onNotificacionCreada, onClose }: { 
      onNotificacionCreada: () => void, 
      onClose: () => void 
    }) => (
      <DialogContent overflowVisible={true} size="3xl">
        <DialogHeader>
          <DialogTitle>Crear Notificación</DialogTitle>
          <DialogDescription>
            Enviar una nueva notificación a un usuario
          </DialogDescription>
        </DialogHeader>
        <mod.default onNotificacionCreada={onNotificacionCreada} onClose={onClose} />
      </DialogContent>
    )
  })),
  {
    ssr: false
  }
);

const NotificacionesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { refreshFlag } = useRefreshNotificaciones();
  const { hasSpecificRoute } = useModulePermissions("notificaciones");
  const hasCreatePermission = hasSpecificRoute("POST", "notificaciones/crear");

  const handleNotificacionCreada = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notificaciones</CardTitle>
          {hasCreatePermission && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                  Crear
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
                <NotificacionesAgregarDialog 
                  onNotificacionCreada={handleNotificacionCreada}
                  onClose={() => setDialogOpen(false)}
                />
              </Suspense>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6">
            <div className="mb-6">
              {/* Si necesitas BasicCombobox, también hazlo dynamic */}
            </div>
            {/* ✅ BasicDataTable se carga solo al entrar a esta página */}
            <Suspense fallback={
              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">Cargando notificaciones</p>
                    <p className="text-xs text-gray-500 mt-1">Por favor espera...</p>
                  </div>
                </div>
              </div>
            }>
              <BasicDataTable refreshTrigger={refreshFlag} />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificacionesPage;