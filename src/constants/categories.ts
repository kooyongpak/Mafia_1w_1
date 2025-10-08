export const ADVERTISER_CATEGORIES = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  BEAUTY: 'beauty',
  FASHION: 'fashion',
  LIFESTYLE: 'lifestyle',
  ELECTRONICS: 'electronics',
  EDUCATION: 'education',
  TRAVEL: 'travel',
  FITNESS: 'fitness',
  ETC: 'etc',
} as const;

export type AdvertiserCategory = (typeof ADVERTISER_CATEGORIES)[keyof typeof ADVERTISER_CATEGORIES];

export const CATEGORY_LABELS: Record<AdvertiserCategory, string> = {
  restaurant: '음식점',
  cafe: '카페',
  beauty: '뷰티/미용',
  fashion: '패션',
  lifestyle: '생활용품',
  electronics: '전자기기',
  education: '교육',
  travel: '여행/숙박',
  fitness: '헬스/피트니스',
  etc: '기타',
};

