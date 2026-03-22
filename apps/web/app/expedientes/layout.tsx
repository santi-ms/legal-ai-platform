import InactivityLogout from "@/app/components/InactivityLogout";

export default function ExpedientesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
