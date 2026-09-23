import { useEffect } from 'react';
import { SidebarTrigger, useSidebar } from '@onaeko/ui/sidebar';
import storage from '@/services/storage';

const Trigger = () => {
    const { open, setOpen } = useSidebar();

    useEffect(() => {
        storage.keep('sidebar-collapsed', String(!open));
    }, [open]);

    return <SidebarTrigger onClick={() => setOpen(!open)} />;
};

export default Trigger;
