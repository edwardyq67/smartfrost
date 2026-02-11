"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TipoSistemaService, CreateTipoSistemaData } from "@/lib/tipoSistema/UseTipoSistema";
import { useRefreshTableTipoSistema } from "@/store/tiposistema/refresTableTiposistema"; 
import { Input } from "@/components/ui/input";

interface TipoSistemaAgregarProps {
  onTipoSistemaCreado?: () => void;
}

export function TipoSistemaAgregar({ onTipoSistemaCreado }: TipoSistemaAgregarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableTipoSistema();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTipoSistemaData>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      imagen: ""
    }
  });

  const onSubmit = async (data: CreateTipoSistemaData) => {
    setLoading(true);
    setError(null);

    try {
      await TipoSistemaService.createTipoSistema(data);
      reset();
      triggerRefresh();
      onTipoSistemaCreado?.();
    } catch (err: any) {
      console.error("Error al crear tipo de sistema:", err);
      setError(err.response?.data?.message || "Error al crear el tipo de sistema");
    } finally {
      setLoading(false);
    }
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
          onClick={onTipoSistemaCreado}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Tipo de Sistema"}
        </Button>
      </div>
    </form>
  );
}