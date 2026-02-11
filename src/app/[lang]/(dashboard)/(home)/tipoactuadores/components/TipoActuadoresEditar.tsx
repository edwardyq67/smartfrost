"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tipoActuadoresService, CreateTipoActuadorData, TipoActuador, UpdateTipoActuadorData } from "@/lib/tipoActuadores/UseTipoActuadores";
import { useRefreshTableTipoActuadores } from "@/store/tipoActuadores/refreshTableTipoActuadores";
import { useAuthStore } from "@/store/auth.store";

interface TipoActuadoresEditarProps {
  tipoActuador: string; // UUID del tipo de actuador
  onTipoActuadorEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TipoActuadoresEditar({
  tipoActuador,
  onTipoActuadorEditado,
  open,
  onOpenChange
}: TipoActuadoresEditarProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoActuadorData, setTipoActuadorData] = useState<TipoActuador | null>(null);
  const [originalData, setOriginalData] = useState<CreateTipoActuadorData | null>(null);
  const { triggerRefresh } = useRefreshTableTipoActuadores();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateTipoActuadorData>({
    defaultValues: {
      nombre: "",
      codigo: "",
      descripcion: "",
      id_user: user?.id || ""
    }
  });

  const currentData = watch();

  // Cargar datos del tipo de actuador cuando se abre el diálogo
  useEffect(() => {
    if (open && tipoActuador) {
      fetchTipoActuadorData();
    }
  }, [open, tipoActuador]);

  // Actualizar id_user cuando el usuario cambia
  useEffect(() => {
    if (user?.id) {
      setValue("id_user", user.id);
    }
  }, [user, setValue]);

  const fetchTipoActuadorData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const response = await tipoActuadoresService.getTipoActuadorById(tipoActuador);
      setTipoActuadorData(response.data);

      // Guardar datos originales para comparar
      const original = {
        nombre: response.data.nombre,
        codigo: response.data.codigo,
        descripcion: response.data.descripcion || "",
        id_user: user?.id || "" // Incluir id_user en datos originales
      };
      setOriginalData(original);

      // Llenar el formulario con los datos existentes
      setValue("nombre", response.data.nombre);
      setValue("codigo", response.data.codigo);
      setValue("descripcion", response.data.descripcion || "");
      setValue("id_user", user?.id || "");
    } catch (err: any) {
      console.error("Error al cargar tipo de actuador:", err);
      setError(err.response?.data?.message || "Error al cargar el tipo de actuador");
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: CreateTipoActuadorData) => {
    setLoading(true);
    setError(null);

    try {
      // SOLUCIÓN: Inicializar con id_user obligatorio
      const updateData: UpdateTipoActuadorData = {
        id_user: data.id_user // id_user es obligatorio, debe estar desde el inicio
      };

      // Solo incluir campos que han cambiado
      if (data.nombre !== originalData?.nombre) {
        updateData.nombre = data.nombre;
      }

      if (data.codigo !== originalData?.codigo) {
        updateData.codigo = data.codigo;
      }

      if (data.descripcion !== originalData?.descripcion) {
        updateData.descripcion = data.descripcion;
      }

      // Si no hay cambios (solo id_user es igual), mostrar mensaje y salir
      const hasFieldChanges =
        data.nombre !== originalData?.nombre ||
        data.codigo !== originalData?.codigo ||
        data.descripcion !== originalData?.descripcion;

      if (!hasFieldChanges && data.id_user === originalData?.id_user) {
        setError("No se detectaron cambios para actualizar");
        setLoading(false);
        return;
      }

      await tipoActuadoresService.updateTipoActuador(tipoActuador, updateData);

      triggerRefresh();
      onTipoActuadorEditado?.();
      onOpenChange?.(false);
    } catch (err: any) {
      console.error("Error al actualizar tipo de actuador:", err);
      setError(err.response?.data?.message || "Error al actualizar el tipo de actuador");
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    reset({
      nombre: "",
      codigo: "",
      descripcion: "",
      id_user: user?.id || ""
    });
    onOpenChange?.(false);
    onTipoActuadorEditado?.();
  };

  // Verificar si hay cambios
  const hasChanges =
    currentData.nombre !== originalData?.nombre ||
    currentData.codigo !== originalData?.codigo ||
    currentData.descripcion !== originalData?.descripcion ||
    currentData.id_user !== originalData?.id_user;

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Cargando datos del tipo de actuador...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo oculto para id_user */}
      <input
        type="hidden"
        {...register("id_user", { required: true })}
      />

      {/* Campo Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre del Tipo de Actuador *</Label>
        <Input
          id="nombre"
          {...register("nombre", {
            required: "El nombre del tipo de actuador es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres"
            }
          })}
          placeholder="Ej: Válvula Solenoide, Motor de Pasos"
          disabled={loading}
        />
        {errors.nombre && (
          <p className="text-sm text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      {/* Campo Código */}
      <div className="space-y-2">
        <Label htmlFor="codigo">Código *</Label>
        <Input
          id="codigo"
          {...register("codigo", {
            required: "El código es requerido"
          })}
          placeholder="Ej: SOLENOIDE, MOTOR_PASOS"
          disabled={loading}
        />
        {errors.codigo && (
          <p className="text-sm text-red-500">{errors.codigo.message}</p>
        )}
      </div>

      {/* Campo Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          {...register("descripcion")}
          placeholder="Describe las características y función de este tipo de actuador"
          rows={3}
          disabled={loading}
        />
        {errors.descripcion && (
          <p className="text-sm text-red-500">{errors.descripcion.message}</p>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading || !hasChanges || !user?.id}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}