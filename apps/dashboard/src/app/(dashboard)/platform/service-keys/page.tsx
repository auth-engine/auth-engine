"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Ban,
	Building2,
	CheckCircle2,
	Clock,
	Copy,
	Eye,
	EyeOff,
	Key,
	Loader2,
	Plus,
} from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { ServiceKeyResponse, TenantResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface CreateServiceKeyPayload {
	service_name: string;
	tenant_id?: string | null;
	expires_at?: string | null;
}

export default function ServiceKeysPage() {
	const queryClient = useQueryClient();
	const [isCreating, setIsCreating] = useState(false);
	const [serviceName, setServiceName] = useState("");
	const [scopedTenantId, setScopedTenantId] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
	const [showKey, setShowKey] = useState(false);
	const [isRevoking, setIsRevoking] = useState(false);
	const [revokingKey, setRevokingKey] = useState<ServiceKeyResponse | null>(
		null,
	);

	const { data: keys, isLoading } = useQuery<ServiceKeyResponse[]>({
		queryKey: ["serviceKeys"],
		queryFn: async () => {
			const { data } =
				await apiClient.get<ServiceKeyResponse[]>("/auth/service-keys");
			return data;
		},
	});

	const { data: tenants = [] } = useQuery<TenantResponse[]>({
		queryKey: ["platformTenantsForServiceKeys"],
		queryFn: async () => {
			const { data } =
				await apiClient.get<TenantResponse[]>("/platform/tenants");
			return data;
		},
	});

	const tenantNameById = useMemo(
		() => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
		[tenants],
	);

	const resetCreateDialog = () => {
		setServiceName("");
		setScopedTenantId("");
		setExpiresAt("");
		setNewlyCreatedKey(null);
		setShowKey(false);
	};

	const createMutation = useMutation({
		mutationFn: async (payload: CreateServiceKeyPayload) => {
			const { data } = await apiClient.post<ServiceKeyResponse>(
				"/auth/service-keys",
				payload,
			);
			return data;
		},
		onSuccess: (data) => {
			setNewlyCreatedKey(data.raw_key || data.key_prefix);
			setShowKey(true);
			toast.success(
				"Service key created! Copy it now — it won't be shown again.",
			);
			queryClient.invalidateQueries({ queryKey: ["serviceKeys"] });
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to create service key"));
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async (keyId: string) => {
			await apiClient.delete(`/auth/service-keys/${keyId}`);
		},
		onSuccess: () => {
			toast.success("Service key revoked");
			setIsRevoking(false);
			setRevokingKey(null);
			queryClient.invalidateQueries({ queryKey: ["serviceKeys"] });
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to revoke service key"));
		},
	});

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	const openRevokeDialog = (key: ServiceKeyResponse) => {
		setRevokingKey(key);
		setIsRevoking(true);
	};

	const handleCreate = () => {
		createMutation.mutate({
			service_name: serviceName.trim(),
			tenant_id: scopedTenantId || null,
			expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						API Service Keys
					</h1>
					<p className="text-muted-foreground mt-1">
						Machine-to-machine API keys for platform integrations and
						automation.
					</p>
				</div>

				<Dialog
					open={isCreating}
					onOpenChange={(open) => {
						setIsCreating(open);
						if (!open) resetCreateDialog();
					}}
				>
					<DialogTrigger asChild>
						<Button className="rounded-xl shadow-lg shadow-foreground/20 bg-foreground text-background hover:bg-foreground/90">
							<Plus className="mr-2 h-4 w-4" /> Generate Key
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[560px]">
						<DialogHeader>
							<DialogTitle>
								{newlyCreatedKey
									? "Key Created Successfully"
									: "Generate Service Key"}
							</DialogTitle>
							<DialogDescription>
								{newlyCreatedKey
									? "Copy your key now. It will not be shown again."
									: "Create a new API key for machine-to-machine integrations."}
							</DialogDescription>
						</DialogHeader>
						{newlyCreatedKey ? (
							<div className="space-y-4 py-4">
								<div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
									<AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
											Save this key
										</p>
										<p className="text-xs text-muted-foreground">
											This is the only time the full key will be displayed.
											Store it securely.
										</p>
									</div>
								</div>
								<div className="relative">
									<Input
										readOnly
										value={showKey ? newlyCreatedKey : "•".repeat(40)}
										className="font-mono text-xs pr-20"
									/>
									<div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											title={showKey ? "Hide key" : "Show key"}
											onClick={() => setShowKey(!showKey)}
										>
											{showKey ? (
												<Eye className="h-3.5 w-3.5" />
											) : (
												<EyeOff className="h-3.5 w-3.5" />
											)}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => void copyToClipboard(newlyCreatedKey)}
										>
											<Copy className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="service-name">
										Service Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="service-name"
										placeholder="e.g. cicd, data-sync, billing-worker"
										value={serviceName}
										onChange={(e) => setServiceName(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										A short identifier for the service using this key.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="tenant-scope">Tenant Scope</Label>
									<select
										id="tenant-scope"
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={scopedTenantId}
										onChange={(e) => setScopedTenantId(e.target.value)}
									>
										<option value="">Platform-wide key</option>
										{tenants.map((tenant) => (
											<option key={tenant.id} value={tenant.id}>
												{tenant.name}
											</option>
										))}
									</select>
									<p className="text-xs text-muted-foreground">
										Optionally restrict this key to one tenant for introspection
										and audit scoping.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="expires-at">Expires at</Label>
									<Input
										id="expires-at"
										type="datetime-local"
										value={expiresAt}
										onChange={(e) => setExpiresAt(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										Leave empty if this key should not expire automatically.
									</p>
								</div>
							</div>
						)}
						<DialogFooter>
							{newlyCreatedKey ? (
								<Button
									onClick={() => {
										setIsCreating(false);
										resetCreateDialog();
									}}
								>
									<CheckCircle2 className="mr-2 h-4 w-4" /> Done
								</Button>
							) : (
								<Button
									onClick={handleCreate}
									disabled={createMutation.isPending || !serviceName.trim()}
								>
									{createMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Generate Key
								</Button>
							)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="shadow-sm border-muted overflow-hidden">
				{isLoading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
					</div>
				) : !keys || keys.length === 0 ? (
					<div className="py-20 text-center">
						<Key className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
						<h3 className="text-lg font-semibold">No service keys</h3>
						<p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
							Generate your first API key to enable machine-to-machine
							integrations.
						</p>
					</div>
				) : (
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow>
								<TableHead>Key Prefix</TableHead>
								<TableHead>Service Name</TableHead>
								<TableHead>Scope</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created By</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Expires</TableHead>
								<TableHead>Last Used</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{keys.map((key) => (
								<TableRow key={key.id} className="group transition-colors">
									<TableCell>
										<div className="flex items-center gap-2">
											<Key className="h-4 w-4 text-muted-foreground" />
											<code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
												{key.key_prefix}...
											</code>
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm font-medium">
											{key.service_name}
										</span>
									</TableCell>
									<TableCell>
										{key.tenant_id ? (
											<div className="flex items-center gap-2 text-xs">
												<Building2 className="h-3.5 w-3.5 text-muted-foreground" />
												<div>
													<div className="font-medium">
														{tenantNameById.get(key.tenant_id) ??
															"Scoped tenant"}
													</div>
													<div className="font-mono text-muted-foreground">
														{key.tenant_id.slice(0, 8)}...
													</div>
												</div>
											</div>
										) : (
											<Badge variant="secondary">Platform</Badge>
										)}
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={
												key.is_active
													? "text-emerald-600 border-emerald-500/20 bg-emerald-500/5"
													: "text-muted-foreground border-muted bg-muted/30"
											}
										>
											{key.is_active ? "Active" : "Revoked"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="space-y-0.5">
											<p className="text-xs font-medium truncate max-w-[160px]">
												{key.creator?.email ?? "Unknown"}
											</p>
											{key.created_by && !key.creator?.email && (
												<p className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
													{key.created_by.slice(0, 8)}...
												</p>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											{new Date(key.created_at).toLocaleDateString()}
										</div>
									</TableCell>
									<TableCell>
										<span className="text-xs text-muted-foreground">
											{key.expires_at
												? new Date(key.expires_at).toLocaleString()
												: "Never"}
										</span>
									</TableCell>
									<TableCell>
										<span className="text-xs text-muted-foreground">
											{key.last_used_at
												? new Date(key.last_used_at).toLocaleString()
												: "Never"}
										</span>
									</TableCell>
									<TableCell className="text-right">
										{key.is_active ? (
											<Button
												variant="ghost"
												size="sm"
												className="h-8 text-destructive hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity"
												onClick={() => openRevokeDialog(key)}
											>
												<Ban className="h-3.5 w-3.5 mr-1" /> Revoke
											</Button>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			<Dialog open={isRevoking} onOpenChange={setIsRevoking}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Revoke Service Key</DialogTitle>
						<DialogDescription asChild>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>
									Revoke{" "}
									<strong className="text-foreground">
										{revokingKey?.service_name}
									</strong>{" "}
									(
									<code className="text-xs bg-muted px-1 py-0.5 rounded">
										{revokingKey?.key_prefix}
									</code>
									)?
								</p>
								<p>
									The key will stop working immediately. Any service using it
									will receive{" "}
									<strong className="text-foreground">401 Unauthorized</strong>.
								</p>
								<p>
									This cannot be undone — generate a new key if you need access
									again. The revoked record is kept for audit purposes (there is
									no separate delete action).
								</p>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsRevoking(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								revokingKey && revokeMutation.mutate(revokingKey.id)
							}
							disabled={revokeMutation.isPending}
						>
							{revokeMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Revoke Key
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-4">
				<Key className="h-5 w-5 text-primary shrink-0 mt-0.5" />
				<div className="space-y-1">
					<p className="text-sm font-semibold text-primary">
						About Service Keys
					</p>
					<p className="text-xs text-muted-foreground">
						Service keys provide machine-to-machine access to the platform API.
						Keys are hashed at rest — only the prefix is stored for
						identification. Use{" "}
						<strong className="text-foreground">Revoke</strong> to permanently
						disable a key; revoked keys remain in the list for audit. To restore
						access, generate a new key. Requires{" "}
						<code className="bg-muted px-1 py-0.5 rounded text-[10px]">
							platform.tenants.manage
						</code>{" "}
						permission.
					</p>
				</div>
			</div>
		</div>
	);
}
