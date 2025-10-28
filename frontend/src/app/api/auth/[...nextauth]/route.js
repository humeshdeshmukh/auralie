import NextAuth from 'next-auth';
import { FirestoreAdapter } from '@next-auth/firebase-adapter';
import { getAuth } from 'firebase-admin/auth';
import { cert } from 'firebase-admin/app';

// Initialize Firebase Admin
const firebaseAdminConfig = {
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
};

const auth = getAuth();

export const authOptions = {
  providers: [
    // Add your authentication providers here
    // Example with Google:
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  adapter: FirestoreAdapter({
    credential: firebaseAdminConfig.credential
  }),
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
