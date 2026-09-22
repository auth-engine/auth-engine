"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Loader2,
	Mail,
	MessageSquareText,
	Pencil,
	Plus,
	Smartphone,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import {
	EmailConfigForm,
	EmailConfigItem,
	EmailConfigListResponse,
	SmsConfigForm,
	SmsConfigItem,
	SmsConfigListResponse,
} from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

const PROVIDER_LABELS: Record<string, string> = {
	sendgrid: "SendGrid",
	ses: "AWS SES",
	smtp: "SMTP",
	console: "Console",
	twilio: "Twilio",
	android_gateway: "Android Gateway",
};

const EMAIL_PROVIDER_META: Record<
	string,
	{
		credentialLabel: string;
		credentialPlaceholder: string;
		credentialHelp: string;
		fromLabel: string;
		fromPlaceholder: string;
	}
> = {
	sendgrid: {
		credentialLabel: "SendGrid API key",
		credentialPlaceholder: "SG.xxxxx",
		credentialHelp:
			"Paste the SendGrid API key used to send transactional mail.",
		fromLabel: "From email",
		fromPlaceholder: "noreply@example.com",
	},
	ses: {
		credentialLabel: "AWS SES credentials",
		credentialPlaceholder: "access_key_id:secret_access_key",
		credentialHelp:
			"Use `access_key_id:secret_access_key` when storing per-tenant SES credentials.",
		fromLabel: "From email",
		fromPlaceholder: "noreply@example.com",
	},
	smtp: {
		credentialLabel: "SMTP credentials",
		credentialPlaceholder: "username:password@smtp.example.com:465",
		credentialHelp:
			"Format credentials as `username:password@host:port` to match the SMTP provider implementation.",
		fromLabel: "From email",
		fromPlaceholder: "noreply@example.com",
	},
	console: {
		credentialLabel: "Console provider token",
		credentialPlaceholder: "debug-token",
		credentialHelp:
			"Console provider is mainly for debugging. If enabled by the backend, any non-empty placeholder value is sufficient.",
		fromLabel: "From email",
		fromPlaceholder: "noreply@example.com",
	},
};

const SMS_PROVIDER_META: Record<
	string,
	{
		fromLabel: string;
		fromPlaceholder: string;
		fromHelp: string;
		accountLabel: string;
		accountPlaceholder: string;
		accountHelp: string;
		credentialLabel: string;
		credentialPlaceholder: string;
		credentialHelp: string;
	}
> = {
	twilio: {
		fromLabel: "From number / messaging service SID",
		fromPlaceholder: "+15551234567 or MGxxxxxxxx",
		fromHelp:
			"Use a Twilio phone number or a Messaging Service SID starting with `MG`.",
		accountLabel: "Twilio account SID",
		accountPlaceholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
		accountHelp: "The account SID used to authenticate Twilio API calls.",
		credentialLabel: "Twilio auth token",
		credentialPlaceholder: "twilio-auth-token",
		credentialHelp: "Paste the Twilio auth token for this account.",
	},
	android_gateway: {
		fromLabel: "From number / sender label",
		fromPlaceholder: "gateway",
		fromHelp:
			"Used only for display/context. The Android gateway sends from the SIM configured on the device.",
		accountLabel: "Android gateway base URL",
		accountPlaceholder: "https://api.sms-gate.app/3rdparty/v1",
		accountHelp:
			"Point this to the SMS Gateway for Android host or cloud endpoint expected by the backend provider.",
		credentialLabel: "Gateway basic auth",
		credentialPlaceholder: "username:password",
		credentialHelp:
			"If your gateway is protected, store credentials as `username:password`.",
	},
	console: {
		fromLabel: "From label",
		fromPlaceholder: "console",
		fromHelp: "Used only for debugging output.",
		accountLabel: "Gateway / account reference",
		accountPlaceholder: "debug-endpoint",
		accountHelp:
			"Optional reference shown in the UI when using the console provider.",
		credentialLabel: "Console provider token",
		credentialPlaceholder: "debug-token",
		credentialHelp:
			"Console provider is mainly for debugging. If enabled by the backend, any non-empty placeholder value is sufficient.",
	},
};

