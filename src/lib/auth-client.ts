import { createAuthClient } from "better-auth/react";
import { usernameClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "",
  plugins: [
    usernameClient(),
    emailOTPClient(),
  ],
});

export const { useSession, signIn, signUp, signOut, $Infer } = authClient;
