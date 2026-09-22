"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Clock,
	ExternalLink,
	Globe,
	Key,
	Loader2,
	LockKeyhole,
	Save,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { PasswordPolicy, TenantAuthConfig } from "@/lib/types";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const AUTH_METHODS = [
	{
		id: "email_password",
		label: "Email / Password",
		description: "Standard login with password",
	},
	{
		id: "magic_link",
		label: "Magic Link",
		description: "Passwordless email login",
	},
	{
		id: "passkey",
		label: "Passkeys",
		description: "Biometric and security keys",
	},
	{
		id: "social_provider",
		label: "Social Login",
		description: "Google, GitHub, AuthEngine, etc.",
	},
];

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
	min_length: 8,
	require_uppercase: true,
	require_lowercase: true,
	require_digit: true,
	require_special: true,
};

type SettingsFormData = {
	allowed_methods: string[];
	mfa_required: boolean;
	password_policy: PasswordPolicy;
	session_ttl_seconds: number;
	allowed_domains: string[];
	oidc_client_id: string;
};

function buildFormData(config: TenantAuthConfig): SettingsFormData {
	return {
		allowed_methods: config.allowed_methods || [],
		mfa_required: !!config.mfa_required,
		password_policy: {
			...DEFAULT_PASSWORD_POLICY,
			...(config.password_policy ?? {}),
		},
		session_ttl_seconds: config.session_ttl_seconds || 86400,
		allowed_domains: config.allowed_domains || [],
		oidc_client_id: config.oidc_client_id || "",
	};
}

