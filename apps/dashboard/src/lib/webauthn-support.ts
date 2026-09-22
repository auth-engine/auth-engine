/** Returns whether the browser can use WebAuthn / passkeys on this device. */
export function isWebAuthnSupported(): boolean {
    if (typeof window === "undefined") return false;
    return window.isSecureContext && typeof PublicKeyCredential !== "undefined";
}