function providerLabel(value: string) {
	return PROVIDER_LABELS[value] ?? value;
}

function ConfigRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium text-right">{value}</span>
		</div>
	);
}

function EmailSection({
	activeTenantId,
	data,
	isLoading,
}: {
	activeTenantId: string;
	data?: EmailConfigListResponse;
	isLoading: boolean;
}) {
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isTestOpen, setIsTestOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [editingItem, setEditingItem] = useState<EmailConfigItem | null>(null);
	const [testingItem, setTestingItem] = useState<EmailConfigItem | null>(null);
	const [testEmail, setTestEmail] = useState("");
	const [form, setForm] = useState<EmailConfigForm>({
		provider: "ses",
		from_email: "",
		api_key: "",
		set_active: true,
	});

	const providers = data?.available_providers ?? ["sendgrid", "ses"];

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: ["tenantEmailConfig", activeTenantId],
		});

	const resetForm = () => {
		setForm({
			provider: providers[0] || "ses",
			from_email: "",
			api_key: "",
			set_active: true,
		});
		setEditingItem(null);
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			await apiClient.post(`/tenants/${activeTenantId}/email-config`, form);
		},
		onSuccess: () => {
			toast.success("Email configuration added");
			setIsCreateOpen(false);
			resetForm();
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to add email config"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!editingItem) return;
			await apiClient.put(
				`/tenants/${activeTenantId}/email-config/${editingItem.id}`,
				{
					provider: form.provider,
					from_email: form.from_email,
					api_key: form.api_key || undefined,
					set_active: form.set_active,
				},
			);
		},
		onSuccess: () => {
			toast.success("Email configuration updated");
			setIsEditOpen(false);
			resetForm();
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to update email config"));
		},
	});

	const activateMutation = useMutation({
		mutationFn: async (configId: string) => {
			await apiClient.put(
				`/tenants/${activeTenantId}/email-config/${configId}`,
				{
					set_active: true,
				},
			);
		},
		onSuccess: () => {
			toast.success("Active email configuration updated");
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(
				getApiErrorMessage(error, "Failed to activate configuration"),
			);
		},
	});

	const testMutation = useMutation({
		mutationFn: async () => {
			if (!testingItem) return;
			const { data } = await apiClient.post<{
				success: boolean;
				error?: string;
			}>(`/tenants/${activeTenantId}/email-config/${testingItem.id}/test`, {
				to_email: testEmail.trim(),
			});
			if (!data.success) {
				throw new Error(data.error || "Test email failed");
			}
		},
		onSuccess: () => {
			toast.success("Test email sent");
			setIsTestOpen(false);
			setTestingItem(null);
			setTestEmail("");
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to send test email"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (configId: string) => {
			await apiClient.delete(
				`/tenants/${activeTenantId}/email-config/${configId}`,
			);
		},
		onSuccess: () => {
			toast.success("Email configuration removed");
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to delete configuration"));
		},
	});

	const openEdit = (item: EmailConfigItem) => {
		setEditingItem(item);
		setForm({
			provider: item.provider,
			from_email: item.from_email,
			api_key: "",
			set_active: item.is_active,
		});
		setIsEditOpen(true);
	};

	const openTest = (item: EmailConfigItem) => {
		setTestingItem(item);
		setTestEmail("");
		setIsTestOpen(true);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Mail className="h-5 w-5 text-primary" />
							Email
						</CardTitle>
						<CardDescription>
							Magic links, password resets, and invitations.
						</CardDescription>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : (
					<>
						{data?.using_platform_default ? (
							<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								Using platform default:{" "}
								<strong>{providerLabel(data.platform_provider ?? "")}</strong>
								{" · "}
								{data.platform_from_email}
							</div>
						) : null}
						{data?.items.length
							? data.items.map((item) => (
									<div
										key={item.id}
										className="rounded-lg border p-4 space-y-3"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="font-medium">
												{providerLabel(item.provider)}
											</div>
											<Badge variant={item.is_active ? "default" : "secondary"}>
												{item.is_active ? "Active" : "Inactive"}
											</Badge>
										</div>
										<ConfigRow label="From" value={item.from_email} />
										<ConfigRow
											label="Credentials"
											value={item.credential_hint}
										/>
										<div className="flex flex-wrap gap-2">
											{!item.is_active ? (
												<Button
													size="sm"
													variant="outline"
													disabled={activateMutation.isPending}
													onClick={() => activateMutation.mutate(item.id)}
												>
													Set active
												</Button>
											) : null}
											<Button
												size="sm"
												variant="outline"
												onClick={() => openEdit(item)}
											>
												<Pencil className="mr-1 h-4 w-4" /> Edit
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => openTest(item)}
											>
												<MessageSquareText className="mr-1 h-4 w-4" /> Test
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-destructive hover:text-destructive"
												disabled={deleteMutation.isPending}
												onClick={() => setDeleteTargetId(item.id)}
											>
												<Trash2 className="h-4 w-4 mr-1" />
												Delete
											</Button>
										</div>
									</div>
								))
							: !data?.using_platform_default && (
									<p className="text-sm text-muted-foreground">
										No configurations yet.
									</p>
								)}
					</>
				)}
			</CardContent>

			<EmailConfigDialog
				open={isCreateOpen}
				onOpenChange={(open) => {
					setIsCreateOpen(open);
					if (!open) resetForm();
				}}
				title="Add email configuration"
				form={form}
				setForm={setForm}
				providers={providers}
				onSubmit={() => createMutation.mutate()}
				loading={createMutation.isPending}
				submitLabel="Save"
			/>

			<EmailConfigDialog
				open={isEditOpen}
				onOpenChange={(open) => {
					setIsEditOpen(open);
					if (!open) resetForm();
				}}
				title="Edit email configuration"
				form={form}
				setForm={setForm}
				providers={providers}
				onSubmit={() => updateMutation.mutate()}
				loading={updateMutation.isPending}
				submitLabel="Update"
				showSecretHint
			/>

			<TestDialog
				open={isTestOpen}
				onOpenChange={(open) => {
					setIsTestOpen(open);
					if (!open) {
						setTestingItem(null);
						setTestEmail("");
					}
				}}
				title="Send test email"
				label="Recipient email"
				placeholder="you@example.com"
				value={testEmail}
				onChange={setTestEmail}
				onSubmit={() => testMutation.mutate()}
				loading={testMutation.isPending}
				disabled={!testEmail.includes("@")}
			/>

			<ConfirmDialog
				open={!!deleteTargetId}
				onOpenChange={(open) => !open && setDeleteTargetId(null)}
				title="Delete this configuration?"
				description="This action cannot be undone."
				confirmLabel="Delete"
				loading={deleteMutation.isPending}
				onConfirm={() => {
					if (deleteTargetId) {
						deleteMutation.mutate(deleteTargetId);
						setDeleteTargetId(null);
					}
				}}
			/>
		</Card>
	);
}

