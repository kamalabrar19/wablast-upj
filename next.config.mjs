/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },

  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          "@whiskeysockets/baileys",
          "ws",
          "bufferutil",
          "utf-8-validate",
          "pino",
          "pino-pretty"
        );
      }
    }
    return config;
  },
};

export default nextConfig;
