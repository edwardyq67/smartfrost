// app/tipoAutomatizacion/components/TipoAutomatizacionEditar.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tipoAutomatizacionService, UpdateTipoAutomatizacionData } from "@/lib/tipoAutomatizacion/UseTipoAutomatizacion";
import { tipoSensorService } from "@/lib/tipoSensor/UseTipoSensor";
import { tipoActuadoresService } from "@/lib/tipoActuadores/UseTipoActuadores";
import { tipoAutomatizacionRelacionService } from "@/lib/tipoAutomatizacionRelacion/UseTipoAutomatizacionRelacion";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { Loader2, Plus, Minus, X, Cpu, Zap } from "lucide-react";

interface TipoAutomatizacionEditarProps {
  tipoAutomatizacion: string; // uuid del tipo de automatización
  onTipoAutomatizacionEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface TipoSensor {
  uuid: string;
  nombre: string;
  uMed?: string;
}

interface TipoActuador {
  uuid: string;
  nombre: string;
  uMed?: string;
}

interface SensorSeleccionado {
  uuid: string;
  nombre: string;
  cantidad: number;
}

interface ActuadorSeleccionado {
  uuid: string;
  nombre: string;
  cantidad: number;
}

interface RelacionExistente {
  id_entidad: string;
  tipo_entidad: string;
  cantidad: string;
}

interface TipoAutomatizacionFormData {
  nombre: string;
}

export function TipoAutomatizacionEditar({ 
  tipoAutomatizacion, 
  onTipoAutomatizacionEditado, 
  open,
  onOpenChange
}: TipoAutomatizacionEditarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relacionesExistentes, setRelacionesExistentes] = useState<RelacionExistente[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  
  // Estados para sensores
  const [sensores, setSensores] = useState<TipoSensor[]>([]);
  const [loadingSensores, setLoadingSensores] = useState(false);
  const [loadingMoreSensores, setLoadingMoreSensores] = useState(false);
  const [pagSensores, setPagSensores] = useState(1);
  const [searchSensores, setSearchSensores] = useState("");
  const [hasMoreSensores, setHasMoreSensores] = useState(true);
  
  // Estados para actuadores
  const [actuadores, setActuadores] = useState<TipoActuador[]>([]);
  const [loadingActuadores, setLoadingActuadores] = useState(false);
  const [loadingMoreActuadores, setLoadingMoreActuadores] = useState(false);
  const [pagActuadores, setPagActuadores] = useState(1);
  const [searchActuadores, setSearchActuadores] = useState("");
  const [hasMoreActuadores, setHasMoreActuadores] = useState(true);
  
  // Estados para elementos seleccionados
  const [sensoresSeleccionados, setSensoresSeleccionados] = useState<SensorSeleccionado[]>([]);
  const [actuadoresSeleccionados, setActuadoresSeleccionados] = useState<ActuadorSeleccionado[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<TipoAutomatizacionFormData>();

  // Cargar datos del tipo de automatización cuando cambia el uuid o se abre el diálogo
  useEffect(() => {
    if (tipoAutomatizacion && open) {
      fetchTipoAutomatizacionData();
      fetchSensores(1, "", true);
      fetchActuadores(1, "", true);
    } else {
      reset();
      setSensoresSeleccionados([]);
      setActuadoresSeleccionados([]);
      setRelacionesExistentes([]);
      setError(null);
    }
  }, [tipoAutomatizacion, open]);

  const fetchTipoAutomatizacionData = async () => {
    try {
      setIsFetchingData(true);
      setError(null);
      
      const response = await tipoAutomatizacionService.getTipoAutomatizacionById(tipoAutomatizacion);
      
      reset({
        nombre: response.data.nombre,
      });

      // Cargar relaciones existentes
      if (response.data.relaciones) {
        setRelacionesExistentes(response.data.relaciones);
        
        // Separar sensores y actuadores existentes
        const sensoresExistentes = response.data.relaciones
          .filter(rel => rel.tipo_entidad === 'TIPO_SENSOR')
          .map(rel => ({
            uuid: rel.id_entidad,
            nombre: `Sensor ${rel.id_entidad.substring(0, 8)}`, // Nombre temporal
            cantidad: parseInt(rel.cantidad)
          }));

        const actuadoresExistentes = response.data.relaciones
          .filter(rel => rel.tipo_entidad === 'TIPO_ACTUADOR')
          .map(rel => ({
            uuid: rel.id_entidad,
            nombre: `Actuador ${rel.id_entidad.substring(0, 8)}`, // Nombre temporal
            cantidad: parseInt(rel.cantidad)
          }));

        setSensoresSeleccionados(sensoresExistentes);
        setActuadoresSeleccionados(actuadoresExistentes);
        
        // Obtener nombres reales de sensores y actuadores seleccionados
        if (sensoresExistentes.length > 0 || actuadoresExistentes.length > 0) {
          await updateNombresSeleccionados(sensoresExistentes, actuadoresExistentes);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar tipo de automatización:", err);
      setError(err.response?.data?.message || "Error al cargar los datos");
    } finally {
      setIsFetchingData(false);
    }
  };

  // Actualizar nombres de sensores y actuadores seleccionados
  const updateNombresSeleccionados = async (
    sensoresExistentes: SensorSeleccionado[], 
    actuadoresExistentes: ActuadorSeleccionado[]
  ) => {
    try {
      // Obtener todos los sensores disponibles
      const sensoresResponse = await tipoSensorService.getTipoSensores({
        page: 1,
        size: 1000,
      });
      
      // Obtener todos los actuadores disponibles
      const actuadoresResponse = await tipoActuadoresService.getTipoActuadores({
        page: 1,
        size: 1000,
      });
      
      // Actualizar nombres de sensores
      const sensoresActualizados = sensoresExistentes.map(sensor => {
        const sensorData = sensoresResponse.data.data.find((s: any) => s.uuid === sensor.uuid);
        return {
          ...sensor,
          nombre: sensorData?.nombre || sensor.nombre,
        };
      });
      
      // Actualizar nombres de actuadores
      const actuadoresActualizados = actuadoresExistentes.map(actuador => {
        const actuadorData = actuadoresResponse.data.data.find((a: any) => a.uuid === actuador.uuid);
        return {
          ...actuador,
          nombre: actuadorData?.nombre || actuador.nombre,
        };
      });
      
      setSensoresSeleccionados(sensoresActualizados);
      setActuadoresSeleccionados(actuadoresActualizados);
    } catch (error) {
      console.error("Error actualizando nombres de elementos seleccionados:", error);
    }
  };

  // Función para cargar sensores
  const fetchSensores = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingSensores(true);
        setLoadingMoreSensores(false);
      } else {
        setLoadingMoreSensores(true);
      }

      const response = await tipoSensorService.getTipoSensores({
        page: page,
        size: 100,
        sortBy: "nombre",
        sortOrder: "asc",
        search: searchTerm
      });

      const nuevosSensores = response.data.data.map((sensor: any) => ({
        uuid: sensor.uuid,
        nombre: sensor.nombre,
        uMed: sensor.uMed || "Sin unidad"
      }));

      if (resetData) {
        setSensores(nuevosSensores);
        setPagSensores(1);
      } else {
        setSensores(prev => [...prev, ...nuevosSensores]);
        setPagSensores(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreSensores(currentPage < totalPages);

    } catch (error) {
      console.error("Error cargando sensores:", error);
    } finally {
      setLoadingSensores(false);
      setLoadingMoreSensores(false);
    }
  }, []);

  // Función para cargar actuadores
  const fetchActuadores = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingActuadores(true);
        setLoadingMoreActuadores(false);
      } else {
        setLoadingMoreActuadores(true);
      }

      const response = await tipoActuadoresService.getTipoActuadores({
        page: page,
        size: 100,
        sortBy: "nombre",
        sortOrder: "asc",
        search: searchTerm
      });

      const nuevosActuadores = response.data.data.map((actuador: any) => ({
        uuid: actuador.uuid,
        nombre: actuador.nombre,
        uMed: actuador.uMed || "Sin unidad"
      }));

      if (resetData) {
        setActuadores(nuevosActuadores);
        setPagActuadores(1);
      } else {
        setActuadores(prev => [...prev, ...nuevosActuadores]);
        setPagActuadores(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreActuadores(currentPage < totalPages);

    } catch (error) {
      console.error("Error cargando actuadores:", error);
    } finally {
      setLoadingActuadores(false);
      setLoadingMoreActuadores(false);
    }
  }, []);

