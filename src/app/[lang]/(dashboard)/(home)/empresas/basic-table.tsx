"use client";

import { Building2, MapPin, Phone, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empresa, EmpresaService, EmpresasResponse, Pager } from "@/lib/empresas/UseEmpresas";
import { useEmpresaStore } from "@/store/empresas/dataStoreEmpresa";
import { useRouter } from "next/navigation";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useEffect, useMemo, useState, useCallback, memo, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Lazy loading de componentes pesados
const Image = dynamic(() => import("next/image").then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-full h-[140px] bg-muted animate-pulse" />
});

// Lazy loading del componente de edición
const EmpresasEditar = dynamic(() => import("./components/EmpresasEditar").then(mod => mod.EmpresasEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

// Interface para las props
interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente memoizado para la imagen de empresa
const EmpresaImagen = memo(({ empresa }: { empresa: Empresa }) => {
  const router = useRouter();
  const { setEmpresa } = useEmpresaStore();

  const handleDiot = useCallback(() => {
    setEmpresa({
      uuid: empresa.uuid,
      nombre: empresa.nombre
    });
    router.push(`/en/mapa`);
  }, [empresa.uuid, empresa.nombre, setEmpresa, router]);

  if (empresa.imagen) {
    return (
      <div
        onClick={handleDiot}
        className="cursor-pointer w-full h-[140px] bg-muted overflow-hidden rounded-t-md relative"
      >
        <Image
          src={empresa.imagen}
          alt={`Imagen de ${empresa.nombre}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleDiot}
      className="cursor-pointer w-full h-[140px] bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center rounded-t-md"
    >
      <Building2 className="h-12 w-12 text-gray-400" />
    </div>
  );
});

EmpresaImagen.displayName = 'EmpresaImagen';

// Componente memoizado para el avatar de empresa
const EmpresaAvatar = memo(({ empresa }: { empresa: Empresa }) => (
  <Avatar className="bg-white rounded-full w-12 h-12 -mt-8 relative z-10 border-2 border-background shadow-md">
    {empresa?.logo ? (
      <AvatarImage src={empresa.logo} alt={empresa.nombre} />
    ) : (
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
        {empresa?.nombre?.charAt(0)?.toUpperCase() || "E"}
      </AvatarFallback>
    )}
  </Avatar>
));

EmpresaAvatar.displayName = 'EmpresaAvatar';

// Componente memoizado para la información de contacto
const EmpresaContacto = memo(({ empresa }: { empresa: Empresa }) => (
  <div className="space-y-2 text-sm">
    {empresa.direccion && (
      <div className="flex items-start gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span className="line-clamp-2 flex-1">{empresa.direccion}</span>
      </div>
    )}

    {empresa.telefono && (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Phone className="h-4 w-4 flex-shrink-0" />
        <span>{empresa.telefono}</span>
      </div>
    )}

    {empresa.coordenadas && (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs">
          {empresa.coordenadas.split(',').map(coord => {
            const num = parseFloat(coord.trim());
            return isNaN(num) ? coord : (Math.round(num * 10000) / 10000).toString();
          }).join(', ')}
        </span>
      </div>
    )}
  </div>
));

EmpresaContacto.displayName = 'EmpresaContacto';

// Componente memoizado para acciones de empresa
const EmpresaActions = memo(({
  empresa,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission
}: {
  empresa: Empresa;
  onEdit: () => void;
  onDelete: () => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
}) => (
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
          Sin permisos disponibles
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
));

EmpresaActions.displayName = 'EmpresaActions';

// Componente memoizado para la tarjeta de empresa
const EmpresaCard = memo(({
  empresa,
  currentPage,
  fetchEmpresas,
  hasEditPermission,
  hasDeletePermission
}: {
  empresa: Empresa;
  currentPage: number;
  fetchEmpresas: (page: number, size: number) => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleEmpresaEditada = useCallback(() => {
    setShowEditDialog(false);
    fetchEmpresas(currentPage, 10);
  }, [currentPage, fetchEmpresas]);

  const handleEmpresaEliminada = useCallback(async () => {
    try {
      setLoading(true);
      await EmpresaService.deleteEmpresa(empresa.uuid);
      setShowDeleteDialog(false);
      fetchEmpresas(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar empresa:", error);
    } finally {
      setLoading(false);
    }
  }, [empresa.uuid, currentPage, fetchEmpresas]);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0">
          <EmpresaImagen empresa={empresa} />

          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <EmpresaAvatar empresa={empresa} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground truncate">
                      {empresa?.nombre ?? "Empresa sin nombre"}
                    </h3>
                  </div>

                  <EmpresaActions
                    empresa={empresa}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    hasEditPermission={hasEditPermission}
                    hasDeletePermission={hasDeletePermission}
                  />
                </div>
              </div>
            </div>

            <EmpresaContacto empresa={empresa} />
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<div>Cargando diálogo...</div>}>
        {showEditDialog && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar Empresa</DialogTitle>
              </DialogHeader>
              <EmpresasEditar
                empresa={empresa}
                onEmpresaEditada={handleEmpresaEditada}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
              />
            </DialogContent>
          </Dialog>
        )}

        {showDeleteDialog && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar la empresa <strong>{empresa.nombre}</strong>?
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEmpresaEliminada}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading ? (
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
});

EmpresaCard.displayName = 'EmpresaCard';

// Hook personalizado para permisos
const useEmpresaPermissions = () => {
  const { hasSpecificRoute } = useModulePermissions("empresas");

  const hasEditPermission = hasSpecificRoute("PATCH", "empresas/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "empresas/eliminar");

  return { hasEditPermission, hasDeletePermission };
};

// Función para generar números de página
const generatePageNumbers = (pager: Pager | null) => {
  if (!pager) return [];

  const pages = [];
  const totalPages = pager.totalPages;
  const current = pager.currentPage;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (current >= totalPages - 3) {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
  }

  return pages;
};

// Componente de grid memoizado
const EmpresaGrid = memo(({
  data,
  currentPage,
  fetchEmpresas,
  hasEditPermission,
  hasDeletePermission,
  onPageChange,
  pager,
  searchValue,
  onSearchChange
}: {
  data: Empresa[];
  currentPage: number;
  fetchEmpresas: (page: number, size: number) => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
  onPageChange: (page: number) => void;
  pager: Pager | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) => {
  // Filtrar datos localmente basado en searchValue
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;

    const searchLower = searchValue.toLowerCase();
    return data.filter(empresa =>
      empresa.nombre?.toLowerCase().includes(searchLower) ||
      empresa.direccion?.toLowerCase().includes(searchLower) ||
      empresa.telefono?.includes(searchValue)
    );
  }, [data, searchValue]);

  return (
    <>
      <div className="flex items-center flex-wrap gap-2 px-4 mb-6">
        <Input
          placeholder="Filtrar por nombre, dirección o teléfono..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm min-w-[200px] h-10"
        />
      </div>

      <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 px-4">
        {filteredData.map((empresa) => (
          <EmpresaCard
            key={empresa.uuid}
            empresa={empresa}
            currentPage={currentPage}
            fetchEmpresas={fetchEmpresas}
            hasEditPermission={hasEditPermission}
            hasDeletePermission={hasDeletePermission}
          />
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-4 px-4 py-6">
        <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
          Mostrando {filteredData.length} de {pager?.totalItems || 0} empresas
        </div>

        {pager && pager.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(pager.currentPage - 1)}
                  className={cn(
                    "cursor-pointer",
                    pager.currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {generatePageNumbers(pager).map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(page as number)}
                      isActive={pager.currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(pager.currentPage + 1)}
                  className={cn(
                    "cursor-pointer",
                    pager.currentPage === pager.totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
});

EmpresaGrid.displayName = 'EmpresaGrid';

// Componente de carga
const LoadingState = memo(() => (
  <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      Cargando empresas...
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Componente de error
const ErrorState = memo(({
  error,
  onRetry
}: {
  error: string;
  onRetry: () => void
}) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="text-red-500 mb-2">Error: {error}</div>
      <Button
        onClick={onRetry}
        variant="outline"
      >
        Reintentar
      </Button>
    </div>
  </div>
));

ErrorState.displayName = 'ErrorState';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const { hasEditPermission, hasDeletePermission } = useEmpresaPermissions();
  const { setEmpresas } = useEmpresaStore();

  const [data, setData] = useState<Empresa[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");

  // Memoizar fetchEmpresas para evitar recreación
  const fetchEmpresas = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response: EmpresasResponse = await EmpresaService.getEmpresas({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);

      setEmpresas(response.data.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar empresas");
      setData([]);
      setPager(null);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }, [setEmpresas]);

  useEffect(() => {
    fetchEmpresas(1, 10);
  }, [fetchEmpresas]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchEmpresas(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchEmpresas]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= (pager?.totalPages || 1)) {
      fetchEmpresas(newPage, 10);
    }
  }, [pager, fetchEmpresas]);

  const handleRetry = useCallback(() => {
    fetchEmpresas(1, 10);
  }, [fetchEmpresas]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <EmpresaGrid
        data={data}
        currentPage={currentPage}
        fetchEmpresas={fetchEmpresas}
        hasEditPermission={hasEditPermission}
        hasDeletePermission={hasDeletePermission}
        onPageChange={handlePageChange}
        pager={pager}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />
    </Suspense>
  );
}

export default memo(BasicDataTable);