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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock, Eye, Calendar, User, FileText, CheckCircle, XCircle, Tag, Bell } from "lucide-react";
import { 
  Notificacion, 
  notificacionesService, 
  NotificacionesResponse, 
  Pager 
} from "@/lib/notificaciones/UseNotificaciones";
import { useNotificacionesStore } from "@/store/notificaciones/notificacionesStores";
import { TabletGlobal } from "@/components/shared/TabletGlobal";
import { TableRowData, CellData } from "@/utils/data-table-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Modales dinámicos

interface BasicDataTableProps {
  refreshTrigger?: number;
}

// Componente para acciones
const NotificacionActions = memo(({ 
  notificacion, 
  currentPage, 
  fetchNotificaciones,
  hasDeletePermission,
  hasViewPermission
}: { 
  notificacion: Notificacion; 
  currentPage: number;
  fetchNotificaciones: (page?: number, size?: number) => void;
  hasDeletePermission: boolean;
  hasViewPermission: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false); // <-- NUEVO ESTADO

  const handleNotificacionEliminada = useCallback(async () => {
    try {
      setLoading(true);
      await notificacionesService.deleteNotificacion(notificacion.uuid);
      setShowDeleteDialog(false);
      fetchNotificaciones(currentPage, 10);
    } catch (error) {
      setLoading(false);
    }
  }, [notificacion.uuid, currentPage, fetchNotificaciones]);

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="text-end relative">
      {/* MODAL PARA VER DETALLES - NUEVO */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent size="3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles de la Notificación
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Encabezado con título y estado */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">
                  {notificacion.titulo || "Sin título"}
                </h3>
                <Badge 
                
                  className="flex items-center gap-1"
                >
                  {notificacion.notificado === "1" ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Leída
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      No leída
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Información principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    <span>Receptor</span>
                  </div>
                  <div className="pl-6">
                    <p className="font-medium">
                      {notificacion.receptor?.nombre || "No especificado"}
                    </p>
                  </div>
                </div>

                {/* Creador */}
                {notificacion.creador && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      <span>Creador</span>
                    </div>
                    <div className="pl-6">
                      <p className="font-medium">
                        {notificacion.creador.nombre || "No especificado"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>Fecha de creación</span>
                  </div>
                  <div className="pl-6">
                    <p>{formatDate(notificacion.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                {/* UUID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    <span>Identificadores</span>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">UUID</p>
                      <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                        {notificacion.uuid}
                      </p>
                    </div>
                    {notificacion.id && (
                      <div>
                        <p className="text-xs text-muted-foreground">ID Interno</p>
                        <p className="text-sm">{notificacion.id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipo */}
                {notificacion.tipo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="h-4 w-4" />
                      <span>Tipo</span>
                    </div>
                    <div className="pl-6">
                      <Badge variant="outline" className="capitalize">
                        {notificacion.tipo}
                      </Badge>
                    </div>
                  </div>
                )}

              

              </div>
            </div>

            <Separator />

            {/* Mensaje completo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                <span>Mensaje</span>
              </div>
              <div className="pl-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">
                    {notificacion.mensaje || "No hay mensaje disponible"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowViewDialog(false)} variant="outline">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL PARA ELIMINAR (EXISTENTE) */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Notificación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar la notificación <strong>"{notificacion.titulo}"</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleNotificacionEliminada}
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
          
          {hasViewPermission && (
            <DropdownMenuItem onClick={() => setShowViewDialog(true)}> {/* MODIFICADO */}
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
          )}
          {hasDeletePermission && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

NotificacionActions.displayName = 'NotificacionActions';

// Componente principal
export function BasicDataTable({ refreshTrigger }: BasicDataTableProps) {
  const [data, setData] = useState<Notificacion[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  
  const { usuarioSeleccionado } = useNotificacionesStore();
  
  // Obtener permisos del módulo notificaciones
  const { hasSpecificRoute } = useModulePermissions("notificaciones");
  // Verificar permisos específicos
  const hasDeletePermission = hasSpecificRoute("DELETE", "notificaciones/eliminar");

  const hasViewPermission = hasSpecificRoute("GET", "notificaciones/ver");

  // Columnas para TabletGlobal
  const tabletColumns = useMemo(() => [
    {
      key: "titulo",
      header: "Notificación",
      hideable: false,
    },
    {
      key: "receptor",
      header: "Receptor",
      hideable: true,
    },
    {
      key: "estado",
      header: "Estado",
      hideable: true,
    },
    {
      key: "fecha",
      header: "Fecha",
      hideable: true,
    },
    {
      key: "acciones",
      header: "Acciones",
      hideable: false,
    }
  ], []);

  // Preparar datos para transformDataForTable
  const prepareDataForTable = useCallback((notificaciones: Notificacion[]): TableRowData[] => {
    return notificaciones.map(notificacion => {
      const fecha = new Date(notificacion.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const rowData: TableRowData = {
        id: notificacion.uuid, // Añadir el id requerido
        _original: notificacion,
        titulo: {
          type: 'text',
          data: {
            value: notificacion.titulo || "Sin título",
            subtitle: notificacion.mensaje || "Sin mensaje"
          }
        },
        receptor: {
          type: 'text',
          data: {
            value: notificacion.receptor?.nombre || "Usuario"
          }
        },
        estado: {
          type: 'status',
          data: {
            isActive: notificacion.notificado === "1",
            text: notificacion.notificado === "1" ? "Leído" : "No leído"
          }
        },
        fecha: {
          type: 'text',
          data: {
            value: fecha
          }
        },
        acciones: {
          type: 'actions',
          data: notificacion
        }
      };
      
      return rowData;
    });
  }, []);

  // Transformar datos usando prepareDataForTable
  const dataArray = useMemo(() => {
    // Aplicar filtro
    let filteredData = data;
    if (filterValue) {
      const searchTerm = filterValue.toLowerCase();
      filteredData = data.filter(notificacion => 
        notificacion.titulo?.toLowerCase().includes(searchTerm) ||
        notificacion.mensaje?.toLowerCase().includes(searchTerm) ||
        notificacion.receptor?.nombre?.toLowerCase().includes(searchTerm) ||
        (notificacion.notificado === "1" && "leído".includes(searchTerm)) ||
        (notificacion.notificado === "0" && "no leído".includes(searchTerm))
      );
    }
    
    // Preparar datos directamente
    return prepareDataForTable(filteredData);
  }, [data, filterValue, prepareDataForTable]);

  // Fetch de datos
  const fetchNotificaciones = useCallback(async (page: number = 1, size: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = { page, size };
      
      if (usuarioSeleccionado) {
        filters.id_user_ref = usuarioSeleccionado.uuid;
      }
      
      const response: NotificacionesResponse = await notificacionesService.getNotificaciones(filters);
      
      setData(response.data.data || []);
      setPager(response.data.pager || null);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error al cargar notificaciones");
      setData([]);
      setPager(null);
    } finally {
      setLoading(false);
    }
  }, [usuarioSeleccionado]);

  // Función para renderizar acciones en TabletGlobal
  const renderActions = useCallback((rowData: any) => {
    const originalNotificacion = rowData._original || rowData;
    
    return (
      <NotificacionActions 
        notificacion={originalNotificacion}
        currentPage={currentPage}
        fetchNotificaciones={fetchNotificaciones}
        hasDeletePermission={hasDeletePermission}
        hasViewPermission={hasViewPermission}
      />
    );
  }, [currentPage, fetchNotificaciones, hasDeletePermission, hasViewPermission]);

  useEffect(() => {
    fetchNotificaciones(1, 10);
  }, [fetchNotificaciones]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchNotificaciones(currentPage, 10);
    }
  }, [refreshTrigger, currentPage, fetchNotificaciones]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchNotificaciones(newPage, 10);
  }, [fetchNotificaciones]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Cargando notificaciones...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchNotificaciones(1, 10)}
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
      {/* Información de permisos (opcional, para debug) */}
      <div className="hidden">
        <div>Permisos:</div>
        <div>Eliminar: {hasDeletePermission ? "✅" : "❌"}</div>
        <div>Ver: {hasViewPermission ? "✅" : "❌"}</div>
      </div>

      {/* Input de filtro */}
      <div className="mb-4 px-4">
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Filtrar por título, mensaje o receptor..."
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
    </>
  );
}

export default BasicDataTable;