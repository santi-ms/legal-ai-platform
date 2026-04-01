import { describe, it, expect } from "vitest";
import {
  generateClausePlan,
  assembleBaseDraft,
} from "./generation-engine.js";
import type { TemplateBase, ClauseDefinition } from "./generation-engine.js";
import type { StructuredDocumentData } from "./document-types.js";

// ---------------------------------------------------------------------------
// generateClausePlan
// ---------------------------------------------------------------------------

describe("generateClausePlan", () => {
  const baseData: StructuredDocumentData = { jurisdiccion: "caba" };

  it("incluye todas las cláusulas requeridas en el plan", () => {
    const plan = generateClausePlan(
      "service_contract",
      baseData,
      ["identificacion_partes", "objeto_contrato"],
      []
    );
    expect(plan.required).toEqual(["identificacion_partes", "objeto_contrato"]);
    expect(plan.optional).toEqual([]);
    expect(plan.order).toEqual(["identificacion_partes", "objeto_contrato"]);
  });

  it("incluye cláusulas opcionales cuya condición es verdadera", () => {
    const dataConConfidencialidad = { ...baseData, confidencialidad: true };
    const plan = generateClausePlan(
      "service_contract",
      dataConConfidencialidad,
      ["identificacion_partes"],
      [
        { id: "confidencialidad", condition: (d) => Boolean(d.confidencialidad) },
        { id: "propiedad_intelectual", condition: (d) => Boolean(d.propiedad_intelectual) },
      ]
    );
    expect(plan.optional).toContain("confidencialidad");
    expect(plan.optional).not.toContain("propiedad_intelectual");
  });

  it("incluye cláusulas opcionales sin condición siempre", () => {
    const plan = generateClausePlan(
      "nda",
      baseData,
      [],
      [{ id: "resolucion_disputas" }]
    );
    expect(plan.optional).toContain("resolucion_disputas");
  });

  it("el orden pone requeridas primero, opcionales después", () => {
    const plan = generateClausePlan(
      "service_contract",
      { ...baseData, confidencialidad: true },
      ["identificacion_partes", "objeto_contrato"],
      [{ id: "confidencialidad", condition: (d) => Boolean(d.confidencialidad) }]
    );
    expect(plan.order).toEqual([
      "identificacion_partes",
      "objeto_contrato",
      "confidencialidad",
    ]);
  });

  it("metadata refleja los conteos correctos", () => {
    const plan = generateClausePlan(
      "lease",
      { ...baseData, deposito: true },
      ["objeto_locacion", "canon_locativo"],
      [{ id: "deposito_garantia", condition: (d) => Boolean(d.deposito) }]
    );
    expect(plan.metadata.requiredCount).toBe(2);
    expect(plan.metadata.optionalCount).toBe(1);
    expect(plan.metadata.totalClauses).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// assembleBaseDraft
// ---------------------------------------------------------------------------

describe("assembleBaseDraft", () => {
  const template: TemplateBase = {
    id: "test_template",
    version: "1.0",
    content: "CONTRATO\n\nPartes: {{PARTIES}}\n\n{{CLAUSE_IDENTIFICATION}}\n\n{{CLAUSE_OBJECT}}\n\nJurisdicción: {{JURISDICTION}}",
    variablePlaceholders: ["{{PARTIES}}", "{{JURISDICTION}}"],
    clauseSlots: ["{{CLAUSE_IDENTIFICATION}}", "{{CLAUSE_OBJECT}}"],
  };

  const clauseMap = new Map<string, ClauseDefinition>([
    [
      "identificacion_partes",
      {
        id: "identificacion_partes",
        name: "Identificación de Partes",
        content: "{{CLAUSE_NUMBER}}. PARTES\n\n{{PARTIES}}",
        category: "common",
        required: true,
      },
    ],
    [
      "objeto_contrato",
      {
        id: "objeto_contrato",
        name: "Objeto del Contrato",
        content: "{{CLAUSE_NUMBER}}. OBJETO\n\nServicio: test",
        category: "type_specific",
        required: true,
      },
    ],
  ]);

  const data: StructuredDocumentData = {
    jurisdiccion: "caba",
    proveedor_nombre: "Empresa S.A.",
    proveedor_doc: "30-12345678-9",
    proveedor_domicilio: "Corrientes 1234",
    cliente_nombre: "Cliente SRL",
    cliente_doc: "20-98765432-1",
    cliente_domicilio: "Lavalle 567",
  };

  const clausePlan = {
    required: ["identificacion_partes", "objeto_contrato"],
    optional: [],
    order: ["identificacion_partes", "objeto_contrato"],
    metadata: {},
  };

  it("reemplaza placeholders de jurisdicción correctamente", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).toContain("Ciudad Autónoma de Buenos Aires");
  });

  it("reemplaza placeholder {{PARTIES}} con los nombres de las partes", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).toContain("Empresa S.A.");
    expect(draft).toContain("Cliente SRL");
  });

  it("inserta cláusulas en los slots correspondientes", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).toContain("PRIMERA. PARTES");
    expect(draft).toContain("SEGUNDA. OBJETO");
  });

  it("no deja placeholders sin reemplazar ({{VAR}}) en el output", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it("elimina líneas vacías múltiples consecutivas", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).not.toMatch(/\n{3,}/);
  });

  it("no tiene whitespace al inicio ni al final", () => {
    const draft = assembleBaseDraft(template, clauseMap, clausePlan, data);
    expect(draft).toBe(draft.trim());
  });

  it("appends clause content if slot not found in template", () => {
    const templateSinSlot: TemplateBase = {
      ...template,
      content: "CONTRATO\n\n{{PARTIES}}",
      clauseSlots: [],
    };
    const planConSoloObjeto = {
      required: ["objeto_contrato"],
      optional: [],
      order: ["objeto_contrato"],
      metadata: {},
    };
    const draft = assembleBaseDraft(templateSinSlot, clauseMap, planConSoloObjeto, data);
    expect(draft).toContain("OBJETO");
  });

  it("maneja data vacía sin lanzar error", () => {
    const emptyData: StructuredDocumentData = {};
    expect(() =>
      assembleBaseDraft(template, clauseMap, clausePlan, emptyData)
    ).not.toThrow();
  });

  it("numeración ordinal es correcta (PRIMERA, SEGUNDA, TERCERA...)", () => {
    const thirdClause: ClauseDefinition = {
      id: "foro_competencia",
      name: "Foro",
      content: "{{CLAUSE_NUMBER}}. JURISDICCIÓN",
      category: "common",
      required: true,
    };
    const extendedMap = new Map(clauseMap);
    extendedMap.set("foro_competencia", thirdClause);

    const extendedPlan = {
      required: ["identificacion_partes", "objeto_contrato", "foro_competencia"],
      optional: [],
      order: ["identificacion_partes", "objeto_contrato", "foro_competencia"],
      metadata: {},
    };

    const templateConTres: TemplateBase = {
      ...template,
      content: "{{CLAUSE_IDENTIFICATION}}\n{{CLAUSE_OBJECT}}\n{{CLAUSE_JURISDICTION}}",
      clauseSlots: ["{{CLAUSE_IDENTIFICATION}}", "{{CLAUSE_OBJECT}}", "{{CLAUSE_JURISDICTION}}"],
    };

    const draft = assembleBaseDraft(templateConTres, extendedMap, extendedPlan, data);
    expect(draft).toContain("PRIMERA.");
    expect(draft).toContain("SEGUNDA.");
    expect(draft).toContain("TERCERA.");
  });
});
