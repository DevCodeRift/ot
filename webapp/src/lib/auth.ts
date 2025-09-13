import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // If this is a session update trigger, refresh user data from database
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            discordId: true,
            discordUsername: true,
            pwApiKey: true,
            pwNationId: true,
            pwNationName: true,
            currentAllianceId: true,
          }
        })

        if (dbUser) {
          token.discordId = dbUser.discordId || undefined
          token.discordUsername = dbUser.discordUsername || undefined
          token.pwApiKey = dbUser.pwApiKey || undefined
          token.pwNationId = dbUser.pwNationId || undefined
          token.pwNationName = dbUser.pwNationName || undefined
          token.currentAllianceId = dbUser.currentAllianceId || undefined
        }
        
        return token
      }

      if (user) {
        token.id = user.id
        
        // Get user data from database to include P&W info
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            discordId: true,
            discordUsername: true,
            pwApiKey: true,
            pwNationId: true,
            pwNationName: true,
            currentAllianceId: true,
          }
        })

        if (dbUser) {
          token.discordId = dbUser.discordId || undefined
          token.discordUsername = dbUser.discordUsername || undefined
          token.pwApiKey = dbUser.pwApiKey || undefined
          token.pwNationId = dbUser.pwNationId || undefined
          token.pwNationName = dbUser.pwNationName || undefined
          token.currentAllianceId = dbUser.currentAllianceId || undefined
        }

        // Store Discord info from account if available
        if (account?.provider === "discord") {
          token.discordId = account.providerAccountId
          token.discordUsername = user.name || undefined
          token.accessToken = account.access_token
        }
      }

      // Store access token from account
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.discordId = token.discordId
        session.user.discordUsername = token.discordUsername
        session.user.pwApiKey = token.pwApiKey
        session.user.pwNationId = token.pwNationId
        session.user.pwNationName = token.pwNationName
        session.user.currentAllianceId = token.currentAllianceId
        session.accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata)
    },
    warn(code) {
      console.warn("NextAuth Warning:", code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("NextAuth Debug:", code, metadata)
      }
    }
  }
}
