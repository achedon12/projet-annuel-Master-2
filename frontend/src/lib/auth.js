import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { API_URL, Urls } from "@/utils/Api";

export const LOGIN_INVALID = "LOGIN_INVALID";
export const LOGIN_NETWORK = "LOGIN_NETWORK";
export const LOGIN_GOOGLE_REJECTED = "LOGIN_GOOGLE_REJECTED";

/**
 * Échange un id_token Google contre un JWT backend.
 * Le backend vérifie la signature via JWKS Google et crée/retrouve le user.
 */
const exchangeGoogleIdToken = async (idToken) => {
    const res = await fetch(`${API_URL}${Urls.auth.google}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
        throw new Error(LOGIN_GOOGLE_REJECTED);
    }
    const data = await res.json().catch(() => null);
    if (!data?.token || !data?.user) {
        throw new Error(LOGIN_GOOGLE_REJECTED);
    }
    return data;
};

export const authOptions = {
    session: { strategy: "jwt" },
    pages: { signIn: "/auth" },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim();
                const password = credentials?.password;
                if (!email || !password) return null;

                let res;
                try {
                    res = await fetch(`${API_URL}${Urls.auth.login}`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ email, password }),
                    });
                } catch (err) {
                    throw new Error(LOGIN_NETWORK);
                }

                if (!res.ok) {
                    throw new Error(LOGIN_INVALID);
                }

                const data = await res.json().catch(() => null);
                if (!data?.token || !data?.user) {
                    throw new Error(LOGIN_INVALID);
                }

                return {
                    id: String(data.user.id),
                    email: data.user.email,
                    name: data.user.name,
                    image: data.user.avatar ?? null,
                    backendToken: data.token,
                    user: data.user,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            // Scopes minimaux pour le Sign-In. Calendar demande son propre
            // consentement séparé via /auth/google-calendar/callback.
            authorization: { params: { scope: "openid email profile" } },
        }),
    ],
    callbacks: {
        async signIn({ account, profile }) {
            // Pour Google : on échange l'id_token contre un JWT backend avant
            // de laisser NextAuth ouvrir la session. Si l'échange plante, on
            // refuse l'auth (NextAuth redirige vers /auth?error=...).
            if (account?.provider === "google") {
                const idToken = account.id_token;
                if (!idToken) {
                    throw new Error(LOGIN_GOOGLE_REJECTED);
                }
                try {
                    const data = await exchangeGoogleIdToken(idToken);
                    // On stocke temporairement le backend payload sur le profile
                    // pour que le callback jwt puisse le récupérer.
                    profile._backend = data;
                    return true;
                } catch (err) {
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, profile, trigger, session }) {
            // CredentialsProvider : `user` contient déjà backendToken/user.
            if (user?.backendToken) {
                token.id = user.id;
                token.backendToken = user.backendToken;
                token.user = user.user;
            }
            // GoogleProvider : on attache le backend payload posé dans signIn().
            if (account?.provider === "google" && profile?._backend) {
                const data = profile._backend;
                token.id = String(data.user.id);
                token.backendToken = data.token;
                token.user = data.user;
            }
            if (trigger === "update" && session?.user) {
                token.user = { ...(token.user ?? {}), ...session.user };
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...(session.user ?? {}),
                    ...(token.user ?? {}),
                    id: token.id,
                };
                session.backendToken = token.backendToken;
            }
            return session;
        },
    },
};
