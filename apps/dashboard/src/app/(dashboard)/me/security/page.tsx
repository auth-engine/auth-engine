"use client";

import { KeyRound, Smartphone, Lock, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PasskeyManagement from "@/components/security/PasskeyManagement";
import MFAManagement from "@/components/security/MFAManagement";
import LinkedAccounts from "@/components/security/LinkedAccounts";
import PasswordCard from "@/components/security/PasswordCard";

export default function SettingsPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your sign-in methods, linked accounts, and account security.
                </p>
            </div>

            <Tabs defaultValue="security" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-[560px]">
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" /> Accounts
                    </TabsTrigger>
                    <TabsTrigger value="mfa" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> Two-Factor
                    </TabsTrigger>
                    <TabsTrigger value="passkeys" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" /> Passkeys
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="security" className="space-y-6">
                    <PasswordCard />
                </TabsContent>

                <TabsContent value="accounts" className="space-y-6">
                    <LinkedAccounts />
                </TabsContent>

                <TabsContent value="mfa" className="space-y-6">
                    <MFAManagement />
                </TabsContent>

                <TabsContent value="passkeys" className="space-y-6">
                    <PasskeyManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
