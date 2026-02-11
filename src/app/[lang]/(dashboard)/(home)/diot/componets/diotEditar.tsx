"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { dispositivosService, DispositivoLista } from "@/lib/dispositivos/UseDispositivos";
import { useRefreshTableDispositivos } from "@/store/dispositivos/refreshTableDispositivos";
import { useState, useEffect, useCallback, useMemo } from "react";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { 
  TipoSistemaService, 
  TipoSistema, 
  TipoSistemaResponse 
} from "@/lib/tipoSistema/UseTipoSistema";

interface DiotFormData {
  nombre: string;
  imei: string;
  id_tipo_sistema: string;
}

interface BackendError {
  status: number;
  error: number;
  messages: {
    imei?: string;
    nombre?: string;
    id_tipo_sistema?: string;
    sistema_nombre?: string;
  };
}

interface DiotEditarProps {
  dispositivo: DispositivoLista;
  onDiotEditado: () => void;
}

export function DiotEditar({ dispositivo, onDiotEditado }: DiotEditarProps) {
  const { triggerRefresh } = useRefreshTableDispositivos();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imeiError, setImeiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tiposSistemas, setTiposSistemas] = useState<TipoSistema[]>([]);
  const [loadingSistemas, setLoadingSistemas] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pag, setPag] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<DiotFormData>({
    defaultValues: {
      nombre: dispositivo.nombre,
      imei: dispositivo.imei,
      id_tipo_sistema: dispositivo.id_tipo_sistema,
    }
  });

  const sistemaValue = watch("id_tipo_sistema");

  // ✅ Obtener el nombre del sistema seleccionado
  const nombreSistemaSeleccionado = useMemo(() => {
    if (!sistemaValue) return "";
    
    const sistema = tiposSistemas.find(s => s.uuid === sistemaValue);
    return sistema ? sistema.nombre : "";
  }, [sistemaValue, tiposSistemas]);

  // ✅ Texto para el placeholder: nombre del sistema seleccionado o el inicial
  const placeholderText = useMemo(() => {
    // Si hay un sistema seleccionado, mostrar su nombre
    if (nombreSistemaSeleccionado) {
      return nombreSistemaSeleccionado;
    }
    
    // Si hay un sistema inicial (al cargar el formulario), mostrar su nombre
    if (dispositivo.sistema_nombre && dispositivo.sistema_nombre.trim() !== "") {
      return dispositivo.sistema_nombre;
    }
    
    // Por defecto, mostrar texto genérico
    return "Buscar o seleccionar sistema...";
  }, [nombreSistemaSeleccionado, dispositivo.sistema_nombre]);

  // ✅ Función para cargar tipos de sistemas
  const fetchTiposSistemas = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingSistemas(true);
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const response: TipoSistemaResponse = await TipoSistemaService.getTipoSistemas({
        page: page,
        size: 20,
        nombre: searchTerm,
        sortBy: "nombre",
        sortOrder: "asc"
      });

      const nuevosSistemas = response.data.data;

      if (resetData) {
        setTiposSistemas(nuevosSistemas);
        setPag(1);
      } else {
        setTiposSistemas(prev => [...prev, ...nuevosSistemas]);
        setPag(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMore(currentPage < totalPages);

    } catch (error) {
      console.error("Error al cargar tipos de sistemas:", error);
    } finally {
      setLoadingSistemas(false);
      setLoadingMore(false);
    }
  }, []);

  // ✅ Cargar datos iniciales
  useEffect(() => {
    fetchTiposSistemas(1, "", true);
  }, [fetchTiposSistemas]);

  // ✅ Handler para búsqueda
  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    fetchTiposSistemas(1, searchTerm, true);
  }, [fetchTiposSistemas]);

  // ✅ Handler para cargar más
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchTiposSistemas(pag + 1, search, false);
    }
  }, [fetchTiposSistemas, loadingMore, hasMore, pag, search]);

  const actualizarDiot = async (data: DiotFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setImeiError(null);
      setFieldErrors({});

      // Validar que haya un sistema seleccionado
      if (!data.id_tipo_sistema) {
        setError("id_tipo_sistema", {
          type: "manual",
          message: "El sistema es requerido"
        });
        return;
      }

      // Actualizar el DIOT
      await dispositivosService.patchDispositivo(dispositivo.uuid, {
        nombre: data.nombre,
        imei: data.imei,
        id_tipo_sistema: data.id_tipo_sistema,
      });

      // Finalizar
      triggerRefresh();
      onDiotEditado();

    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData: BackendError = error.response?.data;

        if (errorData.messages) {
          Object.entries(errorData.messages).forEach(([field, message]) => {
            if (field === "imei") {
              setImeiError(message);
            } else {
              setFieldErrors(prev => ({ ...prev, [field]: message }));
              setError(field as keyof DiotFormData, {
                type: "manual",
                message: message
              });
            }
          });
        } else {
          setServerError("Error al actualizar el DIOT. Por favor, intente nuevamente.");
        }
      } else {
        setServerError("Error de conexión. Por favor, intente nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: DiotFormData) => {
    actualizarDiot(data);
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    clearErrors(fieldName as keyof DiotFormData);
  };

  // ✅ Handler para cambio de sistema
  const handleSistemaChange = (value: string) => {
    setValue("id_tipo_sistema", value);
    clearFieldError("id_tipo_sistema");
    clearErrors("id_tipo_sistema");
  };

  // ✅ Handler para limpiar selección de sistema
  const handleClearSistema = () => {
    setValue("id_tipo_sistema", "");
    clearFieldError("id_tipo_sistema");
    clearErrors("id_tipo_sistema");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Sistema - Campo requerido */}
        <div className="space-y-2">
          <Label htmlFor="id_tipo_sistema" className="text-sm font-medium">
            Sistema *
          </Label>
          
          {loadingSistemas && pag === 1 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando sistemas...
            </div>
          ) : (
            <>
              <OptionInfinito
                // Datos
                data={tiposSistemas.map(sistema => ({
                  uuid: sistema.uuid,
                  nombre: sistema.nombre
                }))}
                value={sistemaValue}
                onChange={handleSistemaChange}
                
                // Control de paginación y carga
                onSearch={handleSearch}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={loadingMore}
                loading={loadingSistemas}
                
                // Configuración de UI - ¡Aquí está el cambio!
                placeholder={placeholderText}
              />
              
              {/* Input hidden para react-hook-form */}
              <input
                type="hidden"
                {...register("id_tipo_sistema", {
                  required: "El sistema es requerido"
                })}
              />
              
              {/* Mostrar errores de validación */}
              {(errors.id_tipo_sistema || fieldErrors.id_tipo_sistema) && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.id_tipo_sistema?.message || fieldErrors.id_tipo_sistema}
                </p>
              )}
            </>
          )}
          
          {/* Contador y botón para limpiar */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {tiposSistemas.length} sistemas cargados
            </p>
            
            {sistemaValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSistema}
                className="h-7 px-2 text-xs"
                disabled={isSubmitting}
              >
                Limpiar selección
              </Button>
            )}
          </div>
        </div>

        {/* Nombre - Campo requerido */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del DIOT *</Label>
          <Input
            id="nombre"
            type="text"
            placeholder="Ingrese el nombre del DIOT"
            {...register("nombre", {
              required: "El nombre del DIOT es requerido",
              minLength: {
                value: 2,
                message: "El nombre debe tener al menos 2 caracteres"
              },
              onChange: () => {
                clearFieldError("nombre");
                clearErrors("nombre");
              }
            })}
            disabled={isSubmitting}
          />
          {errors.nombre && (
            <p className="text-sm text-red-500">{errors.nombre.message}</p>
          )}
          {fieldErrors.nombre && !errors.nombre && (
            <p className="text-sm text-red-500">{fieldErrors.nombre}</p>
          )}
        </div>

        {/* IMEI - Campo requerido */}
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI *</Label>
          <Input
            id="imei"
            type="text"
            placeholder="Ingrese el IMEI del DIOT"
            {...register("imei", {
              required: "El IMEI es requerido",
              minLength: {
                value: 5,
                message: "El IMEI debe tener al menos 5 caracteres"
              },
              onChange: () => {
                setImeiError(null);
                clearErrors("imei");
              }
            })}
            disabled={isSubmitting}
          />
          {errors.imei && (
            <p className="text-sm text-red-500">{errors.imei.message}</p>
          )}
          {imeiError && !errors.imei && (
            <p className="text-sm text-red-500">{imeiError}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDiotEditado}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Actualizando...
            </>
          ) : (
            "Actualizar DIOT"
          )}
        </Button>
      </div>
    </form>
  );
}