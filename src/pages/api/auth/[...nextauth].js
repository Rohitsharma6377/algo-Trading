import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createAuditLog } from '@/lib/utils/audit';

/**
 * NextAuth configuration
 * Supports email/password and Google OAuth
 */
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          await connectDB();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          if (!user.isActive) {
            throw new Error('Account is deactivated');
          }

          if (!user.password) {
            throw new Error('Please use OAuth to login');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Create audit log
          await createAuditLog({
            userId: user._id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            status: 'success',
          });

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          await connectDB();

          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user from Google OAuth
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              provider: 'google',
              providerId: account.providerAccountId,
              emailVerified: true,
              role: 'trader',
            });

            await createAuditLog({
              userId: existingUser._id,
              userEmail: existingUser.email,
              action: 'USER_REGISTER_OAUTH',
              status: 'success',
            });
          } else if (!existingUser.isActive) {
            return false;
          }

          // Update last login
          existingUser.lastLogin = new Date();
          await existingUser.save();

          return true;
        } catch (error) {
          console.error('Google OAuth error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Fetch latest user data on subsequent requests
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email }).select('role isActive');
        if (dbUser) {
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
