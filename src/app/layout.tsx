import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rpmotors.uy"),
  title: {
    default: "RP Motors | Compraventa de automóviles usados",
    template: "%s | RP Motors",
  },
  description: "RP Motors en Montevideo: autos usados con proceso transparente, ficha completa y atención personalizada.",
  openGraph: {
    type: "website",
    locale: "es_UY",
    siteName: "RP Motors",
    title: "RP Motors | Compraventa de automóviles usados",
    description: "Autos usados en Montevideo con proceso claro y contacto directo.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-UY">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
