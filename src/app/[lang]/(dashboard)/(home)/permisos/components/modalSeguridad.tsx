// components/ui/modal-seguridad.tsx
"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock, Shield, Loader2, AlertCircle } from "lucide-react";
import { usePermisosStore } from "@/store/permisos/permisosStore";
import { permisosService } from "@/lib/permisos/UsePermisos";
import { useRefreshDataPermisos } from "@/store/permisos/refreshDataPermisosStore";
import { Permiso } from '@/lib/permisos/UsePermisos';

interface ModalSeguridadProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  icon?: React.ReactNode;
  uuidDetalle?: string;
  descripcionPermiso?: string;
  uuidPermiso?: string;
  valorActual?: number;
  nuevoValor?: number;
}

export const ModalSeguridad: React.FC<ModalSeguridadProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "Cancelar",
  variant = "default",
  loading = false,
  icon = <Shield className="h-5 w-5" />,
  uuidDetalle,
  descripcionPermiso,
  uuidPermiso,
  valorActual,
  nuevoValor,
}) => {
  const { 
    rolSeleccionado, 
    nombreModuloSeleccionado,
    setModulosDesdeAPI 
  } = usePermisosStore();
  const { triggerRefresh } = useRefreshDataPermisos();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const recargarPermisosModulo = async () => {
    if (!rolSeleccionado?.uuid || !nombreModuloSeleccionado) return;

    try {
      const response = await permisosService.getPermisosPorRolYModulo({
        id_rol: rolSeleccionado.uuid,
        modulo: nombreModuloSeleccionado
      });
      
      // CORRECCIÓN: response.data es directamente el objeto ModuloPermisos
      if (response.data && response.data && response.data.length > 0) {
        const permisosSimplificados = response.data.map((permiso: any) => ({
          descripcion: permiso.descripcion,
          valor: permiso.valor,
          uuid_permiso: permiso.uuid_permiso,
          uuid_detalle: permiso.uuid_detalle
        }));
        
        setModulosDesdeAPI(permisosSimplificados);
      }
    } catch (error) {
      console.error('❌ Error al recargar permisos del módulo:', error);
    }
  };

  const handleCreatePermiso = async () => {
    if (!uuidPermiso || !rolSeleccionado?.uuid) return;

    setIsProcessing(true);
    try {
      await permisosService.createPermiso({
        id_permiso: uuidPermiso,
        id_rol: rolSeleccionado.uuid
      });
      
      // Recargar los permisos del módulo después de crear
      await recargarPermisosModulo();
      triggerRefresh();
      onConfirm();
    } catch (error) {
      console.error("❌ Error al crear permiso:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePermiso = async () => {
    if (!uuidDetalle || uuidDetalle === "0") return;

    setIsProcessing(true);
    try {
      if (nuevoValor === 1) {
        await permisosService.activarPermiso(uuidDetalle);
      } else {
        await permisosService.desactivarPermiso(uuidDetalle);
      }
      
      // Recargar los permisos del módulo después de actualizar
      await recargarPermisosModulo();
      triggerRefresh();
      onConfirm();
    } catch (error) {
      console.error("❌ Error al actualizar permiso:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (uuidDetalle === "0") {
      handleCreatePermiso();
    } else {
      handleUpdatePermiso();
    }
  };

  // Función para renderizar el icono según la variante
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    if (variant === "destructive") {
      return <AlertCircle className="h-5 w-5" />;
    }
    
    return <Shield className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent   overflowVisible={true} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              variant === "destructive" 
                ? "bg-destructive/10 text-destructive" 
                : "bg-primary/10 text-primary"
            }`}>
              {renderIcon()}
            </div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            {description}
            {/* Mostrar mensaje adicional según el tipo de operación */}
            {uuidDetalle === "0" ? (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-1">
                <span>💡</span>
                <span>Este permiso será creado ya que no existe en el sistema.</span>
              </div>
            ) : (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-1">
                <span>🔄</span>
                <span>Este permiso existente será {nuevoValor === 1 ? "activado" : "desactivado"}.</span>
              </div>
            )}
          </div>
        </DialogDescription>

        <DialogFooter className="flex space-x-2 sm:space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading || isProcessing}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isProcessing}
            className="flex-1"
          >
            {(loading || isProcessing) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uuidDetalle === "0" ? "Creando..." : (nuevoValor === 1 ? "Activando..." : "Desactivando...")}
              </>
            ) : (
              uuidDetalle === "0" ? "Crear" : confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalSeguridad;