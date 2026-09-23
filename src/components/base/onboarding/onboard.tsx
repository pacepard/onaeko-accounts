import { RouteURL } from '@/routes/paths';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@onaeko/ui/button';
import { Card, CardContent } from '@onaeko/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@onaeko/ui';
import { UserType } from '@/utils/enums.util';
import UserContext from '@/context/user/userContext';
import storage from '@/services/storage';
import { OnaekoAPI } from '@/api/base/config';
import { toast } from '@onaeko/ui';
import { getOnboardingRoute } from '@/utils/onboarding';

interface UserTypeOption {
    id: UserType;
    title: string;
    description: string;
    image: string;
    alt: string;
}

const userTypeOptions: UserTypeOption[] = [
    {
        id: UserType.BUSINESS,
        title: 'For workplace',
        description:
            'Run memorable hackthons, turn developers into loyal customers',
        image: '/items/Planning-A-Trip.png',
        alt: 'Workplace collaboration illustration',
    },
    {
        id: UserType.TALENT,
        title: 'For personal use',
        description:
            'Build mastery, work on real projects, and get paid for it',
        image: '/items/Peace.png',
        alt: 'Personal development illustration',
    },
    {
        id: UserType.USER,
        title: 'For Education',
        description:
            'Organise in-house internships, and scale learning outcomes',
        image: '/items/Affiliate-Program.png',
        alt: 'Education and learning illustration',
    },
];

const Onboard: React.FC = () => {
    const [selectedType, setSelectedType] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    const { setUserType } = useContext(UserContext) || {};

    // Guard: Check onboarding status and redirect if user has already started onboarding
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
                    const userType = statusData.userType;

                    // Allow only if step === 0 or status === 'not-started'
                    if (step > 0 || status !== 'not-started') {
                        // User has already started onboarding, redirect to appropriate step
                        const route = getOnboardingRoute(
                            step,
                            status,
                            userType,
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

    const handleContinue = async () => {
        if (selectedType && setUserType) {
            setIsLoading(true);
            setError(''); // Clear any previous errors
            try {
                const response = await OnaekoAPI.user.setUserType({
                    userType: selectedType,
                });

                if (
                    response.error === false &&
                    (response.status === 200 || response.status === 201)
                ) {
                    // Store the selected user type in context
                    setUserType(selectedType);

                    // Navigate first, then show success toast
                    navigate(RouteURL.onboardingBasicInfo);
                    toast.success('User type selected');
                } else {
                    // Use inline error instead of toast
                    setError(
                        response.message ||
                            'Failed to set user type. Please try again.',
                    );
                }
            } catch (error) {
                console.error('Error setting user type:', error);
                // Use inline error instead of toast
                setError('An error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-2 w-full max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
                    How are you planning to use Onaeko?
                </h1>
                <p className="text-lg text-muted-foreground">
                    We'll streamline your setup experience accordingly.
                </p>
            </div>

            {/* User Type Selection Cards - Using Flex */}
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-4xl mx-auto md:px-4">
                {userTypeOptions.map((option, index) => {
                    const isSelected = selectedType === option.id;

                    return (
                        <Card
                            key={`${option.id}-${index}`}
                            className={cn(
                                'relative cursor-pointer transition-all duration-200 hover:shadow-md',
                                'flex-1 basis-0', // Equal distribution with basis-0
                                'min-w-[280px] md:min-w-0', // Min width on mobile only
                                'max-w-[380px]', // Max width to prevent cards from getting too wide
                                isSelected
                                    ? 'border-primary border-2 shadow-md'
                                    : 'border-border hover:border-primary/50',
                            )}
                            onClick={() => setSelectedType(option.id)}
                        >
                            {/* Selection Indicator */}
                            <div className="absolute top-4 right-4 z-10">
                                {isSelected ? (
                                    <CheckCircle2 className="size-6 text-primary fill-primary" />
                                ) : (
                                    <Circle className="size-6 text-muted-foreground" />
                                )}
                            </div>

                            <CardContent className="pt-6 pb-6 px-6 h-full">
                                <div className="flex flex-col items-center text-center space-y-4 h-full">
                                    {/* Image */}
                                    <div
                                        className={cn(
                                            'w-full flex items-center justify-center transition-all duration-200 flex-shrink-0',
                                            isSelected
                                                ? 'scale-105'
                                                : 'scale-100',
                                        )}
                                    >
                                        <img
                                            src={option.image}
                                            alt={option.alt}
                                            className={cn(
                                                'w-full h-auto object-contain',
                                                'max-h-[180px] md:max-h-[200px]',
                                                isSelected
                                                    ? 'opacity-100'
                                                    : 'opacity-80',
                                            )}
                                        />
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className={cn(
                                            'text-xl font-semibold',
                                            isSelected
                                                ? 'text-foreground'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {option.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full flex justify-center pt-2">
                    <p className="text-sm text-destructive text-center">
                        {error}
                    </p>
                </div>
            )}

            {/* Continue Button */}
            <div className="w-full flex justify-center pt-4">
                <Button
                    onClick={handleContinue}
                    disabled={!selectedType || isLoading}
                    size="lg"
                    className="min-w-[200px]"
                >
                    {isLoading ? 'Loading...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
};

export default Onboard;
