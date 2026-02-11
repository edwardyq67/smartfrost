"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { actuadoresService, CreateActuadorData, ActuadorById } from "@/lib/actuadores/UseActuadores";
import { useRefreshTableActuadores } from "@/store/actuadores/refreshTableActuadores";
import { Input } from "@/components/ui/input";

interface ActuadoresEditarProps {
  actuador: string; // UUID del actuador
  onActuadorEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ActuadoresEditar({ 
  actuador, 
  onActuadorEditado,
  open,
  onOpenChange 
}: ActuadoresEditarProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actuadorData, setActuadorData] = useState<ActuadorById | null>(null);
  const [originalData, setOriginalData] = useState<CreateActuadorData | null>(null);
  const { triggerRefresh } = useRefreshTableActuadores();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateActuadorData & {
    installBoolean: boolean;
    controlBoolean: boolean;
    recoveryBoolean: boolean;
    localBoolean: boolean;
    habilitacionBoolean: boolean;
  }>({
    defaultValues: {
      id_tipo_actuador: "",
      id_daq: "",
      id_modbus: "",
      register: "",
      factor: "1",
      offset: "",
      value: "",
      funcion: "",
      installBoolean: false,
      controlBoolean: false,
      recoveryBoolean: false,
      localBoolean: false,
      habilitacionBoolean: false
    }
  });

  const currentData = watch();
  const watchInstall = watch("installBoolean");
  const watchControl = watch("controlBoolean");
  const watchRecovery = watch("recoveryBoolean");
  const watchLocal = watch("localBoolean");
  const watchHabilitacion = watch("habilitacionBoolean");

  // Cargar datos del actuador cuando se abre el diálogo
  useEffect(() => {
    if (open && actuador) {
      fetchActuadorData();
    }
  }, [open, actuador]);

  const fetchActuadorData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const response = await actuadoresService.getActuadorById(actuador);
      const data = response.data;
      setActuadorData(data);
      
      // Convertir strings "1"/"0" a booleanos
      const installBoolean = data.install === "1";
      const controlBoolean = data.control === "1";
      const recoveryBoolean = data.recovery === "1";
      const localBoolean = data.local === "1";
      const habilitacionBoolean = data.habilitacion === "1";

      // Guardar datos originales para comparar
      const original = {
        id_tipo_actuador: data.id_tipo_actuador,
        id_daq: data.id_daq || "",
        id_modbus: data.id_modbus,
        register: data.register,
        factor: data.factor, // Nota: en GET es "factor", en CREATE es "factor"
        offset: data.offset,
        value: data.value, // Nota: en GET es "setpoint_value", en CREATE es "value"
        funcion: data.funcion,
        install: installBoolean,
        control: controlBoolean,
        recovery: recoveryBoolean,
        local: localBoolean,
        habilitacion: habilitacionBoolean
      };
      setOriginalData(original);
      
