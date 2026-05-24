'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'member' | null;

const ADMIN_EMAIL = 'huynhnhattien0411@gmail.com';

interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    role: UserRole;
    person_handle: string | null;
    avatar_url: string | null;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
    isMember: boolean;
    isLoggedIn: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (
        email: string,
        password: string,
        displayName?: string,
    ) => Promise<{ error?: string; message?: string; requiresOtp?: boolean }>;
    verifySignUpOtp: (email: string, token: string) => Promise<{ error?: string }>;
    resendSignUpOtp: (email: string) => Promise<{ error?: string; message?: string }>;
    requestPasswordReset: (email: string) => Promise<{ error?: string; message?: string }>;
    resetPasswordWithOtp: (email: string, token: string, password: string) => Promise<{ error?: string }>;
    updatePassword: (password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function isAdminEmail(email?: string | null) {
    return email?.toLowerCase() === ADMIN_EMAIL;
}

function formatAuthErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const normalizedMessage = message.toLowerCase();

    if (message.includes('Invalid login credentials')) {
        return 'Email hoặc mật khẩu không đúng';
    }

    if (normalizedMessage.includes('email rate limit exceeded')) {
        return 'Bạn vừa gửi quá nhiều email xác nhận trong thời gian ngắn. Hãy đợi vài phút rồi thử lại.';
    }

    if (normalizedMessage.includes('error sending confirmation email')) {
        return 'Supabase hiện không gửi được email xác nhận. Hãy kiểm tra cấu hình SMTP, mẫu email và địa chỉ gửi trong Supabase.';
    }

    if (normalizedMessage.includes('error sending password reset email')) {
        return 'Supabase hiện không gửi được email đặt lại mật khẩu. Hãy kiểm tra rate limit, Auth logs hoặc cấu hình SMTP.';
    }

    if (normalizedMessage.includes('same password') || normalizedMessage.includes('different from the old password')) {
        return 'Mật khẩu mới phải khác mật khẩu cũ.';
    }

    if (normalizedMessage.includes('session') && normalizedMessage.includes('missing')) {
        return 'Phiên đặt lại mật khẩu chưa được tạo đúng. Hãy yêu cầu gửi mã OTP mới rồi thử lại.';
    }

    if (
        normalizedMessage.includes('otp_expired')
        || normalizedMessage.includes('token has expired')
        || normalizedMessage.includes('expired or is invalid')
        || normalizedMessage.includes('invalid token')
    ) {
        return 'Mã OTP không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi mã mới rồi thử lại.';
    }

    if (
        message.includes('Failed to fetch')
        || message.includes('Load failed')
        || message.includes('NetworkError')
    ) {
        return 'Không thể kết nối tới Supabase. Kiểm tra lại project Supabase, domain API, và biến môi trường trên Vercel.';
    }

    return message || 'Đã xảy ra lỗi khi kết nối hệ thống.';
}

