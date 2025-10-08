const BUSINESS_NUMBER_REGEX = /^\d{10}$/;

export const isValidBusinessNumber = (value: string): boolean => {
  const cleaned = value.replace(/-/g, '');
  return BUSINESS_NUMBER_REGEX.test(cleaned);
};

export const formatBusinessNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{5})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  return value;
};

export const cleanBusinessNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

