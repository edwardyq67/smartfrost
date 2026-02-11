"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Search, 
  Check, 
  X, 
  Loader2, 
  Building, 
  User,
  ChevronDown
} from "lucide-react";
import { userService } from "@/lib/usuarios/UseUsuarios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface EscojerUsuariosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  title?: string;
  description?: string;
}

interface Rol {
  id: string;
  uuid: string;
  nombre: string;
  descripcion?: string;
  estado?: string;
  creador?: {
    uuid: string;
    nombre: string;
  };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface Empresa {
  uuid: string;
  nombre: string;
}

interface Usuario {
   id: string;
   uuid: string;
   id_empresa: string | null;
   nombre: string;
   dni: string;
   usuario: string;
   email?: string; // tu backend NO lo envía, pero no causa error
   avatar?: string | null; // <-- CORREGIDO
   rol_frontend?: string | null;
   tutorial?: string;
   id_os_web?: string;
   id_os_app?: string;
   created_at?: string;
   rol: Rol | null;
  empresa?: Empresa | null;
   creador: {
     uuid: string;
     nombre: string;
   };
}

export const EscojerUsuariosModal: React.FC<EscojerUsuariosModalProps> = ({
  open,
  onOpenChange,
  selectedUsers,
  onSelectionChange,
  title = "Seleccionar Usuarios",
  description = "Selecciona los usuarios que recibirán la notificación",
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tempSelected, setTempSelected] = React.useState<string[]>(selectedUsers);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filtroRol, setFiltroRol] = React.useState<string | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<Rol[]>([]);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);

  React.useEffect(() => {
    if (open) {
      loadUsuarios();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setFiltroRol(null);
      setFiltroEmpresa(null);
      setSearchTerm("");
    }
  }, [open]);

  React.useEffect(() => {
    setTempSelected(selectedUsers);
  }, [selectedUsers, open]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros: any = { page: 1, size: 20 };
      
      if (filtroRol) {
        filtros.id_rol = filtroRol;
      }
      
      if (filtroEmpresa) {
        filtros.id_empresa = filtroEmpresa;
      }
      
      if (searchTerm) {
        filtros.search = searchTerm;
      }
      
      const response = await userService.getUsers(filtros);
      const usersData = response?.data?.data || [];
      setUsuarios(usersData);

      const rolesUnicos: Rol[] = [];
      const empresasUnicas: Empresa[] = [];
      const rolesSet = new Set<string>();
      const empresasSet = new Set<string>();

      usersData.forEach((usuario: Usuario) => {
        if (usuario.rol && usuario.rol.uuid && !rolesSet.has(usuario.rol.uuid)) {
          rolesSet.add(usuario.rol.uuid);
          rolesUnicos.push(usuario.rol);
        }
        
        if (usuario.empresa && usuario.empresa.uuid && !empresasSet.has(usuario.empresa.uuid)) {
          empresasSet.add(usuario.empresa.uuid);
          empresasUnicas.push(usuario.empresa);
        }
      });

      setRoles(rolesUnicos);
      setEmpresas(empresasUnicas);

    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("Error al cargar los usuarios. Por favor, intenta nuevamente.");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      loadUsuarios();
    }
  }, [filtroRol, filtroEmpresa]);

  const filteredUsuarios = React.useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    
    return usuarios.filter(usuario => {
      const searchLower = searchTerm.toLowerCase();
      return (
        usuario.nombre.toLowerCase().includes(searchLower) ||
        (usuario.email && usuario.email.toLowerCase().includes(searchLower)) ||
        usuario.dni.includes(searchTerm) ||
        (usuario.empresa && usuario.empresa.nombre.toLowerCase().includes(searchLower)) ||
        (usuario.rol && usuario.rol.nombre.toLowerCase().includes(searchLower)) ||
        usuario.usuario.includes(searchTerm)
      );
    });
  }, [usuarios, searchTerm]);

  const toggleUserSelection = (userId: string) => {
    setTempSelected(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsuarios.map(usuario => usuario.uuid);
    const newSelection = [...new Set([...tempSelected, ...filteredIds])];
    setTempSelected(newSelection);
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredUsuarios.map(usuario => usuario.uuid);
    setTempSelected(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const handleSave = () => {
    onSelectionChange(tempSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedUsers);
    onOpenChange(false);
  };

  const limpiarFiltros = () => {
    setFiltroRol(null);
    setFiltroEmpresa(null);
    setSearchTerm("");
  };

  const getRolNombre = (rolId: string | null) => {
    if (!rolId) return "Filtrar por Rol";
    const rol = roles.find(r => r.uuid === rolId);
    return rol ? rol.nombre : "Rol no encontrado";
  };

  const getEmpresaNombre = (empresaId: string | null) => {
    if (!empresaId) return "Filtrar por Empresa";
    const empresa = empresas.find(e => e.uuid === empresaId);
    return empresa ? empresa.nombre : "Empresa no encontrada";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent   overflowVisible={true} size="3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios por nombre, DNI, empresa, usuario o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    loadUsuarios();
                  }
                }}
                className="pl-10"
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {getRolNombre(filtroRol)}
                    </span>
                    <span className="sm:hidden">Rol</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Rol</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFiltroRol(null)}>
                    <div className="flex items-center gap-2">
                      {!filtroRol && <Check className="h-4 w-4" />}
                      <span>Todos los roles</span>
                    </div>
                  </DropdownMenuItem>
                  {roles.map((rol) => (
                    <DropdownMenuItem 
                      key={rol.uuid} 
                      onClick={() => setFiltroRol(rol.uuid)}
                    >
                      <div className="flex items-center gap-2">
                        {filtroRol === rol.uuid && <Check className="h-4 w-4" />}
                        <span>{rol.nombre}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Building className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {getEmpresaNombre(filtroEmpresa)}
                    </span>
                    <span className="sm:hidden">Empresa</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Empresa</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFiltroEmpresa(null)}>
                    <div className="flex items-center gap-2">
                      {!filtroEmpresa && <Check className="h-4 w-4" />}
                      <span>Todas las empresas</span>
                    </div>
                  </DropdownMenuItem>
                  {empresas.map((empresa) => (
                    <DropdownMenuItem 
                      key={empresa.uuid} 
                      onClick={() => setFiltroEmpresa(empresa.uuid)}
                    >
                      <div className="flex items-center gap-2">
                        {filtroEmpresa === empresa.uuid && <Check className="h-4 w-4" />}
                        <span>{empresa.nombre}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {(filtroRol || filtroEmpresa || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarFiltros}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <span>Cargando usuarios...</span>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <span>
                  {filteredUsuarios.length} usuario(s) encontrado(s) • {tempSelected.length} seleccionado(s)
                  {(filtroRol || filtroEmpresa) && (
                    <span className="ml-2">
                      • Filtros: 
                      {filtroRol && ` Rol: ${getRolNombre(filtroRol)}`}
                      {filtroEmpresa && ` Empresa: ${getEmpresaNombre(filtroEmpresa)}`}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllFiltered}
                disabled={loading || filteredUsuarios.length === 0}
              >
                <Check className="h-3 w-3 mr-1" />
                Seleccionar todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deselectAllFiltered}
                disabled={loading || filteredUsuarios.length === 0}
              >
                <X className="h-3 w-3 mr-1" />
                Deseleccionar todos
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md mt-2 max-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Cargando usuarios...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Por favor, espera un momento
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-red-50 p-3 mb-4">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-600">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadUsuarios}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No se encontraron usuarios</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || filtroRol || filtroEmpresa 
                  ? "Intenta con otros filtros o términos de búsqueda" 
                  : "No hay usuarios disponibles"}
              </p>
              {(filtroRol || filtroEmpresa || searchTerm) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={limpiarFiltros}
                  className="mt-2"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsuarios.map((usuario) => (
                <div
                  key={usuario.uuid}
                  className={`flex items-center p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    tempSelected.includes(usuario.uuid) ? "bg-primary/5" : ""
                  }`}
                  onClick={() => toggleUserSelection(usuario.uuid)}
                >
                  <div className={`h-5 w-5 rounded border mr-3 flex items-center justify-center transition-colors ${
                    tempSelected.includes(usuario.uuid)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  }`}>
                    {tempSelected.includes(usuario.uuid) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{usuario.nombre}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded whitespace-nowrap">
                          DNI: {usuario.dni}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {usuario.rol ? usuario.rol.nombre : "Sin Rol"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {usuario.empresa ? usuario.empresa.nombre : "Sin Empresa"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{tempSelected.length}</span> usuario(s) seleccionado(s)
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={loading || tempSelected.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Confirmar selección ({tempSelected.length})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};