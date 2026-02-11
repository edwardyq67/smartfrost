"use client";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, Lock,  } from "lucide-react";
import { useEffect, useMemo, useState, useCallback, memo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { auditoriaService, AuditoriaItem, AuditoriaResponse, AuditoriaPager } from "@/lib/auditoria/UseAuditoria";
import { useAuthStore } from "@/store/auth.store";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones - versión simplificada para TabletGlobal
const AuditoriaActions = memo(({ 
  auditoria, 
  onDelete, 
  hasDeletePermission 
}: { 
  auditoria: AuditoriaItem; 
  onDelete: () => void; 
  hasDeletePermission: boolean;
}) => {

  return (
    <div className="text-end relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {hasDeletePermission ? (
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground">
               <Lock className="h-4 w-4 mr-2" />
              Sin permisos disponibles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

AuditoriaActions.displayName = 'AuditoriaActions';

// Hook personalizado para permisos
const useAuditoriaPermissions = () => {
  const state = useAuthStore.getState();
  const auditoriaModule = state.permisos.find(
    (permiso) => permiso.modulo === "auditoria"
  );

  const hasDeletePermission = auditoriaModule?.ruta.some(
    (ruta) => ruta.metodo === "DELETE" && ruta.ruta === "auditoria/eliminar"
  ) || false;

  return { hasDeletePermission };
};

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasDeletePermission } = useAuditoriaPermissions();
  
  const [data, setData] = useState<AuditoriaItem[]>([]);
  const [pager, setPager] = useState<AuditoriaPager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [deletingAuditoria, setDeletingAuditoria] = useState<AuditoriaItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "usuario",
      header: "Usuario",
      type: "text"
    },
    {
      key: "tabla",
      header: "Tabla",
      type: "text"
    },
    {
      key: "accion",
      header: "Acción",
      type: "badge",
      badgeConfig: {
        colorMap: {
          "CREATE": "success",
          "UPDATE": "warning", 
          "DELETE": "destructive"
        }
      }
    },
    {
      key: "metodo",
      header: "Método",
      type: "text"
    },
    {
      key: "id_user_info",
      header: "ID Usuario",
      type: "text"
    },
    {
      key: "path",
      header: "Endpoint",
      type: "text"
    },
    {
      key: "fecha",
      header: "Fecha",
      type: "text"
    },
    {
      key: "acciones",
      header: "Acciones",
      type: "actions"
    }
  ], []);

  // Columnas para TabletGlobal
  const tabletColumns = useMemo(() => [
    {
      key: "usuario",
      header: "Usuario",
      hideable: false,
    },
    {
      key: "tabla",
      header: "Tabla",
      hideable: true,
    },
    {
      key: "accion",
      header: "Acción",
      hideable: false,
    },
    {
      key: "metodo",
      header: "Método",
      hideable: true,
    },
    {
      key: "id_user_info",
      header: "ID Usuario",
      hideable: true,
    },
    {
      key: "path",
      header: "Endpoint",
      hideable: true,
    },
    {
      key: "fecha",
      header: "Fecha",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((auditoriaItems: AuditoriaItem[]) => {
    return auditoriaItems.map(auditoria => {
      // Determinar color del badge de acción
      const getAccionColor = (accion: string) => {
        switch (accion) {
          case "CREATE": return "success";
          case "UPDATE": return "warning";
          case "DELETE": return "destructive";
          default: return "default";
        }
      };
      
      // Formatear fecha
      const fechaFormateada = auditoria.created_at 
        ? new Date(auditoria.created_at).toLocaleString()
        : "N/A";
      
      // ID de usuario con valor por defecto
      const idUserInfo = auditoria.id_user 
        ? auditoria.id_user.toString()
        : "Anonymous";
      
      return {
        ...auditoria,
        // Usuario
        usuario: auditoria.usuario || "N/A",
        // Tabla
        tabla: auditoria.tabla || "N/A",
        // Acción con color
        accion: auditoria.accion || "N/A",
        accion_color: getAccionColor(auditoria.accion || ""),
        // Método
        metodo: auditoria.metodo || "N/A",
        // ID Usuario
        id_user_info: idUserInfo,
        // Endpoint (truncar si es muy largo)
        path: auditoria.path 
          ? (auditoria.path.length > 30 
              ? `${auditoria.path.substring(0, 30)}...` 
              : auditoria.path)
          : "N/A",
        // Fecha formateada
        fecha: fechaFormateada
      };
    });
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(auditoria => 
        auditoria.usuario?.toLowerCase().includes(filterValue.toLowerCase()) ||
        auditoria.tabla?.toLowerCase().includes(filterValue.toLowerCase()) ||
        auditoria.accion?.toLowerCase().includes(filterValue.toLowerCase()) ||
        auditoria.metodo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        auditoria.path?.toLowerCase().includes(filterValue.toLowerCase()) ||
        (auditoria.id_user && auditoria.id_user.toString().includes(filterValue))
      );
    }
    
    // Preparar datos (formatear campos)
    const preparedData = prepareDataForTable(filteredData);
    
    return transformDataForTable(preparedData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue, prepareDataForTable]);

  // Fetch de datos
  const fetchAuditoria = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuditoriaResponse = await auditoriaService.getAuditoria({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar auditoría");
      console.error("Error fetching auditoría:", err);
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleDeleteAuditoria = useCallback((auditoria: AuditoriaItem) => {
    setDeletingAuditoria(auditoria);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingAuditoria) return;
    
    try {
      setDeleteLoading(true);
      await auditoriaService.deleteAuditoria(deletingAuditoria.uuid);
      setDeletingAuditoria(null);
      fetchAuditoria(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar auditoría:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingAuditoria, currentPage, fetchAuditoria]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalAuditoria = rowData._original || rowData;
    
    return (
      <AuditoriaActions 
        auditoria={originalAuditoria} 
        onDelete={() => handleDeleteAuditoria(originalAuditoria)}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleDeleteAuditoria, hasDeletePermission]);

  useEffect(() => {
    fetchAuditoria(1, 10);
  }, [fetchAuditoria]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchAuditoria(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchAuditoria]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchAuditoria(newPage, 10);
  }, [fetchAuditoria]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando auditoría...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchAuditoria(1, 10)}
          className="ml-4"
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Input de filtro en el padre */}
      <div className="mb-4 px-4">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Filtrar por usuario, tabla, acción, método..."
            value={filterValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full h-10 px-4 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          {filterValue && (
            <button
              onClick={() => handleFilterChange("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center">Cargando tabla...</div>}>
        <TabletGlobal 
          dataArray={dataArray}
          pager={pager}
          onPageChange={handlePageChange}
          columns={tabletColumns}
          renderActions={renderActions}
          showColumnSelector={false}
        />
      </Suspense>

      {/* Modales en el padre */}
      <Suspense fallback={null}>
        {deletingAuditoria && (
          <Dialog open={!!deletingAuditoria} onOpenChange={() => setDeletingAuditoria(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Auditoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el registro de auditoría{' '}
                  <strong>ID: {deletingAuditoria.id}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingAuditoria(null)}
                    disabled={deleteLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                    className="flex items-center"
                  >
                    {deleteLoading ? (
                      "Eliminando..."
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Suspense>
    </>
  );
}

export default BasicDataTable;