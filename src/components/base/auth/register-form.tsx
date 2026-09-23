// src/components/shared/auth/register-form.tsx
import { Button } from '@onaeko/ui/button';
import { Input } from '@onaeko/ui/input';
import { Label } from '@onaeko/ui/label';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from './validation';
import type { RegisterFormValues } from './validation';
import zxcvbn from 'zxcvbn';
import { Loader2, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { strengthColors } from '@/utils/helpers';
import { OnaekoAPI } from '@/api/base/config';
import { toast } from '@onaeko/ui';
import { useLocation, useNavigate } from 'react-router-dom';
import storage from '@/services/storage';
import { persistContinueNext, readNextFromSearch } from '@/utils/continue.util';
import { RouteURL } from '@/routes/paths';
import { OAuthButtons } from './oauth-buttons';
const RegisterForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [showPassword, setShowPassword] = useState(false);
    const [passwordScore, setPasswordScore] = useState(0);
    const [_feedback, setFeedback] = useState<string[]>([]);

    const {
        register: formRegister,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: '', password: '' },
    });

    const passwordValue = watch('password', '');

    useEffect(() => {
        if (!passwordValue) {
            setPasswordScore(0);
            setFeedback([]);
            return;
        }

        const result = zxcvbn(passwordValue);
        setPasswordScore(result.score);
        setFeedback(result.feedback.suggestions);
    }, [passwordValue]);

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const response = await OnaekoAPI.auth.registerUser({
                email: data.email,
                password: data.password,
            });

            if (response.error) {
                // Use React Hook Form's setError for server errors (inline, not toast)
                setError('root', {
                    type: 'server',
                    message:
                        response.message ||
                        response.data?.message ||
                        'Registration failed. Please try again.',
                });
            } else {
                // Store email so activate-account page can show the correct masked email
                storage.keepLegacy('userEmail', data.email);
                const next = readNextFromSearch(location.search);
                persistContinueNext(next);
                const activate =
                    next != null && next !== ''
                        ? `${RouteURL.activateAccount}?next=${encodeURIComponent(next)}`
                        : RouteURL.activateAccount;
                navigate(activate);
                toast.success(
                    'Registration successful! Please check your email to verify your account.',
                );
            }
        } catch (error) {
            // Use React Hook Form's setError for unexpected errors
            setError('root', {
                type: 'server',
                message: 'An unexpected error occurred. Please try again.',
            });
            console.error('Registration error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pt-6 pb-2 space-y-6">
            <div className="space-y-4">
                {/* Email */}
                <div className="flex flex-col gap-2 space-y-1">
                    <Label htmlFor="email">Enter your email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="yourname@email.com"
                            className="pl-9 h-11 ring-foreground/15 border-transparent ring-1"
                            {...formRegister('email')}
                            aria-invalid={!!errors.email}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2 space-y-1">
                    <Label htmlFor="password">Enter your password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="create a password"
                            className="pl-9 pr-10 h-11 ring-foreground/15 border-transparent ring-1"
                            {...formRegister('password')}
                            aria-invalid={!!errors.password}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword((v) => !v)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>

                    {errors.password && (
                        <p className="text-sm text-destructive">
                            {errors.password.message}
                        </p>
                    )}

                    {/* Server error from React Hook Form (inline, not toast) */}
                    {errors.root && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.root.message}
                        </p>
                    )}

                    {/* Password strength bar */}
                    {passwordValue && (
                        <>
                            <div className="mt-1 h-2 w-full rounded bg-gray-200">
                                <div
                                    className={`h-2 rounded ${strengthColors[passwordScore]}`}
                                    style={{
                                        width: `${((passwordScore + 1) / 5) * 100}%`,
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    className="w-full h-11 justify-center items-center gap-2"
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
            </div>

            {/* OAuth Buttons and separator on Top */}
            <div className="grid gap-4">
                <OAuthButtons formType="register" />
            </div>
        </form>
    );
};

export default RegisterForm;
