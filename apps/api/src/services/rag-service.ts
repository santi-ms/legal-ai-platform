/**
 * RAG Service — Búsqueda en códigos legales argentinos
 *
 * Búsqueda en dos capas:
 *   1. Full-Text Search via stored function search_legal_codes() (FTS español)
 *   2. Trigrama pg_trgm como fallback si FTS no encuentra resultados
 *
 * Capa futura (opcional):
 *   3. Vector search via Voyage AI voyage-law-2 cuando VOYAGE_API_KEY está configurado
 */

import { prisma } from "../db.js";
import { logger } from "../utils/logger.js";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LegalCodeResult {
  id:           string;
  code:         string;
  jurisdiction: string;
  article:      string;
  sectionTitle: string | null;
  text:         string;
  rank:         number;
  citation:     string;
}

export interface SearchOptions {
  jurisdiction?: string;
  code?:         string;
  limit?:        number;
}

// ─── Code label mapping ───────────────────────────────────────────────────────

export const CODE_LABELS: Record<string, string> = {
  CCCN:            "CCCN",
  CPCCN:           "CPCCN",
  CPCC_MISIONES:   "CPCC Misiones",
  CPCC_CORRIENTES: "CPCC Corrientes",
  CPCC_BSAS:       "CPCC Bs.As.",
  CPCC_CABA:       "CPC CABA",
  LCT:             "LCT",
  CP:              "CP",
  CPPN:            "CPPN",
  LCA:             "Ley 24.522",
};

export function buildCitation(code: string, article: string): string {
  const label = CODE_LABELS[code] ?? code;
  return `Art. ${article} ${label}`;
}

// ─── Tipos raw SQL ────────────────────────────────────────────────────────────

interface RawChunk {
  id:           string;
  code:         string;
  jurisdiction: string;
  article:      string;
  sectionTitle: string | null;
  text:         string;
  rank:         number | string;
}

// ─── FTS Search ───────────────────────────────────────────────────────────────

export async function searchLegalCodes(
  query:   string,
  options: SearchOptions = {}
): Promise<LegalCodeResult[]> {
  if (!query || query.trim().length < 3) return [];

  const { jurisdiction, code, limit = 8 } = options;

  try {
    // Use the stored function for FTS search
    const ftsResults = await prisma.$queryRaw<RawChunk[]>`
      SELECT * FROM search_legal_codes(
        ${query},
        ${jurisdiction ?? null},
        ${code ?? null},
        ${limit}
      )
    `;

    if (ftsResults.length > 0) {
      logger.debug(`[rag] FTS: ${ftsResults.length} resultados para "${query}"`);
      return ftsResults.map((r) => ({
        id:           r.id,
        code:         r.code,
        jurisdiction: r.jurisdiction,
        article:      r.article,
        sectionTitle: r.sectionTitle,
        text:         r.text,
        rank:         Number(r.rank),
        citation:     buildCitation(r.code, r.article),
      }));
    }

    // Trigram fallback
    const jurisdictionFilter = jurisdiction
      ? prisma.$queryRaw`AND jurisdiction = ${jurisdiction}`
      : prisma.$queryRaw``;
    const codeFilter = code
      ? prisma.$queryRaw`AND code = ${code}`
      : prisma.$queryRaw``;

    const trgmResults = await prisma.$queryRaw<RawChunk[]>`
      SELECT
        id, code, jurisdiction, article, "sectionTitle", text,
        similarity(text, ${query}) AS rank
      FROM "LegalCodeChunk"
      WHERE
        text % ${query}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    logger.debug(`[rag] Trigrama: ${trgmResults.length} resultados para "${query}"`);
    return trgmResults.map((r) => ({
      id:           r.id,
      code:         r.code,
      jurisdiction: r.jurisdiction,
      article:      r.article,
      sectionTitle: r.sectionTitle,
      text:         r.text,
      rank:         Number(r.rank),
      citation:     buildCitation(r.code, r.article),
    }));

  } catch (err) {
    logger.error("[rag] Error buscando códigos legales", { err, query });
    return [];
  }
}

// ─── Vector search ────────────────────────────────────────────────────────────

export async function searchLegalCodesVector(
  query:   string,
  options: SearchOptions = {}
): Promise<LegalCodeResult[]> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) return searchLegalCodes(query, options);

  const { jurisdiction, code, limit = 8 } = options;

  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${voyageKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:      "voyage-law-2",
        input:      [query],
        input_type: "query",
      }),
    });

    if (!res.ok) {
      logger.warn("[rag] Voyage AI error, usando FTS fallback");
      return searchLegalCodes(query, options);
    }

    const data = await res.json() as { data: Array<{ embedding: number[] }> };
    const embedding = data.data[0]?.embedding;
    if (!embedding) return searchLegalCodes(query, options);

    const vectorStr = `[${embedding.join(",")}]`;

    interface RawVectorChunk {
      id: string; code: string; jurisdiction: string;
      article: string; sectionTitle: string | null;
      text: string; distance: number | string;
    }

    const vectorResults = await prisma.$queryRaw<RawVectorChunk[]>`
      SELECT
        id, code, jurisdiction, article, "sectionTitle", text,
        (embedding <=> ${vectorStr}::vector) AS distance
      FROM "LegalCodeChunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    if (vectorResults.length > 0) {
      logger.debug(`[rag] Vector: ${vectorResults.length} resultados`);
      return vectorResults.map((r) => ({
        id:           r.id,
        code:         r.code,
        jurisdiction: r.jurisdiction,
        article:      r.article,
        sectionTitle: r.sectionTitle,
        text:         r.text,
        rank:         1 - Number(r.distance),
        citation:     buildCitation(r.code, r.article),
      }));
    }

    return searchLegalCodes(query, options);
  } catch (err) {
    logger.error("[rag] Error en búsqueda vectorial, usando FTS fallback", { err });
    return searchLegalCodes(query, options);
  }
}

// ─── Función principal (elige automáticamente FTS o vector) ──────────────────

export async function findRelevantArticles(
  query:   string,
  options: SearchOptions = {}
): Promise<LegalCodeResult[]> {
  return process.env.VOYAGE_API_KEY
    ? searchLegalCodesVector(query, options)
    : searchLegalCodes(query, options);
}

// ─── Formato para prompt de Claude ───────────────────────────────────────────

export function formatRagContext(results: LegalCodeResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map((r) => {
    const section = r.sectionTitle ? ` [${r.sectionTitle}]` : "";
    return `**${r.citation}**${section}:\n${r.text.trim()}`;
  });

  return `\n\n[ARTÍCULOS RELEVANTES DE LOS CÓDIGOS:\n${lines.join("\n\n")}\n]`;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getLegalCodeStats(): Promise<{
  total: number;
  byCodes: Array<{ code: string; jurisdiction: string; count: number }>;
}> {
  const total = await prisma.legalCodeChunk.count();
  const byCodes = await prisma.legalCodeChunk.groupBy({
    by:      ["code", "jurisdiction"],
    _count:  { id: true },
    orderBy: [{ jurisdiction: "asc" }, { code: "asc" }],
  });
  return {
    total,
    byCodes: byCodes.map((r) => ({
      code:         r.code,
      jurisdiction: r.jurisdiction,
      count:        r._count.id,
    })),
  };
}
