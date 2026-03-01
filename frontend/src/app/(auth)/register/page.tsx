'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TreePine, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const registerSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    displayName: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(100),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get('code') || '';
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
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
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data: RegisterForm) => {
        if (!inviteCode) {
            setError('Bạn cần có mã mời để đăng ký');
            return;
        }

        try {
            setError('');
            setLoading(true);

            // Validate invite code against Supabase
            const { data: invite, error: inviteErr } = await supabase
                .from('invite_links')
                .select('*')
                .eq('code', inviteCode)
                .single();

            if (inviteErr || !invite) {
                setError('Mã mời không hợp lệ hoặc đã hết hạn');
                return;
            }

            if (invite.max_uses && invite.used_count >= invite.max_uses) {
                setError('Mã mời đã hết lượt sử dụng');
                return;
            }

            // Sign up via Supabase Auth
            const { data: authData, error: authErr } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        display_name: data.displayName,
                        invite_code: inviteCode,
                    },
                },
            });

            if (authErr) {
                setError(authErr.message);
                return;
            }

            // Increment invite used_count
            await supabase
                .from('invite_links')
                .update({ used_count: (invite.used_count || 0) + 1 })
                .eq('id', invite.id);

            // Create profile
            if (authData.user) {
                await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: data.email,
                    display_name: data.displayName,
                    role: invite.role || 'member',
                    status: 'active',
                });
            }

            router.push('/');
        } catch (err: unknown) {
            setError('Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <TreePine className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold" style={{ color: textColor }}>Tham gia Gia phả họ Huỳnh</CardTitle>
                <CardDescription style={{ color: mutedColor }}>Đăng ký tham gia nền tảng gia phả dòng họ</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {!inviteCode && (
                        <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ Bạn cần có mã mời từ Admin để đăng ký
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="displayName" style={{ color: textColor }}>Tên hiển thị</label>
                        <Input id="displayName" placeholder="Huỳnh Văn A" {...register('displayName')}
                            className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={inputStyle} />
                        {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                    </div>

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
                                placeholder="Tối thiểu 8 ký tự"
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
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="confirmPassword" style={{ color: textColor }}>Xác nhận mật khẩu</label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            {...register('confirmPassword')}
                            className="placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={inputStyle}
                        />
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !inviteCode}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
            <RegisterContent />
        </Suspense>
    );
}
