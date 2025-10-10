import Providers from "./Providers";
import Navbar from "../components/Navbar";
import { Toaster } from "sonner";
import Script from "next/script";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";
// Map CSS imports removed - now loaded dynamically in map components for better performance

export const metadata = {
  title: "Trivo app",
  description: "Encuentra tu tribu de entrenamiento",
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
        {/* Google Analytics - Loaded after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2C913CYW7H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2C913CYW7H');
          `}
        </Script>

        <Toaster richColors position="top-center" expand={true} />
        <ServiceWorkerRegistration />
        <Providers>
          <div className="">{children}</div>
          <Navbar />
        </Providers>
      </body>
    </html>
  );
}
