import "./globals.css";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/ui/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider } from "@/components/ui/session-provider";

export const metadata = {
  title: "Legal AI Platform",
  description: "Generación y gestión de documentos legales con IA",
};

// Tipografía moderna y seria
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-black text-white antialiased`}>
        <SessionProvider>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
