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

const OTP_MAX_LENGTH = 6;

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
    const [pendingEmail, setPendingEmail] = useState('');
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
            if (!otpRequested) {
                const result = await requestPasswordReset(data.email);
                if (result.error) {
                    setError(result.error);
                    return;
                }

                setPendingEmail(data.email);
                setOtpRequested(true);
                setSuccess(result.message || 'Đã gửi mã OTP đặt lại mật khẩu.');
                return;
            }

            const targetEmail = pendingEmail || data.email;
            const otp = data.otp?.trim() || '';
            const password = data.password || '';
            const confirmPassword = data.confirmPassword || '';

            if (!targetEmail) {
                setError('Không tìm thấy email để đặt lại mật khẩu. Hãy gửi lại mã OTP.');
                return;
            }

            if (otp.length < 6) {
                setError('Hãy nhập đầy đủ mã OTP trong email.');
                return;
            }

            if (password.length < 8) {
                setError('Mật khẩu mới tối thiểu 8 ký tự.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Mật khẩu xác nhận không khớp.');
                return;
            }

            const result = await resetPasswordWithOtp(targetEmail, otp, password);
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess('Đặt lại mật khẩu thành công. Bạn sẽ được chuyển về màn đăng nhập.');
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
                        ? 'Nhập mã OTP trong email và mật khẩu mới để hoàn tất việc đặt lại mật khẩu.'
                        : 'Nhập email tài khoản. Hệ thống sẽ thử gửi mã OTP đặt lại mật khẩu qua Supabase.'}
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
                                backgroundColor: isDark ? 'rgba(20, 83, 45, 0.28)' : '#ecfdf3',
                                borderColor: isDark ? '#166534' : '#86efac',
                                color: isDark ? '#dcfce7' : '#166534',
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
                        Nếu bạn không nhận được mã OTP, hãy kiểm tra thư rác và xem lại `Auth Logs` trong Supabase. Mail mặc định của Supabase có thể bị giới hạn tần suất gửi.
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
                                    placeholder="Nhập mã OTP từ email"
                                    {...register('otp', {
                                        onChange: (event) => {
                                            event.target.value = event.target.value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH);
                                        },
                                    })}
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
                                if (!pendingEmail) {
                                    setError('Không tìm thấy email để gửi lại mã OTP.');
                                    return;
                                }

                                setError('');
                                setSuccess('');
                                setLoading(true);
                                try {
                                    const result = await requestPasswordReset(pendingEmail);
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