  // Handlers para búsqueda
  const handleSearchSensores = (searchTerm: string) => {
    setSearchSensores(searchTerm);
    fetchSensores(1, searchTerm, true);
  };

  const handleSearchActuadores = (searchTerm: string) => {
    setSearchActuadores(searchTerm);
    fetchActuadores(1, searchTerm, true);
  };

  // Handlers para cargar más
  const handleLoadMoreSensores = () => {
    if (!loadingMoreSensores && hasMoreSensores) {
      fetchSensores(pagSensores + 1, searchSensores, false);
    }
  };

  const handleLoadMoreActuadores = () => {
    if (!loadingMoreActuadores && hasMoreActuadores) {
      fetchActuadores(pagActuadores + 1, searchActuadores, false);
    }
  };

  // Handlers para seleccionar sensores y actuadores
  const handleAgregarSensor = (sensorUuid: string) => {
    const sensor = sensores.find(s => s.uuid === sensorUuid);
    if (sensor && !sensoresSeleccionados.find(s => s.uuid === sensorUuid)) {
      setSensoresSeleccionados(prev => [...prev, {
        uuid: sensor.uuid,
        nombre: sensor.nombre,
        cantidad: 1
      }]);
    }
  };

  const handleAgregarActuador = (actuadorUuid: string) => {
    const actuador = actuadores.find(a => a.uuid === actuadorUuid);
    if (actuador && !actuadoresSeleccionados.find(a => a.uuid === actuadorUuid)) {
      setActuadoresSeleccionados(prev => [...prev, {
        uuid: actuador.uuid,
        nombre: actuador.nombre,
        cantidad: 1
      }]);
    }
  };

