import type { NextConfig } from 'next'
import { config } from 'dotenv'
import { join } from 'node:path'

// .env nằm ở gốc monorepo (Next chỉ tự đọc .env trong apps/web)
config({ path: join(__dirname, '..', '..', '.env') })

const nextConfig: NextConfig = {
  transpilePackages: ['@juniorloop/core', '@juniorloop/db'],
}

export default nextConfig
