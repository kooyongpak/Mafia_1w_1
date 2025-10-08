'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBusinessNumber } from '@/lib/validation/business-number';

type BusinessNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export const BusinessNumberInput = ({
  value,
  onChange,
  error,
  disabled,
}: BusinessNumberInputProps) => {
  const [displayValue, setDisplayValue] = useState(formatBusinessNumber(value));

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const cleaned = input.replace(/\D/g, '');
      
      if (cleaned.length <= 10) {
        const formatted = formatBusinessNumber(cleaned);
        setDisplayValue(formatted);
        onChange(cleaned);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="business-number">
        사업자등록번호 <span className="text-red-500">*</span>
      </Label>
      <Input
        id="business-number"
        type="text"
        placeholder="000-00-00000"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? 'business-number-error' : undefined}
        maxLength={12}
      />
      {error && (
        <p id="business-number-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

