"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  getInvitationInfo,
  acceptInvitation,
  type InvitationInfo,
} from "@/app/lib/webApi";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  ArrowRight,
  LogIn,
} from "lucide-react";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Cargar info de la invitación (sin auth)
  useEffect(() => {
    if (!token) return;
    getInvitationInfo(token)
      .then(setInvitation)
      .catch((err) => setError(err.message ?? "Invitación inválida o expirada."))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptInvitation(token);
      setDone(true);
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => router.push("/documents"), 2000);
    } catch (err: any) {
      setError(err.message ?? "Error al aceptar la invitación.");
      setAccepting(false);
    }
  };

  const isLoggedIn = sessionStatus === "authenticated";
  const isLoading = loadingInfo || sessionStatus === "loading";

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell>
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">Verificando invitación...</p>
      </PageShell>
    );
  }

  // ── Invitación inválida / expirada ────────────────────────────────────────────
  if (error && !invitation) {
    return (
      <PageShell>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invitación inválida</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <a
          href="/auth/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          <LogIn className="w-4 h-4" /> Ir al inicio de sesión
        </a>
      </PageShell>
    );
  }

  // ── Éxito — invitación aceptada ───────────────────────────────────────────────
  if (done) {
    return (
      <PageShell>
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          ¡Bienvenido al equipo!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ya formas parte de <strong>{invitation?.tenantName}</strong>. Redirigiendo...
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-4" />
      </PageShell>
    );
  }

  // ── Info de la invitación ─────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Users className="w-6 h-6 text-primary" />
      </div>

      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Invitación a {invitation?.tenantName}
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        <strong>{invitation?.inviterName}</strong> te invitó a colaborar en{" "}
        <strong>{invitation?.tenantName}</strong> en DocuLex.
      </p>

      {/* Error al aceptar */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 p-3 mb-4 text-left">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Usuario autenticado → puede aceptar directo */}
      {isLoggedIn ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3 text-sm text-slate-600 dark:text-slate-300 text-left">
            Vas a unirte como <strong>{session?.user?.email}</strong>
          </div>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {accepting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Aceptar invitación <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      ) : (
        /* No autenticado → debe iniciar sesión primero */
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Para aceptar la invitación necesitás iniciar sesión con{" "}
            <strong>{invitation?.email}</strong>.
          </p>
          <a
            href={`/auth/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Iniciar sesión
          </a>
          <a
            href={`/auth/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitation?.email ?? "")}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Crear cuenta nueva
          </a>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
        Invitación válida hasta{" "}
        {invitation?.expiresAt
          ? new Date(invitation.expiresAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "..."}
      </p>
    </PageShell>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <BrandLogo size={50} />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md text-center">
        {children}
      </div>
    </main>
  );
}
