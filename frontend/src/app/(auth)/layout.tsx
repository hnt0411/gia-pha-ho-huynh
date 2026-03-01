export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-4">
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
