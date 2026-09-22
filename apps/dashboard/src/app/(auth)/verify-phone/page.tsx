"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { CheckCircle2, XCircle, Loader2, Smartphone, ArrowRight } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function VerifyPhonePage() {
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"input" | "loading" | "success" | "error">("input");
    const [errorMessage, setErrorMessage] = useState("");

    const verifyMutation = useMutation({
        mutationFn: async (verificationCode: string) => {
            const { data } = await apiClient.post("/auth/verify-phone", { code: verificationCode });
            return data;
        },
        onSuccess: () => {
            setStatus("success");
        },
        onError: (error: unknown) => {
            setStatus("error");
            setErrorMessage(getApiErrorMessage(error, "Verification failed. Please check the code."));
        },
    });

    const handleSubmit = () => {
        if (code.length >= 4) {
            setStatus("loading");
            verifyMutation.mutate(code);
        }
    };

    const resendMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/request-token", { scope: "phone_verification" });
        },
        onSuccess: () => {
            setErrorMessage("");
            setStatus("input");
            setCode("");
        },
        onError: (error: unknown) => {
            setErrorMessage(getApiErrorMessage(error, "Failed to resend code"));
        },
    });

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-muted">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto">
                        {(status === "input" || status === "loading") && (
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                {status === "loading" ? (
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                ) : (
                                    <Smartphone className="h-8 w-8 text-primary" />
                                )}
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
                        {status === "input" && "Verify Phone Number"}
                        {status === "loading" && "Verifying..."}
                        {status === "success" && "Phone Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription>
                        {status === "input" && "Enter the verification code sent to your phone."}
                        {status === "loading" && "Please wait while we verify your code."}
                        {status === "success" && "Your phone number has been successfully verified."}
                        {status === "error" && errorMessage}
                    </CardDescription>
                </CardHeader>
                {(status === "input" || status === "error") && (
                    <CardContent className="space-y-4">
                        <Input
                            id="phone-code"
                            placeholder="000000"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.replace(/\D/g, ""));
                                if (status === "error") setStatus("input");
                            }}
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                        />
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={verifyMutation.isPending || code.length < 4}
                        >
                            {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Phone
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => resendMutation.mutate()}
                            disabled={resendMutation.isPending}
                        >
                            {resendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Resend Verification Code
                        </Button>
                    </CardContent>
                )}
                <CardFooter className="flex justify-center">
                    {status === "success" && (
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
