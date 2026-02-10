// layout.tsx
import './globals.css';
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import Providers from "@/provider/providers";
import TanstackProvider from "@/provider/providers.client";
import AuthProvider from "@/provider/auth.provider";
import DirectionProvider from "@/provider/direction.provider";
// ⛔️ ELIMINA esta importación:
// import OneSignalInitializer from "@/components/OneSignalInitializer"

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
        <script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      OneSignalDeferred.push(async function(OneSignal) {

        await OneSignal.init({
          appId: "717b5a13-fd46-4b9b-8d40-a738397dd31b",
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 1,
              pageViews: 1,
              prompts: [
                {
                  type: 'push',
                  autoPrompt: true,
                  text: {
                    actionMessage: '¿Quieres recibir notificaciones?',
                    acceptButton: 'Permitir',
                    cancelButton: 'No, gracias'
                  }
                }
              ]
            }
          }
        });

        // Función simple para guardar en localStorage
        const saveSubscriptionId = async () => {
          try {
            const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
            
            if (isSubscribed) {
              const subscriptionId = await OneSignal.User.PushSubscription.id;
              
              if (subscriptionId) {
                localStorage.setItem('onesignal_subscription_id', subscriptionId);
              }
            }
          } catch (error) {
            console.log('⚠️ Error:', error);
          }
        };
        
        // Escuchar cambios
        OneSignal.User.PushSubscription.addEventListener('change', async (subscription) => {
          if (subscription.optedIn && subscription.id) {
            localStorage.setItem('onesignal_subscription_id', subscription.id);
          } else {
            localStorage.removeItem('onesignal_subscription_id');
          }
        });
        
        // Guardar inicialmente
        await saveSubscriptionId();
        
        // Función global para obtener el ID
        window.getSubscriptionId = () => {
          return localStorage.getItem('onesignal_subscription_id');
        };
      });
    `,
          }}
        />
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