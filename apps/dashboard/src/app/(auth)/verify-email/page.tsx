"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    const verifyMutation = useMutation({
        mutationFn: async (verificationToken: string) => {
            const { data } = await apiClient.post("/auth/verify-email", { token: verificationToken });
            return data;
        },
        onSuccess: () => {
            setStatus("success");
        },
        onError: (error: unknown) => {
            setStatus("error");
            setErrorMessage(getApiErrorMessage(error, "Verification failed or token expired."));
        },
    });

    useEffect(() => {
        if (token) {
            verifyMutation.mutate(token);
        } else {
            setStatus("error");
            setErrorMessage("No verification token found in the URL.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-muted">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto">
                        {status === "loading" && (
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                        )}
                        {status === "success" && (
                            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                        )}
                        {status === "error" && (
                            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-destructive" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {status === "loading" && "Verifying Email..."}
                        {status === "success" && "Email Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Please wait while we verify your email address."}
                        {status === "success" && "Your email address has been successfully verified. You now have full access to your account."}
                        {status === "error" && errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    {status !== "loading" && (
                        <Button asChild>
                            <Link href="/me">
                                Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
