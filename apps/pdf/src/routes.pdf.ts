import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generatePdfFromContract } from "./pdfGenerator.js";

const BodySchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1)
});

export async function registerPdfRoutes(app: FastifyInstance) {
  app.post("/pdf/generate", async (request, reply) => {
    const parsed = BodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_body",
        details: parsed.error.format()
      });
    }

    const { title, rawText } = parsed.data;

    try {
      const result = await generatePdfFromContract({ title, rawText });

      return reply.send({
        ok: true,
        filePath: result.filePath,
        fileName: result.fileName
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        ok: false,
        error: "PDF_GENERATION_FAILED"
      });
    }
  });
}
