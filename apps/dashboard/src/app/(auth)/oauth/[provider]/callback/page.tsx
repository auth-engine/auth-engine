"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { use } from "react";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OAuthCallbackParams {
	params: Promise<{
		provider: string;
	}>;
}

export default function OAuthCallbackPage({ params }: OAuthCallbackParams) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { provider } = use(params);

	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const errorParam = searchParams.get("error");
	const errorDescription = searchParams.get("error_description");

	const { setTokens, setUser } = useAuthStore();
	const handledRef = useRef(false);

	const { data, error, isPending } = useQuery({
		queryKey: ["oauthCallback", provider, code, state],
		queryFn: async () => {
			// If the provider returned an error, throw it immediately so the query fails
			if (errorParam) {
				throw new Error(errorDescription || errorParam);
			}

			if (!code || !state) {
				throw new Error("Missing authorization code or state token");
			}

			// 1. Exchange the code/state for auth tokens
			const { data: authData } = await apiClient.get(
				`/auth/oauth/${provider}/callback?code=${code}&state=${state}`,
			);

			// 2. Auto-fetch the user details
			const { data: userData } = await apiClient.get("/me/", {
				headers: {
					Authorization: `Bearer ${authData.access_token}`,
				},
			});

			return {
				tokens: authData,
				user: userData,
				isNewUser: authData.is_new_user,
			};
		},
		// Only run if we actually have the required callback params OR an error from the provider
		enabled: !!provider && (!!(code && state) || !!errorParam),
		retry: false,
	});

	useEffect(() => {
		if (!data || handledRef.current) return;
		handledRef.current = true;

		setTokens(data.tokens.access_token, data.tokens.refresh_token);
		setUser(data.user);

		if (data.isNewUser) {
			toast.success("Account created successfully!");
		} else {
			toast.success("Successfully logged in!");
		}

		router.push("/tenant");
	}, [data, router, setTokens, setUser]);

	// If no params and no error, this page shouldn't really be visited directly
	if (!code && !state && !errorParam) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md shadow-lg border-muted">
					<CardHeader className="space-y-1 text-center">
						<div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
							<AlertCircle className="h-8 w-8 text-destructive" />
						</div>
						<CardTitle className="text-2xl font-bold tracking-tight">
							Invalid Request
						</CardTitle>
						<CardDescription>
							Missing OAuth callback parameters.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild className="w-full">
							<Link href="/login">Return to login</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-lg border-muted text-center pt-8">
				<CardHeader>
					{isPending && (
						<div className="mx-auto flex justify-center text-primary mb-4">
							<Loader2 className="h-12 w-12 animate-spin" />
						</div>
					)}
					{error && (
						<div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
							<AlertCircle className="h-8 w-8 text-destructive" />
						</div>
					)}

					<CardTitle className="text-2xl font-bold tracking-tight">
						{isPending && "Authenticating..."}
						{error && "Authentication Failed"}
						{data && "Success!"}
					</CardTitle>
					<CardDescription className="mt-2 text-base">
						{isPending && "Please wait while we securely log you in."}
						{error &&
							getApiErrorMessage(
								error,
								"Failed to authenticate with provider. Please try again.",
							)}
						{data && "You have been securely signed in. Redirecting..."}
					</CardDescription>
				</CardHeader>

				{error && (
					<CardFooter>
						<Button asChild className="w-full mt-4">
							<Link href="/login">Return to login</Link>
						</Button>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
