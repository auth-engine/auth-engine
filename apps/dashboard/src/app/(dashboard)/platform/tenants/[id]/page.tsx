"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Calendar,
	Clock,
	Loader2,
	Pencil,
	Search,
	User,
} from "lucide-react";
import { toast } from "sonner";

import { AuditLogDetailsDialog } from "@/components/audit/audit-log-details-dialog";
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
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { normalizeAuditLogs } from "@/lib/audit";
import { getApiErrorMessage } from "@/lib/errors";
import { AuditLogEntry, TenantResponse, UserResponse } from "@/lib/types";

interface TenantPayload {
	name: string;
	description: string;
	type: string;
	owner_id: string;
}

export default function TenantDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const [ownerSearch, setOwnerSearch] = useState("");
	const [selectedOwner, setSelectedOwner] = useState<UserResponse | null>(null);
	const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
	const [selectedAuditLog, setSelectedAuditLog] =
		useState<AuditLogEntry | null>(null);
	const [isAuditDetailsOpen, setIsAuditDetailsOpen] = useState(false);
	const [auditSearch, setAuditSearch] = useState("");
	const [form, setForm] = useState<TenantPayload>({
		name: "",
		description: "",
		type: "",
		owner_id: "",
	});

	const { data: tenant, isLoading } = useQuery<TenantResponse>({
		queryKey: ["tenant", params.id],
		queryFn: async () => {
			const { data } = await apiClient.get<TenantResponse>(
				`/platform/tenants/${params.id}`,
			);
			return data;
		},
		enabled: !!params.id,
	});

	const { data: users } = useQuery<UserResponse[]>({
		queryKey: ["platformUsers"],
		queryFn: async () => {
			const { data } = await apiClient.get<UserResponse[]>("/platform/users");
			return data;
		},
	});

	const { data: auditLogs = [], isLoading: isLoadingAudit } = useQuery<
		AuditLogEntry[]
	>({
		queryKey: ["platformTenantAudit", params.id],
		queryFn: async () => {
			const { data } = await apiClient.get<AuditLogEntry[]>(
				`/platform/tenants/${params.id}/audit-logs`,
			);
			return normalizeAuditLogs(data);
		},
		enabled: !!params.id,
	});

	const filteredOwners = useMemo(
		() =>
			users?.filter(
				(u) =>
					u.email.toLowerCase().includes(ownerSearch.toLowerCase()) ||
					`${u.first_name} ${u.last_name}`
						.toLowerCase()
						.includes(ownerSearch.toLowerCase()),
			),
		[users, ownerSearch],
	);

	const filteredAuditLogs = useMemo(() => {
		const term = auditSearch.trim().toLowerCase();
		if (!term) return auditLogs;
		return auditLogs.filter(
			(log) =>
				log.action?.toLowerCase().includes(term) ||
				log.actor_id?.toLowerCase().includes(term) ||
				log.resource?.toLowerCase().includes(term) ||
				log.resource_id?.toLowerCase().includes(term) ||
				log.status?.toLowerCase().includes(term),
		);
	}, [auditLogs, auditSearch]);

	const updateMutation = useMutation({
		mutationFn: async (payload: TenantPayload) => {
			const { data } = await apiClient.put<TenantResponse>(
				`/platform/tenants/${params.id}`,
				{
					name: payload.name,
					description: payload.description,
					owner_id: payload.owner_id,
				},
			);
			return data;
		},
		onSuccess: () => {
			toast.success("Organization updated successfully");
			setIsEditing(false);
			queryClient.invalidateQueries({ queryKey: ["tenant", params.id] });
			queryClient.invalidateQueries({ queryKey: ["allTenants"] });
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to update organization"));
		},
	});

	const openEditDialog = () => {
		if (!tenant) return;
		setForm({
			name: tenant.name,
			description: tenant.description || "",
			type: tenant.type,
			owner_id: tenant.owner_id,
		});
		const existingOwner = users?.find((u) => u.id === tenant.owner_id);
		setSelectedOwner(existingOwner || null);
		setOwnerSearch("");
		setIsEditing(true);
	};

	const getActionColor = (action: string) => {
		const normalized = action.toLowerCase();
		if (normalized.includes("create") || normalized.includes("invite"))
			return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
		if (
			normalized.includes("delete") ||
			normalized.includes("remove") ||
			normalized.includes("fail")
		)
			return "text-destructive border-destructive/20 bg-destructive/5";
		if (normalized.includes("update") || normalized.includes("change"))
			return "text-blue-500 border-blue-500/20 bg-blue-500/5";
		return "text-muted-foreground border-muted bg-muted/5";
	};

	const openAuditDetails = (log: AuditLogEntry) => {
		setSelectedAuditLog(log);
		setIsAuditDetailsOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
			</div>
		);
	}

	if (!tenant) {
		return (
			<div className="text-center py-20 text-muted-foreground">
				Tenant not found.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Organization</DialogTitle>
						<DialogDescription>
							Update the details for <strong>{tenant.name}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-2">
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Name
							</label>
							<Input
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Description
							</label>
							<Input
								value={form.description}
								onChange={(e) =>
									setForm({ ...form, description: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Type
							</label>
							{tenant.type === "PLATFORM" ? (
								<p className="text-sm text-muted-foreground">
									System platform tenant (cannot be changed)
								</p>
							) : (
								<p className="text-sm text-muted-foreground">
									Customer organization
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Owner
							</label>
							<DropdownMenu
								open={isOwnerDropdownOpen}
								onOpenChange={setIsOwnerDropdownOpen}
							>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between font-normal h-10"
									>
										{selectedOwner ? (
											<span className="truncate">
												{selectedOwner.first_name} {selectedOwner.last_name} (
												{selectedOwner.email})
											</span>
										) : (
											<span className="text-muted-foreground">
												Select owner...
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[380px] p-0" align="start">
									<div className="p-2 border-b">
										<div className="relative">
											<Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
											<Input
												placeholder="Search users..."
												value={ownerSearch}
												onChange={(e) => setOwnerSearch(e.target.value)}
												className="pl-8 h-9 text-xs"
											/>
										</div>
									</div>
									<div className="max-h-[240px] overflow-y-auto p-1">
										{filteredOwners?.map((user) => (
											<DropdownMenuItem
												key={user.id}
												onSelect={() => {
													setSelectedOwner(user);
													setForm({ ...form, owner_id: user.id });
													setIsOwnerDropdownOpen(false);
												}}
												className="flex items-center justify-between py-2 cursor-pointer"
											>
												<div className="flex items-center gap-2">
													<div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
														{user.first_name?.charAt(0) ||
															user.email.charAt(0).toUpperCase()}
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
												{selectedOwner?.id === user.id && (
													<Badge>Selected</Badge>
												)}
											</DropdownMenuItem>
										))}
										{filteredOwners?.length === 0 && (
											<div className="py-6 text-center text-xs text-muted-foreground">
												No users found.
											</div>
										)}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditing(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => updateMutation.mutate(form)}
							disabled={updateMutation.isPending || !form.name}
						>
							{updateMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<Pencil className="h-4 w-4 mr-2" />
							)}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}
					className="rounded-xl"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
					<p className="text-muted-foreground text-sm mt-0.5 font-mono">
						{tenant.id}
					</p>
				</div>
				<Button onClick={openEditDialog} className="rounded-xl">
					<Pencil className="h-4 w-4 mr-2" /> Edit
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className="border-muted shadow-sm">
					<CardHeader>
						<CardTitle className="text-sm font-bold flex items-center gap-2">
							<Building2 className="h-4 w-4 text-primary" />
							Organization Details
						</CardTitle>
						<CardDescription>
							Core information about this tenant.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-1">
						<Row label="Name" value={tenant.name} />
						<Row label="Description" value={tenant.description || "—"} />
						<Row label="Type">
							<Badge variant="outline" className="font-mono text-[10px]">
								{tenant.type}
							</Badge>
						</Row>
						<Row label="Status">
							<Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-5">
								Active
							</Badge>
						</Row>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<Card className="border-muted shadow-sm">
						<CardHeader>
							<CardTitle className="text-sm font-bold flex items-center gap-2">
								<User className="h-4 w-4 text-primary" />
								Owner
							</CardTitle>
						</CardHeader>
						<CardContent>
							{tenant.owner ? (
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
										{tenant.owner.first_name?.charAt(0) ||
											tenant.owner.email.charAt(0).toUpperCase()}
									</div>
									<div>
										<p className="text-sm font-semibold">
											{tenant.owner.first_name} {tenant.owner.last_name}
										</p>
										<p className="text-[11px] text-muted-foreground font-mono">
											{tenant.owner.email}
										</p>
									</div>
								</div>
							) : (
								<p className="text-xs text-muted-foreground font-mono">
									{tenant.owner_id}
								</p>
							)}
						</CardContent>
					</Card>

					<Card className="border-muted shadow-sm">
						<CardHeader>
							<CardTitle className="text-sm font-bold flex items-center gap-2">
								<Calendar className="h-4 w-4 text-primary" />
								Timestamps
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1">
							<Row
								label="Created At"
								value={
									tenant.created_at
										? new Date(tenant.created_at).toLocaleString()
										: "—"
								}
							/>
							<Row
								label="Last Updated"
								value={
									tenant.updated_at
										? new Date(tenant.updated_at).toLocaleString()
										: "—"
								}
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			<Card className="border-muted shadow-sm overflow-hidden">
				<CardHeader>
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<CardTitle className="text-base font-bold flex items-center gap-2">
								<Clock className="h-4 w-4 text-primary" />
								Tenant Audit Trail
							</CardTitle>
							<CardDescription>
								Platform-scoped view of activity related to this tenant.
							</CardDescription>
						</div>
						<div className="relative w-full md:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search tenant audit..."
								className="pl-10"
								value={auditSearch}
								onChange={(event) => setAuditSearch(event.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{isLoadingAudit ? (
						<div className="flex justify-center py-16">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : filteredAuditLogs.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							{auditSearch.trim()
								? "No audit events match your search."
								: "No audit events found for this tenant."}
						</div>
					) : (
						filteredAuditLogs.slice(0, 12).map((log) => (
							<div
								key={log.id}
								className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
							>
								<div className="space-y-2 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="outline"
											className={getActionColor(log.action)}
										>
											{log.action.replace(/_/g, " ")}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{new Date(log.created_at).toLocaleString()}
										</span>
									</div>
									<div className="text-sm font-medium break-all">
										{log.actor_id || "Unknown actor"}
									</div>
									<div className="text-xs text-muted-foreground break-all">
										{log.resource
											? `Resource: ${log.resource}`
											: "Platform event"}
										{log.resource_id ? ` · ${log.resource_id}` : ""}
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => openAuditDetails(log)}
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<AuditLogDetailsDialog
				log={selectedAuditLog}
				open={isAuditDetailsOpen}
				onOpenChange={(open) => {
					setIsAuditDetailsOpen(open);
					if (!open) setSelectedAuditLog(null);
				}}
				getActionColor={getActionColor}
			/>
		</div>
	);
}

function Row({
	label,
	value,
	children,
}: {
	label: string;
	value?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between py-2 border-b border-muted last:border-0">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children ?? <span className="text-xs font-medium">{value}</span>}
		</div>
	);
}
