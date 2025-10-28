import { FastifyInstance } from "fastify";
import { GenerateDocumentSchema } from "./types.js";
import OpenAI from "openai";
import { prisma } from "db";
import { z } from "zod";
import fs from "node:fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerDocumentRoutes(app: FastifyInstance) {
  // ==========================================
  // POST /documents/generate
  // ==========================================
  app.post("/documents/generate", async (request, reply) => {
    try {
      // 1️⃣ Validar body contra Zod
      const parsed = GenerateDocumentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          ok: false,
          error: "invalid_body",
          details: parsed.error.format(),
        });
      }

      const data = parsed.data;

      // 2️⃣ Construir prompt legal con el body plano
      const prompt = `
Quiero que actúes como un asistente legal especializado en redacción de contratos en Argentina.
Generá un documento completo, numerado en cláusulas, listo para ser entregado al cliente para revisar y firmar.

Tipo de documento: ${data.type}
Jurisdicción/Fuero aplicable: ${data.jurisdiccion}
Tono deseado: ${data.tono}

Parte Proveedora:
- Nombre/Razón Social: ${data.proveedor_nombre}
- Documento/CUIT: ${data.proveedor_doc}
- Domicilio: ${data.proveedor_domicilio}

Parte Cliente:
- Nombre/Razón Social: ${data.cliente_nombre}
- Documento/CUIT: ${data.cliente_doc}
- Domicilio: ${data.cliente_domicilio}

Condiciones comerciales:
- Servicio/Objeto: ${data.descripcion_servicio}
- Monto mensual: ${data.monto_mensual}
- Forma de pago: ${data.forma_pago}
- Inicio de vigencia: ${data.inicio_vigencia}
- Plazo mínimo (meses): ${data.plazo_minimo_meses}
- Penalización por rescisión anticipada: ${
        data.penalizacion_rescision ? "Sí" : "No"
      }

Tema impuestos/fiscal:
- Modalidad facturación: ${data.preferencias_fiscales}

Instrucciones:
1. Usar normativa argentina vigente.
2. Incluir cláusula de competencia exclusiva en ${data.jurisdiccion}, renunciando a cualquier otro fuero.
3. Incluir cláusula de domicilio constituido en esa jurisdicción para notificaciones.
4. Si el tono es "comercial_claro", usar lenguaje entendible para PyMEs; si es "formal", usar redacción jurídica técnica.
5. Numerar las cláusulas claramente.
6. Cerrar con sección de firmas con lugar y fecha en blanco.
7. NO agregues explicaciones fuera del contrato. Solo devolver el texto del contrato final.
`.trim();

      // 3️⃣ Generar contrato con IA
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
      });

      const contratoRaw = completion.choices?.[0]?.message?.content ?? "";
      const contrato = contratoRaw.trim();

      // 4️⃣ IDs mock (auth vendrá luego)
      const tenantId = "demo-tenant";
      const userId = "demo-user";

      // 5️⃣ Guardar documento y versión en la base
      const { documentRecord, versionRecord } = await prisma.$transaction(
        async (tx) => {
          // Aseguramos tenant
          const tenant = await tx.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: "Demo Tenant" },
          });

          // Aseguramos usuario
          const user = await tx.user.upsert({
            where: { id: userId },
            update: {},
            create: {
              id: userId,
              email: "demo@example.com",
              password: "dev-placeholder",
              role: "owner",
              tenantId: tenant.id,
            },
          });

          // Creamos el documento
          const doc = await tx.document.create({
            data: {
              tenantId: tenant.id,
              createdById: user.id,
              type: data.type,
              jurisdiccion: data.jurisdiccion,
              tono: data.tono,
              estado: "GENERATED", // <-- importante para UI verde
              costUsd: 0,
            },
          });

          // Creamos la versión inicial
          const ver = await tx.documentVersion.create({
            data: {
              documentId: doc.id,
              versionNumber: 1,
              rawText: contrato,
              generatedBy: "gpt-5",
            },
          });

          return { documentRecord: doc, versionRecord: ver };
        }
      );

      // 6️⃣ Llamar microservicio PDF
      let pdfUrl: string | null = null;
      try {
        const pdfResponse = await fetch("http://localhost:4100/pdf/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.type.toUpperCase(),
            rawText: contrato,
          }),
        });

        if (pdfResponse.ok) {
          const pdfJson = await pdfResponse.json();
          if (pdfJson.ok && pdfJson.filePath) {
            // esto suele ser algo tipo
            // C:\Users\santi\Desktop\legal-ai-platform\services\pdf\generated\CONTRATO_1234.pdf
            pdfUrl = pdfJson.filePath;
          }
        }
      } catch (err) {
        app.log.error(err, "Error al llamar al pdf-service");
      }

      // 7️⃣ Guardar PDF si se generó bien
      if (pdfUrl) {
        await prisma.documentVersion.update({
          where: { id: versionRecord.id },
          data: { pdfUrl },
        });
      }

      // 8️⃣ Responder al cliente
      return reply.status(200).send({
        ok: true,
        documentId: documentRecord.id,
        contrato,
        pdfUrl,
      });
    } catch (err) {
      request.log.error(err, "INTERNAL ERROR /documents/generate");
      return reply
        .status(500)
        .send({ ok: false, error: "INTERNAL_SERVER_ERROR" });
    }
  });

  // ==========================================
  // GET /documents/:id
  // ==========================================
  app.get("/documents/:id", async (request, reply) => {
    const ParamsSchema = z.object({ id: z.string().uuid() });
    const parsed = ParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_ID" });
    }

    const { id } = parsed.data;

    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              rawText: true,
              pdfUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!document) {
        return reply
          .status(404)
          .send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
      }

      const lastVersion = document.versions[0] ?? null;

      return reply.send({
        ok: true,
        document: {
          id: document.id,
          type: document.type,
          jurisdiccion: document.jurisdiccion,
          tono: document.tono,
          estado: document.estado,
          costUsd: document.costUsd,
          lastVersion,
        },
      });
    } catch (err) {
      request.log.error(err, "INTERNAL ERROR /documents/:id");
      return reply
        .status(500)
        .send({ ok: false, error: "INTERNAL_SERVER_ERROR" });
    }
  });

  // ==========================================
  // GET /documents/:id/pdf
  // ==========================================
  app.get("/documents/:id/pdf", async (request, reply) => {
    const ParamsSchema = z.object({ id: z.string().uuid() });
    const parsed = ParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_ID" });
    }

    const { id } = parsed.data;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { pdfUrl: true },
        },
      },
    });

    if (!document) {
      return reply
        .status(404)
        .send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
    }

    const pdfPath = document.versions[0]?.pdfUrl;

    // si no hay pdf o el archivo en disco no existe => 404 controlado
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return reply.status(404).send({ ok: false, error: "PDF_NOT_FOUND" });
    }

    // stream del archivo físico al browser
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `inline; filename="${id}.pdf"`);
    return reply.send(fs.createReadStream(pdfPath));
  });
}
