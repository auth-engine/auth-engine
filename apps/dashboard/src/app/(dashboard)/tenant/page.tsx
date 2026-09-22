"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { TenantAuthConfig, TenantResponse, UserResponse } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import {
    Users,
    ShieldCheck,
    UserPlus,
    ArrowUpRight,
    Clock,
    Key
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TenantDashboard() {
    const { activeTenantId } = useAuthStore();

    // 1. Fetch Tenant Details
    const { data: tenant } = useQuery<TenantResponse | null>({
        queryKey: ["tenantDetails", activeTenantId],
        queryFn: async () => {
            if (!activeTenantId) return null;
            const { data } = await apiClient.get<TenantResponse[]>("/me/tenants");
            return data.find((t) => t.id === activeTenantId) ?? null;
        },
        enabled: !!activeTenantId,
    });

    const { data: users } = useQuery<UserResponse[]>({
        queryKey: ["tenantUsers", activeTenantId],
        queryFn: async () => {
            if (!activeTenantId) return [];
            const { data } = await apiClient.get<UserResponse[]>(`/tenants/${activeTenantId}/users`);
            return data;
        },
        enabled: !!activeTenantId,
    });

    const { data: authConfig } = useQuery<TenantAuthConfig | null>({
        queryKey: ["tenantAuthConfig", activeTenantId],
        queryFn: async () => {
            if (!activeTenantId) return null;
            const { data } = await apiClient.get<TenantAuthConfig>(`/tenants/${activeTenantId}/auth-config`);
            return data;
        },
        enabled: !!activeTenantId,
    });

    if (!activeTenantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 border-2 border-dashed rounded-3xl bg-muted/20">
                <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h2 className="text-xl font-bold">No Organization Selected</h2>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Please use the organization selector in the header to manage your team and configuration.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenant?.name || "Loading..."}</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your organization, team members, and security settings.
                    </p>
                </div>
                <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
                    <Link href="/tenant/users">
                        <UserPlus className="mr-2 h-4 w-4" /> Invite User
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-muted transition-all hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active members in this tenant
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted transition-all hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auth Methods</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{authConfig?.allowed_methods?.length || 0}</div>
                        <div className="flex gap-1 mt-1">
                            {authConfig?.allowed_methods?.slice(0, 2).map((m: string) => (
                                <Badge key={m} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                    {m.replace('_', ' ')}
                                </Badge>
                            ))}
                            {(authConfig?.allowed_methods?.length ?? 0) > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{(authConfig?.allowed_methods?.length ?? 0) - 2}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted transition-all hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Session TTL</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {authConfig?.session_ttl_seconds ? `${Math.floor(authConfig.session_ttl_seconds / 3600)}h` : "24h"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Default session duration
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted transition-all hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MFA Policy</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {authConfig?.mfa_required ? "Strict" : "Flexible"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {authConfig?.mfa_required ? "MFA is mandatory" : "MFA is optional"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Users List */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Recent Users</span>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/tenant/users" className="text-xs">
                                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardTitle>
                        <CardDescription>Latest members added to your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users?.slice(0, 5).map((user) => (
                                <div key={user.id} className="flex items-center justify-between border-b border-muted pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{user.email}</p>
                                            <p className="text-[10px] text-muted-foreground">{user.status}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </Badge>
                                </div>
                            ))}
                            {(!users || users.length === 0) && (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No users found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Configuration Quick Look */}
                <Card className="shadow-sm bg-primary/[0.02]">
                    <CardHeader>
                        <CardTitle>Configuration Overview</CardTitle>
                        <CardDescription>Current security and access policies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Allowed Domains</span>
                                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                    {authConfig?.allowed_domains?.map((d: string) => (
                                        <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                                    ))}
                                    {(!authConfig?.allowed_domains || authConfig.allowed_domains.length === 0) && (
                                        <span className="text-xs italic text-muted-foreground">Any</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">OIDC Client ID</span>
                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded truncate max-w-[150px]">
                                    {authConfig?.oidc_client_id || "None"}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/tenant/settings">
                                Edit All Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
