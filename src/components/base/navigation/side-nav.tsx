import type { LucideIcon } from 'lucide-react';
import {
    CreditCard,
    Home,
    LogOut,
    Shield,
    User,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@onaeko/ui/sidebar';
import Logo from '@/components/base/common/Logo';
import LogoIcon from '@/components/base/common/LogoIcon';
import sidebarRoutes from '@/routes/sidebar.route';
import { RouteURL } from '@/routes/paths';
import useAuth from '@/hooks/app/useAuth';
import { isSidebarPathActive } from '@/utils/pathname.util';

const NAV_ICONS: Record<string, LucideIcon> = {
    'my-account': Home,
    profile: User,
    security: Shield,
    billing: CreditCard,
};

/** Flatten parent + subroutes into Home + sibling Main links. */
function flatNavItems() {
    const items: Array<{
        name: string;
        title: string;
        path: string;
        exact: boolean;
        icon: LucideIcon;
    }> = [];

    for (const route of sidebarRoutes) {
        if (!route.path) continue;
        items.push({
            name: route.name,
            title: route.title || 'Home',
            path: route.path,
            exact: true,
            icon: NAV_ICONS[route.name] ?? Home,
        });
        for (const sub of route.subroutes ?? []) {
            if (!sub.path) continue;
            items.push({
                name: sub.name,
                title: sub.title || sub.name,
                path: sub.path,
                exact: false,
                icon: NAV_ICONS[sub.name] ?? Home,
            });
        }
    }

    return items;
}

function SidebarBrand() {
    const { state, isMobile } = useSidebar();
    const collapsed = !isMobile && state === 'collapsed';

    return (
        <Link
            to={RouteURL.myAccount}
            className="flex items-center px-2 py-1"
            aria-label="Onaeko Accounts home"
        >
            {collapsed ? (
                <LogoIcon width={28} height={28} />
            ) : (
                <Logo width={140} height={32} />
            )}
        </Link>
    );
}

export default function AppSidebar() {
    const location = useLocation();
    const { logout } = useAuth({ enableSessionEffect: false });
    const items = flatNavItems();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarBrand />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const active = isSidebarPathActive(
                                    location.pathname,
                                    item.path,
                                    { exact: item.exact },
                                );
                                const Icon = item.icon;

                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={item.title}
                                        >
                                            <Link to={item.path}>
                                                <Icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Logout"
                            onClick={() => void logout()}
                        >
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
