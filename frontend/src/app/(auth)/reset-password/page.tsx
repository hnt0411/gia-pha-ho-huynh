'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, KeyRound, TreePine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updatePassword } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingLink, setCheckingLink] = useState(true);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#0f172a';
    const mutedColor = isDark ? '#cbd5e1' : '#475569';
    const inputStyle = {
        color: textColor,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };
    const authCode = useMemo(() => searchParams.get('code'), [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) });

    useEffect(() => {
        let active = true;

        const initRecoverySession = async () => {
            try {
                setError('');

                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const recoveryType = hashParams.get('type');

                if (recoveryType === 'recovery' && accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (sessionError) {
                        throw sessionError;
                    }

                    window.history.replaceState({}, document.title, window.location.pathname);
                } else if (authCode) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
                    if (exchangeError) {
                        throw exchangeError;
                    }

                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                const { data: { session } } = await supabase.auth.getSession();

                if (!active) {
                    return;
                }

                if (!session) {
                    setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy gửi lại email mới.');
                }
            } catch {
                if (active) {
                    setError('Không xác thực được link đặt lại mật khẩu. Hãy yêu cầu gửi lại email mới.');
                }
            } finally {
                if (active) {
                    setCheckingLink(false);
                }
            }
        };

        void initRecoverySession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;

            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
                setError('');
                setCheckingLink(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [authCode]);

    const onSubmit = async (data: ResetPasswordForm) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const result = await updatePassword(data.password);
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess('Đặt lại mật khẩu thành công. Bạn sẽ được chuyển về màn đăng nhập.');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
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
                <CardTitle className="text-2xl font-bold" style={{ color: textColor }}>Đặt lại mật khẩu</CardTitle>
                <CardDescription style={{ color: mutedColor }}>
                    Link trong email đóng vai trò bước xác thực thứ hai. Sau khi xác thực xong, bạn có thể nhập mật khẩu mới.
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

                    {checkingLink ? (
                        <div className="rounded-md border border-border/60 p-4 text-sm" style={{ color: mutedColor }}>
                            Đang xác thực link đặt lại mật khẩu...
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="password" style={{ color: textColor }}>
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Tối thiểu 8 ký tự"
                                        {...register('password')}
                                        className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        style={inputStyle}
                                        disabled={!!error}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: mutedColor }}
                                        onClick={() => setShowPassword((value) => !value)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="confirmPassword" style={{ color: textColor }}>
                                    Xác nhận mật khẩu mới
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nhập lại mật khẩu mới"
                                    {...register('confirmPassword')}
                                    className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    style={inputStyle}
                                    disabled={!!error}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full shadow-md hover:shadow-lg transition-shadow"
                                disabled={loading || !!error}
                            >
                                {loading ? 'Đang cập nhật mật khẩu...' : <><KeyRound className="mr-2 h-4 w-4" /> Lưu mật khẩu mới</>}
                            </Button>
                        </>
                    )}

                    <Link
                        href="/forgot-password"
                        className="inline-flex h-10 w-full items-center justify-center rounded-md border-2 border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Gửi lại email quên mật khẩu
                    </Link>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
