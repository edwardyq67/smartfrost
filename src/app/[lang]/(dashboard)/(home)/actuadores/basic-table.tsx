"use client";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Pencil, Trash2, Lock, MoreVertical } from "lucide-react";
import { Actuador, actuadoresService, ActuadoresResponse, Pager } from "@/lib/actuadores/UseActuadores";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";

// Modales - mantenidos en el padre
const ActuadoresEditar = dynamic(() => import("./components/ActuadoresEditar").then(mod => mod.ActuadoresEditar), { 
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones - versión simplificada para TabletGlobal
const ActuadorActions = memo(({ 
  actuador, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  actuador: Actuador; 
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
               <Lock className="h-4 w-4 mr-2" />
              Sin permisos disponibles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

ActuadorActions.displayName = 'ActuadorActions';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("actuadores");
  
  const hasEditPermission = hasSpecificRoute("PATCH", "actuadores/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "actuadores/eliminar");
  
  const [data, setData] = useState<Actuador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingActuador, setEditingActuador] = useState<Actuador | null>(null);
  const [deletingActuador, setDeletingActuador] = useState<Actuador | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers - CON AVATAR PARA LA PRIMERA COLUMNA
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "columnaUno",
      header: "Dispositivo",
      type: "avatar",
      avatarConfig: {
        titleKey: "dispositivo_nombre",
        subtitleKey: "imei_text"
      }
    },
    {
      key: "tipo_actuador_nombre",
      header: "Tipo de Actuador",
      type: "text"
    },
    {
      key: "funcion_info",
      header: "Función",
      type: "text"
    },
    {
      key: "setpoint_info",
      header: "Setpoint",
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
      key: "columnaUno",
      header: "Dispositivo",
      hideable: false,
    },
    {
      key: "tipo_actuador_nombre",
      header: "Tipo de Actuador",
      hideable: true,
    },
    {
      key: "funcion_info",
      header: "Función",
      hideable: true,
    },
    {
      key: "setpoint_info",
      header: "Setpoint",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((actuadores: Actuador[]) => {
    return actuadores.map(actuador => {
      // Texto para IMEI que se usará como subtítulo en el avatar
      const imeiText = `IMEI: ${actuador.imei || "N/A"}`;
      
      // Formatear función
      const funcionInfo = actuador.funcion 
        ? `Función ${actuador.funcion}`
        : "Sin función";
      
      // Formatear setpoint
      const setpointInfo = actuador.value !== undefined && actuador.value !== null
        ? String(actuador.value)
        : "N/A";
      
      // Tipo de actuador
      const tipoActuadorNombre = actuador.tipo_actuador_nombre || "Sin tipo";
      
      // Asegurar que el nombre del dispositivo esté presente
      const dispositivoNombre = actuador.dispositivo_nombre || "Sin nombre";
      
      return {
        ...actuador,
        // Campos necesarios para el avatar en columnaUno
        dispositivo_nombre: dispositivoNombre,
        imei_text: imeiText,
        // Tipo de actuador
        tipo_actuador_nombre: tipoActuadorNombre,
        // Función formateada
        funcion_info: funcionInfo,
        // Setpoint formateado
        setpoint_info: setpointInfo
      };
    });
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(actuador => 
        actuador.dispositivo_nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        actuador.imei?.toLowerCase().includes(filterValue.toLowerCase()) ||
        actuador.tipo_actuador_nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        (actuador.funcion && actuador.funcion.toString().toLowerCase().includes(filterValue.toLowerCase())) ||
        (actuador.value !== undefined && actuador.value !== null && 
         actuador.value.toString().toLowerCase().includes(filterValue.toLowerCase()))
      );
    }
    
    // Preparar datos (combinar y formatear campos)
    const preparedData = prepareDataForTable(filteredData);
    
    return transformDataForTable(preparedData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue, prepareDataForTable]);

  // Fetch de datos
  const fetchActuadores = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: ActuadoresResponse = await actuadoresService.getActuadores({ page, size });
      setData(response.data.data);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar actuadores");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditActuador = useCallback((actuador: Actuador) => {
    setEditingActuador(actuador);
  }, []);

  const handleDeleteActuador = useCallback((actuador: Actuador) => {
    setDeletingActuador(actuador);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingActuador(null);
    fetchActuadores(currentPage, 10);
  }, [currentPage, fetchActuadores]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingActuador) return;
    
    try {
      setDeleteLoading(true);
      await actuadoresService.deleteActuador(deletingActuador.uuid);
      setDeletingActuador(null);
      fetchActuadores(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar actuador:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingActuador, currentPage, fetchActuadores]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalActuador = rowData._original || rowData;
    
    return (
      <ActuadorActions 
        actuador={originalActuador} 
        onEdit={() => handleEditActuador(originalActuador)}
        onDelete={() => handleDeleteActuador(originalActuador)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditActuador, handleDeleteActuador, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchActuadores(1, 10);
  }, [fetchActuadores]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchActuadores(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchActuadores]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchActuadores(newPage, 10);
  }, [fetchActuadores]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando actuadores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchActuadores(1, 10)}
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
            placeholder="Filtrar por dispositivo, IMEI, tipo, función..."
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
          onPageChange={handlePageChange}
          columns={tabletColumns}
          renderActions={renderActions}
          showColumnSelector={false}
        />
      </Suspense>

      {/* Modales en el padre */}
      <Suspense fallback={null}>
        {editingActuador && (
          <Dialog open={!!editingActuador} onOpenChange={() => setEditingActuador(null)}>
            <DialogContent   overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar Actuador</DialogTitle>
              </DialogHeader>
              <ActuadoresEditar
                actuador={editingActuador.uuid}
                onActuadorEditado={handleCloseEdit}
                open={!!editingActuador}
                onOpenChange={(open) => !open && setEditingActuador(null)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingActuador && (
          <Dialog open={!!deletingActuador} onOpenChange={() => setDeletingActuador(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Actuador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el actuador del dispositivo{' '}
                  <strong>{deletingActuador.dispositivo_nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingActuador(null)}
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