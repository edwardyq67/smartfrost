"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trabajosService, UpdateTrabajoData } from "@/lib/trabajo/UseTrabajo";
import { useRefreshTableTrabajos } from "@/store/trabajos/refreshTableTrabajos";
import { userService } from "@/lib/usuarios/UseUsuarios";
import { EmpresaService } from "@/lib/empresas/UseEmpresas";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { Loader2, Calendar } from "lucide-react";

interface TrabajoFormData {
  id_tecnico: string;
  id_empresa: string;
  fecha_inicio: string;
  fecha_entrega: string;
  tipo: string;
  observaciones?: string | null;
}

interface Usuario {
  uuid: string;
  nombre: string;
}

interface Empresa {
  uuid: string;
  nombre: string;
}

interface TrabajoEditarProps {
  trabajo: string;
  onTrabajoEditado: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ID_ROL_TECNICO = "0093b11f-6ae4-48df-853a-071ca0711891";

export function TrabajoEditar({ 
  trabajo, 
  onTrabajoEditado, 
  open, 
  onOpenChange 
}: TrabajoEditarProps) {
  const { triggerRefresh } = useRefreshTableTrabajos();
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trabajoData, setTrabajoData] = useState<any>(null);
  
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
    formState: { isSubmitting },
    setValue,
    reset,
    watch,
    clearErrors,
    trigger
  } = useForm<TrabajoFormData>({
    defaultValues: {
      id_tecnico: "",
      id_empresa: "",
      fecha_inicio: "",
      fecha_entrega: "",
      tipo: "1",
      observaciones: ""
    }
  });

  const tecnicoValue = watch("id_tecnico");
  const empresaValue = watch("id_empresa");
  const tipoValue = watch("tipo");
  const fechaInicioValue = watch("fecha_inicio");
  const fechaEntregaValue = watch("fecha_entrega");

  // Función para obtener fecha actual en formato YYYY-MM-DDThh:mm
  const getFechaActual = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // "2024-11-25T14:30"
  };

  // Función para autocompletar fecha de inicio con la actual
  const handleAutocompletarInicio = () => {
    setValue("fecha_inicio", getFechaActual());
  };

  // Función para autocompletar fecha de entrega con la actual
  const handleAutocompletarEntrega = () => {
    setValue("fecha_entrega", getFechaActual());
  };

  // Cargar datos cuando se abre el diálogo
  useEffect(() => {
    if (open && trabajo) {
      loadTrabajoData();
      fetchTecnicos(1, "", true);
      fetchEmpresas(1, "", true);
    } else {
      reset();
      setTrabajoData(null);
      setBackendError(null);
    }
  }, [open, trabajo]);

  const loadTrabajoData = async () => {
    if (!trabajo) return;
    
    setIsLoading(true);
    try {
      const response = await trabajosService.getTrabajoById(trabajo);
      const trabajoDetalle = response.data;
      
      setTrabajoData(trabajoDetalle);
      
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        return dateString.replace(" ", "T").slice(0, 16);
      };

      setValue("id_tecnico", trabajoDetalle.tecnico.uuid);
      setValue("id_empresa", trabajoDetalle.empresa.uuid);
      setValue("fecha_inicio", formatDateForInput(trabajoDetalle.fecha_inicio));
      setValue("fecha_entrega", formatDateForInput(trabajoDetalle.fecha_entrega));
      setValue("tipo", trabajoDetalle.tipo);
      setValue("observaciones", trabajoDetalle.observaciones || "");
      
      // Trigger validation after setting values
      trigger();

    } catch (error) {
      console.error("Error cargando datos del trabajo:", error);
      setBackendError("Error al cargar los datos del trabajo");
    } finally {
      setIsLoading(false);
    }
  };

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

  const onSubmit = async (data: TrabajoFormData) => {
    if (!trabajo) return;
    
    try {
      setBackendError(null);
      clearErrors();

      const formatDateForBackend = (dateString: string) => {
        if (!dateString) return null;
        return dateString.replace("T", " ") + ":00";
      };

      const trabajoData: UpdateTrabajoData = {
        id_tecnico: data.id_tecnico,
        id_empresa: data.id_empresa,
        fecha_inicio: formatDateForBackend(data.fecha_inicio)||null,
        fecha_entrega: formatDateForBackend(data.fecha_entrega),
        tipo: data.tipo,
        observaciones: data.observaciones || null
      };
      
      await trabajosService.updateTrabajo(trabajo, trabajoData);
      triggerRefresh();
      onTrabajoEditado();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al actualizar trabajo:", error);
      
      let errorMessage = "Error al actualizar el trabajo";

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

  // Función para obtener nombre del técnico seleccionado
  const getTecnicoNombre = () => {
    const tecnico = tecnicos.find(t => t.uuid === tecnicoValue) || trabajoData?.tecnico;
    return tecnico ? tecnico.nombre : "Técnico";
  };

  // Función para obtener nombre de la empresa seleccionada
  const getEmpresaNombre = () => {
    const empresa = empresas.find(e => e.uuid === empresaValue) || trabajoData?.empresa;
    return empresa ? empresa.nombre : "Empresa";
  };

  const isFormSubmitting = isSubmitting;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-gray-500">Cargando datos del trabajo...</span>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-red-800">{backendError}</p>
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

        {/* Fecha de Inicio con botón de autocompletar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="fecha_inicio" className="text-sm font-medium">Fecha de Inicio *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutocompletarInicio}
              className="h-7 px-2 text-xs flex items-center gap-1"
              disabled={isFormSubmitting}
            >
              <Calendar className="h-3 w-3" />
              Ahora
            </Button>
          </div>
          <Input
            id="fecha_inicio"
            type="datetime-local"
            {...register("fecha_inicio", { required: "La fecha de inicio es requerida" })}
            className="w-full"
            disabled={isFormSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Fecha y hora de inicio del trabajo
          </p>
        </div>

        {/* Fecha de Entrega con botón de autocompletar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="fecha_entrega" className="text-sm font-medium">Fecha de Entrega</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutocompletarEntrega}
              className="h-7 px-2 text-xs flex items-center gap-1"
              disabled={isFormSubmitting}
            >
              <Calendar className="h-3 w-3" />
              Ahora
            </Button>
          </div>
          <Input
            id="fecha_entrega"
            type="datetime-local"
            {...register("fecha_entrega")}
            className="w-full"
            disabled={isFormSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Fecha y hora estimada de finalización
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
          onClick={() => onOpenChange(false)}
          disabled={isFormSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1 w-full sm:w-auto"
          disabled={isFormSubmitting || !tecnicoValue || !empresaValue || !tipoValue}
        >
          {isFormSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : "Actualizar Trabajo"}
        </Button>
      </div>
    </form>
  );
}