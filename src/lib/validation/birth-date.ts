import { differenceInYears } from 'date-fns';

export const MIN_AGE = 14;

export const validateBirthDate = (birthDate: string | Date): string | null => {
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  if (isNaN(date.getTime())) {
    return '올바른 날짜 형식이 아닙니다.';
  }

  if (date > new Date()) {
    return '생년월일은 오늘 이전 날짜여야 합니다.';
  }

  const age = differenceInYears(new Date(), date);
  if (age < MIN_AGE) {
    return `만 ${MIN_AGE}세 이상만 가입 가능합니다.`;
  }

  return null;
};

export const isValidBirthDate = (birthDate: string | Date): boolean => {
  return validateBirthDate(birthDate) === null;
};
