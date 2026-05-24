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
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
