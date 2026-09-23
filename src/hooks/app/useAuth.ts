import useContextType from '@/context/useContextType';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OnaekoAPI } from '@/api/base/config';
import type {
    ActivateDTO,
    ForgotPasswordDTO,
    LoginDTO,
    LogoutDTO,
    RegisterUserDTO,
    ResendOtpDTO,
    ResetPasswordDTO,
    VerifyOtpDTO,
} from '@/dtos/auth.dto';
import { BusinessType, NODE_ENV, NodeEnv, UserType } from '@/utils/enums.util';
import cookieService from '@/services/cookie.service';
import storage from '@/services/storage';
import { RouteURL } from '@/routes/paths';
import { destinationAfterAuth, goAfterAuth } from '@/utils/post-auth';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

const isProd = import.meta.env.VITE_APP_ENVIRONMENT === 'prod';
const enforceAuth =
    NODE_ENV === NodeEnv.PRODUCTION || NODE_ENV === NodeEnv.STAGING;

const PUBLIC_AUTH_SEGMENTS = [
    'login',
    'register',
    'activate',
    'verify',
    'forgot',
    'reset',
    'oauth',
    'welcome',
    'continue',
    'onboarding',
];

const useAuth = (options?: { enableSessionEffect?: boolean }) => {
    const enableSessionEffect = options?.enableSessionEffect !== false;
    const navigate = useNavigate();
    const location = useLocation();
    const { userContext } = useContextType();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    const {
        users,
        user,
        userType,
        businessType,
        setUserType,
        setBusinessType,
        setLoading,
        unsetLoading,
    } = userContext;

    const applyPrefs = useCallback(
        (nextUserType: string, nextBusinessType?: string) => {
            setUserType(nextUserType);
            if (nextBusinessType) {
                setBusinessType(nextBusinessType);
            }
        },
        [setUserType, setBusinessType],
    );

    const clearPrefs = useCallback(() => {
        setUserType('');
        setBusinessType('');
    }, [setUserType, setBusinessType]);

    const persistSession = useCallback(
        (data: {
            token: string;
            _id: string;
            userType: string;
            email: string;
            businessType?: string;
        }) => {
            storage.storeAuth(data.token, data._id, data.userType, data.email);

            cookieService.setData({
                key: 'userType',
                payload: data.userType,
                expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                path: '/',
            });

            if (data.businessType) {
                cookieService.setData({
                    key: 'businessType',
                    payload: data.businessType,
                    expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    path: '/',
                });
            }
        },
        [],
    );

    useEffect(() => {
        if (!enableSessionEffect) return;

        const pathname = location.pathname;
        const hasSession = storage.checkToken() && storage.checkUserID();

        // Local / development: allow free navigation without forcing login.
        if (!enforceAuth) {
            if (hasSession) {
                setIsLoggedIn(true);
                if (pathname === RouteURL.login || pathname === '/') {
                    const dest = destinationAfterAuth(location.search);
                    if (dest.startsWith('http://') || dest.startsWith('https://')) {
                        window.location.assign(dest);
                    } else {
                        navigate(dest);
                    }
                }
            }
            return;
        }

        if (!hasSession) {
            const isPublic = PUBLIC_AUTH_SEGMENTS.some((seg: string) =>
                pathname.includes(seg),
            );
            if (!isPublic) {
                void OnaekoAPI.auth.logout();
                navigate(RouteURL.login);
            }
        } else {
            setIsLoggedIn(true);
            if (pathname === RouteURL.login || pathname === '/') {
                goAfterAuth(destinationAfterAuth(location.search), navigate);
            }
        }
    }, [enableSessionEffect, location.pathname, location.search, navigate]);

    const redirect = useCallback(
        (roles: Array<string>) => {
            const pathname = location.pathname;
            const hasSession = storage.checkToken() && storage.checkUserID();

            if (!enforceAuth) {
                if (hasSession) {
                    setIsLoggedIn(true);
                    if (pathname === RouteURL.login || pathname === '/') {
                    goAfterAuth(destinationAfterAuth(location.search), navigate);
                }
                }
                return;
            }

            if (!hasSession) {
                void OnaekoAPI.auth.logout();
                navigate(RouteURL.login);
            } else {
                const ut = cookieService.getUserType();
                const token = storage.getToken();

                if (token) {
                    if (ut && !roles.includes(ut)) {
                        navigate(RouteURL.login);
                        void OnaekoAPI.auth.logout();
                    } else {
                        setIsLoggedIn(true);

                    if (pathname === RouteURL.login || pathname === '/') {
                    goAfterAuth(destinationAfterAuth(location.search), navigate);
                }
                    }
                } else {
                    void OnaekoAPI.auth.logout();
                    navigate(RouteURL.login);
                }
            }
        },
        [location.pathname, navigate],
    );

    const login = async (data: LoginDTO) => {
        const response = await OnaekoAPI.auth.loginUser(data);

        if (!response.error) {
            if (response.status === 200) {
                if (
                    response.data.userType === UserType.SUPER ||
                    response.data.userType === UserType.ADMIN
                ) {
                    persistSession({
                        token: response.token!,
                        _id: response.data._id,
                        userType: response.data.userType,
                        email: response.data.email,
                    });
                    setIsLoggedIn(true);
                }

                if (
                    response.data.userType === UserType.BUSINESS &&
                    response.data.businessType === BusinessType.EDUCATION
                ) {
                    persistSession({
                        token: response.token!,
                        _id: response.data._id,
                        userType: response.data.userType,
                        email: response.data.email,
                        businessType: response.data.businessType,
                    });
                    setIsLoggedIn(true);
                }

                if (response.data.userType === UserType.BUSINESS) {
                    persistSession({
                        token: response.token!,
                        _id: response.data._id,
                        userType: response.data.userType,
                        email: response.data.email,
                        businessType: response.data.businessType,
                    });
                    applyPrefs(
                        response.data.userType,
                        response.data.businessType,
                    );
                    setIsLoggedIn(true);
                }

                if (response.data.userType === UserType.TALENT) {
                    persistSession({
                        token: response.token!,
                        _id: response.data._id,
                        userType: response.data.userType,
                        email: response.data.email,
                    });
                    applyPrefs(response.data.userType);
                    setIsLoggedIn(true);
                }
            }
        }

        return response;
    };

    const logout = async () => {
        await OnaekoAPI.auth.logout();
        storage.clearAuth();
        clearPrefs();
        if (isProd) {
            Sentry.setUser(null);
            posthog.reset();
        }
        navigate(RouteURL.login);
        setIsLoggedIn(false);
    };

    const logoutUser = useCallback(
        async (data: LogoutDTO) => {
            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.logoutUser({
                userId: data.userId || storage.getUserID(),
            });
            if (!response.error) {
                setIsLoggedIn(false);
                storage.clearAuth();
                clearPrefs();
                if (isProd) {
                    Sentry.setUser(null);
                    posthog.reset();
                }

                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });

                navigate(RouteURL.login);
            }
            return response;
        },
        [navigate, setLoading, unsetLoading, clearPrefs],
    );

    const register = useCallback(
        async (data: RegisterUserDTO) => {
            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.registerUser(data);

            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });
            }

            return response;
        },
        [setLoading, unsetLoading],
    );

    const verifyOtp = useCallback(
        async (data: VerifyOtpDTO) => {
            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.verifyOTP({
                email: data.email,
                otp: data.otp,
                otpType: data.otpType,
            });
            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });
            }
            return response;
        },
        [setLoading, unsetLoading],
    );

    const activateAccount = useCallback(
        async (data: ActivateDTO) => {
            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.activateUser({
                otp: data.otp,
                otpType: data.otpType,
                email: data.email,
            });

            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });
            }

            return response;
        },
        [setLoading, unsetLoading],
    );

    const resendOtp = useCallback(
        async (data: ResendOtpDTO) => {
            const { email, otpType } = data;
            const response = await OnaekoAPI.auth.resendOTP({
                email,
                otpType,
            });
            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({ option: 'default', message: 'successful' });
            }

            return response;
        },
        [unsetLoading],
    );

    const forgotPassword = useCallback(
        async (data: ForgotPasswordDTO) => {
            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.forgotPassword({
                email: data.email,
            });

            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });
            }
            return response;
        },
        [setLoading, unsetLoading],
    );

    const resetPassword = useCallback(
        async (data: ResetPasswordDTO) => {
            const { newPassword, email } = data;

            void setLoading({ option: 'default' });

            const response = await OnaekoAPI.auth.resetPassword({
                newPassword,
                email,
            });
            if (!response.error) {
                setIsLoggedIn(false);
                void unsetLoading({
                    option: 'default',
                    message: 'successful',
                });
            }
            return response;
        },
        [setLoading, unsetLoading],
    );

    return {
        users,
        user,
        userType,
        businessType,
        isLoggedIn,

        redirect,
        login,
        register,
        logout,
        logoutUser,
        activateAccount,
        resendOtp,
        forgotPassword,
        resetPassword,
        verifyOtp,
    };
};

export default useAuth;
