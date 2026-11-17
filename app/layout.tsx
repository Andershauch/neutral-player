import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neutral Player Admin",
  description: "Administrationspanel",
};

// Zoom must stay enabled (WCAG 1.4.4), so no maximumScale / userScalable here.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        {children}
      </body>
    </html>
  );
}
