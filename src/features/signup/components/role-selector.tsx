"use client";

import { Label } from "@/components/ui/label";

type Role = "influencer" | "advertiser";

type RoleSelectorProps = {
  value: Role | null;
  onChange: (role: Role) => void;
  error?: string | null;
};

export const RoleSelector = ({ value, onChange, error }: RoleSelectorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">
        역할 선택 <span className="text-rose-500">*</span>
      </Label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="role"
            value="influencer"
            checked={value === "influencer"}
            onChange={() => onChange("influencer")}
            className="h-4 w-4"
          />
          <span className="text-sm">인플루언서</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="role"
            value="advertiser"
            checked={value === "advertiser"}
            onChange={() => onChange("advertiser")}
            className="h-4 w-4"
          />
          <span className="text-sm">광고주</span>
        </label>
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
};
