'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
}

export function Dialog({ children }: DialogProps) {
    return <div>{children}</div>;
}

interface DialogTriggerProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

export function DialogTrigger({ className, ...props }: DialogTriggerProps) {
    return <div className={className} {...props} />;
}

export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-lg border bg-card p-6', className)} {...props} />;
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
