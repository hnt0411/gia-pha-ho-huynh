import './globals.css';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';

export const metadata = {
    title: 'Gia phả họ Huỳnh',
    description: 'Ứng dụng quản lý gia phả',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="vi">
            <body className="min-h-screen bg-background text-foreground">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
