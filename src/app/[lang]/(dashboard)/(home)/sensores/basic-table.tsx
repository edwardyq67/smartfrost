"use client";

import { useState, useCallback, useEffect, useMemo, memo, Suspense } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  sensoresService,
  SensorLista,
  SensoresResponse,
  Pager 
} from "@/lib/sensores/UseSensores";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ✅ Importar dinámicamente el componente de edición (debes crearlo)
const SensorEditar = dynamic(() => import("./componets/sensorEditar").then(mod => mod.SensorEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Componente para acciones
const SensorActions = memo(({ 
  sensor, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  sensor: SensorLista; 
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

SensorActions.displayName = 'SensorActions';

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("sensores");
  
  // ✅ Usando las rutas correctas de permisos
  const hasEditPermission = hasSpecificRoute("PATCH", "sensores/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "sensores/eliminar");
  
  const [data, setData] = useState<SensorLista[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingSensor, setEditingSensor] = useState<SensorLista | null>(null);
  const [deletingSensor, setDeletingSensor] = useState<SensorLista | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas - SOLO LAS 4 COLUMNAS SOLICITADAS
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "imei",
      header: "IMEI",
      type: "text"
    },
    {
      key: "identificador_daq",
      header: "Identificador DAQ",
      type: "text"
    },
    {
      key: "tipo_sensor",
      header: "Tipo de Sensor",
      type: "text"
    },
    {
      key: "offset",
      header: "Offset",
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
      key: "imei",
      header: "IMEI",
      hideable: false,
    },
    {
      key: "identificador_daq",
      header: "Identificador DAQ",
      hideable: true,
    },
    {
      key: "tipo_sensor",
      header: "Tipo de Sensor",
      hideable: true,
    },
    {
      key: "offset",
      header: "Offset",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(sensor => 
        sensor.imei?.toLowerCase().includes(filterValue.toLowerCase()) ||
        sensor.identificador_daq?.toLowerCase().includes(filterValue.toLowerCase()) ||
        sensor.tipo_sensor?.toLowerCase().includes(filterValue.toLowerCase()) ||
        sensor.offset?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    return transformDataForTable(filteredData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue]);

  // Fetch de datos
  const fetchSensores = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: SensoresResponse = await sensoresService.getSensores({ 
        page, 
        size 
      });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar sensores");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditSensor = useCallback((sensor: SensorLista) => {
    setEditingSensor(sensor);
  }, []);

  const handleDeleteSensor = useCallback((sensor: SensorLista) => {
    setDeletingSensor(sensor);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingSensor(null);
    fetchSensores(currentPage, 10);
  }, [currentPage, fetchSensores]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingSensor) return;
    
    try {
      setDeleteLoading(true);
      await sensoresService.deleteSensor(deletingSensor.uuid);
      setDeletingSensor(null);
      fetchSensores(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar sensor:", error);
      setError("Error al eliminar el sensor");
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingSensor, currentPage, fetchSensores]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalSensor = rowData._original || rowData;
    
    return (
      <SensorActions 
        sensor={originalSensor} 
        onEdit={() => handleEditSensor(originalSensor)}
        onDelete={() => handleDeleteSensor(originalSensor)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditSensor, handleDeleteSensor, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchSensores(1, 10);
  }, [fetchSensores]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchSensores(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchSensores]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchSensores(newPage, 10);
  }, [fetchSensores]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Cargando sensores...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchSensores(1, 10)}
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
      {/* Input de filtro */}
      <div className="mb-4 px-4">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Filtrar por IMEI, identificador, tipo, offset..."
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
          showColumnSelector={true}
        />
      </Suspense>

      {/* ✅ Modal de edición */}
      <Suspense fallback={null}>
        {editingSensor && (
          <Dialog open={!!editingSensor} onOpenChange={() => setEditingSensor(null)}>
            <DialogContent overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar Sensor</DialogTitle>
              </DialogHeader>
              <SensorEditar
                sensorUuid={editingSensor.uuid}
                onSensorEditado={handleCloseEdit}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {/* ✅ Modal de confirmación de eliminación */}
        {deletingSensor && (
          <Dialog open={!!deletingSensor} onOpenChange={() => setDeletingSensor(null)}>
            <DialogContent overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Sensor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el sensor con IMEI <strong>{deletingSensor.imei}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingSensor(null)}
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