"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { actuadoresService, CreateActuadorData } from "@/lib/actuadores/UseActuadores";
import { useRefreshTableActuadores } from "@/store/actuadores/refreshTableActuadores";
import { Input } from "@/components/ui/input";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { DaqService } from "@/lib/daq/UseDaq";
import { Loader2 } from "lucide-react";
import { tipoActuadoresService } from "@/lib/tipoActuadores/UseTipoActuadores";

interface ActuadoresAgregarProps {
    onActuadorCreado?: () => void;
}

interface TipoActuadorItem {
    uuid: string;
    nombre: string;
    identificador?: string;
}

interface DaqItem {
    uuid: string;
    nombre: string;
    identificador?: string;
}

// Función para combinar nombre e identificador para OptionInfinito
const formatForOptionInfinito = (item: { nombre: string; identificador?: string; uuid: string }) => {
    let displayName = "";
    
    if (item.nombre && item.nombre.trim() !== "") {
        displayName = item.nombre;
    } else if (item.identificador && item.identificador.trim() !== "") {
        displayName = item.identificador;
    } else {
        displayName = "Sin nombre";
    }
    
    // Si tenemos tanto nombre como identificador, podemos mostrar ambos
    if (item.nombre && item.nombre.trim() !== "" && item.identificador && item.identificador.trim() !== "") {
        displayName = `${item.nombre} (${item.identificador})`;
    }
    
    return {
        uuid: item.uuid,
        nombre: displayName
    };
};

