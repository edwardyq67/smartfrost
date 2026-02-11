"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { sensoresService, patchSensorData } from "@/lib/sensores/UseSensores";
import { useState, useEffect, useCallback } from "react";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { tipoSensorService } from "@/lib/tipoSensor/UseTipoSensor";
import { useRefreshTableSensores } from "@/store/sensores/refreshTableSensores";

interface SensorFormData {
  id_tipo_sensor: string;
  registro: string;
  funcion: string;
  offset: string;
  imei: string;
  identificador: string;
  maximo: string;
  minimo: string;
  control: string;
}

interface TipoSensorOption {
  uuid: string;
  nombre: string;
}

interface SensorEditarProps {
  sensorUuid: string;
  onSensorEditado: () => void;
}

export function SensorEditar({ sensorUuid, onSensorEditado }: SensorEditarProps) {
  const { triggerRefresh } = useRefreshTableSensores();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSensor, setLoadingSensor] = useState(true);

  // Estados para tipos de sensor
  const [tiposSensor, setTiposSensor] = useState<TipoSensorOption[]>([]);
  const [loadingTiposSensor, setLoadingTiposSensor] = useState(true);
  const [loadingMoreTiposSensor, setLoadingMoreTiposSensor] = useState(false);
  const [tiposSensorPag, setTiposSensorPag] = useState(1);
  const [tiposSensorSearch, setTiposSensorSearch] = useState("");
  const [hasMoreTiposSensor, setHasMoreTiposSensor] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
    clearErrors,
  } = useForm<SensorFormData>({
    defaultValues: {
      id_tipo_sensor: "",
      registro: "",
      funcion: "",
      offset: "",
      imei: "",
      identificador: "",
      maximo: "",
      minimo: "",
      control: ""
    }
  });

  const tipoSensorValue = watch("id_tipo_sensor");
  const maximoValue = watch("maximo");
  const minimoValue = watch("minimo");

  // ✅ Validar que máximo > mínimo
  const validateMaximoMinimo = useCallback(() => {
    const maximo = parseFloat(maximoValue);
    const minimo = parseFloat(minimoValue);

    if (!isNaN(maximo) && !isNaN(minimo) && maximo <= minimo) {
      setFieldErrors(prev => ({
        ...prev,
        maximo: "El valor máximo debe ser mayor que el mínimo",
        minimo: "El valor mínimo debe ser menor que el máximo"
      }));
      return false;
    }

    // Limpiar errores si es válido
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.maximo;
      delete newErrors.minimo;
      return newErrors;
    });
    return true;
  }, [maximoValue, minimoValue]);

  // ✅ Función para cargar tipos de sensor
  const fetchTiposSensor = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingTiposSensor(true);
      } else {
        setLoadingMoreTiposSensor(true);
      }

      const response = await tipoSensorService.getTipoSensores({
        page: page,
        size: 20,
        nombre: searchTerm,
        sortBy: "nombre",
        sortOrder: "asc"
      });

      const nuevosTipos = response.data.data.map((tipo: any) => ({
        uuid: tipo.uuid,
        nombre: tipo.nombre
      }));

      if (resetData) {
        setTiposSensor(nuevosTipos);
        setTiposSensorPag(1);
      } else {
        setTiposSensor(prev => [...prev, ...nuevosTipos]);
        setTiposSensorPag(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreTiposSensor(currentPage < totalPages);

    } catch (error) {
      console.error("Error al cargar tipos de sensor:", error);
    } finally {
      setLoadingTiposSensor(false);
      setLoadingMoreTiposSensor(false);
    }
  }, []);

  // ✅ Función para cargar datos del sensor por UUID
  const fetchSensorData = useCallback(async () => {
    try {
      setLoadingSensor(true);
      const response = await sensoresService.getSensorById(sensorUuid);

      if (response.status === 200) {
        const sensor = response.data;

        // ✅ SOLO los campos que necesitamos del formulario
        setValue("id_tipo_sensor", sensor.tipo_sensor?.uuid || "");
        setValue("registro", sensor.registro || "0");
        setValue("funcion", sensor.funcion?.toString() || "6"); // Del JSON: "funcion": 6
        setValue("offset", sensor.offset || "3");
        setValue("imei", sensor.imei || "");
        setValue("identificador", sensor.identificador || "");
        setValue("maximo", sensor.maximo || "52");
        setValue("minimo", sensor.minimo || "2");
        setValue("control", sensor.control?.toString() || "1");
      } else {
        setServerError("Error al cargar datos del sensor");
      }
    } catch (error) {
      console.error("Error al cargar sensor:", error);
      setServerError("Error al cargar datos del sensor");
    } finally {
      setLoadingSensor(false);
    }
  }, [sensorUuid, setValue]);

  // ✅ Cargar tipos de sensor iniciales
  useEffect(() => {
    fetchTiposSensor(1, "", true);
  }, [fetchTiposSensor]);

  // ✅ Cargar datos del sensor cuando cambia el UUID
  useEffect(() => {
    if (sensorUuid) {
      fetchSensorData();
    }
  }, [sensorUuid, fetchSensorData]);

  // ✅ Validar máximo vs mínimo cuando cambian
  useEffect(() => {
    if (maximoValue || minimoValue) {
      validateMaximoMinimo();
    }
  }, [maximoValue, minimoValue, validateMaximoMinimo]);

  // ✅ Handler para búsqueda de tipos de sensor
  const handleSearchTiposSensor = useCallback((searchTerm: string) => {
    setTiposSensorSearch(searchTerm);
    fetchTiposSensor(1, searchTerm, true);
  }, [fetchTiposSensor]);

  // ✅ Handler para cargar más tipos de sensor
  const handleLoadMoreTiposSensor = useCallback(() => {
    if (!loadingMoreTiposSensor && hasMoreTiposSensor) {
      fetchTiposSensor(tiposSensorPag + 1, tiposSensorSearch, false);
    }
  }, [fetchTiposSensor, loadingMoreTiposSensor, hasMoreTiposSensor, tiposSensorPag, tiposSensorSearch]);

  const actualizarSensor = async (data: SensorFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setFieldErrors({});

      // Validar que haya un tipo de sensor seleccionado
      if (!data.id_tipo_sensor.trim()) {
        setFieldErrors(prev => ({ ...prev, id_tipo_sensor: "El tipo de sensor es requerido" }));
        return;
      }

      // Validar que máximo > mínimo
      const maximo = parseFloat(data.maximo);
      const minimo = parseFloat(data.minimo);
      if (!isNaN(maximo) && !isNaN(minimo) && maximo <= minimo) {
        setFieldErrors(prev => ({
          ...prev,
          maximo: "El valor máximo debe ser mayor que el mínimo",
          minimo: "El valor mínimo debe ser menor que el máximo"
        }));
        return;
      }

      // ✅ Preparar datos para enviar al backend - SOLO CAMPOS OBLIGATORIOS
      const sensorData: patchSensorData = {
        id_tipo_sensor: data.id_tipo_sensor.trim(),
        registro: data.registro.trim(),
        funcion: parseInt(data.funcion) || 6,
        offset: data.offset.trim(),
        control: parseInt(data.control) || 1,
        maximo: maximo,
        minimo: minimo
      };

      // Actualizar el sensor
      await sensoresService.patchSensor(sensorUuid, sensorData);

      // Finalizar
      triggerRefresh();
      onSensorEditado?.();

    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response?.data;

        if (errorData.messages) {
          Object.entries(errorData.messages).forEach(([field, message]) => {
            // Asegurar que message sea string
            if (typeof message === 'string') {
              setFieldErrors(prev => ({ ...prev, [field]: message }));
            } else if (Array.isArray(message) && message.length > 0 && typeof message[0] === 'string') {
              // Si es un array de strings, toma el primero
              setFieldErrors(prev => ({ ...prev, [field]: message[0] }));
            } else {
              // Convertir a string si es otro tipo
              setFieldErrors(prev => ({ ...prev, [field]: String(message) }));
            }
          });
        } else {
          setServerError("Error al actualizar el sensor. Por favor, intente nuevamente.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: SensorFormData) => {
    actualizarSensor(data);
  };

  // ✅ Función para limpiar errores de campo
  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    clearErrors(fieldName as keyof SensorFormData);
  };

  // ✅ Handler para cambio de tipo de sensor
  const handleTipoSensorChange = (value: string) => {
    setValue("id_tipo_sensor", value);
    clearFieldError("id_tipo_sensor");
  };

  // ✅ Handler para limpiar selección de tipo de sensor
  const handleClearTipoSensor = () => {
    setValue("id_tipo_sensor", "");
    clearFieldError("id_tipo_sensor");
  };

  // ✅ Handler para validar máximo vs mínimo
  const handleMaximoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFieldError("maximo");
    validateMaximoMinimo();
  };

  const handleMinimoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFieldError("minimo");
    validateMaximoMinimo();
  };

  if (loadingSensor) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando datos del sensor...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identificador */}
        <div className="space-y-2">
          <Label htmlFor="identificador" className="text-sm font-medium">
            Identificador
          </Label>
          <Input
            id="identificador"
            type="text"
            placeholder="Identificador del sensor"
            {...register("identificador", {
              onChange: () => clearFieldError("identificador")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.identificador && (
            <p className="text-sm text-red-500">{fieldErrors.identificador}</p>
          )}
        </div>

        {/* IMEI */}
        <div className="space-y-2">
          <Label htmlFor="imei" className="text-sm font-medium">
            IMEI
          </Label>
          <Input
            id="imei"
            type="text"
            placeholder="Ingrese el IMEI del sensor"
            {...register("imei", {
              onChange: () => clearFieldError("imei")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.imei && (
            <p className="text-sm text-red-500">{fieldErrors.imei}</p>
          )}
        </div>

        {/* Tipo de Sensor - OptionInfinito */}
        <div className="space-y-2">
          <Label htmlFor="id_tipo_sensor" className="text-sm font-medium">
            Tipo de Sensor
          </Label>
          {loadingTiposSensor && tiposSensorPag === 1 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tipos de sensor...
            </div>
          ) : (
            <>
              <OptionInfinito
                data={tiposSensor}
                value={tipoSensorValue}
                onChange={handleTipoSensorChange}
                onSearch={handleSearchTiposSensor}
                onLoadMore={handleLoadMoreTiposSensor}
                hasMore={hasMoreTiposSensor}
                isLoading={loadingMoreTiposSensor}
                loading={loadingTiposSensor}
                placeholder="Buscar o seleccionar tipo de sensor..."
              />

              {fieldErrors.id_tipo_sensor && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.id_tipo_sensor}</p>
              )}
            </>
          )}

          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {tiposSensor.length} tipos cargados
            </p>

            {tipoSensorValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearTipoSensor}
                className="h-7 px-2 text-xs"
                disabled={isSubmitting}
              >
                Limpiar selección
              </Button>
            )}
          </div>
        </div>

        {/* Registro */}
        <div className="space-y-2">
          <Label htmlFor="registro" className="text-sm font-medium">
            Registro
          </Label>
          <Input
            id="registro"
            type="text"
            placeholder="Número de registro"
            {...register("registro", {
              onChange: () => clearFieldError("registro")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.registro && (
            <p className="text-sm text-red-500">{fieldErrors.registro}</p>
          )}
        </div>

        {/* Mínimo */}
        <div className="space-y-2">
          <Label htmlFor="minimo" className="text-sm font-medium">
            Valor Mínimo
          </Label>
          <Input
            id="minimo"
            type="number"
            step="0.01"
            placeholder="Ej: 0.00"
            {...register("minimo", {
              onChange: (e) => {
                clearFieldError("minimo");
                handleMinimoChange(e);
              },
              valueAsNumber: true
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.minimo && (
            <p className="text-sm text-red-500">{fieldErrors.minimo}</p>
          )}
        </div>

        {/* Máximo */}
        <div className="space-y-2">
          <Label htmlFor="maximo" className="text-sm font-medium">
            Valor Máximo
          </Label>
          <Input
            id="maximo"
            type="number"
            step="0.01"
            placeholder="Ej: 100.00"
            {...register("maximo", {
              onChange: (e) => {
                clearFieldError("maximo");
                handleMaximoChange(e);
              },
              valueAsNumber: true
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.maximo && (
            <p className="text-sm text-red-500">{fieldErrors.maximo}</p>
          )}
        </div>

        {/* Función */}
        <div className="space-y-2">
          <Label htmlFor="funcion" className="text-sm font-medium">
            Función
          </Label>
          <Input
            id="funcion"
            type="number"
            placeholder="Número de función"
            {...register("funcion", {
              onChange: () => clearFieldError("funcion"),
              valueAsNumber: true
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.funcion && (
            <p className="text-sm text-red-500">{fieldErrors.funcion}</p>
          )}
        </div>

        {/* Control */}
        <div className="space-y-2">
          <Label htmlFor="control" className="text-sm font-medium">
            Control
          </Label>
          <Input
            id="control"
            type="number"
            placeholder="Número de control"
            {...register("control", {
              onChange: () => clearFieldError("control"),
              valueAsNumber: true
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.control && (
            <p className="text-sm text-red-500">{fieldErrors.control}</p>
          )}
        </div>

        {/* Offset */}
        <div className="space-y-2">
          <Label htmlFor="offset" className="text-sm font-medium">
            Offset
          </Label>
          <Input
            id="offset"
            type="text"
            placeholder="Valor de offset"
            {...register("offset", {
              onChange: () => clearFieldError("offset")
            })}
            disabled={isSubmitting}
          />
          {fieldErrors.offset && (
            <p className="text-sm text-red-500">{fieldErrors.offset}</p>
          )}
        </div>
      </div>

      {/* Mensaje de validación máximo vs mínimo */}
      {maximoValue && minimoValue && parseFloat(maximoValue) <= parseFloat(minimoValue) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            ⚠️ El valor máximo debe ser mayor que el valor mínimo
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSensorEditado}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Actualizando...
            </>
          ) : (
            "Actualizar Sensor"
          )}
        </Button>
      </div>
    </form>
  );
}