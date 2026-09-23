import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OnaekoAPI } from '@/api/base/config';
import storage from '@/services/storage';
import { RouteURL } from '@/routes/paths';
import useAuth from '@/hooks/app/useAuth';
import { Button } from '@onaeko/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@onaeko/ui/card';

/** Signed-in Accounts home body — no DashboardLayout wrap (shell owns Outlet). */
export default function Dashboard() {
    const { logout } = useAuth({ enableSessionEffect: false });
    const [user, setUser] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        userType?: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const response = await OnaekoAPI.user.getUser();
                if (!cancelled && response.error === false && response.data) {
                    setUser(
                        response.data as {
                            firstName?: string;
                            lastName?: string;
                            email?: string;
                            userType?: string;
                        },
                    );
                    return;
                }
            } catch {
                // ignore
            }

            if (!cancelled) {
                setUser({
                    email: storage.getUserEmail() ?? undefined,
                    userType: storage.getUserType() ?? undefined,
                });
            }
        })().finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const displayName =
        user?.firstName || user?.lastName
            ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
            : user?.email || 'Account';

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {loading
                        ? 'Loading…'
                        : `Welcome${displayName ? `, ${displayName}` : ''}`}
                </h2>
                <p className="text-muted-foreground text-sm">
                    Manage your Onaeko account settings and security from here.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            {user?.email ??
                                'Your account email and personal details'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" size="sm">
                            <Link to={RouteURL.profile}>View profile</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Password, sessions, and two-factor auth
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" size="sm">
                            <Link to={RouteURL.security}>Manage security</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing</CardTitle>
                        <CardDescription>
                            Subscriptions, invoices, and payment methods
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" size="sm">
                            <Link to={RouteURL.billing}>Open billing</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Session</CardTitle>
                        <CardDescription>
                            Signed in as{' '}
                            {user?.userType ?? storage.getUserType() ?? 'user'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void logout()}
                        >
                            Sign out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
