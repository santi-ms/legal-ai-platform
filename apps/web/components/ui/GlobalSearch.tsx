"use client";

/**
 * GlobalSearch — Command palette de búsqueda global.
 *
 * Abre con Ctrl+K (Windows) / Cmd+K (Mac) desde cualquier página.
 * Busca en paralelo documentos, clientes y expedientes con debounce de 250ms.
 * Navega con ↑↓ + Enter. Cierra con Esc o clic fuera.
 *
 * Sin query → muestra accesos rápidos de navegación.
 * Con query → resultados agrupados por entidad + "Ver todos" por sección.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, X, FileText, Users, Briefcase,
  ArrowRight, Loader2, LayoutDashboard, Plus, CalendarClock,
} from "lucide-react";
import {
  listDocuments, listClients, listExpedientes, listVencimientos,
  type Document, type Client, type Expediente, type Vencimiento,
} from "@/app/lib/webApi";
import { formatDocumentType } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultItem =
  | { kind: "doc";       item: Document;   href: string }
  | { kind: "client";    item: Client;     href: string }
  | { kind: "exp";       item: Expediente; href: string }
  | { kind: "venc";      item: Vencimiento; href: string }
  | { kind: "quick";     label: string; sub: string; href: string; icon: React.ElementType };

// ─── Static data ──────────────────────────────────────────────────────────────

const QUICK_LINKS: Array<{ href: string; label: string; sub: string; icon: React.ElementType }> = [
  { href: "/dashboard",     label: "Panel de Control", sub: "Inicio",      icon: LayoutDashboard },
  { href: "/documents",     label: "Documentos",       sub: "Ver todos",   icon: FileText        },
  { href: "/documents/new", label: "Nuevo Documento",  sub: "Crear",       icon: Plus            },
  { href: "/expedientes",   label: "Expedientes",      sub: "Ver todos",   icon: Briefcase       },
  { href: "/clients",       label: "Clientes",         sub: "Ver todos",   icon: Users           },
];

const MATTER_LABELS: Record<string, string> = {
  civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia",
  comercial: "Comercial", administrativo: "Admin.", constitucional: "Const.",
  tributario: "Tribut.", otro: "Otro",
};

const BADGE_COLORS = {
  red:    "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  amber:  "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  emerald:"bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, viewAllHref, children,
}: {
  title: string;
  icon: React.ElementType;
  viewAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
        </div>
        <Link
          href={viewAllHref}
          tabIndex={-1}
          className="text-xs text-primary hover:underline font-medium"
        >
          Ver todos →
        </Link>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  idx, selected, href, onSelect, onHover, icon, primary, secondary, badge,
}: {
  idx: number;
  selected: boolean;
  href: string;
  onSelect: (href: string) => void;
  onHover: () => void;
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
  badge?: { label: string; color: keyof typeof BADGE_COLORS };
}) {
  return (
    <button
      data-idx={idx}
      onClick={() => onSelect(href)}
      onMouseEnter={onHover}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      )}
    >
      <div className={cn(
        "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
        selected ? "bg-primary/15" : "bg-slate-100 dark:bg-slate-800"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          selected ? "text-primary" : "text-slate-800 dark:text-slate-200"
        )}>
          {primary}
        </p>
        {secondary && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{secondary}</p>
        )}
      </div>
      {badge && (
        <span className={cn(
          "text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
          BADGE_COLORS[badge.color]
        )}>
          {badge.label}
        </span>
      )}
      {selected && <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const [query,        setQuery]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [docs,         setDocs]         = useState<Document[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [expedientes,  setExpedientes]  = useState<Expediente[]>([]);
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [selectedIdx,  setSelectedIdx]  = useState(0);

  // ── Flat list of all navigable items ──────────────────────────────────────
  const allItems: ResultItem[] = query.trim()
    ? [
        ...docs.map(d => ({ kind: "doc"    as const, item: d, href: `/documents/${d.id}`       })),
        ...clients.map(c => ({ kind: "client" as const, item: c, href: `/clients/${c.id}`      })),
        ...expedientes.map(e => ({ kind: "exp"  as const, item: e, href: `/expedientes/${e.id}` })),
        ...vencimientos.map(v => ({ kind: "venc" as const, item: v, href: `/vencimientos`       })),
      ]
    : QUICK_LINKS.map(l => ({ kind: "quick" as const, ...l }));

  // ── Reset + focus on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setDocs([]);
      setClients([]);
      setExpedientes([]);
      setVencimientos([]);
      setSelectedIdx(0);
      // Small delay so the animation completes before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setDocs([]);
      setClients([]);
      setExpedientes([]);
      setSelectedIdx(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [docsRes, clientsRes, expsRes, vencRes] = await Promise.all([
          listDocuments({ query: q, pageSize: 4 }),
          listClients({ query: q, pageSize: 4 }),
          listExpedientes({ query: q, pageSize: 4 }),
          listVencimientos({ pageSize: 4 }).then(r => ({
            items: r.items.filter(v =>
              v.titulo.toLowerCase().includes(q.toLowerCase())
            ),
          })).catch(() => ({ items: [] })),
        ]);
        setDocs(docsRes.documents);
        setClients(clientsRes.clients);
        setExpedientes(expsRes.expedientes);
        setVencimientos(vencRes.items);
        setSelectedIdx(0);
      } catch {
        // silent — search should never break the UI
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // ── Keep selected item in view ────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, allItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (allItems[selectedIdx]) {
          e.preventDefault();
          navigate(allItems[selectedIdx].href);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  if (!open) return null;

  const hasResults = docs.length > 0 || clients.length > 0 || expedientes.length > 0 || vencimientos.length > 0;
  const noResults  = query.trim() !== "" && !loading && !hasResults;

  // Shared index counter for keyboard navigation across sections
  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* ── Input bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          {loading
            ? <Loader2 className="w-5 h-5 text-slate-400 flex-shrink-0 animate-spin" />
            : <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar documentos, clientes, expedientes, vencimientos..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none text-base"
            autoComplete="off"
            spellCheck={false}
            aria-label="Búsqueda global"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 flex-shrink-0"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-400 flex-shrink-0">
            Esc
          </kbd>
        </div>

        {/* ── Results area ───────────────────────────────────────────────── */}
        <div ref={listRef} className="max-h-[440px] overflow-y-auto overscroll-contain">

          {!query.trim() ? (
            /* Quick links */
            <div className="p-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
                Accesos rápidos
              </p>
              {QUICK_LINKS.map((link, i) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    data-idx={i}
                    onClick={() => navigate(link.href)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      selectedIdx === i
                        ? "bg-primary/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedIdx === i ? "bg-primary/15" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Icon className={cn("w-4 h-4", selectedIdx === i ? "text-primary" : "text-slate-500 dark:text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", selectedIdx === i ? "text-primary" : "text-slate-700 dark:text-slate-300")}>
                        {link.label}
                      </p>
                      <p className="text-xs text-slate-400">{link.sub}</p>
                    </div>
                    {selectedIdx === i && <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

          ) : noResults ? (
            /* No results */
            <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
              <Search className="w-9 h-9 text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Sin resultados para "{query}"
              </p>
              <p className="text-xs text-slate-400">
                Intentá con otro término o verificá la ortografía.
              </p>
            </div>

          ) : (
            /* Search results */
            <div className="p-2 space-y-2">

              {/* Documents */}
              {docs.length > 0 && (
                <Section
                  title="Documentos"
                  icon={FileText}
                  viewAllHref={`/documents?query=${encodeURIComponent(query)}`}
                >
                  {docs.map(doc => {
                    const i = globalIdx++;
                    return (
                      <ResultRow
                        key={doc.id}
                        idx={i}
                        selected={selectedIdx === i}
                        href={`/documents/${doc.id}`}
                        onSelect={navigate}
                        onHover={() => setSelectedIdx(i)}
                        icon={<FileText className="w-4 h-4 text-primary" />}
                        primary={formatDocumentType(doc.type)}
                        secondary={[
                          doc.jurisdiccion,
                          new Date(doc.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }),
                        ].filter(Boolean).join(" · ")}
                        badge={doc.lastVersion?.status === "needs_review"
                          ? { label: "Revisar", color: "amber" }
                          : undefined
                        }
                      />
                    );
                  })}
                </Section>
              )}

              {/* Clients */}
              {clients.length > 0 && (
                <Section
                  title="Clientes"
                  icon={Users}
                  viewAllHref={`/clients?query=${encodeURIComponent(query)}`}
                >
                  {clients.map(client => {
                    const i = globalIdx++;
                    const isJuridica = client.type === "persona_juridica";
                    return (
                      <ResultRow
                        key={client.id}
                        idx={i}
                        selected={selectedIdx === i}
                        href={`/clients/${client.id}`}
                        onSelect={navigate}
                        onHover={() => setSelectedIdx(i)}
                        icon={
                          isJuridica
                            ? <Briefcase className="w-4 h-4 text-violet-500" />
                            : <Users className="w-4 h-4 text-sky-500" />
                        }
                        primary={client.name}
                        secondary={[
                          isJuridica ? "Persona Jurídica" : "Persona Física",
                          client.province,
                        ].filter(Boolean).join(" · ")}
                      />
                    );
                  })}
                </Section>
              )}

              {/* Expedientes */}
              {expedientes.length > 0 && (
                <Section
                  title="Expedientes"
                  icon={Briefcase}
                  viewAllHref={`/expedientes?query=${encodeURIComponent(query)}`}
                >
                  {expedientes.map(exp => {
                    const i = globalIdx++;
                    const isOverdue = exp.deadline && new Date(exp.deadline) < new Date();
                    return (
                      <ResultRow
                        key={exp.id}
                        idx={i}
                        selected={selectedIdx === i}
                        href={`/expedientes/${exp.id}`}
                        onSelect={navigate}
                        onHover={() => setSelectedIdx(i)}
                        icon={<Briefcase className="w-4 h-4 text-primary" />}
                        primary={exp.title}
                        secondary={[
                          MATTER_LABELS[exp.matter] ?? exp.matter,
                          exp.client?.name,
                        ].filter(Boolean).join(" · ")}
                        badge={isOverdue ? { label: "Vencido", color: "red" } : undefined}
                      />
                    );
                  })}
                </Section>
              )}

              {/* Vencimientos */}
              {vencimientos.length > 0 && (
                <Section
                  title="Vencimientos"
                  icon={CalendarClock}
                  viewAllHref="/vencimientos"
                >
                  {vencimientos.map(v => {
                    const i = globalIdx++;
                    const isOverdue = v.estado === "vencido" ||
                      new Date(v.fechaVencimiento).getTime() < Date.now();
                    const fv = new Date(v.fechaVencimiento).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                    return (
                      <ResultRow
                        key={v.id}
                        idx={i}
                        selected={selectedIdx === i}
                        href="/vencimientos"
                        onSelect={navigate}
                        onHover={() => setSelectedIdx(i)}
                        icon={<CalendarClock className="w-4 h-4 text-amber-500" />}
                        primary={v.titulo}
                        secondary={[v.expediente?.title, fv].filter(Boolean).join(" · ")}
                        badge={isOverdue ? { label: "Vencido", color: "red" }
                               : v.estado === "completado" ? { label: "Completado", color: "emerald" }
                               : undefined}
                      />
                    );
                  })}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px]">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px]">↵</kbd>
              abrir
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Búsqueda global · Ctrl K</span>
        </div>
      </div>
    </div>
  );
}
