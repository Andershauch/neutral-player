import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers"; 

export const metadata: Metadata = {
  title: "Neutral Player Admin",
  description: "Administrationspanel",
};

// Vi tilføjer viewport indstillinger for at sikre korrekt zoom på mobil
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className="scroll-smooth">
      <body
        className="antialiased bg-gray-50 text-gray-900 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden"
      >
        {/* overflow-x-hidden på body er en 'life saver' på mobil. 
            Det forhindrer at siden kan "vippe" sidelæns.
        */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
