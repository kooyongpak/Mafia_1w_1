"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BirthDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export const BirthDateInput = ({ value, onChange, error }: BirthDateInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="birthDate">
        생년월일 <span className="text-rose-500">*</span>
      </Label>
      <Input
        id="birthDate"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
};
