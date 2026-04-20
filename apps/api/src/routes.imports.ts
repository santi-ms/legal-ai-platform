/**
 * Import Routes — Importación masiva de datos desde Excel/CSV
 *
 * GET  /imports/template?type=clients|expedientes|honorarios  → descarga plantilla
 * POST /imports/validate   → dry-run: retorna preview + errores + duplicados
 * POST /imports/execute    → ejecuta la importación real
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";
import { parseImport, generateTemplate, type ImportType, type ParsedRow } from "./utils/import-parser.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
}

async function getTenantAndUser(request: any, reply: any) {
  const user = getUserFromRequest(request);
  if (!user) { unauthorized(reply); return null; }
  if (!user.tenantId) {
    reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
    return null;
  }
  return user;
}

const IMPORT_TYPES: ImportType[] = ["clients", "expedientes", "honorarios"];

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerImportRoutes(app: FastifyInstance) {

  // ── GET /imports/template ─────────────────────────────────────────────────
  app.get("/imports/template", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { type } = request.query as { type?: string };
    if (!type || !IMPORT_TYPES.includes(type as ImportType)) {
      return reply.status(400).send({ ok: false, error: "INVALID_TYPE", message: "type debe ser: clients, expedientes o honorarios" });
    }

    const buffer = generateTemplate(type as ImportType);
    const names: Record<ImportType, string> = {
      clients: "plantilla-clientes.xlsx",
      expedientes: "plantilla-expedientes.xlsx",
      honorarios: "plantilla-honorarios.xlsx",
    };

    return reply
      .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", `attachment; filename="${names[type as ImportType]}"`)
      .send(buffer);
  });

  // ── POST /imports/validate ─────────────────────────────────────────────────
  app.post("/imports/validate", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const data = await (request as any).file();
    if (!data) return reply.status(400).send({ ok: false, error: "NO_FILE", message: "Adjuntá un archivo" });

    const type = (data.fields?.type?.value ?? "") as string;
    if (!IMPORT_TYPES.includes(type as ImportType)) {
      return reply.status(400).send({ ok: false, error: "INVALID_TYPE" });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ ok: false, error: "FILE_TOO_LARGE", message: "El archivo no puede superar 10MB" });
    }

    const result = parseImport(buffer, data.filename, type as ImportType);

    // Calcular duplicados contra la DB
    let duplicates = 0;
    if (type === "clients") {
      const names = result.rows.map((r) => String(r.name ?? "").toLowerCase()).filter(Boolean);
      const docs  = result.rows.map((r) => String(r.documentNumber ?? "")).filter(Boolean);
      const [byName, byDoc] = await Promise.all([
        prisma.client.count({ where: { tenantId: user.tenantId!, name: { in: names, mode: "insensitive" }, archivedAt: null } }),
        docs.length ? prisma.client.count({ where: { tenantId: user.tenantId!, documentNumber: { in: docs } } }) : Promise.resolve(0),
      ]);
      duplicates = Math.max(byName, byDoc);
    }

    if (type === "expedientes") {
      const numbers = result.rows.map((r) => String(r.number ?? "")).filter(Boolean);
      if (numbers.length) {
        duplicates = await prisma.expediente.count({
          where: { tenantId: user.tenantId!, number: { in: numbers } },
        });
      }
    }

    return reply.send({
      ok: true,
      type,
      totalRows:          result.totalRows,
      validRows:          result.validRows,
      errorRows:          result.errors.length,
      duplicateCandidates: duplicates,
      willCreate:         Math.max(0, result.validRows - duplicates),
      mapping:            result.mapping,
      errors:             result.errors.slice(0, 50), // máx 50 errores en preview
      preview:            result.rows.slice(0, 5),    // primeras 5 filas válidas
    });
  });

  // ── POST /imports/execute ──────────────────────────────────────────────────
  app.post("/imports/execute", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const data = await (request as any).file();
    if (!data) return reply.status(400).send({ ok: false, error: "NO_FILE" });

    const type = (data.fields?.type?.value ?? "") as string;
    const skipDuplicates = (data.fields?.skipDuplicates?.value ?? "true") === "true";

    if (!IMPORT_TYPES.includes(type as ImportType)) {
      return reply.status(400).send({ ok: false, error: "INVALID_TYPE" });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const result = parseImport(buffer, data.filename, type as ImportType);

    let created = 0;
    let skipped = 0;
    const failed: { row: number; reason: string }[] = [];

    if (type === "clients") {
      for (const row of result.rows) {
        try {
          if (skipDuplicates && row.name) {
            const exists = await prisma.client.findFirst({
              where: {
                tenantId: user.tenantId!,
                OR: [
                  { name: { equals: String(row.name), mode: "insensitive" } },
                  ...(row.documentNumber ? [{ documentNumber: String(row.documentNumber) }] : []),
                ],
                archivedAt: null,
              },
            });
            if (exists) { skipped++; continue; }
          }

          await prisma.client.create({
            data: {
              tenantId:       user.tenantId!,
              createdById:    user.userId!,
              name:           String(row.name).trim(),
              type:           row.type ?? "persona_fisica",
              documentType:   row.documentType ? String(row.documentType).trim() : null,
              documentNumber: row.documentNumber ? String(row.documentNumber).trim() : null,
              email:          row.email ? String(row.email).trim() : null,
              phone:          row.phone ? String(row.phone).trim() : null,
              address:        row.address ? String(row.address).trim() : null,
              city:           row.city ? String(row.city).trim() : null,
              province:       row.province ? String(row.province).trim() : null,
              notes:          row.notes ? String(row.notes).trim() : null,
            },
          });
          created++;
        } catch (err: any) {
          failed.push({ row: row._row, reason: err?.message ?? "Error desconocido" });
        }
      }
    }

    if (type === "expedientes") {
      for (const row of result.rows) {
        try {
          if (skipDuplicates && row.number) {
            const exists = await prisma.expediente.findFirst({
              where: { tenantId: user.tenantId!, number: String(row.number) },
            });
            if (exists) { skipped++; continue; }
          }

          await prisma.expediente.create({
            data: {
              tenantId:      user.tenantId!,
              createdById:   user.userId!,
              title:         String(row.title).trim(),
              number:        row.number ? String(row.number).trim() : null,
              matter:        row.matter ?? "otro",
              status:        row.status ?? "activo",
              court:         row.court ? String(row.court).trim() : null,
              judge:         row.judge ? String(row.judge).trim() : null,
              opposingParty: row.opposingParty ? String(row.opposingParty).trim() : null,
              openedAt:      row.openedAt ? new Date(row.openedAt) : new Date(),
              deadline:      row.deadline ? new Date(row.deadline) : null,
              notes:         row.notes ? String(row.notes).trim() : null,
            },
          });
          created++;
        } catch (err: any) {
          failed.push({ row: row._row, reason: err?.message ?? "Error desconocido" });
        }
      }
    }

    if (type === "honorarios") {
      for (const row of result.rows) {
        try {
          await prisma.honorario.create({
            data: {
              tenantId:         user.tenantId!,
              createdById:      user.userId!,
              tipo:             row.tipo ?? "otro",
              concepto:         String(row.concepto).trim(),
              monto:            row.monto ?? 0,
              moneda:           row.moneda ? String(row.moneda).toUpperCase().trim() : "ARS",
              estado:           row.estado ?? "presupuestado",
              fechaEmision:     row.fechaEmision ? new Date(row.fechaEmision) : new Date(),
              fechaVencimiento: row.fechaVencimiento ? new Date(row.fechaVencimiento) : null,
              notas:            row.notes ? String(row.notes).trim() : null,
            },
          });
          created++;
        } catch (err: any) {
          failed.push({ row: row._row, reason: err?.message ?? "Error desconocido" });
        }
      }
    }

    return reply.send({
      ok: true,
      type,
      created,
      skipped,
      failed: failed.length,
      failedDetails: failed.slice(0, 20),
    });
  });
}
