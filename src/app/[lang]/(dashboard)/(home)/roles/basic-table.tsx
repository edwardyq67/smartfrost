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
  Rol, 
  rolesService, 
  RolesResponse, 
  Pager 
} from "@/lib/roles/UseRoles";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { 
  transformDataForTable, 
  ColumnConfig 
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Importar dinámicamente el componente de edición ANTES de definir RolActions
const RolesEditar = dynamic(() => import("./components/RolesEditar").then(mod => mod.RolesEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Componente para acciones - DEFINIDO FUERA del componente principal
const RolActions = memo(({ 
  rol, 
  onEdit, 
  onDelete, 
  hasEditPermission, 
  hasDeletePermission 
}: { 
  rol: Rol; 
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

RolActions.displayName = 'RolActions';

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasSpecificRoute } = useModulePermissions("roles");
  const hasEditPermission = hasSpecificRoute("PATCH", "roles/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "roles/eliminar");
  
  const [data, setData] = useState<Rol[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  // Estados para modales
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const [deletingRol, setDeletingRol] = useState<Rol | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas - SIGUIENDO EL MISMO PATRÓN QUE USUARIOS
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "nombre",
      header: "Nombre",
      type: "text"
    },
    {
      key: "descripcion",
      header: "Descripción",
      type: "text"
    },
    {
      key: "estado",
      header: "Estado",
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
      key: "descripcion",
      header: "Descripción",
      hideable: true,
    },
    {
      key: "estado",
      header: "Estado",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((roles: Rol[]) => {
    return roles.map(rol => ({
      ...rol,
      // Convertir estado numérico a texto
      estado: rol.estado === "1" ? "Activo" : "Inactivo",
      // Asegurar que la descripción tenga un valor por defecto
      descripcion: rol.descripcion || "Sin descripción"
    }));
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(rol => 
        rol.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        rol.descripcion?.toLowerCase().includes(filterValue.toLowerCase()) ||
        (rol.estado === "1" && "activo".includes(filterValue.toLowerCase())) ||
        (rol.estado === "0" && "inactivo".includes(filterValue.toLowerCase()))
      );
    }
    
    // Preparar datos
    const preparedData = prepareDataForTable(filteredData);
    
    return transformDataForTable(preparedData, columnsConfig, { 
      idKey: "uuid",
      includeOriginal: true 
    });
  }, [data, columnsConfig, filterValue, prepareDataForTable]);

  // Fetch de datos
  const fetchRoles = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: RolesResponse = await rolesService.getRoles({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar roles");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditRol = useCallback((rol: Rol) => {
    setEditingRol(rol);
  }, []);

  const handleDeleteRol = useCallback((rol: Rol) => {
    setDeletingRol(rol);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingRol(null);
    fetchRoles(currentPage, 10);
  }, [currentPage, fetchRoles]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRol) return;
    
    try {
      setDeleteLoading(true);
      await rolesService.deleteRol(deletingRol.uuid);
      setDeletingRol(null);
      fetchRoles(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar rol:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRol, currentPage, fetchRoles]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalRol = rowData._original || rowData;
    
    return (
      <RolActions 
        rol={originalRol} 
        onEdit={() => handleEditRol(originalRol)}
        onDelete={() => handleDeleteRol(originalRol)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditRol, handleDeleteRol, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchRoles(1, 10);
  }, [fetchRoles]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchRoles(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchRoles]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchRoles(newPage, 10);
  }, [fetchRoles]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando roles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchRoles(1, 10)}
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
        {editingRol && (
          <Dialog open={!!editingRol} onOpenChange={() => setEditingRol(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar Rol</DialogTitle>
              </DialogHeader>
              <RolesEditar
                rol={editingRol}
                onRolEditado={handleCloseEdit}
                open={!!editingRol}
                onOpenChange={(open) => !open && setEditingRol(null)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {deletingRol && (
          <Dialog open={!!deletingRol} onOpenChange={() => setDeletingRol(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Rol</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el rol <strong>{deletingRol.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingRol(null)}
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