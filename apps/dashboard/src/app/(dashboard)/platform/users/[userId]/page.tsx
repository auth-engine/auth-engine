"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { Role, TenantResponse, UserResponse } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
    ArrowLeft,
    Loader2,
    Mail,
    ShieldCheck,
    Calendar,
    Clock,
    Shield,
    Trash2,
    UserCheck,
    Plus,
    X
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

type RemoveRoleTarget =
    | { scope: "platform"; roleName: string }
    | { scope: "tenant"; roleName: string; roleId: string; tenantId: string; tenantName: string };

export default function PlatformUserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAssignPlatformRoleOpen, setIsAssignPlatformRoleOpen] = useState(false);
    const [isAssignTenantRoleOpen, setIsAssignTenantRoleOpen] = useState(false);
    const [selectedPlatformRoleId, setSelectedPlatformRoleId] = useState("");
    const [selectedTenantId, setSelectedTenantId] = useState("");
    const [selectedTenantRoleId, setSelectedTenantRoleId] = useState("");
    const [removeRoleTarget, setRemoveRoleTarget] = useState<RemoveRoleTarget | null>(null);

    // Fetch user details
    const { data: user, isLoading } = useQuery<UserResponse>({
        queryKey: ["platformUser", userId],
        queryFn: async () => {
            const { data } = await apiClient.get<UserResponse>(`/platform/users/${userId}`);
            return data;
        },
        enabled: !!userId,
    });

    // Fetch platform roles only (not tenant templates)
    const { data: platformRoles = [] } = useQuery<Role[]>({
        queryKey: ["platformRoles"],
        queryFn: async () => {
            const { data } = await apiClient.get<Role[]>("/platform/roles?scope=PLATFORM");
            return data;
        },
    });

    const { data: tenants = [] } = useQuery<TenantResponse[]>({
        queryKey: ["platformTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantResponse[]>("/platform/tenants");
            return data.filter((t) => t.type !== "PLATFORM");
        },
    });

    const { data: tenantRoles = [], isLoading: isLoadingTenantRoles } = useQuery<Role[]>({
        queryKey: ["platformTenantRoles", selectedTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<Role[]>(`/platform/tenants/${selectedTenantId}/roles`);
            return data;
        },
        enabled: !!selectedTenantId,
    });

    const tenantNameById = useMemo(
        () => Object.fromEntries(tenants.map((t) => [t.id, t.name])),
        [tenants]
    );

    // Update user status
    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await apiClient.patch(`/platform/users/${userId}`, { status });
        },
        onSuccess: () => {
            toast.success("User status updated");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
            queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to update user status"));
        },
    });

    // Delete user
    const deleteMutation = useMutation({
        mutationFn: async () => {
            await apiClient.delete(`/platform/users/${userId}`);
        },
        onSuccess: () => {
            toast.success("User deleted successfully");
            router.push("/platform/users");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to delete user"));
        },
    });

    // Assign platform role
    const assignPlatformRoleMutation = useMutation({
        mutationFn: async (roleId: string) => {
            const role = platformRoles.find((r) => r.id === roleId);
            await apiClient.post(`/platform/users/${userId}/roles`, {
                role_id: roleId,
                role_name: role?.name,
            });
        },
        onSuccess: () => {
            toast.success("Platform role assigned");
            setIsAssignPlatformRoleOpen(false);
            setSelectedPlatformRoleId("");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to assign platform role"));
        },
    });

    // Assign tenant role
    const assignTenantRoleMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/platform/users/${userId}/tenant-roles`, {
                tenant_id: selectedTenantId,
                role_id: selectedTenantRoleId,
            });
        },
        onSuccess: () => {
            toast.success("Tenant role assigned");
            setIsAssignTenantRoleOpen(false);
            setSelectedTenantId("");
            setSelectedTenantRoleId("");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to assign tenant role"));
        },
    });

    // Remove platform role
    const removePlatformRoleMutation = useMutation({
        mutationFn: async (roleName: string) => {
            await apiClient.delete(`/platform/users/${userId}/roles/${roleName}`);
        },
        onSuccess: () => {
            toast.success("Platform role removed");
            setRemoveRoleTarget(null);
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to remove platform role"));
        },
    });

    // Remove tenant role
    const removeTenantRoleMutation = useMutation({
        mutationFn: async ({ tenantId, roleId }: { tenantId: string; roleId: string }) => {
            await apiClient.delete(`/platform/users/${userId}/tenant-roles`, {
                params: { tenant_id: tenantId, role_id: roleId },
            });
        },
        onSuccess: () => {
            toast.success("Tenant role removed");
            setRemoveRoleTarget(null);
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to remove tenant role"));
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">User not found.</p>
                <Button variant="outline" className="mt-4" asChild>
                    <Link href="/platform/users">Back to Users</Link>
                </Button>
            </div>
        );
    }

    const statusOptions = ["ACTIVE", "INACTIVE", "SUSPENDED"];

    const userPlatformRoles = user.roles?.filter((r) => r.role?.scope === "PLATFORM") || [];
    const userTenantRoles = user.roles?.filter((r) => r.role?.scope === "TENANT") || [];
    const assignedPlatformRoleIds = new Set(userPlatformRoles.map((r) => r.role?.id));
    const assignedTenantRoleKeys = new Set(
        userTenantRoles.map((r) => `${r.tenant_id}:${r.role?.id}`)
    );
    const availablePlatformRoles = platformRoles.filter((r) => !assignedPlatformRoleIds.has(r.id));
    const availableTenantRoles = tenantRoles.filter(
        (r) => !assignedTenantRoleKeys.has(`${selectedTenantId}:${r.id}`)
    );

    const handleConfirmRemoveRole = () => {
        if (!removeRoleTarget) return;
        if (removeRoleTarget.scope === "platform") {
            removePlatformRoleMutation.mutate(removeRoleTarget.roleName);
        } else {
            removeTenantRoleMutation.mutate({
                tenantId: removeRoleTarget.tenantId,
                roleId: removeRoleTarget.roleId,
            });
        }
    };

    const isRemoveRolePending =
        removePlatformRoleMutation.isPending || removeTenantRoleMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/platform/users">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {user.first_name || user.last_name
                                    ? `${user.first_name || ""} ${user.last_name || ""}`
                                    : user.email}
                            </h1>
                            <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Change Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statusOptions.map((status) => (
                                <DropdownMenuItem
                                    key={status}
                                    onClick={() => updateStatusMutation.mutate(status)}
                                    className="cursor-pointer"
                                    disabled={user.status === status}
                                >
                                    <Badge
                                        variant={status === "ACTIVE" ? "default" : "secondary"}
                                        className="text-[10px] mr-2"
                                    >
                                        {status}
                                    </Badge>
                                    {user.status === status && <span className="text-xs text-muted-foreground ml-2">(current)</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User Account</DialogTitle>
                                <DialogDescription>
                                    This action is irreversible. All data associated with <strong>{user.email}</strong> will be permanently removed.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete permanently
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Profile */}
                <Card className="lg:col-span-2 shadow-sm border-muted overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            User Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account ID</span>
                                <p className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">{user.id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
                                <p className="text-sm font-medium">{user.username || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                                <div>
                                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MFA</span>
                                <div>
                                    {user.mfa_enabled ? (
                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                                            <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-muted">
                                            Disabled
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{user.email}</p>
                                    {user.is_email_verified ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                            Unverified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{user.phone_number || "Not provided"}</p>
                                    {user.phone_number && (
                                        user.is_phone_verified ? (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                                Unverified
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Login</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Authentication Strategies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {user.auth_strategies?.map((s: string) => (
                                    <Badge key={s} variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-primary/10">
                                        {s.replace("_", " ").toUpperCase()}
                                    </Badge>
                                ))}
                                {(!user.auth_strategies || user.auth_strategies.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic">No auth strategies recorded.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Roles Card */}
                <Card className="shadow-sm border-muted overflow-hidden h-fit">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Platform Roles
                            </CardTitle>
                            <Dialog open={isAssignPlatformRoleOpen} onOpenChange={setIsAssignPlatformRoleOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Assign
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign Platform Role</DialogTitle>
                                        <DialogDescription>
                                            Select a platform-level role for {user.email}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-4">
                                        {availablePlatformRoles.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                All platform roles are already assigned.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availablePlatformRoles.map((role) => (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => setSelectedPlatformRoleId(role.id)}
                                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPlatformRoleId === role.id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-muted hover:border-primary/30"
                                                            }`}
                                                    >
                                                        <p className="text-sm font-semibold">{role.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {role.description || "No description"}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => assignPlatformRoleMutation.mutate(selectedPlatformRoleId)}
                                            disabled={!selectedPlatformRoleId || assignPlatformRoleMutation.isPending}
                                        >
                                            {assignPlatformRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Assign Role
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {userPlatformRoles.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-6">No platform roles assigned.</p>
                        ) : (
                            userPlatformRoles.map((ra, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/10 group hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Shield className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{ra.role.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{ra.role.description}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                        onClick={() =>
                                            setRemoveRoleTarget({
                                                scope: "platform",
                                                roleName: ra.role.name,
                                            })
                                        }
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Tenant Roles */}
                <Card className="lg:col-span-3 shadow-sm border-muted overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Tenant Roles</CardTitle>
                                <CardDescription>Roles assigned within specific organizations</CardDescription>
                            </div>
                            <Dialog open={isAssignTenantRoleOpen} onOpenChange={setIsAssignTenantRoleOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Assign
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign Tenant Role</DialogTitle>
                                        <DialogDescription>
                                            Choose an organization and role to assign to {user.email}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="tenant-select">Organization</Label>
                                            <select
                                                id="tenant-select"
                                                value={selectedTenantId}
                                                onChange={(e) => {
                                                    setSelectedTenantId(e.target.value);
                                                    setSelectedTenantRoleId("");
                                                }}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            >
                                                <option value="">Select organization...</option>
                                                {tenants.map((tenant) => (
                                                    <option key={tenant.id} value={tenant.id}>
                                                        {tenant.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tenant-role-select">Role</Label>
                                            <select
                                                id="tenant-role-select"
                                                value={selectedTenantRoleId}
                                                onChange={(e) => setSelectedTenantRoleId(e.target.value)}
                                                disabled={!selectedTenantId || isLoadingTenantRoles}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    {isLoadingTenantRoles
                                                        ? "Loading roles..."
                                                        : "Select role..."}
                                                </option>
                                                {availableTenantRoles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                        {role.description ? ` — ${role.description}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedTenantId && !isLoadingTenantRoles && availableTenantRoles.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    No additional roles available in this organization.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => assignTenantRoleMutation.mutate()}
                                            disabled={
                                                !selectedTenantId ||
                                                !selectedTenantRoleId ||
                                                assignTenantRoleMutation.isPending
                                            }
                                        >
                                            {assignTenantRoleMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Assign Role
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {userTenantRoles.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-6">
                                No tenant roles assigned.
                            </p>
                        ) : (
                            <div className="divide-y divide-muted/50">
                                {userTenantRoles.map((ra, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{ra.role.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {ra.role.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">
                                                {tenantNameById[ra.tenant_id ?? ""] || ra.tenant_id?.slice(0, 8)}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    setRemoveRoleTarget({
                                                        scope: "tenant",
                                                        roleName: ra.role.name,
                                                        roleId: ra.role.id,
                                                        tenantId: ra.tenant_id!,
                                                        tenantName:
                                                            tenantNameById[ra.tenant_id ?? ""] ||
                                                            "this organization",
                                                    })
                                                }
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!removeRoleTarget} onOpenChange={(open) => !open && setRemoveRoleTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Role</DialogTitle>
                        <DialogDescription>
                            {removeRoleTarget?.scope === "platform" ? (
                                <>
                                    Are you sure you want to remove the platform role{" "}
                                    <strong>{removeRoleTarget.roleName}</strong> from{" "}
                                    <strong>{user.email}</strong>?
                                </>
                            ) : removeRoleTarget?.scope === "tenant" ? (
                                <>
                                    Are you sure you want to remove{" "}
                                    <strong>{removeRoleTarget.roleName}</strong> from{" "}
                                    <strong>{user.email}</strong> in{" "}
                                    <strong>{removeRoleTarget.tenantName}</strong>?
                                </>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRemoveRoleTarget(null)}
                            disabled={isRemoveRolePending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmRemoveRole}
                            disabled={isRemoveRolePending}
                        >
                            {isRemoveRolePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Remove Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
