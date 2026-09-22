"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { TenantResponse, UserResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
    Check,
    ChevronsUpDown,
    Plus,
    Search,
    MoreVertical,
    Loader2,
    Trash2,
    Pencil,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

type TenantListItem = TenantResponse;

interface TenantPayload {
    name: string;
    description: string;
    type: string;
    owner_id: string;
}

export default function PlatformTenantsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingTenant, setEditingTenant] = useState<TenantListItem | null>(null);
    const [deletingTenant, setDeletingTenant] = useState<TenantListItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [newTenant, setNewTenant] = useState({
        name: "",
        description: "",
        type: "CUSTOMER",
        owner_id: ""
    });
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        type: "CUSTOMER",
        owner_id: ""
    });
    const [userSearch, setUserSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Edit user selection state
    const [editUserSearch, setEditUserSearch] = useState("");
    const [editSelectedUser, setEditSelectedUser] = useState<UserResponse | null>(null);
    const [isEditUserDropdownOpen, setIsEditUserDropdownOpen] = useState(false);

    // 1. Fetch Tenants
    const { data: tenants, isLoading } = useQuery<TenantListItem[]>({
        queryKey: ["allTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantListItem[]>("/platform/tenants");
            return data;
        },
    });

    // 2. Fetch Users for owner selection
    const { data: users } = useQuery<UserResponse[]>({
        queryKey: ["platformUsers"],
        queryFn: async () => {
            const { data } = await apiClient.get<UserResponse[]>("/platform/users");
            return data;
        },
    });

    const filteredUsers = users?.filter((u) =>
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const editFilteredUsers = users?.filter((u) =>
        u.email.toLowerCase().includes(editUserSearch.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(editUserSearch.toLowerCase()) ||
        u.username?.toLowerCase().includes(editUserSearch.toLowerCase())
    );

    // Filter tenants by search
    const filteredTenants = tenants?.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 3. Create Tenant
    const createMutation = useMutation({
        mutationFn: async (payload: TenantPayload) => {
            await apiClient.post("/platform/tenants", payload);
        },
        onSuccess: () => {
            toast.success("Organization created successfully");
            setIsAdding(false);
            setNewTenant({ name: "", description: "", type: "CUSTOMER", owner_id: "" });
            setSelectedUser(null);
            setUserSearch("");
            queryClient.invalidateQueries({ queryKey: ["allTenants"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to create organization"));
        }
    });

    // 4. Update Tenant
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: TenantPayload }) => {
            await apiClient.put(`/platform/tenants/${id}`, {
                name: payload.name,
                description: payload.description,
                owner_id: payload.owner_id,
            });
        },
        onSuccess: () => {
            toast.success("Organization updated successfully");
            setIsEditing(false);
            setEditingTenant(null);
            queryClient.invalidateQueries({ queryKey: ["allTenants"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to update organization"));
        }
    });

    // 5. Delete Tenant
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/platform/tenants/${id}`);
        },
        onSuccess: () => {
            toast.success("Organization deleted successfully");
            setIsDeleting(false);
            setDeletingTenant(null);
            queryClient.invalidateQueries({ queryKey: ["allTenants"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to delete organization"));
        }
    });

    const openDeleteDialog = (tenant: TenantListItem) => {
        setDeletingTenant(tenant);
        setIsDeleting(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants Directory</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all organizations hosted on this platform.
                    </p>
                </div>

                {/* Create Dialog */}
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-foreground/20 bg-foreground text-background hover:bg-foreground/90">
                            <Plus className="mr-2 h-4 w-4" /> New Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Tenant</DialogTitle>
                            <DialogDescription>
                                Add a new organization to your platform.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Organization Name</label>
                                <Input
                                    placeholder="Acme Corp"
                                    value={newTenant.name}
                                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    placeholder="A brief description of this organization"
                                    value={newTenant.description}
                                    onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Organization Owner</label>
                                <DropdownMenu open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal h-10">
                                            {selectedUser ? (
                                                <span className="truncate">
                                                    {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">Select a platform user...</span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[380px] p-0" align="start">
                                        <div className="p-2 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search users by name or email..."
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                    className="pl-8 h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[240px] overflow-y-auto p-1">
                                            {filteredUsers?.map((user) => (
                                                <DropdownMenuItem
                                                    key={user.id}
                                                    onSelect={() => {
                                                        setSelectedUser(user);
                                                        setNewTenant({ ...newTenant, owner_id: user.id });
                                                        setIsUserDropdownOpen(false);
                                                    }}
                                                    className="flex items-center justify-between py-2 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                            {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">
                                                                {user.first_name} {user.last_name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {user.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selectedUser?.id === user.id && (
                                                        <Check className="h-4 w-4 text-primary" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                            {filteredUsers?.length === 0 && (
                                                <div className="py-6 text-center text-xs text-muted-foreground">
                                                    No users found.
                                                </div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <p className="text-[10px] text-muted-foreground italic">
                                    The selected user will be granted the TENANT_OWNER role.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => createMutation.mutate(newTenant)}
                                disabled={createMutation.isPending || !newTenant.name || !newTenant.owner_id}
                            >
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Organization
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>
                            Update the details of this organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Organization Name</label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tenant Type</label>
                            {editingTenant?.type === "PLATFORM" ? (
                                <p className="text-sm text-muted-foreground py-2">
                                    System platform tenant (cannot be changed)
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground py-2">Customer organization</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Owner</label>
                            <DropdownMenu open={isEditUserDropdownOpen} onOpenChange={setIsEditUserDropdownOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10">
                                        {editSelectedUser ? (
                                            <span className="truncate">
                                                {editSelectedUser.first_name} {editSelectedUser.last_name} ({editSelectedUser.email})
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Select owner...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[380px] p-0" align="start">
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Search users..."
                                                value={editUserSearch}
                                                onChange={(e) => setEditUserSearch(e.target.value)}
                                                className="pl-8 h-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto p-1">
                                        {editFilteredUsers?.map((user) => (
                                            <DropdownMenuItem
                                                key={user.id}
                                                onSelect={() => {
                                                    setEditSelectedUser(user);
                                                    setEditForm({ ...editForm, owner_id: user.id });
                                                    setIsEditUserDropdownOpen(false);
                                                }}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                        {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                                                    </div>
                                                </div>
                                                {editSelectedUser?.id === user.id && <Check className="h-4 w-4 text-primary" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button
                            onClick={() => editingTenant && updateMutation.mutate({ id: editingTenant.id, payload: editForm })}
                            disabled={updateMutation.isPending || !editForm.name}
                        >
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Organization</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingTenant?.name}</strong>? This action is irreversible and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deletingTenant && deleteMutation.mutate(deletingTenant.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Organization
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tenants by name or slug..."
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
                                <TableHead>Organization</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants?.map((t) => (
                                <TableRow key={t.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{t.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{t.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px] tracking-tight">
                                            {t.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold">{t.owner?.first_name} {t.owner?.last_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{t.owner?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs font-medium">
                                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-5">
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Tenant Admin</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => router.push(`/platform/tenants/${t.id}`)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" /> View / Edit
                                                </DropdownMenuItem>
                                                {t.type !== "PLATFORM" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive cursor-pointer"
                                                            onClick={() => openDeleteDialog(t)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Tenant
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!filteredTenants || filteredTenants.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No organizations found in the platform.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
