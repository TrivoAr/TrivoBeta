import Providers from "./Providers";
import Navbar from "../components/Navbar";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';


export const metadata = {
  title: "Trivo app",
  description: "Encuntra tu tribu de entrenamiento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Google Analytics */}
        
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2C913CYW7H"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2C913CYW7H');
            `,
          }}
        />
   

      </head>
      <body className="flex flex-col items-center w-full">
        <Toaster />
        <Providers>
          <div className="">{children}</div>
          <Navbar />
        </Providers>
      </body>
    </html>
  );
}
