import {
  consumeContinueNext,
  continueEnvFromVite,
  isExternalContinueUrl,
  persistContinueNext,
  resolvePostAuthUrl,
} from "@/utils/continue.util";

export const viteContinueEnv = () =>
  continueEnvFromVite({
    VITE_LEARN_URL: import.meta.env.VITE_LEARN_URL,
    VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL,
    VITE_ADMIN_URL: import.meta.env.VITE_ADMIN_URL,
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
  });

export const rememberNextFromSearch = (search: string): void => {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  persistContinueNext(params.get("next"));
};

export const destinationAfterAuth = (search: string): string => {
  const dest = resolvePostAuthUrl(search, viteContinueEnv(), "/my-account");
  consumeContinueNext();
  return dest;
};

export const goAfterAuth = (
  dest: string,
  navigate: (path: string) => void,
): void => {
  if (isExternalContinueUrl(dest)) {
    window.location.assign(dest);
    return;
  }
  navigate(dest);
};
