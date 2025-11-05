#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolver rutas relativas al script
const root = path.resolve(__dirname, "../..");
const src = path.resolve(root, "packages/db/prisma/schema.prisma");
const dst = path.resolve(__dirname, "..", "prisma/schema.prisma");

if (fs.existsSync(src)) {
  // Asegurar que el directorio destino existe
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  // Copiar archivo
  fs.copyFileSync(src, dst);
  console.log("[schema-sync] ✅ Copiado:", src, "->", dst);
  process.exit(0);
} else {
  console.log(
    "[schema-sync] ℹ️ packages/db no existe; mantengo fallback actual:",
    dst,
  );
  process.exit(0);
}

