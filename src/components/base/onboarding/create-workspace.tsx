import { RouteURL } from '@/routes/paths';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@onaeko/ui/button';
import { Input } from '@onaeko/ui/input';
import { Label } from '@onaeko/ui/label';
import { ImageUpload } from '@/components/base/common/image-upload';
import { toast } from '@onaeko/ui';
import { OnaekoAPI } from '@/api/base/config';
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from './validation';
import { cn } from '@onaeko/ui';
import { UserType } from '@/utils/enums.util';
import UserContext from '@/context/user/userContext';
import storageUtil from '@/services/storage';
import {
    getOnboardingRoute,
    getPreviousOnboardingRoute,
} from '@/utils/onboarding';

const CreateWorkspace: React.FC = () => {
    const navigate = useNavigate();
    const { user, userType } = useContext(UserContext) || {};
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [, setSelectedFile] = useState<File | null>(null);
    const [uploadedImageData, setUploadedImageData] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateWorkspaceFormValues>({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: {
            name: '',
        },
    });

    const workspaceName = watch('name');

    // Guard: Check onboarding status and redirect if user hasn't completed step 3 or has already completed step 4
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            // Only check if user is authenticated
            if (!storageUtil.checkToken()) {
                return;
            }

            try {
                const statusResponse =
                    await OnaekoAPI.user.getOnboardingStatus();

                if (statusResponse.error === false && statusResponse.data) {
                    const statusData = statusResponse.data as any;
                    const step = statusData.step || 0;
                    const status = statusData.status || 'not-started';
                    const userTypeFromStatus = statusData.userType;

                    // Allow only if step >= 3 and step < 4
                    if (step < 3) {
                        // User hasn't completed previous step yet, redirect to previous step
                        const previousRoute = getPreviousOnboardingRoute(
                            step,
                            userTypeFromStatus,
                        );
                        if (previousRoute) {
                            navigate(previousRoute);
                        } else {
                            navigate(RouteURL.onboarding);
                        }
                    } else if (step >= 4) {
                        // User has already completed this step, redirect to next step
                        const route = getOnboardingRoute(
                            step,
                            status,
                            userTypeFromStatus,
                        );
                        navigate(route);
                    }
                }
            } catch (error) {
                // Silently fail - allow user to proceed if check fails
                console.error('Error checking onboarding status:', error);
            }
        };

        checkOnboardingStatus();
    }, [navigate]);

    // Pre-fill workspace name based on user type
    useEffect(() => {
        if (user) {
            const userObj = user as any;
            let defaultName = '';

            if (userType === UserType.TALENT) {
                // For talent users: use first name + last name
                const firstName = userObj?.firstName || '';
                const lastName = userObj?.lastName || '';
                if (firstName || lastName) {
                    defaultName = `${firstName} ${lastName}`.trim();
                }
            } else if (
                userType === UserType.BUSINESS ||
                userType === UserType.USER
            ) {
                // For business users: use business name from storage first, then fall back to user context
                defaultName =
                    storageUtil.fetchLegacy('businessName') ||
                    userObj?.businessName ||
                    '';
            }

            if (defaultName) {
                setValue('name', defaultName);
            }
        }
    }, [user, userType, setValue]);

    // Get the first letter of workspace name for icon placeholder, or default to 'N'
    const getIconLetter = () => {
        if (workspaceName?.trim()) {
            return workspaceName.trim().charAt(0).toUpperCase();
        }
        return 'N';
    };

    const handleImageChange = async (
        file: File | null,
        preview: string | null,
    ) => {
        setSelectedFile(file);
        setSelectedIcon(preview);
        setUploadedImageData(null); // Reset uploaded data

        // Upload image immediately when file is selected
        if (file) {
            // Verify user is authenticated before uploading
            const token = storageUtil.getToken();
            if (!token) {
                setError('root', {
                    type: 'server',
                    message:
                        'You must be logged in to upload images. Please refresh the page.',
                });
                setSelectedFile(null);
                setSelectedIcon(null);
                return;
            }

            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response =
                    await OnaekoAPI.storage.uploadImage(formData);

                if (response.error === false && response.data) {
                    setUploadedImageData(response.data);
                    console.log('Image uploaded successfully:', response.data);
                } else {
                    setError('root', {
                        type: 'server',
                        message:
                            response.message ||
                            'Failed to upload image. Please try again.',
                    });
                    // Clear the selected file if upload fails
                    setSelectedFile(null);
                    setSelectedIcon(null);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                setError('root', {
                    type: 'server',
                    message: 'Failed to upload image. Please try again.',
                });
                // Clear the selected file if upload fails
                setSelectedFile(null);
                setSelectedIcon(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const onSubmit = async (data: CreateWorkspaceFormValues) => {
        try {
            // If image was uploaded, use the uploaded image data; otherwise send as JSON
            let payload: any;

            if (uploadedImageData) {
                // Use the uploaded image data (already uploaded via storage API)
                // Pass s3Key and fileName as expected by workspace service
                payload = {
                    name: data.name.trim(),
                    description: '', // Can be added later if needed
                    icon: {
                        fileName: uploadedImageData.fileName,
                        s3Key: uploadedImageData.s3Key,
                    },
                };
            } else {
                // Send as regular JSON payload (no icon)
                payload = {
                    name: data.name.trim(),
                    description: '', // Can be added later if needed
                };
            }

            const response =
                await OnaekoAPI.workspace.createWorkspace(payload);

            if (
                response.error === false &&
                (response.status === 200 || response.status === 201)
            ) {
                // Navigate first, then show optional success toast
                navigate(RouteURL.onboardingInviteTeammates);
                // Optional: Show success toast after navigation (non-blocking, informational)
                toast.success('Workspace created');
            } else {
                // Use React Hook Form's setError for server errors (inline, not toast)
                setError('root', {
                    type: 'server',
                    message:
                        response.message ||
                        'Failed to create workspace. Please try again.',
                });
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            // Use React Hook Form's setError for unexpected errors
            setError('root', {
                type: 'server',
                message: 'Failed to create workspace. Please try again.',
            });
        }
    };

    const handleBack = () => {
        // Determine previous step based on userType
        // Guards will prevent going back if previous step is already completed
        const previousRoute = getPreviousOnboardingRoute(3, userType);
        if (previousRoute) {
            navigate(previousRoute);
        } else {
            // Fallback to user-info if previous route can't be determined
            navigate(RouteURL.onboardingUserInfo);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full relative min-h-[600px] py-12">
            {/* Form Section */}
            <div className="w-full max-w-[420px] mx-auto space-y-8 z-10">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-[32px] leading-[1.2] font-semibold text-foreground tracking-tight">
                        Create your workspace
                    </h1>
                    <p className="text-[15px] leading-[1.5] text-muted-foreground">
                        Fill in some details for your teammates.
                    </p>
                </div>

                {/* Icon Selection */}
                <div className="flex flex-col items-center space-y-3">
                    <ImageUpload
                        value={selectedIcon}
                        onChange={handleImageChange}
                        size="md"
                        accept="image/*"
                        maxSize={2 * 1024 * 1024} // 2MB
                        placeholder={
                            <span className="text-[36px] font-semibold text-[#37352f] dark:text-[#9b9a97]">
                                {getIconLetter()}
                            </span>
                        }
                    />
                    <p className="text-[14px] text-[#787774] dark:text-[#9b9a97]">
                        {isUploading ? 'Uploading...' : 'Choose icon'}
                    </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Workspace Name */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="workspace-name"
                            className="text-[14px] font-medium text-foreground leading-[1.5]"
                        >
                            Workspace name
                        </Label>
                        <Input
                            id="workspace-name"
                            type="text"
                            placeholder="Paystack"
                            {...register('name')}
                            className={cn(
                                'w-full h-[36px]',
                                'text-[15px] leading-[1.5]',
                                'bg-white dark:bg-[#1a1a1a]',
                                'border-[#e9e9e6] dark:border-[#404040]',
                                'rounded-[3px]',
                                'px-[12px] py-[6px]',
                                'shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]',
                                'transition-all duration-150',
                                'focus-visible:border-[#2383e2] dark:focus-visible:border-[#2383e2]',
                                'focus-visible:ring-1 focus-visible:ring-[#2383e2]/20',
                                'focus-visible:shadow-[0_0_0_3px_rgba(35,131,226,0.1)]',
                                'placeholder:text-[#9b9a97] dark:placeholder:text-[#6e6d69]',
                                errors.name &&
                                    'border-[#eb5757] dark:border-[#eb5757] focus-visible:border-[#eb5757] focus-visible:ring-[#eb5757]/20',
                            )}
                        />
                        <p className="text-[13px] leading-[1.5] text-[#787774] dark:text-[#9b9a97]">
                            The name of your company or organization.
                        </p>
                        {errors.name && (
                            <p className="text-[13px] text-[#eb5757] dark:text-[#ff6b6b] mt-1">
                                {errors.name.message}
                            </p>
                        )}
                        {errors.root && (
                            <p className="text-[13px] text-[#eb5757] dark:text-[#ff6b6b] mt-1">
                                {errors.root.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-3 pt-2"
                >
                    <Button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="w-full h-10"
                    >
                        {isSubmitting
                            ? 'Creating...'
                            : isUploading
                              ? 'Uploading...'
                              : 'Continue'}
                    </Button>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                        Back
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspace;
