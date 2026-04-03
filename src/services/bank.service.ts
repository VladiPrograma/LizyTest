"use client";

import { authService } from "@/services/auth.service";

const DEFAULT_API_BASE_URL = "https://back.vladicode.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
const BANK_EXTRACT_ENDPOINT = `${API_BASE_URL}/bank/payments/extract`;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const EXCEL_FILE_EXTENSIONS = [".xls", ".xlsx"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BankExtractedPaymentDto = {
  id: string;
  userId: string;
  date: string;
  description: string | null;
  businessName: string | null;
  type: "ADD" | "SUBTRACT";
  amount: number;
  category: string | null;
  currency: string | null;
  needsReview: boolean | null;
};

export type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  path?: string;
};

export class BankServiceError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "BankServiceError";
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

const hasValidExcelExtension = (fileName: string) => {
  const lowerCaseName = fileName.toLowerCase();

  return EXCEL_FILE_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension));
};

const validateExcelFile = (file: File) => {
  if (!(file instanceof File)) {
    throw new Error("A valid file is required.");
  }

  if (!hasValidExcelExtension(file.name)) {
    throw new Error("Only .xls and .xlsx files are supported.");
  }

  if (file.type && !EXCEL_MIME_TYPES.has(file.type)) {
    throw new Error("The selected file is not a supported Excel document.");
  }
};

const validatePaymentDto = (payment: BankExtractedPaymentDto) => {
  if (!payment.id.trim()) {
    throw new Error("Imported payment id is missing.");
  }

  if (!payment.userId.trim()) {
    throw new Error("Imported payment userId is missing.");
  }

  if (!DATE_PATTERN.test(payment.date)) {
    throw new Error("Imported payment date must use YYYY-MM-DD format.");
  }

  if (payment.type !== "ADD" && payment.type !== "SUBTRACT") {
    throw new Error("Imported payment type is invalid.");
  }

  if (Number.isNaN(payment.amount) || payment.amount < 0) {
    throw new Error("Imported payment amount must be a positive number.");
  }
};

class BankService {
  async extractPayments(file: File) {
    validateExcelFile(file);

    const token = await authService.getIdToken();
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(BANK_EXTRACT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const problem = await parseProblemResponse(response);
      throw new BankServiceError(getErrorMessage(problem, response), response.status, problem);
    }

    const payments = (await response.json()) as BankExtractedPaymentDto[];

    if (!Array.isArray(payments)) {
      throw new Error("The bank extract response must be an array.");
    }

    for (const payment of payments) {
      validatePaymentDto(payment);
    }

    return payments;
  }
}

export const bankService = new BankService();
