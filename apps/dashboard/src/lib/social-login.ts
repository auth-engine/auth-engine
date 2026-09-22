import type { IconType } from "react-icons";
import { FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";

export interface PublicOAuthProvider {
    provider: string;
    tenant_id: string;
}

export { getPlatformTenantId } from "@/lib/public-env";

export const SOCIAL_PROVIDER_META: Record<
    string,
    { label: string; shortLabel: string; icon?: IconType; imageSrc?: string; buttonClass?: string }
> = {
    google: {
        label: "Continue with Google",
        shortLabel: "Google",
        icon: FaGoogle,
        buttonClass: "hover:border-red-400/50 hover:bg-red-500/5",
    },
    github: {
        label: "Continue with GitHub",
        shortLabel: "GitHub",
        icon: FaGithub,
        buttonClass: "hover:border-foreground/20 hover:bg-muted/50",
    },
    microsoft: {
        label: "Continue with Microsoft",
        shortLabel: "Microsoft",
        icon: FaMicrosoft,
        buttonClass: "hover:border-blue-400/50 hover:bg-blue-500/5",
    },
    authengine: {
        label: "Continue with AuthEngine",
        shortLabel: "AuthEngine",
        imageSrc: "/squarelogo.png",
        buttonClass: "hover:border-primary/50 hover:bg-primary/5",
    },
};
