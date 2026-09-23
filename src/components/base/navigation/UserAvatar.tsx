import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@onaeko/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@onaeko/ui/dropdown-menu';
import useAuth from '@/hooks/app/useAuth';
import useContextType from '@/context/useContextType';
import storage from '@/services/storage';
import { RouteURL } from '@/routes/paths';

const UserAvatar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth({ enableSessionEffect: false });
    const { userContext } = useContextType();
    const user = userContext?.user as
        | {
              firstName?: string;
              lastName?: string;
              email?: string;
              name?: string;
              avatar?: string;
              profilePicture?: string;
          }
        | null
        | undefined;
    const [imageError, setImageError] = useState(false);

    const avatarSrc = user?.avatar || user?.profilePicture || '';
    const initials = useMemo(() => {
        const fromName =
            user?.firstName || user?.lastName
                ? `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
                : '';
        if (fromName) return fromName.toUpperCase();
        const email = user?.email || storage.getUserEmail() || '';
        return email ? email.slice(0, 2).toUpperCase() : 'U';
    }, [user]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <span className="flex cursor-pointer items-center gap-1">
                    <Avatar className="size-7 rounded-lg">
                        {avatarSrc && !imageError ? (
                            <AvatarImage
                                src={avatarSrc}
                                alt=""
                                className="rounded-lg"
                                onError={() => setImageError(true)}
                            />
                        ) : null}
                        <AvatarFallback className="rounded-lg text-xs bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(RouteURL.profile)}>
                    <User className="size-4" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(RouteURL.security)}>
                    <Shield className="size-4" />
                    Security
                </DropdownMenuItem>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void logout()}
                >
                    <LogOut className="size-4" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserAvatar;
