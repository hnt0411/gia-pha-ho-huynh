'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
    const router = useRouter();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push('/notifications')}
        >
            <Bell className="h-5 w-5" />
        </Button>
    );
}
