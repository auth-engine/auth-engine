import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
            return detail
                .map((item) =>
                    typeof item === "object" && item !== null && "msg" in item
                        ? String((item as { msg: unknown }).msg)
                        : String(item)
                )
                .join(", ");
        }
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

function getErrorName(error: unknown): string | null {
    if (error instanceof DOMException || error instanceof Error) {
        return error.name;
    }
    if (error && typeof error === "object" && "name" in error) {
        return String((error as { name: unknown }).name);
    }
    return null;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object" && "message" in error) {
        return String((error as { message: unknown }).message);
    }
    return "";
}

/** User dismissed the passkey prompt, or the browser timed out waiting for input. */
export function isNotAllowedError(error: unknown): boolean {
    const name = getErrorName(error);
    if (name === "NotAllowedError" || name === "AbortError") return true;

    const message = getErrorMessage(error).toLowerCase();
    if (
        message.includes("not allowed") ||
        message.includes("timed out") ||
        message.includes("cancelled") ||
        message.includes("canceled") ||
        message.includes("operation was aborted")
    ) {
        return true;
    }

    if (error && typeof error === "object" && "cause" in error) {
        return isNotAllowedError((error as { cause: unknown }).cause);
    }

    return false;
}
