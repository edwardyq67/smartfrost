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
  DaqService,
  DaqListado,
  DaqListadoResponse,
  Pager 
} from "@/lib/daq/UseDaq";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Importar dinámicamente el componente de edición
const DaqEditar = dynamic(() => import("./componets/daqEditar").then(mod => mod.DaqEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Componente para acciones
const DaqActions = memo(({ 
  daq, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  daq: DaqListado; 
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

DaqActions.displayName = 'DaqActions';

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("daq");
  const hasEditPermission = hasSpecificRoute("PATCH", "daq/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "daq/eliminar");
  
  const [data, setData] = useState<DaqListado[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingDaq, setEditingDaq] = useState<DaqListado | null>(null);
  const [deletingDaq, setDeletingDaq] = useState<DaqListado | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas - SOLO LAS COLUMNAS SOLICITADAS
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "identificador",
      header: "Identificador",
      type: "text"
    },
    {
      key: "fecha_fabricacion",
      header: "Fecha Fabricación",
      type: "text"
    },
    {
      key: "cant_sensores",
      header: "Cant. Sensores",
      type: "text"
    },
    {
      key: "responsable",
      header: "Responsable",
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
      key: "identificador",
      header: "Identificador",
      hideable: false,
    },
    {
      key: "fecha_fabricacion",
      header: "Fecha Fabricación",
      hideable: true,
    },
    {
      key: "cant_sensores",
      header: "Cant. Sensores",
      hideable: true,
    },
    {
      key: "responsable",
      header: "Responsable",
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
      filteredData = data.filter(daq => 
        daq.identificador?.toLowerCase().includes(filterValue.toLowerCase()) ||
        daq.fecha_fabricacion?.toLowerCase().includes(filterValue.toLowerCase()) ||
        daq.cant_sensores?.toLowerCase().includes(filterValue.toLowerCase()) ||
        daq.responsable?.toLowerCase().includes(filterValue.toLowerCase()) ||
        daq.tipo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        daq.dispositivo?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    return transformDataForTable(filteredData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue]);

  // Fetch de datos
  const fetchDaqs = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: DaqListadoResponse = await DaqService.getDaqs({ 
        page, 
        size 
      });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar dispositivos DAQ");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditDaq = useCallback((daq: DaqListado) => {
    setEditingDaq(daq);
  }, []);

  const handleDeleteDaq = useCallback((daq: DaqListado) => {
    setDeletingDaq(daq);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingDaq(null);
    fetchDaqs(currentPage, 10);
  }, [currentPage, fetchDaqs]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingDaq) return;
    
    try {
      setDeleteLoading(true);
      await DaqService.deleteDaq(deletingDaq.uuid);
      setDeletingDaq(null);
      fetchDaqs(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar DAQ:", error);
      setError("Error al eliminar el dispositivo DAQ");
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingDaq, currentPage, fetchDaqs]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalDaq = rowData._original || rowData;
    
    return (
      <DaqActions 
        daq={originalDaq} 
        onEdit={() => handleEditDaq(originalDaq)}
        onDelete={() => handleDeleteDaq(originalDaq)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditDaq, handleDeleteDaq, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchDaqs(1, 10);
  }, [fetchDaqs]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDaqs(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchDaqs]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchDaqs(newPage, 10);
  }, [fetchDaqs]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Cargando dispositivos DAQ...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchDaqs(1, 10)}
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
            placeholder="Filtrar por identificador, responsable, tipo, etc..."
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

      {/* Modales en el padre */}
      <Suspense fallback={null}>
        {editingDaq && (
          <Dialog open={!!editingDaq} onOpenChange={() => setEditingDaq(null)}>
            <DialogContent overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar DAQ</DialogTitle>
              </DialogHeader>
              <DaqEditar
                daq={editingDaq}
                onDaqEditado={handleCloseEdit}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingDaq && (
          <Dialog open={!!deletingDaq} onOpenChange={() => setDeletingDaq(null)}>
            <DialogContent overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar DAQ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el DAQ con identificador <strong>{deletingDaq.identificador}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingDaq(null)}
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