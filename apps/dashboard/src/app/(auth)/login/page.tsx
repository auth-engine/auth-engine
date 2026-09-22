"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    KeyRound,
    Loader2,
    Mail,
    ShieldCheck,
    ArrowLeft,
    Eye,
    EyeOff,
    Sparkles,
    CheckCircle2,
    Smartphone,
} from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import QRCode from "qrcode";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
    AuthResponse,
    MFAChallengeResponse,
    MFAEnrollResponse,
    MFAEnrollmentRequiredResponse,
    PublicTenantAuthConfig,
} from "@/lib/types";
import { getApiErrorMessage, isNotAllowedError } from "@/lib/errors";
import { getPlatformTenantId, PublicOAuthProvider, SOCIAL_PROVIDER_META } from "@/lib/social-login";
import { getPublicEnv } from "@/lib/public-env";
import { isWebAuthnSupported } from "@/lib/webauthn-support";
import { LoginFormSkeleton } from "@/components/auth/login-form-skeleton";

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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const LOGIN_TAB_KEY = "authengine_login_tab";
const MAGIC_LINK_COOLDOWN_SEC = 60;

const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
});

const passwordOnlySchema = z.object({
    password: z.string().min(1, { message: "Password is required." }),
});

const magicLinkSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

function validateEmail(email: string): string | null {
    const result = z.string().email().safeParse(email.trim());
    return result.success ? null : "Please enter a valid email address.";
}

function AuthShell({
    title,
    description,
    children,
    footer,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-[420px]">
                <Card className="overflow-hidden border-border/60 bg-card/80 py-0 shadow-xl shadow-black/5 backdrop-blur-sm">
                    <CardContent className="px-6 pb-6 pt-8">
                        <div className="mb-8 flex flex-col items-center gap-3 text-center">
                            <Image
                                src="/squarelogo.png"
                                alt="AuthEngine"
                                width={40}
                                height={40}
                                className="rounded-xl bg-white p-1"
                            />
                            <div className="space-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                        {children}
                    </CardContent>
                    {footer ? (
                        <CardFooter className="justify-center border-t border-border/50 py-4 text-sm text-muted-foreground">
                            {footer}
                        </CardFooter>
                    ) : null}
                </Card>
            </div>
        </div>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            </div>
        </div>
    );
}

function InlineError({ message }: { message: string }) {
    return (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
        </p>
    );
}

