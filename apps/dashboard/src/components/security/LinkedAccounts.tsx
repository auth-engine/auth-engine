"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { LinkedOAuthAccount } from "@/lib/types";
import { Loader2, Link2, Globe } from "lucide-react";
import { FaGoogle, FaGithub, FaMicrosoft } from "react-icons/fa";
import type { IconType } from "react-icons";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROVIDER_ICONS: Record<string, IconType> = {
    google: FaGoogle,
    github: FaGithub,
    microsoft: FaMicrosoft,
};

const PROVIDER_COLORS: Record<string, string> = {
    google: "text-red-500",
    github: "text-foreground",
    microsoft: "text-blue-600",
};

export default function LinkedAccounts() {
    const { user } = useAuthStore();

    const { data: linkedAccounts, isLoading } = useQuery<LinkedOAuthAccount[]>({
        queryKey: ["linkedOAuthAccounts"],
        queryFn: async () => {
            const { data } = await apiClient.get<LinkedOAuthAccount[]>("/auth/oauth/accounts");
            return data;
        },
        enabled: !!user,
    });

    return (
        <Card className="shadow-sm border-muted/50">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <CardTitle>Linked Accounts</CardTitle>
                </div>
                <CardDescription>Social accounts linked for quick sign-in.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : linkedAccounts && linkedAccounts.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {linkedAccounts.map((account) => {
                            const Icon = PROVIDER_ICONS[account.provider] || Globe;
                            const colorClass = PROVIDER_COLORS[account.provider] || "text-muted-foreground";
                            return (
                                <div
                                    key={account.provider}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-muted bg-muted/10"
                                >
                                    <div className="p-2 rounded-md bg-background border shrink-0">
                                        <Icon className={`h-4 w-4 ${colorClass}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold capitalize">{account.provider}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {account.email || account.provider_user_id}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] shrink-0">
                                        Connected
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">
                        No linked social accounts yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
