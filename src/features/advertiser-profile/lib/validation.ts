import { isValidBusinessNumber } from '@/lib/validation/business-number';

export const validateCompanyName = (value: string): string | undefined => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return '업체명을 입력해주세요.';
  }
  
  if (trimmed.length < 2) {
    return '업체명은 최소 2자 이상이어야 합니다.';
  }
  
  if (trimmed.length > 255) {
    return '업체명은 최대 255자까지 가능합니다.';
  }
  
  return undefined;
};

export const validateLocation = (value: string): string | undefined => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return '위치를 입력해주세요.';
  }
  
  if (trimmed.length > 500) {
    return '위치는 최대 500자까지 가능합니다.';
  }
  
  return undefined;
};

export const validateBusinessNumberInput = (value: string): string | undefined => {
  if (!value || value.trim().length === 0) {
    return '사업자등록번호를 입력해주세요.';
  }
  
  if (!isValidBusinessNumber(value)) {
    return '올바른 사업자등록번호 형식이 아닙니다 (000-00-00000).';
  }
  
  return undefined;
};