function MagicLinkSentPanel({
    email,
    resendCooldown,
    isResending,
    onResend,
    onChangeEmail,
}: {
    email: string;
    resendCooldown: number;
    isResending: boolean;
    onResend: () => void;
    onChangeEmail: () => void;
}) {
    return (
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">Check your inbox</p>
                    <p className="text-sm text-muted-foreground">
                        We sent a sign-in link to{" "}
                        <span className="font-medium text-foreground">{email}</span>. It expires in
                        15 minutes and works once.
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    disabled={resendCooldown > 0 || isResending}
                    onClick={onResend}
                >
                    {isResending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                    ) : (
                        "Resend link"
                    )}
                </Button>
                <Button type="button" variant="ghost" className="h-10 flex-1" onClick={onChangeEmail}>
                    Use different email
                </Button>
            </div>
        </div>
    );
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") || "/me";
    const { setTokens, setUser } = useAuthStore();

    const [mfaPendingToken, setMfaPendingToken] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaError, setMfaError] = useState<string | null>(null);
    const [mfaEnrollmentToken, setMfaEnrollmentToken] = useState<string | null>(null);
    const [enrollData, setEnrollData] = useState<MFAEnrollResponse | null>(null);
    const [enrollmentQrCode, setEnrollmentQrCode] = useState("");
    const [enrollmentCode, setEnrollmentCode] = useState("");
    const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
    const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(false);
    const [passkeyError, setPasskeyError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [credentialTab, setCredentialTab] = useState<"password" | "magic_link">("password");
    const [sharedEmail, setSharedEmail] = useState("");
    const [sharedEmailError, setSharedEmailError] = useState<string | null>(null);
    const [magicLinkSentEmail, setMagicLinkSentEmail] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);

    useEffect(() => {
        setWebAuthnSupported(isWebAuthnSupported());
        const saved = localStorage.getItem(LOGIN_TAB_KEY);
        if (saved === "password" || saved === "magic_link") {
            setCredentialTab(saved);
        }
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);

    useEffect(() => {
        if (!enrollData?.provisioning_uri) {
            setEnrollmentQrCode("");
            return;
        }

        QRCode.toDataURL(enrollData.provisioning_uri)
            .then(setEnrollmentQrCode)
            .catch(() => setEnrollmentQrCode(""));
    }, [enrollData]);

    const { data: authConfig, isLoading: isLoadingAuthConfig } = useQuery<PublicTenantAuthConfig>({
        queryKey: ["publicAuthConfig"],
        queryFn: async () => {
            const { data } = await apiClient.get<PublicTenantAuthConfig>("/auth/auth-config");
            return data;
        },
    });

    const platformTenantId = authConfig?.tenant_id ?? getPlatformTenantId();

    const allowedMethods = new Set(authConfig?.allowed_methods ?? []);
    const showEmailPassword = allowedMethods.has("email_password");
    const showMagicLink = allowedMethods.has("magic_link");
    const showPasskeyConfig = allowedMethods.has("passkey");
    const showSocial = allowedMethods.has("social_provider");
    const showCredentialTabs = showEmailPassword && showMagicLink;
    const showEmailField = showEmailPassword || showMagicLink;
    const showPasskeySection = showPasskeyConfig && webAuthnSupported;

    const { data: socialProviders = [], isLoading: isLoadingSocialProviders } = useQuery<
        PublicOAuthProvider[]
    >({
        queryKey: ["loginSocialProviders", platformTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<PublicOAuthProvider[]>(
                "/auth/oauth/providers",
                platformTenantId
                    ? { params: { tenant_id: platformTenantId } }
                    : undefined
            );
            return data;
        },
        enabled: !!platformTenantId && showSocial,
    });

    const passwordForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const passwordOnlyForm = useForm<z.infer<typeof passwordOnlySchema>>({
        resolver: zodResolver(passwordOnlySchema),
        defaultValues: { password: "" },
    });

    const magicForm = useForm<z.infer<typeof magicLinkSchema>>({
        resolver: zodResolver(magicLinkSchema),
        defaultValues: { email: "" },
    });

    const handleLoginSuccess = (data: AuthResponse) => {
        setTokens(data.access_token, data.refresh_token);
        if (data.user) setUser(data.user);
        toast.success("Successfully logged in!");
        router.push(returnTo);
    };

    const handleCredentialTabChange = (value: string) => {
        const tab = value as "password" | "magic_link";
        setCredentialTab(tab);
        localStorage.setItem(LOGIN_TAB_KEY, tab);
        setSharedEmailError(null);
        passwordForm.clearErrors("root");
        magicForm.clearErrors("root");
    };

    const getEmailForSubmit = useCallback(
        (formEmail?: string) => (showCredentialTabs ? sharedEmail.trim() : (formEmail ?? "").trim()),
        [showCredentialTabs, sharedEmail]
    );

    const sendMagicLink = async (email: string) => {
        await apiClient.post("/auth/magic-link/request", {
            email,
            tenant_id: platformTenantId || undefined,
        });
    };

    const loginMutation = useMutation({
        mutationFn: async (values: { email: string; password: string }) => {
            const { data } = await apiClient.post("/auth/login", {
                ...values,
                tenant_id: platformTenantId || undefined,
            });
            return data;
        },
        onSuccess: (data: AuthResponse | MFAChallengeResponse | MFAEnrollmentRequiredResponse) => {
            passwordForm.clearErrors("root");
            if ("mfa_pending_token" in data && data.mfa_pending_token) {
                setMfaPendingToken(data.mfa_pending_token);
                setMfaError(null);
                return;
            }
            if ("mfa_enrollment_token" in data && data.mfa_enrollment_token) {
                setMfaEnrollmentToken(data.mfa_enrollment_token);
                setEnrollData(null);
                setEnrollmentCode("");
                setEnrollmentError(null);
                return;
            }
            handleLoginSuccess(data as AuthResponse);
        },
        onError: (error: unknown) => {
            passwordForm.setError("root", {
                message: getApiErrorMessage(error, "Invalid email or password."),
            });
        },
    });

    const magicLinkMutation = useMutation({
        mutationFn: sendMagicLink,
        onSuccess: (_data, email) => {
            magicForm.clearErrors("root");
            setMagicLinkSentEmail(email);
            setResendCooldown(MAGIC_LINK_COOLDOWN_SEC);
        },
        onError: (error: unknown) => {
            magicForm.setError("root", {
                message: getApiErrorMessage(error, "Failed to send magic link."),
            });
        },
    });

    const mfaCompleteMutation = useMutation({
        mutationFn: async ({ token, code }: { token: string; code: string }) => {
            const { data } = await apiClient.post<AuthResponse>("/auth/mfa/complete", {
                mfa_pending_token: token,
                code,
            });
            return data;
        },
        onSuccess: handleLoginSuccess,
        onError: () => setMfaError("Invalid MFA code. Please try again."),
    });

    const mfaEnrollStartMutation = useMutation({
        mutationFn: async (token: string) => {
            const { data } = await apiClient.post<MFAEnrollResponse>("/auth/mfa/enroll", {
                mfa_enrollment_token: token,
            });
            return data;
        },
        onSuccess: (data) => {
            setEnrollData(data);
            setEnrollmentError(null);
        },
        onError: (error: unknown) => {
            setEnrollmentError(
                getApiErrorMessage(error, "Failed to start MFA setup. Please sign in again.")
            );
        },
    });

    const mfaEnrollVerifyMutation = useMutation({
        mutationFn: async ({ token, code }: { token: string; code: string }) => {
            const { data } = await apiClient.post<AuthResponse>("/auth/mfa/enroll/verify", {
                mfa_enrollment_token: token,
                code,
            });
            return data;
        },
        onSuccess: handleLoginSuccess,
        onError: (error: unknown) => {
            setEnrollmentError(
                getApiErrorMessage(error, "Invalid verification code. Please try again.")
            );
        },
    });

    const submitPasswordLogin = (password: string, formEmail?: string) => {
        const email = getEmailForSubmit(formEmail);
        const emailErr = validateEmail(email);
        if (emailErr) {
            if (showCredentialTabs) {
                setSharedEmailError(emailErr);
            } else {
                passwordForm.setError("email", { message: emailErr });
            }
            return;
        }
        setSharedEmailError(null);
        loginMutation.mutate({ email, password });
    };

    const submitMagicLink = (formEmail?: string) => {
        const email = getEmailForSubmit(formEmail);
        const emailErr = validateEmail(email);
        if (emailErr) {
            if (showCredentialTabs) {
                setSharedEmailError(emailErr);
            } else {
                magicForm.setError("email", { message: emailErr });
            }
            return;
        }
        setSharedEmailError(null);
        magicLinkMutation.mutate(email);
    };

    const handleWebAuthnLogin = async () => {
        setPasskeyError(null);
        setIsWebAuthnLoading(true);

        try {
            const { data } = await apiClient.post("/auth/webauthn/authenticate/begin", {
                tenant_id: platformTenantId || undefined,
            });

            const assertion = await startAuthentication({ optionsJSON: data.options });

            const { data: loginData } = await apiClient.post<AuthResponse>(
                "/auth/webauthn/authenticate/complete",
                {
                    credential: {
                        id: assertion.id,
                        rawId: assertion.rawId,
                        type: assertion.type,
                        response: {
                            clientDataJSON: assertion.response.clientDataJSON,
                            authenticatorData: assertion.response.authenticatorData,
                            signature: assertion.response.signature,
                            userHandle: assertion.response.userHandle,
                        },
                    },
                    tenant_id: platformTenantId || undefined,
                }
            );

            handleLoginSuccess(loginData);
        } catch (error: unknown) {
            if (isNotAllowedError(error)) {
                // User dismissed the prompt or the browser timed out — no error banner.
                return;
            }
            setPasskeyError(getApiErrorMessage(error, "Passkey login failed."));
        } finally {
            setIsWebAuthnLoading(false);
        }
    };

    const handleSocialLogin = (provider: string, tenantId: string) => {
        const baseUrl = getPublicEnv().API_URL;
        const params = new URLSearchParams({ tenant_id: tenantId });
        window.location.href = `${baseUrl}/auth/oauth/${provider}/login?${params.toString()}`;
    };

    const sharedEmailField = showCredentialTabs ? (
        <div className="space-y-2">
            <Label htmlFor="shared-email">Email</Label>
            <Input
                id="shared-email"
                type="email"
                autoComplete="username"
                className="h-11"
                value={sharedEmail}
                onChange={(e) => {
                    setSharedEmail(e.target.value);
                    setSharedEmailError(null);
                    setMagicLinkSentEmail(null);
                }}
            />
            {sharedEmailError ? (
                <p className="text-sm text-destructive">{sharedEmailError}</p>
            ) : null}
        </div>
    ) : null;

    const passwordRootError = passwordForm.formState.errors.root?.message;
    const magicRootError = magicForm.formState.errors.root?.message;

    const hasSocialProviders = showSocial && socialProviders.length > 0;
    const showSocialSection = showSocial && (hasSocialProviders || isLoadingSocialProviders);
    const hasPrimaryAuth = showEmailField;

    if (mfaEnrollmentToken) {
        return (
            <AuthShell
                title={enrollData ? "Set up authenticator" : "MFA required"}
                description={
                    enrollData
                        ? "Scan the QR code, then enter the 6-digit code from your app"
                        : "Your organization requires two-factor authentication before you can sign in"
                }
            >
                <div className="space-y-5">
                    {!enrollData ? (
                        <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Smartphone className="h-6 w-6 text-primary" />
                            </div>
                            {enrollmentError ? <InlineError message={enrollmentError} /> : null}
                            <Button
                                className="h-11 w-full"
                                disabled={mfaEnrollStartMutation.isPending}
                                onClick={() => mfaEnrollStartMutation.mutate(mfaEnrollmentToken)}
                            >
                                {mfaEnrollStartMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Set up authenticator
                            </Button>
                        </>
                    ) : (
                        <>
                            {enrollmentQrCode ? (
                                <div className="flex justify-center">
                                    <div className="rounded-xl border border-primary/20 bg-white p-3">
                                        <Image
                                            src={enrollmentQrCode}
                                            alt="MFA QR Code"
                                            width={192}
                                            height={192}
                                            className="h-48 w-48"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            ) : null}
                            <p className="text-center text-xs font-mono text-muted-foreground">
                                Manual code: {enrollData.secret}
                            </p>
                            <Input
                                placeholder="000000"
                                value={enrollmentCode}
                                maxLength={6}
                                onChange={(e) => {
                                    setEnrollmentCode(e.target.value.replace(/\D/g, ""));
                                    setEnrollmentError(null);
                                }}
                                className="h-12 text-center text-xl tracking-[0.45em]"
                            />
                            {enrollmentError ? <InlineError message={enrollmentError} /> : null}
                            <Button
                                className="h-11 w-full"
                                disabled={
                                    enrollmentCode.length !== 6 || mfaEnrollVerifyMutation.isPending
                                }
                                onClick={() =>
                                    mfaEnrollVerifyMutation.mutate({
                                        token: mfaEnrollmentToken,
                                        code: enrollmentCode,
                                    })
                                }
                            >
                                {mfaEnrollVerifyMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Verify & sign in
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                            setMfaEnrollmentToken(null);
                            setEnrollData(null);
                            setEnrollmentCode("");
                            setEnrollmentError(null);
                        }}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Button>
                </div>
            </AuthShell>
        );
    }

    if (mfaPendingToken) {
        return (
            <AuthShell
                title="Verify it's you"
                description="Enter the code from your authenticator app"
            >
                <div className="space-y-5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <Input
                        placeholder="000000"
                        value={mfaCode}
                        maxLength={6}
                        onChange={(e) => {
                            setMfaCode(e.target.value.replace(/\D/g, ""));
                            setMfaError(null);
                        }}
                        className="h-12 text-center text-xl tracking-[0.45em]"
                    />
                    {mfaError ? <InlineError message={mfaError} /> : null}
                    <Button
                        className="h-11 w-full"
                        disabled={mfaCode.length !== 6 || mfaCompleteMutation.isPending}
                        onClick={() =>
                            mfaCompleteMutation.mutate({
                                token: mfaPendingToken,
                                code: mfaCode,
                            })
                        }
                    >
                        {mfaCompleteMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify & sign in
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                            setMfaPendingToken(null);
                            setMfaError(null);
                        }}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Button>
                </div>
            </AuthShell>
        );
    }

    const signUpFooter = (
        <>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
            </Link>
        </>
    );

    return (
        <AuthShell title="Sign in" description="Access your account securely" footer={signUpFooter}>
            {isLoadingAuthConfig ? (
                <LoginFormSkeleton />
            ) : (
                <div className="space-y-6">
                    {showCredentialTabs ? (
                        <div className="space-y-4">
                            {sharedEmailField}
                            <Tabs
                                value={credentialTab}
                                onValueChange={handleCredentialTabChange}
                                className="w-full"
                            >
                                <TabsList className="grid h-10 w-full grid-cols-2">
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                    <TabsTrigger value="magic_link">Magic link</TabsTrigger>
                                </TabsList>

                                <TabsContent value="password" className="mt-4 space-y-4">
                                    <Form {...passwordOnlyForm}>
                                        <form
                                            onSubmit={passwordOnlyForm.handleSubmit((values) =>
                                                submitPasswordLogin(values.password)
                                            )}
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={passwordOnlyForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel>Password</FormLabel>
                                                            <Link
                                                                href="/forgot-password"
                                                                className="text-xs text-primary hover:underline"
                                                            >
                                                                Forgot password?
                                                            </Link>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    {...field}
                                                                    type={
                                                                        showPassword
                                                                            ? "text"
                                                                            : "password"
                                                                    }
                                                                    autoComplete="current-password"
                                                                    className="h-11 pr-10"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                                                                    onClick={() =>
                                                                        setShowPassword(!showPassword)
                                                                    }
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
                                            {passwordRootError ? (
                                                <InlineError message={passwordRootError} />
                                            ) : null}
                                            <Button
                                                type="submit"
                                                className="h-11 w-full"
                                                disabled={loginMutation.isPending}
                                            >
                                                {loginMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Sign in
                                            </Button>
                                        </form>
                                    </Form>
                                </TabsContent>

                                <TabsContent value="magic_link" className="mt-4 space-y-4">
                                    {magicLinkSentEmail ? (
                                        <MagicLinkSentPanel
                                            email={magicLinkSentEmail}
                                            resendCooldown={resendCooldown}
                                            isResending={magicLinkMutation.isPending}
                                            onResend={() => submitMagicLink(magicLinkSentEmail)}
                                            onChangeEmail={() => {
                                                setMagicLinkSentEmail(null);
                                                setResendCooldown(0);
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                We&apos;ll email a secure one-time link — no password
                                                needed.
                                            </p>
                                            {magicRootError ? (
                                                <InlineError message={magicRootError} />
                                            ) : null}
                                            <Button
                                                type="button"
                                                className="h-11 w-full"
                                                disabled={magicLinkMutation.isPending}
                                                onClick={() => submitMagicLink()}
                                            >
                                                {magicLinkMutation.isPending ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Mail className="mr-2 h-4 w-4" />
                                                )}
                                                Send magic link
                                            </Button>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : showEmailPassword ? (
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit((values) =>
                                    submitPasswordLogin(values.password, values.email)
                                )}
                                className="space-y-4"
                            >
                                <FormField
                                    control={passwordForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    autoComplete="username"
                                                    className="h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Password</FormLabel>
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        type={showPassword ? "text" : "password"}
                                                        autoComplete="current-password"
                                                        className="h-11 pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
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
                                {passwordRootError ? (
                                    <InlineError message={passwordRootError} />
                                ) : null}
                                <Button
                                    type="submit"
                                    className="h-11 w-full"
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Sign in
                                </Button>
                            </form>
                        </Form>
                    ) : showMagicLink ? (
                        magicLinkSentEmail ? (
                            <MagicLinkSentPanel
                                email={magicLinkSentEmail}
                                resendCooldown={resendCooldown}
                                isResending={magicLinkMutation.isPending}
                                onResend={() => submitMagicLink(magicLinkSentEmail)}
                                onChangeEmail={() => {
                                    setMagicLinkSentEmail(null);
                                    setResendCooldown(0);
                                }}
                            />
                        ) : (
                            <Form {...magicForm}>
                                <form
                                    onSubmit={magicForm.handleSubmit((values) =>
                                        submitMagicLink(values.email)
                                    )}
                                    className="space-y-4"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Enter your email and we&apos;ll send a one-time sign-in link.
                                    </p>
                                    <FormField
                                        control={magicForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        autoComplete="username"
                                                        className="h-11"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {magicRootError ? (
                                        <InlineError message={magicRootError} />
                                    ) : null}
                                    <Button
                                        type="submit"
                                        className="h-11 w-full"
                                        disabled={magicLinkMutation.isPending}
                                    >
                                        {magicLinkMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Send magic link
                                    </Button>
                                </form>
                            </Form>
                        )
                    ) : null}

                    {hasPrimaryAuth && showPasskeySection && (
                        <SectionDivider label="Passkey" />
                    )}

                    {!hasPrimaryAuth && showPasskeySection && !showSocialSection && (
                        <p className="text-center text-sm text-muted-foreground">
                            Sign in with your passkey
                        </p>
                    )}

                    {showPasskeySection && (
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="h-11 w-full justify-center gap-2 border-border/60"
                                onClick={handleWebAuthnLogin}
                                disabled={isWebAuthnLoading}
                            >
                                {isWebAuthnLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <KeyRound className="h-4 w-4" />
                                )}
                                Sign in with passkey
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                Use Touch ID, Face ID, Windows Hello, or a security key on this device.
                            </p>
                            {passkeyError ? <InlineError message={passkeyError} /> : null}
                        </div>
                    )}

                    {(hasPrimaryAuth || showPasskeySection) && showSocialSection && (
                        <SectionDivider label="Social accounts" />
                    )}

                    {!hasPrimaryAuth && !showPasskeySection && showSocialSection && (
                        <p className="text-center text-sm text-muted-foreground">
                            Continue with a connected account
                        </p>
                    )}

                    {showSocialSection && (
                        <div className="space-y-2.5">
                            {isLoadingSocialProviders && (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            {hasSocialProviders && (
                                <div className="grid gap-2.5">
                                    {socialProviders.map(({ provider, tenant_id }) => {
                                        const meta = SOCIAL_PROVIDER_META[provider];
                                        const Icon = meta?.icon;
                                        return (
                                            <Button
                                                key={`${tenant_id}-${provider}`}
                                                variant="outline"
                                                className={cn(
                                                    "h-11 w-full justify-center gap-2.5 border-border/60 font-normal",
                                                    meta?.buttonClass
                                                )}
                                                onClick={() => handleSocialLogin(provider, tenant_id)}
                                            >
                                                {meta?.imageSrc ? (
                                                    <Image
                                                        src={meta.imageSrc}
                                                        alt={meta.shortLabel}
                                                        width={18}
                                                        height={18}
                                                        className="rounded-sm object-contain"
                                                    />
                                                ) : Icon ? (
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                ) : null}
                                                <span>{meta?.label ?? `Continue with ${provider}`}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {!hasPrimaryAuth && !showPasskeySection && !showSocialSection && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No login methods are enabled for this organization.
                        </p>
                    )}
                </div>
            )}
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
