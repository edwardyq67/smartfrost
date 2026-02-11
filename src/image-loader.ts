// image-loader.ts
import type { ImageLoaderProps } from "next/image";

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  // En desarrollo (localhost), usamos la imagen original tal cual
  if (process.env.NODE_ENV === "development") {
    return `${src}?width=${width}&quality=${quality || 75}`;
  }

  // En producción (Cloudflare), usamos el servicio gratuito de redimensionamiento por URL
  // Eliminamos la barra inicial si existe para evitar URLs dobles
  const relativeSrc = src.startsWith("/") ? src.slice(1) : src;
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];
  
  return `/cdn-cgi/image/${params.join(",")}/${relativeSrc}`;
}