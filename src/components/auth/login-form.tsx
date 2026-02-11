"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Cambiado de logo a Image
import logo from "@/public/images/logo/logosmartfrost.png"; // Asegúrate de que esta ruta sea correcta
import { authService } from "@/lib/auth/auth";
import { useMediaQuery } from "@/hooks/use-media-query";
import { userService } from "@/lib/usuarios/UseUsuarios";
import { useRouter } from "next/navigation";

const schema = z.object({
  usuario: z.string().min(1, { message: "El usuario es requerido" }),
  clave: z.string().min(1, { message: "La contraseña es requerida" }),
});

type FormData = z.infer<typeof schema>;

const LogInForm = () => {
  const [isPending, setIsPending] = React.useState(false); // Cambiado de startTransition
  const [passwordType, setPasswordType] = React.useState("password");
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  const router = useRouter(); // Usar router de Next.js

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const togglePasswordType = () => {
    setPasswordType(prev => prev === "text" ? "password" : "text");
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      usuario: "73357492",
      clave: "1234",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const respuesta = await authService.login({
        usuario: data.usuario,
        clave: data.clave
      });
      
      toast.success('Inicio de sesión exitoso');

      // Obtener subscriptionId de OneSignal
      const subscriptionId = localStorage.getItem('onesignal_subscription_id');
      
      if (subscriptionId && respuesta.data.userId) {
        try {
          await userService.updateUser(respuesta.data.userId, {
            id_os_web: subscriptionId
          });
        } catch (error) {
          console.warn('No se pudo actualizar el ID de OneSignal:', error);
          // No mostrar error al usuario, es opcional
        }
      }

      // Redireccionar usando router de Next.js
      router.push("/en/dashboard");
      router.refresh(); // Para refrescar el layout si hay cambios
      
      reset();
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.message || 'Error en el inicio de sesión');
    } finally {
      setIsPending(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full py-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-10">
        <Image 
          src={logo}
          alt="SmartFrost Logo"
          width={isDesktop2xl ? 56 : 64}
          height={isDesktop2xl ? 56 : 64}
          className="2xl:w-auto 2xl:h-14 w-20 h-20"
          priority
        />
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        ¡Hola! 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 2xl:mt-2 leading-6">
        Ingresa la información que usaste al registrarte.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7 gap-4 grid">
        <div>
          <Label htmlFor="usuario" className="font-medium text-default-600">
            Usuario
          </Label>
          <Input
            disabled={isPending}
            {...register("usuario")}
            type="text"
            id="usuario"
            className={cn("", {
              "border-destructive": errors.usuario,
            })}
            size={!isDesktop2xl ? "xl" : "lg"}
            placeholder="73357492"
          />
          {errors.usuario && (
            <div className="text-destructive mt-2 text-sm">
              {errors.usuario.message}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="clave" className="font-medium text-default-600">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              disabled={isPending}
              {...register("clave")}
              type={passwordType}
              id="clave"
              className={cn("pr-10", {
                "border-destructive": errors.clave,
              })}
              size={!isDesktop2xl ? "xl" : "lg"}
              placeholder="1234"
            />
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer"
              onClick={togglePasswordType}
              disabled={isPending}
            >
              {passwordType === "password" ? (
                <Eye className="w-5 h-5 text-default-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-default-400" />
              )}
            </button>
          </div>
          {errors.clave && (
            <div className="text-destructive mt-2 text-sm">
              {errors.clave.message}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
          type="submit"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Cargando..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  );
};

export default LogInForm;