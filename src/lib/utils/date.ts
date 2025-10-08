import { differenceInDays, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export const calculateDday = (targetDate: string | Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  target.setHours(0, 0, 0, 0);

  return differenceInDays(target, today);
};

export const formatDday = (dday: number): string => {
  if (dday === 0) return '오늘 마감';
  if (dday < 0) return '마감';
  return `D-${dday}`;
};

export const isDeadlineNear = (dday: number, threshold: number = 3): boolean => {
  return dday >= 0 && dday <= threshold;
};

export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
): string => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return `${format(start, 'M월 d일', { locale: ko })} ~ ${format(end, 'M월 d일', { locale: ko })}`;
};

export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
};

