"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { DaqService, CreateDaqData, DaqValidationError } from "@/lib/daq/UseDaq";
import { useRefreshTableDaq } from "@/store/daq/refreshTableDaq";
import { useState, useEffect, useCallback } from "react";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { userService } from "@/lib/usuarios/UseUsuarios";

interface DaqFormData {
  identificador: string;
  tipo: string;
  fecha_fabricacion: string;
  version: string;
  cant_sensores: string;
  responsable: string;
}

interface UserOption {
  uuid: string;
  nombre: string;
}

export function DaqCrear({ onDaqCreado }: { onDaqCreado?: () => void }) {
  const { triggerRefresh } = useRefreshTableDaq();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para usuarios (responsables)
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingMoreUsuarios, setLoadingMoreUsuarios] = useState(false);
  const [usuariosPag, setUsuariosPag] = useState(1);
  const [usuariosSearch, setUsuariosSearch] = useState("");
  const [hasMoreUsuarios, setHasMoreUsuarios] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
    clearErrors,
  } = useForm<DaqFormData>({
    defaultValues: {
      identificador: "",
      tipo: "",
      fecha_fabricacion: "",
      version: "",
      cant_sensores: "",
      responsable: ""
    }
  });

  const responsableValue = watch("responsable");

  // ✅ Función para cargar usuarios (responsables)
  const fetchUsuarios = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingUsuarios(true);
      } else {
        setLoadingMoreUsuarios(true);
      }

      const response = await userService.getUsers({
        page: page,
        size: 20,
        nombre: searchTerm,
        sortBy: "nombre",
        sortOrder: "asc"
      });

      const nuevosUsuarios = response.data.data.map((user: any) => ({
        uuid: user.uuid,
        nombre: `${user.nombre} (${user.usuario})`
      }));

      if (resetData) {
        setUsuarios(nuevosUsuarios);
        setUsuariosPag(1);
      } else {
        setUsuarios(prev => [...prev, ...nuevosUsuarios]);
        setUsuariosPag(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreUsuarios(currentPage < totalPages);

    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoadingUsuarios(false);
      setLoadingMoreUsuarios(false);
    }
  }, []);

  // ✅ Cargar usuarios iniciales
  useEffect(() => {
    fetchUsuarios(1, "", true);
  }, [fetchUsuarios]);

  // ✅ Handler para búsqueda de usuarios
  const handleSearchUsuarios = useCallback((searchTerm: string) => {
    setUsuariosSearch(searchTerm);
    fetchUsuarios(1, searchTerm, true);
  }, [fetchUsuarios]);

  // ✅ Handler para cargar más usuarios
  const handleLoadMoreUsuarios = useCallback(() => {
    if (!loadingMoreUsuarios && hasMoreUsuarios) {
      fetchUsuarios(usuariosPag + 1, usuariosSearch, false);
    }
  }, [fetchUsuarios, loadingMoreUsuarios, hasMoreUsuarios, usuariosPag, usuariosSearch]);

  const crearDaq = async (data: DaqFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setFieldErrors({});

      // Validar que haya un responsable seleccionado (opcional según tu API)
      if (!data.responsable.trim()) {
        // Si el responsable es opcional, puedes remover esta validación
        setFieldErrors(prev => ({ ...prev, responsable: "El responsable es requerido" }));
        return;
      }

      // Preparar datos para enviar al backend
      const daqData: CreateDaqData = {
        identificador: data.identificador.trim(),
        tipo: data.tipo.trim(),
        fecha_fabricacion: data.fecha_fabricacion.trim(),
        version: data.version.trim(),
        cant_sensores: data.cant_sensores.trim(),
        responsable: data.responsable.trim(),
        // Campos opcionales que pueden ser necesarios
        id_dispositivo: "", // Si necesitas asignar un dispositivo
        zonas: [], // Si necesitas asignar zonas
        ejeX: "0.5",
        ejeY: "0.5"
      };

      // Crear el DAQ
      await DaqService.createDaq(daqData);

      // Finalizar
      triggerRefresh();
      reset();
      onDaqCreado?.();

    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData: DaqValidationError = error.response?.data;

        if (errorData.messages) {
          Object.entries(errorData.messages).forEach(([field, message]) => {
            setFieldErrors(prev => ({ ...prev, [field]: message }));
          });
        } else {
          setServerError("Error al crear el DAQ. Por favor, intente nuevamente.");
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            "Error de conexión. Por favor, intente nuevamente.";
        setServerError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: DaqFormData) => {
    crearDaq(data);
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    clearErrors(fieldName as keyof DaqFormData);
  };

  // ✅ Handler para cambio de responsable
  const handleResponsableChange = (value: string) => {
    setValue("responsable", value);
    clearFieldError("responsable");
  };

  // ✅ Handler para limpiar selección de responsable
  const handleClearResponsable = () => {
    setValue("responsable", "");
    clearFieldError("responsable");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identificador - Campo requerido */}
        <div className="space-y-2">
          <Label htmlFor="identificador" className="text-sm font-medium">
            Identificador *
          </Label>
          <Input
            id="identificador"
            type="text"
            placeholder="Ingrese el identificador único"
            {...register("identificador", {
              required: "El identificador es requerido",
              minLength: {
                value: 2,
                message: "El identificador debe tener al menos 2 caracteres"
              },
              onChange: () => clearFieldError("identificador")
            })}
            disabled={isSubmitting}
          />
          {errors.identificador && (
            <p className="text-sm text-red-500">{errors.identificador.message}</p>
          )}
          {fieldErrors.identificador && !errors.identificador && (
            <p className="text-sm text-red-500">{fieldErrors.identificador}</p>
          )}
        </div>

        {/* Tipo - Campo requerido */}
        <div className="space-y-2">
          <Label htmlFor="tipo" className="text-sm font-medium">
            Tipo *
          </Label>
          <Input
            id="tipo"
            type="text"
            placeholder="Ej: Analógico, Digital, Mixto"
            {...register("tipo", {
              required: "El tipo es requerido",
              onChange: () => clearFieldError("tipo")
            })}
            disabled={isSubmitting}
          />
          {errors.tipo && (
            <p className="text-sm text-red-500">{errors.tipo.message}</p>
          )}
          {fieldErrors.tipo && !errors.tipo && (
            <p className="text-sm text-red-500">{fieldErrors.tipo}</p>
          )}
        </div>

        {/* Fecha de Fabricación */}
        <div className="space-y-2">
          <Label htmlFor="fecha_fabricacion" className="text-sm font-medium">
            Fecha de Fabricación
          </Label>
          <Input
            id="fecha_fabricacion"
            type="date"
            {...register("fecha_fabricacion", {
              onChange: () => clearFieldError("fecha_fabricacion")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.fecha_fabricacion && (
            <p className="text-sm text-red-500">{fieldErrors.fecha_fabricacion}</p>
          )}
        </div>

        {/* Versión */}
        <div className="space-y-2">
          <Label htmlFor="version" className="text-sm font-medium">
            Versión
          </Label>
          <Input
            id="version"
            type="text"
            placeholder="Ej: 1.0.0"
            {...register("version", {
              onChange: () => clearFieldError("version")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.version && (
            <p className="text-sm text-red-500">{fieldErrors.version}</p>
          )}
        </div>

        {/* Cantidad de Sensores */}
        <div className="space-y-2">
          <Label htmlFor="cant_sensores" className="text-sm font-medium">
            Cantidad de Sensores *
          </Label>
          <Input
            id="cant_sensores"
            type="number"
            min="0"
            placeholder="Ej: 8, 16, 32"
            {...register("cant_sensores", {
              required: "La cantidad de sensores es requerida",
              min: {
                value: 0,
                message: "La cantidad debe ser mayor o igual a 0"
              },
              onChange: () => clearFieldError("cant_sensores")
            })}
            disabled={isSubmitting}
          />
          {errors.cant_sensores && (
            <p className="text-sm text-red-500">{errors.cant_sensores.message}</p>
          )}
          {fieldErrors.cant_sensores && !errors.cant_sensores && (
            <p className="text-sm text-red-500">{fieldErrors.cant_sensores}</p>
          )}
        </div>

        {/* Responsable - OptionInfinito */}
        <div className="space-y-2">
          <Label htmlFor="responsable" className="text-sm font-medium">
            Responsable
          </Label>
          {loadingUsuarios && usuariosPag === 1 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando responsables...
            </div>
          ) : (
            <>
              <OptionInfinito
                data={usuarios}
                value={responsableValue}
                onChange={handleResponsableChange}
                onSearch={handleSearchUsuarios}
                onLoadMore={handleLoadMoreUsuarios}
                hasMore={hasMoreUsuarios}
                isLoading={loadingMoreUsuarios}
                loading={loadingUsuarios}
                placeholder="Buscar o seleccionar responsable..."
              />
              
              {fieldErrors.responsable && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.responsable}</p>
              )}
            </>
          )}
          
          {/* Contador y botón para limpiar */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {usuarios.length} usuarios cargados
            </p>
            
            {responsableValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearResponsable}
                className="h-7 px-2 text-xs"
                disabled={isSubmitting}
              >
                Limpiar selección
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onDaqCreado}
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
            "Crear DAQ"
          )}
        </Button>
      </div>
    </form>
  );
}