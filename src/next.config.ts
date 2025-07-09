import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // This is to fix a warning from genkit's dependency on opentelemetry.
    // It's an optional dependency that is not used in this app.
    config.externals.push('@opentelemetry/exporter-jaeger');

    // This is to suppress a warning from handlebars, a dependency of genkit.
    // It's a harmless warning about a deprecated feature.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/handlebars/,
        message: /require\.extensions/,
      },
    ];

    return config;
  },
};

export default nextConfig;
