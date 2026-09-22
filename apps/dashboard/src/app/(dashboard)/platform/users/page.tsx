"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { UserResponse } from "@/lib/types";
import {
    Search,
    MoreVertical,
    ShieldCheck,
    Loader2,
    UserCheck,
    UserX,
    Eye,
    Trash2
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function PlatformUsersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

    // 1. Fetch Users
    const { data: users, isLoading } = useQuery<UserResponse[]>({
        queryKey: ["allUsers"],
        queryFn: async () => {
            const { data } = await apiClient.get<UserResponse[]>("/platform/users");
            return data;
        },
    });

    // Update user status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
            await apiClient.patch(`/platform/users/${userId}`, { status });
        },
        onSuccess: () => {
            toast.success("User status updated");
            queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to update status"));
        },
    });

    // Delete user
    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiClient.delete(`/platform/users/${userId}`);
        },
        onSuccess: () => {
            toast.success("User deleted");
            queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to delete user"));
        },
    });

    const filteredUsers = users?.filter((u) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Global Users</h1>
                <p className="text-muted-foreground mt-1">
                    All registered accounts across all organizations.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users by email or ID..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="shadow-sm border-muted overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>User Account</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>MFA</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers?.map((u) => (
                                <TableRow
                                    key={u.id}
                                    className="group transition-colors cursor-pointer"
                                    onClick={() => router.push(`/platform/users/${u.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold border border-foreground/5 shadow-inner">
                                                {u.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{u.email}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{u.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px] h-5">
                                            {u.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs font-medium">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {u.mfa_enabled ? (
                                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 text-[10px] h-5">
                                                <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground border-muted text-[10px] h-5 font-normal">
                                                Disabled
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Account Control</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => router.push(`/platform/users/${u.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                {u.status === "ACTIVE" ? (
                                                    <DropdownMenuItem
                                                        className="text-destructive cursor-pointer"
                                                        onClick={() => updateStatusMutation.mutate({ userId: u.id, status: "SUSPENDED" })}
                                                    >
                                                        <UserX className="h-4 w-4 mr-2" /> Suspend Account
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => updateStatusMutation.mutate({ userId: u.id, status: "ACTIVE" })}
                                                    >
                                                        <UserCheck className="h-4 w-4 mr-2" /> Activate Account
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-destructive cursor-pointer"
                                                    onClick={() =>
                                                        setDeleteTarget({ id: u.id, email: u.email })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!filteredUsers || filteredUsers.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete user?"
                description={
                    deleteTarget
                        ? `${deleteTarget.email} will be permanently deleted. This cannot be undone.`
                        : undefined
                }
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteMutation.mutate(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
            />
        </div>
    );
}
