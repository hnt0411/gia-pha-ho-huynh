'use client';

import { createContext, useContext, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
    value: string;
    setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value: valueProp, onValueChange, className, children, ...props }: TabsProps) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
    const value = valueProp ?? uncontrolledValue;
    const setValue = (next: string) => {
        if (valueProp === undefined) setUncontrolledValue(next);
        onValueChange?.(next);
    };
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={cn('space-y-4', className)} {...props}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground', className)} {...props} />;
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
    const ctx = useContext(TabsContext);
    const active = ctx?.value === value;
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium',
                active ? 'bg-background text-foreground shadow' : 'hover:text-foreground',
                className,
            )}
            onClick={() => ctx?.setValue(value)}
            {...props}
        >
            {children}
        </button>
    );
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
    const ctx = useContext(TabsContext);
    if (ctx?.value !== value) return null;
    return <div className={cn('mt-2', className)} {...props} />;
}
