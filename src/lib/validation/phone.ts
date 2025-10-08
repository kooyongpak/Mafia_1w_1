export const PHONE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/;

export const isValidPhoneNumber = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  return phone;
};
