'use client';

import {
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
}

const DialogContext = createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

function useDialogContext() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('Dialog components must be used within <Dialog>.');
    }
    return context;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
    return (
        <DialogContext.Provider value={{ open, setOpen: (nextOpen) => onOpenChange?.(nextOpen) }}>
            {children}
        </DialogContext.Provider>
    );
}

interface DialogTriggerProps extends HTMLAttributes<HTMLElement> {
    asChild?: boolean;
}

export function DialogTrigger({ asChild, className, children, onClick, ...props }: DialogTriggerProps) {
    const { setOpen } = useDialogContext();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
            setOpen(true);
        }
    };

    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }>;
        return cloneElement(child, {
            onClick: (event: React.MouseEvent<HTMLElement>) => {
                child.props.onClick?.(event);
                if (!event.defaultPrevented) {
                    setOpen(true);
                }
            },
        });
    }

    return (
        <button type="button" className={cn(className)} onClick={handleClick} {...props}>
            {children}
        </button>
    );
}

export function DialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    const { open, setOpen } = useDialogContext();

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, setOpen]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Đóng"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />
            <div
                className={cn(
                    'relative z-10 w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col space-y-1.5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn('text-lg font-semibold', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
