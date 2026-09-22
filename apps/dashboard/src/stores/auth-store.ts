import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserResponse } from "@/lib/types";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: UserResponse | null;
    activeTenantId: string | null;

    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (user: UserResponse) => void;
    setActiveTenantId: (tenantId: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            activeTenantId: null,

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            setUser: (user) => set({ user }),

            setActiveTenantId: (activeTenantId) => set({ activeTenantId }),

            logout: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                    activeTenantId: null,
                }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                activeTenantId: state.activeTenantId,
                user: state.user,
            }),
        }
    )
);
