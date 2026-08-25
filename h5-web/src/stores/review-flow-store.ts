import { create } from "zustand";
import type { PublicConfig, Review, RewardRecord } from "../types/api";
import type { ReviewFlowState, Screen } from "../types/app";
const initial: ReviewFlowState = { screen: "home", sessionId: "", dishIds: [], tagIds: [], message: "", reviews: [], selectedReviewId: "", selectedContent: "", selectedPlatformId: "", loading: false, loadError: "", actionError: "" };
interface Actions {
  reset(): void; setScreen(screen: Screen): void; setConfig(config: PublicConfig): void; setSessionId(id: string): void; toggleDish(id: string): void; toggleTag(id: string): void; setMessage(value: string): void; setReviews(value: Review[]): void; selectReview(id: string, content: string): void; updateReview(id: string, content: string): void; selectPlatform(id: string): void; setReward(value?: RewardRecord): void; setLoading(value: boolean): void; setLoadError(value: string): void; setActionError(value: string): void; previousScreen(screen: Screen): Screen;
}
export const useReviewFlowStore = create<ReviewFlowState & Actions>((set, get) => ({ ...initial,
  reset: () => set({ ...initial }), setScreen: (screen) => set({ screen }), setConfig: (config) => set({ config }), setSessionId: (sessionId) => set({ sessionId }),
  toggleDish: (id) => set((s) => ({ dishIds: s.dishIds.includes(id) ? s.dishIds.filter((x) => x !== id) : s.dishIds.length < 5 ? [...s.dishIds, id] : s.dishIds })),
  toggleTag: (id) => set((s) => ({ tagIds: s.tagIds.includes(id) ? s.tagIds.filter((x) => x !== id) : [...s.tagIds, id] })), setMessage: (message) => set({ message: message.slice(0, 120) }), setReviews: (reviews) => set({ reviews }),
  selectReview: (selectedReviewId, selectedContent) => set({ selectedReviewId, selectedContent }), updateReview: (id, content) => set((s) => ({ reviews: s.reviews.map((r) => r.id === id ? { ...r, content } : r), selectedContent: s.selectedReviewId === id ? content : s.selectedContent })),
  selectPlatform: (selectedPlatformId) => set({ selectedPlatformId }), setReward: (reward) => set({ reward }), setLoading: (loading) => set({ loading }), setLoadError: (loadError) => set({ loadError }), setActionError: (actionError) => set({ actionError }),
  previousScreen: (screen) => ({ dishes: "home", tags: "dishes", message: "tags", generating: "message", reviews: "message", platform: "reviews", completion: "platform", home: "home" }[screen] as Screen),
}));
