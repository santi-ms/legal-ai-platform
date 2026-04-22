"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getTeamMembers,
  getTeamInvitations,
  inviteMember,
  removeMember,
  cancelInvitation,
  type TeamMember,
  type TeamInvitation,
} from "@/app/lib/webApi";
import {
  Users,
  UserPlus,
  Loader2,
  Trash2,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Crown,
  X,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(member: TeamMember): string {
  if (member.firstName && member.lastName) {
    return (member.firstName[0] + member.lastName[0]).toUpperCase();
  }
  if (member.name) return member.name.slice(0, 2).toUpperCase();
  return member.email.slice(0, 2).toUpperCase();
}

function getDisplayName(member: TeamMember): string {
  if (member.firstName && member.lastName) return `${member.firstName} ${member.lastName}`;
  if (member.name) return member.name;
  return member.email;
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  onClose,
  onInvite,
  loading,
}: {
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Ingresá un email válido.");
      return;
    }
    try {
      await onInvite(email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message ?? "Error al enviar la invitación.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invitar miembro</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Ingresá el email de la persona que querés invitar. Recibirá un link para unirse a tu estudio.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colega@estudiojuridico.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamSettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [maxUsers, setMaxUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/team");
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [membersData, invitationsData] = await Promise.all([
        getTeamMembers(),
        getTeamInvitations(),
      ]);
      setMembers(membersData.members);
      setMaxUsers(membersData.maxUsers);
      setInvitations(invitationsData);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error al cargar el equipo." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const handleInvite = async (email: string) => {
    setInviteLoading(true);
    try {
      await inviteMember(email);
      setShowInviteModal(false);
      setStatusMsg({ type: "success", text: `Invitación enviada a ${email}` });
      await loadData();
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`¿Eliminás a ${name} del equipo? Perderá acceso a DocuLex.`)) return;
    setRemoveLoadingId(userId);
    try {
      await removeMember(userId);
      setStatusMsg({ type: "success", text: `${name} fue eliminado del equipo.` });
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message ?? "Error al eliminar miembro." });
    } finally {
      setRemoveLoadingId(null);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    setCancelLoadingId(id);
    try {
      await cancelInvitation(id);
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error al cancelar la invitación." });
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isAdmin = (user as any)?.role === "admin";
  const usedSlots = members.length;
  const availableSlots = maxUsers === null || maxUsers === -1 ? null : Math.max(0, maxUsers - usedSlots);
  const canInvite = isAdmin && (maxUsers === -1 || (availableSlots !== null && availableSlots > 0));
  const isEstudioPlan = maxUsers !== 1;

  return (
    <div className="mt-6 flex flex-col gap-5">
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          loading={inviteLoading}
        />
      )}

          {/* Status message */}
          {statusMsg && (
            <div className={cn(
              "flex items-start gap-3 rounded-xl border p-4",
              statusMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                : "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30"
            )}>
              {statusMsg.type === "success"
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              }
              <p className={cn(
                "text-sm font-medium",
                statusMsg.type === "success" ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"
              )}>
                {statusMsg.text}
              </p>
              <button onClick={() => setStatusMsg(null)} className="ml-auto p-0.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Plan no Estudio — aviso */}
          {!isEstudioPlan && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Tu plan actual no soporta múltiples usuarios
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Para invitar miembros a tu equipo necesitás el plan <strong>Estudio</strong>.
                  </p>
                  <a
                    href="/settings/billing"
                    className="inline-block mt-3 px-4 py-2 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Ver planes
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Header de equipo */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Miembros del equipo</h2>
                {maxUsers !== null && maxUsers !== -1 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({usedSlots}/{maxUsers} slots)
                  </span>
                )}
              </div>
              {canInvite && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invitar miembro
                </button>
              )}
            </div>

            {/* Lista de miembros */}
            <div className="space-y-3">
              {members.map((member) => {
                const displayName = getDisplayName(member);
                const initials = getInitials(member);
                const isCurrentUser = member.id === (user as any)?.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        {member.role === "admin" && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">(vos)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {member.email}
                        {member.professionalRole && ` · ${member.professionalRole}`}
                      </p>
                    </div>

                    {/* Fecha de ingreso */}
                    <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block flex-shrink-0">
                      Desde {formatDate(member.createdAt)}
                    </p>

                    {/* Acción eliminar */}
                    {isAdmin && !isCurrentUser && (
                      <button
                        onClick={() => handleRemove(member.id, displayName)}
                        disabled={removeLoadingId === member.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        title="Eliminar del equipo"
                      >
                        {removeLoadingId === member.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invitaciones pendientes */}
          {invitations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Invitaciones enviadas</h2>
              </div>
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {inv.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {inv.status === "accepted" ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Aceptada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-3 h-3" />
                            Pendiente · vence {formatDate(inv.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {inv.status === "pending" && isAdmin && (
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        disabled={cancelLoadingId === inv.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        title="Cancelar invitación"
                      >
                        {cancelLoadingId === inv.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
