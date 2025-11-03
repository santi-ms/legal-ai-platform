import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function registerAuthRoutes(app: FastifyInstance) {
  // POST /api/register
  app.post("/api/register", async (request, reply) => {
    try {
      const { name, email, password, companyName } = request.body as {
        name: string;
        email: string;
        password: string;
        companyName: string;
      };

      // Validaciones
      if (!name || !email || !password || !companyName) {
        return reply.status(400).send({
          ok: false,
          error: "validation_error",
          message: "Todos los campos son requeridos",
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(400).send({
          ok: false,
          error: "user_exists",
          message: "El email ya está registrado",
        });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: companyName,
        },
      });

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "owner", // Primer usuario de un tenant es owner
          tenantId: tenant.id,
        },
      });

      return reply.status(201).send({
        ok: true,
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error: any) {
      app.log.error("Error en registro:", error);
      return reply.status(500).send({
        ok: false,
        error: "internal_error",
        message: "Error al crear usuario",
        details: error.message || "Unknown error",
      });
    }
  });
}

