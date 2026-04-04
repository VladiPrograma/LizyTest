"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Calendar,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Languages,
  Mail,
  MapPin,
  UserRound,
  Wallet,
} from "lucide-react";
import { AppDrawer } from "@/components/layout/app-drawer";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { DateField, InputField } from "@/components/ui/select-field";
import { userService, UserServiceError, type UpdateUserPayload, type UserDto } from "@/services/user.service";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const currencyPattern = /^[A-Z]{3}$/;
const contactEmail = "mdumitruvlad@gmail.com";

type UserSettingsForm = {
  email: string;
  name: string;
  lastName: string;
  country: string;
  city: string;
  currency: string;
  timeZone: string;
  locale: string;
  birthDate: string;
  profilePhotoUrl: string;
};

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizeCurrency(value: string) {
  const trimmedValue = value.trim().toUpperCase();

  return trimmedValue ? trimmedValue : null;
}

function buildUserSettingsForm(profile: UserDto | null, authEmail: string | null | undefined): UserSettingsForm {
  return {
    birthDate: profile?.birthDate ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    currency: profile?.currency ?? "",
    email: profile?.email ?? authEmail ?? "",
    lastName: profile?.lastName ?? "",
    locale: profile?.locale ?? "",
    name: profile?.name ?? "",
    profilePhotoUrl: profile?.profilePhotoUrl ?? "",
    timeZone: profile?.timeZone ?? "",
  };
}

