import type { ReactNode } from 'react';
import AuthHeader from '../base/auth/auth-header';
import { TermsAndPrivacy } from '../base/auth/terms-and-privacy';
import OnaekoIcon from '../base/common/LogoIcon';
import { Toaster } from '@onaeko/ui/sonner';

interface IAuthLayout {
    title: string;
    subtitle?: string;
    description?: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    buttonLabel?: string;
    onButtonClick?: () => void;
    showTermsAndPrivacy?: boolean;
    authType?: 'signup' | 'signin';
    hideHeaderOnSuccess?: boolean;
}

export const AuthLayout = (props: IAuthLayout) => {
    const {
        title,
        subtitle,
        description,
        children,
        maxWidth = 'md',
        buttonLabel,
        onButtonClick,
        showTermsAndPrivacy = true,
        authType = 'signup',
        hideHeaderOnSuccess = false,
    } = props;

    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }[maxWidth];

    return (
        <>
            <div className="min-h-screen w-full flex items-center justify-center p-4">
                <div className={`${maxWidthClass} w-full`}>
                    <OnaekoIcon width={64} height={64} className="ml-5" />

                    {!hideHeaderOnSuccess && (
                        <AuthHeader
                            title={title}
                            subtitle={subtitle}
                            description={description}
                            buttonLabel={buttonLabel}
                            onButtonClick={onButtonClick}
                        />
                    )}

                    {children}

                    {showTermsAndPrivacy && (
                        <TermsAndPrivacy authType={authType} />
                    )}
                </div>
            </div>
            <Toaster />
        </>
    );
};
