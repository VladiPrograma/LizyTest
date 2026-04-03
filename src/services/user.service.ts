"use client";

import { authService } from "@/services/auth.service";

const DEFAULT_API_BASE_URL = "https://back.vladicode.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
const USER_ENDPOINT = `${API_BASE_URL}/user`;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UserDto = {
  email: string | null;
  name: string | null;
  lastName: string | null;
  country: string | null;
  city: string | null;
  currency: string | null;
  timeZone: string | null;
  locale: string | null;
  birthDate: string | null;
  profilePhotoUrl: string | null;
  enabled: boolean;
};

export type CreateUserPayload = {
  country: string;
  city: string;
  currency: string;
  timeZone: string;
  locale: string;
  birthDate: string;
};

export type UpdateUserPayload = {
  email?: string;
  name?: string;
  lastName?: string;
  country?: string;
  city?: string;
  currency?: string;
  timeZone?: string;
  locale?: string;
  birthDate?: string;
  profilePhotoUrl?: string;
};

export type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  path?: string;
};

export class UserServiceError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "UserServiceError";
    this.status = status;
    this.problem = problem;
  }
}

const isProblemDetails = (value: unknown): value is ProblemDetails => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "title" in value || "status" in value || "detail" in value || "path" in value;
};

const parseDateParts = (value: string) => {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if ([year, month, day].some(Number.isNaN)) {
    return null;
  }

  return { year, month, day };
};

const isIsoDateString = (value: string) => {
  const parts = parseDateParts(value);

  if (!parts) {
    return false;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day
  );
};

const isPastOrToday = (value: string) => {
  if (!isIsoDateString(value)) {
    return false;
  }

  const today = new Date();
  const todayIso = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
    .toISOString()
    .slice(0, 10);

  return value <= todayIso;
};

const ensureNonEmpty = (fieldName: string, value: string) => {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

const validateCreatePayload = (payload: CreateUserPayload) => {
  ensureNonEmpty("country", payload.country);
  ensureNonEmpty("city", payload.city);
  ensureNonEmpty("currency", payload.currency);
  ensureNonEmpty("timeZone", payload.timeZone);
  ensureNonEmpty("locale", payload.locale);
  ensureNonEmpty("birthDate", payload.birthDate);

  if (!CURRENCY_PATTERN.test(payload.currency)) {
    throw new Error("currency must be a 3-letter uppercase ISO code.");
  }

  if (!isPastOrToday(payload.birthDate)) {
    throw new Error("birthDate must use YYYY-MM-DD format and be in the past or present.");
  }
};

const validateUpdatePayload = (payload: UpdateUserPayload) => {
  if (payload.email !== undefined && !EMAIL_PATTERN.test(payload.email)) {
    throw new Error("email must have a valid format.");
  }

  if (payload.currency !== undefined && !CURRENCY_PATTERN.test(payload.currency)) {
    throw new Error("currency must be a 3-letter uppercase ISO code.");
  }

  if (payload.birthDate !== undefined && !isPastOrToday(payload.birthDate)) {
    throw new Error("birthDate must be a valid date in the past or present.");
  }
};

const sanitizeUpdatePayload = (payload: UpdateUserPayload) => {
  const sanitized: UpdateUserPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      sanitized[key as keyof UpdateUserPayload] = value;
    }
  }

  return sanitized;
};

const parseProblemResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => null);

    if (isProblemDetails(body)) {
      return body;
    }
  }

  const detail = await response.text().catch(() => "");

  if (!detail) {
    return null;
  }

  return {
    detail,
    status: response.status,
    title: response.statusText,
  } satisfies ProblemDetails;
};

const getErrorMessage = (problem: ProblemDetails | null, response: Response) => {
  return problem?.detail || problem?.title || response.statusText || "Request failed.";
};

class UserService {
  private async request<T>(path: string, init?: RequestInit) {
    const token = await authService.getIdToken();
    const response = await fetch(`${USER_ENDPOINT}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const problem = await parseProblemResponse(response);
      throw new UserServiceError(getErrorMessage(problem, response), response.status, problem);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async getMe() {
    return this.request<UserDto>("/me", { method: "GET" });
  }

  async findMe() {
    try {
      return await this.getMe();
    } catch (error) {
      if (error instanceof UserServiceError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async createUser(payload: CreateUserPayload) {
    validateCreatePayload(payload);

    return this.request<UserDto>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateMe(payload: UpdateUserPayload) {
    const sanitizedPayload = sanitizeUpdatePayload(payload);

    if (Object.keys(sanitizedPayload).length === 0) {
      throw new Error("At least one field is required to update the user.");
    }

    validateUpdatePayload(sanitizedPayload);

    return this.request<UserDto>("/me", {
      method: "PATCH",
      body: JSON.stringify(sanitizedPayload),
    });
  }

  async disableMe() {
    await this.request<void>("/me/disable", {
      method: "PATCH",
    });
  }
}

export const userService = new UserService();
