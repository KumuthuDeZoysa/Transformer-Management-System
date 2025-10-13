/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Configure for client-side only canvas usage
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force konva to use browser version only
      'konva': isServer ? false : 'konva/lib/index.js',
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
      }
      
      // Completely ignore konva's node-specific files
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
          contextRegExp: /konva/,
        })
      )
    } else {
      // On server, make konva and react-konva return empty objects
      config.resolve.alias = {
        ...config.resolve.alias,
        'konva': false,
        'react-konva': false,
      }
    }
    
    config.module = {
      ...config.module,
      exprContextCritical: false,
    }
    
    return config
  },
}

export default nextConfig
