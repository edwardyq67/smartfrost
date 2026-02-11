"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { dispositivosService, CreateDispositivoData } from "@/lib/dispositivos/UseDispositivos";
import { useRefreshTableDispositivos } from "@/store/dispositivos/refreshTableDispositivos";
import { useState, useEffect } from "react";
import { useEmpresaStore } from "@/store/empresas/dataStoreEmpresa";
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
  };
}

export function DiotCrear({ onDiotCreado }: { onDiotCreado?: () => void }) {
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
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm<DiotFormData>({
    defaultValues: {
      nombre: "",
      imei: "",
      id_tipo_sistema: ""
    }
  });

  const { mapaSeleccionada } = useEmpresaStore();
  const sistemaValue = watch("id_tipo_sistema");

  const fetchTiposSistemas = async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingSistemas(true);
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const response: TipoSistemaResponse = await TipoSistemaService.getTipoSistemas({
        page: page,
        size: 10,
        nombre: searchTerm
      });

      const nuevosSistemas = response.data.data;

      if (resetData) {
        setTiposSistemas(nuevosSistemas);
        setPag(1);
      } else {
        setTiposSistemas(prev => [...prev, ...nuevosSistemas]);
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
  };

  useEffect(() => {
    fetchTiposSistemas(1, "", true);
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchTiposSistemas(1, searchTerm, true);
  };

  const handleLoadMore = () => {
    if (!loadingSistemas && !loadingMore && hasMore) {
      const nextPage = pag + 1;
      setPag(nextPage);
      fetchTiposSistemas(nextPage, search, false);
    }
  };

  useEffect(() => {
    if (mapaSeleccionada?.uuid) {
      // Solo para referencia, no lo asignamos al formulario ya que no es requerido
    }
  }, [mapaSeleccionada]);

  const crearDiot = async (data: DiotFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setImeiError(null);
      setFieldErrors({});

      // Validar que haya un sistema seleccionado
      if (!data.id_tipo_sistema) {
        setFieldErrors(prev => ({ ...prev, id_tipo_sistema: "El sistema es requerido" }));
        return;
      }

      // Preparar datos para enviar al backend
      const diotData: CreateDispositivoData = {
        nombre: data.nombre,
        imei: data.imei,
        id_tipo_sistema: data.id_tipo_sistema,
        id_mapa: mapaSeleccionada?.uuid || "", // Opcional, vacío si no hay mapa seleccionado
        lan: "",
        wan: "",
        ejeX: "0.5",
        ejeY: "0.5",
      };

      // Crear el DIOT
      await dispositivosService.createDispositivo(diotData);

      // Finalizar
      triggerRefresh();
      reset();
      onDiotCreado?.();

    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData: BackendError = error.response?.data;

        if (errorData.messages) {
          Object.entries(errorData.messages).forEach(([field, message]) => {
            if (field === "imei") {
              setImeiError(message);
            } else {
              setFieldErrors(prev => ({ ...prev, [field]: message }));
            }
          });
        } else {
          setServerError("Error al crear el DIOT. Por favor, intente nuevamente.");
        }
      } else {
        setServerError("Error de conexión. Por favor, intente nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: DiotFormData) => {
    crearDiot(data);
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    clearErrors(fieldName as any);
  };

  const handleSistemaChange = (value: string) => {
    setValue("id_tipo_sistema", value);
    clearFieldError("id_tipo_sistema");
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando sistemas...
            </div>
          ) : (
            <>
              <OptionInfinito
                data={tiposSistemas.map(sistema => ({
                  uuid: sistema.uuid,
                  nombre: sistema.nombre
                }))}
                value={sistemaValue}
                onChange={handleSistemaChange}
                onSearch={handleSearch}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={loadingMore}
                placeholder="Seleccione un sistema..."
                required
              />
              {fieldErrors.id_tipo_sistema && (
                <p className="text-sm text-red-500">{fieldErrors.id_tipo_sistema}</p>
              )}
            </>
          )}
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
              onChange: () => clearFieldError("nombre")
            })}
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
          onClick={onDiotCreado}
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
              Creando...
            </>
          ) : (
            "Crear DIOT"
          )}
        </Button>
      </div>
    </form>
  );
}