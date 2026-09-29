/** @type {import('next').NextConfig} */
const nextConfig = {
    // Standalone output for Render deployment
    output: "standalone",

    // Suppress build-time DB connection errors on static pages
    experimental: {
        serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    },
};

export default nextConfig;
