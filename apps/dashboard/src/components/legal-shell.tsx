import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function LegalShell({
    title,
    updated,
    children,
}: {
    title: string;
    updated: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-4 sm:px-8">
                <div className="container mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="inline-flex items-center justify-center rounded-lg p-1 dark:bg-white/95">
                            <Image src="/squarelogo.png" alt="AuthEngine" width={500} height={500} className="h-8 w-8" />
                        </span>
                        <span className="font-extrabold text-lg tracking-tight">AuthEngine</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Home
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="container mx-auto max-w-3xl px-4 py-16">
                    <h1 className="text-4xl font-black tracking-tight">{title}</h1>
                    <p className="text-sm text-muted-foreground mt-3">Last updated: {updated}</p>
                    <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:mt-2 [&_li]:marker:text-primary [&_strong]:text-foreground">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="border-t border-border/40 py-8">
                <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>© 2026 AuthEngine. Open-source identity.</span>
                    <nav className="flex gap-6">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
