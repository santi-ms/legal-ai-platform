import "./globals.css";

export const metadata = {
  title: "Legal AI Platform",
  description: "Generación y gestión de documentos legales con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
