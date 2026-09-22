"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	AlertTriangle,
	CheckCircle2,
	Copy,
	ExternalLink,
	Fingerprint,
	Loader2,
	Plus,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
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
import { useAuthStore } from "@/stores/auth-store";

interface OidcRegistrationPayload {
	client_name: string;
	redirect_uris: string[];
	token_endpoint_auth_method:
		| "client_secret_basic"
		| "client_secret_post"
		| "private_key_jwt";
	jwks_uri?: string | null;
	subject_type: "public" | "pairwise";
	sector_identifier_uri?: string | null;
}

interface OidcRegistrationResponse {
	client_id: string;
	client_secret?: string | null;
	client_id_issued_at: number;
	client_secret_expires_at?: number | null;
	client_name?: string | null;
	redirect_uris: string[];
	response_types?: string[] | null;
	grant_types?: string[] | null;
	token_endpoint_auth_method?: string | null;
	jwks_uri?: string | null;
	subject_type?: string | null;
	sector_identifier_uri?: string | null;
}

const DISCOVERY_PATH = "/.well-known/openid-configuration";

export default function PlatformOidcClientsPage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const canManageOidcClients =
		user?.roles?.some((assignment) =>
			assignment.role.permissions?.some(
				(permission) => permission.name === "platform.tenants.manage",
			),
		) ?? false;
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [showSecrets, setShowSecrets] = useState(true);
	const [createdClient, setCreatedClient] =
		useState<OidcRegistrationResponse | null>(null);
	const [form, setForm] = useState({
		client_name: "",
		redirect_uris: "",
		token_endpoint_auth_method:
			"client_secret_basic" as OidcRegistrationPayload["token_endpoint_auth_method"],
		jwks_uri: "",
		subject_type: "public" as OidcRegistrationPayload["subject_type"],
		sector_identifier_uri: "",
	});

	const parsedRedirectUris = useMemo(
		() =>
			form.redirect_uris
				.split("\n")
				.map((value) => value.trim())
				.filter(Boolean),
		[form.redirect_uris],
	);

	useEffect(() => {
		if (!canManageOidcClients) {
			router.replace("/platform");
		}
	}, [canManageOidcClients, router]);

	const createMutation = useMutation({
		mutationFn: async (payload: OidcRegistrationPayload) => {
			const { data } = await apiClient.post<OidcRegistrationResponse>(
				"/oidc/register",
				payload,
			);
			return data;
		},
		onSuccess: (data) => {
			setCreatedClient(data);
			setShowSecrets(true);
			toast.success(
				"OIDC client registered. Copy the credentials now — the secret may not be shown again.",
			);
		},
		onError: (error: unknown) => {
			toast.error(getApiErrorMessage(error, "Failed to register OIDC client"));
		},
	});

	const resetForm = () => {
		setForm({
			client_name: "",
			redirect_uris: "",
			token_endpoint_auth_method: "client_secret_basic",
			jwks_uri: "",
			subject_type: "public",
			sector_identifier_uri: "",
		});
		setCreatedClient(null);
		setShowSecrets(true);
	};

	const copyToClipboard = async (value: string, label: string) => {
		await navigator.clipboard.writeText(value);
		toast.success(`${label} copied`);
	};

	const handleCreate = () => {
		createMutation.mutate({
			client_name: form.client_name.trim(),
			redirect_uris: parsedRedirectUris,
			token_endpoint_auth_method: form.token_endpoint_auth_method,
			jwks_uri:
				form.token_endpoint_auth_method === "private_key_jwt"
					? form.jwks_uri.trim() || null
					: null,
			subject_type: form.subject_type,
			sector_identifier_uri:
				form.subject_type === "pairwise"
					? form.sector_identifier_uri.trim() || null
					: null,
		});
	};

	if (!canManageOidcClients) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">OIDC Clients</h1>
					<p className="text-muted-foreground mt-1 max-w-3xl">
						Register relying-party applications that will use AuthEngine as an
						OpenID Connect provider. This UI uses the backend dynamic
						registration endpoint and is intended for platform operators.
					</p>
				</div>

				<Dialog
					open={isCreateOpen}
					onOpenChange={(open) => {
						setIsCreateOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button className="rounded-xl shadow-lg shadow-foreground/20 bg-foreground text-background hover:bg-foreground/90">
							<Plus className="mr-2 h-4 w-4" /> Register Client
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{createdClient
									? "OIDC client registered"
									: "Register a new OIDC client"}
							</DialogTitle>
							<DialogDescription>
								{createdClient
									? "Copy these credentials now and store them securely."
									: "Create client credentials for a relying-party application that will redirect users to AuthEngine."}
							</DialogDescription>
						</DialogHeader>

						{createdClient ? (
							<div className="space-y-5 py-2">
								<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
									<AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
									<div className="space-y-1">
										<p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
											Save the secret now
										</p>
										<p className="text-xs text-muted-foreground">
											The backend only returns the raw client secret at
											registration time. Store it in your application secrets
											manager before closing this dialog.
										</p>
									</div>
								</div>

								<CredentialRow
									label="Client name"
									value={createdClient.client_name || "—"}
								/>
								<CredentialRow
									label="Client ID"
									value={createdClient.client_id}
									copyLabel="Client ID"
									onCopy={copyToClipboard}
								/>
								<CredentialRow
									label="Client secret"
									value={
										createdClient.client_secret || "No client secret returned"
									}
									concealed={!showSecrets}
									copyLabel="Client secret"
									onCopy={copyToClipboard}
								/>
								{createdClient.client_secret ? (
									<div className="flex justify-end">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => setShowSecrets((current) => !current)}
										>
											{showSecrets ? "Hide secret" : "Show secret"}
										</Button>
									</div>
								) : null}

								<div className="grid gap-4 md:grid-cols-2">
									<InfoCard
										label="Auth method"
										value={createdClient.token_endpoint_auth_method || "—"}
									/>
									<InfoCard
										label="Subject type"
										value={createdClient.subject_type || "—"}
									/>
								</div>

								<div className="space-y-2">
									<Label>Redirect URIs</Label>
									<div className="rounded-lg border bg-muted/20 p-3 text-sm space-y-2">
										{createdClient.redirect_uris.map((uri) => (
											<div key={uri} className="font-mono break-all text-xs">
												{uri}
											</div>
										))}
									</div>
								</div>

								{createdClient.jwks_uri ? (
									<InfoCard
										label="JWKS URI"
										value={createdClient.jwks_uri}
										monospace
									/>
								) : null}
								{createdClient.sector_identifier_uri ? (
									<InfoCard
										label="Sector identifier URI"
										value={createdClient.sector_identifier_uri}
										monospace
									/>
								) : null}
							</div>
						) : (
							<div className="space-y-4 py-2">
								<div className="space-y-2">
									<Label htmlFor="client-name">Client name</Label>
									<Input
										id="client-name"
										placeholder="e.g. Org Portal, Partner Dashboard"
										value={form.client_name}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												client_name: event.target.value,
											}))
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="callback-uris">Provider Callback URIs</Label>
									<Textarea
										id="redirect-uris"
										placeholder="https://api.authengine.org/api/v1/auth/oauth/authengine/callback"
										className="min-h-28 font-mono text-xs"
										value={form.redirect_uris}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												redirect_uris: event.target.value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Enter one redirect URI per line.
									</p>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label>Token endpoint auth method</Label>
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={form.token_endpoint_auth_method}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													token_endpoint_auth_method: event.target
														.value as OidcRegistrationPayload["token_endpoint_auth_method"],
												}))
											}
										>
											<option value="client_secret_basic">
												client_secret_basic
											</option>
											<option value="client_secret_post">
												client_secret_post
											</option>
											<option value="private_key_jwt">private_key_jwt</option>
										</select>
									</div>

									<div className="space-y-2">
										<Label>Subject type</Label>
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={form.subject_type}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													subject_type: event.target
														.value as OidcRegistrationPayload["subject_type"],
												}))
											}
										>
											<option value="public">public</option>
											<option value="pairwise">pairwise</option>
										</select>
									</div>
								</div>

								{form.token_endpoint_auth_method === "private_key_jwt" ? (
									<div className="space-y-2">
										<Label htmlFor="jwks-uri">Client JWKS URI</Label>
										<Input
											id="jwks-uri"
											placeholder="https://api.authengine.org/.well-known/jwks.json"
											value={form.jwks_uri}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													jwks_uri: event.target.value,
												}))
											}
										/>
									</div>
								) : null}

								{form.subject_type === "pairwise" ? (
									<div className="space-y-2">
										<Label htmlFor="sector-identifier-uri">
											Sector identifier URI
										</Label>
										<Input
											id="sector-identifier-uri"
											placeholder="https://api.authengine.org/sector.json"
											value={form.sector_identifier_uri}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													sector_identifier_uri: event.target.value,
												}))
											}
										/>
									</div>
								) : null}
							</div>
						)}

						<DialogFooter>
							{createdClient ? (
								<Button
									type="button"
									onClick={() => {
										setIsCreateOpen(false);
										resetForm();
									}}
								>
									<CheckCircle2 className="mr-2 h-4 w-4" /> Done
								</Button>
							) : (
								<Button
									type="button"
									onClick={handleCreate}
									disabled={
										createMutation.isPending ||
										!form.client_name.trim() ||
										parsedRedirectUris.length === 0 ||
										(form.token_endpoint_auth_method === "private_key_jwt" &&
											!form.jwks_uri.trim())
									}
								>
									{createMutation.isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Fingerprint className="mr-2 h-4 w-4" />
									)}
									Register client
								</Button>
							)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle>How to use these clients</CardTitle>
						<CardDescription>
							AuthEngine exposes standard OIDC discovery and token endpoints for
							relying-party apps.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className="rounded-lg border bg-muted/20 p-4 space-y-3">
							<p className="font-medium">Typical relying-party configuration</p>
							<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
								<li>Use the discovery URL from your AuthEngine base host.</li>
								<li>
									Configure the generated client ID and secret in the app.
								</li>
								<li>Use Authorization Code flow with PKCE.</li>
							</ul>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<InfoCard
								label="Discovery URL"
								value={DISCOVERY_PATH}
								monospace
							/>
							<InfoCard
								label="Default scopes"
								value="openid profile email"
								monospace
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-sm border-muted">
					<CardHeader>
						<CardTitle>Current backend limitations</CardTitle>
						<CardDescription>
							This page exposes what the backend currently supports today.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
							<div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
								<AlertTriangle className="h-4 w-4" /> Incomplete management API
							</div>
							<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
								<li>
									The backend exposes dynamic registration, but not
									list/update/delete endpoints for OIDC clients.
								</li>
								<li>
									The tenant auth config expects an internal OIDC client record
									UUID, not the public `client_id` returned here.
								</li>
							</ul>
						</div>

						<a
							href="https://docs.authengine.org/oauth2-oidc-guides/"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							Open OIDC integration guide <ExternalLink className="h-4 w-4" />
						</a>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function CredentialRow({
	label,
	value,
	concealed = false,
	copyLabel,
	onCopy,
}: {
	label: string;
	value: string;
	concealed?: boolean;
	copyLabel?: string;
	onCopy?: (value: string, label: string) => Promise<void>;
}) {
	const displayValue = concealed
		? "•".repeat(Math.max(value.length, 16))
		: value;

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex gap-2">
				<Input readOnly value={displayValue} className="font-mono text-xs" />
				{copyLabel && onCopy ? (
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => void onCopy(value, copyLabel)}
					>
						<Copy className="h-4 w-4" />
					</Button>
				) : null}
			</div>
		</div>
	);
}

function InfoCard({
	label,
	value,
	monospace = false,
}: {
	label: string;
	value: string;
	monospace?: boolean;
}) {
	return (
		<div className="rounded-lg border bg-muted/20 p-4 space-y-1">
			<div className="text-xs font-medium text-muted-foreground">{label}</div>
			<div
				className={
					monospace
						? "font-mono text-xs break-all"
						: "text-sm font-medium break-words"
				}
			>
				{value}
			</div>
		</div>
	);
}
