import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => (
        <input
            type={type}
            ref={ref}
            className={cn(
                'flex h-11 w-full rounded-xl border border-border bg-white/[0.02] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/70',
                'transition-colors duration-200 ease-out',
                'focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary/30',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    )
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(
                'flex min-h-[80px] w-full rounded-xl border border-border bg-white/[0.02] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70',
                'transition-colors duration-200 ease-out resize-y',
                'focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary/30',
                className
            )}
            {...props}
        />
    )
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
