/**
 * Legal Summary
 *
 * Displays a structured legal summary of the document data before generation.
 * Each document type has its own renderer; additionalClauses is shown generically
 * at the bottom of every summary when the user has filled it in.
 */

"use client";

import React from "react";
import type { StructuredDocumentData } from "../../core/types";
import { darkModeClasses, darkBorderColors } from "../styles/dark-mode";

interface LegalSummaryProps {
  documentType: string;
  data: StructuredDocumentData;
  onEdit?: () => void;
}

/** Shared row helper */
function SummaryRow({ label, value }: { label: string; value?: unknown }) {
  if (!value && value !== 0) return null;
  return (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      <strong className="text-slate-700 dark:text-slate-200">{label}:</strong>{" "}
      {String(value)}
    </p>
  );
}

/** Shared section header */
function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function LegalSummary({ documentType, data, onEdit }: LegalSummaryProps) {
  // ── Service Contract ──────────────────────────────────────────────────
  const renderServiceContractSummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Proveedor" value={`${data.proveedor_nombre} (${data.proveedor_doc})`} />
        <SummaryRow label="Cliente" value={`${data.cliente_nombre} (${data.cliente_doc})`} />
      </SummarySection>
      <SummarySection title="Servicio">
        <p className="text-sm text-slate-600 dark:text-slate-300">{String(data.descripcion_servicio ?? "")}</p>
      </SummarySection>
      <SummarySection title="Condiciones Comerciales">
        <SummaryRow label="Monto" value={`${data.monto} ${data.moneda}`} />
        <SummaryRow label="Periodicidad" value={data.periodicidad} />
        <SummaryRow label="Forma de pago" value={data.forma_pago} />
      </SummarySection>
      <SummarySection title="Vigencia">
        <SummaryRow label="Inicio" value={data.inicio_vigencia} />
        <SummaryRow label="Plazo mínimo" value={data.plazo_minimo_meses ? `${data.plazo_minimo_meses} meses` : undefined} />
      </SummarySection>
      {data.confidencialidad && (
        <SummarySection title="Confidencialidad">
          <SummaryRow label="Plazo" value={data.plazo_confidencialidad ? `${data.plazo_confidencialidad} años` : undefined} />
        </SummarySection>
      )}
    </div>
  );

  // ── NDA ───────────────────────────────────────────────────────────────
  const renderNDASummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Revelador" value={`${data.revelador_nombre} (${data.revelador_doc})`} />
        <SummaryRow label="Receptor" value={`${data.receptor_nombre} (${data.receptor_doc})`} />
      </SummarySection>
      <SummarySection title="Información Confidencial">
        <p className="text-sm text-slate-600 dark:text-slate-300">{String(data.definicion_informacion ?? "")}</p>
      </SummarySection>
      <SummarySection title="Finalidad Permitida">
        <p className="text-sm text-slate-600 dark:text-slate-300">{String(data.finalidad_permitida ?? "")}</p>
      </SummarySection>
      <SummarySection title="Plazo de Confidencialidad">
        <SummaryRow label="Duración" value={data.plazo_confidencialidad ? `${data.plazo_confidencialidad} años` : undefined} />
      </SummarySection>
    </div>
  );

  // ── Legal Notice ──────────────────────────────────────────────────────
  const renderLegalNoticeSummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Remitente" value={`${data.remitente_nombre} (${data.remitente_doc})`} />
        <SummaryRow label="Destinatario" value={`${data.destinatario_nombre} (${data.destinatario_doc})`} />
      </SummarySection>
      <SummarySection title="Contexto">
        <p className="text-sm text-slate-600 dark:text-slate-300">{String(data.relacion_previa ?? "")}</p>
      </SummarySection>
      <SummarySection title="Hechos">
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{String(data.hechos ?? "")}</p>
      </SummarySection>
      <SummarySection title="Intimación">
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{String(data.intimacion ?? "")}</p>
        <SummaryRow label="Plazo para cumplir" value={data.plazo_cumplimiento} />
      </SummarySection>
    </div>
  );

  // ── Lease Agreement ───────────────────────────────────────────────────
  const renderLeaseAgreementSummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Locador" value={`${data.locador_nombre} (${data.locador_doc})`} />
        <SummaryRow label="Locatario" value={`${data.locatario_nombre} (${data.locatario_doc})`} />
      </SummarySection>
      <SummarySection title="Objeto de la Locación">
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{String(data.descripcion_inmueble ?? "")}</p>
        <SummaryRow label="Dirección" value={data.domicilio_inmueble} />
        <SummaryRow label="Destino" value={data.destino_uso} />
      </SummarySection>
      <SummarySection title="Condiciones Económicas">
        <SummaryRow label="Canon mensual" value={`${data.monto_alquiler} ${data.moneda}`} />
        <SummaryRow label="Forma de pago" value={data.forma_pago} />
        {data.ajuste_precio && data.ajuste_precio !== "ninguno" && (
          <SummaryRow label="Ajuste" value={data.ajuste_precio} />
        )}
      </SummarySection>
      <SummarySection title="Plazo">
        <SummaryRow label="Inicio" value={data.fecha_inicio} />
        <SummaryRow label="Duración" value={data.duracion_meses ? `${data.duracion_meses} meses` : undefined} />
      </SummarySection>
      {data.deposito && (
        <SummarySection title="Depósito de Garantía">
          <SummaryRow label="Meses" value={data.deposito_meses} />
        </SummarySection>
      )}
    </div>
  );

  // ── Debt Recognition ──────────────────────────────────────────────────
  const renderDebtRecognitionSummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Acreedor" value={`${data.acreedor_nombre} (${data.acreedor_doc})`} />
        <SummaryRow label="Deudor" value={`${data.deudor_nombre} (${data.deudor_doc})`} />
      </SummarySection>
      <SummarySection title="Deuda Reconocida">
        <SummaryRow label="Monto total" value={`${data.monto_deuda} ${data.moneda}`} />
        <SummaryRow label="Fecha de reconocimiento" value={data.fecha_reconocimiento} />
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
          <strong className="text-slate-700 dark:text-slate-200">Causa:</strong>{" "}
          {String(data.causa_deuda ?? "")}
        </p>
      </SummarySection>
      <SummarySection title="Forma de Pago">
        <SummaryRow label="Modalidad" value={data.pago_en_cuotas ? "En cuotas" : "Pago único"} />
        {data.pago_en_cuotas && (
          <>
            <SummaryRow label="Cuotas" value={data.cantidad_cuotas} />
            <SummaryRow label="Monto por cuota" value={data.monto_cuota ? `${data.monto_cuota} ${data.moneda}` : undefined} />
          </>
        )}
        <SummaryRow label="Primer vencimiento" value={data.fecha_primer_vencimiento} />
        <SummaryRow label="Forma" value={data.forma_pago} />
        {data.incluye_intereses && (
          <SummaryRow label="Intereses" value={data.tasa_interes} />
        )}
      </SummarySection>
    </div>
  );

  // ── Simple Authorization ──────────────────────────────────────────────
  const renderSimpleAuthorizationSummary = () => (
    <div className="space-y-4">
      <SummarySection title="Partes">
        <SummaryRow label="Autorizante" value={`${data.autorizante_nombre} (${data.autorizante_doc})`} />
        <SummaryRow label="Autorizado" value={`${data.autorizado_nombre} (${data.autorizado_doc})`} />
      </SummarySection>
      <SummarySection title="Acto Autorizado">
        <SummaryRow label="Trámite" value={data.tramite_autorizado} />
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4">
          <strong className="text-slate-700 dark:text-slate-200">Alcance:</strong>{" "}
          {String(data.descripcion_alcance ?? "")}
        </p>
        {data.limitaciones && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            <strong className="text-slate-700 dark:text-slate-200">Límites:</strong>{" "}
            {String(data.limitaciones)}
          </p>
        )}
      </SummarySection>
      <SummarySection title="Vigencia">
        <SummaryRow label="Fecha" value={data.fecha_autorizacion} />
        <SummaryRow
          label="Tipo"
          value={data.acto_unico ? "Por acto único" : data.vigencia_hasta ? `Hasta ${data.vigencia_hasta}` : "Sin plazo definido"}
        />
      </SummarySection>
    </div>
  );

  // ── Render specific summary ───────────────────────────────────────────
  const renderTypeSpecificSummary = () => {
    switch (documentType) {
      case "service_contract":
        return renderServiceContractSummary();
      case "nda":
        return renderNDASummary();
      case "legal_notice":
        return renderLegalNoticeSummary();
      case "lease":
        return renderLeaseAgreementSummary();
      case "debt_recognition":
        return renderDebtRecognitionSummary();
      case "simple_authorization":
        return renderSimpleAuthorizationSummary();
      default:
        return (
          <p className={`text-sm ${darkModeClasses.subtitle}`}>
            Resumen no disponible para este tipo de documento.
          </p>
        );
    }
  };

  return (
    <div className={`rounded-lg shadow-sm p-6 ${darkModeClasses.card}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkModeClasses.title}`}>Resumen Jurídico</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className={`text-sm transition-colors ${darkModeClasses.link}`}
          >
            Editar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Type-specific summary */}
        {renderTypeSpecificSummary()}

        {/* Generic additionalClauses block — shown for ALL types when present */}
        {data.additionalClauses && String(data.additionalClauses).trim().length > 0 && (
          <div className={`pt-4 border-t ${darkBorderColors.default}`}>
            <SummarySection title="Información Adicional / Cláusulas Especiales">
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {String(data.additionalClauses)}
              </p>
            </SummarySection>
          </div>
        )}
      </div>

      <div className={`mt-6 pt-4 border-t ${darkBorderColors.default}`}>
        <p className={`text-xs ${darkModeClasses.helpText}`}>
          Este es un resumen de la información proporcionada. Revisá los datos antes de generar el documento.
        </p>
      </div>
    </div>
  );
}
