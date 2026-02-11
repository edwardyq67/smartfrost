"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Users, Bell, Palette, Link, Smartphone, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { notificacionesService, CreateNotificacionRequest } from "@/lib/notificaciones/UseNotificaciones";
import { useRefreshNotificaciones } from "@/store/notificaciones/refreshNotificacionesStore";
import { useNotificacionesStore } from "@/store/notificaciones/notificacionesStores";
import { EscojerUsuariosModal } from "./EscojerUsuariosModal";
import { Input } from "@/components/ui/input";

interface NotificacionesAgregarProps {
  onNotificacionCreada: () => void;
  onClose: () => void;
}

interface FormData {
  destinatarios: string[];
  titulo: string;
  mensaje: string;
  icono: string;
  ruta: string;
  color: string;
}

const iconosDisponibles = [
  { value: "bell", label: "🔔 Campana", emoji: "🔔" },
  { value: "info", label: "ℹ️ Información", emoji: "ℹ️" },
  { value: "warning", label: "⚠️ Advertencia", emoji: "⚠️" },
  { value: "error", label: "❌ Error", emoji: "❌" },
  { value: "success", label: "✅ Éxito", emoji: "✅" },
  { value: "shopping-cart", label: "🛒 Carrito", emoji: "🛒" },
  { value: "package", label: "📦 Paquete", emoji: "📦" },
  { value: "truck", label: "🚚 Camión", emoji: "🚚" },
  { value: "user", label: "👤 Usuario", emoji: "👤" },
  { value: "wrench", label: "🛠️ Herramienta", emoji: "🛠️" },
  { value: "alert", label: "🚨 Alerta", emoji: "🚨" },
  { value: "message", label: "💬 Mensaje", emoji: "💬" },
];

export const NotificacionesAgregar: React.FC<NotificacionesAgregarProps> = ({
  onNotificacionCreada,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);

  const { triggerRefresh } = useRefreshNotificaciones();
  const { usuarios } = useNotificacionesStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      destinatarios: [],
      icono: "bell",
      color: "#3B82F6",
      ruta: "",
    },
  });

  const selectedUsers = watch("destinatarios");
  const selectedIcono = watch("icono");
  const selectedColor = watch("color");

  const handleUserSelection = (userIds: string[]) => {
    setValue("destinatarios", userIds, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Crear notificación para APP
      const notificacionAppData: CreateNotificacionRequest = {
        destinatarios: data.destinatarios,
        titulo: data.titulo,
        mensaje: data.mensaje,
        icono: data.icono,
        ruta: data.ruta,
        tipo: "app",
        color: data.color,
      };

      // Crear notificación para WEB
      const notificacionWebData: CreateNotificacionRequest = {
        destinatarios: data.destinatarios,
        titulo: data.titulo,
        mensaje: data.mensaje,
        icono: data.icono,
        ruta: data.ruta,
        tipo: "web",
        color: data.color,
      };

      // Enviar ambas notificaciones
      await notificacionesService.createNotificacion(notificacionAppData);
      await notificacionesService.createNotificacionOneSignal(notificacionAppData);

      await notificacionesService.createNotificacion(notificacionWebData);
      await notificacionesService.createNotificacionOneSignal(notificacionWebData);

      triggerRefresh();
      onNotificacionCreada();
      onClose();

    } catch (error) {
      console.error("Error creando notificación:", error);
      alert("Error al crear la notificación. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[70vh]">
        {/* Sección compacta: Destinatarios y Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Destinatarios */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Destinatarios *
            </Label>

            <Button
              type="button"
              variant="outline"
              className="w-full h-9 justify-start px-3"
              onClick={() => setIsUserModalOpen(true)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm truncate">
                    {selectedUsers.length === 0 ? (
                      "Seleccionar..."
                    ) : (
                      <span className="font-medium">{selectedUsers.length} usuario(s)</span>
                    )}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </div>
            </Button>

            <input
              type="hidden"
              {...register("destinatarios", {
                required: "Selecciona al menos un destinatario",
                validate: (value) => value.length > 0 || "Selecciona al menos un destinatario"
              })}
            />

            {errors.destinatarios && (
              <p className="text-xs text-red-500">{errors.destinatarios.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              Color
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border border-input flex-shrink-0"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="flex-1 h-9 text-sm min-w-0"
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>

        {/* Sección compacta: Icono y Ruta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Icono */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" />
              Icono *
            </Label>
            <div className="relative">
              <select
                value={selectedIcono}
                onChange={(e) => setValue("icono", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-8"
              >
                {iconosDisponibles.map((icono) => (
                  <option key={icono.value} value={icono.value}>
                    {icono.emoji} {icono.label.replace(icono.emoji, '').trim()}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
              </div>
            </div>
          </div>

          {/* Ruta */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Link className="h-3.5 w-3.5" />
              Ruta *
            </Label>
            <Input
              type="text"
              placeholder="/dashboard/trabajos"
              {...register("ruta", {
                required: "La ruta es obligatoria",
                minLength: {
                  value: 3,
                  message: "La ruta debe tener al menos 3 caracteres"
                }
              })}
              className="h-9 text-sm"
            />
            {errors.ruta && (
              <p className="text-xs text-red-500">{errors.ruta.message}</p>
            )}
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-sm font-medium">
            Título *
          </Label>
          <Input
            id="titulo"
            placeholder="Ingresa el título de la notificación"
            {...register("titulo", {
              required: "El título es requerido",
              minLength: {
                value: 3,
                message: "El título debe tener al menos 3 caracteres"
              }
            })}
            className="h-9 text-sm"
          />
          {errors.titulo && (
            <p className="text-xs text-red-500">{errors.titulo.message}</p>
          )}
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <Label htmlFor="mensaje" className="text-sm font-medium">
            Mensaje *
          </Label>
          <Textarea
            id="mensaje"
            placeholder="Ingresa el mensaje de la notificación"
            rows={3}
            {...register("mensaje", {
              required: "El mensaje es requerido",
              minLength: {
                value: 10,
                message: "El mensaje debe tener al menos 10 caracteres"
              }
            })}
            className="w-full resize-none text-sm min-h-[80px]"
          />
          {errors.mensaje && (
            <p className="text-xs text-red-500">{errors.mensaje.message}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            size="sm"
            className="h-9 w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedUsers.length === 0}
            className="h-9 text-sm bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <span className="mr-2">📢</span>
                Enviar a ambas plataformas
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal para seleccionar usuarios */}
      <EscojerUsuariosModal
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        selectedUsers={selectedUsers}
        onSelectionChange={handleUserSelection}
        title="Seleccionar Destinatarios"
        description="Selecciona los usuarios que recibirán esta notificación"
      />
    </>
  );
};

export default NotificacionesAgregar;