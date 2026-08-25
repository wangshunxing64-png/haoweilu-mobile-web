export interface Merchant { id: string; name: string }
export interface StoreInfo { id: string; name: string }
export interface Dish { id: string; name: string; description: string }
export interface ExperienceTag { id: string; name: string }
export interface Platform { id: "meituan" | "dianping" | string; name: string; url?: string; actionHint?: string }
export interface PublicConfig { merchant: Merchant; store: StoreInfo; dishes: Dish[]; tags: ExperienceTag[]; platforms?: Platform[]; rewards: unknown[] }
export interface ReviewSession { id: string; merchantId: string; storeId: string | null; dishIds: string[]; tagIds: string[]; message: string; status: string; expiresAt: string }
export interface Review { id: string; sessionId: string; styleId: string; styleName: string; styleLabel: string; content: string; selected: boolean; provider: string; model?: string }
export interface GenerateReviewResult { sessionId: string; reviews: Review[] }
export interface PreparePublishResult { publishId: string; platform: string; platformName: string; action: "open_app"; scheme: string; copyText: string; text: string; hint: string; url: string }
export interface PublishRecord { id: string; sessionId: string; userConfirmed: boolean; completedAt: string | null }
export interface RewardRecord { id: string; sessionId: string; rewardType: string; code: string; status: "CLAIMED" | "REDEEMED" | "EXPIRED"; expiresAt: string | null }
export interface AnalyticsInput { merchantId: string; storeId?: string; sessionId?: string; name: string; payload?: Record<string, unknown> }
