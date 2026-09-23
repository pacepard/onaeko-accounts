import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    fail,
    isUseMocksEnabled,
    mockCall,
    ok,
} from './dev-mock.util.ts';

describe('P083 Accounts USE_MOCKS gate', () => {
    it('is false when VITE_ENVIRONMENT is not local', () => {
        assert.equal(isUseMocksEnabled('staging', 'true'), false);
        assert.equal(isUseMocksEnabled('production', 'true'), false);
        assert.equal(isUseMocksEnabled(undefined, 'true'), false);
    });

    it('is true only for local + explicit true flag', () => {
        assert.equal(isUseMocksEnabled('local', 'true'), true);
        assert.equal(isUseMocksEnabled('local', undefined), false);
    });
});

describe('P083 Accounts mockCall envelope', () => {
    it('returns locked envelope keys for GET /user/', async () => {
        const res = await mockCall({
            type: 'default',
            method: 'GET',
            path: '/user/',
            payload: {},
        });
        assert.equal(res.error, false);
        assert.ok(Array.isArray(res.errors));
        assert.equal(typeof res.message, 'string');
        assert.equal(res.status, 200);
        assert.equal((res.data as { firstName: string }).firstName, 'Damola');
    });

    it('returns locked envelope keys for POST /auth/login', async () => {
        const res = await mockCall({
            type: 'default',
            method: 'POST',
            path: '/auth/login',
            payload: { email: 'damola@example.invalid', password: 'x' },
        });
        assert.equal(res.error, false);
        assert.ok(Array.isArray(res.errors));
        assert.equal(typeof res.message, 'string');
        assert.equal(res.status, 200);
        assert.equal((res.data as { token: string }).token, 'dev-mock-token');
    });

    it('ok / fail helpers match the locked shape', () => {
        assert.equal(ok({}).error, false);
        assert.equal(fail(401, 'no').status, 401);
    });
});
