import { useSyncExternalStore } from "react";

function subscribe() {
    return () => {};
}

export function useIsClient() {
    return useSyncExternalStore(subscribe, () => true, () => false);
}