function normalizeUserMessage(error: unknown) {
  if (error instanceof UserServiceError) {
    return error.message || error.problem?.detail || "No se pudo guardar el usuario.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo guardar el usuario.";
}

function validateUserSettingsForm(form: UserSettingsForm) {
  if (form.email.trim() && !emailPattern.test(form.email.trim())) {
    return "El email no tiene un formato válido.";
  }

  if (form.currency.trim() && !currencyPattern.test(form.currency.trim().toUpperCase())) {
    return "La moneda debe usar un código ISO de 3 letras, por ejemplo EUR.";
  }

  if (form.profilePhotoUrl.trim()) {
    try {
      new URL(form.profilePhotoUrl.trim());
    } catch {
      return "La URL de la foto de perfil no es válida.";
    }
  }

  return null;
}

function buildUpdatePayload(profile: UserDto | null, form: UserSettingsForm): UpdateUserPayload {
  const payload: UpdateUserPayload = {};
  const normalizedEmail = normalizeOptionalText(form.email);
  const normalizedName = normalizeOptionalText(form.name);
  const normalizedLastName = normalizeOptionalText(form.lastName);
  const normalizedCountry = normalizeOptionalText(form.country);
  const normalizedCity = normalizeOptionalText(form.city);
  const normalizedCurrency = normalizeCurrency(form.currency);
  const normalizedTimeZone = normalizeOptionalText(form.timeZone);
  const normalizedLocale = normalizeOptionalText(form.locale);
  const normalizedProfilePhotoUrl = normalizeOptionalText(form.profilePhotoUrl);
  const nextBirthDate = form.birthDate.trim() || null;

  if (normalizedEmail !== profile?.email) {
    payload.email = normalizedEmail ?? undefined;
  }

  if (normalizedName !== profile?.name) {
    payload.name = normalizedName ?? undefined;
  }

  if (normalizedLastName !== profile?.lastName) {
    payload.lastName = normalizedLastName ?? undefined;
  }

  if (normalizedCountry !== profile?.country) {
    payload.country = normalizedCountry ?? undefined;
  }

  if (normalizedCity !== profile?.city) {
    payload.city = normalizedCity ?? undefined;
  }

  if (normalizedCurrency !== profile?.currency) {
    payload.currency = normalizedCurrency ?? undefined;
  }

  if (normalizedTimeZone !== profile?.timeZone) {
    payload.timeZone = normalizedTimeZone ?? undefined;
  }

  if (normalizedLocale !== profile?.locale) {
    payload.locale = normalizedLocale ?? undefined;
  }

  if (nextBirthDate !== profile?.birthDate) {
    payload.birthDate = nextBirthDate ?? undefined;
  }

  if (normalizedProfilePhotoUrl !== profile?.profilePhotoUrl) {
    payload.profilePhotoUrl = normalizedProfilePhotoUrl ?? undefined;
  }

  return payload;
}

function getUserDisplayName(profile: UserDto | null, authName: string | null | undefined, authEmail: string | null | undefined) {
  const fullName = [profile?.name?.trim(), profile?.lastName?.trim()].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  if (authName?.trim() && !authName.includes("@")) {
    return authName.trim();
  }

  return authEmail?.trim() || "Usuario";
}

export function UserSettingsScreen() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { showError, showInfo, showSuccess } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserDto | null>(null);
  const [form, setForm] = useState<UserSettingsForm>(() => buildUserSettingsForm(null, null));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);

      try {
        const profile = await userService.findMe();

        if (cancelled) {
          return;
        }

        setCurrentUserProfile(profile);
        setForm(buildUserSettingsForm(profile, user?.email));
        setFormError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        showError(normalizeUserMessage(error));
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, showError, user?.email]);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  };

  const handleContact = () => {
    window.location.href = `mailto:${contactEmail}`;
  };

  const handleFieldChange = <Key extends keyof UserSettingsForm>(field: Key, value: UserSettingsForm[Key]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFormError(null);
  };

  const hasChanges = useMemo(() => {
    return Object.keys(buildUpdatePayload(currentUserProfile, form)).length > 0;
  }, [currentUserProfile, form]);

  const handleSave = async () => {
    const validationError = validateUserSettingsForm(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildUpdatePayload(currentUserProfile, form);

    if (Object.keys(payload).length === 0) {
      showInfo("No hay cambios para guardar.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const updatedProfile = await userService.updateMe(payload);
      setCurrentUserProfile(updatedProfile);
      setForm(buildUserSettingsForm(updatedProfile, user?.email));
      showSuccess("Datos de usuario actualizados.");
    } catch (error) {
      const message = normalizeUserMessage(error);
      setFormError(message);
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isAuthenticated || isLoadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-secondary)]">
        <p className="text-[15px] font-medium">Cargando configuración de usuario...</p>
      </main>
    );
  }

  const drawerUserName = getUserDisplayName(currentUserProfile, user?.displayName, user?.email);
  const drawerUserPhotoUrl = currentUserProfile?.profilePhotoUrl || user?.photoURL || null;
  const drawerUserSubtitle = currentUserProfile?.email || user?.email || "Cuenta activa";
  const drawerUserInitial = drawerUserName.charAt(0).toUpperCase() || "U";

  return (
    <main className="flex min-h-screen bg-[var(--bg-page)]">
      <AppDrawer
        activeLabel="Usuario"
        avatarBadge="L"
        footerDescription="Revisa y actualiza tus datos personales, regionales y de perfil desde una única pantalla."
        footerTitle="Configuración de usuario"
        itemActions={{ "Cerrar sesión": handleLogout }}
        primaryActionDisabled={isPending}
        primaryActionIcon={Mail}
        primaryActionLabel="CONTACTA"
        primaryActionOnClick={handleContact}
        userInitial={drawerUserInitial}
        userName={drawerUserName}
        userPhotoUrl={drawerUserPhotoUrl}
        userSubtitle={drawerUserSubtitle}
      />

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--bg-page)] p-5 sm:p-6 lg:p-10 xl:ml-[284px] xl:min-h-screen">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
          <header className="space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
              <Link className="transition-colors hover:text-[var(--text-primary)]" href="/dashboard/payments-history">
                Historial de pagos
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[var(--text-primary)]">Usuario</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-[30px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Configuración de usuario</h1>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
                  Actualiza tus datos personales y preferencias base de la cuenta. Los cambios se guardan sobre tu perfil actual.
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3 text-[12px] font-semibold",
                  currentUserProfile?.enabled === false
                    ? "bg-[var(--danger-red-soft)] text-[var(--danger-red)]"
                    : "bg-[var(--success-green-soft)] text-[var(--success-green)]",
                )}
              >
                {currentUserProfile?.enabled === false ? "Cuenta deshabilitada" : "Cuenta activa"}
              </span>
            </div>
          </header>

          <div className="rounded-[26px] border border-[var(--border-color)] bg-[var(--bg-white)] p-5 shadow-[0_24px_60px_var(--navy-alpha-08)] sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                className="sm:col-span-1"
                icon={UserRound}
                label="Nombre"
                onChange={(value) => handleFieldChange("name", value)}
                placeholder="Vlad"
                value={form.name}
              />
              <InputField
                className="sm:col-span-1"
                icon={UserRound}
                label="Apellidos"
                onChange={(value) => handleFieldChange("lastName", value)}
                placeholder="Fernandez?"
                value={form.lastName}
              />
              <InputField
                className="sm:col-span-1"
                icon={Mail}
                label="Email"
                onChange={(value) => handleFieldChange("email", value)}
                placeholder="tu@email.com"
                value={form.email}
              />
              <InputField
                className="sm:col-span-1"
                icon={Wallet}
                label="Moneda"
                onChange={(value) => handleFieldChange("currency", value.toUpperCase())}
                placeholder="EUR"
                value={form.currency}
              />
              <InputField
                className="sm:col-span-1"
                icon={MapPin}
                label="País"
                onChange={(value) => handleFieldChange("country", value)}
                placeholder="España"
                value={form.country}
              />
              <InputField
                className="sm:col-span-1"
                icon={MapPin}
                label="Ciudad"
                onChange={(value) => handleFieldChange("city", value)}
                placeholder="Madrid"
                value={form.city}
              />
              <InputField
                className="sm:col-span-1"
                icon={Globe}
                label="Zona horaria"
                onChange={(value) => handleFieldChange("timeZone", value)}
                placeholder="Europe/Madrid"
                value={form.timeZone}
              />
              <InputField
                className="sm:col-span-1"
                icon={Languages}
                label="Locale"
                onChange={(value) => handleFieldChange("locale", value)}
                placeholder="es-ES"
                value={form.locale}
              />
              <DateField
                className="sm:col-span-1"
                icon={Calendar}
                label="Fecha de nacimiento"
                onChange={(value) => handleFieldChange("birthDate", value)}
                value={form.birthDate}
              />
              <InputField
                className="sm:col-span-1"
                icon={ImageIcon}
                label="URL foto de perfil"
                onChange={(value) => handleFieldChange("profilePhotoUrl", value)}
                placeholder="https://..."
                value={form.profilePhotoUrl}
              />
            </div>

            {formError ? (
              <p className="mt-4 rounded-[14px] border border-[var(--danger-red-border)] bg-[var(--danger-red-soft)] px-4 py-3 text-[13px] font-medium text-[var(--danger-red)]">
                {formError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-[var(--text-secondary)]">
                {hasChanges ? "Tienes cambios pendientes de guardar." : "No hay cambios pendientes."}
              </p>
              <div className="flex gap-3">
                <Button
                  className="h-11 rounded-[14px] bg-[var(--bg-white)] px-4 text-[14px] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border-color)] hover:bg-[var(--bg-light)]"
                  onClick={() => {
                    setForm(buildUserSettingsForm(currentUserProfile, user?.email));
                    setFormError(null);
                  }}
                  type="button"
                >
                  Resetear
                </Button>
                <Button
                  className="h-11 rounded-[14px] bg-[var(--accent-blue)] px-4 text-[14px] font-semibold text-[var(--white)] hover:bg-[var(--blue-600)]"
                  disabled={isSaving || !hasChanges}
                  onClick={handleSave}
                  type="button"
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
