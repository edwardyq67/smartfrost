// app/mapas/components/MapaEditar.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { MapaService, UpdateMapaData, Mapa } from "@/lib/mapa/UseMapa";
import { useRefreshTableMapa } from "@/store/mapa/refresTableMapa";
import { archivosService } from "@/lib/archivos/UseArchivos";
import { Image, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MapaEditarProps {
  uuid: string;
  onMapaEditado?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MapaEditar({ uuid, onMapaEditado, open, onOpenChange }: MapaEditarProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapaData, setMapaData] = useState<Mapa | null>(null);
  const [selectedImagen, setSelectedImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const imagenInputRef = useRef<HTMLInputElement>(null);

  const { triggerRefresh } = useRefreshTableMapa();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateMapaData>();

  const nombre = watch("nombre");
  const imagenUrl = watch("imagen");

  // ✅ Cargar datos del mapa cuando se abre el diálogo
  useEffect(() => {
    if (open && uuid) {
      fetchMapaData();
    }
  }, [open, uuid]);

  const fetchMapaData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const response = await MapaService.getMapaById(uuid);

      // ✅ CORRECCIÓN: response.data es el objeto Mapa individual
      const mapaInfo = response.data as Mapa;

      setMapaData(mapaInfo);

      // ✅ Establecer valores en el formulario
      setValue("nombre", mapaInfo.nombre || "");
      setValue("imagen", mapaInfo.imagen || "");

      // ✅ Establecer preview de la imagen existente
      if (mapaInfo.imagen) {
        setImagenPreview(mapaInfo.imagen);
      }

    } catch (err: any) {
      console.error("Error al cargar datos del mapa:", err);
      setError("Error al cargar los datos del mapa");
    } finally {
      setLoadingData(false);
    }
  };

  const handleImagenSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError("Por favor selecciona una imagen válida (JPEG, PNG, WEBP o GIF)");
        return;
      }

      // Validar tamaño (2MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("La imagen es demasiado grande. El tamaño máximo permitido es 2MB.");
        return;
      }

      setSelectedImagen(file);
      setError(null);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Limpiar el campo de URL cuando se sube un archivo
      setValue("imagen", "");
    }
  };

  const removeImagen = () => {
    setSelectedImagen(null);
    setImagenPreview(mapaData?.imagen || null); // Volver a la imagen original
    if (imagenInputRef.current) {
      imagenInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: UpdateMapaData) => {
    setLoading(true);
    setError(null);

    try {
      let imagenUrl = mapaData?.imagen || "";

      // Subir nueva imagen si se seleccionó una
      if (selectedImagen) {
        try {
          const nombreArchivo = `mapa_${data.nombre?.replace(/\s+/g, '_') || mapaData?.nombre?.replace(/\s+/g, '_') || 'mapa'}_${Date.now()}`;
          
          const response = await archivosService.uploadArchivo({
            file: selectedImagen,
            carpeta: "MAPAS",
            nombre: nombreArchivo
          });
          imagenUrl = response.data.url;
        } catch (uploadError: any) {
          const uploadErrorMessage = uploadError.response?.data?.error || 
                                   uploadError.response?.data?.message ||
                                   uploadError.message || 
                                   "Error al subir la imagen del mapa";
          setError(uploadErrorMessage);
          setLoading(false);
          return;
        }
      }

      const mapaUpdateData: UpdateMapaData = {
        ...(data.nombre && { nombre: data.nombre }),
        ...(imagenUrl && { imagen: imagenUrl }),
        // Si no hay nueva imagen y se eliminó la URL, mantener la imagen existente
        ...(!imagenUrl && !data.imagen && mapaData?.imagen && { imagen: mapaData.imagen }),
      };

      await MapaService.updateMapa(uuid, mapaUpdateData);
      
      triggerRefresh();
      onMapaEditado?.();
      onOpenChange(false);
      
    } catch (err: any) {
      console.error("Error al actualizar mapa:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message ||
                          "Error al actualizar el mapa";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSelectedImagen(null);
    setImagenPreview(mapaData?.imagen || null);
    setError(null);
    onOpenChange(false);
  };

  // Si el diálogo está cerrado, no renderizar nada
  if (!open) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {loadingData ? (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Cargando datos del mapa...
          </div>
        </div>
      ) : (
        <>
          {/* Campo Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
              Nombre del Mapa *
            </Label>
            <Input
              id="nombre"
              {...register("nombre", {
                required: "El nombre del mapa es requerido",
                minLength: {
                  value: 2,
                  message: "El nombre debe tener al menos 2 caracteres"
                }
              })}
              placeholder="Ej: Mapa de zona industrial, Planta baja, Área de producción"
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Campo Imagen (Subida de archivo) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imagen del Mapa
            </Label>
            
            <div className="flex items-start gap-4">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                  onClick={() => imagenInputRef.current?.click()}
                >
                  {imagenPreview ? (
                    <img 
                      src={imagenPreview} 
                      alt="Vista previa del mapa" 
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center p-2">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">Subir imagen</span>
                    </div>
                  )}
                </div>
                {imagenPreview && (
                  <button
                    type="button"
                    onClick={removeImagen}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenSelect}
                  ref={imagenInputRef}
                  className="hidden"
                />
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedImagen 
                      ? "Nueva imagen seleccionada" 
                      : mapaData?.imagen 
                        ? "Imagen actual" 
                        : "Selecciona una imagen del mapa"
                    }
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    Formatos: JPEG, PNG, WEBP, GIF | Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-1">{error}</p>
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
              disabled={loading || loadingData}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Actualizando...
                </div>
              ) : (
                "Actualizar Mapa"
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}