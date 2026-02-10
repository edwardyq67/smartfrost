"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Fragment, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LogInForm from "@/components/auth/login-form";

const LoginPage = () => {
  const [openVideo, setOpenVideo] = useState<boolean>(false);
  
  return (
    <Fragment>
      <div className="min-h-screen bg-background flex items-center overflow-hidden w-full">
        <div className="min-h-screen basis-full flex flex-wrap w-full justify-center overflow-y-auto">
          {/* Sección Izquierda - Branding */}
          <div
            className="basis-1/2 w-full relative hidden xl:flex justify-center items-center 
            bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-500"
          >
            
            <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 py-14 px-16 2xl:pl-[50px] 2xl:pr-[136px] rounded-2xl max-w-[640px] shadow-xl">
              <div>

                {/* Título Principal */}
                <div className="text-4xl leading-[50px] 2xl:text-6xl 2xl:leading-[72px] font-bold mt-6 text-white">
                  <span className="opacity-90">
                    Smartfrost <br />
                  </span>
                </div>
                
                {/* Subtítulo */}
                <div className="mt-5 2xl:mt-8 text-white/90 text-2xl font-medium">
                  Controla. Monitorea. Optimiza. <br />
                  Tu ecosistema de refrigeración en tiempo real
                </div>
                
                {/* Lista de Beneficios */}
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Monitoreo en tiempo real 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Garantía de integridad de productos</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Alertas predictivas de mantenimiento</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Control de temperatura preciso</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Optimización energética</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Sección Derecha - Formulario de Login */}
          <div className="min-h-screen basis-full md:basis-1/2 w-full px-4 flex justify-center items-center bg-gray-50">
            <div className="lg:w-[480px] bg-white px-8 rounded-2xl shadow-lg">
              <LogInForm />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Video */}
      <Dialog open={openVideo} onOpenChange={setOpenVideo}>
        <DialogContent overflowVisible={true} size="lg" className="p-0" hiddenCloseIcon>
          <Button
            size="icon"
            onClick={() => setOpenVideo(false)}
            className="absolute -top-4 -right-4 bg-gray-900 hover:bg-gray-800 z-10"
          >
            <X className="w-6 h-6 text-white" />
          </Button>
          <div className="relative pt-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/8D6b3McyhhU?si=zGOlY311c21dR70j"
              title="Smartfrost - Tecnología en Cadena de Frío"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default LoginPage;