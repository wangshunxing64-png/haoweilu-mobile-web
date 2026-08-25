import React from 'react';
import { BowlIllustration } from '../BowlIllustration';
import { PenLine, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeScreenProps {
  onStart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between px-6 pt-7 pb-6 bg-[#FFFFFF] select-none relative overflow-hidden">
      {/* Subtle Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[#FAF0EB] blur-3xl pointer-events-none"
      />

      {/* Top Section with Hero and Typography */}
      <div className="w-full flex flex-col items-center z-10">
        {/* Hero Illustration Container with Gentle Hover Motion */}
        <div className="relative">
          <motion.div
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-[160px] h-[180px] bg-gradient-to-b from-[#FFF7F5] to-[#FDF0EB] rounded-3xl flex items-center justify-center relative overflow-hidden shadow-xs border border-[#FDE5DF]"
          >
            {/* Radial brand glow */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #932115 0%, transparent 70%)',
              }}
            />
            {/* Soft backdrop blur circle */}
            <div className="absolute w-24 h-24 bg-[#932115] rounded-full opacity-10 blur-xl pointer-events-none" />

            {/* Core Food 3D Mascot Avatar */}
            <div className="z-10 w-[140px] h-[155px] flex items-center justify-center p-1">
              <img
                src="/haoweilu_avatar.png"
                alt="好味录吉祥物头像"
                className="w-full h-full object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Typography Section - Optically Centered */}
        <div className="mt-7 w-full flex flex-col items-center justify-center text-center">
          {/* Main Title - Two-stage with perfect optical balance */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[26px] font-extrabold text-[#221F1D] tracking-[0.04em] leading-[1.3]">
              这顿饭
            </span>
            <div className="flex items-center justify-center text-[26px] font-extrabold text-[#221F1D] tracking-[0.02em] leading-[1.3]">
              <span>哪一口让你记住了</span>
              <span className="inline-block text-[#932115] font-black ml-0.5">？</span>
            </div>
          </div>

          {/* Subtitle */}
          <div className="mt-4 flex flex-col items-center justify-center text-[14px] text-[#7A726D] leading-[22px] font-normal">
            <span>分享您的真实用餐瞬间，</span>
            <span>智能助手为您整理成一句好表达。</span>
          </div>
        </div>
      </div>

      {/* CTA Button Section */}
      <div className="w-full flex flex-col items-center mt-auto pt-5 z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full max-w-[312px] h-[60px] bg-gradient-to-r from-[#9A2216] via-[#8E1F14] to-[#801B10] rounded-full flex items-center justify-center text-white text-[15.5px] font-bold tracking-wide space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
          style={{ boxShadow: '0 8px 20px rgba(147,33,21,0.24)' }}
        >
          {/* Shimmer light effect */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />

          <span>立即生成真实评价</span>
          <PenLine className="w-4 h-4 stroke-[2.4] -rotate-12 group-hover:rotate-0 transition-transform" />
        </motion.button>

        <div className="flex items-center gap-1.5 mt-3 text-[12px] text-[#8E8680]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>已有 12,841 名食客在此获得灵感</span>
        </div>
      </div>
    </div>
  );
};



