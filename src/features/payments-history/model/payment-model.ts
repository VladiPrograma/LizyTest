import { type CategoryDto } from "@/services/category.service";
import {
  type CreatePaymentPayload,
  type PaymentDto,
  type PaymentType,
  type UpdatePaymentPayload,
} from "@/services/payments.service";

const currencyPattern = /^[A-Z]{3}$/;
const amountEqualityThreshold = 0.000001;
const paymentDisplayDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const paymentMonthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" });

type PaymentDirection = "incoming" | "outgoing";

export type BulkUpdateScope = "same-business" | "same-business-and-amount";
export type RecurrencePreset = "1" | "2" | "3" | "6" | "12" | "custom";

export type PaymentEditForm = {
  date: string;
  description: string;
  businessName: string;
  type: PaymentType | "";
  amount: string;
  category: string;
  subCategory: string;
  currency: string;
  updateAll: boolean;
  bulkUpdateScope: BulkUpdateScope;
  recurrencePreset: RecurrencePreset;
  customRecurrenceMonths: string;
  isLoan: boolean;
  loanPaidAmount: string;
  loanTotalAmount: string;
};

export type PaymentRowEntry = {
  amount: number;
  business: string;
  category: string;
  categoryBadgeStyle: {
    backgroundColor: string;
    color: string;
  };
  categoryIconName?: string;
  description: string;
  direction: PaymentDirection;
  displayDate: string;
  id: string;
  paymentTypeLabel: string;
  periodMonth: string;
  periodYear: string;
  statusLabel?: string;
  subCategory: string | null;
  subCategoryBadgeStyle: {
    backgroundColor: string;
    color: string;
  };
  subCategoryIconName?: string;
};

const defaultCategoryBadgeStyle = {
  backgroundColor: "var(--bg-light)",
  color: "var(--text-secondary)",
};

const paymentTypeLabelByValue: Record<PaymentType, string> = {
  ADD: "Ingreso",
  DEBT: "Deuda",
  FIXED_RECURRING: "Pago Recurrente Fijo",
  LOAN: "Prestamo",
  SUBTRACT: "Pago",
  VARIABLE_RECURRING: "Pago Recurrente Variable",
};

export function getPaymentTypeLabel(type: PaymentType) {
  return paymentTypeLabelByValue[type];
}

export function getTablePaymentTypeLabel(type: PaymentType) {
  if (type === "FIXED_RECURRING") {
    return "Pago Fijo";
  }

  if (type === "VARIABLE_RECURRING") {
    return "Pago Variable";
  }

  return getPaymentTypeLabel(type);
}

export function getPaymentDirection(type: PaymentType): PaymentDirection {
  return type === "ADD" ? "incoming" : "outgoing";
}

export function isRecurringPaymentType(type: PaymentType | "") {
  return type === "FIXED_RECURRING" || type === "VARIABLE_RECURRING" || type === "LOAN";
}

