import { Button } from '@onaeko/ui/button';
import { ArrowRight } from 'lucide-react';

interface IAuthHeader {
    title: string;
    subtitle?: string;
    description?: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
}

const AuthHeader = (props: IAuthHeader) => {
    const {
        title,
        subtitle = '',
        description = '',
        buttonLabel = '',
        onButtonClick = () => {},
    } = props;

    return (
        <div className="px-6 py-2 text-start w-full">
            <h1 className="text-xl font-semibold">{title}</h1>

            {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
            )}

            {description && (
                <div className=" flex items-center justify-start hover:space-x-1">
                    <p className="text-muted-foreground text-sm">{description}</p>

                    {buttonLabel && (
                        <Button
                            variant="link"
                            onClick={onButtonClick}
                            className="inline-flex items-center text-sm text-blue-600 rounded-md hover:text-blue-700 hover:bg-blue-50 hover:no-underline"
                        >
                            {buttonLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuthHeader;
