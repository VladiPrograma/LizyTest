"use client";

import { bfClient, type ProblemDetails } from "@/services/bf-client";
const RULE_TYPE_VALUES = new Set([
  "ADD",
  "SUBTRACT",
  "FIXED_RECURRING",
  "VARIABLE_RECURRING",
  "LOAN",
  "DEBT",
]);

export type RuleOperationType = "ADD" | "SUBTRACT" | "FIXED_RECURRING" | "VARIABLE_RECURRING" | "LOAN" | "DEBT";

export type RuleType = RuleOperationType | null;

export type RuleDto = {
  id: string;
  oldBusinessName: string;
  description: string | null;
  businessName: string | null;
  type: RuleType;
  amount: number | null;
  category: string | null;
  subCategory: string | null;
};

export type CreateRulePayload = {
  oldBusinessName: string;
  description?: string | null;
  businessName?: string | null;
  type?: RuleType;
  amount?: number | string | null;
  category?: string | null;
  subCategory?: string | null;
};

export type UpdateRulePayload = {
  oldBusinessName?: string | null;
  description?: string | null;
  businessName?: string | null;
  type?: RuleType;
  amount?: number | string | null;
  category?: string | null;
  subCategory?: string | null;
};

export class RulesServiceError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "RulesServiceError";
    this.status = status;
    this.problem = problem;
  }
}

const ensureNonEmpty = (fieldName: string, value: string) => {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

const ensureNonNegative = (fieldName: string, value: number) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`${fieldName} must be a number greater than or equal to 0.`);
  }
};

const ensureOptionalNonEmpty = (fieldName: string, value?: string | null) => {
  if (value !== undefined && value !== null && !value.trim()) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
};

const ensureOptionalRuleType = (fieldName: string, value?: RuleType) => {
  if (value !== undefined && value !== null && !RULE_TYPE_VALUES.has(value)) {
    throw new Error(`${fieldName} must be a valid rule type.`);
  }
};

const normalizeRequiredString = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error("oldBusinessName is required.");
  }

  return normalizedValue;
};

const normalizeOptionalString = (value?: string | null) => {
  if (value === undefined || value === null) {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : null;
};

const normalizeOptionalAmount = (value?: number | string | null) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "number") {
    ensureNonNegative("amount", value);
    return value;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  ensureNonNegative("amount", parsedValue);

  return parsedValue;
};

const validateRuleDto = (rule: RuleDto) => {
  ensureNonEmpty("id", rule.id);
  ensureNonEmpty("oldBusinessName", rule.oldBusinessName);
  ensureOptionalRuleType("type", rule.type);

  if (rule.amount !== null) {
    ensureNonNegative("amount", rule.amount);
  }
};

const validateRuleCollection = (rules: RuleDto[]) => {
  if (!Array.isArray(rules)) {
    throw new Error("Rules response must be an array.");
  }

  for (const rule of rules) {
    validateRuleDto(rule);
  }

  return rules;
};

const validateCreatePayload = (payload: Omit<CreateRulePayload, "amount"> & { amount?: number | null }) => {
  ensureNonEmpty("oldBusinessName", payload.oldBusinessName);
  ensureOptionalRuleType("type", payload.type);
  ensureOptionalNonEmpty("description", payload.description);
  ensureOptionalNonEmpty("businessName", payload.businessName);
  ensureOptionalNonEmpty("category", payload.category);
  ensureOptionalNonEmpty("subCategory", payload.subCategory);

  if (payload.amount !== undefined && payload.amount !== null) {
    ensureNonNegative("amount", payload.amount);
  }
};

const validateUpdatePayload = (payload: Omit<UpdateRulePayload, "amount"> & { amount?: number | null }) => {
  ensureOptionalNonEmpty("oldBusinessName", payload.oldBusinessName);
  ensureOptionalRuleType("type", payload.type);
  ensureOptionalNonEmpty("description", payload.description);
  ensureOptionalNonEmpty("businessName", payload.businessName);
  ensureOptionalNonEmpty("category", payload.category);
  ensureOptionalNonEmpty("subCategory", payload.subCategory);

  if (payload.amount !== undefined && payload.amount !== null) {
    ensureNonNegative("amount", payload.amount);
  }
};

const buildCreatePayload = (payload: CreateRulePayload) => {
  const normalizedPayload = {
    oldBusinessName: normalizeRequiredString(payload.oldBusinessName),
    description: normalizeOptionalString(payload.description),
    businessName: normalizeOptionalString(payload.businessName),
    type: payload.type ?? null,
    amount: normalizeOptionalAmount(payload.amount),
    category: normalizeOptionalString(payload.category),
    subCategory: normalizeOptionalString(payload.subCategory),
  };

  validateCreatePayload(normalizedPayload);

  return normalizedPayload;
};

const buildUpdatePayload = (payload: UpdateRulePayload) => {
  const normalizedPayload = {
    oldBusinessName:
      payload.oldBusinessName === undefined ? undefined : normalizeOptionalString(payload.oldBusinessName),
    description:
      payload.description === undefined ? undefined : normalizeOptionalString(payload.description),
    businessName:
      payload.businessName === undefined ? undefined : normalizeOptionalString(payload.businessName),
    type: payload.type,
    amount: payload.amount === undefined ? undefined : normalizeOptionalAmount(payload.amount),
    category: payload.category === undefined ? undefined : normalizeOptionalString(payload.category),
    subCategory:
      payload.subCategory === undefined ? undefined : normalizeOptionalString(payload.subCategory),
  };

  validateUpdatePayload(normalizedPayload);

  const sanitizedPayload = Object.fromEntries(
    Object.entries(normalizedPayload).filter(([, value]) => value !== undefined && value !== null),
  ) as Partial<typeof normalizedPayload>;

  if (Object.keys(sanitizedPayload).length === 0) {
    throw new Error("At least one non-null rule field is required to update.");
  }

  return sanitizedPayload;
};

class RulesService {
  private async request<T>(path: string, init?: RequestInit) {
    return bfClient.request<T>({
      body: init?.body,
      contentType: init?.body ? "application/json" : undefined,
      errorFactory: (message, status, problem) => new RulesServiceError(message, status, problem),
      headers: init?.headers,
      method: init?.method,
      path: `/rules${path}`,
    });
  }

  async listRules() {
    const rules = await this.request<RuleDto[]>("", { method: "GET" });

    return validateRuleCollection(rules);
  }

  async getRule(ruleId: string) {
    if (!ruleId.trim()) {
      throw new Error("ruleId is required.");
    }

    const rule = await this.request<RuleDto>(`/${ruleId}`, { method: "GET" });

    validateRuleDto(rule);

    return rule;
  }

  async createRule(payload: CreateRulePayload) {
    const rule = await this.request<RuleDto>("", {
      body: JSON.stringify(buildCreatePayload(payload)),
      method: "POST",
    });

    validateRuleDto(rule);

    return rule;
  }

  async updateRule(ruleId: string, payload: UpdateRulePayload) {
    if (!ruleId.trim()) {
      throw new Error("ruleId is required.");
    }

    const rule = await this.request<RuleDto>(`/${ruleId}`, {
      body: JSON.stringify(buildUpdatePayload(payload)),
      method: "PATCH",
    });

    validateRuleDto(rule);

    return rule;
  }

  async deleteRule(ruleId: string) {
    if (!ruleId.trim()) {
      throw new Error("ruleId is required.");
    }

    await this.request<void>(`/${ruleId}`, {
      method: "DELETE",
    });
  }
}

export const rulesService = new RulesService();
