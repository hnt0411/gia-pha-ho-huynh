import { Suspense } from 'react';
import TreeViewPage from './tree-client';

export default function TreePage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải...</div>}>
            <TreeViewPage />
        </Suspense>
    );
}
