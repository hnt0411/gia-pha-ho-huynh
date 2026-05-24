'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine, Users, Image, Newspaper, CalendarDays, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Stats {
    people: number;
    families: number;
    profiles: number;
    posts: number;
    events: number;
    media: number;
}

export default function HomePage() {
    const [stats, setStats] = useState<Stats>({ people: 0, families: 0, profiles: 0, posts: 0, events: 0, media: 0 });
    const [loading, setLoading] = useState(true);
    const optionalEnabled = process.env.NEXT_PUBLIC_ENABLE_OPTIONAL_TABLES === 'true';

    useEffect(() => {
        async function fetchStats() {
            try {
                const tables = optionalEnabled
                    ? ['people', 'families', 'profiles', 'posts', 'events', 'media']
                    : ['people', 'families', 'profiles'];
                const counts: Record<string, number> = {};
                for (const t of tables) {
                    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
                    counts[t] = count || 0;
                }
                setStats({
                    people: counts.people ?? 0,
                    families: counts.families ?? 0,
                    profiles: counts.profiles ?? 0,
                    posts: counts.posts ?? 0,
                    events: counts.events ?? 0,
                    media: counts.media ?? 0,
                });
            } catch { /* ignore */ }
            finally { setLoading(false); }
        }
        fetchStats();
    }, []);

    const cards = [
        { title: 'Thành viên gia phả', icon: TreePine, value: stats.people, desc: 'Trong cơ sở dữ liệu', href: '/tree' },
        { title: 'Dòng họ (families)', icon: Users, value: stats.families, desc: 'Gia đình đã ghi nhận', href: '/tree' },
        { title: 'Tài khoản', icon: Users, value: stats.profiles, desc: 'Người dùng đã đăng ký', href: '/directory' },
        { title: 'Bài viết', icon: Newspaper, value: stats.posts, desc: 'Bảng tin dòng họ', href: '/feed' },
        { title: 'Sự kiện', icon: CalendarDays, value: stats.events, desc: 'Hoạt động sắp tới', href: '/events' },
        { title: 'Tư liệu', icon: Image, value: stats.media, desc: 'Ảnh & tài liệu', href: '/media' },
    ];

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur sm:p-7">
                <h1 className="text-3xl font-bold tracking-tight">Trang chủ</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Chào mừng đến với Gia phả dòng họ Huỳnh. Bạn có thể xem nhanh số liệu, đi tới cây gia phả,
                    bảng tin, sự kiện và sách gia phả ngay từ đây.
                </p>
            </section>

            <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(c => (
                    <Link key={c.title} href={c.href} className="block h-full">
                        <Card className="h-full cursor-pointer rounded-2xl border-border/70 bg-card/88 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                                <c.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : c.value}</div>
                                <p className="text-xs text-muted-foreground">{c.desc}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card className="rounded-3xl border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle>Bắt đầu nhanh</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/tree"><Button variant="outline" className="rounded-xl"><TreePine className="mr-2 h-4 w-4" />Xem cây gia phả</Button></Link>
                        <Link href="/feed"><Button variant="outline" className="rounded-xl"><Newspaper className="mr-2 h-4 w-4" />Bảng tin</Button></Link>
                        <Link href="/events"><Button variant="outline" className="rounded-xl"><CalendarDays className="mr-2 h-4 w-4" />Sự kiện</Button></Link>
                        <Link href="/book"><Button variant="outline" className="rounded-xl"><BookOpen className="mr-2 h-4 w-4" />Sách gia phả</Button></Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
