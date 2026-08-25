import React from 'react';
import { ArrowRight, PenLine, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AdditionalMessageScreenProps {
  value: string;
  error?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onGenerate: () => void;
}

export const AdditionalMessageScreen: React.FC<AdditionalMessageScreenProps> = ({
  value,
  error,
  loading,
  onChange,
  onGenerate,
}) => (
  <div className="flex-1 flex flex-col justify-between px-5 pb-6 pt-5 bg-[#FAF8F5] select-none">
    <div className="w-full flex flex-col">
      <div className="text-center py-1 mb-3">
        <span className="text-[11px] text-[#A69E98] tracking-wider font-medium bg-stone-200/40 px-2.5 py-0.5 rounded-full">
          步骤三 · 补充真实感受
        </span>
      </div>

      <div className="flex items-start space-x-3.5 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF0EA] to-[#FAF0EB] text-[#932115] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-1 border border-[#F4DDD5] shadow-xs">
          李记
        </div>
        <div className="flex flex-1 flex-col space-y-2 max-w-[292px]">
          <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs text-[15px] text-[#2E2926] leading-relaxed shadow-2xs border border-stone-100 font-semibold">
            <h2 className="m-0 text-[15px] font-semibold">还有什么想特别说的？</h2>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs text-[14px] text-[#5A534E] leading-[1.65] shadow-2xs border border-stone-100">
            一句话也可以，AI 会保留您的真实语气。
          </div>
        </div>
      </div>

      <label className="relative block bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs">
        <PenLine className="absolute left-4 top-4 w-4 h-4 text-[#932115]" />
        <textarea
          aria-label="补充真实感受"
          value={value}
          maxLength={120}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例如：汤很鲜，店员还主动帮忙添了汤……"
          className="w-full h-[150px] resize-none border-0 outline-none bg-transparent pl-6 pb-6 text-[14px] leading-[1.75] text-[#2E2926] placeholder:text-stone-400"
        />
        <span className="absolute right-4 bottom-3 text-[11px] text-[#8E8680]">{value.length}/120</span>
      </label>

      <div className="mt-4 rounded-2xl border border-[#F4DDD5] bg-[#FAF0EB]/60 p-3 flex items-start gap-2.5 text-[12px] leading-relaxed text-[#784A3B]">
        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>味道、服务、环境或某个难忘细节都可以写；不补充也能继续。</span>
      </div>
      {error && <div role="alert" className="mt-3 rounded-xl bg-white border border-red-200 px-3 py-2 text-xs text-[#932115]">{error}</div>}
    </div>

    <motion.button
      whileTap={{ scale: loading ? 1 : 0.98 }}
      onClick={onGenerate}
      disabled={loading}
      className="w-full max-w-[312px] h-[52px] mx-auto rounded-full bg-[#932115] text-white flex items-center justify-center text-[15px] font-semibold tracking-wide shadow-md gap-1.5 disabled:opacity-60"
    >
      <span>{loading ? '正在提交…' : '生成我的评价'}</span>
      <ArrowRight className="w-4 h-4" />
    </motion.button>
  </div>
);
