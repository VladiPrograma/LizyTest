"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Coins,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinned,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { DASHBOARD_HOME_PATH } from "@/lib/routes";
import {
  type CreateUserPayload,
  UserServiceError,
  userService,
} from "@/services/user.service";
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

type OnboardingState = CreateUserPayload;

const navigationItems = ["Who we are", "Services", "Blog"];

const initialFormState: FormState = {
  firstName: "",
  email: "",
  password: "",
};

const regionCurrencyMap: Record<string, string> = {
  AR: "ARS",
  BR: "BRL",
  CL: "CLP",
  CO: "COP",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  IT: "EUR",
  MX: "MXN",
  PT: "EUR",
  US: "USD",
};

const getRegionFromLocale = (locale: string) => {
  const match = locale.match(/-([A-Z]{2})$/i);

  return match ? match[1].toUpperCase() : "";
};

const getCountryFromLocale = (locale: string) => {
  const region = getRegionFromLocale(locale);

  if (!region || typeof Intl.DisplayNames === "undefined") {
    return "";
  }

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return displayNames.of(region) || "";
  } catch {
    return "";
  }
};

const getInitialOnboardingState = (): OnboardingState => {
  if (typeof window === "undefined") {
    return {
      birthDate: "",
      city: "",
      country: "",
      currency: "",
      locale: "en-US",
      timeZone: "UTC",
    };
  }

  const locale = window.navigator.language || "en-US";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const region = getRegionFromLocale(locale);

  return {
    birthDate: "",
    city: "",
    country: getCountryFromLocale(locale),
    currency: regionCurrencyMap[region] || "",
    locale,
    timeZone,
  };
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

const normalizeUserServiceMessage = (error: unknown) => {
  if (error instanceof UserServiceError) {
    return error.problem?.detail || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The user profile request could not be completed.";
};

function InputShell({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  rightAdornment,
  disabled = false,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rightAdornment?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="flex h-[48px] items-center rounded-[16px] border border-[var(--neutral-500)] bg-[var(--white)] px-4 text-[var(--neutral-600)] shadow-[0_2px_10px_var(--black-alpha-03)]">
      <span className="mr-3 flex shrink-0 items-center text-[var(--neutral-600)]">{icon}</span>
      <input
        className="w-full border-none bg-transparent text-[16px] font-medium text-[var(--neutral-800)] outline-none placeholder:text-[var(--neutral-600)]"
        disabled={disabled}
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
  const { isLoading, login, register, sendPasswordReset, signInWithGoogle, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [onboardingForm, setOnboardingForm] = useState<OnboardingState>(getInitialOnboardingState);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [resolvedUserUid, setResolvedUserUid] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [onboardingFeedback, setOnboardingFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      setResolvedUserUid(null);
      setIsOnboardingOpen(false);
      setOnboardingFeedback(null);
      setIsResolvingUser(false);
      return;
    }

    if (resolvedUserUid === user.uid) {
      return;
    }

    let cancelled = false;

    setIsResolvingUser(true);
    setFeedback({ tone: "idle", message: "" });

    void (async () => {
      try {
        const existingUser = await userService.findMe();

        if (cancelled) {
          return;
        }

        setResolvedUserUid(user.uid);

        if (existingUser) {
          router.replace(DASHBOARD_HOME_PATH);
          return;
        }

        setOnboardingForm((current) => ({
          ...getInitialOnboardingState(),
          birthDate: current.birthDate,
          city: current.city,
          country: current.country || getInitialOnboardingState().country,
          currency: current.currency || getInitialOnboardingState().currency,
        }));
        setOnboardingFeedback(null);
        setIsOnboardingOpen(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFeedback({
          tone: "error",
          message: normalizeUserServiceMessage(error),
        });
      } finally {
        if (!cancelled) {
          setIsResolvingUser(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, resolvedUserUid, router, user]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateOnboardingField = (field: keyof OnboardingState, value: string) => {
    setOnboardingForm((current) => ({ ...current, [field]: value }));
  };

  const isAuthFlowBusy = isPending || isResolvingUser || isSavingOnboarding;

  const handleForgotPasswordOpen = () => {
    setResetEmail(form.email);
    setResetFeedback(null);
    setIsForgotPasswordOpen(true);
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
          return;
        }

        await login({
          email: form.email,
          password: form.password,
          persistence: "local",
        });
      } catch (error) {
        setFeedback({ tone: "error", message: normalizeFirebaseMessage(error) });
      }
    });
  };

  const handlePasswordReset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resetEmail.trim()) {
      setResetFeedback("Enter your email to recover your password.");
      return;
    }

    setResetFeedback(null);
    setFeedback({ tone: "idle", message: "" });

    startTransition(async () => {
      try {
        await sendPasswordReset(resetEmail.trim());
        setIsForgotPasswordOpen(false);
        setResetEmail("");
        setFeedback({ tone: "success", message: "Password recovery email sent." });
      } catch (error) {
        setResetFeedback(normalizeFirebaseMessage(error));
      }
    });
  };

  const handleGoogleSignIn = () => {
    setFeedback({ tone: "idle", message: "" });

    startTransition(async () => {
      try {
        await signInWithGoogle("local");
      } catch (error) {
        setFeedback({ tone: "error", message: normalizeFirebaseMessage(error) });
      }
    });
  };

  const handleOnboardingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOnboardingFeedback(null);
    setIsSavingOnboarding(true);

    try {
      await userService.createUser(onboardingForm);
      setIsOnboardingOpen(false);
      router.replace(DASHBOARD_HOME_PATH);
    } catch (error) {
      setOnboardingFeedback(normalizeUserServiceMessage(error));
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  return (
    <main className="relative min-h-screen min-w-[1280px] overflow-hidden bg-[var(--sky-400)] text-[var(--neutral-950)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ocean-alpha-34)_0%,var(--ocean-alpha-04)_45%,var(--ocean-alpha-08)_100%)]" />

      <div className="relative flex min-h-screen flex-col px-7 pb-10 pt-7">
        <header className="w-fit rounded-[20px] border border-[var(--white-alpha-35)] bg-[var(--white-alpha-58)] px-7 py-3 shadow-[0_18px_40px_var(--indigo-alpha-18)] backdrop-blur-[18px]">
          <div className="flex items-center gap-10">
            <Image
              alt="Lizy logo"
              className="h-14 w-auto scale-160 shrink-0"
              height={180}
              priority
              src="/logo.png"
              width={182}
            />
            <nav className="flex items-center gap-9 text-[14px] font-medium text-[var(--neutral-800)]">
              {navigationItems.map((item) => (
                <a href="#" key={item}>
                  {item}
                </a>
              ))}
            </nav>
            <Button className="h-[44px] rounded-[14px] bg-[var(--neutral-900)] px-7 text-[15px] font-semibold text-[var(--white)] hover:bg-[var(--neutral-950)]">
              Get in touch
            </Button>
          </div>
        </header>

        <section className="flex flex-1 items-end justify-between">
          <div className="max-w-[640px] pb-12 pl-2 text-[var(--white)]">
            <h1 className="text-[58px] leading-[1.06] font-normal tracking-[-0.04em] drop-shadow-[0_8px_30px_var(--black-alpha-20)]">
              <span className="block">We can turn your</span>
              <span className="mr-4 font-semibold">dream</span>
              <span>project into</span>
              <span className="ml-4 font-serif italic">reality</span>
            </h1>
          </div>

          <div className="mr-[28px] flex w-[492px] shrink-0 items-center justify-center self-center">
            <div className="w-full rounded-[38px] bg-[var(--white)] px-[72px] py-[62px] shadow-[0_32px_90px_var(--navy-alpha-20)]">
              <div className="mb-12 text-center">
                <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[var(--neutral-950)]">
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
                      disabled={isAuthFlowBusy}
                      icon={<UserRound className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                      onChange={(value) => updateField("firstName", value)}
                      placeholder="First Name"
                      value={form.firstName}
                    />
                  </div>
                </div>
                <InputShell
                  disabled={isAuthFlowBusy}
                  icon={<Mail className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                  onChange={(value) => updateField("email", value)}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                />
                <div className="mt-4">
                  <InputShell
                    disabled={isAuthFlowBusy}
                    icon={<LockKeyhole className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                    onChange={(value) => updateField("password", value)}
                    placeholder="Password"
                    rightAdornment={
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="cursor-pointer border-none bg-transparent p-0 text-[var(--neutral-700)]"
                        disabled={isAuthFlowBusy}
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
                    className="border-none bg-transparent text-[14px] font-semibold text-[var(--blue-600)]"
                    disabled={isAuthFlowBusy}
                    onClick={handleForgotPasswordOpen}
                    type="button"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  className="mt-7 h-[48px] w-full rounded-[16px] bg-[var(--neutral-900)] text-[20px] font-medium text-[var(--white)] hover:bg-[var(--neutral-950)]"
                  disabled={isAuthFlowBusy}
                  type="submit"
                >
                  {isResolvingUser ? "Checking account..." : mode === "register" ? "Create account" : "Login"}
                </Button>

                <p
                  className={cn(
                    "min-h-6 pt-2 text-center text-[14px] font-medium",
                    feedback.tone === "error" && "text-[var(--danger-red)]",
                    feedback.tone === "success" && "text-[var(--success-green)]",
                    feedback.tone === "idle" && "text-transparent",
                  )}
                >
                  {feedback.message || "."}
                </p>

                <p className="pt-1 text-center text-[15px] text-[var(--neutral-700)]">
                  {mode === "register" ? "Already have an account? " : "Don't have an account? "}
                  <button
                    className="border-none bg-transparent p-0 font-semibold text-[var(--blue-600)]"
                    disabled={isAuthFlowBusy}
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
                  <div className="h-px flex-1 bg-[var(--neutral-700)]" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--neutral-600)]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[var(--neutral-700)]" />
                </div>

                <button
                  className="mt-3 flex h-[46px] w-full items-center justify-center gap-3 rounded-[16px] border border-[var(--neutral-500)] bg-[var(--white)] text-[17px] font-medium text-[var(--neutral-800)] shadow-[0_4px_16px_var(--black-alpha-04)]"
                  disabled={isAuthFlowBusy}
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

      <Dialog
        onOpenChange={(open) => {
          if (open) {
            setIsOnboardingOpen(true);
          }
        }}
        open={isOnboardingOpen}
      >
        <DialogContent className="max-w-[520px] rounded-[28px] border border-[var(--sand-200)] bg-[var(--white)] p-8 text-[var(--sand-950)] shadow-[0_30px_90px_var(--navy-alpha-24)]">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--neutral-950)]">
              Complete your profile
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-6 text-[var(--sand-600)]">
              Your Firebase account exists, but we still need the onboarding data required by the backend before entering the app.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 flex flex-col gap-4" onSubmit={handleOnboardingSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <InputShell
                disabled={isSavingOnboarding}
                icon={<MapPinned className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                onChange={(value) => updateOnboardingField("country", value)}
                placeholder="Country"
                value={onboardingForm.country}
              />
              <InputShell
                disabled={isSavingOnboarding}
                icon={<MapPinned className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                onChange={(value) => updateOnboardingField("city", value)}
                placeholder="City"
                value={onboardingForm.city}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputShell
                disabled={isSavingOnboarding}
                icon={<Coins className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                onChange={(value) => updateOnboardingField("currency", value.toUpperCase())}
                placeholder="Currency (EUR)"
                value={onboardingForm.currency}
              />
              <InputShell
                disabled={isSavingOnboarding}
                icon={<CalendarDays className="h-[18px] w-[18px]" strokeWidth={2.1} />}
                onChange={(value) => updateOnboardingField("birthDate", value)}
                placeholder="Birth date"
                type="date"
                value={onboardingForm.birthDate}
              />
            </div>

            <p className={cn("min-h-6 text-left text-[14px] font-medium", onboardingFeedback ? "text-[var(--danger-red)]" : "text-transparent")}>
              {onboardingFeedback || "."}
            </p>

            <Button
              className="h-[48px] w-full rounded-[16px] bg-[var(--neutral-900)] text-[18px] font-medium text-[var(--white)] hover:bg-[var(--neutral-950)]"
              disabled={isSavingOnboarding}
              type="submit"
            >
              {isSavingOnboarding ? "Saving profile..." : "Continue"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          setIsForgotPasswordOpen(open);
          if (!open) {
            setResetFeedback(null);
          }
        }}
        open={isForgotPasswordOpen}
      >
        <DialogContent className="max-w-[440px] rounded-[28px] border border-[var(--sand-200)] bg-[var(--white)] p-8 text-[var(--sand-950)] shadow-[0_30px_90px_var(--navy-alpha-24)]">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--neutral-950)]">
              Recover password
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-6 text-[var(--sand-600)]">
              Enter your account email and we will send you a password recovery link.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 flex flex-col" onSubmit={handlePasswordReset}>
            <InputShell
              icon={<Mail className="h-[18px] w-[18px]" strokeWidth={2.1} />}
              onChange={setResetEmail}
              placeholder="Email"
              type="email"
              value={resetEmail}
            />

            <p className={cn("min-h-6 pt-2 text-left text-[14px] font-medium", resetFeedback ? "text-[var(--danger-red)]" : "text-transparent")}>
              {resetFeedback || "."}
            </p>

            <Button
              className="mt-4 h-[48px] w-full rounded-[16px] bg-[var(--neutral-900)] text-[18px] font-medium text-[var(--white)] hover:bg-[var(--neutral-950)]"
              disabled={isPending}
              type="submit"
            >
              Send email
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
