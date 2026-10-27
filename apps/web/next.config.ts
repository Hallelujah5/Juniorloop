import type { NextConfig } from 'next'
import { config } from 'dotenv'
import { join } from 'node:path'

// .env lives at the monorepo root (Next only auto-loads .env inside apps/web)
config({ path: join(__dirname, '..', '..', '.env') })

const nextConfig: NextConfig = {
  transpilePackages: ['@juniorloop/core', '@juniorloop/db'],
}

export default nextConfig