function SmsSection({
	activeTenantId,
	data,
	isLoading,
}: {
	activeTenantId: string;
	data?: SmsConfigListResponse;
	isLoading: boolean;
}) {
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isTestOpen, setIsTestOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [editingItem, setEditingItem] = useState<SmsConfigItem | null>(null);
	const [testingItem, setTestingItem] = useState<SmsConfigItem | null>(null);
	const [testNumber, setTestNumber] = useState("");
	const [form, setForm] = useState<SmsConfigForm>({
		provider: "android_gateway",
		from_number: "gateway",
		api_key: "",
		account_sid: "",
		set_active: true,
	});

	const providers = data?.available_providers ?? ["twilio", "android_gateway"];

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: ["tenantSmsConfig", activeTenantId],
		});

	const resetForm = () => {
		setForm({
			provider: providers[0] || "android_gateway",
			from_number: "gateway",
			api_key: "",
			account_sid: "",
			set_active: true,
		});
		setEditingItem(null);
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			await apiClient.post(`/tenants/${activeTenantId}/sms-config`, {
				...form,
				account_sid: form.account_sid || null,
			});
		},
		onSuccess: () => {
			toast.success("SMS configuration added");
			setIsCreateOpen(false);
			resetForm();
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to add SMS config"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!editingItem) return;
			await apiClient.put(
				`/tenants/${activeTenantId}/sms-config/${editingItem.id}`,
				{
					provider: form.provider,
					from_number: form.from_number,
					api_key: form.api_key || undefined,
					account_sid: form.account_sid || null,
					set_active: form.set_active,
				},
			);
		},
		onSuccess: () => {
			toast.success("SMS configuration updated");
			setIsEditOpen(false);
			resetForm();
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to update SMS config"));
		},
	});

	const activateMutation = useMutation({
		mutationFn: async (configId: string) => {
			await apiClient.put(`/tenants/${activeTenantId}/sms-config/${configId}`, {
				set_active: true,
			});
		},
		onSuccess: () => {
			toast.success("Active SMS configuration updated");
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(
				getApiErrorMessage(error, "Failed to activate configuration"),
			);
		},
	});

	const testMutation = useMutation({
		mutationFn: async () => {
			if (!testingItem) return;
			const { data } = await apiClient.post<{
				success: boolean;
				error?: string;
			}>(`/tenants/${activeTenantId}/sms-config/${testingItem.id}/test`, {
				to_number: testNumber.trim(),
			});
			if (!data.success) {
				throw new Error(data.error || "Test SMS failed");
			}
		},
		onSuccess: () => {
			toast.success("Test SMS sent");
			setIsTestOpen(false);
			setTestingItem(null);
			setTestNumber("");
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to send test SMS"));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (configId: string) => {
			await apiClient.delete(
				`/tenants/${activeTenantId}/sms-config/${configId}`,
			);
		},
		onSuccess: () => {
			toast.success("SMS configuration removed");
			invalidate();
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to delete configuration"));
		},
	});

	const openEdit = (item: SmsConfigItem) => {
		setEditingItem(item);
		setForm({
			provider: item.provider,
			from_number: item.from_number,
			api_key: "",
			account_sid: item.account_sid || "",
			set_active: item.is_active,
		});
		setIsEditOpen(true);
	};

	const openTest = (item: SmsConfigItem) => {
		setTestingItem(item);
		setTestNumber("");
		setIsTestOpen(true);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Smartphone className="h-5 w-5 text-primary" />
							SMS
						</CardTitle>
						<CardDescription>SMS OTP and phone verification.</CardDescription>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : (
					<>
						{data?.using_platform_default ? (
							<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								Using platform default:{" "}
								<strong>{providerLabel(data.platform_provider ?? "")}</strong>
								{" · "}
								{data.platform_from_number}
							</div>
						) : null}
						{data?.items.length
							? data.items.map((item) => (
									<div
										key={item.id}
										className="rounded-lg border p-4 space-y-3"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="font-medium">
												{providerLabel(item.provider)}
											</div>
											<Badge variant={item.is_active ? "default" : "secondary"}>
												{item.is_active ? "Active" : "Inactive"}
											</Badge>
										</div>
										<ConfigRow label="From" value={item.from_number} />
										{item.account_sid ? (
											<ConfigRow
												label="Gateway / account"
												value={item.account_sid}
											/>
										) : null}
										<ConfigRow
											label="Credentials"
											value={item.credential_hint}
										/>
										<div className="flex flex-wrap gap-2">
											{!item.is_active ? (
												<Button
													size="sm"
													variant="outline"
													disabled={activateMutation.isPending}
													onClick={() => activateMutation.mutate(item.id)}
												>
													Set active
												</Button>
											) : null}
											<Button
												size="sm"
												variant="outline"
												onClick={() => openEdit(item)}
											>
												<Pencil className="mr-1 h-4 w-4" /> Edit
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => openTest(item)}
											>
												<MessageSquareText className="mr-1 h-4 w-4" /> Test
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-destructive hover:text-destructive"
												disabled={deleteMutation.isPending}
												onClick={() => setDeleteTargetId(item.id)}
											>
												<Trash2 className="h-4 w-4 mr-1" />
												Delete
											</Button>
										</div>
									</div>
								))
							: !data?.using_platform_default && (
									<p className="text-sm text-muted-foreground">
										No configurations yet.
									</p>
								)}
					</>
				)}
			</CardContent>

			<SmsConfigDialog
				open={isCreateOpen}
				onOpenChange={(open) => {
					setIsCreateOpen(open);
					if (!open) resetForm();
				}}
				title="Add SMS configuration"
				form={form}
				setForm={setForm}
				providers={providers}
				onSubmit={() => createMutation.mutate()}
				loading={createMutation.isPending}
				submitLabel="Save"
			/>

			<SmsConfigDialog
				open={isEditOpen}
				onOpenChange={(open) => {
					setIsEditOpen(open);
					if (!open) resetForm();
				}}
				title="Edit SMS configuration"
				form={form}
				setForm={setForm}
				providers={providers}
				onSubmit={() => updateMutation.mutate()}
				loading={updateMutation.isPending}
				submitLabel="Update"
				showSecretHint
			/>

			<TestDialog
				open={isTestOpen}
				onOpenChange={(open) => {
					setIsTestOpen(open);
					if (!open) {
						setTestingItem(null);
						setTestNumber("");
					}
				}}
				title="Send test SMS"
				label="Destination number"
				placeholder="+15551234567"
				value={testNumber}
				onChange={setTestNumber}
				onSubmit={() => testMutation.mutate()}
				loading={testMutation.isPending}
				disabled={testNumber.trim().length < 5}
			/>

			<ConfirmDialog
				open={!!deleteTargetId}
				onOpenChange={(open) => !open && setDeleteTargetId(null)}
				title="Delete this configuration?"
				description="This action cannot be undone."
				confirmLabel="Delete"
				loading={deleteMutation.isPending}
				onConfirm={() => {
					if (deleteTargetId) {
						deleteMutation.mutate(deleteTargetId);
						setDeleteTargetId(null);
					}
				}}
			/>
		</Card>
	);
}

