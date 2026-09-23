import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import storage from '@/services/storage';
import { SidebarProvider } from '@onaeko/ui/sidebar';
import AppSidebar from '../base/navigation/side-nav';
import NavBar from '../base/navigation/NavBar';
import { Toaster } from '@onaeko/ui/sonner';
import { cn } from '@onaeko/ui';
import useContextType from '@/context/useContextType';
import useAuth from '@/hooks/app/useAuth';
import { OnaekoAPI } from '@/api/base/config';
import { getOnboardingRoute } from '@/utils/onboarding';
import { RouteURL } from '@/routes/paths';
import { NODE_ENV, NodeEnv } from '@/utils/enums.util';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

const isProd = import.meta.env.VITE_APP_ENVIRONMENT === 'prod';
const enforceAuth =
    NODE_ENV === NodeEnv.PRODUCTION || NODE_ENV === NodeEnv.STAGING;

/** Authenticated shell — sidebar + NavBar + Outlet (Troott shape). */
const DashboardLayout = () => {
    const { userContext } = useContextType();
    const user = userContext?.user;
    const navigate = useNavigate();
    // Layout owns session redirect for shell routes.
    useAuth({ enableSessionEffect: true });

    const [defaultOpen] = useState(() => {
        const stored = storage.fetch('sidebar-collapsed');
        return stored ? stored !== 'true' : true;
    });

    useEffect(() => {
        if (!enforceAuth) return;

        const hasSession = storage.checkToken() && storage.checkUserID();
        if (!hasSession) {
            void OnaekoAPI.auth.logout();
            navigate(RouteURL.login, { replace: true });
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const statusResponse =
                    await OnaekoAPI.user.getOnboardingStatus();
                if (cancelled || statusResponse.error !== false) return;
                const data = statusResponse.data as
                    | {
                          step?: number;
                          status?: string;
                          userType?: string;
                      }
                    | undefined;
                if (!data) return;
                const status = data.status || 'not-started';
                if (status === 'completed') return;
                const route = getOnboardingRoute(
                    data.step || 0,
                    status,
                    data.userType,
                );
                if (route !== RouteURL.myAccount) {
                    navigate(route, { replace: true });
                }
            } catch {
                // Shell-first: ignore status failures
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    useEffect(() => {
        if (!user || !isProd) return;

        const id = user._id || user.id || storage.getUserID();
        const email = user.email || storage.getUserEmail();

        if (!id || !email) return;

        posthog.identify(email, {
            id,
            email,
            name:
                user.firstName || user.lastName
                    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                    : user.name,
            user_type: userContext?.userType || storage.getUserType(),
        });

        Sentry.setUser({
            id,
            email,
            username: user.name,
        });
    }, [user, userContext?.userType]);

    useEffect(() => {
        if (!user && isProd) {
            Sentry.setUser(null);
            posthog.reset();
        }
    }, [user]);

    return (
        <>
            <SidebarProvider defaultOpen={defaultOpen}>
                <div className="flex h-screen w-full min-h-0">
                    <AppSidebar />
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <NavBar />
                        <main
                            id="dashboard-body"
                            className={cn(
                                'dashboard-body flex min-h-0 flex-1 flex-col overflow-auto',
                            )}
                        >
                            <div className="dashboard-content w-full flex-1">
                                <div className="mt-0 px-8 py-6">
                                    <Outlet />
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
            <Toaster />
        </>
    );
};

export default DashboardLayout;
