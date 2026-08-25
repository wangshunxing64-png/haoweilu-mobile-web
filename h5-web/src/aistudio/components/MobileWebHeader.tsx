import React from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { ScreenType } from '../types';

interface MobileWebHeaderProps {
  currentScreen: ScreenType;
  onBack?: () => void;
  onGoHome?: () => void;
  onRefresh?: () => void;
  title?: string;
  progressStep?: number; // 1, 2, 3, 4
  showProgress?: boolean;
}

export const MobileWebHeader: React.FC<MobileWebHeaderProps> = ({
  currentScreen,
  onBack,
  onGoHome,
  title = '好味录',
  progressStep,
  showProgress = false,
}) => {
  const isHome = currentScreen === 'home';

  return (
    <header className="relative w-full bg-white z-30 select-none border-b border-[#F0F0F0] shadow-2xs">
      {/* Main Mobile Web Navigation Bar */}
      <div className="h-[52px] px-4 flex items-center justify-between">
        {/* Left Side: Brand avatar or Back Button */}
        <div className="flex items-center">
          {!isHome ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 -ml-1.5 px-2 py-1.5 rounded-lg text-[#2E2926] hover:bg-[#F5F5F5] active:bg-[#ECEBEA] transition-colors cursor-pointer"
              aria-label="返回上一页"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
              <span className="text-[13px] font-medium text-[#5A534E]">返回</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <img
                src="/haoweilu_avatar.png"
                alt="好味录头像"
                className="w-[36px] h-[36px] rounded-xl object-contain shadow-2xs border border-[#F4DDD5] bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center">
                <span
                  className="text-[18px] font-bold text-[#2E2926] tracking-[0.05em] leading-none"
                  style={{
                    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", "SimSun", "KaiTi", serif',
                  }}
                >
                  好味录
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Title for subpages if not home */}
        {!isHome && (
          <div className="text-center truncate max-w-[160px]">
            <span className="text-[15px] font-bold text-[#2E2926] tracking-tight block">
              {title}
            </span>
          </div>
        )}

        {/* Right Side: Clean layout (removed refresh & share buttons) */}
        <div className="flex items-center gap-1">
          {!isHome && onGoHome && (
            <button
              onClick={onGoHome}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5A534E] hover:bg-[#F5F5F5] active:bg-[#ECEBEA] transition-colors cursor-pointer"
              title="返回首页"
              aria-label="返回首页"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Top Multi-step Progress Bar (when in subflow) */}
      {showProgress && progressStep && (
        <div className="w-full h-[2.5px] bg-[#F0F0F0] overflow-hidden">
          <div
            className="h-full bg-[#932115] transition-all duration-300 ease-out"
            style={{
              width: `${(progressStep / 4) * 100}%`,
            }}
          />
        </div>
      )}
    </header>
  );
};
