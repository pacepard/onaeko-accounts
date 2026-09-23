/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_API_URL?: string;
    readonly VITE_APP_URL?: string;
    readonly VITE_ENVIRONMENT?: string;
    /** `prod` enables analytics (PostHog/Sentry) — same as flexprice-front */
    readonly VITE_APP_ENVIRONMENT?: string;
    readonly VITE_LEARN_URL?: string;
    readonly VITE_WEBSITE_URL?: string;
    /** Local mock rail only. Never set outside VITE_ENVIRONMENT=local. */
    readonly VITE_USE_MOCKS?: string;
    readonly VITE_DEPLOYMENT_REGION?: string;
    /** e.g. `.onaeko.com` — shares theme cookie across subdomains */
    readonly VITE_THEME_COOKIE_DOMAIN?: string;
}

declare const __APP_VERSION__: string;

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
