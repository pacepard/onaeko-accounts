import { Button } from '@onaeko/ui/button';
import { Input } from '@onaeko/ui/input';
import { Label } from '@onaeko/ui/label';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from './validation';
import type { ResetPasswordFormValues } from './validation';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { OnaekoAPI } from '@/api/base/config';
import { toast } from '@onaeko/ui';
import { useNavigate } from 'react-router-dom';
import storage from '@/services/storage';
import zxcvbn from 'zxcvbn';
import { strengthColors } from '@/utils/helpers';
const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordScore, setPasswordScore] = useState(0);

    const {
        register: formRegister,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const passwordValue = watch('newPassword', '');

    useEffect(() => {
        if (!passwordValue) {
            setPasswordScore(0);
            return;
        }

        const result = zxcvbn(passwordValue);
        setPasswordScore(result.score);
    }, [passwordValue]);

    const cleanEmail = (): string => {
        let e = storage.getUserEmail() as string;
        if (!e) return '';
        if (e.startsWith('"') && e.endsWith('"')) {
            try {
                e = JSON.parse(e);
            } catch {
                e = e.replace(/^"(.*)"$/, '$1');
            }
        }
        return e || '';
    };

    const onSubmit = async (data: ResetPasswordFormValues) => {
        const email = cleanEmail();

        if (!email) {
            setError('root', {
                type: 'server',
                message:
                    'Email not found. Please start over from forgot password.',
            });
            return;
        }

        try {
            const resetResponse = await OnaekoAPI.auth.resetPassword({
                email,
                newPassword: data.newPassword,
            });

            if (resetResponse.error) {
                setError('root', {
                    type: 'server',
                    message:
                        resetResponse.message ||
                        resetResponse.data?.message ||
                        'Failed to reset password. Please try again.',
                });
            } else {
                // Navigate to login page
                navigate('/login');
                toast.success(
                    'Password reset successfully! Please login with your new password.',
                );
            }
        } catch (error) {
            setError('root', {
                type: 'server',
                message: 'An unexpected error occurred. Please try again.',
            });
            console.error('Reset password error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
                {/* New Password */}
                <div className="flex flex-col gap-2 space-y-1">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            className="pl-9 pr-10 h-11 ring-foreground/15 border-transparent ring-1"
                            {...formRegister('newPassword')}
                            aria-invalid={!!errors.newPassword}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>

                    {errors.newPassword && (
                        <p className="text-sm text-destructive">
                            {errors.newPassword.message}
                        </p>
                    )}

                    {/* Password strength bar */}
                    {passwordValue && (
                        <div className="mt-1 h-2 w-full rounded bg-gray-200">
                            <div
                                className={`h-2 rounded ${strengthColors[passwordScore]}`}
                                style={{
                                    width: `${((passwordScore + 1) / 5) * 100}%`,
                                }}
                            ></div>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2 space-y-1">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            className="pl-9 pr-10 h-11 ring-foreground/15 border-transparent ring-1"
                            {...formRegister('confirmPassword')}
                            aria-invalid={!!errors.confirmPassword}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>

                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Server error from React Hook Form (inline, not toast) */}
                {errors.root && (
                    <p className="text-sm text-destructive text-center">
                        {errors.root.message}
                    </p>
                )}

                {/* Submit Button */}
                <Button
                    className="w-full h-11 justify-center items-center gap-2"
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting ? 'Resetting password...' : 'Reset Password'}
                </Button>
            </div>
        </form>
    );
};

export default ResetPasswordForm;
