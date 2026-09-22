/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  ...(process.env.NODE_ENV === "production"
    ? { output: "standalone" as const }
    : {}),
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.localhost",
    "app.authengine.org",
    "api.authengine.org",
  ],
};

export default nextConfig;
