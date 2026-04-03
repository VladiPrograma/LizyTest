"use client";

import { authService } from "@/services/auth.service";

const DEFAULT_API_BASE_URL = "https://back.vladicode.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
const PAYMENTS_ENDPOINT = `${API_BASE_URL}/payments`;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_TYPE_VALUES = new Set(["ADD", "SUBTRACT"]);
const SORT_FIELD_MAP = {
  alias: "description",
  amount: "amount",
  business: "businessName",
  businessName: "businessName",
  category: "category",
  currency: "currency",
  date: "date",
  description: "description",
  needsReview: "needsReview",
  operationType: "operationType",
  type: "operationType",
} as const;

export type PaymentType = "ADD" | "SUBTRACT";
export type PaymentSortField = keyof typeof SORT_FIELD_MAP;
export type SortDirection = "ASC" | "DESC";

export type PaymentDto = {
  id: string;
  date: string;
  description: string | null;
  businessName: string | null;
  type: PaymentType;
  amount: number;
  category: string | null;
  currency: string | null;
  needsReview: boolean | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type CreatePaymentPayload = {
  date: string;
  type: PaymentType;
  amount: number;
  description?: string | null;
  businessName?: string | null;
  category?: string | null;
  currency?: string | null;
  needsReview?: boolean | null;
};

export type UpdatePaymentPayload = {
  date?: string;
  description?: string | null;
  businessName?: string | null;
  type?: PaymentType;
  amount?: number;
  category?: string | null;
  currency?: string | null;
  needsReview?: boolean | null;
  forAll?: boolean;
};

export type ListPaymentsParams = {
  page?: number;
  size?: number;
  sort?: PaymentSortField;
  direction?: SortDirection;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: PaymentType;
  business?: string;
  category?: string;
  alias?: string;
};

export type SummaryParams = {
  startDate?: string;
  endDate?: string;
};

export type PaymentsSummaryDto = {
  type: PaymentType;
  paymentsCount: number;
  totalAmount: number;
};

export type PaymentsByCategoryDto = {
  categoryName: string;
  totalAmount: number;
  paymentsCount: number;
  businessNames: string[];
};

export type PaymentsByBusinessDto = {
  businessName: string;
  totalAmount: number;
  paymentsCount: number;
  categories: string[];
};

export type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  path?: string;
};

export class PaymentsServiceError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "PaymentsServiceError";
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

  return { day, month, year };
};

const isIsoDateString = (value: string) => {
  const parts = parseDateParts(value);

  if (!parts) {
    return false;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day
  );
};

const ensureNonNegative = (fieldName: string, value: number) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`${fieldName} must be a number greater than or equal to 0.`);
  }
};

