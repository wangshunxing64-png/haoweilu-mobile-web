import React, { useState } from 'react';
import { PenLine, Check, CheckCircle2, Copy, Sparkles, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { copyText } from '../../../utils/clipboard';

interface CompletionScreenProps {
  selectedReview: string;
  selectedPlatform?: 'dianping' | 'meituan';
  claimReward: boolean;
  onToggleClaimReward: () => void;
  onOpenEditModal: () => void;
  onComplete: () => void;
  loading?: boolean;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  selectedReview,
  claimReward,
  onToggleClaimReward,
  onOpenEditModal,
  onComplete,
  loading,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const handleCopy = async () => {
    setCopyError('');
    try {
      await copyText(selectedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : '复制失败，请长按评价文字手动复制');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col justify-start px-5 pt-3 pb-8 bg-[#FAF8F5] select-none">
      {/* Top Section: Selected Review Card */}
      <div className="w-full">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/90 shadow-2xs flex flex-col space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8E8680] font-medium tracking-wide">
              您选择的评价
            </span>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-[12px] text-stone-600 hover:text-[#932115] transition-colors cursor-pointer px-2.5 py-0.5 rounded-full hover:bg-stone-50"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#932115]" />
                  <span className="font-semibold text-[#932115]">一键复制</span>
                </>
              )}
            </motion.button>
          </div>
          {copyError && <p role="alert" className="text-[11px] text-[#932115]">{copyError}</p>}

          <p className="text-[14px] font-medium text-[#2E2926] leading-relaxed">
            {selectedReview}
          </p>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={onOpenEditModal}
              className="inline-flex items-center space-x-1 text-[12px] text-[#932115] font-semibold hover:underline cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>点击可微调评价</span>
            </button>
            <span className="text-[11px] text-stone-400">轻触编辑</span>
          </div>
        </div>
      </div>

      {/* Centered Actions Section: Placed directly in the visual center below the review card */}
      <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 my-auto py-10">
        <div className="w-full flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            disabled={loading}
            className="w-full max-w-[312px] h-[52px] rounded-full bg-gradient-to-r from-[#9A2216] to-[#801B10] text-white flex items-center justify-center text-[15px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer space-x-1.5"
            style={{ boxShadow: '0 8px 20px rgba(147,33,21,0.22)' }}
          >
            <span>{loading ? '正在确认…' : '完成真实反馈'}</span>
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex items-center justify-center">
          <label
            onClick={onToggleClaimReward}
            className="flex items-center space-x-2 cursor-pointer select-none group bg-white/80 px-4 py-2 rounded-full border border-stone-200/80 shadow-2xs hover:bg-white transition-colors"
          >
            <motion.div
              animate={claimReward ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
              className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                claimReward
                  ? 'bg-[#932115] border-[#932115] text-white'
                  : 'border-stone-400 bg-white group-hover:border-stone-600'
              }`}
            >
              {claimReward && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </motion.div>
            <span className="text-xs text-[#5A534E] font-medium flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#932115]" />
              <span>完成真实用餐反馈领取感谢礼</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
