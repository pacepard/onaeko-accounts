/** Browser / React Router paths for accounts.onaeko.com */

const AppURL = import.meta.env.VITE_APP_URL ?? '';

export const RouteURL = {
    // Root
    home: '/',

    // Authentication
    login: '/login',
    logout: '/logout',
    register: '/register',
    activateAccount: '/activate-account',
    verify: '/verify',
    verifyEmail: '/verify-email',
    verifyOtp: '/verify-otp',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    resetPasswordSuccess: '/reset-password/success',
    continue: '/continue',

    // OAuth
    oauthGoogle: '/oauth/google',
    oauthGithub: '/oauth/github',
    oauthCallback: '/oauth/callback',

    // Onboarding
    onboarding: '/onboarding',
    onboardingBasicInfo: '/onboarding/basic-info',
    onboardingUserInfo: '/onboarding/user-info',
    onboardingBusinessInfo: '/onboarding/business-info',
    onboardingCreateWorkspace: '/onboarding/create-workspace',
    onboardingInviteTeammates: '/onboarding/invite-teammates',

    // Post-login
    myAccount: '/my-account',
    profile: '/my-account/profile',
    profileEdit: '/my-account/profile/edit',
    security: '/my-account/security',
    changePassword: '/my-account/security/password',
    twoFactor: '/my-account/security/2fa',
    sessions: '/my-account/sessions',
    billing: '/my-account/billing',
    subscriptions: '/my-account/billing/subscriptions',
    paymentMethods: '/my-account/billing/payment-methods',
    invoices: '/my-account/billing/invoices',
    deleteAccount: '/my-account/delete',

    // Absolute callbacks (when a full URL is required)
    regCallback: `${AppURL}/verify`,
    subCallback: `${AppURL}/my-account/billing`,
};
