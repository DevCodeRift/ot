import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

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
      isAdmin?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    discordId?: string
    discordUsername?: string
    pwApiKey?: string
    pwNationId?: number
    pwNationName?: string
    currentAllianceId?: number
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    discordId?: string
    discordUsername?: string
    pwApiKey?: string
    pwNationId?: number
    pwNationName?: string
    currentAllianceId?: number
    isAdmin?: boolean
  }
}
