import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "quantumid",
      name: "QuantumID",
      type: "oidc",
      issuer: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
      clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
    },
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPath = ["/dashboard", "/settings", "/reports"].some(
        (p) => nextUrl.pathname.startsWith(p)
      );
      if (isAdminPath) return isLoggedIn;
      return true;
    },
    jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).access_token = token.access_token;
      return session;
    },
  },
});
