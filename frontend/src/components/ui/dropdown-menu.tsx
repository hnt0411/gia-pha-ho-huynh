'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
    children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    return <div className="relative">{children}</div>;
}

interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

export function DropdownMenuTrigger({ className, ...props }: DropdownMenuTriggerProps) {
    return <div className={className} {...props} />;
}

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
    align?: string;
    forceMount?: boolean;
}

export function DropdownMenuContent({ className, ...props }: DropdownMenuContentProps) {
    return <div className={cn('mt-2 rounded-md border bg-card p-2 shadow', className)} {...props} />;
}

export function DropdownMenuItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('cursor-pointer rounded px-2 py-1 text-sm hover:bg-accent', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('my-1 h-px bg-border', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('px-2 py-1 text-sm font-medium', className)} {...props} />;
}
