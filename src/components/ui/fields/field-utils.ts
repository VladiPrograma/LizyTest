import { type SelectFieldOption } from "@/components/ui/fields/types";

export const getSelectedOption = (options: SelectFieldOption[], value: string | number) => {
  const normalizedValue = String(value);

  return options.find((option) => String(option.value) === normalizedValue);
};

export const getOptionLabel = (options: SelectFieldOption[], value: string | number) => {
  return getSelectedOption(options, value)?.label ?? String(value);
};

export const normalizeSearchValue = (value: string) => value.trim().toLocaleLowerCase("es-ES");

export const formatAmountLabel = (value: string) => {
  if (!value) {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return `${amount.toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })} EUR`;
};
