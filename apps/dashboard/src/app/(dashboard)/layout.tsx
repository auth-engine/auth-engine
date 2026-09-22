"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LogOut,
    Settings,
    User,
    ShieldCheck,
    Building,
    Computer,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TenantSelector } from "@/components/auth/tenant-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const hasPlatformScope =
        user?.roles?.some((assignment) => assignment.role.scope === "PLATFORM") ?? false;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return "U";
    };

    return (
        <AuthGuard>
            <div className="flex min-h-screen flex-col bg-background">
                {/* Top Navbar */}
                <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight hidden sm:inline-block">Auth Engine</span>
                        </div>

                        <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

                        <TenantSelector />
                    </div>

                    <div className="flex flex-1 items-center justify-end gap-4">
                        {/* Top Navigation Links */}
                        <nav className="hidden md:flex items-center gap-6 mr-4 text-sm font-medium">
                            <Link href="/tenant" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                <Building className="h-4 w-4" /> Tenant
                            </Link>
                            {hasPlatformScope && (
                                <Link
                                    href="/platform"
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                >
                                    <Computer className="h-4 w-4" /> Platform
                                </Link>
                            )}
                        </nav>

                        <ThemeToggle />

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user?.avatar_url || "https://avatar.vercel.sh/user"} alt={user?.email || "User avatar"} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(user?.first_name || user?.username, user?.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/me" className="cursor-pointer w-full flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/me/security" className="cursor-pointer w-full flex items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content Areas */}
                <main className="flex-1 bg-muted/30">
                    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
