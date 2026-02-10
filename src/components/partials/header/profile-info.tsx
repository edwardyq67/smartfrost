"use client";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UsuarioEditar } from "@/app/[lang]/(dashboard)/(home)/usuarios/components/usuarioEditar";
import { userService } from "@/lib/usuarios/UseUsuarios";
import Image from "next/image";

interface UserPerfil {
  userId: string;
  nombre: string;
  rol: string;
  avatar?: string;
  permisos: Array<{
    modulo: string;
    rutas: Array<{
      ruta: string;
      metodo: string | null;
    }>;
  }>;
}

const ProfileInfo = () => {
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();
  const [userPerfil, setUserPerfil] = useState<UserPerfil | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getUserProfileFromAuthStorage = (): UserPerfil | null => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        const userData = parsedData.state.user;

        if (userData) {
          return {
            userId: userData.id || '',
            nombre: userData.nombre || '',
            rol: userData.rol || '',
            avatar: userData.avatar,
            permisos: parsedData.state.permisos || []
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const savedProfile = getUserProfileFromAuthStorage();
    if (savedProfile) {
      setUserPerfil(savedProfile);
    } else if (user) {
      const profileFromStore: UserPerfil = {
        userId: user.id || '',
        nombre: user.nombre || '',
        rol: user.rol || '',
        avatar: user.avatar,
        permisos: []
      };
      setUserPerfil(profileFromStore);
    }
  }, [user]);

  const loadUserPerfil = () => {
    setLoading(true);
    setTimeout(() => {
      const savedProfile = getUserProfileFromAuthStorage();
      if (savedProfile) {
        setUserPerfil(savedProfile);
      } else if (user) {
        const profileFromStore: UserPerfil = {
          userId: user.id || '',
          nombre: user.nombre || '',
          rol: user.rol || '',
          avatar: user.avatar,
          permisos: []
        };
        setUserPerfil(profileFromStore);
      }
      setLoading(false);
    }, 100);
  };

  const handleLogout = async () => {
    try {
      if (user?.id && user?.tutorial !== undefined) {
        try {
          await userService.updateUser(user.id, {
            tutorial: user.tutorial
          });
        } catch (updateError) {
          // Silenciar error de actualización
        }
      }

      localStorage.removeItem('auth-storage');
      clearAuth();

      router.push('/auth/login');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 100);

    } catch (error) {
      window.location.href = '/auth/login';
    }
  };

  const handleEditProfile = () => {
    setShowEditDialog(true);
  };

  const handleUsuarioEditado = () => {
    setShowEditDialog(false);
    loadUserPerfil();
  };

  const getFirstLetter = (nombre?: string): string => {
    if (!nombre || nombre.trim() === '') return 'U';
    return nombre.trim().charAt(0).toUpperCase();
  };

  const getAvatarColor = (nombre?: string): string => {
    if (!nombre) return '#6B7280';

    const colors = [
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
    ];

    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const LetterAvatar = ({ nombre, size = 36 }: { nombre?: string; size?: number }) => {
    const letter = getFirstLetter(nombre);
    const color = getAvatarColor(nombre);

    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold shadow-sm overflow-hidden"
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

  return (
    <>
      <DropdownMenu onOpenChange={(open) => {
        if (open) {
          loadUserPerfil();
        }
      }}>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <div className="relative">
            {userPerfil?.avatar ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 shadow-sm">
                <Image
                  src={userPerfil.avatar}
                  alt={userPerfil?.nombre ?? "Perfil del usuario"}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                  priority={false}
                  onError={(e) => {
                    // Si la imagen falla, mostrar avatar de letra
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Podríamos agregar lógica para mostrar el LetterAvatar aquí
                  }}
                />
              </div>
            ) : (
              <LetterAvatar nombre={userPerfil?.nombre} size={36} />
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 p-0" align="end">
          <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
            <div className="relative">
              {userPerfil?.avatar ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-sm">
                  <Image
                    src={userPerfil.avatar}
                    alt={userPerfil?.nombre ?? "Perfil del usuario"}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    priority={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Podríamos agregar lógica para mostrar el LetterAvatar aquí
                    }}
                  />
                </div>
              ) : (
                <LetterAvatar nombre={userPerfil?.nombre} size={40} />
              )}
            </div>
            <div>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-xs text-muted-foreground">Cargando...</span>
                </div>
              ) : userPerfil ? (
                <>
                  <div className="text-sm font-medium text-default-800 capitalize">
                    {userPerfil.nombre || "Usuario"}
                  </div>
                  <div className="text-xs text-default-600">
                    {userPerfil.rol || "Rol no asignado"}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">No hay datos</div>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={handleEditProfile}
              className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer"
            >
              <User className="w-4 h-4" />
              Editar Perfil
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <div className="border-t my-1"></div>

          <DropdownMenuItem
            onSelect={handleLogout}
            className="flex items-center gap-2 text-sm font-medium capitalize my-1 px-3 dark:hover:bg-background cursor-pointer text-red-600 hover:text-red-700"
          >
            <Power className="w-4 h-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent overflowVisible={true} size="3xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          {userPerfil && (
            <UsuarioEditar
              usuario={userPerfil.userId}
              onUsuarioEditado={handleUsuarioEditado}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileInfo;