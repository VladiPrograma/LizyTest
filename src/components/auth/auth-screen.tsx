"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

type FormState = {
  firstName: string;
  email: string;
  password: string;
};

type FeedbackState = {
  tone: "error" | "success" | "idle";
  message: string;
};

const navigationItems = ["Who we are", "Services", "Blog"];

const initialFormState: FormState = {
  firstName: "",
  email: "",
  password: "",
};

const firebaseErrorMessages: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/invalid-email": "The email format is invalid.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "The password is too weak.",
    "auth/missing-password": "You must enter a password.",
    "auth/missing-email": "You must enter an email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "You closed the Google sign-in window.",
    "auth/cancelled-popup-request": "The Google sign-in request was cancelled.",
    "auth/popup-blocked": "The browser blocked the Google popup window.",
};

const normalizeFirebaseMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "The request could not be completed.";
  }

  const errorCode = "code" in error && typeof error.code === "string" ? error.code : null;

  if (errorCode && firebaseErrorMessages[errorCode]) {
    return firebaseErrorMessages[errorCode];
  }

  const errorMessage =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "The request could not be completed.";

  return errorMessage
    .replace(/^firebase:\s*/i, "")
    .replace(/\s*\(auth\/[^)]+\)\.?$/i, "")
    .trim();
};

