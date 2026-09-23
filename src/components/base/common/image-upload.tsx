import { useRef, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '@onaeko/ui/button';
import { cn } from '@onaeko/ui';

type ImageUploadProps = {
    value?: string | null;
    onChange?: (file: File | null, previewUrl: string | null) => void;
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
    className?: string;
    accept?: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    maxSize?: number;
    placeholder?: ReactNode;
};

/**
 * Minimal local image picker used by onboarding workspace step.
 */
export function ImageUpload({
    value,
    onChange,
    onFileSelect,
    disabled,
    className,
    accept = 'image/*',
    label = 'Upload image',
    size = 'md',
    maxSize,
    placeholder,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const box = size === 'sm' ? 'size-12' : size === 'lg' ? 'size-24' : 'size-16';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            onChange?.(null, null);
            return;
        }
        if (maxSize && file.size > maxSize) {
            onChange?.(null, null);
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        onChange?.(file, previewUrl);
        onFileSelect?.(file);
    };

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled}
                onChange={handleChange}
            />
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    box,
                    'rounded-md border border-dashed overflow-hidden flex items-center justify-center bg-muted/40',
                )}
            >
                {value ? (
                    <img src={value} alt="" className="size-full object-cover" />
                ) : (
                    (placeholder ?? <span className="text-xs text-muted-foreground">{label}</span>)
                )}
            </button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
            >
                {label}
            </Button>
        </div>
    );
}

export default ImageUpload;
