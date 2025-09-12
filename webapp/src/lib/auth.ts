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
          scope: "identify email"
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
            isAdmin: true,
          }
        })

        if (dbUser) {
          token.discordId = dbUser.discordId
          token.discordUsername = dbUser.discordUsername
          token.pwApiKey = dbUser.pwApiKey
          token.pwNationId = dbUser.pwNationId
          token.pwNationName = dbUser.pwNationName
          token.currentAllianceId = dbUser.currentAllianceId
          token.isAdmin = dbUser.isAdmin
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
            isAdmin: true,
          }
        })

        if (dbUser) {
          token.discordId = dbUser.discordId
          token.discordUsername = dbUser.discordUsername
          token.pwApiKey = dbUser.pwApiKey
          token.pwNationId = dbUser.pwNationId
          token.pwNationName = dbUser.pwNationName
          token.currentAllianceId = dbUser.currentAllianceId
          token.isAdmin = dbUser.isAdmin
        }

        // Store Discord info if this is a new login
        if (account?.provider === "discord") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: account.providerAccountId,
              discordUsername: user.name || undefined,
            }
          })
          token.discordId = account.providerAccountId
          token.discordUsername = user.name || undefined
        }
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
        session.user.isAdmin = token.isAdmin
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
}
