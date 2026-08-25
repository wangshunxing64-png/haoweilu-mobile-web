export interface DishConfig {
  id: string;
  name: string;
  description: string;
}

export interface ExperienceTagConfig {
  id: string;
  name: string;
}

export interface TagGroupConfig {
  id: string;
  name: string;
  tags: ExperienceTagConfig[];
}

export interface ReviewStyleConfig {
  id: string;
  name: string;
  label: string;
  template: string;
}

export interface PublishPlatformConfig {
  id: string;
  name: string;
  url: string;
  actionHint: string;
  miniProgram: {
    appId: string;
    path: string;
  };
}

export interface MerchantConfig {
  id: string;
  name: string;
  storageKey: string;
  theme: Record<string, string>;
  ai: {
    provider: string;
    endpoint: string;
    model: string;
    fallbackToLocal: boolean;
  };
  copy: Record<string, unknown>;
  rules: {
    maxDishSelection: number;
    maxMessageLength: number;
    generationDelayMs: number;
  };
  dishes: DishConfig[];
  tagGroups: TagGroupConfig[];
  reviewStyles: ReviewStyleConfig[];
  platforms: PublishPlatformConfig[];
  store?: {
    id: string;
    name: string;
  };
}