const ensureOptionalCurrency = (fieldName: string, value?: string | null) => {
  if (value !== undefined && value !== null && !CURRENCY_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a 3-letter uppercase ISO code.`);
  }
};

const ensureOptionalDate = (fieldName: string, value?: string) => {
  if (value !== undefined && !isIsoDateString(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }
};

const ensureOptionalPaymentType = (fieldName: string, value?: PaymentType) => {
  if (value !== undefined && !PAYMENT_TYPE_VALUES.has(value)) {
    throw new Error(`${fieldName} must be ADD or SUBTRACT.`);
  }
};

const validatePaymentDto = (payment: PaymentDto) => {
  if (!payment.id.trim()) {
    throw new Error("Payment id is missing.");
  }

  if (!isIsoDateString(payment.date)) {
    throw new Error("Payment date must use YYYY-MM-DD format.");
  }

  ensureOptionalPaymentType("type", payment.type);
  ensureNonNegative("amount", payment.amount);
  ensureOptionalCurrency("currency", payment.currency);
};

const validateCreatePayload = (payload: CreatePaymentPayload) => {
  ensureOptionalDate("date", payload.date);
  ensureOptionalPaymentType("type", payload.type);
  ensureNonNegative("amount", payload.amount);
  ensureOptionalCurrency("currency", payload.currency);
};

const validateUpdatePayload = (payload: UpdatePaymentPayload) => {
  ensureOptionalDate("date", payload.date);
  ensureOptionalPaymentType("type", payload.type);

  if (payload.amount !== undefined) {
    ensureNonNegative("amount", payload.amount);
  }

  ensureOptionalCurrency("currency", payload.currency);

  const hasMutatingField = Object.entries(payload).some(([key, value]) => key !== "forAll" && value !== undefined);

  if (!hasMutatingField) {
    throw new Error("At least one payment field is required to update.");
  }
};

const validateSummaryParams = (params?: SummaryParams) => {
  ensureOptionalDate("startDate", params?.startDate);
  ensureOptionalDate("endDate", params?.endDate);
};

const validateListParams = (params: ListPaymentsParams = {}) => {
  if (params.page !== undefined && (!Number.isInteger(params.page) || params.page < 0)) {
    throw new Error("page must be an integer greater than or equal to 0.");
  }

  if (params.size !== undefined && (!Number.isInteger(params.size) || params.size < 0)) {
    throw new Error("size must be an integer greater than or equal to 0.");
  }

  if (params.direction !== undefined && params.direction !== "ASC" && params.direction !== "DESC") {
    throw new Error("direction must be ASC or DESC.");
  }

  ensureOptionalDate("startDate", params.startDate);
  ensureOptionalDate("endDate", params.endDate);
  ensureOptionalPaymentType("type", params.type);

  if (params.minAmount !== undefined) {
    ensureNonNegative("minAmount", params.minAmount);
  }

  if (params.maxAmount !== undefined) {
    ensureNonNegative("maxAmount", params.maxAmount);
  }
};

const sanitizeBody = <T extends Record<string, unknown>>(payload: T) => {
  const sanitized = {} as Partial<T>;

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      sanitized[key as keyof T] = value as T[keyof T];
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

const buildUrl = (path = "", params?: URLSearchParams) => {
  const url = new URL(`${PAYMENTS_ENDPOINT}${path}`);

  if (params) {
    url.search = params.toString();
  }

  return url.toString();
};

const buildListQueryParams = (params: ListPaymentsParams = {}) => {
  validateListParams(params);

  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  if (params.sort !== undefined) {
    searchParams.set("sort", SORT_FIELD_MAP[params.sort]);
  }

  if (params.direction !== undefined) {
    searchParams.set("direction", params.direction);
  }

  if (params.startDate) {
    searchParams.set("startDate", params.startDate);
  }

  if (params.endDate) {
    searchParams.set("endDate", params.endDate);
  }

  if (params.minAmount !== undefined) {
    searchParams.set("minAmount", String(params.minAmount));
  }

  if (params.maxAmount !== undefined) {
    searchParams.set("maxAmount", String(params.maxAmount));
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  if (params.business) {
    searchParams.set("business", params.business);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.alias) {
    searchParams.set("alias", params.alias);
  }

  return searchParams;
};

const buildSummaryQueryParams = (params?: SummaryParams) => {
  validateSummaryParams(params);

  const searchParams = new URLSearchParams();

  if (params?.startDate) {
    searchParams.set("startDate", params.startDate);
  }

  if (params?.endDate) {
    searchParams.set("endDate", params.endDate);
  }

  return searchParams;
};

class PaymentsService {
  private async request<T>(url: string, init?: RequestInit) {
    const token = await authService.getIdToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const problem = await parseProblemResponse(response);
      throw new PaymentsServiceError(getErrorMessage(problem, response), response.status, problem);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async createPayment(payload: CreatePaymentPayload) {
    validateCreatePayload(payload);

    const payment = await this.request<PaymentDto>(buildUrl(), {
      method: "POST",
      body: JSON.stringify(sanitizeBody(payload)),
    });

    validatePaymentDto(payment);

    return payment;
  }

  async updatePayment(paymentId: string, payload: UpdatePaymentPayload) {
    if (!paymentId.trim()) {
      throw new Error("paymentId is required.");
    }

    validateUpdatePayload(payload);

    const payment = await this.request<PaymentDto>(buildUrl(`/${paymentId}`), {
      method: "PATCH",
      body: JSON.stringify(sanitizeBody(payload)),
    });

    validatePaymentDto(payment);

    return payment;
  }

  async deletePayment(paymentId: string) {
    if (!paymentId.trim()) {
      throw new Error("paymentId is required.");
    }

    await this.request<void>(buildUrl(`/${paymentId}`), {
      method: "DELETE",
    });
  }

  async getPayment(paymentId: string) {
    if (!paymentId.trim()) {
      throw new Error("paymentId is required.");
    }

    const payment = await this.request<PaymentDto>(buildUrl(`/${paymentId}`), {
      method: "GET",
    });

    validatePaymentDto(payment);

    return payment;
  }

  async listPayments(params: ListPaymentsParams = {}) {
    const result = await this.request<PagedResult<PaymentDto>>(buildUrl("", buildListQueryParams(params)), {
      method: "GET",
    });

    if (!Array.isArray(result.items)) {
      throw new Error("Payments list response must contain an items array.");
    }

    for (const payment of result.items) {
      validatePaymentDto(payment);
    }

    return result;
  }

  async getSummary(params?: SummaryParams) {
    const summary = await this.request<PaymentsSummaryDto[]>(buildUrl("/summary", buildSummaryQueryParams(params)), {
      method: "GET",
    });

    if (!Array.isArray(summary)) {
      throw new Error("Payments summary response must be an array.");
    }

    return summary;
  }

  async getGroupByCategory(params?: SummaryParams) {
    const groups = await this.request<PaymentsByCategoryDto[]>(
      buildUrl("/groupByCategory", buildSummaryQueryParams(params)),
      { method: "GET" },
    );

    if (!Array.isArray(groups)) {
      throw new Error("Payments grouped by category response must be an array.");
    }

    return groups;
  }

  async getGroupByBusiness(params?: SummaryParams) {
    const groups = await this.request<PaymentsByBusinessDto[]>(
      buildUrl("/groupByBussines", buildSummaryQueryParams(params)),
      { method: "GET" },
    );

    if (!Array.isArray(groups)) {
      throw new Error("Payments grouped by business response must be an array.");
    }

    return groups;
  }
}

export const paymentsService = new PaymentsService();
