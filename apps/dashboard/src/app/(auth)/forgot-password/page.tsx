"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
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

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);
    const [sentEmail, setSentEmail] = useState("");

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const requestResetMutation = useMutation({
        mutationFn: async (values: z.infer<typeof forgotPasswordSchema>) => {
            await apiClient.post("/auth/password-reset/request", {
                email: values.email,
                tenant_id: null,
            });
        },
        onSuccess: (_, variables) => {
            setSentEmail(variables.email);
            setIsSent(true);
            toast.success("Password reset email sent!");
        },
        onError: (error: unknown) => {
            // Don't leak whether the email exists or not from standard security practices.
            // But we will show backend errors if any happen reliably.
            toast.error(getApiErrorMessage(error, "Something went wrong. Please try again."));
        },
    });

    function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
        requestResetMutation.mutate(values);
    }

    if (isSent) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <MailCheck className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Check your email</CardTitle>
                        <CardDescription className="text-base">
                            We&apos;ve sent password reset instructions to <span className="font-semibold text-foreground">{sentEmail}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        Click the link in the email to set a new password for your account.
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-6">
                        <Button
                            variant="default"
                            className="w-full"
                            asChild
                        >
                            <Link href="/login">Return to login</Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            disabled={requestResetMutation.isPending}
                            onClick={() => requestResetMutation.mutate({ email: sentEmail })}
                        >
                            {requestResetMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Resend email
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={requestResetMutation.isPending}
                            >
                                {requestResetMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Send Reset Link
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
