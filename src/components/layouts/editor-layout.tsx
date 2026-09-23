import type { ReactElement } from 'react';
import { Toaster } from '@onaeko/ui/sonner';
import { cn } from '@onaeko/ui';
import EditorHeader from '../base/editor/header';

interface IEditorLayout {
    component: ReactElement;
    title?: string;
    back?: boolean;
    sidebar?: {
        collapsed?: boolean;
    };
}

const EditorContent = ({ component, title, back }: IEditorLayout) => {
    const mainClasses = cn(
        'dashboard-body min-h-screen flex flex-col flex-1 bg-background text-foreground',
    );

    const wrapperClasses = 'mt-0 px-8 py-6 ';

    return (
        <main id="dashboard-body" className={mainClasses}>
            <EditorHeader pageTitle={title} showBack={back} sticky={true} />

            <div className="dashboard-content w-full flex-1 overflow-auto">
                <div className={wrapperClasses}>{component}</div>
            </div>
        </main>
    );
};

const EditorLayout = (data: IEditorLayout) => {
    const { component, title, back = false, sidebar } = data;

    return (
        <>
            <div className="flex h-screen w-full bg-background text-foreground">
                <EditorContent
                    component={component}
                    title={title}
                    back={back}
                    sidebar={sidebar}
                />
            </div>
            <Toaster />
        </>
    );
};

export default EditorLayout;
