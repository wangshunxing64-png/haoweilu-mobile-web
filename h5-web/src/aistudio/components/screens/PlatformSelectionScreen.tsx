import React from 'react';
import { ChevronRight, PenLine, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PlatformSelectionScreenProps {
  selectedReview: string;
  claimReward: boolean;
  onToggleClaimReward: () => void;
  onOpenEditModal: () => void;
  onSelectPlatform: (platform: 'dianping' | 'meituan') => void;
  selectedPlatform?: 'dianping' | 'meituan';
  launchHint?: string;
  loading?: boolean;
  onContinue: () => void;
}

export const PlatformSelectionScreen: React.FC<PlatformSelectionScreenProps> = ({
  selectedReview,
  onOpenEditModal,
  onSelectPlatform,
  selectedPlatform,
  launchHint,
  loading,
  onContinue,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between px-4 pb-6 pt-3 bg-[#FAF8F5] select-none">
      <div className="w-full flex flex-col space-y-4">
        {/* Selected Review Summary Card */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8E8680] font-medium tracking-wide">
              已选就餐评价
            </span>
            <span className="text-[11px] text-[#932115] bg-[#FAF0EB] px-2 py-0.5 rounded-full font-semibold border border-[#F4DDD5]">
              已生成
            </span>
          </div>

          <p className="text-[13.5px] font-medium text-[#2E2926] leading-relaxed">
            {selectedReview}
          </p>

          <div className="pt-0.5 flex items-center justify-between border-t border-stone-100">
            <button
              onClick={onOpenEditModal}
              className="inline-flex items-center space-x-1 text-[12px] text-[#932115] font-semibold hover:underline cursor-pointer pt-1.5"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>点击可微调评价内容</span>
            </button>
            <span className="text-[11px] text-stone-400 pt-1.5">轻触编辑</span>
          </div>
        </div>

        {/* Platform Selection Section Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[13.5px] font-bold text-[#2E2926]">
              选择发布渠道
            </span>
            <span className="text-[11px] text-[#8E8680]">
              点击将自动复制评价文案
            </span>
          </div>

          {/* Platform Selection Module Cards */}
          <div className="flex flex-col space-y-3.5">
            {/* 美团 Module Card (Top) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlatform('meituan')}
              disabled={loading}
              className="w-full bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col space-y-3 hover:border-amber-300 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {/* 美团 Official App Icon */}
                  <img
                    src="/meituan_icon.png"
                    alt="美团"
                    className="w-12 h-12 rounded-2xl object-cover shadow-xs flex-shrink-0 border border-black/5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[15px] font-bold text-[#2E2926] tracking-tight">
                        发布到美团
                      </span>
                      <span className="text-[10px] font-bold text-[#996500] bg-[#FFF8DB] px-2 py-0.5 rounded-full border border-[#FFE799]">
                        官方推荐
                      </span>
                    </div>
                    <span className="text-[12px] text-[#7F7671] mt-1 block">
                      一键自动复制文案并前往美团商家评价页
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-[#D98200] group-hover:bg-[#FFF8DB] transition-colors flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Feature Pill in Card */}
              <div className="bg-[#FAF8F5] rounded-xl px-3 py-2 flex items-center justify-between border border-stone-100 text-[11.5px] text-[#6E6660]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5A800] animate-ping" />
                  <span>快捷粘贴即刻同步就餐体验</span>
                </span>
                <span className="text-[#B37700] font-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  前往发布 <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.button>

            {/* 大众点评 Module Card (Bottom) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlatform('dianping')}
              disabled={loading}
              className="w-full bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col space-y-3 hover:border-orange-300 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {/* 大众点评 Official App Icon */}
                  <img
                    src="/dianping_icon.png"
                    alt="大众点评"
                    className="w-12 h-12 rounded-2xl object-cover shadow-xs flex-shrink-0 border border-black/5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[15px] font-bold text-[#2E2926] tracking-tight">
                        发布到大众点评
                      </span>
                      <span className="text-[10px] font-bold text-[#FF5A1F] bg-[#FFF2EC] px-2 py-0.5 rounded-full border border-[#FFD8C9]">
                        同城评价
                      </span>
                    </div>
                    <span className="text-[12px] text-[#7F7671] mt-1 block">
                      一键自动复制文案并前往大众点评发布
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-[#FF5A1F] group-hover:bg-[#FFF2EC] transition-colors flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Feature Pill in Card */}
              <div className="bg-[#FAF8F5] rounded-xl px-3 py-2 flex items-center justify-between border border-stone-100 text-[11.5px] text-[#6E6660]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-ping" />
                  <span>支持优质笔记标签与星级同步</span>
                </span>
                <span className="text-[#FF5A1F] font-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  前往发布 <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.button>
          </div>
          {launchHint && selectedPlatform && (
            <div role="alert" className="rounded-2xl border border-[#F4DDD5] bg-white p-3.5 text-[12px] leading-relaxed text-[#784A3B] shadow-2xs">
              <p className="font-semibold">{launchHint}</p>
              <p className="mt-1 text-[#7F7671]">评价已复制，可手动打开{selectedPlatform === 'meituan' ? '美团' : '大众点评'}并搜索当前门店。</p>
              <button onClick={onContinue} className="mt-3 w-full h-10 rounded-full bg-[#932115] text-white font-semibold">我已手动打开，继续</button>
            </div>
          )}
        </div>

        {/* 3-Step Simple Flow Guide */}
        <div className="bg-[#FAF0EB]/60 rounded-2xl p-3 border border-[#F4DDD5] flex items-center justify-between text-[11.5px] text-[#784A3B] mt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-4.5 h-4.5 rounded-full bg-[#932115] text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span className="font-medium">选择平台</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-40" />
          <div className="flex items-center space-x-1.5">
            <span className="w-4.5 h-4.5 rounded-full bg-[#932115] text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span className="font-medium">自动复制</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-40" />
          <div className="flex items-center space-x-1.5">
            <span className="w-4.5 h-4.5 rounded-full bg-[#932115] text-white text-[10px] flex items-center justify-center font-bold">3</span>
            <span className="font-medium">粘贴发布</span>
          </div>
        </div>
      </div>
    </div>
  );
};
