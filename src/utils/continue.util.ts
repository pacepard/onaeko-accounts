export type ContinueEnv = {
  learnUrl?: string;
  websiteUrl?: string;
  adminUrl?: string;
  environment?: string;
  isProductionLike?: boolean;
};

const BLOCKED_PREFIXES = ["javascript:", "data:", "vbscript:"];

const originOf = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const collectContinueOrigins = (env: ContinueEnv): string[] => {
  return [
    originOf(env.learnUrl),
    originOf(env.websiteUrl),
    originOf(env.adminUrl),
  ].filter((origin): origin is string => !!origin);
};

export const isProductionLikeEnv = (env: ContinueEnv): boolean => {
  if (typeof env.isProductionLike === "boolean") {
    return env.isProductionLike;
  }
  const value = (env.environment || "").toLowerCase();
  return value === "production" || value === "prod";
};

/**
 * Accounts continue contract (P021): honour `?next=` only when the URL is
 * an allowlisted Learn or Website origin, or a same-app relative path.
 * Foreign hosts, javascript:, and data: fall back. Missing origins in a
 * production-like env deny every next value.
 */
export const resolveContinueUrl = (
  next: string | null | undefined,
  env: ContinueEnv,
  fallback = "/my-account",
): string => {
  const productionLike = isProductionLikeEnv(env);
  const origins = collectContinueOrigins(env);

  if (productionLike && origins.length === 0) {
    return fallback;
  }

  if (!next || typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();
  const lower = trimmed.toLowerCase();

  if (BLOCKED_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return fallback;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (origins.includes(url.origin)) {
      return url.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
};

export const continueEnvFromVite = (env: {
  VITE_LEARN_URL?: string;
  VITE_WEBSITE_URL?: string;
  VITE_ADMIN_URL?: string;
  VITE_ENVIRONMENT?: string;
}): ContinueEnv => ({
  learnUrl: env.VITE_LEARN_URL,
  websiteUrl: env.VITE_WEBSITE_URL,
  adminUrl: env.VITE_ADMIN_URL,
  environment: env.VITE_ENVIRONMENT,
});

export const CONTINUE_NEXT_KEY = "onaeko.continue.next";

export const persistContinueNext = (next?: string | null): void => {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  const trimmed = (next || "").trim();
  if (!trimmed) {
    return;
  }
  sessionStorage.setItem(CONTINUE_NEXT_KEY, trimmed);
};

export const peekContinueNext = (): string | null => {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage.getItem(CONTINUE_NEXT_KEY);
};

export const consumeContinueNext = (): string | null => {
  const value = peekContinueNext();
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(CONTINUE_NEXT_KEY);
  }
  return value;
};

export const readNextFromSearch = (search: string): string | null => {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  return params.get("next");
};

/**
 * P080: honour allowlisted `?next=`, else stored next, else `/my-account`.
 * Bad / missing next falls back to `/my-account` (documented default).
 */
export const resolvePostAuthUrl = (
  search: string,
  env: ContinueEnv,
  fallback = "/my-account",
): string => {
  const fromQuery = readNextFromSearch(search);
  const candidate = fromQuery || peekContinueNext();
  return resolveContinueUrl(candidate, env, fallback);
};

export const isExternalContinueUrl = (dest: string): boolean =>
  dest.startsWith("http://") || dest.startsWith("https://");
