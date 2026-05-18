import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
    return (
        <Sonner
            theme="dark"
            position="bottom-right"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl rounded-xl',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton: 'group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground',
                    success: 'group-[.toaster]:!bg-primary/95 group-[.toaster]:!text-primary-foreground group-[.toaster]:border-primary/40',
                    error:   'group-[.toaster]:!bg-destructive/95 group-[.toaster]:!text-destructive-foreground',
                },
            }}
            {...props}
        />
    );
}
