'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessNumberInput } from './business-number-input';
import { useCreateAdvertiserProfile } from '../hooks/useCreateAdvertiserProfile';
import { validateCompanyName, validateLocation, validateBusinessNumberInput } from '../lib/validation';
import { cleanBusinessNumber } from '@/lib/validation/business-number';
import { ADVERTISER_CATEGORIES, CATEGORY_LABELS, type AdvertiserCategory } from '@/constants/categories';
import { useToast } from '@/hooks/use-toast';

type AdvertiserProfileFormProps = {
  userId: string;
};

type FormData = {
  companyName: string;
  location: string;
  category: AdvertiserCategory | '';
  businessRegistrationNumber: string;
};

type FormErrors = {
  companyName?: string;
  location?: string;
  category?: string;
  businessRegistrationNumber?: string;
};

export const AdvertiserProfileForm = ({ userId }: AdvertiserProfileFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    location: '',
    category: '',
    businessRegistrationNumber: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { mutate, isPending } = useCreateAdvertiserProfile();

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const companyNameError = validateCompanyName(formData.companyName);
    if (companyNameError) newErrors.companyName = companyNameError;

    const locationError = validateLocation(formData.location);
    if (locationError) newErrors.location = locationError;

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
    }

    const businessNumberError = validateBusinessNumberInput(formData.businessRegistrationNumber);
    if (businessNumberError) newErrors.businessRegistrationNumber = businessNumberError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      mutate(
        {
          userId,
          companyName: formData.companyName.trim(),
          location: formData.location.trim(),
          category: formData.category as AdvertiserCategory,
          businessRegistrationNumber: cleanBusinessNumber(formData.businessRegistrationNumber),
        },
        {
          onSuccess: (data) => {
            toast({
              title: '등록 완료',
              description: data.message,
            });
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          },
          onError: (error: any) => {
            const message = error?.response?.data?.error?.message || '광고주 정보 등록에 실패했습니다.';
            toast({
              title: '오류',
              description: message,
              variant: 'destructive',
            });
          },
        },
      );
    },
    [validate, mutate, userId, formData, router, toast],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="company-name">
          업체명 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company-name"
          type="text"
          placeholder="카페 블루밍"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          disabled={isPending}
          aria-invalid={!!errors.companyName}
        />
        {errors.companyName && (
          <p className="text-sm text-red-500" role="alert">
            {errors.companyName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">
          위치 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="서울특별시 강남구 테헤란로 123"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          disabled={isPending}
          aria-invalid={!!errors.location}
        />
        {errors.location && (
          <p className="text-sm text-red-500" role="alert">
            {errors.location}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          카테고리 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as AdvertiserCategory })}
          disabled={isPending}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      <BusinessNumberInput
        value={formData.businessRegistrationNumber}
        onChange={(value) => setFormData({ ...formData, businessRegistrationNumber: value })}
        error={errors.businessRegistrationNumber}
        disabled={isPending}
      />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '등록 중...' : '제출'}
      </Button>
    </form>
  );
};

