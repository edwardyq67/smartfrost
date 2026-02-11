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
import { 
  TipoSensor, 
  tipoSensorService, 
  TipoSensoresResponse, 
  Pager 
} from "@/lib/tipoSensor/UseTipoSensor";
import { useRefreshTableTipoSensores } from "@/store/tipoSensores/refresTableTipoSensor";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Modales - mantenidos en el padre

const TipoSensorEditar = dynamic(() => import("./components/TipoSensorEditar").then(mod => mod.TipoSensorEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones - versión simplificada para TabletGlobal
const TipoSensorActions = memo(({ 
  tipoSensor, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  tipoSensor: TipoSensor; 
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

TipoSensorActions.displayName = 'TipoSensorActions';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { refreshTrigger: storeRefreshTrigger } = useRefreshTableTipoSensores();
  const { hasSpecificRoute } = useModulePermissions("tipoSensores");
  
  const hasEditPermission = hasSpecificRoute("PATCH", "tipoSensor/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "tipoSensor/eliminar");
  
  const [data, setData] = useState<TipoSensor[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingTipoSensor, setEditingTipoSensor] = useState<TipoSensor | null>(null);
  const [deletingTipoSensor, setDeletingTipoSensor] = useState<TipoSensor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "nombre",
      header: "Nombre",
      type: "text"
    },
    {
      key: "uMed",
      header: "Unidad de Medida",
      type: "text"
    },
    {
      key: "creador_nombre",
      header: "Creado por",
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
      header: "Nombre",
      hideable: false,
    },
    {
      key: "uMed",
      header: "Unidad de Medida",
      hideable: true,
    },
    {
      key: "creador_nombre",
      header: "Creado por",
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
  const prepareDataForTable = useCallback((tipoSensores: TipoSensor[]) => {
    return tipoSensores.map(tipoSensor => ({
      ...tipoSensor,
      // Aplanar el objeto creador
      creador_nombre: tipoSensor.creador?.nombre || "Desconocido",
      // Formatear fecha de creación
      fecha_creacion: new Date(tipoSensor.created_at).toLocaleDateString(),
      // Asegurar que la unidad de medida tenga un valor por defecto
      uMed: tipoSensor.uMed || "Sin unidad"
    }));
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(tipoSensor => 
        tipoSensor.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        tipoSensor.uMed?.toLowerCase().includes(filterValue.toLowerCase()) ||
        tipoSensor.creador?.nombre?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    // Preparar datos (aplanar objetos anidados)
    const preparedData = prepareDataForTable(filteredData);
    
    return transformDataForTable(preparedData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue, prepareDataForTable]);

  // Fetch de datos
  const fetchTipoSensores = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: TipoSensoresResponse = await tipoSensorService.getTipoSensores({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar tipos de sensor");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditTipoSensor = useCallback((tipoSensor: TipoSensor) => {
    setEditingTipoSensor(tipoSensor);
  }, []);

  const handleDeleteTipoSensor = useCallback((tipoSensor: TipoSensor) => {
    setDeletingTipoSensor(tipoSensor);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingTipoSensor(null);
    fetchTipoSensores(currentPage, 10);
  }, [currentPage, fetchTipoSensores]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTipoSensor) return;
    
    try {
      setDeleteLoading(true);
      await tipoSensorService.deleteTipoSensor(deletingTipoSensor.uuid);
      setDeletingTipoSensor(null);
      fetchTipoSensores(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar tipo de sensor:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTipoSensor, currentPage, fetchTipoSensores]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalTipoSensor = rowData._original || rowData;
    
    return (
      <TipoSensorActions 
        tipoSensor={originalTipoSensor} 
        onEdit={() => handleEditTipoSensor(originalTipoSensor)}
        onDelete={() => handleDeleteTipoSensor(originalTipoSensor)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditTipoSensor, handleDeleteTipoSensor, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchTipoSensores(1, 10);
  }, [fetchTipoSensores]);

  // Efecto para storeRefreshTrigger
  useEffect(() => {
    if (storeRefreshTrigger > 0) {
      fetchTipoSensores(currentPage, 10);
    }
  }, [storeRefreshTrigger, currentPage, fetchTipoSensores]);

  // Efecto para refreshTrigger prop
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTipoSensores(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchTipoSensores]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchTipoSensores(newPage, 10);
  }, [fetchTipoSensores]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando tipos de sensor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchTipoSensores(1, 10)}
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
            placeholder="Filtrar por nombre, unidad o creador..."
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
        {editingTipoSensor && (
          <Dialog open={!!editingTipoSensor} onOpenChange={() => setEditingTipoSensor(null)}>
            <DialogContent   overflowVisible={true} size="lg">
              <DialogHeader>
                <DialogTitle>Editar Tipo de Sensor</DialogTitle>
              </DialogHeader>
              <TipoSensorEditar
                tipoSensor={editingTipoSensor}
                onTipoSensorEditado={handleCloseEdit}
                open={!!editingTipoSensor}
                onOpenChange={(open) => !open && setEditingTipoSensor(null)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingTipoSensor && (
          <Dialog open={!!deletingTipoSensor} onOpenChange={() => setDeletingTipoSensor(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Tipo de Sensor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el tipo de sensor <strong>{deletingTipoSensor.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingTipoSensor(null)}
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