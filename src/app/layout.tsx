import Providers from "./Providers";
import Navbar from "../components/Navbar";
import { Toaster } from "sonner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";
// Map CSS imports removed - now loaded dynamically in map components for better performance

export const metadata = {
  title: "Trivo - Eventos Deportivos y Sociales",
  description: "Encuentra tu tribu de entrenamiento. Crea y únete a eventos deportivos, sociales y entrenamientos",
  applicationName: "Trivo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trivo",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Trivo",
    title: "Trivo - Eventos Deportivos y Sociales",
    description: "Encuentra tu tribu de entrenamiento",
  },
  twitter: {
    card: "summary",
    title: "Trivo - Eventos Deportivos y Sociales",
    description: "Encuentra tu tribu de entrenamiento",
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    viewportFit: "cover",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/touch-icon-iphone.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect to Firebase Storage for faster image loading */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className="flex flex-col items-center w-full">
        {/* Analytics powered by Mixpanel */}
        <Toaster
          richColors
          position="top-left"
          expand={false}
          visibleToasts={3}
          offset="20px"
          toastOptions={{
            duration: 5000,
            style: {
              width: '100%',
              maxWidth: 'min(640px, 90vw)', // Responsive: 90% del viewport o 640px máximo
            },
          }}
        />
        <ServiceWorkerRegistration />
        <Providers>
          <div className="">{children}</div>
          <Navbar />
        </Providers>
      </body>
    </html>
  );
}
