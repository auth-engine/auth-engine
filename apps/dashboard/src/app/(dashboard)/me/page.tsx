"use client"
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { UserResponse } from "@/lib/types";
import { format, parseISO, isValid } from "date-fns";
import {
    ShieldAlert,
    ShieldCheck,
    Mail,
    Smartphone,
    User as UserIcon,
    Calendar,
    Clock,
    Shield,
    Briefcase,
    Globe,
    Pencil,
    Send,
    Loader2,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileForm } from "./edit-profile-form";
import { toast } from "sonner";

export default function MeProfilePage() {
    const { user, activeTenantId } = useAuthStore();
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Phone verification state
    const [isPhoneVerifyOpen, setIsPhoneVerifyOpen] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState("");

    const resendVerificationMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/request-token", {
                email: user?.email,
                action_type: "email_verification",
                tenant_id: activeTenantId,
            });
        },
        onSuccess: () => {
            toast.success("Verification email sent! Check your inbox.");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to send verification email"));
        },
    });

    const requestPhoneOtpMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/request-token", {
                email: user?.email,
                action_type: "phone_verification",
                tenant_id: activeTenantId,
            });
        },
        onSuccess: () => {
            toast.success("OTP sent to your phone.");
            setIsPhoneVerifyOpen(true);
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to send OTP"));
        },
    });

    const verifyPhoneMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/verify-phone", null, {
                params: { user_id: user?.id, otp: phoneOtp },
            });
        },
        onSuccess: () => {
            toast.success("Phone number verified!");
            setIsPhoneVerifyOpen(false);
            setPhoneOtp("");
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Invalid or expired OTP"));
        },
    });

    if (!user) return null;

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "Never";
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "PPP p") : "Invalid Date";
    };

    const getInitials = () => {
        if (!user.first_name && !user.last_name) return user.username?.[0]?.toUpperCase() || "U";
        return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    };

    return (
        <div className="mx-auto max-w-6xl pb-10">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg shrink-0">
                    <AvatarImage src={user.avatar_url || ""} alt={user.username || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight truncate">
                        {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-muted-foreground mt-0.5">@{user.username}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="capitalize">
                            {user.status.toLowerCase()}
                        </Badge>
                        {user.mfa_enabled && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20">
                                <ShieldCheck className="h-3 w-3 mr-1" /> MFA Enabled
                            </Badge>
                        )}
                    </div>
                </div>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 shrink-0">
                            <Pencil className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>Update your personal information and profile settings.</DialogDescription>
                        </DialogHeader>
                        <EditProfileForm onSuccess={() => setIsEditOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Main Layout: left content + right sidebar ── */}
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

                {/* ── LEFT COLUMN ── */}
                <div className="space-y-6 min-w-0">

                    {/* Personal Information */}
                    <Card className="shadow-sm border-muted/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Personal Information</CardTitle>
                            </div>
                            <CardDescription>Your core identity details on the platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</p>
                                    <p className="text-sm font-medium">{user.first_name || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</p>
                                    <p className="text-sm font-medium">{user.last_name || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</p>
                                    <p className="text-sm font-medium font-mono text-primary">@{user.username || "—"}</p>
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                                {/* Email */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                    </div>
                                    {user.is_email_verified ? (
                                        <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-normal text-xs">
                                            <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                        </Badge>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/20 font-normal text-xs">
                                                <ShieldAlert className="h-3 w-3 mr-1" /> Unverified
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-primary px-2"
                                                onClick={() => resendVerificationMutation.mutate()}
                                                disabled={resendVerificationMutation.isPending}
                                            >
                                                {resendVerificationMutation.isPending
                                                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    : <Send className="h-3 w-3 mr-1" />}
                                                Resend
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</p>
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-medium">{user.phone_number || "Not provided"}</p>
                                    </div>
                                    {user.phone_number && (
                                        user.is_phone_verified ? (
                                            <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-normal text-xs">
                                                <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/20 font-normal text-xs">
                                                    <ShieldAlert className="h-3 w-3 mr-1" /> Unverified
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-primary px-2"
                                                    onClick={() => requestPhoneOtpMutation.mutate()}
                                                    disabled={requestPhoneOtpMutation.isPending}
                                                >
                                                    {requestPhoneOtpMutation.isPending
                                                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                        : <Send className="h-3 w-3 mr-1" />}
                                                    Verify
                                                </Button>
                                            </div>
                                        )
                                    )}

                                    <Dialog open={isPhoneVerifyOpen} onOpenChange={setIsPhoneVerifyOpen}>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Verify phone number</DialogTitle>
                                                <DialogDescription>
                                                    Enter the 6-digit code we sent to {user.phone_number}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-2">
                                                <Input
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    maxLength={6}
                                                    placeholder="123456"
                                                    value={phoneOtp}
                                                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                                                    className="text-center text-lg tracking-[0.5em]"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-primary px-2"
                                                    onClick={() => requestPhoneOtpMutation.mutate()}
                                                    disabled={requestPhoneOtpMutation.isPending}
                                                >
                                                    {requestPhoneOtpMutation.isPending
                                                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                        : <Send className="h-3 w-3 mr-1" />}
                                                    Resend code
                                                </Button>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={() => verifyPhoneMutation.mutate()}
                                                    disabled={phoneOtp.length !== 6 || verifyPhoneMutation.isPending}
                                                >
                                                    {verifyPhoneMutation.isPending
                                                        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        : null}
                                                    Verify
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Platform Roles & Tenant Access */}
                    <Card className="shadow-sm border-muted/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Roles & Tenant Access</CardTitle>
                            </div>
                            <CardDescription>Your permissions and assigned roles across tenants</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-muted/50">
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map((roleAssignment: UserResponse["roles"][number], idx: number) => (
                                        <div key={idx} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{roleAssignment.role.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xs line-clamp-2">
                                                        {roleAssignment.role.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                                                    <Globe className="h-3 w-3" />
                                                    <span className="font-mono">{roleAssignment.tenant_id}</span>
                                                </div>
                                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs">
                                                    Level {roleAssignment.role.level}
                                                </Badge>
                                                <Badge variant="outline" className="bg-muted border-muted-foreground/20 text-xs">
                                                    {roleAssignment.role.scope}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-10 text-center text-muted-foreground">
                                        <Briefcase className="h-8 w-8 mx-auto opacity-20 mb-3" />
                                        <p className="text-sm font-medium">No roles assigned yet.</p>
                                        <p className="text-xs opacity-70 mt-1">Contact an administrator for access.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
                {/* ── END LEFT COLUMN ── */}

                {/* ── RIGHT SIDEBAR ── */}
                <div className="space-y-6">

                    {/* Account Timeline */}
                    <Card className="shadow-sm border-muted/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Account Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Since</p>
                                    <p className="text-sm font-medium mt-0.5">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                            <Separator className="opacity-40" />
                            <div className="flex gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Activity</p>
                                    <p className="text-sm font-medium mt-0.5">{formatDate(user.last_login_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
                {/* ── END RIGHT SIDEBAR ── */}

            </div>
        </div>
    );
}
