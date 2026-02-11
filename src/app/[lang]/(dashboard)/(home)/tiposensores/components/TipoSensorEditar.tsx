// app/tipoSensor/components/TipoSensorEditar.tsx
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tipoSensorService, UpdateTipoSensorData, TipoSensor } from "@/lib/tipoSensor/UseTipoSensor";
import { useRefreshTableTipoSensores } from "@/store/tipoSensores/refresTableTipoSensor";

interface TipoSensorEditarProps {
  tipoSensor: TipoSensor;
  onTipoSensorEditado: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TipoSensorEditar({ 
  tipoSensor, 
  onTipoSensorEditado, 
  open, 
  onOpenChange 
}: TipoSensorEditarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableTipoSensores();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<UpdateTipoSensorData>({
    defaultValues: {
      nombre: tipoSensor.nombre,
      uMed: tipoSensor.uMed,
      imagen: tipoSensor.imagen
    }
  });

  // Resetear el formulario cuando cambie el tipoSensor o se abra el diálogo
  useEffect(() => {
    if (open && tipoSensor) {
      reset({
        nombre: tipoSensor.nombre,
        uMed: tipoSensor.uMed,
        imagen: tipoSensor.imagen
      });
      setError(null);
    }
  }, [open, tipoSensor, reset]);

  const onSubmit = async (data: UpdateTipoSensorData) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: UpdateTipoSensorData = {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.uMed && { uMed: data.uMed }),
        ...(data.imagen !== undefined && { imagen: data.imagen })
      };

      // Solo enviar la solicitud si hay cambios
      if (Object.keys(updateData).length > 0) {
        await tipoSensorService.updateTipoSensor(tipoSensor.uuid, updateData);
        triggerRefresh();
        onTipoSensorEditado();
        onOpenChange(false);
      } else {
        onOpenChange(false); // Cerrar sin cambios
      }
    } catch (err: any) {
      console.error("Error al actualizar tipo de sensor:", err);
      setError(err.response?.data?.message || "Error al actualizar el tipo de sensor");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setError(null);
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
          placeholder="Ej: https://ejemplo.com/imagen.jpg"
        />
        {errors.imagen && (
          <p className="text-sm text-red-500">{errors.imagen.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL de una imagen representativa para el tipo de sensor
        </p>
      </div>
*/}
      {/* Vista previa de la imagen actual */}
      {tipoSensor.imagen && (
        <div className="space-y-2">
          <Label>Vista previa de la imagen actual</Label>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={tipoSensor.imagen} 
                alt={tipoSensor.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground break-all">
                {tipoSensor.imagen}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional del tipo de sensor */}
      <div className="space-y-2 pt-2 border-t">
        <Label className="font-medium">Información del Tipo de Sensor</Label>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Creado:</span>
            <p className="text-xs">
              {new Date(tipoSensor.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Creado por:</span>
            <p className="text-xs">{tipoSensor.creador?.nombre || "Desconocido"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Identificador:</span>
            <p className="text-xs font-mono">{tipoSensor.identificador}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">UUID:</span>
            <p className="text-xs font-mono truncate">{tipoSensor.uuid}</p>
          </div>
        </div>
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
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}