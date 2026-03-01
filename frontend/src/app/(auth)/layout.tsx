'use client';

import { useTheme } from 'next-themes';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const background = isDark
        ? 'linear-gradient(135deg, #020617 0%, #0b1220 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 50%, #fef3c7 100%)';
    return (
        <div
            className="flex min-h-screen items-center justify-center px-4"
            style={{ background }}
        >
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
