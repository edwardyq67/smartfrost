"use client";
import { Card, CardContent } from "@/components/ui/card";
import { usePermisosStore } from "@/store/permisos/permisosStore";
import { useEffect, useState, Suspense, useCallback } from "react";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { rolesService } from "@/lib/roles/UseRoles";
import dynamic from 'next/dynamic';
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { Loader2 } from "lucide-react";

const TopTen = dynamic(() => import("./components/TopTen"), { ssr: false });
const TopPage = dynamic(() => import("./components/TopPage"), { ssr: false });

const DataTablePage = () => {
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADOS PARA ROLES (igual que en el ejemplo de usuarios)
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMoreRoles, setLoadingMoreRoles] = useState(false);
  const [rolesPag, setRolesPag] = useState(1);
  const [rolesSearch, setRolesSearch] = useState("");
  const [hasMoreRoles, setHasMoreRoles] = useState(true);
  const [rolValue, setRolValue] = useState<string>("");

  const { setRoles: setRolesStore,setRolSeleccionado } = usePermisosStore();
  const { hasSpecificRoute } = useModulePermissions("permisos");
  const hasViewPermission = hasSpecificRoute("GET", "permisos");

  // ✅ 1. FUNCIÓN PARA CARGAR ROLES (igual que fetchUsuarios)
  const fetchRoles = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingRoles(true);
      } else {
        setLoadingMoreRoles(true);
      }

      const response = await rolesService.getRoles({
        page: page,
        size: 20,
        nombre: searchTerm,
        sortBy: "nombre",
        sortOrder: "asc"
      });

      const nuevosRoles = response.data.data.map((rol: any) => ({
        uuid: rol.uuid,
        nombre: rol.nombre
      }));

      if (resetData) {
        setRoles(nuevosRoles);
        setRolesStore(nuevosRoles);
        setRolesPag(1);
      } else {
        setRoles(prev => [...prev, ...nuevosRoles]);

        setRolesPag(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreRoles(currentPage < totalPages);

    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setLoadingRoles(false);
      setLoadingMoreRoles(false);
      setLoading(false);
    }
  }, [setRolesStore]);

  // ✅ 2. CARGAR ROLES INICIALES
  useEffect(() => {
    if (hasViewPermission) {
      fetchRoles(1, "", true);
    } else {
      setLoading(false);
    }
  }, [hasViewPermission, fetchRoles]);

  // ✅ 3. HANDLER PARA BÚSQUEDA
  const handleSearchRoles = useCallback((searchTerm: string) => {
    setRolesSearch(searchTerm);
    fetchRoles(1, searchTerm, true);
  }, [fetchRoles]);

  // ✅ 4. HANDLER PARA CARGAR MÁS
  const handleLoadMoreRoles = useCallback(() => {
    if (!loadingMoreRoles && hasMoreRoles) {
      fetchRoles(rolesPag + 1, rolesSearch, false);
    }
  }, [fetchRoles, loadingMoreRoles, hasMoreRoles, rolesPag, rolesSearch]);

  // ✅ 5. HANDLER PARA CAMBIO DE ROL
  const handleRolChange = (value: string) => {
    setRolValue(value);
    setRolSeleccionado(value)
  };

  // ✅ 6. HANDLER PARA LIMPIAR SELECCIÓN
  const handleClearRol = () => {
    setRolValue("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* ✅ SELECTOR DE ROLES CON OptionInfinito */}
      <div className="max-w-md">
        <Suspense fallback={
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando roles...
          </div>
        }>
          {loadingRoles && rolesPag === 1 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando roles...
            </div>
          ) : (
            <>
              <OptionInfinito
                data={roles}
                value={rolValue}
                onChange={handleRolChange}
                onSearch={handleSearchRoles}
                onLoadMore={handleLoadMoreRoles}
                hasMore={hasMoreRoles}
                isLoading={loadingMoreRoles}
                loading={loadingRoles}
                placeholder="Buscar o seleccionar rol..."
                dropdownId="roles-selector"
              />
              
              {/* ✅ Contador y botón limpiar (como en el ejemplo) */}
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {roles.length} roles cargados
                </p>
                {rolValue && (
                  <button
                    onClick={handleClearRol}
                    className="text-xs text-primary hover:underline"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>
            </>
          )}
        </Suspense>
      </div>

      {/* ✅ TUS COMPONENTES EXISTENTES */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Suspense fallback={<div>Cargando...</div>}>
            <TopTen />
          </Suspense>
        </div>
        <div className="md:col-span-8">
          <Suspense fallback={<div>Cargando...</div>}>
            <Card className="max-h-full overflow-y-scroll">
              <CardContent className="p-0">
                <TopPage />
              </CardContent>
            </Card>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DataTablePage;