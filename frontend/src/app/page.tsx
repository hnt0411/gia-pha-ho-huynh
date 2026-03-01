import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Gia phả họ Huỳnh</h1>
                <p className="text-muted-foreground">Chào mừng bạn đến với hệ thống gia phả.</p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                >
                    Đăng nhập
                </Link>
            </div>
        </main>
    );
}
