import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: { signIn: "/auth" },
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/history/:path*",
        "/ideas/:path*",
        "/settings/:path*",
        "/editor/:path*",
    ],
};
