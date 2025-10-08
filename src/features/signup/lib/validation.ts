import { isValidPhoneNumber } from '@/lib/validation/phone';

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return '이메일을 입력해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return '휴대폰번호를 입력해주세요.';
  if (!isValidPhoneNumber(phone)) {
    return '올바른 휴대폰번호 형식이 아닙니다. (예: 010-1234-5678)';
  }
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) return '이름을 입력해주세요.';
  if (name.length < 2) return '이름은 최소 2자 이상이어야 합니다.';
  return null;
};
