export function RuntimeEnv() {
    const config = {
        API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
        APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
        PLATFORM_TENANT_ID: process.env.NEXT_PUBLIC_PLATFORM_TENANT_ID ?? "",
    };

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `window.__PUBLIC_ENV__=${JSON.stringify(config)}`,
            }}
        />
    );
}
