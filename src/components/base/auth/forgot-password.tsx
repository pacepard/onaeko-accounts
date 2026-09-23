import { Button } from '@onaeko/ui/button';
import { Input } from '@onaeko/ui/input';
import { Label } from '@onaeko/ui/label';
import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    forgotPasswordSchema,
    verifyOtpSchema,
} from './validation';
import type {
    ForgotPasswordFormValues,
    VerifyOtpFormValues,
} from './validation';
import { Loader2, Mail } from 'lucide-react';
import { OnaekoAPI } from '@/api/base/config';
import { toast } from '@onaeko/ui';
import { useNavigate } from 'react-router-dom';
import storage from '@/services/storage';
import { OtpType } from '@/utils/enums.util';

interface ForgotPasswordFormProps {
    onStepChange?: (step: 'email' | 'otp' | 'success') => void;
    className?: string;
}

const ForgotPasswordForm = ({
    onStepChange,
    className = '',
}: ForgotPasswordFormProps) => {
    const navigate = useNavigate();
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const [maskedEmail, setMaskedEmail] = useState('');

    const emailForm = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const otpForm = useForm<VerifyOtpFormValues>({
        resolver: zodResolver(verifyOtpSchema),
        defaultValues: { otp: '' },
    });

    const updateStep = (newStep: 'email' | 'otp' | 'success') => {
        setStep(newStep);
        onStepChange?.(newStep);
    };

    useEffect(() => {
        if (resendCountdown <= 0) return;

        const timer = setInterval(() => {
            setResendCountdown((v) => (v <= 1 ? 0 : v - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCountdown]);

    const maskEmail = (email: string): string => {
        const parts = email.split('@');
        if (parts.length !== 2) return email;
        const localPart = parts[0];
        const domain = parts[1];
        if (!localPart || !domain || localPart.length <= 2) return email;
        const maskedLocal =
            localPart[0] +
            '*'.repeat(localPart.length - 2) +
            localPart[localPart.length - 1];
        return `${maskedLocal}@${domain}`;
    };

    const startResendCountdown = () => {
        setResendCountdown(60);
    };

    const handleEmailSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            // Store email in localStorage
            storage.keepLegacy('userEmail', data.email);

            const response = await OnaekoAPI.auth.forgotPassword({
                email: data.email,
            });

            if (response.error) {
                emailForm.setError('root', {
                    type: 'server',
                    message:
                        response.message ||
                        response.data?.message ||
                        'Failed to send OTP. Please try again.',
                });
            } else {
                setEmail(data.email);
                setMaskedEmail(maskEmail(data.email));
                updateStep('otp');
                startResendCountdown();
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
                toast.success('OTP sent to your email address');
            }
        } catch (error: any) {
            console.error('Forgot password error:', error);
            // Handle different error types
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'An unexpected error occurred. Please try again.';

            emailForm.setError('root', {
                type: 'server',
                message: errorMessage,
            });
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const digits = value.replace(/\D/g, '');
        const otpValue = otpForm.watch('otp') || '';
        const otpArray = otpValue.padEnd(6, ' ').split('');

        if (!digits) {
            otpArray[index] = '';
            const newOtp = otpArray.join('').trim();
            otpForm.setValue('otp', newOtp);
            return;
        }

        digits.split('').forEach((d, i) => {
            if (index + i < 6) otpArray[index + i] = d;
        });

        const newOtp = otpArray.join('').trim();
        otpForm.setValue('otp', newOtp);

        const nextIndex = Math.min(index + digits.length, 5);
        otpRefs.current[nextIndex]?.focus();

        // Auto-submit if last digit
        if (newOtp.length === 6 && index === 5) {
            setTimeout(() => {
                otpForm.handleSubmit(handleOtpSubmit)();
            }, 100);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (pasted) {
            otpForm.setValue('otp', pasted);
            const focusIndex = Math.min(pasted.length - 1, 5);
            otpRefs.current[focusIndex]?.focus();
            if (pasted.length === 6) {
                setTimeout(() => {
                    otpForm.handleSubmit(handleOtpSubmit)();
                }, 100);
            }
        }
    };

    const handleOtpSubmit = async (data: VerifyOtpFormValues) => {
        try {
            const response = await OnaekoAPI.auth.verifyOTP({
                email,
                otp: Number(data.otp),
                otpType: OtpType.FORGOTPASSWORD,
            });

            if (response.error) {
                otpForm.setError('otp', {
                    type: 'server',
                    message:
                        response.message ||
                        response.data ||
                        'Invalid OTP. Please try again.',
                });
            } else {
                updateStep('success');
                toast.success('Email verified successfully!');
            }
        } catch (error) {
            otpForm.setError('otp', {
                type: 'server',
                message: 'An unexpected error occurred. Please try again.',
            });
            console.error('OTP verification error:', error);
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0) return;

        otpForm.setValue('otp', '');
        startResendCountdown();
        otpRefs.current[0]?.focus();

        try {
            const response = await OnaekoAPI.auth.resendOTP({
                email,
                otpType: OtpType.FORGOTPASSWORD,
            });

            if (response.error) {
                otpForm.setError('root', {
                    type: 'server',
                    message:
                        response.message ||
                        response.data ||
                        'Failed to resend OTP. Please try again.',
                });
            } else {
                toast.success('OTP resent successfully');
            }
        } catch (error) {
            otpForm.setError('root', {
                type: 'server',
                message:
                    'An error occurred while resending OTP. Please try again.',
            });
            console.error('Resend OTP error:', error);
        }
    };

    const handleBackToEmail = () => {
        updateStep('email');
        otpForm.setValue('otp', '');
        otpForm.clearErrors();
    };

    const otpValue = otpForm.watch('otp', '');

    // Email step
    if (step === 'email') {
        return (
            <form
                onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                className={`p-6 space-y-6 ${className}`}
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 space-y-1">
                        <Label htmlFor="email">Enter your email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="yourname@email.com"
                                className="pl-9 h-11 ring-foreground/15 border-transparent ring-1"
                                {...emailForm.register('email')}
                                aria-invalid={
                                    !!emailForm.formState.errors.email
                                }
                            />
                        </div>
                        {emailForm.formState.errors.email && (
                            <p className="text-sm text-destructive">
                                {emailForm.formState.errors.email.message}
                            </p>
                        )}
                        {emailForm.formState.errors.root && (
                            <p className="text-sm text-destructive mt-1">
                                {emailForm.formState.errors.root.message}
                            </p>
                        )}
                    </div>

                    <Button
                        className="w-full h-11 justify-center items-center gap-2"
                        disabled={emailForm.formState.isSubmitting}
                        type="submit"
                    >
                        {emailForm.formState.isSubmitting && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {emailForm.formState.isSubmitting
                            ? 'Sending OTP...'
                            : 'Request OTP'}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-blue-600 underline underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    // OTP verification step
    if (step === 'otp') {
        return (
            <form
                onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
                className={`p-6 space-y-6 ${className}`}
            >
                <div className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground">
                        <p>We sent a verification code to</p>
                        <p className="font-medium text-foreground">
                            {maskedEmail}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 space-y-1">
                        <Label>Verification Code</Label>
                        <div className="flex gap-2 justify-center">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Input
                                    key={index}
                                    // @ts-ignore - ref assignment for OTP inputs
                                    ref={(el) => (otpRefs.current[index] = el)}
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otpValue[index] || ''}
                                    onChange={(e) =>
                                        handleOtpChange(index, e.target.value)
                                    }
                                    onPaste={
                                        index === 0 ? handlePaste : undefined
                                    }
                                    onFocus={(e) => e.currentTarget.select()}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Backspace' &&
                                            !otpValue[index] &&
                                            index > 0
                                        ) {
                                            otpRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                    className={`w-12 h-12 text-center text-lg font-semibold ${
                                        otpForm.formState.errors.otp
                                            ? 'border-destructive'
                                            : ''
                                    }`}
                                    aria-invalid={
                                        !!otpForm.formState.errors.otp
                                    }
                                />
                            ))}
                        </div>

                        {otpForm.formState.errors.otp && (
                            <p className="text-sm text-destructive text-center">
                                {otpForm.formState.errors.otp.message}
                            </p>
                        )}
                        {otpForm.formState.errors.root && (
                            <p className="text-sm text-destructive text-center">
                                {otpForm.formState.errors.root.message}
                            </p>
                        )}
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            Didn't receive the code?{' '}
                            {resendCountdown > 0 ? (
                                <span>Resend in {resendCountdown}s</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={otpForm.formState.isSubmitting}
                                    className="text-primary underline underline-offset-4 hover:no-underline"
                                >
                                    Resend code
                                </button>
                            )}
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 justify-center items-center gap-2"
                        disabled={otpForm.formState.isSubmitting}
                    >
                        {otpForm.formState.isSubmitting && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {otpForm.formState.isSubmitting
                            ? 'Verifying...'
                            : 'Verify code'}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={handleBackToEmail}
                        disabled={
                            otpForm.formState.isSubmitting ||
                            emailForm.formState.isSubmitting
                        }
                    >
                        Back to email
                    </Button>
                </div>
            </form>
        );
    }

    // Success step
    return (
        <div className={`p-6 space-y-6 text-center ${className}`}>
            <div className="flex flex-col gap-2">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold">Email verified!</h2>
                <p className="text-sm text-muted-foreground">
                    Your identity has been verified. You can now create a new
                    password.
                </p>
            </div>

            <Button
                onClick={() => navigate('/reset-password')}
                className="w-full h-11"
            >
                Create new password
            </Button>

            <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full h-11"
            >
                Back to login
            </Button>
        </div>
    );
};

export default ForgotPasswordForm;
