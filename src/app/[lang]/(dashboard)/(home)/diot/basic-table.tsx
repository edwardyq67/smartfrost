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
import { useCallback, useEffect, useMemo, useState, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { 
  DispositivoLista,
  dispositivosService, 
  DispositivosResponse,
  Pager 
} from "@/lib/dispositivos/UseDispositivos";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Importar dinámicamente el componente de edición - CORREGIDO
const DiotEditar = dynamic(() => import("./componets/diotEditar").then(mod => mod.DiotEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Componente para acciones - DEFINIDO FUERA del componente principal
const DiotActions = memo(({ 
  dispositivo, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  dispositivo: DispositivoLista; 
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

DiotActions.displayName = 'DiotActions';

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("diot"); // CAMBIADO: "diot" en lugar de "dispositivos"
  const hasEditPermission = hasSpecificRoute("PATCH", "diot/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "diot/eliminar");
  
  const [data, setData] = useState<DispositivoLista[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingDiot, setEditingDiot] = useState<DispositivoLista | null>(null);
  const [deletingDiot, setDeletingDiot] = useState<DispositivoLista | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas - SOLO LAS 4 COLUMNAS SOLICITADAS
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "imei",
      header: "IMEI",
      type: "text"
    },
    {
      key: "empresa_nombre",
      header: "Empresa",
      type: "text"
    },
    {
      key: "sistema_nombre",
      header: "Sistema",
      type: "text"
    },
    {
      key: "mapa_nombre",
      header: "Mapa",
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
      key: "empresa_nombre",
      header: "Empresa",
      hideable: true,
    },
    {
      key: "sistema_nombre",
      header: "Sistema",
      hideable: true,
    },
    {
      key: "mapa_nombre",
      header: "Mapa",
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
      filteredData = data.filter(diot => 
        diot.imei?.toLowerCase().includes(filterValue.toLowerCase()) ||
        diot.empresa_nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        diot.sistema_nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        diot.mapa_nombre?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    return transformDataForTable(filteredData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue]);

  // Fetch de datos
  const fetchDiots = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: DispositivosResponse = await dispositivosService.getDispositivos({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar declaraciones DIOT");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditDiot = useCallback((diot: DispositivoLista) => {
    setEditingDiot(diot);
  }, []);

  const handleDeleteDiot = useCallback((diot: DispositivoLista) => {
    setDeletingDiot(diot);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingDiot(null);
    fetchDiots(currentPage, 10);
  }, [currentPage, fetchDiots]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingDiot) return;
    
    try {
      setDeleteLoading(true);
      await dispositivosService.deleteDispositivo(deletingDiot.uuid);
      setDeletingDiot(null);
      fetchDiots(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar DIOT:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingDiot, currentPage, fetchDiots]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalDiot = rowData._original || rowData;
    
    return (
      <DiotActions 
        dispositivo={originalDiot} 
        onEdit={() => handleEditDiot(originalDiot)}
        onDelete={() => handleDeleteDiot(originalDiot)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditDiot, handleDeleteDiot, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchDiots(1, 10);
  }, [fetchDiots]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDiots(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchDiots]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchDiots(newPage, 10);
  }, [fetchDiots]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Cargando declaraciones DIOT...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchDiots(1, 10)}
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
            placeholder="Filtrar por IMEI, empresa, sistema o mapa..."
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
        {editingDiot && (
          <Dialog open={!!editingDiot} onOpenChange={() => setEditingDiot(null)}>
            <DialogContent overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar DIOT</DialogTitle>
              </DialogHeader>
              <DiotEditar
                dispositivo={editingDiot}
                onDiotEditado={handleCloseEdit}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingDiot && (
          <Dialog open={!!deletingDiot} onOpenChange={() => setDeletingDiot(null)}>
            <DialogContent overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar DIOT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el DIOT con IMEI <strong>{deletingDiot.imei}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingDiot(null)}
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