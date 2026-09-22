"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { TenantResponse } from "@/lib/types";
import { Building2, Users2, Activity } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlatformOverviewPage() {
    const { data: tenants } = useQuery<TenantResponse[]>({
        queryKey: ["allTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantResponse[]>("/platform/tenants");
            return data;
        },
    });

    const { data: users } = useQuery({
        queryKey: ["allUsers"],
        queryFn: async () => {
            const { data } = await apiClient.get("/platform/users");
            return data;
        },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Global state of the AuthEngine instance.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-muted shadow-sm group hover:border-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{tenants?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-muted shadow-sm group hover:border-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Global Users</CardTitle>
                        <Users2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{users?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-muted shadow-sm group hover:border-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </CardHeader>
                    <CardContent />
                </Card>

                <Card className="border-muted shadow-sm group hover:border-primary/20 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Storage Used</CardTitle>
                    </CardHeader>
                    <CardContent />
                </Card>
            </div>

            {/* Recent Tenants */}
            <Card className="border-muted shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Recent Tenants
                        </CardTitle>
                        <CardDescription>Latest organizations onboarded to the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tenants?.slice(0, 5).map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-muted">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center font-bold text-primary shadow-sm">
                                            {t.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{t.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground">{t.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="text-[10px] h-5 mb-1">Active</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
        </div>
    );
}
