import { type UpdateUserPayload, type UserDto } from "@/services/user.service";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const currencyPattern = /^[A-Z]{3}$/;

export type UserSettingsForm = {
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

export function buildUserSettingsForm(
  profile: UserDto | null,
  authEmail: string | null | undefined,
): UserSettingsForm {
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

export function validateUserSettingsForm(form: UserSettingsForm) {
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

export function buildUpdatePayload(profile: UserDto | null, form: UserSettingsForm): UpdateUserPayload {
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
