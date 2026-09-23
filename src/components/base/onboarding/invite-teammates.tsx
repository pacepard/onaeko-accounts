import { RouteURL } from '@/routes/paths';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@onaeko/ui/button';
import { Input } from '@onaeko/ui/input';
import { Label } from '@onaeko/ui/label';
import { Checkbox } from '@onaeko/ui/checkbox';
import { Link, Plus, X } from 'lucide-react';
import { toast } from '@onaeko/ui';
import { inviteTeammatesSchema } from './validation';
import { cn } from '@onaeko/ui';
import { OnaekoAPI } from '@/api/base/config';
import storage from '@/services/storage';

const InviteTeammates: React.FC = () => {
    const navigate = useNavigate();
    const [inviteMode, setInviteMode] = useState<'email' | 'link'>('email');
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shareableLink, setShareableLink] = useState<string>('');

    const {
        register,
        handleSubmit,
        watch,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(inviteTeammatesSchema),
        defaultValues: {
            emails: [{ email: '' }, { email: '' }, { email: '' }],
            allowDomainAccess: false,
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'emails',
    });

    const watchedEmails = watch('emails');
    const allowDomainAccess = watch('allowDomainAccess');

    // Guard: Check onboarding status and redirect if user hasn't completed step 4 or has already completed onboarding
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            // Only check if user is authenticated
            if (!storage.checkToken()) {
                return;
            }

            try {
                const statusResponse =
                    await OnaekoAPI.user.getOnboardingStatus();

                if (statusResponse.error === false && statusResponse.data) {
                    const statusData = statusResponse.data as any;
                    const step = statusData.step || 0;
                    const status = statusData.status || 'not-started';

                    // Allow only if step >= 4 and status !== 'completed'
                    if (step < 4) {
                        // User hasn't completed workspace creation yet, redirect to create-workspace
                        navigate(RouteURL.onboardingCreateWorkspace);
                    } else if (status === 'completed') {
                        // User has already completed onboarding, redirect to dashboard
                        navigate(RouteURL.myAccount);
                    }
                }
            } catch (error) {
                // Silently fail - allow user to proceed if check fails
                console.error('Error checking onboarding status:', error);
            }
        };

        checkOnboardingStatus();
    }, [navigate]);

    // Update domain when emails change and domain access is enabled
    useEffect(() => {
        if (allowDomainAccess) {
            const firstValidEmail = watchedEmails?.find(
                (e) =>
                    e.email.trim() &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email),
            );
            if (firstValidEmail) {
                const emailDomain = firstValidEmail.email.split('@')[1];
                if (emailDomain) {
                    setDomain(emailDomain);
                }
            } else {
                setDomain('yourdomain.com');
            }
        }
    }, [watchedEmails, allowDomainAccess]);

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement API call to generate shareable link
            // For now, generate a placeholder link
            const link = `${window.location.origin}/invite/${Date.now()}`;
            setShareableLink(link);

            // Copy to clipboard - this is a non-blocking action, toast is appropriate
            await navigator.clipboard.writeText(link);
            toast.success('Link copied to clipboard');
        } catch (error) {
            console.error('Error generating link:', error);
            // Use React Hook Form's setError for errors
            setError('root', {
                type: 'server',
                message: 'Failed to generate shareable link',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: {
        emails: Array<{ email: string }>;
        allowDomainAccess: boolean;
    }) => {
        try {
            // Filter out empty emails and get the list
            const emailList = data.emails
                .map((e) => e.email.trim())
                .filter((email) => email !== '');

            // TODO: Implement API call to send invites
            console.log('Inviting emails:', emailList);
            console.log('Allow domain access:', data.allowDomainAccess, domain);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Navigate first, then show optional success toast
            navigate(RouteURL.myAccount);
            // Optional: Show success toast after navigation (non-blocking, informational)
            toast.success('Invitations sent');
        } catch (error) {
            console.error('Error sending invites:', error);
            // Use React Hook Form's setError for server errors
            setError('root', {
                type: 'server',
                message: 'Failed to send invitations. Please try again.',
            });
        }
    };

    const handleContinue = async () => {
        if (inviteMode === 'link') {
            if (!shareableLink) {
                await handleGenerateLink();
            }
            navigate(RouteURL.myAccount);
            return;
        }
        // For email mode, handleSubmit will be called by the form
    };

    const handleBack = () => {
        // Only allow going back to create-workspace (step 3) if current step is 4
        // Guards will prevent going back if step 3 is already completed
        navigate(RouteURL.onboardingCreateWorkspace);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full relative min-h-[600px] py-12">
            {/* Form Section */}
            <div className="w-full max-w-[500px] mx-auto space-y-8 z-10">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-[32px] leading-[1.2] font-semibold text-foreground tracking-tight">
                        Invite teammates
                    </h1>
                    <p className="text-[15px] leading-[1.5] text-muted-foreground">
                        Get the most out of Onaeko by inviting your teammates.
                    </p>
                </div>

                {/* Invite Mode Tabs */}
                <div className="flex items-center justify-between border-b border-[#e9e9e6] dark:border-[#404040]">
                    <button
                        type="button"
                        onClick={() => setInviteMode('email')}
                        className={cn(
                            'px-4 py-2 text-[14px] font-medium transition-colors relative',
                            'text-[#787774] dark:text-[#9b9a97]',
                            inviteMode === 'email' && 'text-foreground',
                            'hover:text-foreground',
                        )}
                    >
                        Send invites
                        {inviteMode === 'email' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setInviteMode('link');
                            if (!shareableLink) {
                                handleGenerateLink();
                            }
                        }}
                        className={cn(
                            'px-4 py-2 text-[14px] font-medium transition-colors relative flex items-center gap-2',
                            'text-[#787774] dark:text-[#9b9a97]',
                            inviteMode === 'link' && 'text-foreground',
                            'hover:text-foreground',
                        )}
                    >
                        <Link size={16} />
                        Get shareable link
                        {inviteMode === 'link' && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                        )}
                    </button>
                </div>

                {/* Content based on mode */}
                {inviteMode === 'email' ? (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Email Inputs */}
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative">
                                    <Input
                                        type="email"
                                        placeholder="Email address"
                                        {...register(`emails.${index}.email`)}
                                        className={cn(
                                            'w-full h-[36px]',
                                            'text-[15px] leading-[1.5]',
                                            'bg-white dark:bg-[#1a1a1a]',
                                            'border-[#e9e9e6] dark:border-[#404040]',
                                            'rounded-[3px]',
                                            'px-[12px] py-[6px] pr-10',
                                            'shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]',
                                            'transition-all duration-150',
                                            'focus-visible:border-[#2383e2] dark:focus-visible:border-[#2383e2]',
                                            'focus-visible:ring-1 focus-visible:ring-[#2383e2]/20',
                                            'focus-visible:shadow-[0_0_0_3px_rgba(35,131,226,0.1)]',
                                            'placeholder:text-[#9b9a97] dark:placeholder:text-[#6e6d69]',
                                            errors.emails?.[index]?.email &&
                                                'border-[#eb5757] dark:border-[#eb5757] focus-visible:border-[#eb5757] focus-visible:ring-[#eb5757]/20',
                                        )}
                                    />
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className={cn(
                                                'absolute right-2 top-1/2 -translate-y-1/2',
                                                'w-6 h-6 rounded-[3px]',
                                                'flex items-center justify-center',
                                                'text-[#787774] dark:text-[#9b9a97]',
                                                'hover:bg-[#f7f6f3] dark:hover:bg-[#2e2e2e]',
                                                'transition-colors',
                                            )}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    {errors.emails?.[index]?.email && (
                                        <p className="text-[13px] text-[#eb5757] dark:text-[#ff6b6b] mt-1">
                                            {
                                                errors.emails[index]?.email
                                                    ?.message
                                            }
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add More Link */}
                        <button
                            type="button"
                            onClick={() => append({ email: '' })}
                            className={cn(
                                'flex items-center gap-2',
                                'text-[14px] text-[#2383e2]',
                                'hover:text-[#1a73d1]',
                                'transition-colors',
                            )}
                        >
                            <Plus size={16} />
                            Add more or invite in bulk
                        </button>

                        {/* Domain Access Checkbox */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="domain-access"
                                    checked={allowDomainAccess}
                                    onCheckedChange={(checked) => {
                                        setValue(
                                            'allowDomainAccess',
                                            checked as boolean,
                                        );
                                    }}
                                    className={cn(
                                        'mt-0.5',
                                        'border-[#e9e9e6] dark:border-[#404040]',
                                        'data-[state=checked]:bg-[#2383e2] data-[state=checked]:border-[#2383e2]',
                                        'focus-visible:ring-[#2383e2]/20',
                                    )}
                                />
                                <div className="flex-1">
                                    <label
                                        htmlFor="domain-access"
                                        className={cn(
                                            'text-[14px] leading-[1.5] text-foreground',
                                            'cursor-pointer select-none',
                                        )}
                                    >
                                        Allow anyone with a{' '}
                                        <span className="font-medium">
                                            @{domain || 'yourdomain.com'}
                                        </span>{' '}
                                        email to join this workspace
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Form-level errors */}
                        {errors.emails &&
                            typeof errors.emails.message === 'string' && (
                                <p className="text-[13px] text-[#eb5757] dark:text-[#ff6b6b]">
                                    {errors.emails.message}
                                </p>
                            )}
                        {errors.root && (
                            <p className="text-[13px] text-[#eb5757] dark:text-[#ff6b6b]">
                                {errors.root.message}
                            </p>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    'w-full h-[36px]',
                                    'text-[14px] font-medium',
                                    'bg-[#2383e2] hover:bg-[#1a73d1]',
                                    'text-white',
                                    'rounded-[3px]',
                                    'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
                                    'hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]',
                                    'transition-all duration-150',
                                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2383e2]',
                                    'active:scale-[0.98]',
                                    'focus:outline-none focus:ring-2 focus:ring-[#2383e2]/20 focus:ring-offset-2',
                                )}
                            >
                                {isSubmitting
                                    ? 'Processing...'
                                    : 'Send invites'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* Shareable Link Mode */
                    <div className="space-y-4">
                        {shareableLink ? (
                            <div className="space-y-3">
                                <Label className="text-[14px] font-medium text-foreground">
                                    Shareable link
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={shareableLink}
                                        readOnly
                                        className={cn(
                                            'w-full h-[36px]',
                                            'text-[15px] leading-[1.5]',
                                            'bg-[#f7f6f3] dark:bg-[#2e2e2e]',
                                            'border-[#e9e9e6] dark:border-[#404040]',
                                            'rounded-[3px]',
                                            'px-[12px] py-[6px]',
                                            'text-[#787774] dark:text-[#9b9a97]',
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(
                                                    shareableLink,
                                                );
                                                // Toast for copy action - non-blocking, user doesn't need to fix anything
                                                toast.success(
                                                    'Link copied to clipboard',
                                                );
                                            } catch (error) {
                                                // Toast for copy failure - non-blocking
                                                toast.error(
                                                    'Failed to copy link',
                                                );
                                            }
                                        }}
                                        className={cn(
                                            'h-[36px] px-4',
                                            'text-[14px] font-medium',
                                            'bg-white dark:bg-[#1a1a1a]',
                                            'border border-[#e9e9e6] dark:border-[#404040]',
                                            'text-foreground',
                                            'hover:bg-[#f7f6f3] dark:hover:bg-[#2e2e2e]',
                                            'rounded-[3px]',
                                            'transition-colors',
                                        )}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-[13px] text-[#787774] dark:text-[#9b9a97]">
                                    Share this link with your teammates to
                                    invite them to your workspace.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[14px] text-muted-foreground">
                                    Generating shareable link...
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons for Link Mode */}
                {inviteMode === 'link' && (
                    <div className="space-y-2 pt-2">
                        <Button
                            onClick={handleContinue}
                            disabled={isLoading}
                            className={cn(
                                'w-full h-[36px]',
                                'text-[14px] font-medium',
                                'bg-[#2383e2] hover:bg-[#1a73d1]',
                                'text-white',
                                'rounded-[3px]',
                                'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
                                'hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]',
                                'transition-all duration-150',
                                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2383e2]',
                                'active:scale-[0.98]',
                                'focus:outline-none focus:ring-2 focus:ring-[#2383e2]/20 focus:ring-offset-2',
                            )}
                        >
                            {isLoading
                                ? 'Processing...'
                                : 'Take me to Onaeko'}
                        </Button>
                    </div>
                )}

                {/* Back Button */}
                <div className="space-y-2 pt-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        className={cn(
                            'w-full text-center',
                            'text-[14px] text-[#787774] dark:text-[#9b9a97]',
                            'hover:text-foreground',
                            'transition-colors duration-150',
                            'py-2 rounded-[3px]',
                            'hover:bg-[#f7f6f3] dark:hover:bg-[#2e2e2e]',
                        )}
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteTeammates;
