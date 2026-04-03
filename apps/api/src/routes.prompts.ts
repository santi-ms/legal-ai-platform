/**
 * Document Prompt Library Routes
 *
 * CRUD endpoints for managing AI prompts per document type.
 * Prompts stored here are used by the generation engine before
 * falling back to hardcoded defaults.
 *
 * Admin-only for write operations; any authenticated user can read.
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "./utils/auth.js";
import { prisma } from "./db.js";
import { logger } from "./utils/logger.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PromptBodySchema = z.object({
  documentType:     z.string().min(1).max(100),
  label:            z.string().min(1).max(200),
  systemMessage:    z.string().min(10),
  baseInstructions: z.array(z.string().min(1)),
  isActive:         z.boolean().optional().default(true),
});

const PromptPatchSchema = z.object({
  label:            z.string().min(1).max(200).optional(),
  systemMessage:    z.string().min(10).optional(),
  baseInstructions: z.array(z.string().min(1)).optional(),
  isActive:         z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireAdmin(request: any, reply: any) {
  try {
    const user = requireAuth(request);
    if (user.role !== "admin") {
      reply.status(403).send({ ok: false, error: "FORBIDDEN", message: "Solo administradores pueden gestionar prompts." });
      return null;
    }
    return user;
  } catch {
    reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function registerPromptRoutes(app: FastifyInstance) {

  // GET /prompts — list all prompts
  app.get("/prompts", async (request, reply) => {
    try {
      requireAuth(request);
    } catch {
      return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    }

    const prompts = await prisma.documentPrompt.findMany({
      orderBy: { documentType: "asc" },
    });
    return reply.send({ ok: true, prompts });
  });

  // GET /prompts/:documentType — get a single prompt
  app.get("/prompts/:documentType", async (request, reply) => {
    try {
      requireAuth(request);
    } catch {
      return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    }

    const { documentType } = request.params as { documentType: string };
    const prompt = await prisma.documentPrompt.findUnique({
      where: { documentType },
    });
    if (!prompt) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true, prompt });
  });

  // POST /prompts — create a new prompt (admin only)
  app.post("/prompts", async (request, reply) => {
    const user = requireAdmin(request, reply);
    if (!user) return;

    const parsed = PromptBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    try {
      const prompt = await prisma.documentPrompt.create({
        data: {
          id: crypto.randomUUID(),
          ...parsed.data,
        },
      });
      logger.info(`[prompts] Created prompt for: ${prompt.documentType}`);
      return reply.status(201).send({ ok: true, prompt });
    } catch (e: any) {
      if (e.code === "P2002") {
        return reply.status(409).send({ ok: false, error: "DUPLICATE", message: `Ya existe un prompt para el tipo '${parsed.data.documentType}'.` });
      }
      throw e;
    }
  });

  // PUT /prompts/:documentType — upsert (create or replace) a prompt (admin only)
  app.put("/prompts/:documentType", async (request, reply) => {
    const user = requireAdmin(request, reply);
    if (!user) return;

    const { documentType } = request.params as { documentType: string };
    const parsed = PromptBodySchema.safeParse({ ...(request.body as object), documentType });
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const prompt = await prisma.documentPrompt.upsert({
      where: { documentType },
      create: { id: crypto.randomUUID(), ...parsed.data },
      update: {
        label:            parsed.data.label,
        systemMessage:    parsed.data.systemMessage,
        baseInstructions: parsed.data.baseInstructions,
        isActive:         parsed.data.isActive,
        updatedAt:        new Date(),
      },
    });
    logger.info(`[prompts] Upserted prompt for: ${documentType}`);
    return reply.send({ ok: true, prompt });
  });

  // PATCH /prompts/:documentType — partial update (admin only)
  app.patch("/prompts/:documentType", async (request, reply) => {
    const user = requireAdmin(request, reply);
    if (!user) return;

    const { documentType } = request.params as { documentType: string };
    const parsed = PromptPatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const existing = await prisma.documentPrompt.findUnique({ where: { documentType } });
    if (!existing) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const prompt = await prisma.documentPrompt.update({
      where: { documentType },
      data: { ...parsed.data, updatedAt: new Date() },
    });
    logger.info(`[prompts] Patched prompt for: ${documentType}`);
    return reply.send({ ok: true, prompt });
  });

  // DELETE /prompts/:documentType — delete (admin only)
  app.delete("/prompts/:documentType", async (request, reply) => {
    const user = requireAdmin(request, reply);
    if (!user) return;

    const { documentType } = request.params as { documentType: string };
    const existing = await prisma.documentPrompt.findUnique({ where: { documentType } });
    if (!existing) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.documentPrompt.delete({ where: { documentType } });
    logger.info(`[prompts] Deleted prompt for: ${documentType}`);
    return reply.send({ ok: true });
  });
}
