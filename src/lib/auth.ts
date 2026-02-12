import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        user_login: { label: "Логин", type: "text" },
        user_password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.user_login || !credentials?.user_password) {
          throw new Error("Введите логин и пароль");
        }

        const user = await prisma.user.findFirst({
          where: { 
            user_login: credentials.user_login 
          }
        });

        if (!user) {
          throw new Error("Неверный логин или пароль");
        }

        if (credentials.user_password !== user.user_password) {
          throw new Error("Неверный логин или пароль");
        }

        return {
          id: user.user_id.toString(),
          user_login: user.user_login,
          admin_role: user.admin_role,
          SMM_role: user.SMM_role,
          designer_role: user.designer_role,
          videomaker_role: user.videomaker_role,
          coordinator_role: user.coordinator_role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.user_login = user.user_login;
        token.admin_role = user.admin_role;
        token.SMM_role = user.SMM_role;
        token.designer_role = user.designer_role;
        token.videomaker_role = user.videomaker_role;
        token.coordinator_role = user.coordinator_role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user = {
          id: token.id,
          user_login: token.user_login,
          admin_role: token.admin_role,
          SMM_role: token.SMM_role,
          designer_role: token.designer_role,
          videomaker_role: token.videomaker_role,
          coordinator_role: token.coordinator_role,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};