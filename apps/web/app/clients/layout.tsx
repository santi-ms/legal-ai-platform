import InactivityLogout from "@/app/components/InactivityLogout";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
