import cookieService from './cookie.service';
import type { IStorage } from '@/utils/interfaces.util';
import { logger } from '@/utils/logger.utl';
import { DEV_MOCK_TOKEN, USE_MOCKS } from '@/utils/dev-mock.util';

const storeAuth = (
    token: string,
    id: string,
    userType: string,
    email: string,
) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', id);
    localStorage.setItem('role', userType);
    localStorage.setItem('userEmail', email);

    cookieService.setData({
        key: 'token',
        payload: token,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        path: '/',
    });

    cookieService.setData({
        key: 'userId',
        payload: id,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        path: '/',
    });
    cookieService.setData({
        key: 'userType',
        payload: userType,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        path: '/',
    });
    cookieService.setData({
        key: 'userEmail',
        payload: email,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        path: '/',
    });
};

const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
        return false;
    }

    // P083 mock rail plants a non-JWT placeholder when USE_MOCKS is on.
    if (USE_MOCKS && token === DEV_MOCK_TOKEN) {
        return true;
    }

    // Basic JWT token validation (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    return tokenParts.length === 3;
};

const getToken = () => {
    return localStorage.getItem('token');
};

const checkUserID = () => {
    return localStorage.getItem('userId') ? true : false;
};

const getUserID = () => {
    const uid = localStorage.getItem('userId');
    return uid ? uid : '';
};

const checkUserType = () => {
    return localStorage.getItem('userType') ? true : false;
};

const getUserType = () => {
    return localStorage.getItem('userType');
};

const checkUserEmail = () => {
    return localStorage.getItem('userEmail') ? true : false;
};

const getUserEmail = () => {
    return localStorage.getItem('userEmail');
};

const getConfig = () => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            lg: 'en',
            ch: 'web',
        },
    };

    return config;
};

const getConfigWithBearer = () => {
    const token = getToken();

    if (!token) {
        logger.warn('No token found when trying to create bearer config');
        return {
            headers: {
                'Content-Type': 'application/json',
                lg: 'en',
                ch: 'web',
            },
        };
    }

    const config: any = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            lg: 'en',
            ch: 'web',
        },
    };

    return config;
};

const clearAuth = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('businessType');
    // Clear cookies
    cookieService.removeData({ key: 'token' });
    cookieService.removeData({ key: 'userId' });
    cookieService.removeData({ key: 'userType' });
    cookieService.removeData({ key: 'userEmail' });
    cookieService.removeData({ key: 'businessType' });
};

const keep = (key: string, data: any) => {
    if (data && data !== undefined && data !== null) {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } else {
        return false;
    }
};

const keepLegacy = (key: string, data: any) => {
    if (data) {
        localStorage.setItem(key, data);
        return true;
    } else {
        return false;
    }
};

const fetch = (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
};

const fetchLegacy = (key: string) => {
    const data = localStorage.getItem(key);
    return data ? data : null;
};

const deleteItem = (key: string, legacy: boolean = false) => {
    let data;

    if (legacy && legacy === true) {
        data = localStorage.getItem(key);
    } else {
        data = fetch(key);
    }

    if (data && data !== null && data !== undefined) {
        localStorage.removeItem(key);
        return true;
    } else {
        return false;
    }
};

const deleteItemLegacy = (key: string) => {
    deleteItem(key, true);
};

const trimSpace = (str: string) => {
    return str.replace(/\s/g, '');
};

const copyCode = (code: string) => {
    if (code !== '' && code !== undefined && typeof code === 'string') {
        navigator.clipboard.writeText(code);
        return true;
    } else {
        return false;
    }
};

const debugAuth = () => {
    const token = getToken();
    const userId = getUserID();
    const userType = getUserType();
    const userEmail = getUserEmail();

    logger.debug('Auth Debug Info:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenValid: checkToken(),
        hasUserId: !!userId,
        hasUserType: !!userType,
        hasUserEmail: !!userEmail,
        userId,
        userType,
        userEmail,
    });

    return {
        hasToken: !!token,
        tokenValid: checkToken(),
        hasUserId: !!userId,
        hasUserType: !!userType,
        hasUserEmail: !!userEmail,
    };
};

/**
 * Persists auth from an API response when the response contains a token in data.
 * Use after login or activation when the backend returns { data: { token, _id, userType, email, businessType? } }.
 */
export const persistAuthFromResponse = (response: {
    token?: string;
    data?: {
        token?: string;
        _id?: string;
        id?: string;
        userType?: string;
        email?: string;
        businessType?: string;
    };
}) => {
    const token = response?.data?.token || response?.token;
    if (token) {
        const d = response.data || {};
        storeAuth(
            token,
            d._id ?? d.id ?? '',
            d.userType ?? '',
            d.email ?? '',
        );
    }
};

const storage: IStorage = {
    storeAuth: storeAuth,
    checkToken: checkToken,
    getToken: getToken,
    checkUserType: checkUserType,
    getUserType: getUserType,
    checkUserID: checkUserID,
    getUserID: getUserID,
    checkUserEmail: checkUserEmail,
    getUserEmail: getUserEmail,

    getConfig: getConfig,
    getConfigWithBearer: getConfigWithBearer,
    clearAuth: clearAuth,
    keep: keep,
    keepLegacy: keepLegacy,
    fetch: fetch,
    fetchLegacy: fetchLegacy,
    deleteItem: deleteItem,
    deleteItemLegacy: deleteItemLegacy,
    trimSpace: trimSpace,
    copyCode: copyCode,
    debugAuth: debugAuth,
};

export default storage;
