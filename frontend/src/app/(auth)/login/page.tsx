'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreePine, Eye, EyeOff, UserPlus, LogIn, MailCheck, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    displayName: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signUp, verifySignUpOtp, resendSignUpOtp } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [otpCode, setOtpCode] = useState('');
    const [pendingSignup, setPendingSignup] = useState<{ email: string; displayName?: string } | null>(null);
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
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const onSubmit = async (data: LoginForm) => {
        clearMessages();
        setLoading(true);

        try {
            if (mode === 'register') {
                const result = await signUp(data.email, data.password, data.displayName);
                if (result.error) {
                    setError(result.error);
                } else if (result.requiresOtp) {
                    setPendingSignup({
                        email: data.email,
                        displayName: data.displayName,
                    });
                    setOtpCode('');
                    setSuccess(result.message || 'Ma OTP xac nhan dang ky da duoc gui vao email.');
                } else {
                    router.push('/tree');
                }
            } else {
                const result = await signIn(data.email, data.password);
                if (result.error) {
                    setError(result.error);
                } else {
                    router.push('/tree');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySignupOtp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearMessages();

        if (!pendingSignup) {
            setError('Khong tim thay phien dang ky dang cho xac nhan.');
            return;
        }

        if (otpCode.trim().length < 6) {
            setError('Hay nhap ma OTP gom 6 chu so.');
            return;
        }

        setLoading(true);
        try {
            const result = await verifySignUpOtp(pendingSignup.email, otpCode.trim());
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess('Xac nhan email thanh cong. Dang chuyen vao he thong...');
            router.push('/tree');
        } finally {
            setLoading(false);
        }
    };

    const handleResendSignupCode = async () => {
        if (!pendingSignup) {
            return;
        }

        clearMessages();
        setLoading(true);
        try {
            const result = await resendSignUpOtp(pendingSignup.email);
            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess(result.message || 'Da gui lai ma OTP dang ky.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
        setPendingSignup(null);
        setOtpCode('');
        clearMessages();
    };

    const showRegisterOtpStep = mode === 'register' && !!pendingSignup;

    return (
        <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <TreePine className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold" style={{ color: textColor }}>Gia phả họ Huỳnh</CardTitle>
                <CardDescription style={{ color: mutedColor }}>
                    {showRegisterOtpStep
                        ? 'Nhap ma OTP vua duoc gui vao email de kich hoat tai khoan'
                        : mode === 'login'
                        ? 'Đăng nhập để quản lý & đóng góp thông tin'
                        : 'Đăng ký tài khoản thành viên dòng họ'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                {success && (
                    <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-400">
                        {success}
                    </div>
                )}

                {showRegisterOtpStep ? (
                    <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                        <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm" style={{ color: mutedColor }}>
                            <div className="font-medium" style={{ color: textColor }}>
                                Email xac nhan: {pendingSignup.email}
                            </div>
                            <div className="mt-1">
                                {pendingSignup.displayName ? `Tai khoan ${pendingSignup.displayName} dang cho kich hoat.` : 'Tai khoan dang cho kich hoat.'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="signupOtp" style={{ color: textColor }}>
                                Mã OTP
                            </label>
                            <Input
                                id="signupOtp"
                                inputMode="numeric"
                                placeholder="Nhập 6 chữ số"
                                value={otpCode}
                                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="text-center text-lg tracking-[0.35em] placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                style={inputStyle}
                            />
                            <p className="text-xs" style={{ color: mutedColor }}>
                                Mã sẽ được gửi bởi SMTP của Supabase sau khi bạn bấm đăng ký.
                            </p>
                        </div>

                        <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                            {loading ? 'Đang xác nhận...' : <><MailCheck className="mr-2 h-4 w-4" /> Xác nhận mã OTP</>}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-2 shadow-sm hover:shadow-md"
                            style={{
                                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                color: textColor,
                            }}
                            onClick={handleResendSignupCode}
                            disabled={loading}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Gửi lại mã OTP
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                setPendingSignup(null);
                                setOtpCode('');
                                clearMessages();
                            }}
                            disabled={loading}
                        >
                            Quay lại sửa thông tin đăng ký
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="displayName" style={{ color: textColor }}>Họ tên</label>
                                <Input id="displayName" placeholder="Huỳnh Văn A" {...register('displayName')}
                                    className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    style={inputStyle} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email" style={{ color: textColor }}>Email</label>
                            <Input id="email" type="email" placeholder="email@example.com" {...register('email')}
                                className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                style={inputStyle} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="password" style={{ color: textColor }}>Mật khẩu</label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    style={inputStyle}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: mutedColor }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
                            {mode === 'login' ? (
                                <>{loading ? 'Đang đăng nhập...' : <><LogIn className="h-4 w-4 mr-2" /> Đăng nhập</>}</>
                            ) : (
                                <>{loading ? 'Đang gửi mã OTP...' : <><UserPlus className="h-4 w-4 mr-2" /> Đăng ký</>}</>
                            )}
                        </Button>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2" style={{ color: mutedColor }}>hoặc</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-2 shadow-sm hover:shadow-md"
                            style={{
                                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                color: textColor,
                            }}
                            onClick={switchMode}
                        >
                            {mode === 'login'
                                ? <><UserPlus className="h-4 w-4 mr-2" /> Tạo tài khoản mới</>
                                : <><LogIn className="h-4 w-4 mr-2" /> Đăng nhập</>
                            }
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
