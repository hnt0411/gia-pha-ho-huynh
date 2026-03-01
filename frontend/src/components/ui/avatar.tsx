'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {}
interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {}

export function Avatar({ className, ...props }: AvatarProps) {
    return <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
    return <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)} {...props} />;
}
