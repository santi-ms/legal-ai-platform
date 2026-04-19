import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login?from=/onboarding");
  }

  if (session.user.tenantId) {
    redirect("/documents");
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
            Terminá la configuración de tu espacio
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Necesitamos un nombre y tu empresa o estudio para crear un tenant nuevo y habilitar tus documentos.
          </p>
        </div>

        <OnboardingForm
          initialName={session.user.name ?? ""}
          initialEmail={session.user.email ?? ""}
        />
      </div>
    </main>
  );
}