  // Handlers para modificar cantidad
  const handleCambiarCantidadSensor = (uuid: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setSensoresSeleccionados(prev => 
      prev.map(sensor => 
        sensor.uuid === uuid ? { ...sensor, cantidad: nuevaCantidad } : sensor
      )
    );
  };

  const handleCambiarCantidadActuador = (uuid: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setActuadoresSeleccionados(prev => 
      prev.map(actuador => 
        actuador.uuid === uuid ? { ...actuador, cantidad: nuevaCantidad } : actuador
      )
    );
  };

  // Handlers para eliminar elementos
  const handleEliminarSensor = (uuid: string) => {
    setSensoresSeleccionados(prev => prev.filter(s => s.uuid !== uuid));
  };

  const handleEliminarActuador = (uuid: string) => {
    setActuadoresSeleccionados(prev => prev.filter(a => a.uuid !== uuid));
  };

  const onSubmit = async (data: TipoAutomatizacionFormData) => {
    setLoading(true);
    setError(null);
    clearErrors();

    try {
      // 1. Actualizar el nombre del tipo de automatización
      const updateData: UpdateTipoAutomatizacionData = {
        nombre: data.nombre,
      };

      await tipoAutomatizacionService.updateTipoAutomatizacion(tipoAutomatizacion, updateData);

      // 2. Actualizar las relaciones si hay cambios
      if (sensoresSeleccionados.length > 0 || actuadoresSeleccionados.length > 0) {
        const items = [
          ...sensoresSeleccionados.map(sensor => ({
            id_entidad: sensor.uuid,
            tipo_entidad: 'TIPO_SENSOR' as const,
            cantidad: sensor.cantidad
          })),
          ...actuadoresSeleccionados.map(actuador => ({
            id_entidad: actuador.uuid,
            tipo_entidad: 'TIPO_ACTUADOR' as const,
            cantidad: actuador.cantidad
          }))
        ];

        await tipoAutomatizacionRelacionService.createTipoAutomatizacionRelacion({
          id_tipo_automatizacion: tipoAutomatizacion,
          items: items
        });
      }

      onTipoAutomatizacionEditado?.();
      
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Error al actualizar tipo de automatización:", err);
      setError(err.response?.data?.message || err.message || "Error al actualizar el tipo de automatización");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const isFormSubmitting = loading;

  if (isFetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Campo Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre" className="text-sm font-medium">
          Nombre del Tipo de Automatización *
        </Label>
        <Input
          id="nombre"
          {...register("nombre", { 
            required: "El nombre del tipo de automatización es requerido",
            minLength: {
              value: 2,
              message: "El nombre debe tener al menos 2 caracteres"
            }
          })}
          placeholder="Ej: Automatización Industrial, Control de Acceso"
          disabled={isFormSubmitting}
        />
        {errors.nombre && (
          <p className="text-sm text-red-500">{errors.nombre.message}</p>
        )}
      </div>

      {/* Contenedor flex para sensores y actuadores */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna de Sensores */}
        <div className="flex-1 space-y-3">
          <Label className="text-sm font-medium">
            Sensores
          </Label>
          
          <OptionInfinito
            data={sensores}
            value=""
            onChange={handleAgregarSensor}
            onSearch={handleSearchSensores}
            onLoadMore={handleLoadMoreSensores}
            hasMore={hasMoreSensores}
            isLoading={loadingMoreSensores}
            loading={loadingSensores}
            placeholder="Buscar y seleccionar sensores..."
          />
          
          {/* Contador de sensores */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {sensores.length} sensores disponibles
            </p>
            {sensoresSeleccionados.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                {sensoresSeleccionados.length} seleccionados
              </p>
            )}
          </div>

          {/* Lista de sensores seleccionados con cantidad */}
          {sensoresSeleccionados.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {sensoresSeleccionados.map((sensor) => (
                  <div key={sensor.uuid} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Cpu className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{sensor.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">ID: {sensor.uuid.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleCambiarCantidadSensor(sensor.uuid, sensor.cantidad - 1)}
                        disabled={sensor.cantidad <= 1 || isFormSubmitting}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="relative w-16">
                        <Input
                          type="number"
                          min="1"
                          value={sensor.cantidad}
                          onChange={(e) => handleCambiarCantidadSensor(sensor.uuid, parseInt(e.target.value) || 1)}
                          disabled={isFormSubmitting}
                          className="h-8 text-center"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleCambiarCantidadSensor(sensor.uuid, sensor.cantidad + 1)}
                        disabled={isFormSubmitting}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEliminarSensor(sensor.uuid)}
                        disabled={isFormSubmitting}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna de Actuadores */}
        <div className="flex-1 space-y-3">
          <Label className="text-sm font-medium">
            Actuadores
          </Label>
          
          <OptionInfinito
            data={actuadores}
            value=""
            onChange={handleAgregarActuador}
            onSearch={handleSearchActuadores}
            onLoadMore={handleLoadMoreActuadores}
            hasMore={hasMoreActuadores}
            isLoading={loadingMoreActuadores}
            loading={loadingActuadores}
            placeholder="Buscar y seleccionar actuadores..."
          />
          
          {/* Contador de actuadores */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {actuadores.length} actuadores disponibles
            </p>
            {actuadoresSeleccionados.length > 0 && (
              <p className="text-xs text-green-600 font-medium">
                {actuadoresSeleccionados.length} seleccionados
              </p>
            )}
          </div>

          {/* Lista de actuadores seleccionados con cantidad */}
          {actuadoresSeleccionados.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {actuadoresSeleccionados.map((actuador) => (
                  <div key={actuador.uuid} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Zap className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{actuador.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">ID: {actuador.uuid.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleCambiarCantidadActuador(actuador.uuid, actuador.cantidad - 1)}
                        disabled={actuador.cantidad <= 1 || isFormSubmitting}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="relative w-16">
                        <Input
                          type="number"
                          min="1"
                          value={actuador.cantidad}
                          onChange={(e) => handleCambiarCantidadActuador(actuador.uuid, parseInt(e.target.value) || 1)}
                          disabled={isFormSubmitting}
                          className="h-8 text-center"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleCambiarCantidadActuador(actuador.uuid, actuador.cantidad + 1)}
                        disabled={isFormSubmitting}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEliminarActuador(actuador.uuid)}
                        disabled={isFormSubmitting}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          disabled={isFormSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isFormSubmitting}
        >
          {isFormSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : "Actualizar"}
        </Button>
      </div>
    </form>
  );
}