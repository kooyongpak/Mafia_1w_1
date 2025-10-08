"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AgreementType } from "@/constants/agreements";

type AgreementCheckboxProps = {
  type: AgreementType;
  label: string;
  required?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const AgreementCheckbox = ({
  type,
  label,
  required = false,
  checked,
  onCheckedChange,
}: AgreementCheckboxProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={type}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={type} className="text-sm">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </Label>
    </div>
  );
};
