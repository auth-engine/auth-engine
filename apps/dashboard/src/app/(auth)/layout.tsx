import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -left-32 bottom-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
            />
            <div className="absolute right-4 top-4 z-50">
                <ThemeToggle />
            </div>
            {children}
        </div>
    );
}