function getAuthRedirectUrl(path: string) {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return `${window.location.origin}${path}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string, userEmail?: string | null) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (!error && data) {
                const nextProfile = data as Profile;
                setProfile({
                    ...nextProfile,
                    role: isAdminEmail(userEmail ?? nextProfile.email) ? 'admin' : nextProfile.role,
                });
            } else {
                setProfile(null);
            }
        } catch {
            setProfile(null);
        }
    }, []);

    const ensureProfile = useCallback(async (u: User) => {
        try {
            const roleToAssign: UserRole = isAdminEmail(u.email) ? 'admin' : 'member';

            // Create profile if it doesn't exist (handles signup)
            const { data: existing } = await supabase
                .from('profiles')
                .select('id, role, email')
                .eq('id', u.id)
                .maybeSingle();

            if (!existing) {
                await supabase.from('profiles').insert({
                    id: u.id,
                    email: u.email || '',
                    display_name: u.user_metadata?.display_name || u.email?.split('@')[0] || '',
                    role: roleToAssign,
                    status: 'active',
                });
            } else if (roleToAssign === 'admin' && (existing.role as string | undefined) !== 'admin') {
                await supabase.from('profiles').update({ role: 'admin' }).eq('id', u.id);
            }
            await fetchProfile(u.id, u.email);
        } catch {
            setProfile(null);
        }
    }, [fetchProfile]);

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data: { session: s } }) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) ensureProfile(s.user);
            })
            .catch(() => {
                setSession(null);
                setUser(null);
                setProfile(null);
            })
            .finally(() => {
                setLoading(false);
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                ensureProfile(s.user);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [ensureProfile]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                return { error: formatAuthErrorMessage(error) };
            }

            return {};
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
        try {
            const emailRedirectTo = getAuthRedirectUrl('/login');
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: displayName || email.split('@')[0] },
                    emailRedirectTo,
                },
            });
            if (error) {
                if (error.message.includes('already registered')) {
                    return { error: 'Email đã được đăng ký. Hãy đăng nhập.' };
                }

                return { error: formatAuthErrorMessage(error) };
            }

            // If email confirmation is required
            if (data.user && !data.session) {
                return {
                    requiresOtp: true,
                    message: 'Mã OTP xác nhận đăng ký đã được gửi vào email. Hãy nhập mã để kích hoạt tài khoản.',
                };
            }

            return {};
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const verifySignUpOtp = useCallback(async (email: string, token: string) => {
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup',
            });

            if (error) {
                return { error: formatAuthErrorMessage(error) };
            }

            return {};
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const resendSignUpOtp = useCallback(async (email: string) => {
        try {
            const emailRedirectTo = getAuthRedirectUrl('/login');
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: { emailRedirectTo },
            });

            if (error) {
                return { error: formatAuthErrorMessage(error) };
            }

            return {
                message: 'Đã gửi lại mã OTP đăng ký. Hãy kiểm tra inbox và cả thư rác.',
            };
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const requestPasswordReset = useCallback(async (email: string) => {
        try {
            const emailRedirectTo = getAuthRedirectUrl('/reset-password');
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: emailRedirectTo });

            if (error) {
                return { error: formatAuthErrorMessage(error) };
            }

            return {
                message:
                    'Nếu email tồn tại trong hệ thống và nhà cung cấp mail cho phép gửi, bạn sẽ nhận được mã OTP đặt lại mật khẩu. Hãy kiểm tra inbox và cả thư rác.',
            };
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const resetPasswordWithOtp = useCallback(async (email: string, token: string, password: string) => {
        try {
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'recovery',
            });

            if (verifyError) {
                return { error: formatAuthErrorMessage(verifyError) };
            }

            if (verifyData.session) {
                const { error: setSessionError } = await supabase.auth.setSession({
                    access_token: verifyData.session.access_token,
                    refresh_token: verifyData.session.refresh_token,
                });

                if (setSessionError) {
                    return { error: formatAuthErrorMessage(setSessionError) };
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return {
                    error: 'Không thể tạo phiên đặt lại mật khẩu. Hãy yêu cầu gửi mã OTP mới rồi thử lại.',
                };
            }

            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                return { error: formatAuthErrorMessage(updateError) };
            }

            await supabase.auth.signOut();

            return {};
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const updatePassword = useCallback(async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                return { error: formatAuthErrorMessage(error) };
            }

            return {};
        } catch (error) {
            return { error: formatAuthErrorMessage(error) };
        }
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id);
    }, [user, fetchProfile]);

    const role = isAdminEmail(user?.email) ? 'admin' : profile?.role ?? null;

    return (
        <AuthContext.Provider value={{
            user, session, profile, role, loading,
            isAdmin: role === 'admin',
            isMember: role === 'member' || role === 'admin',
            isLoggedIn: !!user,
            signIn,
            signUp,
            verifySignUpOtp,
            resendSignUpOtp,
            requestPasswordReset,
            resetPasswordWithOtp,
            updatePassword,
            signOut,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
