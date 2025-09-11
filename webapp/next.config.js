/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'politicsandwar.com',
      'cdn.discordapp.com',
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
