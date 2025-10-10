import { differenceInDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

/**
 * 모집 기간이 유효한지 확인
 */
export const isValidRecruitmentPeriod = (
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = startOfDay(new Date());

  if (isBefore(start, today)) {
    return { valid: false, error: '시작일은 오늘 이후여야 합니다.' };
  }

  if (!isAfter(end, start)) {
    return { valid: false, error: '종료일은 시작일 이후여야 합니다.' };
  }

  const days = differenceInDays(end, start);
  if (days > 90) {
    return { valid: false, error: '모집 기간은 최대 90일입니다.' };
  }

  if (days < 1) {
    return { valid: false, error: '모집 기간은 최소 1일 이상이어야 합니다.' };
  }

  return { valid: true };
};

/**
 * 모집 인원이 유효한지 확인
 */
export const isValidRecruitmentCount = (count: number): { valid: boolean; error?: string } => {
  if (count < 1) {
    return { valid: false, error: '모집 인원은 1명 이상이어야 합니다.' };
  }

  if (count > 1000) {
    return { valid: false, error: '모집 인원은 1000명 이하여야 합니다.' };
  }

  return { valid: true };
};
