'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, TreePine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

const forgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { requestPasswordReset } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#0f172a';
    const mutedColor = isDark ? '#cbd5e1' : '#475569';
    const inputStyle = {
        color: textColor,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const result = await requestPasswordReset(data.email);
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess(result.message || 'Đã gửi email đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-3 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <TreePine className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold" style={{ color: textColor }}>Quên mật khẩu</CardTitle>
                <CardDescription style={{ color: mutedColor }}>
                    Nhập email tài khoản. Supabase sẽ gửi link xác nhận để bạn đặt lại mật khẩu.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}
                    {success && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email" style={{ color: textColor }}>Email</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            {...register('email')}
                            className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={inputStyle}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                        {loading ? 'Đang gửi email...' : <><Mail className="mr-2 h-4 w-4" /> Gửi link đặt lại mật khẩu</>}
                    </Button>

                    <Link
                        href="/login"
                        className="inline-flex h-10 w-full items-center justify-center rounded-md border-2 border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại đăng nhập
                    </Link>
                </form>
            </CardContent>
        </Card>
    );
}
