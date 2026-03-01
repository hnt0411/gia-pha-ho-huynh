import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function MainLayout({ children }: { children: ReactNode }) {
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
