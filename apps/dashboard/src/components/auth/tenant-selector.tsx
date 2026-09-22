"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
    Building,
    Check,
    ChevronsUpDown,
    Plus,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TenantSelector() {
    const { user, activeTenantId, setActiveTenantId } = useAuthStore();

    const { data: tenants, isLoading } = useQuery({
        queryKey: ["myTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get("/me/tenants");
            return data;
        },
    });

    const hasPlatformScope =
        user?.roles?.some((r: { role: { scope: string } }) => r.role.scope === "PLATFORM") ?? false;

    useEffect(() => {
        if (!tenants?.length) return;
        const currentInList = tenants.some((t: { id: string }) => t.id === activeTenantId);
        if (!activeTenantId || !currentInList) {
            setActiveTenantId(tenants[0].id);
        }
    }, [tenants, activeTenantId, setActiveTenantId]);

    const activeTenant = tenants?.find((t: { id: string }) => t.id === activeTenantId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-[200px] justify-between h-9 border-muted-foreground/20 hover:bg-accent/50 group"
                    disabled={isLoading}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-primary/10 p-1 rounded-md group-hover:bg-primary/20">
                            <Building className="h-4 w-4 text-primary" />
                        </div>
                        <span className="truncate text-xs font-semibold">
                            {isLoading ? "Loading..." : activeTenant?.name ?? "Select organization"}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px]" align="start">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Organization
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {tenants?.length === 0 && (
                    <DropdownMenuItem disabled>
                        <span className="text-xs italic">No organizations found</span>
                    </DropdownMenuItem>
                )}

                {tenants?.map((tenant: { id: string; name: string }) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => setActiveTenantId(tenant.id)}
                        className="flex items-center justify-between cursor-pointer py-2"
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "p-1 rounded bg-muted",
                                activeTenantId === tenant.id && "bg-primary/10"
                            )}>
                                <Building className={cn(
                                    "h-3 w-3 text-muted-foreground",
                                    activeTenantId === tenant.id && "text-primary"
                                )} />
                            </div>
                            <span className={cn(
                                "text-sm",
                                activeTenantId === tenant.id && "font-semibold text-foreground"
                            )}>
                                {tenant.name}
                            </span>
                        </div>
                        {activeTenantId === tenant.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}

                {hasPlatformScope && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                href="/platform/tenants"
                                className="cursor-pointer py-2 flex items-center gap-2"
                            >
                                <div className="p-1 rounded bg-muted">
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <span className="text-sm">Create New Organization</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
