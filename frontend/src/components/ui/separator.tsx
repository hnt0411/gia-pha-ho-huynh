'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export function Separator({ className, ...props }: SeparatorProps) {
    return <div className={cn('h-px w-full bg-border', className)} {...props} />;
}
