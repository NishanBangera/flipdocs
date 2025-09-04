import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Set turbopack root to fix warnings
  turbopack: {
    root: '../../',
  },
  
  webpack: (config, { isServer }) => {
    // Handle Three.js on the server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'three': 'three',
        '@react-three/fiber': '@react-three/fiber',
        '@react-three/drei': '@react-three/drei',
      });
    }

    // Handle canvas and other browser-specific modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false,
    };

    // Handle PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },

  // Optimize images and assets
  images: {
    domains: ['localhost'],
    dangerouslyAllowSVG: true,
  },

  // Handle static files for PDF.js
  async headers() {
    return [
      {
        source: '/flipbook/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
