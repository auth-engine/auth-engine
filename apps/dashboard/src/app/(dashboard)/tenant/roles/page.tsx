"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	CopyPlus,
	Edit,
	Loader2,
	Plus,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { Permission, Role } from "@/lib/types";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RolePayload {
	name: string;
	description: string;
	level: number;
	permissions: string[];
}

export default function TenantRolesPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		activeTenantId,
		isReady,
		isPlatformTenant,
		isLoading: isLoadingTenant,
	} = useActiveTenant();

	useEffect(() => {
		if (isReady && isPlatformTenant) {
			router.replace("/platform/roles");
		}
	}, [isReady, isPlatformTenant, router]);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deletingRole, setDeletingRole] = useState<Role | null>(null);
	const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
	const [templateRoleId, setTemplateRoleId] = useState("");
	const [clonedRoleName, setClonedRoleName] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		level: 0,
		permissions: [] as string[],
	});

	const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
		queryKey: ["tenantRoles", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<Role[]>(
				`/tenants/${activeTenantId}/roles`,
			);
			return data;
		},
		enabled: isReady && !isPlatformTenant,
	});

	const { data: permissions = [], isLoading: isLoadingPerms } = useQuery<
		Permission[]
	>({
		queryKey: ["tenantRolePermissions", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<Permission[]>(
				`/tenants/${activeTenantId}/roles/permissions`,
			);
			return data;
		},
		enabled: isReady && !isPlatformTenant,
	});

	const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<
		Role[]
	>({
		queryKey: ["tenantRoleTemplates", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<Role[]>(
				`/tenants/${activeTenantId}/roles/templates`,
			);
			return data;
		},
		enabled: isReady && !isPlatformTenant,
	});

	const availablePerms = useMemo(() => permissions, [permissions]);

	const handleOpenCreate = () => {
		setEditingRole(null);
		setFormData({ name: "", description: "", level: 0, permissions: [] });
		setIsDialogOpen(true);
	};

	const handleOpenEdit = (role: Role) => {
		setEditingRole(role);
		setFormData({
			name: role.name,
			description: role.description || "",
			level: role.level,
			permissions: role.permission_ids || [],
		});
		setIsDialogOpen(true);
	};

	const handleOpenClone = () => {
		const defaultTemplate = templates[0];
		setTemplateRoleId(defaultTemplate?.id || "");
		setClonedRoleName(defaultTemplate?.name || "");
		setIsCloneDialogOpen(true);
	};

	const saveMutation = useMutation({
		mutationFn: async (payload: RolePayload) => {
			if (editingRole) {
				const { data } = await apiClient.put(
					`/tenants/${activeTenantId}/roles/${editingRole.id}`,
					payload,
				);
				return data;
			}
			const { data } = await apiClient.post(
				`/tenants/${activeTenantId}/roles`,
				payload,
			);
			return data;
		},
		onSuccess: () => {
			toast.success(editingRole ? "Role updated!" : "Role created!");
			queryClient.invalidateQueries({
				queryKey: ["tenantRoles", activeTenantId],
			});
			setIsDialogOpen(false);
		},
		onError: (err: unknown) => {
			toast.error(getApiErrorMessage(err, "Failed to save role."));
		},
	});

	const cloneMutation = useMutation({
		mutationFn: async () => {
			const { data } = await apiClient.post(
				`/tenants/${activeTenantId}/roles/from-template`,
				{
					template_role_id: templateRoleId,
					name: clonedRoleName.trim() || undefined,
				},
			);
			return data;
		},
		onSuccess: () => {
			toast.success("Role cloned from template!");
			queryClient.invalidateQueries({
				queryKey: ["tenantRoles", activeTenantId],
			});
			setIsCloneDialogOpen(false);
		},
		onError: (err: unknown) => {
			toast.error(getApiErrorMessage(err, "Failed to clone role template."));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await apiClient.delete(`/tenants/${activeTenantId}/roles/${id}`);
		},
		onSuccess: () => {
			toast.success("Role deleted!");
			setIsDeleting(false);
			setDeletingRole(null);
			queryClient.invalidateQueries({
				queryKey: ["tenantRoles", activeTenantId],
			});
		},
		onError: (err: unknown) => {
			toast.error(getApiErrorMessage(err, "Failed to delete role."));
		},
	});

	const handleSubmit = () => {
		saveMutation.mutate({
			name: formData.name,
			description: formData.description,
			level: parseInt(formData.level.toString(), 10),
			permissions: formData.permissions,
		});
	};

	const togglePermission = (id: string, checked: boolean) => {
		setFormData((prev) => {
			if (checked) {
				return { ...prev, permissions: [...prev.permissions, id] };
			}
			return { ...prev, permissions: prev.permissions.filter((p) => p !== id) };
		});
	};

	if (isLoadingTenant || isPlatformTenant) {
		return (
			<div className="p-20 flex justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
			</div>
		);
	}

	if (!isReady) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Select an organization first.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Organization Roles
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage roles and permissions for this organization.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Dialog
							open={isCloneDialogOpen}
							onOpenChange={setIsCloneDialogOpen}
						>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									onClick={handleOpenClone}
									className="rounded-xl"
								>
									<CopyPlus className="mr-2 h-4 w-4" /> Clone Template
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[520px]">
								<DialogHeader>
									<DialogTitle>Clone role from template</DialogTitle>
									<DialogDescription>
										Start from a platform-defined template and create a
										tenant-specific copy.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-2">
									<div className="space-y-2">
										<Label htmlFor="template-role">Template role</Label>
										<select
											id="template-role"
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={templateRoleId}
											onChange={(event) => {
												setTemplateRoleId(event.target.value);
												const template = templates.find(
													(item) => item.id === event.target.value,
												);
												if (template) setClonedRoleName(template.name);
											}}
										>
											<option value="">
												{isLoadingTemplates
													? "Loading templates..."
													: templates.length === 0
														? "No templates available"
														: "Select a template"}
											</option>
											{templates.map((template) => (
												<option key={template.id} value={template.id}>
													{template.name}
													{template.description
														? ` — ${template.description}`
														: ""}
												</option>
											))}
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="cloned-role-name">New role name</Label>
										<Input
											id="cloned-role-name"
											value={clonedRoleName}
											onChange={(event) =>
												setClonedRoleName(event.target.value.toUpperCase())
											}
											placeholder="TENANT_MANAGER"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={() => cloneMutation.mutate()}
										disabled={cloneMutation.isPending || !templateRoleId}
									>
										{cloneMutation.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Clone Role
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<DialogTrigger asChild>
							<Button onClick={handleOpenCreate} className="rounded-xl">
								<Plus className="mr-2 h-4 w-4" /> Create Role
							</Button>
						</DialogTrigger>
					</div>
				</div>

				{isLoadingRoles || isLoadingPerms ? (
					<div className="flex justify-center py-20">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{roles.map((role) => (
							<Card
								key={role.id}
								className="shadow-sm border-muted flex flex-col h-full overflow-hidden min-w-0 gap-4"
							>
								<CardHeader className="pb-0 flex-none gap-3">
									<div className="flex items-center justify-between gap-2">
										<Badge
											variant="outline"
											className="text-[10px] uppercase font-bold tracking-widest"
										>
											{role.template_role_id ? "Inherited" : "Custom"}
										</Badge>
										<Badge variant="outline" className="text-[10px] shrink-0">
											Lvl {role.level}
										</Badge>
									</div>
									<CardTitle className="text-base truncate" title={role.name}>
										{role.name}
									</CardTitle>
									<CardDescription className="text-xs line-clamp-2">
										{role.description || "No description provided."}
									</CardDescription>
								</CardHeader>
								<CardContent className="pt-0 flex-grow space-y-2 min-w-0">
									<p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
										<ShieldCheck className="h-3 w-3" /> Permissions
									</p>
									<div className="flex flex-wrap gap-1">
										{!role.permissions?.length && (
											<span className="text-xs text-muted-foreground italic">
												None assigned
											</span>
										)}
										{role.permissions?.slice(0, 4).map((p) => (
											<Badge
												key={p.id}
												variant="secondary"
												className="text-[9px] px-1.5 py-0 max-w-full truncate"
											>
												{p.name}
											</Badge>
										))}
										{role.permissions && role.permissions.length > 4 && (
											<Badge variant="ghost" className="text-[9px] px-1.5 py-0">
												+{role.permissions.length - 4} more
											</Badge>
										)}
									</div>
								</CardContent>
								<div className="px-4 py-2.5 bg-muted/30 border-t border-muted flex items-center justify-end gap-1 mt-auto flex-none shrink-0">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 shrink-0"
										title="Edit role"
										onClick={() => handleOpenEdit(role)}
									>
										<Edit className="h-4 w-4" />
									</Button>
									{!role.is_protected_tenant_role && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
											title="Delete role"
											onClick={() => {
												setDeletingRole(role);
												setIsDeleting(true);
											}}
											disabled={deleteMutation.isPending}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							</Card>
						))}
						{roles.length === 0 && (
							<div className="sm:col-span-2 lg:col-span-3 py-20 text-center text-muted-foreground flex flex-col items-center">
								<AlertCircle className="h-10 w-10 mb-2 opacity-50" />
								<p>No roles found for this organization.</p>
							</div>
						)}
					</div>
				)}

				<DialogContent className="sm:max-w-[600px] max-h-[min(90vh,800px)] flex flex-col gap-0 p-0 overflow-hidden">
					<DialogHeader className="px-6 pt-6 pb-4 shrink-0">
						<DialogTitle>
							{editingRole ? "Edit Role" : "Create Role"}
						</DialogTitle>
						<DialogDescription>
							{editingRole
								? "Update this organization role and its permissions."
								: "Create a custom role for this organization."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 px-6 pb-4 overflow-y-auto flex-1 min-h-0">
						<div className="space-y-2">
							<Label htmlFor="name">
								Role Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({
										...formData,
										name: e.target.value.toUpperCase(),
									})
								}
								placeholder="e.g. BILLING_MANAGER"
								className="uppercase"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="What can this role do?"
								className="resize-none h-20"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="level">Hierarchy Level</Label>
							<Input
								id="level"
								type="number"
								value={formData.level}
								onChange={(e) =>
									setFormData({
										...formData,
										level: parseInt(e.target.value, 10) || 0,
									})
								}
								min={0}
								max={100}
							/>
						</div>

						<div className="space-y-3 pt-4 border-t">
							<Label>Map Permissions</Label>
							<div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
								{availablePerms.map((permission) => {
									const checked = formData.permissions.includes(permission.id);
									return (
										<label
											key={permission.id}
											className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
										>
											<input
												type="checkbox"
												className="mt-1"
												checked={checked}
												onChange={(event) =>
													togglePermission(permission.id, event.target.checked)
												}
											/>
											<div className="space-y-1 min-w-0">
												<p className="text-sm font-medium break-all">
													{permission.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{permission.description || "No description"}
												</p>
											</div>
										</label>
									);
								})}
							</div>
						</div>
					</div>

					<DialogFooter className="px-6 py-4 border-t shrink-0">
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={saveMutation.isPending || !formData.name.trim()}
						>
							{saveMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingRole ? "Save changes" : "Create role"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleting} onOpenChange={setIsDeleting}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle>Delete role</DialogTitle>
						<DialogDescription>
							{deletingRole
								? `Are you sure you want to delete ${deletingRole.name}? This cannot be undone.`
								: "This role will be removed permanently."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDeleting(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								deletingRole && deleteMutation.mutate(deletingRole.id)
							}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Delete role
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
