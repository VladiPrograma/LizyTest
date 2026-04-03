"use client";

import { authService } from "@/services/auth.service";

const DEFAULT_BF_BASE_URL = "https://back.vladicode.com";
const BF_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || DEFAULT_BF_BASE_URL;

export type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  path?: string;
};

type BfClientErrorFactory = (message: string, status: number, problem: ProblemDetails | null) => Error;

type BfClientRequestOptions = {
  path: string;
  method?: RequestInit["method"];
  body?: BodyInit | null;
  contentType?: string;
  headers?: HeadersInit;
  searchParams?: URLSearchParams;
  errorFactory?: BfClientErrorFactory;
};

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

class BfClient {
  constructor(private readonly baseUrl: string) {}

  private buildUrl(path: string, searchParams?: URLSearchParams) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(normalizedPath, this.baseUrl);

    if (searchParams) {
      url.search = searchParams.toString();
    }

    return url.toString();
  }

  async request<T>({
    path,
    method = "GET",
    body,
    contentType,
    headers,
    searchParams,
    errorFactory,
  }: BfClientRequestOptions) {
    const token = await authService.getIdToken();
    const response = await fetch(this.buildUrl(path, searchParams), {
      method,
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const problem = await parseProblemResponse(response);
      const message = getErrorMessage(problem, response);

      if (errorFactory) {
        throw errorFactory(message, response.status, problem);
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const bfClient = new BfClient(BF_BASE_URL);
