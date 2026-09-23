import { type ReactNode, useEffect, useState } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Link, useRouteError } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Bug,
    Code,
    ExternalLink,
    Home,
    Mail,
    MessageSquare,
    RefreshCw,
} from 'lucide-react';
import { Button, toast } from '@onaeko/ui';
import { RouteURL } from '@/routes/paths';
import { NODE_ENV, NodeEnv } from '@/utils/enums.util';
import * as Sentry from '@sentry/react';

interface ErrorInfo {
    componentStack?: string | null;
}

const generateErrorId = () =>
    `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const logError = (
    error: Error,
    info?: ErrorInfo,
    metadata?: Record<string, unknown>,
) => {
    const errorId = generateErrorId();
    const isProd = NODE_ENV === NodeEnv.PRODUCTION;

    if (!isProd) {
        console.error('[ErrorBoundary]', {
            error,
            componentStack: info?.componentStack,
            errorId,
            ...metadata,
        });
    } else {
        Sentry.withScope((scope) => {
            scope.setTag('errorId', errorId);
            if (info?.componentStack) {
                scope.setExtra('componentStack', info.componentStack);
            }
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    scope.setExtra(key, value);
                });
            }
            Sentry.captureException(error);
        });
    }

    return errorId;
};

interface ErrorFallbackProps {
    error: Error | null;
    errorInfo?: ErrorInfo | null;
    errorId: string;
    resetError: () => void;
}

export const ErrorFallback = ({
    error,
    errorInfo,
    errorId,
    resetError,
}: ErrorFallbackProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const [animateIcon, setAnimateIcon] = useState(true);
    const isDev = NODE_ENV !== NodeEnv.PRODUCTION;

    const handleRefresh = () => {
        resetError();
        window.location.reload();
    };

    useEffect(() => {
        const timer = setTimeout(() => setAnimateIcon(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const supportMailto = `mailto:support@onaeko.com?subject=${encodeURIComponent(
        `Error Report: ${errorId}`,
    )}&body=${encodeURIComponent(
        `Hello Support Team,\n\nI encountered an error with the following reference ID: ${errorId}\n\nPage URL: ${window.location.href}\n\nPlease help resolve this issue.\n\nThank you.`,
    )}`;

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-background px-6 py-12"
            role="alert"
            aria-labelledby="error-title"
        >
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl -z-10 scale-150" />
                        <div
                            className={`absolute -top-4 -right-4 ${animateIcon ? 'animate-bounce' : 'animate-pulse'}`}
                        >
                            <Bug size={32} className="text-primary/80" />
                        </div>
                        <div className={animateIcon ? 'animate-pulse' : ''}>
                            <AlertCircle
                                size={120}
                                strokeWidth={1.5}
                                className="text-primary"
                            />
                        </div>
                    </div>

                    <h1
                        id="error-title"
                        className="text-4xl lg:text-5xl font-medium mb-6 tracking-tight"
                        tabIndex={0}
                    >
                        Something went wrong
                    </h1>

                    <p
                        className="text-muted-foreground mb-8 text-lg max-w-lg"
                        tabIndex={0}
                    >
                        We&apos;re working on fixing this issue. Please try
                        refreshing the page or return to the homepage.
                    </p>

                    {errorId ? (
                        <div className="mb-8 w-full max-w-md">
                            <div className="flex items-center gap-2 bg-muted/20 border border-muted/30 overflow-hidden">
                                <div className="py-3 px-4 text-sm text-muted-foreground bg-muted/10">
                                    Error ID
                                </div>
                                <code className="text-sm font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground px-2">
                                    {errorId}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(errorId);
                                        toast.success('Error ID copied!');
                                    }}
                                    aria-label="Copy error ID to clipboard"
                                    title="Copy error ID"
                                    className="p-3 hover:bg-muted/30 transition-colors text-muted-foreground"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            width="14"
                                            height="14"
                                            x="8"
                                            y="8"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <Button
                            onClick={handleRefresh}
                            className="flex-1 w-full"
                            size="lg"
                            iconBefore={<RefreshCw size={20} />}
                        >
                            Try Again
                        </Button>

                        <div className="flex gap-3 flex-1">
                            <Button
                                asChild
                                variant="outline"
                                className="flex-1"
                                size="lg"
                                iconBefore={<Home size={18} />}
                            >
                                <Link to={RouteURL.home}>Home</Link>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="flex-1"
                                size="lg"
                                aria-label="Go back to previous page"
                                iconBefore={<ArrowLeft size={18} />}
                            >
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/5 backdrop-blur-sm p-8 border border-muted/10 h-fit">
                    <h2 className="text-xl font-medium mb-6 text-center">
                        Get Help
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <a
                            href={supportMailto}
                            className="flex flex-col items-center gap-3 p-4 border border-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            aria-label="Email support with error details"
                        >
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Mail size={24} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-sm">
                                    Email Support
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Get direct help
                                </div>
                            </div>
                        </a>

                        <a
                            href="https://docs.onaeko.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-3 p-4 border border-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            aria-label="Open Onaeko documentation"
                        >
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <ExternalLink
                                    size={24}
                                    className="text-primary"
                                />
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-sm">Docs</div>
                                <div className="text-xs text-muted-foreground">
                                    Guides & API
                                </div>
                            </div>
                        </a>

                        <a
                            href={`mailto:support@onaeko.com?subject=${encodeURIComponent(`Bug report: ${errorId}`)}`}
                            className="flex flex-col items-center gap-3 p-4 border border-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            aria-label="Report a bug by email"
                        >
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Bug size={24} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-sm">
                                    Report Bug
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Send details
                                </div>
                            </div>
                        </a>

                        <a
                            href="https://docs.onaeko.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-3 p-4 border border-muted/20 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            aria-label="Community and discussion"
                        >
                            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <MessageSquare
                                    size={24}
                                    className="text-primary"
                                />
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-sm">
                                    Help Center
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Find answers
                                </div>
                            </div>
                        </a>
                    </div>

                    {isDev ? (
                        <div className="w-full">
                            <button
                                type="button"
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-full py-3 border-t border-muted/10"
                            >
                                <Code size={16} />
                                {showDetails ? 'Hide' : 'Show'} Developer
                                Details
                            </button>

                            {showDetails ? (
                                <div className="mt-4 text-left overflow-auto max-h-80 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                                            Error Message
                                        </h3>
                                        <p className="text-sm font-mono text-destructive p-3 bg-muted/10 border border-muted/20">
                                            {error?.message}
                                        </p>
                                    </div>

                                    {error?.stack ? (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                                Stack Trace
                                            </h3>
                                            <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto p-3 bg-muted/10 border border-muted/20 text-muted-foreground">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    ) : null}

                                    {errorInfo?.componentStack ? (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                                                Component Stack
                                            </h3>
                                            <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto p-3 bg-muted/10 border border-muted/20 text-muted-foreground">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <p className="text-xs text-muted-foreground text-center mt-6 opacity-70">
                        Press Tab to navigate, Enter to select
                    </p>
                </div>
            </div>
        </div>
    );
};

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    name?: string;
}

export const ErrorBoundary = ({
    children,
    fallback,
    onError,
    name = 'unnamed',
}: ErrorBoundaryProps) => {
    const [errorId, setErrorId] = useState('');
    const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

    const handleError = (error: Error, info: ErrorInfo) => {
        const generatedErrorId = logError(error, info, { boundary: name });
        setErrorId(generatedErrorId);
        setErrorInfo(info);
        onError?.(error, info);
    };

    return (
        <ReactErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) =>
                fallback || (
                    <ErrorFallback
                        error={error instanceof Error ? error : new Error(String(error))}
                        errorInfo={errorInfo}
                        errorId={errorId}
                        resetError={resetErrorBoundary}
                    />
                )
            }
            onReset={() => {
                setErrorId('');
                setErrorInfo(null);
            }}
            onError={(error: unknown, info: ErrorInfo) =>
                handleError(
                    error instanceof Error ? error : new Error(String(error)),
                    info,
                )
            }
        >
            {children}
        </ReactErrorBoundary>
    );
};

/** React Router route error element (`errorElement`). */
export const RouterErrorElement = () => {
    const error = useRouteError();
    const normalized =
        error instanceof Error ? error : new Error(String(error));
    const errorId = logError(normalized);

    return (
        <ErrorFallback
            error={normalized}
            errorId={errorId}
            resetError={() => {
                window.location.href = RouteURL.home;
            }}
        />
    );
};

/** App-level alias used around the router tree. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
    return <ErrorBoundary name="app">{children}</ErrorBoundary>;
}

export default ErrorBoundary;
