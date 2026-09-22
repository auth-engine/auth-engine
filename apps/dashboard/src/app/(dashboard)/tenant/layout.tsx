"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Users,
    Settings,
    ChevronRight,
    ShieldCheck,
    Mail,
    Globe,
    ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    {
        title: "Overview",
        href: "/tenant",
        icon: BarChart3,
    },
    {
        title: "User Management",
        href: "/tenant/users",
        icon: Users,
    },
    {
        title: "Group Policies",
        href: "/tenant/roles",
        icon: ShieldCheck,
    },
    {
        title: "Auth Configuration",
        href: "/tenant/settings",
        icon: Settings,
    },
    {
        title: "Social Login",
        href: "/tenant/social",
        icon: Globe,
    },
    {
        title: "Email & SMS",
        href: "/tenant/communications",
        icon: Mail,
    },
    {
        title: "Activity Log",
        href: "/tenant/audit",
        icon: ScrollText,
    },
];

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                                {item.title}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    {children}
                </div>
            </div>
        </div>
    );
}
