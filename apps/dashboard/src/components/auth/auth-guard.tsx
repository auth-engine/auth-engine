"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { AuthResponse } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { accessToken, user, setUser, logout } = useAuthStore();
    const isClient = useIsClient();
    const [hasHydrated, setHasHydrated] = useState(
        () => useAuthStore.persist?.hasHydrated() ?? false
    );

    useEffect(() => {
        const persistApi = useAuthStore.persist;
        if (!persistApi || persistApi.hasHydrated()) return;
        return persistApi.onFinishHydration(() => setHasHydrated(true));
    }, []);

    const { isLoading: isVerifying } = useQuery({
        queryKey: ["verifyUser", accessToken],
        queryFn: async () => {
            if (!accessToken) return null;
            try {
                const { data } = await apiClient.get<AuthResponse["user"]>("/me/");
                if (data) {
                    setUser(data);
                }
                return data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    logout();
                }
                return null;
            }
        },
        enabled: !!accessToken && isClient && hasHydrated,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!hasHydrated || !isClient || isVerifying) return;

        if (!accessToken) {
            const returnTo = encodeURIComponent(pathname);
            router.push(`/login?returnTo=${returnTo}`);
        }
    }, [accessToken, hasHydrated, isClient, isVerifying, pathname, router]);

    const waitingForAuth = !isClient || !hasHydrated;
    const waitingForVerify = isVerifying && !user;

    if (waitingForAuth || waitingForVerify) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!accessToken || !user) {
        return null;
    }

    return <>{children}</>;
}
