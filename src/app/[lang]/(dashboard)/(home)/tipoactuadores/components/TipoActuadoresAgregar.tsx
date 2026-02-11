"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tipoActuadoresService, CreateTipoActuadorData } from "@/lib/tipoActuadores/UseTipoActuadores";
import { useRefreshTableTipoActuadores } from "@/store/tipoActuadores/refreshTableTipoActuadores";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";

interface TipoActuadoresAgregarProps {
  onTipoActuadorCreado?: () => void;
}

export function TipoActuadoresAgregar({ onTipoActuadorCreado }: TipoActuadoresAgregarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableTipoActuadores();
  const { user } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateTipoActuadorData>({
    defaultValues: {
      nombre: "",
      codigo: "",
      descripcion: "",
      id_user: user?.id || "" // Valor por defecto
    }
  });

  // Actualizar el valor de id_user cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      setValue("id_user", user.id);
    }
  }, [user, setValue]);

  const onSubmit = async (data: CreateTipoActuadorData) => {
    setLoading(true);
    setError(null);

    try {
      // Asegurarnos de que id_user esté incluido
      const tipoActuadorData: CreateTipoActuadorData = {
        nombre: data.nombre,
        codigo: data.codigo,
        id_user: data.id_user, // Incluir id_user
        ...(data.descripcion && { descripcion: data.descripcion })
      };

      // Validar que id_user no esté vacío
      if (!tipoActuadorData.id_user) {
        throw new Error("No se pudo identificar al usuario");
      }

      await tipoActuadoresService.createTipoActuador(tipoActuadorData);
      reset({
        nombre: "",
        codigo: "",
        descripcion: "",
        id_user: user?.id || "" // Resetear con el usuario actual
      });
      triggerRefresh();
      onTipoActuadorCreado?.();
    } catch (err: any) {
      console.error("Error al crear tipo de actuador:", err);
      setError(err.response?.data?.message || err.message || "Error al crear el tipo de actuador");
    } finally {
      setLoading(false);
    }
  };

  return (        
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo oculto para id_user */}
      <input type="hidden" {...register("id_user", { required: true })} />

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
          onClick={onTipoActuadorCreado}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading || !user?.id} // Deshabilitar si no hay usuario
        >
          {loading ? "Creando..." : "Crear Tipo de Actuador"}
        </Button>
      </div>
    </form>
  );
}