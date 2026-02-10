import { FC, MouseEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMapaStoreSinPersist } from "@/store/mapa/dataStoreMapaSinPersist";

type CustomDocument = Document & {
  mozCancelFullScreen?: () => void;
};

const FullScreenToggle: FC = () => {  // ❌ QUITAR 'async' aquí
  const { setMapaAgrandado, mapaAgrandado } = useMapaStoreSinPersist();
  
  const toggleFullScreen: MouseEventHandler<HTMLButtonElement> = () => {  // ❌ QUITAR 'await' aquí
    const doc = document;
    const docEl = doc.documentElement;

    const requestFullScreen =
      docEl.requestFullscreen ||
      (docEl as any).webkitRequestFullscreen ||  // ✅ CORREGIR
      (docEl as any).mozRequestFullScreen ||
      (docEl as any).msRequestFullscreen;
    
    const cancelFullScreen =
      doc.exitFullscreen ||
      (doc as any).webkitExitFullscreen ||
      (doc as CustomDocument).mozCancelFullScreen ||
      (doc as any).msExitFullscreen;

    // ✅ VERIFICAR CORRECTAMENTE SI ESTÁ EN FULLSCREEN
    const isFullscreen = 
      doc.fullscreenElement ||
      (doc as any).webkitFullscreenElement ||
      (doc as any).mozFullScreenElement ||
      (doc as any).msFullscreenElement;

    if (!isFullscreen) {
      // ✅ ENTRAR A FULLSCREEN
      requestFullScreen?.call(docEl).then(() => {
        setMapaAgrandado(true);  // ✅ ACTUALIZAR DESPUÉS DE ENTRAR
      });
    } else {
      // ✅ SALIR DE FULLSCREEN
      cancelFullScreen?.call(doc).then(() => {
        setMapaAgrandado(false);  // ✅ ACTUALIZAR DESPUÉS DE SALIR
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={toggleFullScreen}
            variant="ghost"
            size="icon"
            className="relative md:h-9 md:w-9 h-8 w-8 hover:bg-default-100 dark:hover:bg-default-200
         data-[state=open]:bg-default-100  dark:data-[state=open]:bg-default-200
           hover:text-primary text-default-500 dark:text-default-800  rounded-full "
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow className="fill-primary" />
          <p>Full Screen</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FullScreenToggle;