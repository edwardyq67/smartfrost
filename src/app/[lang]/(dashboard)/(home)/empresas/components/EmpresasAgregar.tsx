"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Edit, Save, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { EmpresaService, CreateEmpresaData } from "@/lib/empresas/UseEmpresas";
import { useRefreshTableEmpresas } from "@/store/empresas/refresTableEmpresas";
import { archivosService } from "@/lib/archivos/UseArchivos";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ✅ Cargar MapPicker dinámicamente CON SUSPENSE Y KEY DINÁMICO
const MapPicker = dynamic(() => import('@/components/map/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 md:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface EmpresasAgregarProps {
  onEmpresaCreada?: () => void;
}

export const EmpresasAgregar = ({ onEmpresaCreada }: EmpresasAgregarProps) => {
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedImagen, setSelectedImagen] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingImagen, setIsUploadingImagen] = useState(false);

  // ✅ Nuevo estado para editar dirección
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState<string>("");

  // ✅ REFS para optimización
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagenInputRef = useRef<HTMLInputElement>(null);
  const lastCoordenadasRef = useRef<string>("");
  const hasMountedRef = useRef(false);

  const { triggerRefresh } = useRefreshTableEmpresas();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger,
    clearErrors,
    getValues
  } = useForm<CreateEmpresaData>({
    defaultValues: {
      nombre: "",
      telefono: "",
      coordenadas: ""
    },
    mode: "onChange"
  });

  const coordenadas = watch("coordenadas");
  const nombre = watch("nombre");

  // ✅ useCallback para evitar recreación de función
  const handleLocationSelect = useCallback((lat: number, lng: number, address: string) => {
    const coordenadasString = `${lat}, ${lng}`;

    // ✅ Solo actualizar si realmente cambió
    if (coordenadas !== coordenadasString) {
      setValue("coordenadas", coordenadasString, { shouldDirty: true, shouldValidate: true });
    }

    // ✅ Comparar antes de actualizar estado
    if (!selectedPosition || selectedPosition[0] !== lat || selectedPosition[1] !== lng) {
      setSelectedPosition([lat, lng]);
    }

    if (selectedAddress !== address) {
      setSelectedAddress(address);
    }
  }, [coordenadas, selectedPosition, selectedAddress, setValue]);

  // ✅ Efecto para actualizar posición desde coordenadas CON DEBOUNCING
  useEffect(() => {
    if (!coordenadas || coordenadas === lastCoordenadasRef.current) return;

    const timer = setTimeout(() => {
      try {
        const [lat, lng] = coordenadas.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          const newPosition: [number, number] = [lat, lng];
          if (!selectedPosition || selectedPosition[0] !== lat || selectedPosition[1] !== lng) {
            setSelectedPosition(newPosition);
          }
          lastCoordenadasRef.current = coordenadas;
        }
      } catch (error) {
        console.error("Error parsing coordinates:", error);
      }
    }, 300); // 300ms de debouncing

    return () => clearTimeout(timer);
  }, [coordenadas, selectedPosition]);

  // ✅ useCallback para handlers de archivos
  const handleLogoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setBackendError("La imagen del logo es demasiado grande. El tamaño máximo permitido es 2MB.");
        return;
      }

      // ✅ Solo actualizar si realmente cambió
      if (selectedLogo !== file) {
        setSelectedLogo(file);
      }

      setBackendError(null);
      clearErrors();

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreview = e.target?.result as string;
        if (newPreview !== logoPreview) {
          setLogoPreview(newPreview);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [selectedLogo, logoPreview, clearErrors]);

  const handleImagenSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setBackendError("La imagen es demasiado grande. El tamaño máximo permitido es 2MB.");
        return;
      }

      // ✅ Solo actualizar si realmente cambió
      if (selectedImagen !== file) {
        setSelectedImagen(file);
      }

      setBackendError(null);
      clearErrors();

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreview = e.target?.result as string;
        if (newPreview !== imagenPreview) {
          setImagenPreview(newPreview);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [selectedImagen, imagenPreview, clearErrors]);

  const handleLogoClick = useCallback(() => {
    logoInputRef.current?.click();
  }, []);

  const handleImagenClick = useCallback(() => {
    imagenInputRef.current?.click();
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["nombre"]);
      if (isValid) {
        setCurrentStep(2);
      }
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  const removeLogo = useCallback(() => {
    setSelectedLogo(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, []);

  const removeImagen = useCallback(() => {
    setSelectedImagen(null);
    setImagenPreview(null);
    if (imagenInputRef.current) {
      imagenInputRef.current.value = "";
    }
  }, []);

  // ✅ Funciones para editar dirección
  const startEditingAddress = useCallback(() => {
    setTempAddress(selectedAddress);
    setIsEditingAddress(true);
  }, [selectedAddress]);

  const saveAddress = useCallback(() => {
    setSelectedAddress(tempAddress);
    setIsEditingAddress(false);
  }, [tempAddress]);

  const cancelEditingAddress = useCallback(() => {
    setIsEditingAddress(false);
    setTempAddress("");
  }, []);

  const handleTempAddressChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempAddress(e.target.value);
  }, []);

  // ✅ onSubmit optimizado
  const onSubmit = useCallback(async (data: CreateEmpresaData) => {
    try {
      setLoading(true);
      setBackendError(null);
      clearErrors();

      let logoUrl = "";
      let imagenUrl = "";

      // Subir logo si existe
      if (selectedLogo) {
        try {
          setIsUploadingLogo(true);
          const response = await archivosService.uploadArchivo({
            file: selectedLogo,
            carpeta: "EMPRESAS",
            nombre: `logo_${data.nombre.replace(/\s+/g, '_')}_${Date.now()}`
          });
          logoUrl = response.data.url;
        } catch (uploadError: any) {
          let uploadErrorMessage = "Error al subir el logo";
          if (uploadError.response?.data) {
            const errorData = uploadError.response.data;
            if (errorData.messages?.error) {
              uploadErrorMessage = errorData.messages.error;
            } else if (errorData.message) {
              uploadErrorMessage = errorData.message;
            }
          }
          setBackendError(uploadErrorMessage);
          setIsUploadingLogo(false);
          return;
        } finally {
          setIsUploadingLogo(false);
        }
      }

      // Subir imagen si existe
      if (selectedImagen) {
        try {
          setIsUploadingImagen(true);
          const response = await archivosService.uploadArchivo({
            file: selectedImagen,
            carpeta: "EMPRESAS",
            nombre: `imagen_${data.nombre.replace(/\s+/g, '_')}_${Date.now()}`
          });
          imagenUrl = response.data.url;
        } catch (uploadError: any) {
          let uploadErrorMessage = "Error al subir la imagen";
          if (uploadError.response?.data) {
            const errorData = uploadError.response.data;
            if (errorData.messages?.error) {
              uploadErrorMessage = errorData.messages.error;
            } else if (errorData.message) {
              uploadErrorMessage = errorData.message;
            }
          }
          setBackendError(uploadErrorMessage);
          setIsUploadingImagen(false);
          return;
        } finally {
          setIsUploadingImagen(false);
        }
      }

      const empresaData: CreateEmpresaData = {
        nombre: data.nombre,
        logo: logoUrl || undefined,
        imagen: imagenUrl || undefined,
        direccion: selectedAddress || undefined, // ✅ Usa la dirección editada
        telefono: data.telefono || undefined,
        coordenadas: data.coordenadas || undefined
      };

      await EmpresaService.createEmpresa(empresaData);

      // ✅ Reset con opciones optimizadas
      reset({
        nombre: "",
        telefono: "",
        coordenadas: ""
      }, {
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepIsValid: false,
        keepSubmitCount: false,
        keepValues: false,
        keepDefaultValues: false
      });

      setSelectedPosition(null);
      setSelectedAddress("");
      setSelectedLogo(null);
      setSelectedImagen(null);
      setLogoPreview(null);
      setImagenPreview(null);
      setCurrentStep(1);
      setIsEditingAddress(false);
      setTempAddress("");

      if (logoInputRef.current) logoInputRef.current.value = "";
      if (imagenInputRef.current) imagenInputRef.current.value = "";

      triggerRefresh();
      onEmpresaCreada?.();

    } catch (err: any) {
      console.error("Error al crear empresa:", err);

      let errorMessage = "Error al crear la empresa";
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.messages?.error) {
          errorMessage = errorData.messages.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      setBackendError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedLogo, selectedImagen, selectedAddress, clearErrors, reset, triggerRefresh, onEmpresaCreada]);

  const handleCancel = useCallback(() => {
    reset({
      nombre: "",
      telefono: "",
      coordenadas: ""
    }, {
      keepDirty: false,
      keepErrors: false,
      keepIsSubmitted: false,
      keepIsValid: false,
      keepSubmitCount: false,
      keepValues: false,
      keepDefaultValues: false
    });

    setSelectedPosition(null);
    setSelectedAddress("");
    setSelectedLogo(null);
    setSelectedImagen(null);
    setLogoPreview(null);
    setImagenPreview(null);
    setCurrentStep(1);
    setIsEditingAddress(false);
    setTempAddress("");
    setBackendError(null);
    clearErrors();

    if (logoInputRef.current) logoInputRef.current.value = "";
    if (imagenInputRef.current) imagenInputRef.current.value = "";

    onEmpresaCreada?.();
  }, [reset, clearErrors, onEmpresaCreada]);

  // ✅ Memoizar estado de envío
  const isFormSubmitting = useMemo(() => {
    return isSubmitting || loading || isUploadingLogo || isUploadingImagen;
  }, [isSubmitting, loading, isUploadingLogo, isUploadingImagen]);

  // ✅ Memoizar key del MapPicker
  const mapPickerKey = useMemo(() => {
    return `map-agregar-${selectedPosition?.[0] || 'none'}-${selectedPosition?.[1] || 'none'}`;
  }, [selectedPosition]);

  // ✅ Solo ejecutar efectos después del primer mount
  useEffect(() => {
    hasMountedRef.current = true;
    return () => {
      hasMountedRef.current = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Error general */}
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
              ✕
            </button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre de la Empresa */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre" className="text-sm font-medium">
                Nombre de la Empresa *
              </Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Teknisolutions S.A.C."
                {...register("nombre", {
                  required: "El nombre de la empresa es obligatorio",
                  minLength: {
                    value: 2,
                    message: "El nombre debe tener al menos 2 caracteres"
                  }
                })}
                className="w-full"
                disabled={isFormSubmitting}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
              )}
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Logo de la Empresa</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={handleLogoClick}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center p-2">
                      Click para subir logo
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    ref={logoInputRef}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    {logoPreview ? "Logo seleccionado" : "Selecciona un logo"}
                  </p>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      className="mt-2 text-xs"
                      disabled={isFormSubmitting}
                    >
                      Quitar logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Imagen de la Empresa</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={handleImagenClick}
                >
                  {imagenPreview ? (
                    <img
                      src={imagenPreview}
                      alt="Imagen preview"
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center p-2">
                      Click para subir imagen
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImagenSelect}
                    ref={imagenInputRef}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    {imagenPreview ? "Imagen seleccionada" : "Selecciona una imagen"}
                  </p>
                  {imagenPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImagen}
                      className="mt-2 text-xs"
                      disabled={isFormSubmitting}
                    >
                      Quitar imagen
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">
                Teléfono/Celular
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+51 987 654 321"
                {...register("telefono")}
                className="w-full"
                disabled={isFormSubmitting}
              />
              {errors.telefono && (
                <p className="text-sm text-red-500 mt-1">{errors.telefono.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MapPicker
                  key={mapPickerKey} // ✅ KEY DINÁMICO para forzar re-mount si cambia posición
                  onLocationSelect={handleLocationSelect}
                  initialPosition={selectedPosition || undefined}
                />
              </div>

              {/* ✅ SECCIÓN EDITABLE DE DIRECCIÓN */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                {isEditingAddress ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Editar dirección:
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs border-blue-300 dark:border-blue-600"
                          onClick={saveAddress}
                          disabled={isFormSubmitting}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          onClick={cancelEditingAddress}
                          disabled={isFormSubmitting}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={tempAddress}
                      onChange={handleTempAddressChange}
                      placeholder="Escribe la dirección aquí..."
                      className="w-full min-h-[100px] text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={isFormSubmitting}
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      La dirección que escribas aquí será la que se guarde al crear la empresa.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Dirección seleccionada:
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        onClick={startEditingAddress}
                        disabled={isFormSubmitting}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                    {selectedAddress ? (
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-800">
                          {selectedAddress}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                          Puedes editar esta dirección si necesitas ajustarla
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        Haz click en el mapa para seleccionar la ubicación
                      </p>
                    )}
                  </div>
                )}

                {selectedPosition && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Coordenadas: {selectedPosition[0]}, {selectedPosition[1]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        {currentStep === 1 ? (
          <>
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
              type="button"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={nextStep}
              disabled={isFormSubmitting}
            >
              Continuar a Ubicación
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={prevStep}
              disabled={isFormSubmitting}
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a Información
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isFormSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isFormSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isUploadingLogo || isUploadingImagen
                    ? "Subiendo imágenes..."
                    : "Creando empresa..."}
                </>
              ) : "Crear Empresa"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};