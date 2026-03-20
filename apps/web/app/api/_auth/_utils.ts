import { logger } from "@/app/lib/logger";

const LOCAL_API_FALLBACK = "http://localhost:4001";

function normalizeApiBase(rawValue: string) {
  const parsed = new URL(rawValue);
  return parsed.origin;
}

export function resolveAuthApiBase() {
  const candidates = [
    { key: "API_URL", value: process.env.API_URL },
    { key: "NEXT_PUBLIC_API_URL", value: process.env.NEXT_PUBLIC_API_URL },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) {
      continue;
    }

    try {
      return {
        apiBase: normalizeApiBase(candidate.value),
        source: candidate.key,
      };
    } catch {
      logger.error("[auth-proxy] Invalid API base URL", undefined, {
        source: candidate.key,
        valuePreview: candidate.value.slice(0, 120),
      });
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      apiBase: LOCAL_API_FALLBACK,
      source: "LOCAL_FALLBACK",
    };
  }

  logger.error("[auth-proxy] Missing API base URL", undefined, {
    hasApiUrl: Boolean(process.env.API_URL),
    hasNextPublicApiUrl: Boolean(process.env.NEXT_PUBLIC_API_URL),
  });

  return null;
}

export function buildAuthProxyTarget(path: string) {
  const resolved = resolveAuthApiBase();
  if (!resolved) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${resolved.apiBase}${normalizedPath}`;

  logger.debug("[auth-proxy] Using backend target", {
    source: resolved.source,
    targetOrigin: resolved.apiBase,
    path: normalizedPath,
  });

  return {
    url,
    source: resolved.source,
  };
}