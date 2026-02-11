"use client";

import { ChevronDown, MoreHorizontal, MapPin, Building, User, Map } from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEmpresaStore } from "@/store/empresas/dataStoreEmpresa";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Lock } from "lucide-react";
import { Mapa, MapaService, MapasResponse, Pager } from "@/lib/mapa/UseMapa";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useAuthStore } from "@/store/auth.store";
import { useState, useEffect, useMemo, useCallback, memo, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy loading de componentes pesados
const MapaEditar = dynamic(() => import("./components/MapaEditar").then(mod => mod.MapaEditar), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Cargando editor...</div>
});

// Interface para las props
interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Función para crear columns con acceso a fetchMapas
const createColumns = (fetchMapas: (page?: number, size?: number) => void, currentPage: number): ColumnDef<Mapa>[] => [
  {
    accessorKey: "nombre",
    header: "Mapa",
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "creador",
    header: "Creador",
  },
  {
    id: "actions",
    enableHiding: false,
  }
];

// Componente de tarjeta de mapa memoizado
const MapaCard = memo(({
  mapa,
  currentPage,
  onMapaEditado,
  onMapaEliminado
}: {
  mapa: Mapa;
  currentPage: number;
  onMapaEditado: (currentPage: number) => void;
  onMapaEliminado: (currentPage: number) => Promise<void>;
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setMapaSeleccionada } = useEmpresaStore();
  const router = useRouter();

  const { hasSpecificRoute } = useModulePermissions("mapa");

  const canEdit = hasSpecificRoute("PATCH", "mapa/editar");
  const canDelete = hasSpecificRoute("DELETE", "mapa/eliminar");

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleVerMapa = useCallback(() => {
    setMapaSeleccionada(mapa)
    router.push(`/mapa/dashboard`);
  }, [router]);

  const handleMapaEditado = useCallback(() => {
    setShowEditDialog(false);
    onMapaEditado(currentPage);
  }, [currentPage, onMapaEditado]);

  const handleMapaEliminado = useCallback(async () => {
    try {
      setLoading(true);
      await onMapaEliminado(currentPage);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error manejado en la función padre
    } finally {
      setLoading(false);
    }
  }, [currentPage, onMapaEliminado]);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0">
          {/* Imagen del mapa */}
          <div onClick={handleVerMapa} className="cursor-pointer w-full h-[140px] bg-muted overflow-hidden rounded-t-md relative">
            {mapa.imagen ? (
              <Image
                src={mapa.imagen}
                alt={`Mapa de ${mapa.nombre}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blue-400" />
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Avatar y información principal */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground truncate">
                      {mapa?.nombre ?? "Mapa sin nombre"}
                    </h3>
                  </div>

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

                      {canEdit && (
                        <DropdownMenuItem onClick={handleEdit}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}

                      {canDelete && (
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Información del mapa */}
            <div className="space-y-2 text-sm">
              {mapa.empresa && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Building className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 flex-1">{mapa.empresa}</span>
                </div>
              )}

              {mapa.creador && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Creado por: {mapa.creador}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogos con lazy loading */}
      <Suspense fallback={<div>Cargando diálogo...</div>}>
        {showEditDialog && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Mapa</DialogTitle>
              </DialogHeader>
              <MapaEditar
                uuid={mapa.uuid}
                onMapaEditado={handleMapaEditado}
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
                <DialogTitle>Eliminar Mapa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el mapa <strong>{mapa.nombre}</strong>?
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleMapaEliminado}
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

MapaCard.displayName = 'MapaCard';

export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const [data, setData] = useState<Mapa[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Obtener empresa del store
  const empresa = useEmpresaStore((state) => state.empresa);

  // Memoizar fetchMapas para evitar recreación
  const fetchMapas = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);

      const { user } = useAuthStore.getState();

      const params: any = {
        page,
        size
      };

      if (empresa?.uuid) {
        params.id_empresa = user?.empresa || empresa.uuid;
      } else {
        // Si no hay empresa, usar solo la del usuario
        params.id_empresa = user?.empresa;
      }
      const response: MapasResponse = await MapaService.getMapas(params);
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);

    } catch (err: any) {
      setError(err.message || "Error al cargar mapas");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapas(1, 10);
  }, [fetchMapas]);

  // Efecto para refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchMapas(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchMapas]);

  const columns = useMemo(() =>
    createColumns(fetchMapas, currentPage),
    [currentPage, fetchMapas]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Manejar cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    fetchMapas(newPage, 10);
  }, [fetchMapas]);

  // Función para manejar edición de mapa
  const handleMapaEditado = useCallback((page: number) => {
    fetchMapas(page, 10);
  }, [fetchMapas]);

  // Función para manejar eliminación de mapa
  const handleMapaEliminado = useCallback(async (page: number) => {
    try {
      await fetchMapas(page, 10);
    } catch (error) {
      throw error;
    }
  }, [fetchMapas]);

  // Generar números de página para la paginación
  const generatePageNumbers = useCallback(() => {
    if (!pager) return [];

    const pages = [];
    const totalPages = pager.totalPages;
    const current = pager.currentPage;

    // Mostrar máximo 9 páginas (1 + ellipsis + 5 + ellipsis + 1)
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 5) {
        // Al inicio: mostrar 7 páginas + ellipsis + última
        for (let i = 1; i <= 7; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (current >= totalPages - 4) {
        // Al final: mostrar primera + ellipsis + 7 páginas
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 6; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio: mostrar primera + ellipsis + 5 páginas + ellipsis + última
        pages.push(1);
        pages.push('ellipsis');
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [pager]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Cargando mapas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error: {error}</div>
          <Button
            onClick={() => fetchMapas(1, 10)}
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center flex-wrap gap-2 px-4 mb-6">
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("nombre")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("nombre")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
      </div>

      {/* ✅ VALIDACIÓN CUANDO NO HAY MAPAS */}
      {data.length === 0 && !loading && !error ? (
        <div className="flex flex-col items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="h-16 w-16 text-muted-foreground mx-auto mb-4 flex items-center justify-center">
              <Map className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay mapas disponibles
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {empresa
                ? "No se encontraron mapas para esta empresa."
                : "No se encontraron mapas en el sistema."
              }
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de Cards Responsivo */}
          <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 px-4">
            {data.map((mapa) => (
              <MapaCard
                key={mapa.uuid}
                mapa={mapa}
                currentPage={currentPage}
                onMapaEditado={handleMapaEditado}
                onMapaEliminado={handleMapaEliminado}
              />
            ))}
          </div>

          {/* Paginación Mejorada */}
          <div className="flex items-center flex-wrap gap-4 px-4 py-6">
            <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
              Mostrando {data.length} de {pager?.totalItems || 0} mapas
            </div>

            {/* Paginación con componente shadcn/ui */}
            {pager && (
              <Pagination>
                <PaginationContent>
                  {/* Botón Anterior */}
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pager.currentPage - 1)}
                      className={pager.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Números de página */}
                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(page as number)}
                          isActive={pager.currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  {/* Botón Siguiente */}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pager.currentPage + 1)}
                      className={pager.currentPage === pager.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {/* Información de paginación */}
            {pager && (
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Página {pager.currentPage} de {pager.totalPages}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default BasicDataTable;