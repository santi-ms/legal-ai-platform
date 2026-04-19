// Esta ruta es pública — no usa AppShell ni requiere autenticación
export default function SharedDocumentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
