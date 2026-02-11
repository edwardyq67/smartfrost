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
import { TipoActuador, tipoActuadoresService, TipoActuadoresResponse, Pager } from "@/lib/tipoActuadores/UseTipoActuadores";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Modales - mantenidos en el padre

const TipoActuadoresEditar = dynamic(() => import("./components/TipoActuadoresEditar").then(mod => mod.TipoActuadoresEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones - versión simplificada para TabletGlobal
const TipoActuadorActions = memo(({ 
  tipoActuador, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  tipoActuador: TipoActuador; 
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

TipoActuadorActions.displayName = 'TipoActuadorActions';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("tipoActuadores");
  
  const hasEditPermission = hasSpecificRoute("PATCH", "tipoActuadores/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "tipoActuadores/eliminar");
  
  const [data, setData] = useState<TipoActuador[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingTipoActuador, setEditingTipoActuador] = useState<TipoActuador | null>(null);
  const [deletingTipoActuador, setDeletingTipoActuador] = useState<TipoActuador | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "nombre",
      header: "Nombre",
      type: "text"
    },
    {
      key: "codigo",
      header: "Código",
      type: "text"
    },
    {
      key: "descripcion",
      header: "Descripción",
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
      header: "Nombre",
      hideable: false,
    },
    {
      key: "codigo",
      header: "Código",
      hideable: true,
    },
    {
      key: "descripcion",
      header: "Descripción",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((tiposActuador: TipoActuador[]) => {
    return tiposActuador.map(tipoActuador => {
      return {
        ...tipoActuador,
        // Código con valor por defecto
        codigo: tipoActuador.codigo || "Sin código",
        // Descripción truncada si es muy larga
        descripcion: tipoActuador.descripcion 
          ? (tipoActuador.descripcion.length > 40 
              ? `${tipoActuador.descripcion.substring(0, 40)}...` 
              : tipoActuador.descripcion)
          : "Sin descripción"
      };
    });
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(tipoActuador => 
        tipoActuador.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        tipoActuador.codigo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        tipoActuador.descripcion?.toLowerCase().includes(filterValue.toLowerCase())
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
  const fetchTipoActuadores = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: TipoActuadoresResponse = await tipoActuadoresService.getTipoActuadores({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar tipos de actuadores");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditTipoActuador = useCallback((tipoActuador: TipoActuador) => {
    setEditingTipoActuador(tipoActuador);
  }, []);

  const handleDeleteTipoActuador = useCallback((tipoActuador: TipoActuador) => {
    setDeletingTipoActuador(tipoActuador);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingTipoActuador(null);
    fetchTipoActuadores(currentPage, 10);
  }, [currentPage, fetchTipoActuadores]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTipoActuador) return;
    
    try {
      setDeleteLoading(true);
      await tipoActuadoresService.deleteTipoActuador(deletingTipoActuador.uuid);
      setDeletingTipoActuador(null);
      fetchTipoActuadores(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar tipo de actuador:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTipoActuador, currentPage, fetchTipoActuadores]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalTipoActuador = rowData._original || rowData;
    
    return (
      <TipoActuadorActions 
        tipoActuador={originalTipoActuador} 
        onEdit={() => handleEditTipoActuador(originalTipoActuador)}
        onDelete={() => handleDeleteTipoActuador(originalTipoActuador)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditTipoActuador, handleDeleteTipoActuador, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchTipoActuadores(1, 10);
  }, [fetchTipoActuadores]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTipoActuadores(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchTipoActuadores]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchTipoActuadores(newPage, 10);
  }, [fetchTipoActuadores]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando tipos de actuadores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchTipoActuadores(1, 10)}
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
            placeholder="Filtrar por nombre o código..."
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
        {editingTipoActuador && (
          <Dialog open={!!editingTipoActuador} onOpenChange={() => setEditingTipoActuador(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Tipo de Actuador</DialogTitle>
              </DialogHeader>
              <TipoActuadoresEditar 
                tipoActuador={editingTipoActuador.uuid}
                onTipoActuadorEditado={handleCloseEdit}
                open={!!editingTipoActuador}
                onOpenChange={(open) => !open && setEditingTipoActuador(null)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingTipoActuador && (
          <Dialog open={!!deletingTipoActuador} onOpenChange={() => setDeletingTipoActuador(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Tipo de Actuador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el tipo de actuador{' '}
                  <strong>{deletingTipoActuador.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingTipoActuador(null)}
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