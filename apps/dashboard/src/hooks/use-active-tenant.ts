"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { TenantResponse } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

export function useActiveTenant() {
    const { activeTenantId } = useAuthStore();

    const { data: tenants = [], isLoading } = useQuery<TenantResponse[]>({
        queryKey: ["myTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantResponse[]>("/me/tenants");
            return data;
        },
    });

    const activeTenant =
        tenants.find((tenant) => tenant.id === activeTenantId) ?? null;

    return {
        activeTenantId,
        activeTenant,
        tenants,
        isLoading,
        isReady: !isLoading && !!activeTenantId && !!activeTenant,
        isPlatformTenant: activeTenant?.type === "PLATFORM",
    };
}
