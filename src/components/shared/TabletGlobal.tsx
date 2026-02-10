// components/shared/TabletGlobal.tsx
"use client";

import { useState, useMemo, ReactNode } from "react";
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
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableRowData, CellData } from "@/utils/data-table-helpers";

// Define la interfaz Pager que coincide con tu API
interface TabletPager {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
}

export interface TabletGlobalColumn {
  key: string;
  header: string;
  hideable?: boolean;
}

interface TabletGlobalProps {
  dataArray: TableRowData[];
  pager?: TabletPager | null;
  onPageChange?: (page: number) => void;
  showColumnSelector?: boolean;
  columns: TabletGlobalColumn[];
  renderActions?: (rowData: any) => ReactNode;
}

// Componente para renderizar diferentes tipos de celdas
const CellRenderer = ({ 
  cellData,
  renderActions 
}: { 
  cellData: CellData;
  renderActions?: (rowData: any) => ReactNode;
}) => {
  if (!cellData) return null;

  switch (cellData.type) {
    case 'avatar':
      return (
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Avatar className="rounded-full">
            {cellData.data?.image ? (
              <AvatarImage src={cellData.data.image} />
            ) : (
              <AvatarFallback>
                {cellData.data?.title?.charAt(0) || cellData.data?.value?.charAt(0) || '?'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-card-foreground whitespace-nowrap">
              {cellData.data?.title || cellData.data?.value || 'Sin nombre'}
            </span>
            {cellData.data?.subtitle && (
              <span className="text-xs text-muted-foreground">
                {cellData.data.subtitle}
              </span>
            )}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="whitespace-nowrap">
          {cellData.data?.value || 'N/A'}
        </div>
      );

    case 'badge':
      return (
        <Badge variant={cellData.data?.variant || "outline"}>
          {cellData.data?.value || cellData.data?.text || 'N/A'}
        </Badge>
      );

    case 'status':
      const isActive = cellData.data?.isActive;
      return (
        <Badge
          variant="soft"
          color={isActive ? "success" : "destructive"}
          className="capitalize"
        >
          {cellData.data?.text || (isActive ? 'Activo' : 'Inactivo')}
        </Badge>
      );

    case 'actions':
      return (
        <div className="text-end relative">
          {renderActions ? renderActions(cellData.data) : null}
        </div>
      );

    default:
      return <span>{cellData.data?.value || 'N/A'}</span>;
  }
};

// Función para generar números de página con ellipsis
const generatePageNumbers = (current: number, totalPages: number): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      if (totalPages > 6) pages.push('ellipsis');
      pages.push(totalPages);
    } else if (current >= totalPages - 3) {
      pages.push(1);
      if (totalPages > 6) pages.push('ellipsis');
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

export function TabletGlobal({
  dataArray,
  pager,
  onPageChange,
  showColumnSelector = true,
  columns,
  renderActions,
}: TabletGlobalProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Usar las columnas proporcionadas por el padre
  const autoColumns = useMemo(() => {
    return columns.map(col => ({
      key: col.key,
      header: col.header,
      hideable: col.hideable ?? (col.key !== 'acciones'),
    }));
  }, [columns]);

  // Crear columnas para react-table
  const tableColumns = useMemo<ColumnDef<TableRowData>[]>(() =>
    autoColumns.map(col => ({
      accessorKey: col.key,
      header: col.header,
      cell: ({ row }) => (
        <CellRenderer 
          cellData={row.original[col.key] as CellData} 
          renderActions={col.key === 'acciones' ? renderActions : undefined}
        />
      ),
      enableHiding: col.hideable,
    })),
    [autoColumns, renderActions]
  );

  const table = useReactTable({
    data: dataArray,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Calcular pageSize (default a 10 si no está definido)
  const pageSize = pager?.pageSize || 10;
  
  // Calcular índices para mostrar
  const startIndex = pager ? (pager.currentPage - 1) * pageSize + 1 : 1;
  const endIndex = pager ? Math.min(pager.currentPage * pageSize, pager.totalItems) : dataArray.length;

  if (dataArray.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">No hay datos disponibles.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Solo selector de columnas */}
      {showColumnSelector && (
        <div className="flex items-center justify-end px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columnas <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {autoColumns.find(c => c.key === column.id)?.header || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
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
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
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
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  No hay datos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pager && onPageChange && (
        <div className="flex items-center flex-wrap gap-4 px-4 py-4">
          <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
            Mostrando {startIndex} a {endIndex} de {pager.totalItems} elementos
          </div>

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

          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Página {pager.currentPage} de {pager.totalPages}
          </div>
        </div>
      )}
    </div>
  );
}