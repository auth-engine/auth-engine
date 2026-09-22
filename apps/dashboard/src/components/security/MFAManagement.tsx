"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
    ShieldCheck,
    ShieldAlert,
    Loader2,
    Smartphone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";

export default function MFAManagement() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [isEnrolling, setIsEnrolling] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");

    const [enrollData, setEnrollData] = useState<{
        provisioning_uri: string;
        secret: string;
        message?: string;
    } | null>(null);

    const [qrCode, setQrCode] = useState("");

    // Generate QR code when provisioning_uri is received
    useEffect(() => {
        if (!enrollData?.provisioning_uri) return;

        QRCode.toDataURL(enrollData.provisioning_uri)
            .then(setQrCode)
            .catch(console.error);
    }, [enrollData]);

    // Fetch MFA status
    const { data: mfaStatus, isLoading: isLoadingStatus } = useQuery({
        queryKey: ["mfaStatus"],
        queryFn: async () => {
            const { data } = await apiClient.get("/me/mfa/status");
            return data;
        },
    });

    // Start Enrollment
    const enrollMutation = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post("/me/mfa/enroll");
            return data;
        },
        onSuccess: (data) => {
            setEnrollData(data);
            setIsEnrolling(true);
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to start MFA enrollment"));
        },
    });

    // Verify Enrollment
    const verifyMutation = useMutation({
        mutationFn: async (code: string) => {
            const { data } = await apiClient.post("/me/mfa/verify", { code });
            return data;
        },
        onSuccess: () => {
            toast.success("MFA successfully enabled!");
            setIsEnrolling(false);
            setEnrollData(null);
            setVerificationCode("");

            queryClient.invalidateQueries({ queryKey: ["mfaStatus"] });
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Invalid verification code"));
        },
    });

    // Disable MFA
    const disableMutation = useMutation({
        mutationFn: async (code: string) => {
            const { data } = await apiClient.delete("/me/mfa/disable", { data: { code } });
            return data;
        },
        onSuccess: () => {
            toast.success("MFA successfully disabled");

            queryClient.invalidateQueries({ queryKey: ["mfaStatus"] });
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to disable MFA. Check your code."));
        },
    });

    if (isLoadingStatus) {
        return (
            <Card>
                <CardContent className="py-10 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const mfaEnabled = mfaStatus?.mfa_enabled || user?.mfa_enabled;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle>Two-Factor Authentication (TOTP)</CardTitle>
                        <CardDescription>
                            Protect your account by requiring a code from an authenticator app.
                        </CardDescription>
                    </div>

                    <Badge variant={mfaEnabled ? "default" : "secondary"} className="h-6">
                        {mfaEnabled ? (
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Enabled
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Disabled
                            </span>
                        )}
                    </Badge>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* Enable MFA */}
                    {!mfaEnabled && !isEnrolling && (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Smartphone className="h-10 w-10 text-primary" />
                            </div>

                            <div className="max-w-[400px] space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Use Google Authenticator, Microsoft Authenticator, or another
                                    TOTP app to generate secure login codes.
                                </p>

                                <Button
                                    onClick={() => enrollMutation.mutate()}
                                    disabled={enrollMutation.isPending}
                                >
                                    {enrollMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Enable 2FA
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Enrollment UI */}
                    {isEnrolling && enrollData && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-8 items-start">

                                {/* QR Code */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm">1. Scan QR Code</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Scan this QR code using Google Authenticator,
                                            Microsoft Authenticator, or another TOTP app.
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border-2 border-primary/20 inline-block">
                                        {qrCode && (
                                            <Image
                                                src={qrCode}
                                                alt="MFA QR Code"
                                                width={192}
                                                height={192}
                                                className="w-48 h-48"
                                                unoptimized
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-mono bg-muted p-2 rounded max-w-[340px]">
                                            Manual Code: {enrollData.secret}
                                        </p>
                                    </div>
                                </div>

                                {/* Verification */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-sm">2. Verify Setup</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Enter the 6-digit code generated by your authenticator app.
                                        </p>
                                    </div>

                                    <Input
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) =>
                                            setVerificationCode(
                                                e.target.value.replace(/\D/g, "").slice(0, 6)
                                            )
                                        }
                                        className="text-2xl tracking-[0.5em] text-center font-bold h-14"
                                    />

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            onClick={() => verifyMutation.mutate(verificationCode)}
                                            disabled={
                                                verifyMutation.isPending || verificationCode.length < 6
                                            }
                                        >
                                            {verifyMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Confirm & Enable
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEnrolling(false);
                                                setEnrollData(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Disable MFA */}
                    {mfaEnabled && (
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-destructive">
                                    Disable Two-Factor Authentication
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    We strongly recommend keeping 2FA enabled to protect your account.
                                </p>
                            </div>

                            <div className="flex gap-2 max-w-[300px]">
                                <Input
                                    placeholder="Verification Code"
                                    className="text-center font-mono"
                                    value={verificationCode}
                                    onChange={(e) =>
                                        setVerificationCode(e.target.value.slice(0, 6))
                                    }
                                />

                                <Button
                                    variant="destructive"
                                    onClick={() => disableMutation.mutate(verificationCode)}
                                    disabled={
                                        disableMutation.isPending || verificationCode.length < 6
                                    }
                                >
                                    {disableMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Disable
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}