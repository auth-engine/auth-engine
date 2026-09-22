"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isResetComplete, setIsResetComplete] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validate the token first
    const { isPending: isValidating, error: validationError } = useQuery({
        queryKey: ["validateResetToken", token],
        queryFn: async () => {
            if (!token) throw new Error("No reset token provided");
            const { data } = await apiClient.get<{ message: string }>(
                `/auth/password-reset/confirm?token=${token}`
            );
            return data;
        },
        enabled: !!token,
        retry: false,
    });

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const resetMutation = useMutation({
        mutationFn: async (values: z.infer<typeof resetPasswordSchema>) => {
            await apiClient.post("/auth/password-reset/confirm", {
                token: token,
                new_password: values.password,
                confirm_password: values.confirmPassword,
            });
        },
        onSuccess: () => {
            setIsResetComplete(true);
            toast.success("Password reset successfully!");
            // Optionally redirect to login shortly after
            setTimeout(() => router.push("/login"), 3000);
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to reset password. The link might have expired."));
        },
    });

    function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
        resetMutation.mutate(values);
    }

    // State 1: No Token
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
                            We couldn&apos;t find a reset token in the URL.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/forgot-password">Request a new reset link</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // State 2: Validating Token
    if (isValidating) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted text-center pt-8">
                    <CardContent className="space-y-4">
                        <div className="flex justify-center text-primary">
                            <Loader2 className="h-12 w-12 animate-spin" />
                        </div>
                        <CardTitle className="text-xl">Verifying your link...</CardTitle>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // State 3: Invalid Token
    if (validationError) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Invalid or Expired Link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or has already expired.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/forgot-password">Request a new reset link</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // State 4: Reset Complete
    if (isResetComplete) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Password Reset!</CardTitle>
                        <CardDescription className="text-base">
                            Your password has been successfully reset.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        You can now use your new password to sign in. Redirecting you to login...
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button
                            className="w-full"
                            asChild
                        >
                            <Link href="/login">Go to login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // State 5: Enter New Password Form
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Set new password</CardTitle>
                    <CardDescription>
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder=""
                                                    className="pr-10"
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder=""
                                                    className="pr-10"
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={resetMutation.isPending}
                            >
                                {resetMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Reset Password
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
