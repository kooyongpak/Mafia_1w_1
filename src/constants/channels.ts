export const CHANNEL_TYPES = {
  NAVER: 'naver',
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  THREADS: 'threads',
} as const;

export type ChannelType = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES];

export const CHANNEL_URL_PATTERNS = {
  [CHANNEL_TYPES.NAVER]: /^https:\/\/blog\.naver\.com\/.+/,
  [CHANNEL_TYPES.YOUTUBE]: /^https:\/\/(www\.youtube\.com\/@|www\.youtube\.com\/c\/).+/,
  [CHANNEL_TYPES.INSTAGRAM]: /^https:\/\/www\.instagram\.com\/.+/,
  [CHANNEL_TYPES.THREADS]: /^https:\/\/www\.threads\.net\/@.+/,
} as const;

export const CHANNEL_LABELS = {
  [CHANNEL_TYPES.NAVER]: '네이버 블로그',
  [CHANNEL_TYPES.YOUTUBE]: '유튜브',
  [CHANNEL_TYPES.INSTAGRAM]: '인스타그램',
  [CHANNEL_TYPES.THREADS]: '스레드',
} as const;
