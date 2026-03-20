/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/v2",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
