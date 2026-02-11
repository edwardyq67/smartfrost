"use client";
import * as React from "react";

import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { usePermisosStore } from "@/store/permisos/permisosStore";
import ModalSeguridad from "./modalSeguridad";
import { Loader2 } from "lucide-react";

interface PermisoDataType {
  id: string;
  descripcion: string;
  valor: number;
  uuid_permiso: string;
  uuid_detalle: string;
}

const columns: ColumnDef<PermisoDataType>[] = [
  {
    accessorKey: "descripcion",
    header: "Permiso",
    cell: ({ row }) => (
      <div className="text-default-700">
        {row.getValue("descripcion")}
      </div>
    ),
  },
  {
    accessorKey: "valor",
    header: "Estado",
    cell: ({ row }) => {
      const permiso = row.original;
      const [showModal, setShowModal] = React.useState(false);
      const [nuevoValor, setNuevoValor] = React.useState(0);
      const [cambiandoPermiso, setCambiandoPermiso] = React.useState(false);
      const { actualizarPermisoEnStore } = usePermisosStore();

      const handleToggle = (checked: boolean) => {
        setNuevoValor(checked ? 1 : 0);
        setShowModal(true);
      };

      const handleConfirmarCambio = async () => {
        setCambiandoPermiso(true);
        try {
          // Actualizar solo este permiso en el store
          actualizarPermisoEnStore(permiso.uuid_detalle, nuevoValor);
        } finally {
          setCambiandoPermiso(false);
          setShowModal(false);
        }
      };

      const handleCancelarCambio = () => {
        setShowModal(false);
      };

      return (
        <>
          <div className="flex items-center space-x-2">
            {cambiandoPermiso ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Cambiando...</span>
              </div>
            ) : (
              <>
                <Switch
                  id={`permiso-${permiso.uuid_permiso}`}
                  checked={permiso.valor === 1}
                  onCheckedChange={handleToggle}
                  disabled={cambiandoPermiso}
                />
                <Label 
                  htmlFor={`permiso-${permiso.uuid_permiso}`}
                  className="cursor-pointer text-sm"
                >
                  {permiso.valor === 1 ? "Activo" : "Inactivo"}
                </Label>
              </>
            )}
          </div>

          <ModalSeguridad
            open={showModal}
            onClose={handleCancelarCambio}
            onConfirm={handleConfirmarCambio}
            title="Cambiar estado del permiso"
            description={
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas cambiar el permiso <strong>{permiso.descripcion}</strong> de{' '}
                <strong>{permiso.valor === 1 ? "Activo" : "Inactivo"}</strong> a{' '}
                <strong>{nuevoValor === 1 ? "Activo" : "Inactivo"}</strong>?
              </p>
            }
            confirmText={nuevoValor === 1 ? "Activar" : "Desactivar"}
            cancelText="Cancelar"
            variant={nuevoValor === 1 ? "default" : "destructive"}
            uuidDetalle={permiso.uuid_detalle}
            descripcionPermiso={permiso.descripcion}
            uuidPermiso={permiso.uuid_permiso}
            valorActual={permiso.valor} 
            nuevoValor={nuevoValor}
          />
        </>
      );
    },
  }
];

const TopPage = () => {
  const {  
    rolSeleccionado, 
    modulosDesdeAPI,
    nombreModuloSeleccionado,
    setModulosDesdeAPI,
    loading, // ← Usar loading del store
  } = usePermisosStore();
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  React.useEffect(() => {
    setModulosDesdeAPI([]);
  }, [rolSeleccionado, setModulosDesdeAPI]);

  // Usar React.useMemo para memoizar los datos y evitar re-renders innecesarios
  const permisosDelModulo = React.useMemo(() => {
    if (!modulosDesdeAPI || modulosDesdeAPI.length === 0) return [];
    
    return modulosDesdeAPI.map((permiso, index) => ({
      id: (index + 1).toString(),
      descripcion: permiso.descripcion,
      valor: permiso.valor,
      uuid_permiso: permiso.uuid_permiso,
      uuid_detalle: permiso.uuid_detalle
    }));
  }, [modulosDesdeAPI]);

  // Crear una key única para forzar el re-render solo cuando realmente cambian los datos
  const tableKey = React.useMemo(() => {
    return `table-${rolSeleccionado?.uuid}-${nombreModuloSeleccionado}`;
  }, [rolSeleccionado, nombreModuloSeleccionado]);

  const table = useReactTable<PermisoDataType>({
    data: permisosDelModulo,
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

  // Si está cargando
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-default-500">
          Cargando permisos del módulo...
        </p>
      </div>
    );
  }

  // Si no hay permisos cargados desde API, mostrar mensaje
  if (!modulosDesdeAPI || modulosDesdeAPI.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-default-500">
          {rolSeleccionado 
            ? "Selecciona un módulo para ver sus permisos" 
            : "Selecciona un rol para comenzar"
          }
        </p>
      </div>
    );
  }

  return (
    <div key={tableKey} className="h-full">
      <div className="h-full overflow-y-auto">
        <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-default-200">
          <h3 className="text-lg font-semibold text-default-700 capitalize">
            Permisos del módulo: {nombreModuloSeleccionado.toLowerCase()}
          </h3>
          {rolSeleccionado && (
            <p className="text-sm text-default-500">
              Rol: {rolSeleccionado.nombre}
            </p>
          )}
        </div>
        <Table className="h-full">
          <TableBody className="[&_tr:last-child]:border-1">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={`toppage-row-${index}`}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-default-50"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={`toppage-cell-${index}`}
                      className="text-sm text-default-700 border-b border-default-100 dark:border-default-200"
                    >
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
                  No se encontraron permisos para este módulo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default TopPage;