/**
 * Application feature constants
 */

/**
 * 지원서 메시지 최대 길이
 */
export const APPLICATION_MESSAGE_MAX_LENGTH = 500;

/**
 * 지원 상태 레이블
 */
export const APPLICATION_STATUS_LABELS = {
  pending: '대기중',
  selected: '선정됨',
  rejected: '미선정',
} as const;

/**
 * 지원 상태 뱃지 스타일
 */
export const APPLICATION_STATUS_BADGE_VARIANTS = {
  pending: { variant: 'secondary' as const, label: '대기중' },
  selected: { variant: 'default' as const, label: '선정됨' },
  rejected: { variant: 'outline' as const, label: '미선정' },
} as const;

/**
 * 폼 필드 레이블
 */
export const APPLICATION_FORM_LABELS = {
  message: '각오 한마디',
  visitDate: '방문 예정일자',
} as const;

/**
 * 폼 플레이스홀더
 */
export const APPLICATION_FORM_PLACEHOLDERS = {
  message: '이 체험단에 지원하는 이유와 각오를 작성해주세요',
  visitDate: '방문 예정 날짜를 선택하세요',
} as const;

/**
 * 에러 메시지
 */
export const APPLICATION_ERROR_MESSAGES = {
  messageRequired: '각오 한마디는 필수입니다.',
  messageMaxLength: `각오 한마디는 ${APPLICATION_MESSAGE_MAX_LENGTH}자 이하여야 합니다.`,
  visitDateRequired: '방문 예정일자는 필수입니다.',
  visitDateFuture: '방문 예정일은 오늘 이후여야 합니다.',
  visitDateInRange: '방문 예정일은 모집 기간 내여야 합니다.',
  alreadyApplied: '이미 지원한 체험단입니다.',
  campaignNotAvailable: '지원할 수 없는 체험단입니다.',
  unauthorized: '로그인이 필요합니다.',
  profileRequired: '인플루언서 프로필을 먼저 등록해주세요.',
  submitError: '지원서 제출 중 오류가 발생했습니다. 다시 시도해주세요.',
} as const;

/**
 * 성공 메시지
 */
export const APPLICATION_SUCCESS_MESSAGES = {
  submitted: '지원이 완료되었습니다.',
} as const;
