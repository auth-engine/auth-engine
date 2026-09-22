"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MailCheck, AlertCircle } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { AuthResponse } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/errors";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

function MagicLinkVerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const { setTokens, setUser } = useAuthStore();
    const handledRef = useRef(false);

    const { data, error, isPending } = useQuery({
        queryKey: ["verifyMagicLink", token],
        queryFn: async () => {
            if (!token) throw new Error("No token provided");

            const { data } = await apiClient.get<AuthResponse>(`/auth/magic-link/verify?token=${token}`);

            // Auto-fetch the user details after successful verification
            const currentUserData = await apiClient.get("/me/", {
                headers: {
                    Authorization: `Bearer ${data.access_token}`
                }
            });

            return {
                tokens: data,
                user: currentUserData.data
            };
        },
        enabled: !!token,
        retry: false, // Don't retry magic links since they are single-use
    });

    useEffect(() => {
        if (!data || handledRef.current) return;
        handledRef.current = true;
        setTokens(data.tokens.access_token, data.tokens.refresh_token);
        setUser(data.user);

        setTimeout(() => {
            router.push("/me");
        }, 1500);
    }, [data, router, setTokens, setUser]);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Invalid Link</CardTitle>
                        <CardDescription>
                            We couldn&apos;t find a magic link token in the URL.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/magic-link">Request a new link</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-4 text-center">
                    {isPending ? (
                        <div className="w-full flex justify-center py-4 text-primary">
                            <Loader2 className="h-12 w-12 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                    ) : (
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <MailCheck className="h-8 w-8 text-primary" />
                        </div>
                    )}

                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isPending && "Verifying your link..."}
                        {error && "Verification Failed"}
                        {data && "Success!"}
                    </CardTitle>
                    <CardDescription>
                        {isPending && "Please wait while we securely log you in."}
                        {error && getApiErrorMessage(error, "This magic link is invalid or has expired. Please request a new one.")}
                        {data && "You have been securely signed in. Redirecting..."}
                    </CardDescription>
                </CardHeader>

                {error && (
                    <CardFooter>
                        <Button asChild className="w-full mt-4">
                            <Link href="/magic-link">Request a new link</Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

export default function MagicLinkVerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardContent className="py-10 flex justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        }>
            <MagicLinkVerifyContent />
        </Suspense>
    );
}

