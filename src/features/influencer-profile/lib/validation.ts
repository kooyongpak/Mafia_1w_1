import { validateBirthDate } from '@/lib/validation/birth-date';
import { validateChannelUrl } from '@/lib/validation/channel-url';
import type { ChannelType } from '@/constants/channels';

export const validateBirthDateInput = (birthDate: string): string | null => {
  if (!birthDate) {
    return '생년월일을 입력해주세요.';
  }
  return validateBirthDate(new Date(birthDate));
};

export const validateChannelUrlInput = (channelType: ChannelType, url: string): string | null => {
  if (!url) {
    return 'URL을 입력해주세요.';
  }
  return validateChannelUrl(channelType, url);
};

export const validateChannelName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return '채널명을 입력해주세요.';
  }
  if (name.length > 255) {
    return '채널명은 255자 이하여야 합니다.';
  }
  return null;
};
