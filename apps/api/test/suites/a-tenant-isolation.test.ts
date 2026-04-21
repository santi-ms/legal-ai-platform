/**
 * Suite A — Multi-tenant Isolation (IDOR)
 *
 * Para cada ruta detectada como vulnerable en la auditoría estática:
 *   1. Tenant A crea un recurso.
 *   2. Tenant B (token válido, tenant distinto) intenta mutarlo.
 *   3. Assert: la API rechaza (404/403) y el recurso sigue intacto en DB.
 *
 * Estos tests validan el "outer layer" (primer findFirst con tenantId).
 * El bug latente (el `.delete({ where: { id } })` sin tenantId) NO se detecta
 * por caja negra — para eso ver `a-tenant-isolation-static.test.ts` que
 * inspecciona el source code.
 */

import "../helpers/env.js";
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { getTestApp, closeTestApp, authHeaders } from "../helpers/app.js";
import {
  resetDatabase,
  createTenant,
  createUser,
  closeDb,
  type TestTenant,
  type TestUser,
} from "../helpers/db.js";
import { prisma } from "../../src/db.js";

describe("Suite A — Multi-tenant Isolation (IDOR)", () => {
  let tenantA: TestTenant;
  let tenantB: TestTenant;
  let userA: TestUser;
  let userB: TestUser;

  before(async () => {
    await resetDatabase();
    tenantA = await createTenant("Studio-A");
    tenantB = await createTenant("Studio-B");
    userA = await createUser(tenantA.id, { email: "a@test.local" });
    userB = await createUser(tenantB.id, { email: "b@test.local" });
  });

  after(async () => {
    await closeTestApp();
    await closeDb();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // A1 — DocumentAnnotation cross-tenant DELETE
  // Ruta: DELETE /documents/:id/annotations/:annotationId
  // Archivo: routes.documents.ts:1408
  // ──────────────────────────────────────────────────────────────────────────
  test("A1: tenant B cannot delete tenant A's document annotation", async () => {
    const app = await getTestApp();

    // Seed: Tenant A crea un Document + una Annotation
    const doc = await prisma.document.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA.id,
        createdById: userA.id,
        type: "nda",
        jurisdiccion: "nacional",
        tono: "formal",
        estado: "generated_text",
        updatedAt: new Date(),
      },
    });

    const annotation = await (prisma as any).documentAnnotation.create({
      data: {
        id: randomUUID(),
        documentId: doc.id,
        tenantId: tenantA.id,
        authorId: userA.id,
        content: "Anotación confidencial de tenant A",
        updatedAt: new Date(),
      },
    });

    // Ataque: Tenant B intenta borrar la annotation conociendo el id
    const res = await app.inject({
      method: "DELETE",
      url: `/documents/${doc.id}/annotations/${annotation.id}`,
      headers: authHeaders(userB.token),
    });

    assert.equal(res.statusCode, 404, "cross-tenant DELETE debe devolver 404");

    const stillThere = await (prisma as any).documentAnnotation.findUnique({
      where: { id: annotation.id },
    });
    assert.ok(stillThere, "la annotation del tenant A NO debe haber sido borrada");
    assert.equal(stillThere.content, "Anotación confidencial de tenant A");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // A2 — Estrategia cross-tenant DELETE
  // Ruta: DELETE /estrategia/:id
  // Archivo: routes.estrategia.ts:337
  // ──────────────────────────────────────────────────────────────────────────
  test("A2: tenant B cannot delete tenant A's escrito analisis", async () => {
    const app = await getTestApp();

    const escrito = await (prisma as any).escritoAnalisis.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA.id,
        uploadedById: userA.id,
        originalName: "demanda-confidencial.pdf",
        fileName: "f-" + randomUUID() + ".pdf",
        fileSize: 1234,
        storageUrl: "local://test/demanda.pdf",
        tipoEscrito: "demanda",
        status: "done",
        updatedAt: new Date(),
      },
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/estrategia/${escrito.id}`,
      headers: authHeaders(userB.token),
    });

    assert.ok([403, 404].includes(res.statusCode), `se esperaba 404/403, se recibió ${res.statusCode}`);

    const stillThere = await (prisma as any).escritoAnalisis.findUnique({
      where: { id: escrito.id },
    });
    assert.ok(stillThere, "el escrito del tenant A NO debe haber sido borrado");
    assert.equal(stillThere.deletedAt, null, "no debe estar marcado como deleted");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // A3 — Actuacion cross-tenant DELETE
  // Ruta: DELETE /expedientes/:expId/actuaciones/:id
  // Archivo: routes.actuaciones.ts:271
  // ──────────────────────────────────────────────────────────────────────────
  test("A3: tenant B cannot delete tenant A's actuacion", async () => {
    const app = await getTestApp();

    const expediente = await prisma.expediente.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA.id,
        createdById: userA.id,
        title: "Caso confidencial",
        matter: "civil",
        status: "activo",
        updatedAt: new Date(),
      },
    });

    const actuacion = await (prisma as any).actuacion.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA.id,
        expedienteId: expediente.id,
        createdById: userA.id,
        tipo: "audiencia",
        fecha: new Date(),
        titulo: "Audiencia preliminar",
        updatedAt: new Date(),
      },
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/expedientes/${expediente.id}/actuaciones/${actuacion.id}`,
      headers: authHeaders(userB.token),
    });

    assert.ok([403, 404].includes(res.statusCode), `se esperaba 404/403, se recibió ${res.statusCode}`);

    const stillThere = await (prisma as any).actuacion.findUnique({
      where: { id: actuacion.id },
    });
    assert.ok(stillThere, "la actuación NO debe haber sido borrada");
    assert.equal(stillThere.archivedAt, null, "tampoco debe estar archivada");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // A4 — Cross-tenant GET (no debe filtrar info de otro tenant)
  // ──────────────────────────────────────────────────────────────────────────
  test("A4: tenant B cannot read tenant A's expediente by id", async () => {
    const app = await getTestApp();

    const expediente = await prisma.expediente.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA.id,
        createdById: userA.id,
        title: "Expediente privado A",
        matter: "penal",
        updatedAt: new Date(),
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/expedientes/${expediente.id}`,
      headers: authHeaders(userB.token),
    });

    assert.notEqual(res.statusCode, 200, "cross-tenant GET NO debe devolver 200");
    // Además: el body no debe contener el título del otro tenant
    assert.ok(
      !res.body.includes("Expediente privado A"),
      "el body no debe filtrar contenido del tenant A",
    );
  });
});
