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

const magicLinkSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function MagicLinkPage() {
    const [isSent, setIsSent] = useState(false);
    const [sentEmail, setSentEmail] = useState("");

    const form = useForm<z.infer<typeof magicLinkSchema>>({
        resolver: zodResolver(magicLinkSchema),
        defaultValues: {
            email: "",
        },
    });

    const requestMagicLinkMutation = useMutation({
        mutationFn: async (values: z.infer<typeof magicLinkSchema>) => {
            await apiClient.post("/auth/magic-link/request", {
                email: values.email,
                tenant_id: null,
            });
        },
        onSuccess: (_, variables) => {
            setSentEmail(variables.email);
            setIsSent(true);
            toast.success("Magic link sent!");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to send magic link. Please try again."));
        },
    });

    function onSubmit(values: z.infer<typeof magicLinkSchema>) {
        requestMagicLinkMutation.mutate(values);
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
                            We&apos;ve sent a magic link to <span className="font-semibold text-foreground">{sentEmail}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        Click the link in the email to securely sign in to your account.
                        The link will expire in 15 minutes.
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-6">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsSent(false)}
                        >
                            Try a different email
                        </Button>
                        <Link href="/login" className="text-sm font-medium hover:underline flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-muted">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">Magic Link</CardTitle>
                    <CardDescription>
                        Enter your email to receive a passwordless sign in link
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
                                disabled={requestMagicLinkMutation.isPending}
                            >
                                {requestMagicLinkMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Send Magic Link
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
