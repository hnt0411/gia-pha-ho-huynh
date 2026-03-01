'use client';

import { createContext, useContext, useState, cloneElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactNode, ReactElement, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
    children: ReactNode;
}

interface DropdownContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    return (
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div className="relative">{children}</div>
        </DropdownContext.Provider>
    );
}

interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

export function DropdownMenuTrigger({ className, asChild, children, onClick, ...props }: DropdownMenuTriggerProps) {
    const ctx = useContext(DropdownContext);
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (ctx) ctx.setOpen(!ctx.open);
    };
    if (asChild && isValidElement(children)) {
        const child = children as ReactElement<any>;
        return cloneElement(child, {
            ...props,
            onClick: handleClick,
            className: cn(child.props?.className, className),
        });
    }
    return (
        <div className={cn('cursor-pointer', className)} onClick={handleClick} {...props}>
            {children}
        </div>
    );
}

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
    align?: string;
    forceMount?: boolean;
}

export function DropdownMenuContent({ className, ...props }: DropdownMenuContentProps) {
    const ctx = useContext(DropdownContext);
    if (!ctx?.open) return null;
    return (
        <div
            className={cn('absolute right-0 mt-2 rounded-md border bg-card p-2 shadow z-50', className)}
            {...props}
        />
    );
}

export function DropdownMenuItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    const ctx = useContext(DropdownContext);
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        props.onClick?.(event);
        if (ctx) ctx.setOpen(false);
    };
    return (
        <div
            className={cn('cursor-pointer rounded px-2 py-1 text-sm hover:bg-accent', className)}
            onClick={handleClick}
            {...props}
        />
    );
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('my-1 h-px bg-border', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('px-2 py-1 text-sm font-medium', className)} {...props} />;
}
