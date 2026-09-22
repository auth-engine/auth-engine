"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage, isNotAllowedError } from "@/lib/errors";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    Loader2,
    ShieldCheck,
    Laptop,
    Smartphone,
    Fingerprint
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface WebAuthnCredential {
    id: string;
    device_name: string;
    created_at: string;
    last_used_at?: string | null;
    is_backup?: boolean;
}

export default function PasskeyManagement() {
    const queryClient = useQueryClient();
    const [newDeviceName, setNewDeviceName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // 1. Fetch credentials
    const { data: creds, isLoading } = useQuery<WebAuthnCredential[]>({
        queryKey: ["passkeys"],
        queryFn: async () => {
            const { data } = await apiClient.get<{ credentials: WebAuthnCredential[] }>("/me/webauthn/credentials");
            return data.credentials;
        },
    });

    // 2. Add Passkey
    const registerMutation = useMutation({
        mutationFn: async (deviceName: string) => {
            // 1. Get options
            const { data: beginData } = await apiClient.post("/auth/webauthn/register/begin");
            // 2. Call browser API
            const attestation = await startRegistration({
                optionsJSON: beginData.options,
            });
            const credentialPayload = {
                id: attestation.id,
                rawId: attestation.rawId,
                type: attestation.type,
                response: attestation.response,
            };

            // 3. Complete registration
            await apiClient.post("/auth/webauthn/register/complete", {
                credential: credentialPayload,
                device_name: deviceName,
            });
        },
        onSuccess: () => {
            toast.success("Passkey successfully registered!");
            setIsAdding(false);
            setNewDeviceName("");
            queryClient.invalidateQueries({ queryKey: ["passkeys"] });
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: unknown) => {
            if (isNotAllowedError(error)) return;
            console.error(error);
            toast.error(getApiErrorMessage(error, "Failed to register passkey. Try another browser or device."));
        },
    });

    // 3. Delete Passkey
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/me/webauthn/credentials/${id}`);
        },
        onSuccess: () => {
            toast.success("Passkey removed");
            queryClient.invalidateQueries({ queryKey: ["passkeys"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to remove passkey"));
        },
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle>Passkeys</CardTitle>
                        <CardDescription>
                            Use biometrics or security keys for faster, more secure sign-ins.
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                        <Plus className="mr-2 h-4 w-4" /> Add Passkey
                    </Button>
                </CardHeader>
                <CardContent>
                    {isAdding && (
                        <div className="mb-6 p-4 border-2 border-primary/20 bg-primary/5 rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Register new Passkey</h4>
                                <p className="text-xs text-muted-foreground">Give your device a name to identify it later.</p>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. MacBook Pro, YubiKey Blue"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                />
                                <Button
                                    variant="default"
                                    onClick={() => registerMutation.mutate(newDeviceName || "New Device")}
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Continue
                                </Button>
                                <Button variant="ghost" onClick={() => { setIsAdding(false); setNewDeviceName(""); }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : creds?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl border-muted bg-muted/20">
                            <Fingerprint className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                            <p className="text-sm font-medium">No passkeys registered yet.</p>
                            <p className="text-xs text-muted-foreground max-w-[300px] mt-1">
                                Registering a passkey allows you to sign in without typing a password.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {creds?.map((cred) => (
                                <div
                                    key={cred.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-sm group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-muted rounded-full group-hover:bg-primary/5">
                                            {cred.is_backup ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Laptop className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <p className="text-sm font-semibold">{cred.device_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Added {new Date(cred.created_at).toLocaleDateString()} • Last used {cred.last_used_at ? new Date(cred.last_used_at).toLocaleDateString() : 'Never'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="hidden sm:inline-flex bg-primary/5 text-primary border-primary/20">
                                            Passkey
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => deleteMutation.mutate(cred.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 border-t border-border">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Passkeys are a more secure, easy-to-use alternative to passwords. They are stored on your device and protected by biometrics.
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
