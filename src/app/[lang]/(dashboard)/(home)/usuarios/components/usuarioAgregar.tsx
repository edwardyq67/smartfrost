"use client";

import { useForm } from "react-hook-form";
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService, CreateUserData } from "@/lib/usuarios/UseUsuarios";
import { useRefreshTableUsuarios } from "@/store/usuarios/refreshTableUsuarios";
import { archivosService } from "@/lib/archivos/UseArchivos";
import { rolesService } from "@/lib/roles/UseRoles";
import { EmpresaService } from "@/lib/empresas/UseEmpresas";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { Loader2 } from "lucide-react";

interface UsuarioFormData {
  nombre: string;
  usuario: string;
  clave: string;
  rol: string;
  empresa: string;
  dni: string;
  avatar?: string;
}

interface Rol {
  uuid: string;
  nombre: string;
}

interface Empresa {
  uuid: string;
  nombre: string;
}

export function UsuarioCrear({ onUsuarioCreado }: { onUsuarioCreado?: () => void }) {
  const { triggerRefresh } = useRefreshTableUsuarios();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  
  // Estados para roles (select normal)
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Estados para OptionInfinito de empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingMoreEmpresas, setLoadingMoreEmpresas] = useState(false);
  const [hasMoreEmpresas, setHasMoreEmpresas] = useState(true);
  const [empresasPage, setEmpresasPage] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
    trigger,
    clearErrors
  } = useForm<UsuarioFormData>({
    defaultValues: {
      nombre: "",
      usuario: "",
      clave: "",
      rol: "",
      empresa: "",
      dni: "",
      avatar: ""
    }
  });

  const rolValue = watch("rol");
  const empresaValue = watch("empresa");
  const dniValue = watch("dni");

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadRoles();
    fetchEmpresas(1, "", true);
  }, []);

  // ✅ Función para cargar roles
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await rolesService.getRoles({
        page: 1,
        size: 100,
        sortBy: "nombre",
        sortOrder: "asc"
      });

      setRoles(response.data.data.map((rol: Rol) => ({
        uuid: rol.uuid,
        nombre: rol.nombre
      })));
    } catch (error) {
      console.error("Error cargando roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // ✅ Función para cargar empresas
  const fetchEmpresas = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    try {
      if (resetData) {
        setLoadingEmpresas(true);
      } else {
        setLoadingMoreEmpresas(true);
      }

      const response = await EmpresaService.getEmpresas({
        page: page,
        size: 20, // Menos datos por página para mejor performance
        sortBy: "nombre",
        sortOrder: "asc",
        nombre: searchTerm
      });

      const nuevasEmpresas = response.data.data.map((empresa: Empresa) => ({
        uuid: empresa.uuid,
        nombre: empresa.nombre
      }));

      if (resetData) {
        setEmpresas(nuevasEmpresas);
        setEmpresasPage(1);
      } else {
        setEmpresas(prev => [...prev, ...nuevasEmpresas]);
        setEmpresasPage(page);
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

  // ✅ Handler para búsqueda de empresas
  const handleSearchEmpresas = useCallback((searchTerm: string) => {
    fetchEmpresas(1, searchTerm, true);
  }, [fetchEmpresas]);

  // ✅ Handler para cargar más empresas
  const handleLoadMoreEmpresas = useCallback(() => {
    if (!loadingMoreEmpresas && hasMoreEmpresas) {
      fetchEmpresas(empresasPage + 1, "", false);
    }
  }, [fetchEmpresas, loadingMoreEmpresas, hasMoreEmpresas, empresasPage]);

  // Efecto para sincronizar DNI con Usuario
  useEffect(() => {
    if (dniValue) {
      setValue("usuario", dniValue);
      trigger("usuario");
    }
  }, [dniValue, setValue, trigger]);

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setBackendError("La imagen es demasiado grande. Máximo 2MB permitido.");
        return;
      }
      
      setSelectedFile(file);
      setBackendError(null);
      clearErrors();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      setIsUploading(true);
      setBackendError(null);
      clearErrors();
      
      let avatarUrl = "";

      if (selectedFile) {
        try {
          const response = await archivosService.uploadArchivo({
            file: selectedFile,
            carpeta: "USUARIOS",
            nombre: data.dni
          });
          
          avatarUrl = response.data.url;
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
          setIsUploading(false);
          return;
        }
      }

      const userData: CreateUserData = {
        nombre: data.nombre,
        usuario: data.usuario,
        clave: data.clave,
        id_rol: data.rol,
        id_empresa: data.empresa || null,
        dni: data.dni,
        avatar: avatarUrl
      };
      
      await userService.createUser(userData);
      reset();
      setSelectedImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      triggerRefresh();
      onUsuarioCreado?.();
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      
      let errorMessage = "Error al crear el usuario";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.messages?.error) {
          errorMessage = errorData.messages.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      setBackendError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const isFormSubmitting = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avatar */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="avatar">Foto de perfil</Label>
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={handleImageClick}
            >
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  Click para subir imagen
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                {selectedImage ? "Imagen seleccionada" : "Selecciona una imagen"}
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo *</Label>
          <Input
            id="nombre"
            type="text"
            placeholder="Ingrese el nombre completo"
            {...register("nombre", {
              required: "El nombre es requerido",
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

        {/* DNI */}
        <div className="space-y-2">
          <Label htmlFor="dni">DNI / Usuario *</Label>
          <Input
            id="dni"
            type="text"
            placeholder="Ingrese el DNI (será también el usuario)"
            {...register("dni", {
              required: "El DNI es requerido",
              minLength: {
                value: 3,
                message: "El DNI debe tener al menos 3 caracteres"
              }
            })}
            className="w-full"
            disabled={isFormSubmitting}
          />
          {errors.dni && (
            <p className="text-sm text-red-500 mt-1">{errors.dni.message}</p>
          )}
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="clave">Contraseña *</Label>
          <Input
            id="clave"
            type="password"
            placeholder="Ingrese la contraseña"
            {...register("clave", {
              required: "La contraseña es requerida",
              minLength: {
                value: 4,
                message: "La contraseña debe tener al menos 4 caracteres"
              }
            })}
            className="w-full"
            disabled={isFormSubmitting}
          />
          {errors.clave && (
            <p className="text-sm text-red-500 mt-1">{errors.clave.message}</p>
          )}
        </div>

        {/* Selector de Rol (select normal) */}
        <div className="space-y-2">
          <Label htmlFor="rol" className="text-sm font-medium">Rol *</Label>
          <div className="relative">
            {loadingRoles ? (
              <div className="flex items-center justify-center p-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Cargando roles...</span>
              </div>
            ) : (
              <>
                <select
                  id="rol"
                  {...register("rol", { required: "El rol es requerido" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-10"
                  disabled={isFormSubmitting}
                >
                  <option value="">Seleccione un rol...</option>
                  {roles.map((rol) => (
                    <option key={rol.uuid} value={rol.uuid}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-muted-foreground opacity-60" />
                </div>
              </>
            )}
          </div>
          {errors.rol && (
            <p className="text-sm text-red-500 mt-1">{errors.rol.message}</p>
          )}
        </div>

        {/* ✅ OptionInfinito para Empresas */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="empresa" className="text-sm font-medium">
            Empresa <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          
          <OptionInfinito
            data={empresas}
            value={empresaValue}
            onChange={(value) => setValue("empresa", value)}
            onSearch={handleSearchEmpresas}
            onLoadMore={handleLoadMoreEmpresas}
            hasMore={hasMoreEmpresas}
            isLoading={loadingMoreEmpresas}
            loading={loadingEmpresas}
            placeholder="Buscar o seleccionar empresa..."
          />
          
          <input
            type="hidden"
            {...register("empresa")}
          />
          
          {/* Contador de empresas */}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {empresas.length} empresas cargadas
            </p>
            
            {/* Botón para limpiar selección */}
            {empresaValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("empresa", "")}
                className="h-7 px-2 text-xs"
                disabled={isFormSubmitting}
              >
                Limpiar selección
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1" 
          onClick={onUsuarioCreado}
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
              {isUploading ? "Subiendo imagen..." : "Creando usuario..."}
            </>
          ) : "Crear Usuario"}
        </Button>
      </div>
    </form>
  );
}