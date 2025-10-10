import { isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns';

/**
 * 날짜가 유효한지 확인
 */
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj);
};

/**
 * 날짜가 오늘 이후인지 확인
 */
export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = startOfDay(new Date());
  return isAfter(dateObj, today) || dateObj.getTime() === today.getTime();
};

/**
 * 날짜가 특정 범위 내에 있는지 확인
 *
 * @param date - 확인할 날짜
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜
 * @returns 범위 내에 있으면 true
 */
export const isDateInRange = (
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date,
): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  const afterStart = isAfter(dateObj, start) || dateObj.getTime() === start.getTime();
  const beforeEnd = isBefore(dateObj, end) || dateObj.getTime() === end.getTime();

  return afterStart && beforeEnd;
};

/**
 * 방문 예정일자 유효성 검증
 *
 * @param visitDate - 방문 예정일자
 * @param recruitmentStartDate - 모집 시작일
 * @param recruitmentEndDate - 모집 종료일
 * @returns { valid: boolean, error?: string }
 */
export const validateVisitDate = (
  visitDate: string,
  recruitmentStartDate: string,
  recruitmentEndDate: string,
): { valid: boolean; error?: string } => {
  if (!isValidDate(visitDate)) {
    return { valid: false, error: '유효한 날짜를 입력해주세요.' };
  }

  if (!isFutureDate(visitDate)) {
    return { valid: false, error: '방문 예정일은 오늘 이후여야 합니다.' };
  }

  if (!isDateInRange(visitDate, recruitmentStartDate, recruitmentEndDate)) {
    return { valid: false, error: '방문 예정일은 모집 기간 내여야 합니다.' };
  }

  return { valid: true };
};
