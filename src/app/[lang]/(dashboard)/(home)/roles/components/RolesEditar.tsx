"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importar Input
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Rol, UpdateRolData, rolesService } from "@/lib/roles/UseRoles";

interface RolesEditarProps {
  rol: Rol;
  onRolEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Interface para el formulario
interface RolFormData {
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export function RolesEditar({ 
  rol, 
  onRolEditado, 
  open, 
  onOpenChange 
}: RolesEditarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<RolFormData>({
    defaultValues: {
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado: rol.estado === "1"
    }
  });

  // Actualizar formulario cuando cambia el rol
  useEffect(() => {
    if (rol) {
      reset({
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        estado: rol.estado === "1"
      });
    }
  }, [rol, reset]);

  const estado = watch("estado");

  const onSubmit = async (data: RolFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Preparar datos para la API
      const rolData: UpdateRolData = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado ? "1" : "0"
      };

      // Llamar a la API para actualizar el rol
      await rolesService.updateRol(rol.uuid, rolData);
      
      // Ejecutar callback si existe
      onRolEditado?.();
      
      // Cerrar el diálogo
      if (onOpenChange) {
        onOpenChange(false);
      }
      
    } catch (err: any) {
      console.error("Error al actualizar rol:", err);
      setError(err.response?.data?.message || "Error al actualizar el rol");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (        
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Campo Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre del Rol *</Label>
        <Input
          id="nombre"
          {...register("nombre", { 
            required: "El nombre del rol es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres"
            }
          })}
          placeholder="Ej: Administrador, Editor, Usuario"
        />
        {errors.nombre && (
          <p className="text-sm text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      {/* Campo Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          {...register("descripcion")}
          placeholder="Describe las funciones de este rol"
        />
      </div>

      {/* Campo Estado */}
      <div className="flex items-center justify-between space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="estado"
            checked={estado}
            onCheckedChange={(checked) => setValue("estado", checked)}
          />
          <Label htmlFor="estado" className="cursor-pointer">
            {estado ? "Activo" : "Inactivo"}
          </Label>
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
          {loading ? "Actualizando..." : "Actualizar Rol"}
        </Button>
      </div>
    </form>
  );
}