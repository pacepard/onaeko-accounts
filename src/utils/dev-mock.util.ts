/**
 * P083 local mock UI rail — developer click-through only.
 * Keep imports relative (no `@/`) so `tsx --test` can load this module.
 */

export const DEV_MOCK_TOKEN = 'dev-mock-token';

type MockCallParams = {
    method?: string;
    path?: string;
    payload?: unknown;
    type?: string;
    isAuth?: boolean;
};

export type MockApiResponse = {
    error: boolean;
    errors: unknown[];
    data: unknown;
    message: string;
    status: number;
};

/** Pure gate — unit-tested. Staging/prod ignore the flag even if set. */
export function isUseMocksEnabled(
    environment: string | undefined,
    useMocksFlag: string | undefined,
): boolean {
    return environment === 'local' && useMocksFlag === 'true';
}

export const USE_MOCKS = isUseMocksEnabled(
    import.meta.env?.VITE_ENVIRONMENT,
    import.meta.env?.VITE_USE_MOCKS,
);

export function ok(
    data: unknown,
    message = 'Request completed successfully',
): MockApiResponse {
    return { error: false, errors: [], data, message, status: 200 };
}

export function fail(
    status: number,
    message: string,
    errors: string[] = [message],
): MockApiResponse {
    return { error: true, errors, data: {}, message, status };
}

export function ensureMockSession(): void {
    if (!USE_MOCKS || typeof localStorage === 'undefined') {
        return;
    }
    if (!localStorage.getItem('token')) {
        localStorage.setItem('token', DEV_MOCK_TOKEN);
        localStorage.setItem('userId', 'mock-user-damola');
        localStorage.setItem('role', 'user');
        localStorage.setItem('userType', 'user');
        localStorage.setItem('userEmail', 'damola@example.invalid');
    }
}

export async function mockCall(params: MockCallParams): Promise<MockApiResponse> {
    const method = (params.method || 'GET').toUpperCase();
    const path = params.path || '';

    console.log(`[MOCK] ${method} ${path}`);

    if (method === 'GET' && (path === '/user' || path === '/user/' || path.startsWith('/user/'))) {
        return ok({
            _id: 'mock-user-damola',
            firstName: 'Damola',
            lastName: 'Oladipo',
            email: 'damola@example.invalid',
        });
    }

    if (
        method === 'POST' &&
        (path.includes('/auth/login') ||
            path.includes('/auth/register') ||
            path.includes('/auth/verify-otp') ||
            path.includes('/auth/activate') ||
            path.includes('/auth/resend-otp') ||
            path.includes('/auth/forgot-password') ||
            path.includes('/auth/reset-password'))
    ) {
        return ok({
            token: DEV_MOCK_TOKEN,
            _id: 'mock-user-damola',
            userType: 'user',
            email: 'damola@example.invalid',
        });
    }

    if (method === 'GET' && path.includes('/auth/continue')) {
        return ok({
            token: DEV_MOCK_TOKEN,
            _id: 'mock-user-damola',
            userType: 'user',
            email: 'damola@example.invalid',
        });
    }

    if (method === 'POST' && path.includes('/auth/logout')) {
        return ok({});
    }

    if (method === 'GET' && path.includes('/account')) {
        return ok({
            firstName: 'Damola',
            lastName: 'Oladipo',
            email: 'damola@example.invalid',
        });
    }

    console.warn(`[MOCK] unmatched path: ${method} ${path}`);
    return ok({});
}
