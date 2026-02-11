import './globals.css';
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import Providers from "@/provider/providers";
import TanstackProvider from "@/provider/providers.client";
import AuthProvider from "@/provider/auth.provider";
import DirectionProvider from "@/provider/direction.provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta name="description" content="Tecnología avanzada de control y monitoreo en tiempo real para cadenas de frío. Garantizamos la integridad de productos perecederos, farmacéuticos y logísticos." />
        <meta name="keywords" content="control de cadena de frío, monitoreo en tiempo real, tecnología en refrigeración, Smartfrost, logística de frío, seguridad alimentaria, conservación farmacéutica" />
        <meta name="author" content="Smartfrost" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.smartfrost.com/" />
        <meta property="og:title" content="Smartfrost | Control y Monitoreo Inteligente de Cadena de Frío" />
        <meta property="og:description" content="Garantizamos la integridad de tus productos con tecnología que monitorea y controla cada grado de la cadena de frío. Frescura perfecta, desde el origen hasta el destino." />
        <meta property="og:image" content="https://www.smartfrost.com/assets/images/social-share-home.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Dashboard de monitoreo Smartfrost mostrando control de temperatura en tiempo real" />
        <meta property="og:locale" content="es_ES" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SmartfrostTech" />
        <meta name="twitter:creator" content="@SmartfrostTech" />
        <meta name="twitter:title" content="Smartfrost | Control y Monitoreo Inteligente de Cadena de Frío" />
        <meta name="twitter:description" content="Tecnología que vigila cada grado de tu cadena de frío. Monitoreo en tiempo real, alertas proactivas y control absoluto para tu logística." />
        <meta name="twitter:image" content="https://www.smartfrost.com/assets/images/twitter-share-home.jpg" />
        <meta name="twitter:image:alt" content="Interfaz de control Smartfrost con gráficos de temperatura y estado de la cadena de frío" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <TanstackProvider>
            <Providers>
              <DirectionProvider lang={lang}>
                {children}
              </DirectionProvider>
            </Providers>
          </TanstackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}