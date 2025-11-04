import InactivityLogout from "@/app/components/InactivityLogout";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
