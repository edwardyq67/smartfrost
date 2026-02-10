"use client";
import { MoreHorizontal, Calendar, User, Building, Wrench, Grid, List, CheckCircle, Clock, AlertCircle, Filter, X } from "lucide-react";
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
import { Pencil, Trash2 } from "lucide-react";
import {
  TrabajoLista,
  trabajosService,
  TrabajosResponse,
  Pager
} from "@/lib/trabajo/UseTrabajo";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DialogDescription = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogDescription));
const TrabajoEditar = dynamic(() => import("./components/TrabajoEditar").then(mod => mod.TrabajoEditar), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Cargando editor...</div>
});

interface BasicDataTableProps {
  refreshTrigger?: number;
  size?: number;
}

type DateFilterType = 'fc' | 'fi' | 'fe' | 'ff' | 'none';
type DateRange = {
  desde: Date | undefined;
  hasta: Date | undefined;
};

interface DateFilters {
  fc: DateRange;
  fi: DateRange;
  fe: DateRange;
  ff: DateRange;
}

const generatePageNumbers = (pager: Pager) => {
  const pages: (number | string)[] = [];
  const totalPages = pager.totalPages;
  const currentPage = pager.currentPage;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
  }

  return pages;
};

const EmptyState = memo(({ hasFilter }: {
  hasFilter: boolean;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 px-4">
      <div className="text-center">
        <div className="h-16 w-16 text-muted-foreground mx-auto mb-4 flex items-center justify-center">
          <Wrench className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          {hasFilter
            ? "No se encontraron trabajos"
            : "No hay trabajos disponibles"
          }
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {hasFilter
            ? "No se encontraron trabajos que coincidan con tu búsqueda."
            : "Aún no se han registrado trabajos."
          }
        </p>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

const TrabajoCard = memo(({
  trabajo,
  onEdit,
  onDelete,
  hasEditPermission,
  hasDeletePermission
}: {
  trabajo: any;
  onEdit: () => void;
  onDelete: () => void;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
}) => {
  const getCardVariant = () => {
    if (!trabajo.fecha_creacion || trabajo.fecha_creacion === "No asignada") {
      return "default";
    }

    if (trabajo.fecha_entrega && trabajo.fecha_entrega !== "No asignada") {
      return "success";
    }

    if (trabajo.fecha_inicio && trabajo.fecha_inicio !== "No asignada") {
      return "primary";
    }

    return "secondary";
  };

  const getStatusIcon = () => {
    const variant = getCardVariant();
    switch (variant) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "primary":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "secondary":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    const variant = getCardVariant();
    switch (variant) {
      case "success":
        return "Completado";
      case "primary":
        return "En proceso";
      case "secondary":
        return "Creado";
      default:
        return "Desconocido";
    }
  };

  const cardVariant = getCardVariant();

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow duration-300 border-l-4",
      cardVariant === "success" && "border-l-green-500",
      cardVariant === "primary" && "border-l-blue-500",
      cardVariant === "secondary" && "border-l-gray-300"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start w-full">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              {trabajo.empresa}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Creado por {trabajo.creador}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  Sin permisos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Técnico asignado
            </Label>
            <p className="font-medium">{trabajo.tecnico || "Sin asignar"}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Estado
            </Label>
            <p className="font-medium flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </p>
          </div>
        </div>

        {trabajo.observaciones && trabajo.observaciones !== "Sin observaciones" && (
          <div className="mt-2">
            <Label className="text-xs text-muted-foreground">Observaciones</Label>
            <p className="text-sm mt-1 line-clamp-2">{trabajo.observaciones}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TrabajoCard.displayName = 'TrabajoCard';

const DateFilterComponent = memo(({
  label,
  dateRange,
  onDateChange,
  onClear
}: {
  label: string;
  dateRange: DateRange;
  onDateChange: (field: 'desde' | 'hasta', date: Date | undefined) => void;
  onClear: () => void;
}) => {
  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "Seleccionar fecha";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.desde && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {formatDateDisplay(dateRange.desde)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={dateRange.desde}
              onSelect={(date) => onDateChange('desde', date)}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.hasta && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {formatDateDisplay(dateRange.hasta)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={dateRange.hasta}
              onSelect={(date) => onDateChange('hasta', date)}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

DateFilterComponent.displayName = 'DateFilterComponent';

// Hook personalizado para verificar permisos de trabajos
const useTrabajoPermissions = () => {
  const { hasSpecificRoute } = useModulePermissions("trabajos");

  // Verificar permisos específicos
  const hasPorEmpresaPermission = hasSpecificRoute("GET", "trabajos/PorEmpresa");
  const hasPorUsuarioPermission = hasSpecificRoute("GET", "trabajos/PorUsuario");
  const hasGeneralPermission = hasSpecificRoute("GET", "trabajos");
  const hasVerPermission = hasSpecificRoute("GET", "trabajos/ver"); // ← NUEVO
  
  // Permisos de edición/eliminación
  const hasEditPermission = hasSpecificRoute("PATCH", "trabajos/editar");
  const hasDeletePermission = hasSpecificRoute("DELETE", "trabajos/eliminar");

  return {
    hasPorEmpresaPermission,
    hasPorUsuarioPermission,
    hasGeneralPermission,
    hasVerPermission, // ← NUEVO
    hasEditPermission,
    hasDeletePermission
  };
};

export function BasicDataTable({ refreshTrigger, size = 0 }: BasicDataTableProps) {
  const {
    hasPorEmpresaPermission,
    hasPorUsuarioPermission,
    hasGeneralPermission,
    hasVerPermission, // ← NUEVO
    hasEditPermission,
    hasDeletePermission
  } = useTrabajoPermissions();

  const { user } = useAuthStore();

  const [data, setData] = useState<TrabajoLista[]>([]);
  const [pager, setPager] = useState<Pager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('none');
  const [dateFilters, setDateFilters] = useState<DateFilters>({
    fc: { desde: undefined, hasta: undefined },
    fi: { desde: undefined, hasta: undefined },
    fe: { desde: undefined, hasta: undefined },
    ff: { desde: undefined, hasta: undefined },
  });
  const [showDateFilters, setShowDateFilters] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<{
    filterValue: string;
    dateFilterType: DateFilterType;
    dateFilters: DateFilters;
  }>({
    filterValue: "",
    dateFilterType: 'none',
    dateFilters: {
      fc: { desde: undefined, hasta: undefined },
      fi: { desde: undefined, hasta: undefined },
      fe: { desde: undefined, hasta: undefined },
      ff: { desde: undefined, hasta: undefined },
    }
  });

  const [editingTrabajo, setEditingTrabajo] = useState<TrabajoLista | null>(null);
  const [deletingTrabajo, setDeletingTrabajo] = useState<TrabajoLista | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const prepareDataForTable = useCallback((trabajos: TrabajoLista[]) => {
    return trabajos.map(trabajo => {
      const formatDate = (dateString: string | null) => {
        if (!dateString) return "No asignada";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };

      return {
        ...trabajo,
        fecha_creacion: formatDate(trabajo.fecha_creacion),
        fecha_inicio: formatDate(trabajo.fecha_inicio),
        fecha_entrega: formatDate(trabajo.fecha_entrega),
        fecha_finalizacion: trabajo.fecha_finalizacion ? formatDate(trabajo.fecha_finalizacion) : "No asignada",
        observaciones: trabajo.observaciones || "Sin observaciones",
        _original: trabajo
      };
    });
  }, []);

  const buildFilterParams = useCallback(() => {
    const params: any = {};

    if (appliedFilters.filterValue) {
      params.filter = appliedFilters.filterValue;
    }

    if (appliedFilters.dateFilterType !== 'none') {
      const activeFilter = appliedFilters.dateFilters[appliedFilters.dateFilterType];

      if (activeFilter.desde) {
        params[`${appliedFilters.dateFilterType}_ini`] = format(activeFilter.desde, 'yyyy-MM-dd');
      }

      if (activeFilter.hasta) {
        params[`${appliedFilters.dateFilterType}_fin`] = format(activeFilter.hasta, 'yyyy-MM-dd');
      }
    }

    // ✅ CORREGIDO: Prioridad correcta de permisos CON hasVerPermission
    if (hasGeneralPermission || hasVerPermission) {
      // 1. Si tiene permiso GENERAL o VER → NO aplica filtro, ve TODOS
      console.log("Usuario tiene permiso general/ver - viendo todos los trabajos");
    } else if (hasPorEmpresaPermission && user?.empresa) {
      // 2. Si tiene permiso PorEmpresa y tiene empresa → filtrar por empresa
      params.id_empresa = user.empresa;
    } else if (hasPorUsuarioPermission && user?.id) {
      // 3. Si tiene permiso PorUsuario → filtrar por usuario
      params.id_usuario = user.id;
    } else {
      // 4. No tiene ningún permiso de lectura
      throw new Error("No tiene permisos para ver trabajos");
    }

    return params;
  }, [appliedFilters, hasPorEmpresaPermission, hasPorUsuarioPermission, hasGeneralPermission, hasVerPermission, user]);

  const fetchTrabajos = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, size: 12 };

      // ✅ CORREGIDO: Incluir hasVerPermission en la verificación
      if (!hasPorEmpresaPermission && !hasPorUsuarioPermission && !hasGeneralPermission && !hasVerPermission) {
        setError("No tiene permisos para ver trabajos");
        setData([]);
        setPager(null);
        return;
      }

      // ✅ CORREGIDO: Solo validar empresa si NO tiene permisos generales/ver
      if (hasPorEmpresaPermission && !user?.empresa && !hasGeneralPermission && !hasVerPermission) {
        setError("No tiene una empresa asignada para ver trabajos");
        setData([]);
        setPager(null);
        return;
      }

      try {
        const filterParams = buildFilterParams();
        Object.assign(params, filterParams);
        
        console.log("Parámetros enviados al backend:", params);
        
        const response: TrabajosResponse = await trabajosService.getTrabajos(params);

        if (response.data && response.data.data) {
          let dataToShow = response.data.data;

          if (size > 0) {
            dataToShow = dataToShow.slice(0, size);
          }

          setData(dataToShow);

          if (size > 0) {
            setPager({
              ...response.data.pager,
              currentPage: 1,
              totalPages: 1,
              totalItems: dataToShow.length
            });
          } else {
            setPager(response.data.pager);
          }
        } else {
          setData([]);
          setPager(null);
        }

        setCurrentPage(page);
      } catch (err: any) {
        if (err.message.includes("No tiene permisos")) {
          setError(err.message);
          setData([]);
          setPager(null);
        } else {
          setError(err.message || "Error al cargar trabajos");
          setData([]);
          setPager(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, size, hasPorEmpresaPermission, hasPorUsuarioPermission, hasGeneralPermission, hasVerPermission, user]);

  const preparedData = useMemo(() => {
    let filteredData = data;
    if (filterValue && filterValue !== appliedFilters.filterValue) {
      filteredData = data.filter(trabajo =>
        trabajo.empresa?.toLowerCase().includes(filterValue.toLowerCase()) ||
        trabajo.creador?.toLowerCase().includes(filterValue.toLowerCase()) ||
        trabajo.tecnico?.toLowerCase().includes(filterValue.toLowerCase()) ||
        (trabajo.tipo === "0" && "preventivo".includes(filterValue.toLowerCase())) ||
        (trabajo.tipo === "1" && "correctivo".includes(filterValue.toLowerCase()))
      );
    }

    return prepareDataForTable(filteredData);
  }, [data, filterValue, appliedFilters.filterValue, prepareDataForTable]);

  const handleEditTrabajo = useCallback((trabajo: any) => {
    setEditingTrabajo(trabajo._original || trabajo);
  }, []);

  const handleDeleteTrabajo = useCallback((trabajo: any) => {
    setDeletingTrabajo(trabajo._original || trabajo);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingTrabajo(null);
    fetchTrabajos(currentPage);
  }, [currentPage, fetchTrabajos]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTrabajo) return;

    try {
      setDeleteLoading(true);
      await trabajosService.deleteTrabajo(deletingTrabajo.uuid);
      setDeletingTrabajo(null);
      fetchTrabajos(currentPage);
    } catch (error) {
      console.error("Error al eliminar trabajo:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTrabajo, currentPage, fetchTrabajos]);

  const handlePageChange = useCallback((page: number) => {
    fetchTrabajos(page);
  }, [fetchTrabajos]);

  const handleDateFilterChange = useCallback((type: DateFilterType, field: 'desde' | 'hasta', date: Date | undefined) => {
    if (type === 'none') return;

    setDateFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: date
      }
    }));
  }, []);

  const handleClearDateFilter = useCallback((type: keyof DateFilters) => {
    setDateFilters(prev => ({
      ...prev,
      [type]: { desde: undefined, hasta: undefined }
    }));
    if (dateFilterType === type) {
      setDateFilterType('none');
    }
  }, [dateFilterType]);

  const handleApplyDateFilters = useCallback(() => {
    setAppliedFilters({
      filterValue: filterValue,
      dateFilterType: dateFilterType,
      dateFilters: { ...dateFilters }
    });

    setShowDateFilters(false);
    fetchTrabajos(1);
  }, [filterValue, dateFilterType, dateFilters, fetchTrabajos]);

  const handleClearAllDateFilters = useCallback(() => {
    setDateFilters({
      fc: { desde: undefined, hasta: undefined },
      fi: { desde: undefined, hasta: undefined },
      fe: { desde: undefined, hasta: undefined },
      ff: { desde: undefined, hasta: undefined },
    });
    setDateFilterType('none');
    setShowDateFilters(false);

    setAppliedFilters(prev => ({
      ...prev,
      dateFilterType: 'none',
      dateFilters: {
        fc: { desde: undefined, hasta: undefined },
        fi: { desde: undefined, hasta: undefined },
        fe: { desde: undefined, hasta: undefined },
        ff: { desde: undefined, hasta: undefined },
      }
    }));

    fetchTrabajos(1);
  }, [filterValue, fetchTrabajos]);

  const handleApplyTextFilter = useCallback(() => {
    setAppliedFilters(prev => ({
      ...prev,
      filterValue: filterValue
    }));
    fetchTrabajos(1);
  }, [filterValue, fetchTrabajos]);

  const handleClearTextFilter = useCallback(() => {
    setFilterValue("");
    setAppliedFilters(prev => ({
      ...prev,
      filterValue: ""
    }));
    fetchTrabajos(1);
  }, [fetchTrabajos]);

  const hasActiveDateFilter = useMemo(() => {
    return Object.values(appliedFilters.dateFilters).some(filter =>
      filter.desde !== undefined || filter.hasta !== undefined
    );
  }, [appliedFilters.dateFilters]);

  useEffect(() => {
    fetchTrabajos(1);
  }, [fetchTrabajos]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchTrabajos(currentPage);
    }
  }, [refreshTrigger, currentPage, fetchTrabajos]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <div className="text-red-500">Error: {error}</div>
        <Button
          onClick={() => fetchTrabajos(1)}
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const hasData = preparedData.length > 0;
  const hasFilter = appliedFilters.filterValue.length > 0 || hasActiveDateFilter;
  const hasPendingTextFilter = filterValue !== appliedFilters.filterValue;

  return (
    <div className="space-y-6 pb-4 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="w-full sm:w-auto">
            <div className="relative max-w-sm">
              <Input
                type="text"
                placeholder="Filtrar por empresa, creador, técnico o tipo..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyTextFilter();
                  }
                }}
                className="w-full sm:w-[350px]"
              />
              {(filterValue || appliedFilters.filterValue) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {hasPendingTextFilter && (
                    <button
                      onClick={handleApplyTextFilter}
                      className="text-primary hover:text-primary/80"
                      title="Aplicar filtro"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={handleClearTextFilter}
                    className="text-muted-foreground hover:text-foreground"
                    title="Limpiar filtro"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={showDateFilters} onOpenChange={setShowDateFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex items-center gap-1",
                    hasActiveDateFilter && "border-primary bg-primary/10"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Filtro por fecha
                  {hasActiveDateFilter && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros de fecha</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllDateFilters}
                      className="h-6 px-2"
                    >
                      Limpiar todo
                    </Button>
                  </div>

                  <Select
                    value={dateFilterType}
                    onValueChange={(value: DateFilterType) => setDateFilterType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de fecha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin filtro de fecha</SelectItem>
                      <SelectItem value="fc">Fecha de creación</SelectItem>
                      <SelectItem value="fi">Fecha de inicio</SelectItem>
                      <SelectItem value="fe">Fecha de entrega</SelectItem>
                      <SelectItem value="ff">Fecha de finalización</SelectItem>
                    </SelectContent>
                  </Select>

                  {dateFilterType !== 'none' && (
                    <>
                      <DateFilterComponent
                        label={
                          dateFilterType === 'fc' ? 'Fecha de creación' :
                            dateFilterType === 'fi' ? 'Fecha de inicio' :
                              dateFilterType === 'fe' ? 'Fecha de entrega' :
                                'Fecha de finalización'
                        }
                        dateRange={dateFilters[dateFilterType]}
                        onDateChange={(field, date) => handleDateFilterChange(dateFilterType, field, date)}
                        onClear={() => handleClearDateFilter(dateFilterType)}
                      />

                      <Button
                        onClick={handleApplyDateFilters}
                        className="w-full"
                      >
                        Aplicar filtros
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-1"
          >
            <Grid className="h-4 w-4" />
            Grid
          </Button>
          <Button
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
        </div>
      </div>

      {!hasData && (
        <EmptyState
          hasFilter={hasFilter}
        />
      )}

      {hasData && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {preparedData.map((trabajo) => (
            <TrabajoCard
              key={trabajo.uuid}
              trabajo={trabajo}
              onEdit={() => handleEditTrabajo(trabajo)}
              onDelete={() => handleDeleteTrabajo(trabajo)}
              hasEditPermission={hasEditPermission}
              hasDeletePermission={hasDeletePermission}
            />
          ))}
        </div>
      )}

      {hasData && viewMode === "list" && (
        <div className="space-y-4">
          {preparedData.map((trabajo) => (
            <Card
              key={trabajo.uuid}
              className={cn(
                "hover:shadow-md transition-shadow border-l-4",
                !trabajo.fecha_inicio || trabajo.fecha_inicio === "No asignada"
                  ? "border-l-gray-300"
                  : trabajo.fecha_entrega && trabajo.fecha_entrega !== "No asignada"
                    ? "border-l-green-500"
                    : "border-l-blue-500"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">{trabajo.empresa}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge>
                          {trabajo.tipo === "0"
                            ? "Plan de mantenimiento preventivo"
                            : "Plan de mantenimiento correctivo"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {trabajo.fecha_creacion}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  {hasEditPermission && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTrabajo(trabajo)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasData && pager && pager.totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pager.currentPage - 1)}
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
                      onClick={() => handlePageChange(page as number)}
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
                  onClick={() => handlePageChange(pager.currentPage + 1)}
                  className={cn(
                    "cursor-pointer",
                    pager.currentPage === pager.totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Suspense fallback={null}>
        {editingTrabajo && (
          <Dialog open={!!editingTrabajo} onOpenChange={() => setEditingTrabajo(null)}>
            <DialogContent size="3xl" overflowVisible={true}>
              <DialogHeader>
                <DialogTitle>Editar Trabajo</DialogTitle>
                <DialogDescription>
                  Modifique los detalles del trabajo
                </DialogDescription>
              </DialogHeader>
              <TrabajoEditar
                trabajo={editingTrabajo.uuid}
                onTrabajoEditado={handleCloseEdit}
                open={!!editingTrabajo}
                onOpenChange={(open) => !open && setEditingTrabajo(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {deletingTrabajo && (
          <Dialog open={!!deletingTrabajo} onOpenChange={() => setDeletingTrabajo(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Trabajo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que deseas eliminar el trabajo para la empresa <strong>{deletingTrabajo.empresa}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingTrabajo(null)}
                    disabled={deleteLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Suspense>
    </div>
  );
}

export default BasicDataTable;