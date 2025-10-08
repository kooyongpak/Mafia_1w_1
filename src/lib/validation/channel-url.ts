import { CHANNEL_TYPES, CHANNEL_URL_PATTERNS, type ChannelType } from '@/constants/channels';

export const validateChannelUrl = (
  channelType: ChannelType,
  url: string,
): string | null => {
  const pattern = CHANNEL_URL_PATTERNS[channelType];

  if (!pattern) {
    return '지원하지 않는 채널 유형입니다.';
  }

  if (!pattern.test(url)) {
    return `올바른 ${channelType} URL 형식이 아닙니다.`;
  }

  return null;
};

export const isValidChannelUrl = (
  channelType: ChannelType,
  url: string,
): boolean => {
  return validateChannelUrl(channelType, url) === null;
};
