export function LoginFormSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-3">
                <div className="h-4 w-12 rounded bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
            </div>
            <div className="space-y-3">
                <div className="mx-auto h-3 w-24 rounded bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
            </div>
            <div className="space-y-3">
                <div className="mx-auto h-3 w-28 rounded bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
                <div className="h-11 w-full rounded-md bg-muted" />
            </div>
        </div>
    );
}
