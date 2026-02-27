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
    jwt({ token, account, profile }) {
      if (account) {
        token.access_token = account.access_token;
        token.role = (profile as any)?.role ?? null;
      }
      return token;
    },
    session({ session, token }) {
      (session as any).access_token = token.access_token;
      (session as any).user.role = token.role ?? null;
      return session;
    },
  },
});
