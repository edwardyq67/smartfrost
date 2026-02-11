"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, MapPin, Edit, Save, X } from "lucide-react";
import { Empresa, EmpresaService, UpdateEmpresaData } from "@/lib/empresas/UseEmpresas";
import { useRefreshTableEmpresas } from "@/store/empresas/refresTableEmpresas";
import { archivosService } from "@/lib/archivos/UseArchivos";
import dynamic from 'next/dynamic';
import { Textarea } from "@/components/ui/textarea";

// ✅ Cargar MapPicker dinámicamente CON SUSPENSE
const MapPicker = dynamic(() => import('@/components/map/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 md:h-96 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface EmpresasEditarProps {
  empresa: Empresa;
  onEmpresaEditada: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmpresasEditar = ({
  empresa,
  onEmpresaEditada,
  open,
  onOpenChange
}: EmpresasEditarProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [mapAddress, setMapAddress] = useState<string>(""); // ✅ Dirección del MapPicker
  const [editedAddress, setEditedAddress] = useState<string>(""); // ✅ Dirección editada manualmente
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedImagen, setSelectedImagen] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  
  // ✅ Nuevos estados para editar dirección
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState<string>("");
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagenInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ REFS para evitar re-renders innecesarios
  const isInitializedRef = useRef(false);
  const lastEmpresaIdRef = useRef<string | null>(null);
  const ignoreMapUpdateRef = useRef(false); // ✅ Para evitar bucles

  const { triggerRefresh } = useRefreshTableEmpresas();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<UpdateEmpresaData>();

  const coordenadas = watch("coordenadas");
  const direccion = watch("direccion");

  // ✅ Inicializar datos de la empresa CON OPTIMIZACIÓN
  useEffect(() => {
    if (!open || !empresa) return;
    
    // ✅ Evitar inicialización múltiple
    if (lastEmpresaIdRef.current === empresa.uuid && isInitializedRef.current) {
      return;
    }

    const coordenadasParsed = parseCoordenadas(empresa.coordenadas || "");

    reset({
      nombre: empresa.nombre || "",
      direccion: empresa.direccion || "",
      telefono: empresa.telefono || "",
      coordenadas: empresa.coordenadas || ""
    });

    setSelectedPosition(coordenadasParsed);
    setMapAddress(empresa.direccion || ""); // ✅ Inicializar mapAddress
    setEditedAddress(empresa.direccion || ""); // ✅ Inicializar editedAddress

    // ✅ Usar useRef para imágenes para evitar re-renders
    if (empresa.logo !== logoPreview) {
      setLogoPreview(empresa.logo);
    }
    if ((empresa as any).imagen !== imagenPreview) {
      setImagenPreview((empresa as any).imagen);
    }

    setCurrentStep(1);
    setError(null);
    setSelectedLogo(null);
    setSelectedImagen(null);
    setIsEditingAddress(false);
    setTempAddress("");
    ignoreMapUpdateRef.current = false;

    // ✅ Limpiar inputs de archivos
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (imagenInputRef.current) imagenInputRef.current.value = '';

    // ✅ Marcar como inicializado
    lastEmpresaIdRef.current = empresa.uuid;
    isInitializedRef.current = true;

    return () => {
      isInitializedRef.current = false;
    };
  }, [open, empresa, reset, logoPreview, imagenPreview]);

  const parseCoordenadas = (coordenadas: string) => {
    if (!coordenadas) return null;
    try {
      const [lat, lng] = coordenadas.split(',').map(coord => parseFloat(coord.trim()));
      return isNaN(lat) || isNaN(lng) ? null : [lat, lng] as [number, number];
    } catch {
      return null;
    }
  };

  // ✅ useCallback para evitar recreación de función en cada render
  const handleLocationSelect = useCallback((lat: number, lng: number, address: string) => {
    const coordenadasString = `${lat}, ${lng}`;
    
    // ✅ Solo actualizar si realmente cambió
    if (coordenadas !== coordenadasString) {
      setValue("coordenadas", coordenadasString, { shouldDirty: true });
    }
    
    // ✅ Comparar antes de actualizar estado
    if (!selectedPosition || selectedPosition[0] !== lat || selectedPosition[1] !== lng) {
      setSelectedPosition([lat, lng]);
    }
    
    if (mapAddress !== address) {
      setMapAddress(address);
      // ✅ Cuando el MapPicker encuentra una dirección, también actualizamos la editada
      setEditedAddress(address);
      setValue("direccion", address, { shouldDirty: true });
    }
  }, [coordenadas, selectedPosition, mapAddress, setValue]);

  // ✅ Funciones para editar dirección
  const startEditingAddress = useCallback(() => {
    setTempAddress(editedAddress); // ✅ Usar editedAddress en lugar de selectedAddress
    setIsEditingAddress(true);
  }, [editedAddress]);

  const saveAddress = useCallback(() => {
    setEditedAddress(tempAddress);
    setValue("direccion", tempAddress, { shouldDirty: true });
    setIsEditingAddress(false);
    
    // ✅ Marcar que no debemos actualizar el MapPicker desde esta edición
    ignoreMapUpdateRef.current = true;
  }, [tempAddress, setValue]);

  const cancelEditingAddress = useCallback(() => {
    setIsEditingAddress(false);
    setTempAddress("");
    ignoreMapUpdateRef.current = false;
  }, []);

  const handleTempAddressChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempAddress(e.target.value);
  }, []);

  // ✅ Función para manejar cambios desde el MapPicker
  const handleMapDireccionChange = useCallback((direccion: string) => {
    // ✅ Solo actualizar si no estamos ignorando (por edición manual)
    if (!ignoreMapUpdateRef.current && mapAddress !== direccion) {
      setMapAddress(direccion);
      setEditedAddress(direccion); // ✅ Sincronizar con la dirección editada
      setValue("direccion", direccion, { shouldDirty: true });
    }
  }, [mapAddress, setValue]);

  // ✅ CORREGIDO: Handlers de imágenes sin dependencias problemáticas
  const handleLogoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("La imagen del logo es demasiado grande. El tamaño máximo permitido es 2MB.");
        return;
      }
      setSelectedLogo(file);
      setError(null);
      
      // ✅ Crear URL temporal para preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  }, []);

  const handleImagenSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("La imagen es demasiado grande. El tamaño máximo permitido es 2MB.");
        return;
      }
      setSelectedImagen(file);
      setError(null);
      
      // ✅ Crear URL temporal para preview
      const previewUrl = URL.createObjectURL(file);
      setImagenPreview(previewUrl);
    }
  }, []);

  const handleLogoClick = useCallback(() => {
    logoInputRef.current?.click();
  }, []);

  const handleImagenClick = useCallback(() => {
    imagenInputRef.current?.click();
  }, []);

  // ✅ CORREGIDO: Funciones para remover imágenes
  const removeLogo = useCallback(() => {
    setSelectedLogo(null);
    
    // ✅ Si había una URL temporal, revocarla
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    
    // ✅ Restaurar logo original
    setLogoPreview(empresa.logo || null);
    
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }, [empresa.logo]);

  const removeImagen = useCallback(() => {
    setSelectedImagen(null);
    
    // ✅ Si había una URL temporal, revocarla
    if (imagenPreview && imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagenPreview);
    }
    
    // ✅ Restaurar imagen original
    setImagenPreview((empresa as any).imagen || null);
    
    if (imagenInputRef.current) {
      imagenInputRef.current.value = '';
    }
  }, [empresa]);

 const nextStep = useCallback(async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["nombre"]);
      if (isValid) {
        setCurrentStep(2);
      }
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const onSubmit = useCallback(async (data: UpdateEmpresaData) => {
    setLoading(true);
    setError(null);

    try {
      let logoUrl = empresa.logo || "";
      let imagenUrl = (empresa as any).imagen || "";

      const nombreEmpresa = data.nombre || empresa.nombre || "empresa";

      // Subir nuevo logo si se seleccionó uno
      if (selectedLogo) {
        try {
          const response = await archivosService.uploadArchivo({
            file: selectedLogo,
            carpeta: "EMPRESAS",
            nombre: `logo_${nombreEmpresa.replace(/\s+/g, '_')}_${Date.now()}`
          });
          logoUrl = response.data.url;
        } catch (uploadError: any) {
          const uploadErrorMessage = uploadError.response?.data?.error ||
            uploadError.response?.data?.message ||
            uploadError.message ||
            "Error al subir el logo";
          setError(uploadErrorMessage);
          setLoading(false);
          return;
        }
      }

      // Subir nueva imagen si se seleccionó una
      if (selectedImagen) {
        try {
          const response = await archivosService.uploadArchivo({
            file: selectedImagen,
            carpeta: "EMPRESAS",
            nombre: `imagen_${nombreEmpresa.replace(/\s+/g, '_')}_${Date.now()}`
          });
          imagenUrl = response.data.url;
        } catch (uploadError: any) {
          const uploadErrorMessage = uploadError.response?.data?.error ||
            uploadError.response?.data?.message ||
            uploadError.message ||
            "Error al subir la imagen";
          setError(uploadErrorMessage);
          setLoading(false);
          return;
        }
      }

      // ✅ USAR LA DIRECCIÓN EDITADA (editedAddress) - esta es la que el usuario escribió
      const empresaData: UpdateEmpresaData = {
        nombre: data.nombre || empresa.nombre,
        logo: logoUrl || undefined,
        imagen: imagenUrl || undefined,
        direccion: editedAddress || data.direccion || undefined, // ✅ Cambiado a editedAddress
        telefono: data.telefono || undefined,
        coordenadas: data.coordenadas || undefined
      };

      await EmpresaService.updateEmpresa(empresa.uuid, empresaData);

      triggerRefresh();
      onEmpresaEditada();
      onOpenChange(false);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al actualizar la empresa";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [empresa, selectedLogo, selectedImagen, editedAddress, triggerRefresh, onEmpresaEditada, onOpenChange]);

  const handleCancel = useCallback(() => {
    // Restaurar valores originales
    reset({
      nombre: empresa.nombre || "",
      direccion: empresa.direccion || "",
      telefono: empresa.telefono || "",
      coordenadas: empresa.coordenadas || ""
    });

    const coordenadasParsed = parseCoordenadas(empresa.coordenadas || "");
    setSelectedPosition(coordenadasParsed);
    setMapAddress(empresa.direccion || "");
    setEditedAddress(empresa.direccion || "");

    if (empresa.logo !== logoPreview) {
      setLogoPreview(empresa.logo);
    }

    if ((empresa as any).imagen !== imagenPreview) {
      setImagenPreview((empresa as any).imagen);
    }

    setSelectedLogo(null);
    setSelectedImagen(null);
    setCurrentStep(1);
    setError(null);
    setIsEditingAddress(false);
    setTempAddress("");
    ignoreMapUpdateRef.current = false;

    if (logoInputRef.current) logoInputRef.current.value = "";
    if (imagenInputRef.current) imagenInputRef.current.value = "";

    onOpenChange(false);
  }, [empresa, reset, logoPreview, imagenPreview, onOpenChange]);

  if (!open) return null;

  return (
    <div className="space-y-6">
      {/* Error general */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Paso 1: Información Básica */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                disabled={loading}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.nombre.message}</p>
              )}
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Logo de la Empresa
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-800"
                    onClick={handleLogoClick}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-xs text-center p-2">
                        Click para subir logo
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      disabled={loading}
                    >
                      ×
                    </button>
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
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    {selectedLogo ? "Nuevo logo seleccionado" :
                      empresa.logo ? "Logo actual" : "Selecciona un logo"}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                    Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagen de la Empresa
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-800"
                    onClick={handleImagenClick}
                  >
                    {imagenPreview ? (
                      <img
                        src={imagenPreview}
                        alt="Imagen preview"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-xs text-center p-2">
                        Click para subir imagen
                      </div>
                    )}
                  </div>
                  {imagenPreview && (
                    <button
                      type="button"
                      onClick={removeImagen}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      disabled={loading}
                    >
                      ×
                    </button>
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
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    {selectedImagen ? "Nueva imagen seleccionada" :
                      (empresa as any).imagen ? "Imagen actual" : "Selecciona una imagen"}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                    Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-gray-700 dark:text-gray-300">
                Teléfono/Celular
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+51 987 654 321"
                {...register("telefono")}
                className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                disabled={loading}
              />
              {errors.telefono && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.telefono.message}</p>
              )}
            </div>

            {/* Dirección (solo lectura en paso 1) */}
            <div className="space-y-2">
              <Label htmlFor="direccion" className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                Dirección
              </Label>
              <div className="min-h-[40px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {empresa.direccion || "Sin dirección asignada"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Modifica la dirección en el paso de ubicación
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Mapa */}
            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <MapPicker
                  onLocationSelect={handleLocationSelect}
                  initialPosition={selectedPosition || undefined}
                  setDireccion={handleMapDireccionChange} // ✅ Nueva función separada
                  direccionInicial={mapAddress} // ✅ Solo usa mapAddress
                  key={`map-${selectedPosition?.[0]}-${selectedPosition?.[1]}`}
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
                          disabled={loading}
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
                          disabled={loading}
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
                      disabled={loading}
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      La dirección que escribas aquí será la que se guarde al actualizar la empresa.
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
                        disabled={loading}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                    {editedAddress ? ( // ✅ Mostrar editedAddress, no mapAddress
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-800">
                          {editedAddress}
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
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {currentStep === 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={nextStep}
              disabled={loading}
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
              className="flex-1 flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600"
              onClick={prevStep}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a Información
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};