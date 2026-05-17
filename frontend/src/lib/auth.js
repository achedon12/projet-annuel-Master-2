import CredentialsProvider from "next-auth/providers/credentials";
import { API_URL, Urls } from "@/utils/Api";

export const LOGIN_INVALID = "LOGIN_INVALID";
export const LOGIN_NETWORK = "LOGIN_NETWORK";

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
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.backendToken = user.backendToken;
                token.user = user.user;
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
