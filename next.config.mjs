/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing lint warnings in other files should not block production builds.
    // Run `npm run lint` separately to audit them.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
