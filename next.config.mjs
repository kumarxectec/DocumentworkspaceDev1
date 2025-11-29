/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
    basePath: "/DocumentWorkspace",  // ✅ Ensure this matches IIS site path
    assetPrefix: "/DocumentWorkspace/", // ✅ Ensures correct static file paths
    trailingSlash: true, // ✅ Helps with IIS routing


    turbopack: {},

    async rewrites() {
        return [
            {
                source: "/_next/:path*",
                destination: "/DocumentWorkspace/_next/:path*", // ✅ Fix for static assets
            },
        ];
    },
};

export default nextConfig;