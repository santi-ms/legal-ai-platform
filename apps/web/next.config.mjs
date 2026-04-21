/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Sentry se carga solo si el paquete está instalado. En entornos donde no se
// configuró la telemetría (dev local, CI liviano, PRs de features) el build
// debe funcionar sin él.
async function withOptionalSentry(config) {
  try {
    const { withSentryConfig } = await import("@sentry/nextjs");
    return withSentryConfig(config, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    });
  } catch {
    console.info("[next.config] @sentry/nextjs no instalado — build sin Sentry.");
    return config;
  }
}

export default await withOptionalSentry(nextConfig);
