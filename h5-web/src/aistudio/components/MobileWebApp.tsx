import React, { useEffect, useState } from 'react';
import { ScreenType, TabType, AppState } from '../types';
import { MobileWebHeader } from './MobileWebHeader';
import { MobileWebTabBar } from './MobileWebTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { DishSelectionScreen } from './screens/DishSelectionScreen';
import { ExperienceTagsScreen } from './screens/ExperienceTagsScreen';
import { AdditionalMessageScreen } from './screens/AdditionalMessageScreen';
import { GeneratingLoadingScreen } from './screens/GeneratingLoadingScreen';
import { AiReviewsScreen } from './screens/AiReviewsScreen';
import { PlatformSelectionScreen } from './screens/PlatformSelectionScreen';
import { CompletionScreen } from './screens/CompletionScreen';
import { EditReviewModal } from './EditReviewModal';
import { RewardModal } from './RewardModal';
import { DesignSystemInspector } from './DesignSystemInspector';
import { BookOpen } from 'lucide-react';
import { reviewApi } from '../../services/api';
import { parseEntryParams } from '../../utils/entry-params';
import { launchPlatform } from '../../services/app-launcher';
import { track } from '../../services/analytics-service';
import { clearSessionCache, readSessionCache, saveSessionCache } from '../../utils/session-cache';
import type { PublicConfig, Review, RewardRecord } from '../../types/api';
import type { ReviewOption } from '../types';

interface MobileWebAppProps {
  showInspector: boolean;
  currentScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
}

