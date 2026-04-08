"use client";

import { bfClient, type ProblemDetails } from "@/services/bf-client";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type CategoryDto = {
  id: string;
  name: string;
  parent: string | null;
  backgroundColor: string;
  color: string;
  iconName: string;
};

export type CreateCategoryPayload = {
  name: string;
  parent?: string | null;
};

export type UpdateCategoryPayload = {
  name?: string;
  backgroundColor?: string;
  color?: string;
  iconName?: string;
};

export class CategoryServiceError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "CategoryServiceError";
    this.status = status;
    this.problem = problem;
  }
}

const mapSubcategoryRequestError = (error: unknown, message: string) => {
  if (error instanceof CategoryServiceError && error.status === 404) {
    return new CategoryServiceError(message, error.status, null);
  }

  return error;
};

const ensureNonEmpty = (fieldName: string, value: string) => {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

const ensureOptionalHexColor = (fieldName: string, value?: string) => {
  if (value !== undefined && !HEX_COLOR_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a valid hex color.`);
  }
};

const ensureOptionalNonEmpty = (fieldName: string, value?: string) => {
  if (value !== undefined && !value.trim()) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
};

const validateCategoryDto = (category: CategoryDto) => {
  ensureNonEmpty("id", category.id);
  ensureNonEmpty("name", category.name);
  ensureNonEmpty("iconName", category.iconName);
  ensureOptionalNonEmpty("parent", category.parent ?? undefined);

  if (!HEX_COLOR_PATTERN.test(category.backgroundColor)) {
    throw new Error("backgroundColor must be a valid hex color.");
  }

  if (!HEX_COLOR_PATTERN.test(category.color)) {
    throw new Error("color must be a valid hex color.");
  }
};

const validateCategoryCollection = (categories: CategoryDto[]) => {
  if (!Array.isArray(categories)) {
    throw new Error("Categories response must be an array.");
  }

  for (const category of categories) {
    validateCategoryDto(category);
  }

  return categories;
};

const sortCategoriesByName = (categories: CategoryDto[]) =>
  categories.toSorted((left, right) => left.name.localeCompare(right.name, "es"));

const validateCreatePayload = (payload: CreateCategoryPayload) => {
  ensureNonEmpty("name", payload.name);
  ensureOptionalNonEmpty("parent", payload.parent ?? undefined);
};

const validateUpdatePayload = (payload: UpdateCategoryPayload) => {
  ensureOptionalNonEmpty("name", payload.name);
  ensureOptionalHexColor("backgroundColor", payload.backgroundColor);
  ensureOptionalHexColor("color", payload.color);
  ensureOptionalNonEmpty("iconName", payload.iconName);
};

const sanitizePayload = <T extends Record<string, unknown>>(payload: T) => {
  const sanitized = {} as Partial<T>;

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
};

class CategoryService {
  private async request<T>(path: string, init?: RequestInit) {
    return bfClient.request<T>({
      body: init?.body,
      contentType: init?.body ? "application/json" : undefined,
      errorFactory: (message, status, problem) => new CategoryServiceError(message, status, problem),
      headers: init?.headers,
      method: init?.method,
      path: `/categories${path}`,
    });
  }

  async listCategories() {
    const categories = await this.request<CategoryDto[]>("", { method: "GET" });

    return validateCategoryCollection(categories);
  }

  async listSubcategories() {
    try {
      const categories = await this.request<CategoryDto[]>("/subcategories", { method: "GET" });

      return sortCategoriesByName(validateCategoryCollection(categories));
    } catch (error) {
      throw mapSubcategoryRequestError(error, "Subcategorias no encontradas.");
    }
  }

  async listSubcategoriesByParent(parentId: string) {
    if (!parentId.trim()) {
      throw new Error("parentId is required.");
    }

    try {
      const categories = await this.request<CategoryDto[]>(`/${parentId}/subcategories`, { method: "GET" });

      return sortCategoriesByName(validateCategoryCollection(categories));
    } catch (error) {
      throw mapSubcategoryRequestError(error, "Subcategorias no encontradas para la categoria seleccionada.");
    }
  }

  async getCategory(categoryId: string) {
    if (!categoryId.trim()) {
      throw new Error("categoryId is required.");
    }

    const category = await this.request<CategoryDto>(`/${categoryId}`, { method: "GET" });

    validateCategoryDto(category);

    return category;
  }

  async createCategory(payload: CreateCategoryPayload) {
    validateCreatePayload(payload);

    const category = await this.request<CategoryDto>("", {
      body: JSON.stringify({
        name: payload.name.trim(),
        parent: payload.parent ?? null,
      }),
      method: "POST",
    });

    validateCategoryDto(category);

    return category;
  }

  async updateCategory(categoryId: string, payload: UpdateCategoryPayload) {
    if (!categoryId.trim()) {
      throw new Error("categoryId is required.");
    }

    const sanitizedPayload = sanitizePayload(payload);

    if (Object.keys(sanitizedPayload).length === 0) {
      throw new Error("At least one field is required to update the category.");
    }

    validateUpdatePayload(sanitizedPayload);

    const category = await this.request<CategoryDto>(`/${categoryId}`, {
      body: JSON.stringify(sanitizedPayload),
      method: "PATCH",
    });

    validateCategoryDto(category);

    return category;
  }

  async deleteCategory(categoryId: string) {
    if (!categoryId.trim()) {
      throw new Error("categoryId is required.");
    }

    await this.request<void>(`/${categoryId}`, {
      method: "DELETE",
    });
  }
}

export const categoryService = new CategoryService();
