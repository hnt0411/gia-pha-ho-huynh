'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/components/auth-provider';

export default function MainLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isLoggedIn, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            router.replace('/login');
        }
    }, [isLoggedIn, loading, router]);

    if (loading || !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
