/**
 * Document Sharing Routes
 *
 * POST   /documents/:id/share          — crear link de compartición (auth)
 * GET    /documents/:id/shares         — listar links activos del doc (auth)
 * DELETE /documents/shares/:shareId    — revocar link (auth)
 * GET    /shared/:token                — info pública del documento (sin auth)
 * GET    /shared/:token/pdf            — descarga PDF pública (sin auth)
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

const DOC_TYPE_LABELS: Record<string, string> = {
  service_contract:     "Contrato de Servicios",
  nda:                  "Acuerdo de Confidencialidad",
  legal_notice:         "Carta Documento",
  lease:                "Contrato de Locación",
  debt_recognition:     "Reconocimiento de Deuda",
  simple_authorization: "Autorización Simple",
};

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerSharingRoutes(app: FastifyInstance) {

  // ── POST /documents/:id/share ─────────────────────────────────────────────
  // Creates a public share link (expires in N days, default 7)
  app.post("/documents/:id/share", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

      const { id: documentId } = request.params as { id: string };

      const BodySchema = z.object({
        expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
      });
      const body = BodySchema.safeParse(request.body ?? {});
      const expiresInDays = body.success ? body.data.expiresInDays : 7;

      // Verify the document belongs to this tenant
      const doc = await prisma.document.findFirst({
        where: { id: documentId, tenantId: user.tenantId },
        select: { id: true },
      });
      if (!doc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

      const expiresAt = addDays(new Date(), expiresInDays);
      const token     = newToken();

      const share = await prisma.documentShare.create({
        data: {
          documentId,
          tenantId:    user.tenantId,
          createdById: user.userId,
          token,
          expiresAt,
          updatedAt:   new Date(),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const shareUrl    = `${frontendUrl}/share/${token}`;

      return reply.status(201).send({
        ok: true,
        share: {
          id:        share.id,
          token:     share.token,
          shareUrl,
          expiresAt: share.expiresAt,
          viewCount: share.viewCount,
          status:    share.status,
          createdAt: share.createdAt,
        },
      });
    } catch (err: any) {
      request.log.error({ err }, "POST /documents/:id/share");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── GET /documents/:id/shares ─────────────────────────────────────────────
  app.get("/documents/:id/shares", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

      const { id: documentId } = request.params as { id: string };

      const doc = await prisma.document.findFirst({
        where: { id: documentId, tenantId: user.tenantId },
        select: { id: true },
      });
      if (!doc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

      const shares = await prisma.documentShare.findMany({
        where: { documentId, tenantId: user.tenantId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, token: true, expiresAt: true,
          viewCount: true, lastViewedAt: true, status: true, createdAt: true,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const sharesWithUrl = shares.map((s) => ({
        ...s,
        shareUrl: `${frontendUrl}/share/${s.token}`,
        isExpired: s.expiresAt < new Date(),
      }));

      return reply.send({ ok: true, shares: sharesWithUrl });
    } catch (err: any) {
      request.log.error({ err }, "GET /documents/:id/shares");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── DELETE /documents/shares/:shareId ────────────────────────────────────
  app.delete("/documents/shares/:shareId", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

      const { shareId } = request.params as { shareId: string };

      // Defense in depth: updateMany filtra por tenantId en el propio write.
      const result = await prisma.documentShare.updateMany({
        where: { id: shareId, tenantId: user.tenantId },
        data:  { status: "revoked", updatedAt: new Date() },
      });
      if (result.count === 0) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

      return reply.send({ ok: true });
    } catch (err: any) {
      request.log.error({ err }, "DELETE /documents/shares/:shareId");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── GET /shared/:token  (PUBLIC — no auth) ───────────────────────────────
  app.get("/shared/:token", async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const share = await prisma.documentShare.findUnique({
        where: { token },
        include: {
          document: {
            select: {
              id: true, type: true, jurisdiccion: true, tono: true,
              createdAt: true,
              client: { select: { name: true, type: true } },
              versions: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, pdfUrl: true, status: true, createdAt: true },
              },
            },
          },
        },
      });

      if (!share) {
        return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Link no encontrado o inválido." });
      }
      if (share.status === "revoked") {
        return reply.status(410).send({ ok: false, error: "REVOKED", message: "Este link fue revocado por el titular." });
      }
      if (share.expiresAt < new Date()) {
        return reply.status(410).send({ ok: false, error: "EXPIRED", message: "Este link ha expirado." });
      }

      // Increment view count (fire and forget)
      prisma.documentShare.update({
        where: { id: share.id },
        data: { viewCount: { increment: 1 }, lastViewedAt: new Date(), updatedAt: new Date() },
      }).catch(() => {});

      const apiUrl = process.env.API_URL || `http://localhost:4001`;
      const doc = share.document;

      return reply.send({
        ok: true,
        share: {
          id:        share.id,
          expiresAt: share.expiresAt,
          viewCount: share.viewCount + 1,
        },
        document: {
          id:           doc.id,
          type:         doc.type,
          typeLabel:    DOC_TYPE_LABELS[doc.type] ?? doc.type,
          jurisdiccion: doc.jurisdiccion,
          createdAt:    doc.createdAt,
          client:       doc.client,
          hasPdf:       !!doc.versions[0]?.pdfUrl,
          pdfUrl:       doc.versions[0]?.pdfUrl
            ? `${apiUrl}/shared/${token}/pdf`
            : null,
        },
      });
    } catch (err: any) {
      request.log.error({ err }, "GET /shared/:token");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── GET /shared/:token/pdf  (PUBLIC — no auth) ───────────────────────────
  app.get("/shared/:token/pdf", async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const share = await prisma.documentShare.findUnique({
        where: { token },
        include: {
          document: {
            select: {
              id: true,
              versions: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { pdfUrl: true },
              },
            },
          },
        },
      });

      if (!share || share.status === "revoked" || share.expiresAt < new Date()) {
        return reply.status(410).send({ ok: false, error: "UNAVAILABLE" });
      }

      const pdfUrl = share.document.versions[0]?.pdfUrl;
      if (!pdfUrl) {
        return reply.status(404).send({ ok: false, error: "PDF_NOT_READY" });
      }

      // Proxy the PDF from the storage URL
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";
      const fileName = pdfUrl.split("/").pop() ?? "documento.pdf";
      const fullUrl  = pdfUrl.startsWith("http") ? pdfUrl : `${pdfServiceUrl}/pdf/${fileName}`;

      const upstream = await fetch(fullUrl);
      if (!upstream.ok) {
        return reply.status(502).send({ ok: false, error: "PDF_FETCH_ERROR" });
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `inline; filename="documento-${share.document.id.slice(0, 8)}.pdf"`)
        .header("Content-Length", buffer.length)
        .send(buffer);

    } catch (err: any) {
      request.log.error({ err }, "GET /shared/:token/pdf");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });
}
