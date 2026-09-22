"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
	LineChart,
	Building2,
	Users2,
	ShieldAlert,
	ScrollText,
	ChevronRight,
	Key,
	Inbox,
	Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";

const navItems = [
	{
		title: "Platform Overview",
		href: "/platform",
		icon: LineChart,
	},
	{
		title: "Tenants Directory",
		href: "/platform/tenants",
		icon: Building2,
	},
	{
		title: "Global Users",
		href: "/platform/users",
		icon: Users2,
	},
	{
		title: "System Roles",
		href: "/platform/roles",
		icon: ShieldAlert,
	},
	{
		title: "Service Keys",
		href: "/platform/service-keys",
		icon: Key,
	},
	{
		title: "OIDC Clients",
		href: "/platform/oidc-clients",
		icon: Fingerprint,
	},
	{
		title: "Contact Leads",
		href: "/platform/leads",
		icon: Inbox,
	},
	{
		title: "Audit Explorer",
		href: "/platform/audit",
		icon: ScrollText,
	},
];

export default function PlatformLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const { user } = useAuthStore();

	const hasPlatformScope =
		user?.roles?.some((assignment) => assignment.role.scope === "PLATFORM") ??
		false;
	const canManageOidcClients =
		user?.roles?.some((assignment) =>
			assignment.role.permissions?.some(
				(permission) => permission.name === "platform.tenants.manage",
			),
		) ?? false;
	const visibleNavItems = navItems.filter(
		(item) => item.href !== "/platform/oidc-clients" || canManageOidcClients,
	);

	useEffect(() => {
		if (!hasPlatformScope) {
			router.replace("/tenant");
			return;
		}

		if (
			pathname.startsWith("/platform/oidc-clients") &&
			!canManageOidcClients
		) {
			router.replace("/platform");
		}
	}, [canManageOidcClients, hasPlatformScope, pathname, router]);

	return (
		<div className="flex flex-col md:flex-row gap-8">
			{/* Sidebar Navigation */}
			<aside className="w-full md:w-64 shrink-0">
				<div className="mb-4 px-4">
					<Badge
						variant="outline"
						className="bg-primary/5 text-primary border-primary/20 uppercase tracking-tighter text-[10px] font-bold"
					>
						Super Admin Console
					</Badge>
				</div>
				<nav className="space-y-1">
					{visibleNavItems.map((item) => {
						const isActive =
							pathname === item.href ||
							(item.href !== "/platform" && pathname.startsWith(item.href));
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
									isActive
										? "bg-foreground text-background shadow-lg"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<item.icon
									className={cn(
										"h-4 w-4",
										isActive ? "text-background" : "text-muted-foreground",
									)}
								/>
								{item.title}
								{isActive && (
									<ChevronRight className="ml-auto h-4 w-4 opacity-70" />
								)}
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* Content Area */}
			<div className="flex-1 min-w-0">
				<div className="animate-in fade-in slide-in-from-left-4 duration-500">
					{children}
				</div>
			</div>
		</div>
	);
}
