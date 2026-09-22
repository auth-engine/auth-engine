declare global {
    interface Window {
        __PUBLIC_ENV__?: {
            API_URL: string;
            APP_URL: string;
            PLATFORM_TENANT_ID: string;
        };
    }
}

export type PublicEnv = {
    API_URL: string;
    APP_URL: string;
    PLATFORM_TENANT_ID: string;
};

export function getPublicEnv(): PublicEnv {
    if (typeof window !== "undefined" && window.__PUBLIC_ENV__) {
        return window.__PUBLIC_ENV__;
    }

    return {
        API_URL: process.env.NEXT_PUBLIC_API_URL || "",
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
        PLATFORM_TENANT_ID: process.env.NEXT_PUBLIC_PLATFORM_TENANT_ID || "",
    };
}

export function getPlatformTenantId(): string {
    return getPublicEnv().PLATFORM_TENANT_ID;
}
