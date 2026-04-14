export type RewardItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  tier: 'small' | 'medium' | 'big';
};

export const REWARDS: RewardItem[] = [
  {
    id: 'candy',
    name: '사탕',
    emoji: '🍬',
    price: 100,
    description: '달콤한 사탕 하나',
    tier: 'small',
  },
  {
    id: 'chocolate',
    name: '초콜렛',
    emoji: '🍫',
    price: 200,
    description: '맛있는 초콜렛',
    tier: 'small',
  },
  {
    id: 'icecream',
    name: '아이스크림',
    emoji: '🍦',
    price: 300,
    description: '시원한 아이스크림',
    tier: 'medium',
  },
  {
    id: 'youtube30',
    name: '유투브 30분',
    emoji: '📺',
    price: 500,
    description: '좋아하는 영상 30분 시청권',
    tier: 'medium',
  },
  {
    id: 'kidscafe',
    name: '주말 키즈카페',
    emoji: '🎠',
    price: 2000,
    description: '주말에 키즈카페에서 신나게!',
    tier: 'big',
  },
  {
    id: 'toy',
    name: '장난감 선물',
    emoji: '🎁',
    price: 5000,
    description: '갖고 싶은 장난감을 골라요',
    tier: 'big',
  },
];

export function getReward(id: string): RewardItem | undefined {
  return REWARDS.find((r) => r.id === id);
}