export const MobileWebApp: React.FC<MobileWebAppProps> = ({
  showInspector,
  currentScreen,
  onChangeScreen,
}) => {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'home',
    activeTab: 'home',
    selectedDishes: [],
    selectedTags: [],
    message: '',
    selectedReviewId: '',
    selectedReview: '',
    selectedPlatform: undefined,
    claimReward: false,
    isRewardClaimed: false,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [config, setConfig] = useState<PublicConfig>();
  const [sessionId, setSessionId] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reward, setReward] = useState<RewardRecord>();
  const [flowError, setFlowError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [launchHint, setLaunchHint] = useState('');

  useEffect(() => {
    const entry = parseEntryParams(window.location.search);
    reviewApi.config(entry.storeId)
      .then(async (nextConfig) => {
        if (entry.merchantId && entry.merchantId !== nextConfig.merchant.id) {
          throw new Error('二维码商户信息与门店不匹配，请重新扫码');
        }
        const cached = readSessionCache(nextConfig.merchant.id, nextConfig.store.id);
        if (cached) {
          const restorable = ['home', 'dish-selection', 'experience-tags', 'additional-message'].includes(cached.screen)
            ? cached.screen as ScreenType
            : 'additional-message';
          setConfig(nextConfig);
          setSessionId(cached.sessionId);
          setAppState((prev) => ({ ...prev, activeTab: restorable === 'home' ? 'home' : 'assistant', selectedDishes: cached.dishIds, selectedTags: cached.tagIds, selectedReviewId: cached.selectedReviewId }));
          onChangeScreen(restorable);
          track({ merchantId: nextConfig.merchant.id, storeId: nextConfig.store.id, sessionId: cached.sessionId }, 'session_restored', { scene: entry.scene });
          return;
        }
        const session = await reviewApi.createSession({ merchantId: nextConfig.merchant.id, storeId: nextConfig.store.id });
        setConfig(nextConfig);
        setSessionId(session.id);
        track({ merchantId: nextConfig.merchant.id, storeId: nextConfig.store.id, sessionId: session.id }, 'scan_open', { scene: entry.scene });
      })
      .catch((error) => setFlowError(error instanceof Error ? error.message : '门店信息加载失败'));
  }, []);

  useEffect(() => {
    if (!config || !sessionId) return;
    saveSessionCache(config.merchant.id, config.store.id, {
      sessionId,
      screen: currentScreen,
      dishIds: appState.selectedDishes,
      tagIds: appState.selectedTags,
      selectedReviewId: appState.selectedReviewId,
    });
  }, [config, sessionId, currentScreen, appState.selectedDishes, appState.selectedTags, appState.selectedReviewId]);

  const trackEvent = (name: string, payload: Record<string, unknown> = {}) => {
    if (!config) return;
    track({ merchantId: config.merchant.id, storeId: config.store.id, sessionId }, name, payload);
  };

  // Sync prop changes
  const activeScreen = currentScreen;

  const handleStart = () => {
    setAppState((prev) => ({ ...prev, activeTab: 'assistant' }));
    onChangeScreen('dish-selection');
    trackEvent('flow_start');
  };

  const handleToggleDish = (dishId: string) => {
    setAppState((prev) => {
      const exists = prev.selectedDishes.includes(dishId);
      if (exists) {
        return {
          ...prev,
          selectedDishes: prev.selectedDishes.filter((id) => id !== dishId),
        };
      } else {
        if (prev.selectedDishes.length >= 6) return prev;
        return {
          ...prev,
          selectedDishes: [...prev.selectedDishes, dishId],
        };
      }
    });
  };

  const handleToggleTag = (tag: string) => {
    setAppState((prev) => {
      const exists = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: exists
          ? prev.selectedTags.filter((t) => t !== tag)
          : [...prev.selectedTags, tag],
      };
    });
  };

  const handleSelectReview = async (reviewText: string) => {
    const review = reviews.find((item) => item.content === reviewText);
    if (!review) return;
    setBusyAction('select-review');
    setFlowError('');
    try {
      await reviewApi.selectReview(review.id, reviewText);
      setAppState((prev) => ({ ...prev, selectedReviewId: review.id, selectedReview: reviewText }));
      trackEvent('review_selected', { reviewId: review.id, styleId: review.styleId });
      onChangeScreen('platform-selection');
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '评价选择失败，请重试');
    } finally {
      setBusyAction('');
    }
  };

  const handleSelectPlatform = async (platform: 'dianping' | 'meituan') => {
    if (!config) return;
    setBusyAction('launch-platform');
    setFlowError('');
    setLaunchHint('');
    try {
      const prepared = await reviewApi.preparePublish(sessionId, platform);
      const result = await launchPlatform({ platform, scheme: prepared.scheme, copyText: prepared.copyText || appState.selectedReview, storeName: config.store.name });
      setAppState((prev) => ({ ...prev, selectedPlatform: platform }));
      trackEvent('platform_clicked', { platformId: platform, opened: result.opened });
      if (result.opened) onChangeScreen('completion');
      else setLaunchHint(result.hint);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '复制或打开应用失败，请重试');
    } finally {
      setBusyAction('');
    }
  };

  const handleToggleClaimReward = () => {
    setAppState((prev) => ({
      ...prev,
      claimReward: !prev.claimReward,
    }));
  };

  const handleSaveEditedReview = async (newText: string) => {
    if (!appState.selectedReviewId) return;
    setBusyAction('edit-review');
    setFlowError('');
    try {
      await reviewApi.selectReview(appState.selectedReviewId, newText);
      setAppState((prev) => ({ ...prev, selectedReview: newText }));
      trackEvent('review_edited', { reviewId: appState.selectedReviewId });
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '评价修改保存失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleComplete = async () => {
    if (busyAction) return;
    setBusyAction('complete');
    setFlowError('');
    try {
      await reviewApi.completePublish(sessionId);
      trackEvent('publish_confirmed', { platformId: appState.selectedPlatform, rewardRequested: appState.claimReward });
      if (appState.claimReward) {
        const nextReward = await reviewApi.claimReward(sessionId);
        setReward(nextReward);
        trackEvent('reward_claimed', { rewardType: nextReward.rewardType });
      } else {
        setReward(undefined);
      }
      if (config) clearSessionCache(config.merchant.id, config.store.id);
      setIsRewardModalOpen(true);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '完成反馈失败，请重试');
    } finally {
      setBusyAction('');
    }
  };

  const handleRestart = () => {
    setAppState({
      currentScreen: 'home',
      activeTab: 'home',
      selectedDishes: [],
      selectedTags: [],
      message: '',
      selectedReviewId: '',
      selectedReview: '',
      selectedPlatform: undefined,
      claimReward: false,
      isRewardClaimed: true,
    });
    if (config) clearSessionCache(config.merchant.id, config.store.id);
    onChangeScreen('home');
  };

  const handleBack = () => {
    switch (activeScreen) {
      case 'dish-selection':
        onChangeScreen('home');
        break;
      case 'experience-tags':
        onChangeScreen('dish-selection');
        break;
      case 'generating-loading':
        onChangeScreen('additional-message');
        break;
      case 'additional-message':
        onChangeScreen('experience-tags');
        break;
      case 'ai-reviews':
        onChangeScreen('experience-tags');
        break;
      case 'platform-selection':
        onChangeScreen('ai-reviews');
        break;
      case 'completion':
        onChangeScreen('platform-selection');
        break;
      default:
        onChangeScreen('home');
        break;
    }
  };

  const handleGoHome = () => {
    setAppState((prev) => ({ ...prev, activeTab: 'home' }));
    onChangeScreen('home');
  };

  // Progress bar step calculation
  let progressStep = 0;
  let showProgress = false;
  if (activeScreen === 'dish-selection') {
    progressStep = 1;
    showProgress = true;
  } else if (activeScreen === 'experience-tags') {
    progressStep = 2;
    showProgress = true;
  } else if (activeScreen === 'additional-message') {
    progressStep = 3;
    showProgress = true;
  } else if (activeScreen === 'generating-loading') {
    progressStep = 3.5;
    showProgress = true;
  } else if (activeScreen === 'ai-reviews') {
    progressStep = 4;
    showProgress = true;
  }

  // Header Title
  let headerTitle = '好味录';
  if (activeScreen === 'dish-selection') {
    headerTitle = '智能选菜';
  } else if (activeScreen === 'experience-tags') {
    headerTitle = '用餐感受';
  } else if (activeScreen === 'additional-message') {
    headerTitle = '补充感受';
  } else if (activeScreen === 'generating-loading') {
    headerTitle = '聆听心声';
  } else if (activeScreen === 'ai-reviews') {
    headerTitle = '智能生成评价';
  } else if (activeScreen === 'platform-selection') {
    headerTitle = '选择发布平台';
  } else if (activeScreen === 'completion') {
    headerTitle = '完成评价';
  }

  const handleGenerate = async () => {
    if (!config || !sessionId || isGenerating) return;
    setIsGenerating(true);
    setFlowError('');
    onChangeScreen('generating-loading');
    try {
      await reviewApi.updateSession(sessionId, { dishIds: appState.selectedDishes, tagIds: appState.selectedTags, message: appState.message });
      const result = await reviewApi.generateReviews({ merchantId: config.merchant.id, storeId: config.store.id, sessionId, input: { dishes: appState.selectedDishes, tags: appState.selectedTags, message: appState.message } });
      setReviews(result.reviews);
      trackEvent('review_generated', { reviewCount: result.reviews.length, dishCount: appState.selectedDishes.length, tagCount: appState.selectedTags.length, hasMessage: Boolean(appState.message.trim()) });
      window.setTimeout(() => onChangeScreen('ai-reviews'), 2600);
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '评价生成失败，请重试');
      onChangeScreen('additional-message');
    } finally {
      setIsGenerating(false);
    }
  };

  const reviewOptions: ReviewOption[] = reviews.map((review) => ({ id: review.id, type: `✦ ${review.styleName}`, tag: review.styleLabel, content: review.content }));

  return (
    <div className="relative w-[380px] max-w-[100vw] h-[720px] bg-white rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col justify-between border border-[#E5E0DC] sm:border-[6px] sm:border-[#1A1A1A] select-none">
      {/* Design System Measurement Inspector Overlay */}
      <DesignSystemInspector active={showInspector} />

      {/* Mobile Web Header (Browser status + H5 Web navigation) */}
      <MobileWebHeader
        currentScreen={activeScreen}
        onBack={handleBack}
        onGoHome={handleGoHome}
        onRefresh={() => {
          if (activeScreen === 'home') handleRestart();
        }}
        title={headerTitle}
        progressStep={progressStep}
        showProgress={showProgress}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative no-scrollbar bg-[#FAF8F5]">
        {/* If user selected "Inspiration library" tab on home */}
        {appState.activeTab === 'profile' && activeScreen === 'home' ? (
          <div className="flex-1 p-5 flex flex-col justify-center space-y-4">
            <div className="flex items-center space-x-2 text-[#932115]">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-[17px] font-bold text-[#2E2926]">真实表达灵感库</h2>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs text-center space-y-2">
              <p className="text-[14px] font-semibold text-[#2E2926]">内容正在整理</p>
              <p className="text-xs text-[#7F7671] leading-relaxed">仅展示经审核的真实表达，不提供写死的好评模板。</p>
            </div>

            <button
              onClick={() => {
                setAppState((prev) => ({ ...prev, activeTab: 'home' }));
              }}
              className="w-full py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-medium text-[#5A534E] hover:bg-stone-50 transition-colors cursor-pointer"
            >
              返回首页
            </button>
          </div>
        ) : (
          <div key={activeScreen} className="flex-1 w-full flex flex-col">
            {activeScreen === 'home' && <HomeScreen onStart={handleStart} />}

            {activeScreen === 'dish-selection' && (
              <DishSelectionScreen
                dishes={(config?.dishes ?? []).map((dish) => ({ id: dish.id, name: dish.name, desc: dish.description }))}
                selectedDishes={appState.selectedDishes}
                onToggleDish={handleToggleDish}
                onNext={() => onChangeScreen('experience-tags')}
              />
            )}

            {activeScreen === 'experience-tags' && (
              <ExperienceTagsScreen
                tags={config?.tags ?? []}
                selectedTags={appState.selectedTags}
                onToggleTag={handleToggleTag}
                onNext={() => onChangeScreen('additional-message')}
              />
            )}

            {activeScreen === 'additional-message' && (
              <AdditionalMessageScreen
                value={appState.message}
                error={flowError}
                loading={isGenerating}
                onChange={(message) => setAppState((prev) => ({ ...prev, message }))}
                onGenerate={handleGenerate}
              />
            )}

            {activeScreen === 'generating-loading' && (
              <GeneratingLoadingScreen
                selectedTags={appState.selectedTags}
                autoTransition={false}
                onComplete={() => undefined}
              />
            )}

            {activeScreen === 'ai-reviews' && (
              <AiReviewsScreen reviews={reviewOptions} onSelectReview={handleSelectReview} onRegenerate={handleGenerate} isRegenerating={isGenerating} />
            )}

            {activeScreen === 'platform-selection' && (
              <PlatformSelectionScreen
                selectedReview={appState.selectedReview}
                claimReward={appState.claimReward}
                onToggleClaimReward={handleToggleClaimReward}
                onOpenEditModal={() => setIsEditModalOpen(true)}
                onSelectPlatform={handleSelectPlatform}
                selectedPlatform={appState.selectedPlatform}
                launchHint={launchHint}
                loading={busyAction === 'launch-platform'}
                onContinue={() => onChangeScreen('completion')}
              />
            )}

            {activeScreen === 'completion' && (
              <CompletionScreen
                selectedReview={appState.selectedReview}
                selectedPlatform={appState.selectedPlatform}
                claimReward={appState.claimReward}
                onToggleClaimReward={handleToggleClaimReward}
                onOpenEditModal={() => setIsEditModalOpen(true)}
                onComplete={handleComplete}
                loading={busyAction === 'complete'}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Mobile Web TabBar (Shown on Home View) */}
      {activeScreen === 'home' && (
        <MobileWebTabBar
          activeTab={appState.activeTab}
          onTabChange={(tab) => {
            setAppState((prev) => ({ ...prev, activeTab: tab }));
          }}
          onStartAssistant={handleStart}
        />
      )}

      {/* Micro-tune Edit Review Modal */}
      <EditReviewModal
        initialText={appState.selectedReview}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(text) => { void handleSaveEditedReview(text); }}
      />

      {/* Reward Completion Celebration Modal */}
      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onRestart={handleRestart}
        reward={reward}
      />
      {flowError && <div className="absolute left-4 right-4 bottom-20 z-40 rounded-xl bg-white border border-red-200 px-3 py-2 text-xs text-[#932115] shadow-lg">{flowError}</div>}
    </div>
  );
};
