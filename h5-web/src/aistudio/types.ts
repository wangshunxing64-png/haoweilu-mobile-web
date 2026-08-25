export type ScreenType =
  | 'home'
  | 'dish-selection'
  | 'experience-tags'
  | 'additional-message'
  | 'generating-loading'
  | 'ai-reviews'
  | 'platform-selection'
  | 'completion';

export type TabType = 'home' | 'assistant' | 'profile';

export interface DishItem {
  id: string;
  name: string;
  desc: string;
}

export interface ReviewOption {
  id: string;
  type: string;
  tag: string;
  content: string;
}

export interface PlatformOption {
  id: 'dianping' | 'meituan';
  name: string;
  iconText: string;
  iconBg: string;
  iconColor: string;
}

export interface AppState {
  currentScreen: ScreenType;
  activeTab: TabType;
  selectedDishes: string[];
  selectedTags: string[];
  message: string;
  selectedReviewId: string;
  selectedReview: string;
  selectedPlatform?: 'dianping' | 'meituan';
  claimReward: boolean;
  isRewardClaimed: boolean;
}
