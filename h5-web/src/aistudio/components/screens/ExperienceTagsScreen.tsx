import React from 'react';
import { Check, Sparkles, Utensils, HeartHandshake, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExperienceTagsScreenProps {
  tags: Array<{ id: string; name: string }>;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onNext: () => void;
}

export const ExperienceTagsScreen: React.FC<ExperienceTagsScreenProps> = ({
  tags,
  selectedTags,
  onToggleTag,
  onNext,
}) => {
  const splitAt = Math.ceil(tags.length / 2);
  const flavorTags = tags.slice(0, splitAt);
  const serviceTags = tags.slice(splitAt);

  return (
    <div className="flex-1 flex flex-col justify-between px-4 pb-6 pt-3 bg-[#FAF8F5] select-none">
      <div className="w-full flex flex-col space-y-3.5">
        {/* Timestamp with pill */}
        <div className="text-center py-0.5">
          <span className="text-[11px] text-[#A69E98] tracking-wider font-medium bg-stone-200/40 px-2.5 py-0.5 rounded-full">
            步骤二 · 用餐真实感受
          </span>
        </div>

        {/* AI Assistant Chat Stream */}
        <div className="flex items-start space-x-3">
          {/* Brand assistant avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF0EA] to-[#FAF0EB] text-[#932115] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#F4DDD5] shadow-xs">
            李记
          </div>

          {/* Chat Bubbles */}
          <div className="flex flex-col space-y-1.5 max-w-[280px]">
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[14px] text-[#2E2926] leading-relaxed shadow-2xs border border-stone-100 font-medium">
              哪些地方让你印象深刻？
            </div>
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[13px] text-[#5A534E] leading-relaxed shadow-2xs border border-stone-100">
              请选择真实感受，可勾选多个维度。
            </div>
          </div>
        </div>

        {/* Group 1: 菜品口感与分量 */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2E2926]">
              <Utensils className="w-3.5 h-3.5 text-[#932115]" />
              <span>菜品风味与分量</span>
            </div>
            <span className="text-[11px] text-[#8E8680]">口感维度</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {flavorTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <motion.button
                  key={tag.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleTag(tag.id)}
                  className={`h-[42px] px-3 rounded-xl text-[13px] font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#932115] text-white shadow-xs border border-[#932115]'
                      : 'bg-[#FAF8F5] text-[#3E3833] border border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <span className="truncate">{tag.name}</span>
                  <motion.div
                    animate={isSelected ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-1 ${
                      isSelected ? 'bg-white/20 text-white' : 'text-stone-300'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${isSelected ? 'stroke-[3]' : 'opacity-0'}`} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Group 2: 门店服务与环境 */}
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2E2926]">
              <HeartHandshake className="w-3.5 h-3.5 text-[#932115]" />
              <span>服务体验与环境</span>
            </div>
            <span className="text-[11px] text-[#8E8680]">就餐体验</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {serviceTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <motion.button
                  key={tag.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleTag(tag.id)}
                  className={`h-[42px] px-3 rounded-xl text-[13px] font-medium flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#932115] text-white shadow-xs border border-[#932115]'
                      : 'bg-[#FAF8F5] text-[#3E3833] border border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <span className="truncate">{tag.name}</span>
                  <motion.div
                    animate={isSelected ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-1 ${
                      isSelected ? 'bg-white/20 text-white' : 'text-stone-300'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${isSelected ? 'stroke-[3]' : 'opacity-0'}`} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* AI Selection Summary & Preview Tip Box with Dynamic Glow */}
        <div
          className={`border rounded-2xl p-3 flex items-start space-x-2.5 shadow-2xs transition-colors ${
            selectedTags.length > 0
              ? 'border-[#FCDACE] bg-[#FFF8F6]'
              : 'border-stone-200/80 bg-[#FAF8F5]'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-[#FAF0EB] text-[#932115] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#932115]">
                已选 {selectedTags.length} 个体验维度
              </span>
              <span className="text-[10px] text-[#8E8680]">智能解析中</span>
            </div>
            <p className="text-[11.5px] text-[#5A534E] mt-0.5 leading-relaxed truncate">
              {selectedTags.length > 0
                ? selectedTags.map((id) => tags.find((tag) => tag.id === id)?.name).filter(Boolean).join(' · ')
                : '请勾选上方印象深刻的就餐感受'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky CTA Button */}
      <div className="w-full flex flex-col items-center mt-5 pt-1">
        <motion.button
          whileHover={{ scale: selectedTags.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selectedTags.length > 0 ? 0.98 : 1 }}
          onClick={onNext}
          disabled={selectedTags.length === 0}
          className={`w-full max-w-[312px] h-[52px] rounded-full flex items-center justify-center text-[15px] font-semibold tracking-wide transition-all cursor-pointer shadow-xs gap-1.5 ${
            selectedTags.length > 0
              ? 'bg-[#932115] text-white hover:bg-[#831D12] shadow-[#932115]/20 shadow-md'
              : 'bg-[#ECE5E0] text-[#A69E98] cursor-not-allowed opacity-80'
          }`}
        >
          <span>下一步：开始聆听构思</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
