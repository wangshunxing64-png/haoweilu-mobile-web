import React from 'react';
import { Award } from 'lucide-react';
import type { RewardRecord } from '../../types/api';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  reward?: RewardRecord;
}

export const RewardModal: React.FC<RewardModalProps> = ({ isOpen, onClose, onRestart, reward }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-[320px] bg-white rounded-3xl p-5 sm:p-6 shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200 border border-stone-100">
        {/* Badge Icon */}
        <div className="w-14 h-14 rounded-full bg-[#FAF0EB] text-[#932115] flex items-center justify-center mb-2.5 border border-[#F4DDD5] shadow-2xs">
          <Award className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h3 className="text-[17px] font-bold text-[#2E2926] tracking-tight">
          {reward ? '真实反馈完成，感谢礼已到账！' : '真实反馈已完成，感谢您的分享！'}
        </h3>
        <div className="mt-2 space-y-0.5 text-[12.5px] text-[#7F7671] leading-relaxed">
          <p>感谢您分享真实的用餐感受！</p>
          <p>{reward ? '已发放门店感谢礼。' : '您的反馈已安全提交。'}</p>
        </div>

        {/* Reward Coupon Ticket Card */}
        {reward && <div className="w-full bg-[#FAF8F5] rounded-2xl p-3 my-3.5 border border-stone-200/90 flex items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Amount Badge */}
            <div className="w-10 h-10 rounded-xl bg-[#932115] text-white flex items-center justify-center font-bold text-[14px] flex-shrink-0 shadow-2xs">
              礼
            </div>
            {/* Text details */}
            <div className="text-left min-w-0">
              <span className="text-[13px] font-bold text-[#2E2926] block leading-tight whitespace-nowrap">
                {reward.rewardType}
              </span>
              <span className="text-[11px] text-[#7F7671] block mt-0.5 whitespace-nowrap">
                权益码：{reward.code}
              </span>
            </div>
          </div>

          {/* Status Chip */}
          <span className="text-[11px] text-[#932115] font-semibold bg-[#FAF0EB] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 border border-[#F4DDD5]">
            已领取
          </span>
        </div>}

        {/* Action Button */}
        <div className="w-full">
          <button
            onClick={() => {
              onClose();
              onRestart();
            }}
            className="w-full h-[46px] rounded-full bg-[#932115] text-white text-[14.5px] font-semibold shadow-[0_4px_12px_rgba(147,33,21,0.18)] active:scale-[0.98] transition-all hover:bg-[#831D12] cursor-pointer"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};
