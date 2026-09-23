# Auth pages

Route-level screens for `accounts.onaeko.com` authentication. Each page wraps a form from `src/components/base/auth` in `AuthLayout`.

Browser paths live in `src/routes/paths.ts` (`RouteURL`). Backend paths live in `src/api/paths.ts` (`ApiPath`). Routes are wired in `src/routes/account.route.tsx`.

## Pages

| File | Route | Form |
| --- | --- | --- |
| `Login.tsx` | `/login` | `login-form` |
| `Register.tsx` | `/register` | `register-form` |
| `ActivateAccount.tsx` | `/activate-account` | `otp-form` (`OtpType.ACTIVATEACCOUNT`) |
| `Verification.tsx` | `/verify-otp` | `otp-form` (`OtpType.GENERIC`) |
| `ForgotPassword.tsx` | `/forgot-password` | `forgot-password` |
| `ResetPassword.tsx` | `/reset-password` | `reset-password` |

## Conventions

- Import forms from `@/components/base/auth/...`
- Use `RouteURL` for navigation (`navigate`, redirects)
- Use local `storage` (`@/services/storage`) and `OtpType` (`@/utils/enums.util`) — not `@onaeko/sdk`
- Auth API calls go through `AuthAPI` + `ApiPath` (e.g. `/auth/login`), not page paths

## Not implemented yet

Pages for `/continue`, `/oauth/*`, `/reset-password/success`, and `/verify-email` are defined on `RouteURL` but not mounted in `account.route.tsx`.
