import { Bell, Check, User, Clock, CheckCircle, AlertCircle, Mail, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { notificacionesService, Notificacion } from "@/lib/notificaciones/UseNotificaciones";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import shortImage from "@/public/images/logo/logosmartfrost.png";
import { useAuthStore } from "@/store/auth.store";

const NotificationMessage = () => {
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        console.warn("No hay usuario autenticado");
        return;
      }

      const response = await notificacionesService.getNotificaciones({
        page: 1,
        size: 10,
        sortBy: "created_at",
        sortOrder: "desc"
      });
      
      if (response.data && response.data.data) {
        const notificaciones = response.data.data;
        setNotifications(notificaciones);
        
        // Contar notificaciones no leídas (notificado === 0)
        const unread = notificaciones.filter(n => n.notificado === "0").length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar notificaciones");
      setNotifications([]);
      setUnreadCount(0);
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    
    // Refrescar notificaciones periódicamente
    const interval = setInterval(fetchNotifications, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      // Marcar cada notificación no leída como leída
      const unreadNotifications = notifications.filter(n => n.notificado === "0");
      
      for (const notification of unreadNotifications) {
        try {
          await notificacionesService.markAsRead(notification.uuid);
        } catch (error) {
          console.error(`Error marking notification ${notification.uuid} as read:`, error);
        }
      }
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        notificado: "1"
      }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markAsRead = async (uuid: string) => {
    try {
      await notificacionesService.markAsRead(uuid);
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notification =>
        notification.uuid === uuid ? { ...notification, notificado: "1" } : notification
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'trabajo':
      case 'job':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'mensaje':
      case 'message':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'evento':
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'alerta':
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'completado':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: es 
      });
    } catch (error) {
      return "Recientemente";
    }
  };

  const getNotificationRoute = (notification: Notificacion) => { 
    switch (notification.tipo?.toLowerCase()) {
      case 'trabajo':
      case 'job':
        return "/trabajos";
      case 'mensaje':
      case 'message':
        return "/mensajes";
      case 'evento':
      case 'event':
        return "/calendario";
      default:
        return "/notificaciones";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative md:h-9 md:w-9 h-8 w-8 hover:bg-default-100 dark:hover:bg-default-200 
          data-[state=open]:bg-default-100  dark:data-[state=open]:bg-default-200 
           hover:text-primary text-default-500 dark:text-default-800  rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="w-4 h-4 p-0 text-xs font-medium items-center justify-center absolute left-[calc(100%-18px)] bottom-[calc(100%-16px)] ring-2 ring-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[60] mx-4 lg:w-[412px] p-0"
      >
        <DropdownMenuLabel
          style={{ backgroundImage: `url(${shortImage.src})` }}
          className="w-full h-full bg-cover bg-no-repeat p-4 flex items-center"
        >
          <span className="text-base font-semibold text-white flex-1">
            Notificaciones
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-white flex-0 cursor-pointer hover:underline hover:decoration-default-100 dark:decoration-default-900 flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Marcar todas como leídas
            </button>
          )}
        </DropdownMenuLabel>
        
        <div className="h-[300px] xl:h-[350px]">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-default-500">Cargando...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-red-500">{error}</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <Bell className="h-12 w-12 text-default-300 mb-2" />
                <div className="text-sm text-default-500">No hay notificaciones</div>
              </div>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem
                  key={`notification-${item.uuid}`}
                  className="flex gap-3 py-3 px-4 cursor-pointer hover:bg-default-50 dark:hover:bg-background"
                  onClick={() => markAsRead(item.uuid)}
                  asChild
                >
                  <Link href={getNotificationRoute(item)}>
                    <div className="flex-1 flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 rounded">
                          {item.creador?.nombre ? (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(item.creador.nombre)}
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -top-1 -right-1">
                          {getNotificationIcon(item.tipo)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-default-900 truncate">
                            {item.titulo}
                          </div>
                          {item.notificado === "0" && (
                            <div className="w-2 h-2 rounded-full bg-primary ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-default-600 mb-1 line-clamp-2">
                          {item.mensaje}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-default-500 truncate max-w-[120px]">
                            {item.creador?.nombre || "Sistema"}
                          </div>
                          <div className="text-xs text-default-500 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="m-4 mt-5">
          <Button asChild className="w-full" variant="outline">
            <Link href="/notificaciones">
              Ver todas las notificaciones
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationMessage;