"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function PasswordCard() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const hasPassword = user?.auth_strategies?.includes("email_password");

    const resetFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const setPasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            await apiClient.post("/auth/set-password", {
                new_password: password,
                confirm_password: confirmPassword,
            });
        },
        onSuccess: () => {
            toast.success("Password set successfully!");
            setIsSetPasswordOpen(false);
            resetFields();
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to set password"));
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/update-password", {
                current_password: currentPassword,
                new_password: newPassword,
            });
        },
        onSuccess: () => {
            toast.success("Password updated successfully!");
            setIsChangePasswordOpen(false);
            resetFields();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to update password"));
        },
    });

    if (!user) return null;

    return (
        <Card className="shadow-sm border-muted/50">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle>Password & Sign-in</CardTitle>
                </div>
                <CardDescription>Manage the password used to sign in to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasPassword ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Password</p>
                            <p className="text-xs text-muted-foreground">None set — you sign in with social login.</p>
                        </div>
                        <Dialog open={isSetPasswordOpen} onOpenChange={setIsSetPasswordOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                    <Lock className="mr-1 h-3 w-3" /> Set Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Set Account Password</DialogTitle>
                                    <DialogDescription>
                                        Add a password to enable email/password login alongside your social logins.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? "text" : "password"}
                                                className="pr-10"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Confirm Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pr-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-destructive font-medium">New and confirm passwords do not match.</p>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() => setPasswordMutation.mutate(newPassword)}
                                        disabled={setPasswordMutation.isPending || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                                    >
                                        {setPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Set Password
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">Password</p>
                            <p className="text-xs text-muted-foreground">Email &amp; password active.</p>
                        </div>
                        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                    <Lock className="mr-1 h-3 w-3" /> Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your current password and a new one to update your credentials.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Current Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="pr-10"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? "text" : "password"}
                                                className="pr-10"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Confirm New Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pr-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-destructive font-medium">New and confirm passwords do not match.</p>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() => changePasswordMutation.mutate()}
                                        disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                                    >
                                        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Password
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                <Separator className="opacity-40" />

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active sign-in methods</p>
                    <div className="flex flex-wrap gap-1.5">
                        {user.auth_strategies?.map((strategy: string) => (
                            <Badge key={strategy} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/5 text-primary border-primary/10">
                                {strategy.replace("_", " ")}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
