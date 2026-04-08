import { type HTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";

export type SelectFieldOption = {
  label: string;
  value: string | number;
  iconName?: string;
};

export type SelectFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  className?: string;
};

export type CompactSelectFieldProps = {
  label: string;
  value: string | number;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  className?: string;
};

export type InputFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: "text" | "number";
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

export type AmountRangeFieldProps = {
  icon: LucideIcon;
  label: string;
  minValue: string;
  maxValue: string;
  onChange: (nextRange: { minValue: string; maxValue: string }) => void;
  className?: string;
};

export type SearchableSelectFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => Promise<SelectFieldOption | void> | SelectFieldOption | void;
  createOptionLabel?: string;
  className?: string;
  placeholder?: string;
  emptyMessage?: string;
};
