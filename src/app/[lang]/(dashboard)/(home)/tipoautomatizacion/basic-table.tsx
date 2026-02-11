"use client";

import { ChevronDown, MoreHorizontal, Bot, Calendar, Cpu, Zap } from "lucide-react";
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

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash2, Lock } from "lucide-react";
import { 
  TipoAutomatizacion, 
  tipoAutomatizacionService, 
  TipoAutomatizacionResponse, 
  Pager 
} from "@/lib/tipoAutomatizacion/UseTipoAutomatizacion";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useState, useEffect, useMemo, useCallback, memo, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy loading de componentes pesados
const TipoAutomatizacionEditar = dynamic(() => import("./components/TipoAutomatizacionEditar").then(mod => mod.TipoAutomatizacionEditar), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Interface para las relaciones
interface Relacion {
  uuid: string;
  id_entidad: string;
  tipo_entidad: string;
  cantidad: string;
}

// Componentes memoizados para celdas
const NombreCell = memo(({ tipoAutomatizacion }: { tipoAutomatizacion: TipoAutomatizacion }) => (
  <div className="font-medium text-card-foreground/80">
    <div className="flex space-x-3 rtl:space-x-reverse items-center">
      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
        <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-card-foreground whitespace-nowrap">
          {tipoAutomatizacion?.nombre ?? "Unknown"}
        </span>
      </div>
    </div>
  </div>
));

NombreCell.displayName = 'NombreCell';

const RelacionesCell = memo(({ relaciones }: { relaciones: Relacion[] }) => {
  if (!relaciones || relaciones.length === 0) {
    return <span className="text-muted-foreground">Sin relaciones</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {relaciones.map((relacion, index) => (
        <div 
          key={relacion.uuid}
          className="inline-flex flex-col items-start px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800"
        >
          <div className="flex items-center gap-1">
            <span className={`px-1 rounded ${relacion.tipo_entidad === 'TIPO_SENSOR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
              {relacion.tipo_entidad === 'TIPO_SENSOR' ? (
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Sensor
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Actuador
                </span>
              )}
            </span>
            <span className="font-medium ml-1">x{relacion.cantidad}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

RelacionesCell.displayName = 'RelacionesCell';

const FechaCreacionCell = memo(({ fecha }: { fecha?: string }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="whitespace-nowrap">
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
        <span>{formatDate(fecha)}</span>
      </div>
    </div>
  );
});

FechaCreacionCell.displayName = 'FechaCreacionCell';

// Componente de acciones memoizado
const TipoAutomatizacionActions = memo(({ 
  tipoAutomatizacion, 
  currentPage, 
  fetchTipoAutomatizaciones, 
  canEdit, 
  canDelete 
}: { 
  tipoAutomatizacion: TipoAutomatizacion; 
  currentPage: number; 
  fetchTipoAutomatizaciones: (page: number, size: number) => void; 
  canEdit: boolean; 
  canDelete: boolean; 
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

  const handleTipoAutomatizacionEditado = useCallback(() => {
    setShowEditDialog(false);
    fetchTipoAutomatizaciones(currentPage, 10);
  }, [currentPage, fetchTipoAutomatizaciones]);

  const handleTipoAutomatizacionEliminado = useCallback(async () => {
    try {
      setLoading(true);
      await tipoAutomatizacionService.deleteTipoAutomatizacion(tipoAutomatizacion.uuid!);
      setShowDeleteDialog(false);
      fetchTipoAutomatizaciones(currentPage, 10);
    } catch (error) {
      console.error("Error al eliminar tipo de automatización:", error);
    } finally {
      setLoading(false);
    }
  }, [tipoAutomatizacion.uuid, currentPage, fetchTipoAutomatizaciones]);

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

      <Suspense fallback={<div>Cargando diálogo...</div>}>
        {showEditDialog && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent   overflowVisible={true} size="3xl">
              <DialogHeader>
                <DialogTitle>Editar Tipo de Automatización</DialogTitle>
              </DialogHeader>
              <TipoAutomatizacionEditar 
                tipoAutomatizacion={tipoAutomatizacion.uuid!}
                onTipoAutomatizacionEditado={handleTipoAutomatizacionEditado}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
              />
            </DialogContent>
          </Dialog>
        )}

        {showDeleteDialog && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent   overflowVisible={true} className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Eliminar Tipo de Automatización</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el tipo de automatización <strong>{tipoAutomatizacion.nombre}</strong>? 
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleTipoAutomatizacionEliminado}
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
    </div>
  );
});

TipoAutomatizacionActions.displayName = 'TipoAutomatizacionActions';

const generatePageNumbers = (current: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages: (number | 'ellipsis')[] = [];
  
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    if (totalPages > 6) pages.push('ellipsis');
    pages.push(totalPages);
  } else if (current >= totalPages - 3) {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  }
  
  return pages;
};

const createColumns = (
  fetchTipoAutomatizaciones: (page: number, size: number) => void, 
  currentPage: number,
  canEdit: boolean,
  canDelete: boolean
): ColumnDef<TipoAutomatizacion>[] => [
  {
    accessorKey: "nombre",
    header: "Nombre",
    cell: ({ row }) => <NombreCell tipoAutomatizacion={row.original} />
  },
  {
    id: "relaciones",
    header: "Relaciones",
    cell: ({ row }) => <RelacionesCell relaciones={row.original.relaciones || []} />
  },
  {
    accessorKey: "created_at",
    header: "Fecha Creación",
    cell: ({ row }) => <FechaCreacionCell fecha={row.getValue("created_at") as string} />
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <TipoAutomatizacionActions 
        tipoAutomatizacion={row.original}
        currentPage={currentPage}
        fetchTipoAutomatizaciones={fetchTipoAutomatizaciones}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    ),
  }
];

// Componente de tabla memoizado
const TableContent = memo(({ 
  table, 
  columns,
  onPageChange,
  pager,
  data,
  currentPage
}: { 
  table: any; 
  columns: ColumnDef<TipoAutomatizacion>[];
  onPageChange: (page: number) => void;
  pager: Pager | null;
  data: TipoAutomatizacion[];
  currentPage: number;
}) => {
  const { hasSpecificRoute } = useModulePermissions("tipoAutomatizacion");
  const canEdit = hasSpecificRoute("PATCH", "tipoAutomatizacion/editar");
  const canDelete = hasSpecificRoute("DELETE", "tipoAutomatizacion/eliminar");

  return (
    <>
      <div className="flex items-center flex-wrap gap-2 px-4">
        <Input
          placeholder="Filtrar por nombre o tipo de relación..."
          value={(table.getColumn("nombre")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("nombre")?.setFilterValue(event.target.value)
          }
          className="max-w-sm min-w-[200px] h-10"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column: any) => column.getCanHide())
              .map((column: any) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay tipos de automatización disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center flex-wrap gap-4 px-4 py-4">
        <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>

        {pager && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(pager.currentPage - 1)}
                  className={pager.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {generatePageNumbers(pager.currentPage, pager.totalPages).map((page, index) => (
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
                  className={pager.currentPage === pager.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {pager && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Mostrando {data.length} de {pager.totalItems} tipos de automatización
          </div>
        )}
      </div>
    </>
  );
});

TableContent.displayName = 'TableContent';

export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const [data, setData] = useState<TipoAutomatizacion[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para react-table
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Permisos
  const { hasSpecificRoute } = useModulePermissions("tipoAutomatizacion");
  const canEdit = hasSpecificRoute("PATCH", "tipoAutomatizacion/editar");
  const canDelete = hasSpecificRoute("DELETE", "tipoAutomatizacion/eliminar");

  // Memoizar fetchTipoAutomatizaciones para evitar recreación
  const fetchTipoAutomatizaciones = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: TipoAutomatizacionResponse = await tipoAutomatizacionService.getTipoAutomatizaciones({ page, size });
      setData(response.data.data);
      setPager(response.data.pager);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar tipos de automatización");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTipoAutomatizaciones(1, 10);
  }, [fetchTipoAutomatizaciones]);

  // Efecto para refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTipoAutomatizaciones(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchTipoAutomatizaciones]);

  const columns = useMemo(() => 
    createColumns(fetchTipoAutomatizaciones, currentPage, canEdit, canDelete), 
    [currentPage, canEdit, canDelete, fetchTipoAutomatizaciones]
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

  const handlePageChange = useCallback((newPage: number) => {
    fetchTipoAutomatizaciones(newPage, 10);
  }, [fetchTipoAutomatizaciones]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>Cargando tipos de automatización...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button 
          onClick={() => fetchTipoAutomatizaciones(1, 10)} 
          className="ml-4"
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando tabla...</div>}>
      <TableContent 
        table={table}
        columns={columns}
        onPageChange={handlePageChange}
        pager={pager}
        data={data}
        currentPage={currentPage}
      />
    </Suspense>
  );
}

export default BasicDataTable;