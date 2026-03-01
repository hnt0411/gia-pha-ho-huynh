'use client';

import { createContext, useContext, useState, cloneElement, isValidElement, useEffect } from 'react';
import type { HTMLAttributes, ReactNode, ReactElement, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
    children: ReactNode;
}

interface DropdownContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
    anchorEl: HTMLElement | null;
    setAnchorEl: (el: HTMLElement | null) => void;
    anchorRect: DOMRect | null;
    setAnchorRect: (rect: DOMRect | null) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    return (
        <DropdownContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl, anchorRect, setAnchorRect }}>
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
        if (ctx) {
            const el = event.currentTarget as HTMLElement;
            if (!ctx.open) {
                ctx.setAnchorEl(el);
                ctx.setAnchorRect(el.getBoundingClientRect());
            }
            ctx.setOpen(!ctx.open);
        }
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
    useEffect(() => {
        if (!ctx.anchorEl) return;
        const update = () => ctx.setAnchorRect(ctx.anchorEl?.getBoundingClientRect() ?? null);
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [ctx.anchorEl, ctx]);
    const rect = ctx.anchorRect;
    const top = (rect?.bottom ?? 0) + 8;
    const left = (props.align ?? 'end') === 'end' ? (rect?.right ?? 0) : (rect?.left ?? 0);
    const transform = (props.align ?? 'end') === 'end' ? 'translateX(-100%)' : 'translateX(0)';
    return (
        createPortal(
            <div
                className={cn('fixed rounded-md border bg-background p-2 shadow-xl z-[2000] min-w-56', className)}
                style={{ top, left, transform }}
                {...props}
            />,
            document.body,
        )
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
