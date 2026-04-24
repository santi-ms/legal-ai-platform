import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Los tests actuales son unitarios puros — no tocan DB. Si en el futuro
    // agregamos tests que necesiten Prisma, acá se configura setup/teardown.
    environment: "node",
    globals: false,
  },
});
