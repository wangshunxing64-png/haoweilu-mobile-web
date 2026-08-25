import React from 'react';
import { RefreshCw, ChevronRight, Sparkles, Check, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReviewOption } from '../../types';

interface AiReviewsScreenProps {
  reviews: ReviewOption[];
  onSelectReview: (reviewText: string) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export const AiReviewsScreen: React.FC<AiReviewsScreenProps> = ({ reviews, onSelectReview, onRegenerate, isRegenerating = false }) => {

  return (
    <div className="flex-1 flex flex-col justify-between px-4 pb-8 pt-3 bg-[#FAF8F5] select-none">
      <div className="w-full flex flex-col space-y-4">
        {/* Header Title Section */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-[#932115] text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能构思完成</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-[#2E2926] tracking-tight">
            已为您定制 3 种专属评价
          </h2>
          <p className="text-[13px] text-[#7F7671] mt-1 leading-normal">
            请挑选最贴合您心意的一段，点击确认即可一键分发发布。
          </p>
        </div>

        {/* 3 Review Cards Stack */}
        <div className="flex flex-col space-y-3.5">
          <div className="flex flex-col space-y-3.5">
            {reviews.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs flex flex-col space-y-3 transition-all hover:border-[#F4DDD5] hover:shadow-xs group relative overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#932115] text-xs">✦</span>
                    <span className="text-[15px] font-bold text-[#2E2926]">
                      {item.type.replace('✦ ', '')}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0EB] text-[#932115] text-[11px] font-semibold border border-[#F4DDD5] whitespace-nowrap">
                    {item.tag}
                  </span>
                </div>

                {/* Card Content Box */}
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl text-[13.5px] leading-relaxed text-[#3E3833] font-normal border border-stone-100/90 group-hover:bg-[#FFF9F7] transition-colors">
                  {item.content}
                </div>

                {/* Action Button inside Card with tap animation */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectReview(item.content)}
                  className="w-full h-[44px] rounded-full bg-[#932115] text-white text-[14px] font-semibold flex items-center justify-center space-x-1 shadow-xs hover:bg-[#831D12] transition-all cursor-pointer"
                >
                  <span>选择此段评价并发布</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Action: Re-generate button */}
        <div className="pt-1 pb-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="w-full h-[46px] rounded-full bg-white border border-stone-300 text-[#5A534E] text-[13.5px] font-semibold flex items-center justify-center space-x-2 active:bg-stone-50 transition-colors shadow-2xs hover:border-[#932115]/40 hover:text-[#932115] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#932115] ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? '正在重新构思中...' : '换一批表达灵感'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
