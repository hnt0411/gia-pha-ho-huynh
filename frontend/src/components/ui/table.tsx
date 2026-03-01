'use client';

import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}
interface TableSectionProps extends HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}
interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

export function Table({ className, ...props }: TableProps) {
    return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

export function TableHeader({ className, ...props }: TableSectionProps) {
    return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: TableSectionProps) {
    return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
    return <tr className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />;
}

export function TableHead({ className, ...props }: TableHeadProps) {
    return <th className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)} {...props} />;
}

export function TableCell({ className, ...props }: TableCellProps) {
    return <td className={cn('p-4 align-middle', className)} {...props} />;
}