      // Llenar el formulario con los datos existentes
      setValue("id_tipo_actuador", data.id_tipo_actuador);
      setValue("id_daq", data.id_daq || "");
      setValue("id_modbus", data.id_modbus);
      setValue("register", data.register);
      setValue("factor", data.factor);
      setValue("offset", data.offset);
      setValue("value", data.value);
      setValue("funcion", data.funcion);
      setValue("installBoolean", installBoolean);
      setValue("controlBoolean", controlBoolean);
      setValue("recoveryBoolean", recoveryBoolean);
      setValue("localBoolean", localBoolean);
      setValue("habilitacionBoolean", habilitacionBoolean);

    } catch (err: any) {
      console.error("Error al cargar actuador:", err);
      setError(err.response?.data?.message || "Error al cargar el actuador");
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: CreateActuadorData & {
    installBoolean: boolean;
    controlBoolean: boolean;
    recoveryBoolean: boolean;
    localBoolean: boolean;
    habilitacionBoolean: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: CreateActuadorData = {
        id_tipo_actuador: data.id_tipo_actuador,
        id_daq: data.id_daq,
        id_modbus: data.id_modbus,
        register: data.register,
        factor: data.factor,
        offset: data.offset,
        value: data.value,
        funcion: data.funcion,
        install: data.installBoolean,
        control: data.controlBoolean,
        recovery: data.recoveryBoolean,
        local: data.localBoolean,
        habilitacion: data.habilitacionBoolean
      };

      // Aquí necesitarías agregar el método updateActuador en tu servicio
       await actuadoresService.patchActuador(actuador, updateData);

      triggerRefresh();
      onActuadorEditado?.();
      onOpenChange?.(false);
    } catch (err: any) {
      console.error("Error al actualizar actuador:", err);
      setError(err.response?.data?.message || "Error al actualizar el actuador");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange?.(false);
    onActuadorEditado?.();
  };

  // Verificar si hay cambios
  const hasChanges = 
    currentData.id_tipo_actuador !== originalData?.id_tipo_actuador ||
    currentData.id_daq !== originalData?.id_daq ||
    currentData.id_modbus !== originalData?.id_modbus ||
    currentData.register !== originalData?.register ||
    currentData.factor !== originalData?.factor ||
    currentData.offset !== originalData?.offset ||
    currentData.value !== originalData?.value ||
    currentData.funcion !== originalData?.funcion ||
    currentData.installBoolean !== originalData?.install ||
    currentData.controlBoolean !== originalData?.control ||
    currentData.recoveryBoolean !== originalData?.recovery ||
    currentData.localBoolean !== originalData?.local ||
    currentData.habilitacionBoolean !== originalData?.habilitacion;

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Cargando datos del actuador...</div>
      </div>
    );
  }

  return (        
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Campos en dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna 1 */}
        <div className="space-y-4">
          {/* ID Tipo Actuador */}
          <div className="space-y-2">
            <Label htmlFor="id_tipo_actuador">ID Tipo Actuador</Label>
            <Input
              id="id_tipo_actuador"
              {...register("id_tipo_actuador")}
              placeholder="UUID del tipo de actuador"
              disabled={loading}
            />
          </div>

          {/* ID DAQ */}
          <div className="space-y-2">
            <Label htmlFor="id_daq">ID DAQ</Label>
            <Input
              id="id_daq"
              {...register("id_daq")}
              placeholder="UUID del DAQ"
              disabled={loading}
            />
          </div>

          {/* ID Modbus */}
          <div className="space-y-2">
            <Label htmlFor="id_modbus">ID Modbus</Label>
            <Input
              id="id_modbus"
              {...register("id_modbus")}
              placeholder="1"
              disabled={loading}
            />
          </div>

          {/* Register */}
          <div className="space-y-2">
            <Label htmlFor="register">Register *</Label>
            <Input
              id="register"
              {...register("register", {
                required: "El register es requerido"
              })}
              placeholder="60"
              disabled={loading}
            />
            {errors.register && (
              <p className="text-sm text-red-500">{errors.register.message}</p>
            )}
          </div>
        </div>

        {/* Columna 2 */}
        <div className="space-y-4">
          {/* Offset */}
          <div className="space-y-2">
            <Label htmlFor="offset">Offset</Label>
            <Input
              id="offset"
              {...register("offset")}
              placeholder="0"
              disabled={loading}
            />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              {...register("value")}
              placeholder="100"
              disabled={loading}
            />
          </div>

          {/* Función */}
          <div className="space-y-2">
            <Label htmlFor="funcion">Función</Label>
            <Input
              id="funcion"
              {...register("funcion")}
              placeholder="6"
              disabled={loading}
            />
          </div>

          {/* Factor */}
          <div className="space-y-2">
            <Label htmlFor="factor">Factor *</Label>
            <Input
              id="factor"
              {...register("factor", {
                required: "El factor es requerido"
              })}
              placeholder="1"
              disabled={loading}
            />
            {errors.factor && (
              <p className="text-sm text-red-500">{errors.factor.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        {/* Install */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 space-y-2">
          <Label htmlFor="install" className="mt-2">Install</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="install"
              checked={watchInstall}
              onCheckedChange={(checked) => setValue("installBoolean", checked)}
              disabled={loading}
            />
            <Label htmlFor="install" className="cursor-pointer">
              {watchInstall ? "Activado" : "Desactivado"}
            </Label>
          </div>
        </div>

        {/* Control */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 space-y-2">
          <Label className="mt-2" htmlFor="control">Control</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="control"
              checked={watchControl}
              onCheckedChange={(checked) => setValue("controlBoolean", checked)}
              disabled={loading}
            />
            <Label htmlFor="control" className="cursor-pointer">
              {watchControl ? "Activado" : "Desactivado"}
            </Label>
          </div>
        </div>

        {/* Recovery */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 space-y-2">
          <Label className="mt-2" htmlFor="recovery">Recovery</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="recovery"
              checked={watchRecovery}
              onCheckedChange={(checked) => setValue("recoveryBoolean", checked)}
              disabled={loading}
            />
            <Label htmlFor="recovery" className="cursor-pointer">
              {watchRecovery ? "Activado" : "Desactivado"}
            </Label>
          </div>
        </div>

        {/* Local */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 space-y-2">
          <Label className="mt-2" htmlFor="local">Local</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="local"
              checked={watchLocal}
              onCheckedChange={(checked) => setValue("localBoolean", checked)}
              disabled={loading}
            />
            <Label htmlFor="local" className="cursor-pointer">
              {watchLocal ? "Activado" : "Desactivado"}
            </Label>
          </div>
        </div>

        {/* Habilitación */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 space-y-2">
          <Label className="mt-2" htmlFor="habilitacion">Habilitación</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="habilitacion"
              checked={watchHabilitacion}
              onCheckedChange={(checked) => setValue("habilitacionBoolean", checked)}
              disabled={loading}
            />
            <Label htmlFor="habilitacion" className="cursor-pointer">
              {watchHabilitacion ? "Activado" : "Desactivado"}
            </Label>
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
      <div className="flex gap-3 pt-6">
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
          disabled={loading || !hasChanges}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}