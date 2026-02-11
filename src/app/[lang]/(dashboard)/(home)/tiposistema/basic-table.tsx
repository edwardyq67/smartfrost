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
import { useEffect, useMemo, useState, useCallback, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock } from "lucide-react";
import { TipoSistema, tiposSistemaService, TipoSistemaResponse, Pager } from "@/lib/tipoSistema/UseTipoSistema";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Modales - mantenidos en el padre

const TiposSistemaEditar = dynamic(() => import("./components/TiposSistemaEditar").then(mod => mod.TiposSistemaEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones - versión simplificada para TabletGlobal
const TipoSistemaActions = memo(({ 
  tipoSistema, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  tipoSistema: TipoSistema; 
  onEdit: () => void; 
  onDelete: () => void;
  hasEditPermission: boolean;
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

          {hasEditPermission && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}

          {hasDeletePermission && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          )}

          {!hasEditPermission && !hasDeletePermission && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Sin permisos disponibles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

TipoSistemaActions.displayName = 'TipoSistemaActions';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("tipoSistema");
  
  const hasEditPermission = hasSpecificRoute("PATCH", "tipoSistema/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "tipoSistema/eliminar");
  
  const [data, setData] = useState<TipoSistema[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingTipoSistema, setEditingTipoSistema] = useState<TipoSistema | null>(null);
  const [deletingTipoSistema, setDeletingTipoSistema] = useState<TipoSistema | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "nombre",
      header: "Tipo Sistema",
      type: "text"
    },
    {
      key: "descripcion",
      header: "Descripción",
      type: "text"
    },
    {
      key: "fecha_creacion",
      header: "Fecha de creación",
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
      key: "nombre",
      header: "Tipo Sistema",
      hideable: false,
    },
    {
      key: "descripcion",
      header: "Descripción",
      hideable: true,
    },
    {
      key: "fecha_creacion",
      header: "Fecha de creación",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((tiposSistema: TipoSistema[]) => {
    return tiposSistema.map(tipoSistema => {
      const fechaObj = new Date(tipoSistema.created_at);
      const fechaFormateada = `${fechaObj.toLocaleDateString()} ${fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      return {
        ...tipoSistema,
        // Formatear descripción (truncar si es muy larga)
        descripcion: tipoSistema.descripcion 
          ? (tipoSistema.descripcion.length > 40 
              ? `${tipoSistema.descripcion.substring(0, 40)}...` 
              : tipoSistema.descripcion)
          : "Sin descripción",
        // Formatear fecha
        fecha_creacion: fechaFormateada
      };
    });
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(tipoSistema => 
        tipoSistema.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        tipoSistema.descripcion?.toLowerCase().includes(filterValue.toLowerCase())
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
  const fetchTiposSistema = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: TipoSistemaResponse = await tiposSistemaService.getTipoSistemas({ page, size });
      
      if (response.data && response.data.data) {
        setData(response.data.data);
        setPager(response.data.pager);
      } else {
        setData([]);
        setPager(null);
      }
      
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar tipos sistema");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditTipoSistema = useCallback((tipoSistema: TipoSistema) => {
    setEditingTipoSistema(tipoSistema);
  }, []);

  const handleDeleteTipoSistema = useCallback((tipoSistema: TipoSistema) => {
    setDeletingTipoSistema(tipoSistema);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingTipoSistema(null);
    fetchTiposSistema(currentPage, 10);
  }, [currentPage, fetchTiposSistema]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTipoSistema) return;
    
    try {
      setDeleteLoading(true);
      await tiposSistemaService.deleteTipoSistema(deletingTipoSistema.uuid);
      setDeletingTipoSistema(null);
      fetchTiposSistema(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar tipo sistema:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTipoSistema, currentPage, fetchTiposSistema]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalTipoSistema = rowData._original || rowData;
    
    return (
      <TipoSistemaActions 
        tipoSistema={originalTipoSistema} 
        onEdit={() => handleEditTipoSistema(originalTipoSistema)}
        onDelete={() => handleDeleteTipoSistema(originalTipoSistema)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditTipoSistema, handleDeleteTipoSistema, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchTiposSistema(1, 10);
  }, [fetchTiposSistema]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTiposSistema(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchTiposSistema]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchTiposSistema(newPage, 10);
  }, [fetchTiposSistema]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando tipos sistema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchTiposSistema(1, 10)}
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
            placeholder="Filtrar por nombre o descripción..."
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
        {editingTipoSistema && (
          <Dialog open={!!editingTipoSistema} onOpenChange={() => setEditingTipoSistema(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Tipo Sistema</DialogTitle>
              </DialogHeader>
              <TiposSistemaEditar 
                tipoSistema={editingTipoSistema}
                onTipoSistemaEditado={handleCloseEdit}
                open={!!editingTipoSistema}
                onOpenChange={(open) => !open && setEditingTipoSistema(null)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingTipoSistema && (
          <Dialog open={!!deletingTipoSistema} onOpenChange={() => setDeletingTipoSistema(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Tipo Sistema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el tipo sistema <strong>{deletingTipoSistema.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingTipoSistema(null)}
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