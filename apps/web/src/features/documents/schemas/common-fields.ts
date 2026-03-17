/**
 * Common Fields shared across all document schemas
 *
 * Use additionalClausesSection in any schema to add the shared
 * "Información adicional o cláusulas especiales" field at the end of the form.
 * Set order: 99 so it always appears last, regardless of the type-specific sections.
 */

import type { DocumentSection } from "../core/types";

/**
 * Shared section for free-text additional clauses / extra information.
 * Apply to every document schema with order: 99.
 */
export const additionalClausesSection: DocumentSection = {
  id: "additional_clauses",
  title: "Información Adicional o Cláusulas Especiales",
  description:
    "Agregá cualquier detalle, condición o cláusula que quieras incluir en el documento y que no haya sido contemplada en las preguntas anteriores.",
  order: 99,
  fields: [
    {
      id: "additionalClauses",
      label: "Información adicional o cláusulas especiales",
      type: "textarea",
      required: false,
      placeholder:
        "Ej.: incluir cláusula de confidencialidad reforzada, establecer una multa específica por incumplimiento, aclarar una condición especial de pago, limitar el alcance de la autorización, etc.",
      helpText:
        "Agregá acá cualquier detalle, condición o cláusula que quieras incluir en el documento y que no haya sido contemplada en las preguntas anteriores.",
      rows: 8,
      validation: {
        maxLength: 3000,
      },
    },
  ],
};


