"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { userService, UpdateUserData, User } from "@/lib/usuarios/UseUsuarios";
import { useRefreshTableUsuarios } from "@/store/usuarios/refreshTableUsuarios";
import { archivosService } from "@/lib/archivos/UseArchivos";
import { rolesService } from "@/lib/roles/UseRoles";
import { EmpresaService } from "@/lib/empresas/UseEmpresas";
import { OptionInfinito } from "@/components/ui/optionInfinito";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useModulePermissions } from "@/hooks/useModulePermissions"; // ✅ Importar hook de permisos

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

interface UsuarioEditarProps {
  usuario: string;
  onUsuarioEditado?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UsuarioEditar({
  usuario,
  onUsuarioEditado,
  open = true,
  onOpenChange
}: UsuarioEditarProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    trigger,
    clearErrors
  } = useForm<UsuarioFormData>();
  const { user: currentUser } = useAuthStore.getState();
  const { triggerRefresh } = useRefreshTableUsuarios();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Verificar permisos
  const { hasSpecificRoute } = useModulePermissions("usuarios");
  const canViewEmpresas = hasSpecificRoute("GET", "usuarios/empresa");
  const canViewRoles = hasSpecificRoute("GET", "usuarios/roles");
  // Estados para roles (select normal)
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Estados para OptionInfinito de empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingMoreEmpresas, setLoadingMoreEmpresas] = useState(false);
  const [hasMoreEmpresas, setHasMoreEmpresas] = useState(true);
  const [empresasPage, setEmpresasPage] = useState(1);

  const rolValue = watch("rol");
  const empresaValue = watch("empresa");
  const dniValue = watch("dni");
  const nombreValue = watch("nombre");
  const claveValue = watch("clave");

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open && usuario) {
      loadUserData();
      // ✅ Solo cargar roles si tiene permiso
      if (canViewRoles) {
        loadRoles();
      }
      // ✅ Solo cargar empresas si tiene permiso
      if (canViewEmpresas) {
        fetchEmpresas(1, "", true);
      }
    }
  }, [open, usuario, canViewRoles, canViewEmpresas]);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      setBackendError(null);

      const response = await userService.getUserById(usuario);
      const user = response.data;

      setUserData(user);

      // Establecer valores iniciales en el formulario
      reset({
        nombre: user.nombre || "",
        usuario: user.usuario || "",
        clave: "",
        rol: user.rol?.uuid || "",
        empresa: user.empresa?.uuid || "",
        dni: user.dni || "",
        avatar: user.avatar || ""
      });

      if (user.avatar) {
        setSelectedImage(user.avatar);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al cargar los datos del usuario";
      setBackendError(errorMessage);
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ Función para cargar roles (solo si tiene permiso)
  const loadRoles = async () => {
    if (!canViewRoles) return; // ✅ No cargar si no tiene permiso

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

  // ✅ Función para cargar empresas (solo si tiene permiso)
  const fetchEmpresas = useCallback(async (page = 1, searchTerm = "", resetData = false) => {
    if (!canViewEmpresas) return; // ✅ No cargar si no tiene permiso

    try {
      if (resetData) {
        setLoadingEmpresas(true);
      } else {
        setLoadingMoreEmpresas(true);
      }

      const response = await EmpresaService.getEmpresas({
        page: page,
        size: 20,
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
  }, [canViewEmpresas]);

  // ✅ Handler para búsqueda de empresas (solo si tiene permiso)
  const handleSearchEmpresas = useCallback((searchTerm: string) => {
    if (!canViewEmpresas) return;
    fetchEmpresas(1, searchTerm, true);
  }, [fetchEmpresas, canViewEmpresas]);

  // ✅ Handler para cargar más empresas (solo si tiene permiso)
  const handleLoadMoreEmpresas = useCallback(() => {
    if (!canViewEmpresas || loadingMoreEmpresas || !hasMoreEmpresas) return;
    fetchEmpresas(empresasPage + 1, "", false);
  }, [fetchEmpresas, canViewEmpresas, loadingMoreEmpresas, hasMoreEmpresas, empresasPage]);

  // Efecto para sincronizar DNI con Usuario
  useEffect(() => {
    if (dniValue) {
      setValue("usuario", dniValue);
      trigger("usuario");
    }
  }, [dniValue, setValue, trigger]);

  // Generar avatar con iniciales
  const getFirstLetter = (nombre?: string): string => {
    if (!nombre || nombre.trim() === '') return 'U';
    return nombre.trim().charAt(0).toUpperCase();
  };

  const getAvatarColor = (nombre?: string): string => {
    if (!nombre) return '#6B7280';

    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    ];

    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const LetterAvatar = ({ nombre, size = 80 }: { nombre?: string; size?: number }) => {
    const letter = getFirstLetter(nombre);
    const color = getAvatarColor(nombre);

    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold shadow-sm border-2 border-gray-200"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          fontSize: size * 0.4,
        }}
      >
        {letter}
      </div>
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setBackendError("La imagen es demasiado grande. El tamaño máximo permitido es 2MB.");
        setSelectedFile(null);
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      setIsUploading(true);
      setBackendError(null);
      clearErrors();

      let avatarUrl = data.avatar;

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

      const updateData: UpdateUserData = {
        nombre: data.nombre,
        usuario: data.usuario,
        dni: data.dni,
        id_rol: data.rol,
        id_empresa: data.empresa || null,
        avatar: avatarUrl
      };

      if (data.clave && data.clave.trim() !== "") {
        updateData.clave = data.clave;
      }

      await userService.updateUser(usuario, updateData);

      // ✅ Actualizar usuario actual si es necesario
      if (currentUser?.id === usuario) {
        const updatedUser = {
          ...currentUser,
          nombre: data.nombre,
          empresa: data.empresa || "",
          avatar: avatarUrl
        };

        useAuthStore.getState().updateUser(updatedUser);
      }

      reset();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      triggerRefresh();
      onUsuarioEditado?.();

      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);

      let errorMessage = "Error al actualizar el usuario";
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

  const handleCancel = () => {
    // Restaurar valores originales del usuario
    if (userData) {
      reset({
        nombre: userData.nombre || "",
        usuario: userData.usuario || "",
        clave: "",
        rol: userData.rol?.uuid || "",
        empresa: userData.empresa?.uuid || "",
        dni: userData.dni || "",
        avatar: userData.avatar || ""
      });

      if (userData.avatar) {
        setSelectedImage(userData.avatar);
      } else {
        setSelectedImage(null);
      }
    }

    setSelectedFile(null);
    setBackendError(null);
    clearErrors();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const isFormSubmitting = isSubmitting || isUploading || loadingUser;

  if (!open) return null;

  if (loadingUser) {
    return (
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <p className="text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error al cargar los datos del usuario</p>
        <Button type="button" variant="outline" className="mt-4" onClick={handleCancel}>
          Volver
        </Button>
      </div>
    );
  }

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
            <div className="cursor-pointer group relative" onClick={handleImageClick}>
              <div className="relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <LetterAvatar nombre={nombreValue || userData.nombre} size={80} />
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
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

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? "Nueva imagen seleccionada" :
                    selectedImage ? "Imagen actual" : "Avatar con inicial"}
                </p>

                {selectedFile && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">
                      Vista previa:
                    </p>
                    <img
                      src={selectedImage || ''}
                      alt="Preview"
                      className="mt-2 w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageClick}
                    className="text-xs"
                    disabled={isFormSubmitting}
                  >
                    {selectedFile ? "Cambiar imagen" : "Subir imagen"}
                  </Button>

                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (userData.avatar) {
                          setSelectedImage(userData.avatar);
                        } else {
                          setSelectedImage(null);
                        }
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                      disabled={isFormSubmitting}
                    >
                      Quitar imagen
                    </Button>
                  )}
                </div>

                <p className="text-xs text-amber-600 font-medium">
                  Tamaño máximo: 2MB
                </p>
              </div>
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
          <Label htmlFor="clave">Contraseña</Label>
          <Input
            id="clave"
            type="password"
            placeholder="Dejar vacío para no cambiar"
            {...register("clave", {
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
          <p className="text-xs text-muted-foreground">
            {claveValue ? "Nueva contraseña será establecida" : "Solo llenar si desea cambiar la contraseña"}
          </p>
        </div>

        {/* ✅ Selector de Rol (solo si tiene permiso) */}
        {canViewRoles ? (
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
        ) : (
          // ✅ Si no tiene permiso para ver roles, mostrar campo oculto con el valor actual
          <input type="hidden" {...register("rol")} />
        )}

        {/* ✅ OptionInfinito para Empresas (solo si tiene permiso) */}
        {canViewEmpresas ? (
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

            {/* Contador y botón para limpiar */}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">
                {empresas.length} empresas cargadas
              </p>

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
        ) : (
          // ✅ Si no tiene permiso para ver empresas, mostrar campo oculto con el valor actual
          <input type="hidden" {...register("empresa")} />
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
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
              {isUploading ? "Subiendo imagen..." : "Guardando cambios..."}
            </>
          ) : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}