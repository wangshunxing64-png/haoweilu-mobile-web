import React from 'react';
import { Plus, Check, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DishItem } from '../../types';

interface DishSelectionScreenProps {
  dishes: DishItem[];
  selectedDishes: string[];
  onToggleDish: (dishId: string) => void;
  onNext: () => void;
}

export const DishSelectionScreen: React.FC<DishSelectionScreenProps> = ({
  dishes,
  selectedDishes,
  onToggleDish,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between px-5 pb-6 pt-5 bg-[#FAF8F5] select-none">
      <div className="w-full flex flex-col">
        {/* Timestamp */}
        <div className="text-center py-1 mb-3">
          <span className="text-[11px] text-[#A69E98] tracking-wider font-medium bg-stone-200/40 px-2.5 py-0.5 rounded-full">
            刚刚 · 智能就餐助手
          </span>
        </div>

        {/* AI Assistant Chat Stream */}
        <div className="flex items-start space-x-3.5">
          {/* Li Ji assistant avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF0EA] to-[#FAF0EB] text-[#932115] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-1 border border-[#F4DDD5] shadow-xs">
            李记
          </div>

          {/* Chat Bubbles */}
          <div className="flex flex-1 flex-col space-y-2 max-w-[292px]">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs text-[15px] text-[#2E2926] leading-relaxed shadow-2xs border border-stone-100 font-semibold">
              今天品尝了哪些美味？
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs text-[14px] text-[#5A534E] leading-[1.65] shadow-2xs border border-stone-100">
              最多选择 6 道，方便为您定制心里的真实评价。
            </div>
          </div>
        </div>

        {/* Selection Counter with dynamic badge */}
        <div className="flex items-center justify-between mt-6 mb-3 px-1">
          <span className="text-xs text-[#7F7671] font-medium flex items-center gap-1.5">
            <span>已选择</span>
            <strong className="text-[#932115] font-extrabold text-sm">
              {selectedDishes.length}
            </strong>
            <span>/ 6 道菜</span>
          </span>

          <AnimatePresence>
            {selectedDishes.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[11px] text-[#932115] bg-[#FAF0EB] border border-[#F4DDD5] px-2.5 py-0.5 rounded-full font-semibold shadow-2xs flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>已选好 {selectedDishes.length} 道</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* 2-Column Dish Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {dishes.map((dish) => {
            const isSelected = selectedDishes.includes(dish.id);
            return (
              <motion.button
                key={dish.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => onToggleDish(dish.id)}
                className={`relative min-h-[74px] flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 text-left cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#932115] shadow-xs bg-[#FFF7F5]'
                    : 'bg-white border border-stone-200/90 hover:border-stone-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-col pr-1 min-w-0">
                  <span className={`text-[15px] font-bold leading-tight truncate transition-colors ${
                    isSelected ? 'text-[#932115]' : 'text-[#2E2926]'
                  }`}>
                    {dish.name}
                  </span>
                  <span className="text-[12px] text-[#8E8681] mt-1.5 font-normal truncate">
                    {dish.desc}
                  </span>
                </div>

                {/* Selection Animated Icon */}
                <div className="flex-shrink-0 ml-1.5">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#932115] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200 transition-colors">
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky CTA Button */}
      <div className="w-full flex flex-col items-center mt-5 pt-1">
        <motion.button
          whileHover={{ scale: selectedDishes.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selectedDishes.length > 0 ? 0.98 : 1 }}
          onClick={onNext}
          disabled={selectedDishes.length === 0}
          className={`w-full max-w-[312px] h-[52px] rounded-full flex items-center justify-center text-[15px] font-semibold tracking-wide transition-all cursor-pointer shadow-xs gap-1.5 ${
            selectedDishes.length > 0
              ? 'bg-[#932115] text-white hover:bg-[#831D12] shadow-[#932115]/20 shadow-md'
              : 'bg-[#ECE5E0] text-[#A69E98] cursor-not-allowed opacity-80'
          }`}
        >
          <span>下一步：记录用餐感受</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