function TenantSettingsForm({
	config,
	activeTenantId,
	isPlatformTenant,
}: {
	config: TenantAuthConfig;
	activeTenantId: string;
	isPlatformTenant: boolean;
}) {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState<SettingsFormData>(() =>
		buildFormData(config),
	);

	const updateMutation = useMutation({
		mutationFn: async (payload: SettingsFormData) => {
			await apiClient.put(`/tenants/${activeTenantId}/auth-config`, {
				...payload,
				oidc_client_id: payload.oidc_client_id.trim() || null,
			});
		},
		onSuccess: () => {
			toast.success("Settings updated successfully!");
			queryClient.invalidateQueries({
				queryKey: ["tenantAuthConfig", activeTenantId],
			});
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to update settings"));
		},
	});

	const toggleMethod = (methodId: string) => {
		const current = formData.allowed_methods;
		if (current.includes(methodId)) {
			if (current.length === 1) {
				toast.warning(
					"You must have at least one authentication method enabled.",
				);
				return;
			}
			setFormData({
				...formData,
				allowed_methods: current.filter((m) => m !== methodId),
			});
		} else {
			setFormData({ ...formData, allowed_methods: [...current, methodId] });
		}
	};

	const updatePasswordPolicy = <K extends keyof PasswordPolicy>(
		key: K,
		value: PasswordPolicy[K],
	) => {
		setFormData((current) => ({
			...current,
			password_policy: {
				...current.password_policy,
				[key]: value,
			},
		}));
	};

	const handleSave = () => {
		updateMutation.mutate(formData);
	};

	return (
		<div className="space-y-8 pb-20 max-w-5xl">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Authentication Configuration
				</h1>
				<p className="text-muted-foreground mt-1">
					Configure how users authenticate with your organization.
				</p>
			</div>

			<div className="grid gap-6">
				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5 text-primary" />
							Allowed Authentication Methods
						</CardTitle>
						<CardDescription>
							Enable or disable specific login strategies for your users.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-6">
						{AUTH_METHODS.map((method) => (
							<div
								key={method.id}
								className="flex items-center justify-between border-b border-muted pb-4 last:border-0 last:pb-0"
							>
								<div className="space-y-0.5">
									<p className="text-sm font-semibold">{method.label}</p>
									<p className="text-xs text-muted-foreground">
										{method.description}
									</p>
								</div>
								<Switch
									checked={formData.allowed_methods.includes(method.id)}
									onCheckedChange={() => toggleMethod(method.id)}
								/>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-primary" />
							Security Policies
						</CardTitle>
						<CardDescription>
							Set global security requirements for all organization members.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						<div className="flex items-center justify-between group">
							<div className="space-y-1">
								<p className="text-sm font-semibold">Require MFA</p>
								<p className="text-xs text-muted-foreground">
									Force all users to set up Multi-Factor Authentication.
								</p>
							</div>
							<Switch
								checked={formData.mfa_required}
								onCheckedChange={(val) =>
									setFormData({ ...formData, mfa_required: val })
								}
							/>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<h4 className="text-sm font-semibold">Session Lifetime</h4>
							</div>
							<div className="flex items-center gap-4 max-w-xs">
								<Input
									type="number"
									min={300}
									max={86400}
									value={formData.session_ttl_seconds}
									onChange={(e) =>
										setFormData({
											...formData,
											session_ttl_seconds: parseInt(e.target.value, 10) || 0,
										})
									}
								/>
								<span className="text-xs text-muted-foreground whitespace-nowrap">
									seconds ({Math.floor(formData.session_ttl_seconds / 3600)}{" "}
									hours)
								</span>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Globe className="h-4 w-4 text-muted-foreground" />
								<h4 className="text-sm font-semibold">Allowed Domains</h4>
							</div>
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground">
									Restrict registration to specific email domains (comma
									separated).
								</p>
								<Input
									placeholder="acme.com, corp.acme.com"
									value={formData.allowed_domains.join(", ")}
									onChange={(e) =>
										setFormData({
											...formData,
											allowed_domains: e.target.value
												.split(",")
												.map((d) => d.trim())
												.filter(Boolean),
										})
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<LockKeyhole className="h-5 w-5 text-primary" />
							Password Policy
						</CardTitle>
						<CardDescription>
							Control baseline password requirements enforced for this
							organization.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2 max-w-xs">
							<label className="text-sm font-medium">Minimum length</label>
							<Input
								type="number"
								min={8}
								max={128}
								value={formData.password_policy.min_length}
								onChange={(event) =>
									updatePasswordPolicy(
										"min_length",
										Math.max(8, parseInt(event.target.value, 10) || 8),
									)
								}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<PolicyToggle
								label="Require uppercase letter"
								description="At least one A–Z character"
								checked={formData.password_policy.require_uppercase}
								onCheckedChange={(value) =>
									updatePasswordPolicy("require_uppercase", value)
								}
							/>
							<PolicyToggle
								label="Require lowercase letter"
								description="At least one a–z character"
								checked={formData.password_policy.require_lowercase}
								onCheckedChange={(value) =>
									updatePasswordPolicy("require_lowercase", value)
								}
							/>
							<PolicyToggle
								label="Require digit"
								description="At least one numeric character"
								checked={formData.password_policy.require_digit}
								onCheckedChange={(value) =>
									updatePasswordPolicy("require_digit", value)
								}
							/>
							<PolicyToggle
								label="Require special character"
								description="At least one punctuation or symbol"
								checked={formData.password_policy.require_special}
								onCheckedChange={(value) =>
									updatePasswordPolicy("require_special", value)
								}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Key className="h-5 w-5 text-primary" />
							OIDC Client Reference
						</CardTitle>
						<CardDescription>
							Store the internal OIDC client record UUID linked to this tenant
							auth configuration.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-2 max-w-2xl">
							<label className="text-sm font-medium">
								OIDC client record ID
							</label>
							<Input
								placeholder="Internal OIDC client UUID"
								value={formData.oidc_client_id}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										oidc_client_id: event.target.value,
									}))
								}
							/>
						</div>
						<p className="text-xs text-muted-foreground max-w-3xl">
							The current backend stores a UUID reference here rather than the
							public OIDC `client_id`. Dynamic client registration is available
							from the platform UI, but list/link management still depends on
							additional backend endpoints.
						</p>
						{isPlatformTenant ? (
							<Link
								href="/platform/oidc-clients"
								className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
							>
								Open platform OIDC client registration{" "}
								<ExternalLink className="h-4 w-4" />
							</Link>
						) : null}
					</CardContent>
				</Card>
			</div>

			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-12 z-50">
				<Button
					size="lg"
					className="rounded-full px-8 shadow-2xl shadow-primary/30 group"
					onClick={handleSave}
					disabled={updateMutation.isPending}
				>
					{updateMutation.isPending ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
					)}
					Save All Changes
				</Button>
			</div>
		</div>
	);
}

function PolicyToggle({
	label,
	description,
	checked,
	onCheckedChange,
}: {
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (value: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border p-4 gap-4">
			<div className="space-y-1">
				<p className="text-sm font-medium">{label}</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}

export default function TenantSettingsPage() {
	const { activeTenantId, activeTenant, isReady, isLoading, isPlatformTenant } =
		useActiveTenant();

	const { data: config, isLoading: isLoadingConfig } = useQuery({
		queryKey: ["tenantAuthConfig", activeTenantId],
		queryFn: async () => {
			const { data } = await apiClient.get<TenantAuthConfig>(
				`/tenants/${activeTenantId}/auth-config`,
			);
			return data;
		},
		enabled: isReady,
	});

	if (isLoading)
		return (
			<div className="p-20 flex justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
			</div>
		);
	if (!isReady)
		return (
			<div className="p-8 text-center text-muted-foreground">
				Select an organization.
			</div>
		);
	if (isLoadingConfig || !config)
		return (
			<div className="p-20 flex justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
			</div>
		);

	return (
		<div className="space-y-4">
			{activeTenant?.type === "PLATFORM" && (
				<p className="text-sm text-muted-foreground">
					Platform-wide login methods for the system organization.
				</p>
			)}
			<TenantSettingsForm
				key={activeTenantId}
				config={config}
				activeTenantId={activeTenantId!}
				isPlatformTenant={isPlatformTenant}
			/>
		</div>
	);
}