function InputShell({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  rightAdornment,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rightAdornment?: React.ReactNode;
}) {
  return (
    <label className="flex h-[48px] items-center rounded-[16px] border border-[#b8b8b8] bg-white px-4 text-[#818181] shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      <span className="mr-3 flex shrink-0 items-center text-[#727272]">{icon}</span>
      <input
        className="w-full border-none bg-transparent text-[16px] font-medium text-[#3a3a3a] outline-none placeholder:text-[#777777]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {rightAdornment ? <span className="ml-3 flex shrink-0 items-center">{rightAdornment}</span> : null}
    </label>
  );
}

export function AuthScreen() {
  const { login, register, sendPasswordReset, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback({ tone: "idle", message: "" });

    startTransition(async () => {
      try {
        if (mode === "register") {
          await register({
            email: form.email,
            password: form.password,
            displayName: form.firstName || undefined,
            persistence: "local",
          });
          setFeedback({ tone: "success", message: "Account created successfully." });
          return;
        }

        await login({
          email: form.email,
          password: form.password,
          persistence: "local",
        });
        setFeedback({ tone: "success", message: "Signed in successfully." });
      } catch (error) {
        setFeedback({ tone: "error", message: normalizeFirebaseMessage(error) });
      }
    });
  };

  const handlePasswordReset = () => {
    if (!form.email) {
      setFeedback({ tone: "error", message: "Enter your email to recover your password." });
      return;
    }

    setFeedback({ tone: "idle", message: "" });

    startTransition(async () => {
      try {
        await sendPasswordReset(form.email);
        setFeedback({ tone: "success", message: "Password recovery email sent." });
      } catch (error) {
        setFeedback({ tone: "error", message: normalizeFirebaseMessage(error) });
      }
    });
  };

  const handleGoogleSignIn = () => {
    setFeedback({ tone: "idle", message: "" });

    startTransition(async () => {
      try {
        await signInWithGoogle("local");
        setFeedback({ tone: "success", message: "Signed in with Google successfully." });
      } catch (error) {
        setFeedback({ tone: "error", message: normalizeFirebaseMessage(error) });
      }
    });
  };

  return (
    <main className="relative min-h-screen min-w-[1280px] overflow-hidden bg-[#78b7ef] text-[#141414]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,28,41,0.34)_0%,rgba(9,28,41,0.04)_45%,rgba(9,28,41,0.08)_100%)]" />

      <div className="relative flex min-h-screen flex-col px-7 pb-10 pt-7">
        <header className="w-fit rounded-[20px] border border-white/35 bg-white/58 px-7 py-3 shadow-[0_18px_40px_rgba(31,38,135,0.18)] backdrop-blur-[18px]">
          <div className="flex items-center gap-10">
            <Image
              alt="Lizy logo"
              className="h-14 w-auto scale-160 shrink-0"
              height={180}
              priority
              src="/logo.png"
              width={182}
            />
            <nav className="flex items-center gap-9 text-[14px] font-medium text-[#303030]">
              {navigationItems.map((item) => (
                <a href="#" key={item}>
                  {item}
                </a>
              ))}
            </nav>
            <Button className="h-[44px] rounded-[14px] bg-[#262626] px-7 text-[15px] font-semibold text-white hover:bg-[#1d1d1d]">
              Get in touch
            </Button>
          </div>
        </header>

        <section className="flex flex-1 items-end justify-between">
          <div className="max-w-[640px] pb-12 pl-2 text-white">
            <h1 className="text-[58px] leading-[1.06] font-normal tracking-[-0.04em] drop-shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <span className="block">We can turn your</span>
              <span className="mr-4 font-semibold">dream</span>
              <span>project into</span>
              <span className="ml-4 font-serif italic">reality</span>
            </h1>
          </div>

          <div className="mr-[28px] flex w-[492px] shrink-0 items-center justify-center self-center">
            <div className="w-full rounded-[38px] bg-white px-[72px] py-[62px] shadow-[0_32px_90px_rgba(10,24,38,0.2)]">
              <div className="mb-12 text-center">
                <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#111111]">
                    Glad to see you here!<span className="text-[26px]">👋🏻</span>
                </h2>
              </div>

              <form className="flex flex-col" onSubmit={handleSubmit}>
                <div
                  aria-hidden={mode !== "register"}
                  className={cn(
                    "grid overflow-hidden transition-[grid-template-rows,opacity,margin-bottom] duration-300 ease-out",
                    mode === "register"
                      ? "grid-rows-[1fr] opacity-100 mb-4"
                      : "pointer-events-none grid-rows-[0fr] opacity-0 mb-0",
                  )}
                >
                  <div
                    className={cn(
                      "min-h-0 transition-transform duration-300 ease-out",
                      mode === "register" ? "translate-y-0" : "-translate-y-2",
                    )}
                  >
                    <InputShell
                      icon={<UserRound className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                      onChange={(value) => updateField("firstName", value)}
                      placeholder="First Name"
                      value={form.firstName}
                    />
                  </div>
                </div>
                <InputShell
                  icon={<Mail className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                  onChange={(value) => updateField("email", value)}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                />
                <div className="mt-4">
                  <InputShell
                    icon={<LockKeyhole className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                    onChange={(value) => updateField("password", value)}
                    placeholder="Password"
                    rightAdornment={
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="cursor-pointer border-none bg-transparent p-0 text-[#6a6a6a]"
                        onClick={(event) => {
                          event.preventDefault();
                          setShowPassword((current) => !current);
                        }}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeOff className="h-[19px] w-[19px]" strokeWidth={2.1} />
                        ) : (
                          <Eye className="h-[19px] w-[19px]" strokeWidth={2.1} />
                        )}
                      </button>
                    }
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />
                </div>

                <div className="flex justify-end pr-2 pt-1">
                  <button
                    className="border-none bg-transparent text-[14px] font-semibold text-[#3885d8]"
                    onClick={handlePasswordReset}
                    type="button"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  className="mt-7 h-[48px] w-full rounded-[16px] bg-[#262626] text-[20px] font-medium text-white hover:bg-[#1f1f1f]"
                  disabled={isPending}
                  type="submit"
                >
                  {mode === "register" ? "Create account" : "Login"}
                </Button>

                <p
                  className={cn(
                    "min-h-6 pt-2 text-center text-[14px] font-medium",
                    feedback.tone === "error" && "text-[#d44242]",
                    feedback.tone === "success" && "text-[#2c7a4b]",
                    feedback.tone === "idle" && "text-transparent",
                  )}
                >
                  {feedback.message || "."}
                </p>

                <p className="pt-1 text-center text-[15px] text-[#555555]">
                  {mode === "register" ? "Already have an account? " : "Don't have an account? "}
                  <button
                    className="border-none bg-transparent p-0 font-semibold text-[#3a86d8]"
                    onClick={() => {
                      setFeedback({ tone: "idle", message: "" });
                      setMode((current) => (current === "login" ? "register" : "login"));
                    }}
                    type="button"
                  >
                    {mode === "register" ? "Login." : "Sign up."}
                  </button>
                </p>

                <div className="flex items-center gap-3 pb-1 pt-8">
                  <div className="h-px flex-1 bg-[#5a5a5a]" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7d7d7d]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[#5a5a5a]" />
                </div>

                <button
                  className="mt-3 flex h-[46px] w-full items-center justify-center gap-3 rounded-[16px] border border-[#b9b9b9] bg-white text-[17px] font-medium text-[#414141] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                  disabled={isPending}
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <span>Login with Google</span>
                  <Image
                    alt="Google logo"
                    className="h-8 w-8 rounded-full"
                    height={32}
                    src="/google.png"
                    width={32}
                  />
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