export function ActuadoresAgregar({ onActuadorCreado }: ActuadoresAgregarProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { triggerRefresh } = useRefreshTableActuadores();

    // Estados para OptionInfinito de Tipos de Actuador
    const [tiposActuadorRaw, setTiposActuadorRaw] = useState<TipoActuadorItem[]>([]);
    const [tiposActuadorFormatted, setTiposActuadorFormatted] = useState<{uuid: string; nombre: string}[]>([]);
    const [loadingTiposActuador, setLoadingTiposActuador] = useState(false);
    const [loadingMoreTiposActuador, setLoadingMoreTiposActuador] = useState(false);
    const [hasMoreTiposActuador, setHasMoreTiposActuador] = useState(true);
    const [tiposActuadorPage, setTiposActuadorPage] = useState(1);

    // Estados para OptionInfinito de DAQs
    const [daqsRaw, setDaqsRaw] = useState<DaqItem[]>([]);
    const [daqsFormatted, setDaqsFormatted] = useState<{uuid: string; nombre: string}[]>([]);
    const [loadingDaqs, setLoadingDaqs] = useState(false);
    const [loadingMoreDaqs, setLoadingMoreDaqs] = useState(false);
    const [hasMoreDaqs, setHasMoreDaqs] = useState(true);
    const [daqsPage, setDaqsPage] = useState(1);

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
            installBoolean: true,
            controlBoolean: true,
            recoveryBoolean: true,
            localBoolean: false,
            habilitacionBoolean: true
        }
    });

    const watchInstall = watch("installBoolean");
    const watchControl = watch("controlBoolean");
    const watchRecovery = watch("recoveryBoolean");
    const watchLocal = watch("localBoolean");
    const watchHabilitacion = watch("habilitacionBoolean");
    const tipoActuadorValue = watch("id_tipo_actuador");
    const daqValue = watch("id_daq");

    // ✅ Cargar datos iniciales
    useEffect(() => {
        fetchTiposActuador(1, "", true);
        fetchDaqs(1, "", true);
    }, []);

    // ✅ Función para cargar Tipos de Actuador
    const fetchTiposActuador = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
        try {
            if (resetData) {
                setLoadingTiposActuador(true);
            } else {
                setLoadingMoreTiposActuador(true);
            }

            const response = await tipoActuadoresService.getTipoActuadores({
                page: page,
                size: 20,
                sortBy: "nombre",
                sortOrder: "asc",
                nombre: searchTerm
            });

            const nuevosTipos: TipoActuadorItem[] = response.data.data.map((tipo: any) => ({
                uuid: tipo.uuid,
                nombre: tipo.nombre || "",
                identificador: tipo.identificador || ""
            }));

            // Formatear para OptionInfinito
            const formattedTipos = nuevosTipos.map(formatForOptionInfinito);

            if (resetData) {
                setTiposActuadorRaw(nuevosTipos);
                setTiposActuadorFormatted(formattedTipos);
                setTiposActuadorPage(1);
            } else {
                setTiposActuadorRaw(prev => [...prev, ...nuevosTipos]);
                setTiposActuadorFormatted(prev => [...prev, ...formattedTipos]);
                setTiposActuadorPage(page);
            }

            const currentPage = response.data.pager.currentPage;
            const totalPages = response.data.pager.totalPages;
            setHasMoreTiposActuador(currentPage < totalPages);

        } catch (error) {
            console.error("Error cargando tipos de actuador:", error);
        } finally {
            setLoadingTiposActuador(false);
            setLoadingMoreTiposActuador(false);
        }
    }, []);

    // ✅ Función para cargar DAQs
    const fetchDaqs = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
        try {
            if (resetData) {
                setLoadingDaqs(true);
            } else {
                setLoadingMoreDaqs(true);
            }

            const response = await DaqService.getDaqs({
                page: page,
                size: 20,
                sortBy: "nombre",
                sortOrder: "asc",
                nombre: searchTerm
            });

            const nuevosDaqs: DaqItem[] = response.data.data.map((daq: any) => ({
                uuid: daq.uuid,
                nombre: daq.nombre || "",
                identificador: daq.identificador || ""
            }));

            // Formatear para OptionInfinito
            const formattedDaqs = nuevosDaqs.map(formatForOptionInfinito);

            if (resetData) {
                setDaqsRaw(nuevosDaqs);
                setDaqsFormatted(formattedDaqs);
                setDaqsPage(1);
            } else {
                setDaqsRaw(prev => [...prev, ...nuevosDaqs]);
                setDaqsFormatted(prev => [...prev, ...formattedDaqs]);
                setDaqsPage(page);
            }

            const currentPage = response.data.pager.currentPage;
            const totalPages = response.data.pager.totalPages;
            setHasMoreDaqs(currentPage < totalPages);

        } catch (error) {
            console.error("Error cargando DAQs:", error);
        } finally {
            setLoadingDaqs(false);
            setLoadingMoreDaqs(false);
        }
    }, []);

    // ✅ Handler para búsqueda de Tipos de Actuador
    const handleSearchTiposActuador = useCallback((searchTerm: string) => {
        fetchTiposActuador(1, searchTerm, true);
    }, [fetchTiposActuador]);

    // ✅ Handler para búsqueda de DAQs
    const handleSearchDaqs = useCallback((searchTerm: string) => {
        fetchDaqs(1, searchTerm, true);
    }, [fetchDaqs]);

    // ✅ Handler para cargar más Tipos de Actuador
    const handleLoadMoreTiposActuador = useCallback(() => {
        if (!loadingMoreTiposActuador && hasMoreTiposActuador) {
            fetchTiposActuador(tiposActuadorPage + 1, "", false);
        }
    }, [fetchTiposActuador, loadingMoreTiposActuador, hasMoreTiposActuador, tiposActuadorPage]);

    // ✅ Handler para cargar más DAQs
    const handleLoadMoreDaqs = useCallback(() => {
        if (!loadingMoreDaqs && hasMoreDaqs) {
            fetchDaqs(daqsPage + 1, "", false);
        }
    }, [fetchDaqs, loadingMoreDaqs, hasMoreDaqs, daqsPage]);

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
            const actuadorData: CreateActuadorData = {
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

            await actuadoresService.createActuador(actuadorData);
            reset();
            triggerRefresh();
            onActuadorCreado?.();
        } catch (err: any) {
            console.error("Error al crear actuador:", err);
            setError(err.response?.data?.message || "Error al crear el actuador");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Campos en dos columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1 */}
                <div className="space-y-4">
                    {/* Tipo de Actuador (OptionInfinito) */}
                    <div className="space-y-2">
                        <Label htmlFor="id_tipo_actuador" className="text-sm font-medium">
                            Tipo de Actuador *
                        </Label>
                        
                        <OptionInfinito
                            data={tiposActuadorFormatted}
                            value={tipoActuadorValue}
                            onChange={(value) => setValue("id_tipo_actuador", value)}
                            onSearch={handleSearchTiposActuador}
                            onLoadMore={handleLoadMoreTiposActuador}
                            hasMore={hasMoreTiposActuador}
                            isLoading={loadingMoreTiposActuador}
                            loading={loadingTiposActuador}
                            placeholder="Buscar o seleccionar tipo de actuador..."
                        />
                        
                        <input
                            type="hidden"
                            {...register("id_tipo_actuador", {
                                required: "El tipo de actuador es requerido"
                            })}
                        />
                        
                        {errors.id_tipo_actuador && (
                            <p className="text-sm text-red-500 mt-1">{errors.id_tipo_actuador.message}</p>
                        )}
                        
                        {/* Contador y limpiar selección */}
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                                {tiposActuadorFormatted.length} tipos cargados
                            </p>
                            
                            {tipoActuadorValue && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setValue("id_tipo_actuador", "")}
                                    className="h-7 px-2 text-xs"
                                    disabled={loading}
                                >
                                    Limpiar selección
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* DAQ (OptionInfinito) */}
                    <div className="space-y-2">
                        <Label htmlFor="id_daq" className="text-sm font-medium">
                            DAQ *
                        </Label>
                        
                        <OptionInfinito
                            data={daqsFormatted}
                            value={daqValue}
                            onChange={(value) => setValue("id_daq", value)}
                            onSearch={handleSearchDaqs}
                            onLoadMore={handleLoadMoreDaqs}
                            hasMore={hasMoreDaqs}
                            isLoading={loadingMoreDaqs}
                            loading={loadingDaqs}
                            placeholder="Buscar o seleccionar DAQ..."
                        />
                        
                        <input
                            type="hidden"
                            {...register("id_daq", {
                                required: "El DAQ es requerido"
                            })}
                        />
                        
                        {errors.id_daq && (
                            <p className="text-sm text-red-500 mt-1">{errors.id_daq.message}</p>
                        )}
                        
                        {/* Contador y limpiar selección */}
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                                {daqsFormatted.length} DAQs cargados
                            </p>
                            
                            {daqValue && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setValue("id_daq", "")}
                                    className="h-7 px-2 text-xs"
                                    disabled={loading}
                                >
                                    Limpiar selección
                                </Button>
                            )}
                        </div>
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

            {/* Switches en grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t">
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
            <div className="flex gap-3 pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onActuadorCreado}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                        </>
                    ) : "Crear Actuador"}
                </Button>
            </div>
        </form>
    );
}