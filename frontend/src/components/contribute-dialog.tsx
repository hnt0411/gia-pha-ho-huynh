'use client';

type ContributeDialogProps = {
    personHandle: string;
    personName: string;
    onClose: () => void;
};

export function ContributeDialog({ onClose }: ContributeDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-md rounded-lg bg-card p-6">
                <div className="text-lg font-semibold">Đóng góp thông tin</div>
                <div className="mt-2 text-sm text-muted-foreground">
                    Tính năng đang được phát triển.
                </div>
                <div className="mt-4 flex justify-end">
                    <button className="rounded-md border px-3 py-2 text-sm" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
