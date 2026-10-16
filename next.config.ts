import type { NextConfig } from 'next'

const config: NextConfig = {
  logging: { incomingRequests: false },
  turbopack: { root: process.cwd() },
  webpack(config, { dev }) {
    if (dev) config.watchOptions = { ...config.watchOptions, poll: 1000, aggregateTimeout: 200 }
    return config
  },
}

export default config
