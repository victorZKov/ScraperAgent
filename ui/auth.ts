import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    {
      id: "quantumid",
      name: "QuantumID",
      type: "oidc",
      issuer: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
      clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: {
        params: { scope: "openid profile email offline_access" },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? profile.username ?? null,
          email: profile.email ?? null,
          image: profile.picture ?? null,
        };
      },
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
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.access_token = account.access_token;
        token.role = (profile as any)?.role ?? null;

        // QuantumID doesn't include name/email in ID token — fetch from userinfo
        if (account.access_token && !token.name && !token.email) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/connect/userinfo`,
              { headers: { Authorization: `Bearer ${account.access_token}` } }
            );
            if (res.ok) {
              const userinfo = await res.json();
              console.log("[auth] userinfo:", JSON.stringify(userinfo));
              token.name = userinfo.name ?? userinfo.preferred_username ?? userinfo.username ?? userinfo.email ?? null;
              token.email = userinfo.email ?? null;
            }
          } catch (e) {
            console.error("[auth] userinfo fetch failed:", e);
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      (session as any).access_token = token.access_token;
      (session as any).user.role = token.role ?? null;
      if (token.name) session.user.name = token.name as string;
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },
});
