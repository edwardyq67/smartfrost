// app/tipoSensor/components/TipoSensorAgregar.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { tipoSensorService, CreateTipoSensorData } from "@/lib/tipoSensor/UseTipoSensor";
import { useRefreshTableTipoSensores } from "@/store/tipoSensores/refresTableTipoSensor";
import { Input } from "@/components/ui/input";

interface TipoSensorAgregarProps {
  onTipoSensorCreado?: () => void;
}

export function TipoSensorAgregar({ onTipoSensorCreado }: TipoSensorAgregarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableTipoSensores();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTipoSensorData>({
    defaultValues: {
      nombre: "",
      uMed: "",
      imagen: ""
    }
  });

  const onSubmit = async (data: CreateTipoSensorData) => {
    setLoading(true);
    setError(null);

    try {
      const tipoSensorData: CreateTipoSensorData = {
        nombre: data.nombre,
        uMed: data.uMed,
        ...(data.imagen && { imagen: data.imagen }) // Solo incluir imagen si tiene valor
      };

      await tipoSensorService.createTipoSensor(tipoSensorData);
      reset();
      triggerRefresh();
      onTipoSensorCreado?.();
    } catch (err: any) {
      console.error("Error al crear tipo de sensor:", err);
      setError(err.response?.data?.message || "Error al crear el tipo de sensor");
    } finally {
      setLoading(false);
    }
  };

  return (        
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre del Tipo de Sensor *</Label>
        <Input
          id="nombre"
          {...register("nombre", { 
            required: "El nombre del tipo de sensor es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres"
            }
          })}
          placeholder="Ej: Temperatura, Humedad, Presión"
        />
        {errors.nombre && (
          <p className="text-sm text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      {/* Campo Unidad de Medida */}
      <div className="space-y-2">
        <Label htmlFor="uMed">Unidad de Medida *</Label>
        <Input
          id="uMed"
          {...register("uMed", { 
            required: "La unidad de medida es requerida",
            minLength: {
              value: 1,
              message: "La unidad de medida debe tener al menos 1 carácter"
            }
          })}
          placeholder="Ej: VAC, W, °C, %"
        />
        {errors.uMed && (
          <p className="text-sm text-red-500">{errors.uMed.message}</p>
        )}
      </div>

      {/* Campo Imagen (URL) 
      <div className="space-y-2">
        <Label htmlFor="imagen">URL de la Imagen (Opcional)</Label>
        <Input
          id="imagen"
          type="url"
          {...register("imagen", {
            pattern: {
              value: /^https?:\/\/.+\..+/,
              message: "Por favor ingresa una URL válida"
            }
          })}
          placeholder="Ej: https://ejemplo.com/imagen.jpg"
        />
        {errors.imagen && (
          <p className="text-sm text-red-500">{errors.imagen.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL opcional de una imagen representativa para el tipo de sensor
        </p>
      </div>*/}

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
          onClick={onTipoSensorCreado}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Tipo de Sensor"}
        </Button>
      </div>
    </form>
  );
}