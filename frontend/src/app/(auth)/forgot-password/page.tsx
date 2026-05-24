'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, RotateCcw, TreePine } from 'lucide-react';
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
    otp: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { requestPasswordReset, resetPasswordWithOtp } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
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
        watch,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

    const emailValue = watch('email');

    const onSubmit = async (data: ForgotPasswordForm) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (!otpRequested) {
                const result = await requestPasswordReset(data.email);
                if (result.error) {
                    setError(result.error);
                    return;
                }

                setOtpRequested(true);
                setSuccess(result.message || 'Đã gửi mã OTP đặt lại mật khẩu.');
                return;
            }

            const otp = data.otp?.trim() || '';
            const password = data.password || '';
            const confirmPassword = data.confirmPassword || '';

            if (otp.length < 6) {
                setError('Hay nhap ma OTP gom 6 chu so.');
                return;
            }

            if (password.length < 8) {
                setError('Mat khau moi toi thieu 8 ky tu.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Mat khau xac nhan khong khop.');
                return;
            }

            const result = await resetPasswordWithOtp(data.email, otp, password);
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess('Dat lai mat khau thanh cong. Ban se duoc chuyen ve man dang nhap.');
            setTimeout(() => {
                router.push('/login');
            }, 1200);
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
                    {otpRequested
                        ? 'Nhap ma OTP trong email va mat khau moi de hoan tat viec dat lai mat khau.'
                        : 'Nhap email tai khoan. He thong se thu gui ma OTP dat lai mat khau qua Supabase.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}
                    {success && (
                        <div
                            className="rounded-md border p-3 text-sm font-medium shadow-sm"
                            style={{
                                backgroundColor: isDark ? 'rgba(6, 78, 59, 0.28)' : '#dcfce7',
                                borderColor: isDark ? '#065f46' : '#86efac',
                                color: isDark ? '#bbf7d0' : '#14532d',
                            }}
                        >
                            {success}
                        </div>
                    )}

                    <div
                        className="rounded-md border border-amber-200/80 p-3 text-xs leading-5 shadow-sm"
                        style={{
                            backgroundColor: isDark ? 'rgba(120, 53, 15, 0.18)' : '#fffbeb',
                            color: isDark ? '#fde68a' : '#92400e',
                        }}
                    >
                        Neu ban khong nhan duoc ma OTP, hay kiem tra thu rac va xem lai `Auth Logs` trong Supabase. Mail mac dinh cua Supabase co the bi gioi han tan suat gui.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email" style={{ color: textColor }}>Email</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            {...register('email')}
                            className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={inputStyle}
                            disabled={otpRequested || loading}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    {otpRequested && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="otp" style={{ color: textColor }}>Mã OTP</label>
                                <Input
                                    id="otp"
                                    inputMode="numeric"
                                    placeholder="Nhập 6 chữ số"
                                    {...register('otp')}
                                    className="text-center text-lg tracking-[0.35em] placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="password" style={{ color: textColor }}>Mật khẩu mới</label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Tối thiểu 8 ký tự"
                                        {...register('password')}
                                        className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        style={inputStyle}
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
                                />
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                        {!otpRequested
                            ? (loading ? 'Đang gửi mã OTP...' : <><Mail className="mr-2 h-4 w-4" /> Gửi mã OTP</>)
                            : (loading ? 'Đang cập nhật mật khẩu...' : <><KeyRound className="mr-2 h-4 w-4" /> Lưu mật khẩu mới</>)
                        }
                    </Button>

                    {otpRequested && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-2 shadow-sm hover:shadow-md"
                            style={{
                                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                color: textColor,
                            }}
                            onClick={async () => {
                                if (!emailValue) {
                                    setError('Khong tim thay email de gui lai ma OTP.');
                                    return;
                                }

                                setError('');
                                setSuccess('');
                                setLoading(true);
                                try {
                                    const result = await requestPasswordReset(emailValue);
                                    if (result.error) {
                                        setError(result.error);
                                        return;
                                    }

                                    setSuccess(result.message || 'Đã gửi lại mã OTP đặt lại mật khẩu.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Gửi lại mã OTP
                        </Button>
                    )}

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
