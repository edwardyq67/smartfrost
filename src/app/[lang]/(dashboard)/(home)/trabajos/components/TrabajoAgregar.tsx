"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trabajosService, CreateTrabajoData } from "@/lib/trabajo/UseTrabajo";
import { useRefreshTableTrabajos } from "@/store/trabajos/refreshTableTrabajos";
import { userService } from "@/lib/usuarios/UseUsuarios";
import { EmpresaService } from "@/lib/empresas/UseEmpresas";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { notificacionesService } from "@/lib/notificaciones/UseNotificaciones";
import { Loader2 } from "lucide-react";

interface TrabajoFormData {
  id_tecnico: string;
  id_empresa: string;
  fecha_creacion: string; // ← AHORA EDITABLE
  tipo: string;
  observaciones?: string;
}

interface Usuario {
  uuid: string;
  nombre: string;
}

interface Empresa {
  uuid: string;
  nombre: string;
}

export function TrabajoAgregar({ onTrabajoCreado }: { onTrabajoCreado?: () => void }) {
  const { triggerRefresh } = useRefreshTableTrabajos();
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const ID_ROL_TECNICO = "0093b11f-6ae4-48df-853a-071ca0711891";
  
  // Estados para técnicos
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [loadingMoreTecnicos, setLoadingMoreTecnicos] = useState(false);
  const [pagTecnicos, setPagTecnicos] = useState(1);
  const [searchTecnicos, setSearchTecnicos] = useState("");
  const [hasMoreTecnicos, setHasMoreTecnicos] = useState(true);
  
  // Estados para empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingMoreEmpresas, setLoadingMoreEmpresas] = useState(false);
  const [pagEmpresas, setPagEmpresas] = useState(1);
  const [searchEmpresas, setSearchEmpresas] = useState("");
  const [hasMoreEmpresas, setHasMoreEmpresas] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    reset,
    watch,
    clearErrors
  } = useForm<TrabajoFormData>({
    defaultValues: {
      id_tecnico: "",
      id_empresa: "",
      fecha_creacion: "", // ← Ahora editable, no autoasignada
      tipo: "1",
      observaciones: ""
    }
  });

  const tecnicoValue = watch("id_tecnico");
  const empresaValue = watch("id_empresa");
  const tipoValue = watch("tipo");
  const fechaCreacionValue = watch("fecha_creacion");

  // Función para obtener el nombre del técnico seleccionado
  const getTecnicoNombre = () => {
    const tecnico = tecnicos.find(t => t.uuid === tecnicoValue);
    return tecnico ? tecnico.nombre : "Técnico";
  };

  // Función para obtener el nombre de la empresa seleccionada
  const getEmpresaNombre = () => {
    const empresa = empresas.find(e => e.uuid === empresaValue);
    return empresa ? empresa.nombre : "la empresa";
  };

  // Función para obtener el nombre del tipo de trabajo
  const getTipoTrabajoNombre = (tipo: string) => {
    switch(tipo) {
      case "0": return "Plan de mantenimiento preventivo";
      case "1": return "Plan de mantenimiento correctivo";
      default: return "trabajo";
    }
  };

  // Función para formatear la fecha
  const formatFecha = (fecha: string) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener fecha y hora actual
  const getFechaActual = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16).replace("T", " ");
  };

  // Botón para asignar fecha/hora actual
  const handleSetFechaActual = () => {
    setValue("fecha_creacion", getFechaActual());
  };

  // Botón para limpiar fecha
  const handleLimpiarFecha = () => {
    setValue("fecha_creacion", "");
  };

  useEffect(() => {
    Promise.all([
      fetchTecnicos(1, "", true),
      fetchEmpresas(1, "", true)
    ]).catch(error => {
      console.error("Error cargando datos iniciales:", error);
    });
  }, []);

  const fetchTecnicos = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingTecnicos(true);
        setLoadingMoreTecnicos(false);
      } else {
        setLoadingMoreTecnicos(true);
      }

      const response = await userService.getUsers({
        page: page,
        size: 100,
        sortBy: "nombre",
        sortOrder: "asc",
        search: searchTerm,
        id_rol: ID_ROL_TECNICO
      });

      const nuevosTecnicos = response.data.data.map((usuario: any) => ({
        uuid: usuario.uuid,
        nombre: usuario.nombre
      }));

      if (resetData) {
        setTecnicos(nuevosTecnicos);
        setPagTecnicos(1);
      } else {
        setTecnicos(prev => [...prev, ...nuevosTecnicos]);
        setPagTecnicos(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreTecnicos(currentPage < totalPages);

    } catch (error) {
      console.error("Error cargando técnicos:", error);
    } finally {
      setLoadingTecnicos(false);
      setLoadingMoreTecnicos(false);
    }
  }, []);

  const fetchEmpresas = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingEmpresas(true);
        setLoadingMoreEmpresas(false);
      } else {
        setLoadingMoreEmpresas(true);
      }

      const response = await EmpresaService.getEmpresas({
        page: page,
        size: 100,
        sortBy: "nombre",
        sortOrder: "asc",
        nombre: searchTerm
      });

      const nuevasEmpresas = response.data.data.map((empresa: any) => ({
        uuid: empresa.uuid,
        nombre: empresa.nombre
      }));

      if (resetData) {
        setEmpresas(nuevasEmpresas);
        setPagEmpresas(1);
      } else {
        setEmpresas(prev => [...prev, ...nuevasEmpresas]);
        setPagEmpresas(page);
      }

      const currentPage = response.data.pager.currentPage;
      const totalPages = response.data.pager.totalPages;
      setHasMoreEmpresas(currentPage < totalPages);

    } catch (error) {
      console.error("Error cargando empresas:", error);
    } finally {
      setLoadingEmpresas(false);
      setLoadingMoreEmpresas(false);
    }
  }, []);

  const handleSearchTecnicos = (searchTerm: string) => {
    setSearchTecnicos(searchTerm);
    fetchTecnicos(1, searchTerm, true);
  };

  const handleSearchEmpresas = (searchTerm: string) => {
    setSearchEmpresas(searchTerm);
    fetchEmpresas(1, searchTerm, true);
  };

  const handleLoadMoreTecnicos = () => {
    if (!loadingMoreTecnicos && hasMoreTecnicos) {
      fetchTecnicos(pagTecnicos + 1, searchTecnicos, false);
    }
  };

  const handleLoadMoreEmpresas = () => {
    if (!loadingMoreEmpresas && hasMoreEmpresas) {
      fetchEmpresas(pagEmpresas + 1, searchEmpresas, false);
    }
  };

  // Función para enviar notificaciones (ambas: app y web)
  const enviarNotificacionesAmbasPlataformas = async (data: TrabajoFormData) => {
    try {
      const tipoTrabajo = getTipoTrabajoNombre(data.tipo);
      const empresaNombre = getEmpresaNombre();
      const tecnicoNombre = getTecnicoNombre();
      const fechaFormateada = formatFecha(data.fecha_creacion);
      
      // Crear el mensaje personalizado
      const titulo = `📋 ${tipoTrabajo}`;
      const mensaje = `Hola ${tecnicoNombre}, se te ha asignado un ${tipoTrabajo.toLowerCase()} en ${empresaNombre}. Fecha de creación: ${fechaFormateada}`;
      
      // Enviar notificación a la APP
      try {
        await notificacionesService.createNotificacionOneSignal({
          titulo: titulo,
          mensaje: mensaje,
          tipo: "app",
          ruta: "servicios",
          destinatarios: [data.id_tecnico]
        });
      } catch (appError) {
        console.warn("⚠️ Error al enviar notificación APP:", appError);
        // Continuamos aunque falle una de las notificaciones
      }
      
      // Enviar notificación a la WEB
      try {
        await notificacionesService.createNotificacionOneSignal({
          titulo: titulo,
          mensaje: mensaje,
          tipo: "web",
          ruta: "servicios",
          destinatarios: [data.id_tecnico]
        });
      } catch (webError) {
        console.warn("⚠️ Error al enviar notificación WEB:", webError);
        // Continuamos aunque falle una de las notificaciones
      }
      
    } catch (error) {
      console.warn("⚠️ Error general al enviar notificaciones:", error);
      // No mostramos error al usuario, solo registramos en consola
    }
  };

  const onSubmit = async (data: TrabajoFormData) => {
    try {
      setBackendError(null);
      clearErrors();
      
      // Validar que fecha_creacion no sea futura (si quieres permitir solo fechas pasadas/presente)
      if (data.fecha_creacion) {
        const fechaCreacion = new Date(data.fecha_creacion);
        const ahora = new Date();
        
        // Validar que no sea fecha futura (opcional, según tu requerimiento)
        if (fechaCreacion > ahora) {
          setBackendError("La fecha de creación no puede ser futura");
          return;
        }
      }
      
      // 1. Enviar notificaciones (app y web) de manera secundaria
      await enviarNotificacionesAmbasPlataformas(data);
      
      // 2. Crear el trabajo con la fecha de creación especificada por el usuario
      const trabajoData: CreateTrabajoData = {
        id_tecnico: data.id_tecnico,
        id_empresa: data.id_empresa,
        fecha_creacion: data.fecha_creacion || new Date().toISOString().slice(0, 19).replace("T", " "),
        tipo: data.tipo,
        observaciones: data.observaciones || ""
      };
      
      await trabajosService.createTrabajo(trabajoData);
      
      // 3. Resetear el formulario y refrescar
      reset();
      triggerRefresh();
      onTrabajoCreado?.();
      
    } catch (error: any) {
      console.error("Error al crear trabajo:", error);
      
      let errorMessage = "Error al crear el trabajo";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.messages && errorData.messages.error) {
          errorMessage = errorData.messages.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData.messages)) {
          errorMessage = errorData.messages.join(', ');
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setBackendError(errorMessage);
    }
  };

  const isFormSubmitting = isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {backendError && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  {backendError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBackendError(null)}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Técnico - usando OptionInfinito */}
        <div className="space-y-2">
          <Label htmlFor="id_tecnico" className="text-sm font-medium">Técnico *</Label>
          <OptionInfinito
            data={tecnicos}
            value={tecnicoValue}
            onChange={(value) => setValue("id_tecnico", value)}
            onSearch={handleSearchTecnicos}
            onLoadMore={handleLoadMoreTecnicos}
            hasMore={hasMoreTecnicos}
            isLoading={loadingMoreTecnicos}
            loading={loadingTecnicos}
            placeholder="Buscar y seleccionar técnico..."
          />
          <input
            type="hidden"
            {...register("id_tecnico", { required: "El técnico es requerido" })}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {tecnicos.length} técnicos disponibles
            </p>
            {tecnicoValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("id_tecnico", "")}
                className="h-7 px-2 text-xs"
                disabled={isFormSubmitting}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Empresa - usando OptionInfinito */}
        <div className="space-y-2">
          <Label htmlFor="id_empresa" className="text-sm font-medium">Empresa *</Label>
          <OptionInfinito
            data={empresas}
            value={empresaValue}
            onChange={(value) => setValue("id_empresa", value)}
            onSearch={handleSearchEmpresas}
            onLoadMore={handleLoadMoreEmpresas}
            hasMore={hasMoreEmpresas}
            isLoading={loadingMoreEmpresas}
            loading={loadingEmpresas}
            placeholder="Buscar y seleccionar empresa..."
          />
          <input
            type="hidden"
            {...register("id_empresa", { required: "La empresa es requerida" })}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {empresas.length} empresas disponibles
            </p>
            {empresaValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("id_empresa", "")}
                className="h-7 px-2 text-xs"
                disabled={isFormSubmitting}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Fecha de Creación - EDITABLE */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="fecha_creacion" className="text-sm font-medium">Fecha de Creación *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetFechaActual}
                className="h-7 px-2 text-xs"
                disabled={isFormSubmitting}
              >
                Ahora
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLimpiarFecha}
                className="h-7 px-2 text-xs"
                disabled={isFormSubmitting}
              >
                Limpiar
              </Button>
            </div>
          </div>
          <Input
            id="fecha_creacion"
            type="datetime-local"
            {...register("fecha_creacion", { 
              required: "La fecha de creación es requerida",
              validate: {
                notFuture: (value) => {
                  const fecha = new Date(value);
                  const ahora = new Date();
                  return fecha <= ahora || "La fecha de creación no puede ser futura";
                }
              }
            })}
            className="w-full"
            disabled={isFormSubmitting}
          />
          {errors.fecha_creacion && (
            <p className="text-xs text-red-500">{errors.fecha_creacion.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Cuándo se creará/creó este trabajo (puede ser pasado o presente)
          </p>
        </div>

        {/* Tipo de Trabajo */}
        <div className="space-y-2">
          <Label htmlFor="tipo" className="text-sm font-medium">Tipo de Trabajo *</Label>
          <select
            id="tipo"
            {...register("tipo", { required: "El tipo de trabajo es requerido" })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-10"
            disabled={isFormSubmitting}
          >
            <option value="">Seleccione un tipo...</option>
            <option value="0">Plan de mantenimiento preventivo</option>
            <option value="1">Plan de mantenimiento correctivo</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Seleccione el tipo de trabajo
          </p>
        </div>

        {/* Observaciones */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
          <textarea
            id="observaciones"
            {...register("observaciones")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Notas adicionales sobre el trabajo..."
            rows={3}
            disabled={isFormSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Notas, comentarios o detalles adicionales (opcional)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 w-full sm:w-auto" 
          onClick={onTrabajoCreado}
          disabled={isFormSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1 w-full sm:w-auto"
          disabled={isFormSubmitting || !tecnicoValue || !empresaValue || !tipoValue || !fechaCreacionValue}
        >
          {isFormSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : "Crear Trabajo"}
        </Button>
      </div>
    </form>
  );
}