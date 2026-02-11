"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TipoSistemaService, TipoSistema, UpdateTipoSistemaData } from "@/lib/tipoSistema/UseTipoSistema";
import { useRefreshTableTipoSistema } from "@/store/tiposistema/refresTableTiposistema";
import { Input } from "@/components/ui/input";

interface TiposSistemaEditarProps {
  tipoSistema: TipoSistema | null;
  onTipoSistemaEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TiposSistemaEditar({ 
  tipoSistema, 
  onTipoSistemaEditado,
  open,
  onOpenChange 
}: TiposSistemaEditarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableTipoSistema();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<UpdateTipoSistemaData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      imagen: ""
    }
  });

  // Resetear el formulario cuando cambia el tipoSistema o se abre/cierra el diálogo
  useEffect(() => {
    if (tipoSistema && open) {
      reset({
        nombre: tipoSistema.nombre || "",
        descripcion: tipoSistema.descripcion || "",
        imagen: tipoSistema.imagen || ""
      });
      setError(null);
    }
  }, [tipoSistema, open, reset]);

  const onSubmit = async (data: UpdateTipoSistemaData) => {
    if (!tipoSistema?.id) {
      setError("No se encontró el ID del tipo de sistema");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filtrar solo los campos que han cambiado
      const updatedData: UpdateTipoSistemaData = {};
      
      if (data.nombre !== tipoSistema.nombre) {
        updatedData.nombre = data.nombre;
      }
      if (data.descripcion !== tipoSistema.descripcion) {
        updatedData.descripcion = data.descripcion;
      }
      if (data.imagen !== tipoSistema.imagen) {
        updatedData.imagen = data.imagen;
      }

      // Solo hacer la petición si hay campos cambiados
      if (Object.keys(updatedData).length > 0) {
        await TipoSistemaService.updateTipoSistema(tipoSistema.uuid, updatedData);
        triggerRefresh();
        onTipoSistemaEditado?.();
        onOpenChange?.(false);
      } else {
        // Si no hay cambios, simplemente cerrar el diálogo
        onOpenChange?.(false);
      }
    } catch (err: any) {
      console.error("Error al actualizar tipo de sistema:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.description || 
        "Error al actualizar el tipo de sistema"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError(null);
    onOpenChange?.(false);
  };

  return (        
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre del Tipo de Sistema *</Label>
        <Input
          id="nombre"
          {...register("nombre", { 
            required: "El nombre del tipo de sistema es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres"
            }
          })}
          placeholder="Ej: Sistema de Monitoreo Ambiental, Sistema de Refrigeración"
        />
        {errors.nombre && (
          <p className="text-sm text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      {/* Campo Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          {...register("descripcion")}
          placeholder="Describe las características y funciones de este tipo de sistema"
          rows={3}
        />
      </div>

      {/* Campo Imagen */}
      <div className="space-y-2">
        <Label htmlFor="imagen">URL de la Imagen</Label>
        <Input
          id="imagen"
          type="url"
          {...register("imagen", {
            pattern: {
              value: /^https?:\/\/.+\..+/,
              message: "Por favor ingresa una URL válida"
            }
          })}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
        {errors.imagen && (
          <p className="text-sm text-red-500">{errors.imagen.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Opcional: URL de una imagen representativa del tipo de sistema
        </p>
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
          disabled={loading || !isDirty}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}