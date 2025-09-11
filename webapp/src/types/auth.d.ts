import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      discordId?: string
      discordUsername?: string
      pwApiKey?: string
      pwNationId?: number
      pwNationName?: string
      currentAllianceId?: number
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    discordId?: string
    discordUsername?: string
    pwApiKey?: string
    pwNationId?: number
    pwNationName?: string
    currentAllianceId?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    discordId?: string
    discordUsername?: string
    pwApiKey?: string
    pwNationId?: number
    pwNationName?: string
    currentAllianceId?: number
  }
}
