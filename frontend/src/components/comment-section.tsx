'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CommentSection({ personHandle }: { personHandle: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Bình luận</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                Chưa có bình luận cho {personHandle}.
            </CardContent>
        </Card>
    );
}
