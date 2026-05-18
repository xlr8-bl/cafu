import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            className
        )}
        {...props}
    />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sheetVariants = cva(
    'fixed z-50 gap-4 bg-card shadow-2xl shadow-black/50 transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-300 data-[state=open]:duration-500',
    {
        variants: {
            side: {
                top:    'inset-x-0 top-0 border-b border-border data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0',
                bottom: 'inset-x-0 bottom-0 border-t border-border data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
                left:   'inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm',
                right:  'inset-y-0 right-0 h-full w-full border-l border-border data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 sm:max-w-md',
            },
        },
        defaultVariants: { side: 'right' },
    }
);

interface SheetContentProps
    extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
        VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
            <DialogPrimitive.Close
                className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            {children}
        </DialogPrimitive.Content>
    </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col gap-1 p-6 pb-2', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col gap-3 p-6 pt-4 border-t border-border bg-black/20', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('text-xl font-semibold tracking-tight', className)}
        {...props}
    />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
    SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
};
