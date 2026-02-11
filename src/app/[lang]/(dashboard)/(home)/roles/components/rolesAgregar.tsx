"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { rolesService, CreateRolData } from "@/lib/roles/UseRoles";
import { useRefreshTableRoles } from "@/store/roles/refreshTableRoles";
import { Input } from "@/components/ui/input";

interface RolesAgregarProps {
  onRolCreado?: () => void;
}

export function RolesAgregar({ onRolCreado }: RolesAgregarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefreshTableRoles();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CreateRolData & { estadoBoolean: boolean }>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      estadoBoolean: true
    }
  });

  const estadoBoolean = watch("estadoBoolean");

const onSubmit = async (data: CreateRolData & { estadoBoolean: boolean }) => {
  setLoading(true);
  setError(null);

  try {
    const rolData: CreateRolData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estadoBoolean ? "1" : "0"
    };

    await rolesService.createRol(rolData);
    reset();
     triggerRefresh();
    onRolCreado?.();
  } catch (err: any) {
    console.error("Error al crear rol:", err);
    setError(err.response?.data?.message || "Error al crear el rol");
  } finally {
    setLoading(false);
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
            checked={estadoBoolean}
            onCheckedChange={(checked) => setValue("estadoBoolean", checked)}
          />
          <Label htmlFor="estado" className="cursor-pointer">
            {estadoBoolean ? "Activo" : "Inactivo"}
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
          onClick={onRolCreado}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Rol"}
        </Button>
      </div>
    </form>
  );
}