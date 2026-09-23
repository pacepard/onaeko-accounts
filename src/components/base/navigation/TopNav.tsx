import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@onaeko/ui/breadcrumb';
import { Link, useLocation } from 'react-router-dom';
import BreadcrumbMap from '@/_data/breadcrumb-map';
import { normalizePathname } from '@/utils/pathname.util';

const TopNav = () => {
    const location = useLocation();
    const pathname = normalizePathname(location.pathname);
    const pathParts = pathname.split('/').filter(Boolean);
    const paths = pathParts.map(
        (_, idx) => '/' + pathParts.slice(0, idx + 1).join('/'),
    );

    return (
        <div>
            <Breadcrumb>
                <BreadcrumbList>
                    {paths.map((path, idx) => {
                        const isLast = idx === paths.length - 1;
                        const label = BreadcrumbMap[path] || pathParts[idx];

                        return (
                            <BreadcrumbItem key={path}>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <>
                                        <BreadcrumbLink asChild>
                                            <Link to={path}>{label}</Link>
                                        </BreadcrumbLink>
                                        <BreadcrumbSeparator />
                                    </>
                                )}
                            </BreadcrumbItem>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
};

export default TopNav;
