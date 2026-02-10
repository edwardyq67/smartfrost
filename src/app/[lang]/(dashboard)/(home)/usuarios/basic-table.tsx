// BasicDataTable.tsx completo y corregido
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
import {
  User,
  userService,
  UsersResponse,
  Pager
} from "@/lib/usuarios/UseUsuarios";
import {
  useRefreshTableUsuarios
} from "@/store/usuarios/refreshTableUsuarios";
import { Pencil, Trash2, Lock } from "lucide-react";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useAuthStore } from "@/store/auth.store";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import {
  transformDataForTable,
  ColumnConfig
} from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Modales - mantenidos en el padre
const UsuarioEditar = dynamic(() => import("./components/usuarioEditar").then(mod => mod.UsuarioEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Componente para acciones - versión simplificada para TabletGlobal
const UserActions = memo(({
  user,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission
}: {
  user: User;
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

UserActions.displayName = 'UserActions';

// Componente principal
export function BasicDataTable() {
  const { refreshTrigger } = useRefreshTableUsuarios();
  const { hasSpecificRoute } = useModulePermissions("usuarios");

  const hasEditPermission = hasSpecificRoute("PATCH", "usuarios/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "usuarios/eliminar");

  const [data, setData] = useState<User[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState(""); // Estado para el filtro

  // Estados para modales
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Configuración de columnas usando data-table-helpers
  const columnsConfig: ColumnConfig[] = useMemo(() => [
    {
      key: "columnaUno",
      header: "Usuario",
      type: "avatar",
      avatarConfig: {
        imageKey: "avatar",
        titleKey: "nombre",
        subtitleKey: "dni"
      }
    },
    {
      key: "usuario",
      header: "Usuario",
      type: "text"
    },
    {
      key: "rol_nombre",
      header: "Rol",
      type: "text"
    },
    {
      key: "acciones",
      header: "Acciones",
      type: "actions"
    }
  ], []);

  // COLUMNAS PARA TABLETGLOBAL - ¡ESTO ES LO QUE FALTA!
  const tabletColumns = useMemo(() => [
    {
      key: "columnaUno",
      header: "Usuario",
      hideable: false,
    },
    {
      key: "usuario",
      header: "Usuario",
      hideable: true,
    },
    {
      key: "rol_nombre",
      header: "Rol",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Función para preparar los datos antes de transformarlos
  const prepareDataForTable = useCallback((users: User[]) => {
    return users.map(user => ({
      ...user,
      // Aplanar el objeto rol para acceder a rol.nombre
      rol_nombre: user.rol?.nombre || "Sin rol",
      // Mantener el usuario como está
      usuario: user.usuario || "Sin usuario"
    }));
  }, []);

  // Transformar datos usando el helper
  const dataArray = useMemo(() => {
    // Aplicar filtro antes de transformar
    let filteredData = data;
    if (filterValue) {
      filteredData = data.filter(user =>
        user.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.dni?.includes(filterValue) ||
        user.usuario?.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.rol?.nombre?.toLowerCase().includes(filterValue.toLowerCase())
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
  const fetchUsers = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const { user } = useAuthStore.getState();
      const params: any = { page, size };

      if (user?.empresa) {
        params.id_empresa = user.empresa;
      }

      const response: UsersResponse = await userService.getUsers(params);
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers para acciones
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    setDeletingUser(user);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingUser(null);
    fetchUsers(currentPage, 10);
  }, [currentPage, fetchUsers]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser) return;

    try {
      setDeleteLoading(true);
      await userService.deleteUser(deletingUser.uuid);
      setDeletingUser(null);
      fetchUsers(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingUser, currentPage, fetchUsers]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    // rowData viene del transformDataForTable con includeOriginal: true
    const originalUser = rowData._original || rowData;

    return (
      <UserActions
        user={originalUser}
        onEdit={() => handleEditUser(originalUser)}
        onDelete={() => handleDeleteUser(originalUser)}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
      />
    );
  }, [handleEditUser, handleDeleteUser, hasEditPermission, hasDeletePermission]);

  useEffect(() => {
    fetchUsers(1, 10);
  }, [fetchUsers]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchUsers(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchUsers]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchUsers(newPage, 10);
  }, [fetchUsers]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchUsers(1, 10)}
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
            placeholder="Filtrar por nombre, DNI, usuario o rol..."
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
          columns={tabletColumns} // ¡ESTO ES LO QUE FALTABA!
          renderActions={renderActions}
          showColumnSelector={false}
        />
      </Suspense>

      {/* Modales en el padre */}
      <Suspense fallback={null}>
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent   overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
              </DialogHeader>
              <UsuarioEditar
                usuario={editingUser.uuid}
                onUsuarioEditado={handleCloseEdit}
              />
            </DialogContent>
          </Dialog>
        )}

        {deletingUser && (
          <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{deletingUser.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingUser(null)}
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
                      <Trash2 className="h-4 w-4 mr-2" />
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

export default memo(BasicDataTable);