export function toDisplayDate(date: string) {
  return paymentDisplayDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function toPeriodMonth(date: string) {
  const monthName = paymentMonthFormatter.format(new Date(`${date}T00:00:00Z`));

  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

export function normalizeCategoryName(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue.toLowerCase() : null;
}

export function mapPaymentToEntry(
  payment: PaymentDto,
  categoriesByName: Map<string, CategoryDto>,
  subcategoriesByName: Map<string, CategoryDto>,
): PaymentRowEntry {
  const normalizedCategoryName = normalizeCategoryName(payment.category);
  const normalizedSubCategoryName = normalizeCategoryName(payment.subCategory);
  const matchingCategory = normalizedCategoryName ? categoriesByName.get(normalizedCategoryName) : null;
  const matchingSubCategory = normalizedSubCategoryName ? subcategoriesByName.get(normalizedSubCategoryName) : null;

  return {
    amount: payment.amount,
    business: payment.businessName?.trim() || "Sin negocio",
    category: matchingCategory?.name ?? payment.category?.trim() ?? "Sin categorÃ­a",
    categoryBadgeStyle: matchingCategory
      ? {
          backgroundColor: matchingCategory.backgroundColor,
          color: matchingCategory.color,
        }
      : defaultCategoryBadgeStyle,
    categoryIconName: matchingCategory?.iconName,
    description: payment.description || (payment.type === "ADD" ? "Ingreso registrado" : "Movimiento registrado"),
    direction: getPaymentDirection(payment.type),
    displayDate: toDisplayDate(payment.date),
    id: payment.id,
    paymentTypeLabel: getPaymentTypeLabel(payment.type),
    periodMonth: toPeriodMonth(payment.date),
    periodYear: payment.date.slice(0, 4),
    statusLabel: payment.needsReview ? "Pendiente de procesar" : undefined,
    subCategory: matchingSubCategory?.name ?? payment.subCategory?.trim() ?? null,
    subCategoryBadgeStyle: matchingSubCategory
      ? {
          backgroundColor: matchingSubCategory.backgroundColor,
          color: matchingSubCategory.color,
        }
      : defaultCategoryBadgeStyle,
    subCategoryIconName: matchingSubCategory?.iconName,
  };
}

export function resolveParentCategoryName(
  subCategoryName: string | null | undefined,
  subcategoriesByName: Map<string, CategoryDto>,
  categoriesById: Map<string, CategoryDto>,
) {
  const normalizedSubCategoryName = normalizeCategoryName(subCategoryName);
  const matchingSubCategory = normalizedSubCategoryName ? subcategoriesByName.get(normalizedSubCategoryName) : null;

  if (!matchingSubCategory?.parent) {
    return null;
  }

  return categoriesById.get(matchingSubCategory.parent)?.name ?? null;
}

export function createPaymentEditForm(
  payment: PaymentDto,
  subcategoriesByName: Map<string, CategoryDto>,
  categoriesById: Map<string, CategoryDto>,
): PaymentEditForm {
  const parentCategoryName = resolveParentCategoryName(payment.subCategory, subcategoriesByName, categoriesById);

  return {
    amount: String(payment.amount),
    bulkUpdateScope: "same-business",
    businessName: payment.businessName ?? "",
    category: parentCategoryName ?? payment.category ?? "",
    subCategory: payment.subCategory ?? "",
    currency: payment.currency ?? "",
    date: payment.date,
    description: payment.description ?? "",
    type: payment.type,
    updateAll: Boolean(payment.businessName?.trim()),
    recurrencePreset: "1",
    customRecurrenceMonths: "",
    isLoan: payment.type === "LOAN",
    loanPaidAmount: "",
    loanTotalAmount: "",
  };
}

export function createEmptyPaymentEditForm(): PaymentEditForm {
  return {
    amount: "",
    bulkUpdateScope: "same-business",
    businessName: "",
    category: "",
    subCategory: "",
    currency: "",
    date: "",
    description: "",
    type: "",
    updateAll: false,
    recurrencePreset: "1",
    customRecurrenceMonths: "",
    isLoan: false,
    loanPaidAmount: "",
    loanTotalAmount: "",
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function resolvePaymentTypeForPayload(form: PaymentEditForm) {
  if (form.isLoan) {
    return "LOAN" as PaymentType;
  }

  return form.type as PaymentType;
}

export function validatePaymentEditForm(form: PaymentEditForm) {
  if (!form.date) {
    return "Debes indicar una fecha.";
  }

  if (!form.type) {
    return "Debes seleccionar un tipo.";
  }

  const amount = Number(form.amount);

  if (!form.amount || Number.isNaN(amount) || amount < 0) {
    return "El importe debe ser un numero valido mayor o igual a 0.";
  }

  const currency = normalizeCurrency(form.currency);

  if (currency && !currencyPattern.test(currency)) {
    return "La moneda debe usar un codigo ISO de 3 letras, por ejemplo EUR.";
  }

  if (isRecurringPaymentType(form.type) && form.recurrencePreset === "custom") {
    const customRecurrenceMonths = Number(form.customRecurrenceMonths);

    if (!form.customRecurrenceMonths.trim() || !Number.isInteger(customRecurrenceMonths) || customRecurrenceMonths < 1) {
      return "Debes indicar un numero entero de meses para la recurrencia personalizada.";
    }
  }

  if (form.isLoan) {
    const paidAmount = Number(form.loanPaidAmount);
    const totalAmount = Number(form.loanTotalAmount);

    if (!form.loanPaidAmount.trim() || Number.isNaN(paidAmount) || paidAmount < 0) {
      return "El importe pagado del prestamo debe ser un numero valido mayor o igual a 0.";
    }

    if (!form.loanTotalAmount.trim() || Number.isNaN(totalAmount) || totalAmount < 0) {
      return "El importe total del prestamo debe ser un numero valido mayor o igual a 0.";
    }

    if (totalAmount < paidAmount) {
      return "El total del prestamo no puede ser menor que la cantidad ya pagada.";
    }
  }

  return null;
}

export function buildCreatePaymentPayload(form: PaymentEditForm): CreatePaymentPayload {
  const normalizedDescription = normalizeOptionalText(form.description);
  const normalizedBusinessName = normalizeOptionalText(form.businessName);
  const normalizedCategory = normalizeOptionalText(form.category);
  const normalizedSubCategory = normalizeOptionalText(form.subCategory);
  const normalizedCurrency = normalizeCurrency(form.currency);

  return {
    amount: Number(form.amount),
    businessName: normalizedBusinessName,
    category: normalizedCategory,
    subCategory: normalizedSubCategory,
    currency: normalizedCurrency || null,
    date: form.date,
    description: normalizedDescription,
    needsReview: false,
    type: resolvePaymentTypeForPayload(form),
  };
}

export function buildPaymentUpdatePayload(payment: PaymentDto, form: PaymentEditForm): UpdatePaymentPayload {
  const payload: UpdatePaymentPayload = {};
  const normalizedDescription = normalizeOptionalText(form.description);
  const normalizedBusinessName = normalizeOptionalText(form.businessName);
  const normalizedCategory = normalizeOptionalText(form.category);
  const normalizedSubCategory = normalizeOptionalText(form.subCategory);
  const normalizedCurrency = normalizeCurrency(form.currency);
  const nextCurrency = normalizedCurrency ? normalizedCurrency : null;
  const nextAmount = Number(form.amount);
  const nextType = resolvePaymentTypeForPayload(form);

  if (form.date !== payment.date) {
    payload.date = form.date;
  }

  if (normalizedDescription !== payment.description) {
    payload.description = normalizedDescription;
  }

  if (normalizedBusinessName !== payment.businessName) {
    payload.businessName = normalizedBusinessName;
  }

  if (form.type && nextType !== payment.type) {
    payload.type = nextType;
  }

  if (Math.abs(nextAmount - payment.amount) > amountEqualityThreshold) {
    payload.amount = nextAmount;
  }

  if (normalizedCategory !== payment.category) {
    payload.category = normalizedCategory;
  }

  if (normalizedSubCategory !== payment.subCategory) {
    payload.subCategory = normalizedSubCategory;
  }

  if (nextCurrency !== payment.currency) {
    payload.currency = nextCurrency;
  }

  return payload;
}