function EmailConfigDialog({
	open,
	onOpenChange,
	title,
	form,
	setForm,
	providers,
	onSubmit,
	loading,
	submitLabel,
	showSecretHint = false,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	form: EmailConfigForm;
	setForm: Dispatch<SetStateAction<EmailConfigForm>>;
	providers: string[];
	onSubmit: () => void;
	loading: boolean;
	submitLabel: string;
	showSecretHint?: boolean;
}) {
	const providerMeta =
		EMAIL_PROVIDER_META[form.provider] ?? EMAIL_PROVIDER_META.sendgrid;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Provider</Label>
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={form.provider}
							onChange={(e) =>
								setForm((current) => ({ ...current, provider: e.target.value }))
							}
						>
							{providers.map((provider) => (
								<option key={provider} value={provider}>
									{providerLabel(provider)}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label>{providerMeta.fromLabel}</Label>
						<Input
							type="email"
							placeholder={providerMeta.fromPlaceholder}
							value={form.from_email}
							onChange={(e) =>
								setForm((current) => ({
									...current,
									from_email: e.target.value,
								}))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>
							{showSecretHint
								? `${providerMeta.credentialLabel} (leave blank to keep current)`
								: providerMeta.credentialLabel}
						</Label>
						<Input
							type="password"
							placeholder={providerMeta.credentialPlaceholder}
							value={form.api_key}
							onChange={(e) =>
								setForm((current) => ({ ...current, api_key: e.target.value }))
							}
						/>
						<p className="text-[10px] text-muted-foreground">
							{providerMeta.credentialHelp}
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={onSubmit}
						disabled={
							loading || !form.from_email || (!showSecretHint && !form.api_key)
						}
					>
						{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function SmsConfigDialog({
	open,
	onOpenChange,
	title,
	form,
	setForm,
	providers,
	onSubmit,
	loading,
	submitLabel,
	showSecretHint = false,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	form: SmsConfigForm;
	setForm: Dispatch<SetStateAction<SmsConfigForm>>;
	providers: string[];
	onSubmit: () => void;
	loading: boolean;
	submitLabel: string;
	showSecretHint?: boolean;
}) {
	const providerMeta =
		SMS_PROVIDER_META[form.provider] ?? SMS_PROVIDER_META.android_gateway;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Provider</Label>
						<select
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={form.provider}
							onChange={(e) =>
								setForm((current) => ({ ...current, provider: e.target.value }))
							}
						>
							{providers.map((provider) => (
								<option key={provider} value={provider}>
									{providerLabel(provider)}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label>{providerMeta.fromLabel}</Label>
						<Input
							placeholder={providerMeta.fromPlaceholder}
							value={form.from_number}
							onChange={(e) =>
								setForm((current) => ({
									...current,
									from_number: e.target.value,
								}))
							}
						/>
						<p className="text-[10px] text-muted-foreground">
							{providerMeta.fromHelp}
						</p>
					</div>
					<div className="space-y-2">
						<Label>{providerMeta.accountLabel}</Label>
						<Input
							value={form.account_sid}
							onChange={(e) =>
								setForm((current) => ({
									...current,
									account_sid: e.target.value,
								}))
							}
							placeholder={providerMeta.accountPlaceholder}
						/>
						<p className="text-[10px] text-muted-foreground">
							{providerMeta.accountHelp}
						</p>
					</div>
					<div className="space-y-2">
						<Label>
							{showSecretHint
								? `${providerMeta.credentialLabel} (leave blank to keep current)`
								: providerMeta.credentialLabel}
						</Label>
						<Input
							type="password"
							placeholder={providerMeta.credentialPlaceholder}
							value={form.api_key}
							onChange={(e) =>
								setForm((current) => ({ ...current, api_key: e.target.value }))
							}
						/>
						<p className="text-[10px] text-muted-foreground">
							{providerMeta.credentialHelp}
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={onSubmit}
						disabled={
							loading || !form.from_number || (!showSecretHint && !form.api_key)
						}
					>
						{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function TestDialog({
	open,
	onOpenChange,
	title,
	label,
	placeholder,
	value,
	onChange,
	onSubmit,
	loading,
	disabled,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	loading: boolean;
	disabled: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-2">
					<Label>{label}</Label>
					<Input
						value={value}
						onChange={(event) => onChange(event.target.value)}
						placeholder={placeholder}
					/>
				</div>
				<DialogFooter>
					<Button onClick={onSubmit} disabled={loading || disabled}>
						{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Send test
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function TenantCommunicationsPage() {
	const { activeTenantId } = useAuthStore();

	const { data: emailData, isLoading: isLoadingEmail } = useQuery({
		queryKey: ["tenantEmailConfig", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<EmailConfigListResponse>(
				`/tenants/${activeTenantId}/email-config`,
			);
			return data;
		},
		enabled: !!activeTenantId,
	});

	const { data: smsData, isLoading: isLoadingSms } = useQuery({
		queryKey: ["tenantSmsConfig", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<SmsConfigListResponse>(
				`/tenants/${activeTenantId}/sms-config`,
			);
			return data;
		},
		enabled: !!activeTenantId,
	});

	if (!activeTenantId) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				Select an organization.
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-3xl">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Communications</h1>
				<p className="text-muted-foreground mt-1">
					Add multiple email and SMS providers. Only the active configuration is
					used.
				</p>
			</div>

			<EmailSection
				activeTenantId={activeTenantId}
				data={emailData}
				isLoading={isLoadingEmail}
			/>
			<SmsSection
				activeTenantId={activeTenantId}
				data={smsData}
				isLoading={isLoadingSms}
			/>
		</div>
	);
}
