"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSignup } from "../hooks/useSignup";
import { AgreementCheckbox } from "./agreement-checkbox";
import { RoleSelector } from "./role-selector";
import { AGREEMENT_TYPES, REQUIRED_AGREEMENTS } from "@/constants/agreements";
import type { AgreementInput } from "../lib/dto";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
} from "../lib/validation";

type FormState = {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "influencer" | "advertiser" | null;
  agreements: AgreementInput[];
};

const defaultFormState: FormState = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: null,
  agreements: [],
};

export const SignupForm = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const { mutate, isPending, error: mutationError } = useSignup();

  const updateField = useCallback((field: keyof FormState, value: unknown) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const toggleAgreement = useCallback((type: AgreementInput['type'], checked: boolean) => {
    setFormState((prev) => {
      const filtered = prev.agreements.filter((a) => a.type !== type);
      if (checked) {
        return {
          ...prev,
          agreements: [...filtered, { type, agreed: true }],
        };
      }
      return { ...prev, agreements: filtered };
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    const nameError = validateName(formState.name);
    if (nameError) newErrors.name = nameError;

    const phoneError = validatePhone(formState.phone);
    if (phoneError) newErrors.phone = phoneError;

    const emailError = validateEmail(formState.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formState.password);
    if (passwordError) newErrors.password = passwordError;

    if (formState.password !== formState.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    if (!formState.role) {
      newErrors.role = "역할을 선택해주세요.";
    }

    const agreedTypes = formState.agreements
      .filter((a) => a.agreed)
      .map((a) => a.type);
    const missingRequired = REQUIRED_AGREEMENTS.some(
      (req) => !agreedTypes.includes(req),
    );
    if (missingRequired) {
      newErrors.agreements = "필수 약관에 모두 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      mutate(
        {
          name: formState.name,
          phone: formState.phone,
          email: formState.email,
          password: formState.password,
          role: formState.role!,
          agreements: formState.agreements,
        },
        {
          onSuccess: (data) => {
            if (data.role === "influencer") {
              router.push("/onboarding/influencer");
            } else {
              router.push("/onboarding/advertiser");
            }
          },
        },
      );
    },
    [formState, mutate, router, validate],
  );

  const isAgreementChecked = useCallback(
    (type: AgreementInput['type']) => {
      return formState.agreements.some((a) => a.type === type && a.agreed);
    },
    [formState.agreements],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">
          이름 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formState.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="홍길동"
        />
        {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">
          휴대폰번호 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formState.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="010-1234-5678"
        />
        {errors.phone && <p className="text-sm text-rose-500">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">
          이메일 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formState.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="example@email.com"
        />
        {errors.email && <p className="text-sm text-rose-500">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">
          비밀번호 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={formState.password}
          onChange={(e) => updateField("password", e.target.value)}
          placeholder="최소 8자 이상"
        />
        {errors.password && (
          <p className="text-sm text-rose-500">{errors.password}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">
          비밀번호 확인 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formState.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          placeholder="비밀번호를 다시 입력해주세요"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-rose-500">{errors.confirmPassword}</p>
        )}
      </div>

      <RoleSelector
        value={formState.role}
        onChange={(role) => updateField("role", role)}
        error={errors.role}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label className="font-medium">약관 동의</Label>
        <AgreementCheckbox
          type={AGREEMENT_TYPES.TERMS_OF_SERVICE}
          label="이용약관 동의"
          required
          checked={isAgreementChecked(AGREEMENT_TYPES.TERMS_OF_SERVICE)}
          onCheckedChange={(checked) =>
            toggleAgreement(AGREEMENT_TYPES.TERMS_OF_SERVICE, checked)
          }
        />
        <AgreementCheckbox
          type={AGREEMENT_TYPES.PRIVACY_POLICY}
          label="개인정보 처리방침 동의"
          required
          checked={isAgreementChecked(AGREEMENT_TYPES.PRIVACY_POLICY)}
          onCheckedChange={(checked) =>
            toggleAgreement(AGREEMENT_TYPES.PRIVACY_POLICY, checked)
          }
        />
        <AgreementCheckbox
          type={AGREEMENT_TYPES.MARKETING}
          label="마케팅 정보 수신 동의 (선택)"
          checked={isAgreementChecked(AGREEMENT_TYPES.MARKETING)}
          onCheckedChange={(checked) =>
            toggleAgreement(AGREEMENT_TYPES.MARKETING, checked)
          }
        />
        {errors.agreements && (
          <p className="text-sm text-rose-500">{errors.agreements}</p>
        )}
      </div>

      {mutationError && (
        <p className="text-sm text-rose-500">{mutationError.message}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "회원가입 중..." : "회원가입"}
      </Button>
    </form>
  );
};
